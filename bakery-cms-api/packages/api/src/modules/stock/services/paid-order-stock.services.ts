/**
 * Paid order stock service
 * Automatically deducts stock materials when an order transitions to PAID
 */

import { Result, ok, err } from 'neverthrow';
import {
  AppError,
  MovementType,
  ProductType,
  SaleUnitType,
} from '@bakery-cms/common';
import {
  BrandModel,
  OrderItemModel,
  OrderModel,
  ProductComboItemModel,
  ProductModel,
  ProductStockItemModel,
  StockItemBrandModel,
  StockItemModel,
  StockMovementModel,
} from '@bakery-cms/database';
import { Op, Transaction } from 'sequelize';
import {
  createBusinessRuleError,
  createDatabaseError,
  createInvalidInputError,
  createNotFoundError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

const ORDER_REFERENCE_TYPE = 'order';

type OrderItemWithRelations = OrderItemModel & {
  product?: ProductWithComboItems;
};

type ProductWithComboItems = ProductModel & {
  comboItems?: ComboItemWithProduct[];
};

type ComboItemWithProduct = ProductComboItemModel & {
  itemProduct?: ProductModel;
};

type RecipeItemWithRelations = ProductStockItemModel & {
  stockItem?: StockItemModel;
  preferredBrand?: BrandModel;
};

type ProductDemand = {
  productId: string;
  saleUnitType: SaleUnitType;
  orderedQuantity: number;
};

type StockUsageDemand = {
  stockItemId: string;
  brandId: string;
  stockItemName: string;
  brandName: string | null;
  requiredQuantity: number;
  sourceProductIds: string[];
};

type PaidOrderStockServiceResult = {
  executed: boolean;
  movementCount: number;
};

export interface PaidOrderStockService {
  consumeStockForPaidOrder(
    orderId: string,
    actorUserId: string
  ): Promise<Result<PaidOrderStockServiceResult, AppError>>;
}

export interface PaidOrderStockServiceDependencies {
  orderModel: typeof OrderModel;
  orderItemModel: typeof OrderItemModel;
  productModel: typeof ProductModel;
  productComboItemModel: typeof ProductComboItemModel;
  productStockItemModel: typeof ProductStockItemModel;
  stockItemModel: typeof StockItemModel;
  stockItemBrandModel: typeof StockItemBrandModel;
  stockMovementModel: typeof StockMovementModel;
}

const toQuantity = (value: number): number => Math.round(value * 1000) / 1000;

const normalizePositiveQuantity = (
  value: number,
  context: string
): Result<number, AppError> => {
  const numericValue = Number(value);
  const normalizedValue = toQuantity(numericValue);

  if (!Number.isFinite(numericValue) || normalizedValue <= 0) {
    return err(createInvalidInputError(`${context} must be a positive number`));
  }

  return ok(normalizedValue);
};

const isAppError = (value: unknown): value is AppError => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeError = value as Partial<AppError>;
  return (
    typeof maybeError.code === 'string' &&
    typeof maybeError.message === 'string' &&
    typeof maybeError.statusCode === 'number'
  );
};

const getRecipeMultiplier = (
  orderedQuantity: number,
  saleUnitType: SaleUnitType
): number => {
  if (saleUnitType === SaleUnitType.WEIGHT) {
    // Weight order quantity is stored in gram, and recipe base unit is 1g.
    return orderedQuantity;
  }

  return orderedQuantity;
};

const pushProductDemand = (
  target: Map<string, ProductDemand>,
  productId: string,
  saleUnitType: SaleUnitType,
  orderedQuantity: number
): void => {
  const normalizedQuantity = toQuantity(orderedQuantity);
  if (normalizedQuantity <= 0) {
    return;
  }

  const key = `${productId}:${saleUnitType}`;
  const existing = target.get(key);

  if (!existing) {
    target.set(key, {
      productId,
      saleUnitType,
      orderedQuantity: normalizedQuantity,
    });
    return;
  }

  existing.orderedQuantity = toQuantity(existing.orderedQuantity + normalizedQuantity);
};

const expandOrderItemsToProductDemand = (
  orderItems: OrderItemWithRelations[]
): Result<ProductDemand[], AppError> => {
  const demandByProduct = new Map<string, ProductDemand>();

  for (const orderItem of orderItems) {
    const product = orderItem.product;
    if (!product) {
      return err(
        createNotFoundError('Product linked to order item', orderItem.productId)
      );
    }

    const orderedQuantityResult = normalizePositiveQuantity(
      Number(orderItem.quantity),
      `Order item quantity for product ${product.id}`
    );
    if (orderedQuantityResult.isErr()) {
      return err(orderedQuantityResult.error);
    }
    const orderedQuantity = orderedQuantityResult.value;

    const productType =
      (product.productType as ProductType | undefined) ?? ProductType.SINGLE;

    if (productType === ProductType.COMBO) {
      const comboItems = product.comboItems ?? [];

      for (const comboItem of comboItems) {
        const childProduct = comboItem.itemProduct;
        if (!childProduct) {
          return err(
            createNotFoundError(
              'Combo child product',
              String(comboItem.itemProductId)
            )
          );
        }

        const childProductType =
          (childProduct.productType as ProductType | undefined) ?? ProductType.SINGLE;

        if (childProductType === ProductType.COMBO) {
          return err(
            createBusinessRuleError(
              `Nested combo is not supported: ${childProduct.id}`
            )
          );
        }

        const comboQuantityResult = normalizePositiveQuantity(
          Number(comboItem.quantity),
          `Combo item quantity for combo ${product.id} and child ${childProduct.id}`
        );
        if (comboQuantityResult.isErr()) {
          return err(comboQuantityResult.error);
        }
        const comboQuantity = comboQuantityResult.value;
        const childDemand = toQuantity(orderedQuantity * comboQuantity);

        const childSaleUnitType =
          (childProduct.saleUnitType as SaleUnitType | undefined) ??
          SaleUnitType.PIECE;

        pushProductDemand(
          demandByProduct,
          childProduct.id,
          childSaleUnitType,
          childDemand
        );
      }

      continue;
    }

    const saleUnitType =
      (orderItem.saleUnitType as SaleUnitType | undefined) ??
      ((product.saleUnitType as SaleUnitType | undefined) ?? SaleUnitType.PIECE);

    pushProductDemand(
      demandByProduct,
      product.id,
      saleUnitType,
      orderedQuantity
    );
  }

  return ok(Array.from(demandByProduct.values()));
};

const ensurePreferredBrandLinks = async (
  stockItemBrandModel: typeof StockItemBrandModel,
  pairs: Array<{ stockItemId: string; brandId: string }>,
  transaction?: Transaction
): Promise<Result<Set<string>, AppError>> => {
  if (pairs.length === 0) {
    return ok(new Set<string>());
  }

  const uniquePairs = Array.from(
    new Map(
      pairs.map((pair) => [`${pair.stockItemId}:${pair.brandId}`, pair])
    ).values()
  );

  const existingLinks = await stockItemBrandModel.findAll({
    where: {
      [Op.or]: uniquePairs.map((pair) => ({
        stockItemId: pair.stockItemId,
        brandId: pair.brandId,
      })),
    },
    attributes: ['stockItemId', 'brandId'],
    transaction,
  });

  const existingPairSet = new Set<string>(
    existingLinks.map((link) => `${link.stockItemId}:${link.brandId}`)
  );

  for (const pair of uniquePairs) {
    const pairKey = `${pair.stockItemId}:${pair.brandId}`;
    if (!existingPairSet.has(pairKey)) {
      return err(
        createInvalidInputError(
          `Preferred brand is invalid for stock item: ${pair.stockItemId}`
        )
      );
    }
  }

  return ok(existingPairSet);
};

const buildStockUsageDemand = async (
  productDemand: ProductDemand[],
  productStockItemModel: typeof ProductStockItemModel,
  stockItemBrandModel: typeof StockItemBrandModel,
  transaction?: Transaction
): Promise<Result<StockUsageDemand[], AppError>> => {
  if (productDemand.length === 0) {
    return ok([]);
  }

  const productIds = Array.from(
    new Set(productDemand.map((item) => item.productId))
  );

  const recipeRows = (await productStockItemModel.findAll({
    where: {
      productId: productIds,
    },
    include: [
      {
        model: StockItemModel,
        as: 'stockItem',
        attributes: ['id', 'name'],
      },
      {
        model: BrandModel,
        as: 'preferredBrand',
        attributes: ['id', 'name'],
      },
    ],
    transaction,
  })) as RecipeItemWithRelations[];

  const recipeByProductId = new Map<string, RecipeItemWithRelations[]>();
  for (const recipeRow of recipeRows) {
    const bucket = recipeByProductId.get(recipeRow.productId);
    if (!bucket) {
      recipeByProductId.set(recipeRow.productId, [recipeRow]);
      continue;
    }

    bucket.push(recipeRow);
  }

  const requiredBrandPairs: Array<{ stockItemId: string; brandId: string }> = [];

  for (const demand of productDemand) {
    const recipes = recipeByProductId.get(demand.productId) ?? [];

    for (const recipe of recipes) {
      if (!recipe.preferredBrandId) {
        return err(
          createBusinessRuleError(
            `Missing preferred brand for product recipe: ${demand.productId}/${recipe.stockItemId}`
          )
        );
      }

      requiredBrandPairs.push({
        stockItemId: recipe.stockItemId,
        brandId: recipe.preferredBrandId,
      });
    }
  }

  const brandValidationResult = await ensurePreferredBrandLinks(
    stockItemBrandModel,
    requiredBrandPairs,
    transaction
  );

  if (brandValidationResult.isErr()) {
    return err(brandValidationResult.error);
  }

  const usageByStockBrand = new Map<string, StockUsageDemand>();

  for (const demand of productDemand) {
    const recipes = recipeByProductId.get(demand.productId) ?? [];

    for (const recipe of recipes) {
      if (!recipe.preferredBrandId) {
        return err(
          createBusinessRuleError(
            `Missing preferred brand for product recipe: ${demand.productId}/${recipe.stockItemId}`
          )
        );
      }

      const recipeQuantityResult = normalizePositiveQuantity(
        Number(recipe.quantity),
        `Recipe quantity for product ${demand.productId} and stock item ${recipe.stockItemId}`
      );
      if (recipeQuantityResult.isErr()) {
        return err(recipeQuantityResult.error);
      }
      const recipeQuantity = recipeQuantityResult.value;

      const requiredQuantity = toQuantity(
        recipeQuantity *
          getRecipeMultiplier(demand.orderedQuantity, demand.saleUnitType)
      );

      if (!Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
        return err(
          createInvalidInputError(
            `Calculated stock usage is invalid for product ${demand.productId} and stock item ${recipe.stockItemId}`
          )
        );
      }

      const key = `${recipe.stockItemId}:${recipe.preferredBrandId}`;
      const existing = usageByStockBrand.get(key);

      if (!existing) {
        usageByStockBrand.set(key, {
          stockItemId: recipe.stockItemId,
          brandId: recipe.preferredBrandId,
          stockItemName: recipe.stockItem?.name ?? recipe.stockItemId,
          brandName: recipe.preferredBrand?.name ?? null,
          requiredQuantity,
          sourceProductIds: [demand.productId],
        });
        continue;
      }

      existing.requiredQuantity = toQuantity(
        existing.requiredQuantity + requiredQuantity
      );
      if (!existing.sourceProductIds.includes(demand.productId)) {
        existing.sourceProductIds.push(demand.productId);
      }
    }
  }

  return ok(Array.from(usageByStockBrand.values()));
};

/**
 * Create paid order stock service
 */
export const createPaidOrderStockService = (
  deps: PaidOrderStockServiceDependencies
): PaidOrderStockService => {
  const {
    orderModel,
    orderItemModel,
    productModel,
    productComboItemModel,
    productStockItemModel,
    stockItemModel,
    stockItemBrandModel,
    stockMovementModel,
  } = deps;

  const consumeStockForPaidOrder = async (
    orderId: string,
    actorUserId: string
  ): Promise<Result<PaidOrderStockServiceResult, AppError>> => {
    try {
      const sequelize = stockMovementModel.sequelize;
      if (!sequelize) {
        return err(
          createDatabaseError('Database connection is not available for stock deduction')
        );
      }

      const result = await sequelize.transaction(async (transaction) => {
        const existingMovementCount = await stockMovementModel.count({
          where: {
            type: MovementType.USED,
            referenceType: ORDER_REFERENCE_TYPE,
            referenceId: orderId,
          },
          transaction,
        });

        if (existingMovementCount > 0) {
          logger.info('Skip paid-order stock deduction because it was already processed', {
            orderId,
            existingMovementCount,
          });

          return {
            executed: false,
            movementCount: 0,
          };
        }

        const order = await orderModel.findByPk(orderId, {
          include: [
            {
              model: orderItemModel,
              as: 'items',
              attributes: ['id', 'orderId', 'productId', 'saleUnitType', 'quantity'],
              include: [
                {
                  model: productModel,
                  as: 'product',
                  attributes: ['id', 'name', 'saleUnitType', 'productType'],
                  include: [
                    {
                      model: productComboItemModel,
                      as: 'comboItems',
                      attributes: ['id', 'comboProductId', 'itemProductId', 'quantity'],
                      include: [
                        {
                          model: productModel,
                          as: 'itemProduct',
                          attributes: ['id', 'name', 'saleUnitType', 'productType'],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          transaction,
        });

        if (!order) {
          throw createNotFoundError('Order', orderId);
        }

        const orderItems =
          ((order as unknown as { items?: OrderItemWithRelations[] }).items as
            | OrderItemWithRelations[]
            | undefined) ?? [];

        if (orderItems.length === 0) {
          return {
            executed: true,
            movementCount: 0,
          };
        }

        const productDemandResult = expandOrderItemsToProductDemand(orderItems);
        if (productDemandResult.isErr()) {
          throw productDemandResult.error;
        }

        const usageDemandResult = await buildStockUsageDemand(
          productDemandResult.value,
          productStockItemModel,
          stockItemBrandModel,
          transaction
        );

        if (usageDemandResult.isErr()) {
          throw usageDemandResult.error;
        }

        const usageDemand = usageDemandResult.value;
        if (usageDemand.length === 0) {
          return {
            executed: true,
            movementCount: 0,
          };
        }

        const stockItemIds = usageDemand.map((item) => item.stockItemId);
        const stockItems = await stockItemModel.findAll({
          where: {
            id: {
              [Op.in]: stockItemIds,
            },
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        const stockItemById = new Map<string, StockItemModel>();
        for (const stockItem of stockItems) {
          stockItemById.set(stockItem.id, stockItem);
        }

        let movementCount = 0;

        for (const demand of usageDemand) {
          const stockItem = stockItemById.get(demand.stockItemId);
          if (!stockItem) {
            throw createNotFoundError('Stock item', demand.stockItemId);
          }

          const requiredQuantityResult = normalizePositiveQuantity(
            demand.requiredQuantity,
            `Required stock quantity for item ${demand.stockItemId}`
          );
          if (requiredQuantityResult.isErr()) {
            throw requiredQuantityResult.error;
          }
          const requiredQuantity = requiredQuantityResult.value;

          const previousQuantity = Number(stockItem.currentQuantity);
          const newQuantity = toQuantity(previousQuantity - requiredQuantity);

          if (newQuantity < 0) {
            logger.warn('Paid-order deduction resulted in negative stock quantity', {
              orderId,
              actorUserId,
              stockItemId: demand.stockItemId,
              requiredQuantity,
              previousQuantity,
              newQuantity,
              sourceProductIds: demand.sourceProductIds,
            });
          }

          await stockItem.update(
            {
              currentQuantity: newQuantity,
            },
            {
              transaction,
            }
          );

          await stockMovementModel.create(
            {
              stockItemId: demand.stockItemId,
              brandId: demand.brandId,
              type: MovementType.USED,
              quantity: -requiredQuantity,
              previousQuantity,
              newQuantity,
              reason: `Auto stock deduction for paid order ${orderId}`,
              referenceType: ORDER_REFERENCE_TYPE,
              referenceId: orderId,
              userId: actorUserId,
            },
            {
              transaction,
            }
          );

          movementCount += 1;
        }

        logger.info('Paid-order stock deduction completed', {
          orderId,
          actorUserId,
          movementCount,
          stockUsage: usageDemand.map((item) => ({
            stockItemId: item.stockItemId,
            stockItemName: item.stockItemName,
            brandId: item.brandId,
            brandName: item.brandName,
            requiredQuantity: item.requiredQuantity,
            sourceProductIds: item.sourceProductIds,
          })),
        });

        return {
          executed: true,
          movementCount,
        };
      });

      return ok(result);
    } catch (error) {
      if (isAppError(error)) {
        return err(error);
      }

      logger.error('Failed to consume stock for paid order', {
        error,
        orderId,
        actorUserId,
      });
      return err(createDatabaseError('Failed to consume stock for paid order', error));
    }
  };

  return {
    consumeStockForPaidOrder,
  };
};

export const __internalPaidOrderStockUtils = {
  expandOrderItemsToProductDemand,
  buildStockUsageDemand,
  getRecipeMultiplier,
  toQuantity,
};
