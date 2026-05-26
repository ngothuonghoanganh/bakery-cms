/**
 * Paid order stock service
 * Automatically deducts stock materials when an order transitions to PAID
 */

import { Result, ok, err } from 'neverthrow';
import {
  AppError,
  CostingMethod,
  MovementType,
  ProductType,
  RecipeStatus,
  RecipeVersionStatus,
  SaleUnitType,
} from '@bakery-cms/common';
import {
  BrandModel,
  OrderItemModel,
  OrderModel,
  ProductComboItemModel,
  ProductModel,
  ProductStockItemModel,
  RecipeModel,
  RecipeVersionItemModel,
  RecipeVersionModel,
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

type LegacyRecipeItemWithRelations = ProductStockItemModel & {
  stockItem?: StockItemModel;
  preferredBrand?: BrandModel;
};

type RecipeVersionItemWithRelations = RecipeVersionItemModel & {
  stockItem?: StockItemModel;
  preferredBrand?: BrandModel;
};

type ProductDemand = {
  productId: string;
  saleUnitType: SaleUnitType;
  saleQuantityBase: number;
  recipeVersionId: string | null;
  sourceProductIds: string[];
};

type StockUsageDemand = {
  stockItemId: string;
  brandId: string | null;
  stockItemName: string;
  brandName: string | null;
  requiredQuantityBase: number;
  unitCostSnapshot: number;
  totalCostSnapshot: number;
  costingMethod: CostingMethod;
  sourceProductIds: string[];
};

type PaidOrderStockServiceResult = {
  executed: boolean;
  movementCount: number;
};

type UnitCostResolution = {
  brandId: string | null;
  brandName: string | null;
  unitCostSnapshot: number;
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
  recipeModel: typeof RecipeModel;
  recipeVersionModel: typeof RecipeVersionModel;
  recipeVersionItemModel: typeof RecipeVersionItemModel;
  stockItemModel: typeof StockItemModel;
  stockItemBrandModel: typeof StockItemBrandModel;
  stockMovementModel: typeof StockMovementModel;
}

const toQuantity = (value: number): number => Math.round(value * 1000) / 1000;
const toMoney = (value: number): number => Math.round(value * 10000) / 10000;

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

const pushProductDemand = (
  target: Map<string, ProductDemand>,
  productId: string,
  saleUnitType: SaleUnitType,
  saleQuantityBase: number,
  recipeVersionId: string | null
): void => {
  const normalizedQuantity = toQuantity(saleQuantityBase);
  if (normalizedQuantity <= 0) {
    return;
  }

  const key = `${productId}:${saleUnitType}:${recipeVersionId ?? 'default'}`;
  const existing = target.get(key);

  if (!existing) {
    target.set(key, {
      productId,
      saleUnitType,
      saleQuantityBase: normalizedQuantity,
      recipeVersionId,
      sourceProductIds: [productId],
    });
    return;
  }

  existing.saleQuantityBase = toQuantity(
    existing.saleQuantityBase + normalizedQuantity
  );
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

    const orderedBaseQuantityResult = normalizePositiveQuantity(
      Number((orderItem as any).saleQuantityBase ?? orderItem.quantity),
      `Order item saleQuantityBase for product ${product.id}`
    );
    if (orderedBaseQuantityResult.isErr()) {
      return err(orderedBaseQuantityResult.error);
    }
    const orderedBaseQuantity = orderedBaseQuantityResult.value;

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

        const childDemandBaseQuantity = toQuantity(
          orderedBaseQuantity * comboQuantity
        );
        const childSaleUnitType =
          (childProduct.saleUnitType as SaleUnitType | undefined) ??
          SaleUnitType.PIECE;

        pushProductDemand(
          demandByProduct,
          childProduct.id,
          childSaleUnitType,
          childDemandBaseQuantity,
          null
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
      orderedBaseQuantity,
      ((orderItem as any).recipeVersionId as string | null) ?? null
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

const resolveUnitCost = async (
  stockItemBrandModel: typeof StockItemBrandModel,
  stockItemId: string,
  preferredBrandId: string | null,
  transaction?: Transaction,
  preferredBrandName: string | null = null
): Promise<Result<UnitCostResolution, AppError>> => {
  if (preferredBrandId) {
    const preferredBrand = await stockItemBrandModel.findOne({
      where: {
        stockItemId,
        brandId: preferredBrandId,
      },
      include: [
        {
          model: BrandModel,
          as: 'brand',
          attributes: ['id', 'name'],
        },
      ],
      transaction,
    });

    if (!preferredBrand) {
      return err(
        createInvalidInputError(
          `Preferred brand is invalid for stock item: ${stockItemId}`
        )
      );
    }

    return ok({
      brandId: preferredBrandId,
      brandName: (preferredBrand as any).brand?.name ?? preferredBrandName ?? null,
      unitCostSnapshot: Number(preferredBrand.unitPriceAfterTax),
    });
  }

  const lowestBrand = await stockItemBrandModel.findOne({
    where: {
      stockItemId,
    },
    include: [
      {
        model: BrandModel,
        as: 'brand',
        attributes: ['id', 'name'],
      },
    ],
    order: [['unitPriceAfterTax', 'ASC']],
    transaction,
  });

  if (!lowestBrand) {
    return ok({
      brandId: null,
      brandName: null,
      unitCostSnapshot: 0,
    });
  }

  return ok({
    brandId: lowestBrand.brandId,
    brandName: (lowestBrand as any).brand?.name ?? null,
    unitCostSnapshot: Number(lowestBrand.unitPriceAfterTax),
  });
};

const resolveRecipeVersionForDemand = async (
  demand: ProductDemand,
  recipeModel: typeof RecipeModel,
  recipeVersionModel: typeof RecipeVersionModel,
  transaction?: Transaction
): Promise<(RecipeVersionModel & { recipe?: RecipeModel }) | null> => {
  if (demand.recipeVersionId) {
    return (await recipeVersionModel.findOne({
      where: {
        id: demand.recipeVersionId,
      },
      include: [
        {
          model: recipeModel,
          as: 'recipe',
          required: true,
          where: {
            productId: demand.productId,
          },
        },
      ],
      transaction,
    })) as RecipeVersionModel & { recipe?: RecipeModel } | null;
  }

  return (await recipeVersionModel.findOne({
    where: {
      status: RecipeVersionStatus.ACTIVE,
    },
    include: [
      {
        model: recipeModel,
        as: 'recipe',
        required: true,
        where: {
          productId: demand.productId,
          isDefault: true,
          status: RecipeStatus.ACTIVE,
        },
      },
    ],
    order: [['versionNumber', 'DESC']],
    transaction,
  })) as RecipeVersionModel & { recipe?: RecipeModel } | null;
};

const buildStockUsageDemand = async (
  productDemand: ProductDemand[],
  productStockItemModel: typeof ProductStockItemModel,
  recipeModel: typeof RecipeModel,
  recipeVersionModel: typeof RecipeVersionModel,
  recipeVersionItemModel: typeof RecipeVersionItemModel,
  stockItemBrandModel: typeof StockItemBrandModel,
  transaction?: Transaction
): Promise<Result<StockUsageDemand[], AppError>> => {
  if (productDemand.length === 0) {
    return ok([]);
  }

  const usageByStockBrand = new Map<string, StockUsageDemand>();
  const requiredBrandPairs: Array<{ stockItemId: string; brandId: string }> = [];

  for (const demand of productDemand) {
    const resolvedVersion = await resolveRecipeVersionForDemand(
      demand,
      recipeModel,
      recipeVersionModel,
      transaction
    );

    let recipeItems: Array<{
      stockItemId: string;
      stockItemName: string;
      baseQuantity: number;
      preferredBrandId: string | null;
      preferredBrandName: string | null;
      wastePercent: number;
      yieldBaseQuantity: number;
      source: 'recipe_version' | 'legacy_product_stock';
    }> = [];

    if (resolvedVersion) {
      const versionItems = (await recipeVersionItemModel.findAll({
        where: {
          recipeVersionId: resolvedVersion.id,
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
      })) as RecipeVersionItemWithRelations[];

      recipeItems = versionItems.map((item) => ({
        stockItemId: item.stockItemId,
        stockItemName: item.stockItem?.name ?? item.stockItemId,
        baseQuantity: Number(item.baseQuantity),
        preferredBrandId: item.preferredBrandId,
        preferredBrandName: item.preferredBrand?.name ?? null,
        wastePercent: Number(item.wastePercent ?? 0),
        yieldBaseQuantity: Number(resolvedVersion.yieldBaseQuantity),
        source: 'recipe_version',
      }));
    } else {
      const legacyRows = (await productStockItemModel.findAll({
        where: {
          productId: demand.productId,
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
      })) as LegacyRecipeItemWithRelations[];

      if (legacyRows.length === 0) {
        logger.warn(
          'Skip stock deduction for product because no recipe version and no legacy recipe',
          {
            productId: demand.productId,
            recipeVersionId: demand.recipeVersionId,
          }
        );
        continue;
      }

      recipeItems = legacyRows.map((item) => ({
        stockItemId: item.stockItemId,
        stockItemName: item.stockItem?.name ?? item.stockItemId,
        baseQuantity: Number(item.quantity),
        preferredBrandId: item.preferredBrandId,
        preferredBrandName: item.preferredBrand?.name ?? null,
        wastePercent: 0,
        yieldBaseQuantity: 1,
        source: 'legacy_product_stock',
      }));
    }

    for (const recipeItem of recipeItems) {
      const recipeQuantityResult = normalizePositiveQuantity(
        Number(recipeItem.baseQuantity),
        `Recipe base quantity for product ${demand.productId} and stock item ${recipeItem.stockItemId}`
      );
      if (recipeQuantityResult.isErr()) {
        return err(recipeQuantityResult.error);
      }

      const yieldBaseQuantityResult = normalizePositiveQuantity(
        Number(recipeItem.yieldBaseQuantity),
        `Recipe yieldBaseQuantity for product ${demand.productId}`
      );
      if (yieldBaseQuantityResult.isErr()) {
        return err(yieldBaseQuantityResult.error);
      }

      const requiredQuantityBase = toQuantity(
        recipeQuantityResult.value *
          (demand.saleQuantityBase / yieldBaseQuantityResult.value) *
          (1 + Number(recipeItem.wastePercent) / 100)
      );

      if (!Number.isFinite(requiredQuantityBase) || requiredQuantityBase <= 0) {
        return err(
          createInvalidInputError(
            `Calculated stock usage is invalid for product ${demand.productId} and stock item ${recipeItem.stockItemId}`
          )
        );
      }

      if (recipeItem.preferredBrandId) {
        requiredBrandPairs.push({
          stockItemId: recipeItem.stockItemId,
          brandId: recipeItem.preferredBrandId,
        });
      }

      const unitCostResult = await resolveUnitCost(
        stockItemBrandModel,
        recipeItem.stockItemId,
        recipeItem.preferredBrandId,
        transaction,
        recipeItem.preferredBrandName
      );
      if (unitCostResult.isErr()) {
        return err(unitCostResult.error);
      }

      const unitCostSnapshot = toMoney(unitCostResult.value.unitCostSnapshot);
      const totalCostSnapshot = toMoney(requiredQuantityBase * unitCostSnapshot);
      const key = `${recipeItem.stockItemId}:${unitCostResult.value.brandId ?? 'none'}`;
      const existing = usageByStockBrand.get(key);

      if (!existing) {
        usageByStockBrand.set(key, {
          stockItemId: recipeItem.stockItemId,
          brandId: unitCostResult.value.brandId,
          stockItemName: recipeItem.stockItemName,
          brandName: unitCostResult.value.brandName,
          requiredQuantityBase,
          unitCostSnapshot,
          totalCostSnapshot,
          costingMethod: CostingMethod.PREFERRED_BRAND_PRICE,
          sourceProductIds: [demand.productId],
        });
        continue;
      }

      existing.requiredQuantityBase = toQuantity(
        existing.requiredQuantityBase + requiredQuantityBase
      );
      existing.totalCostSnapshot = toMoney(
        existing.totalCostSnapshot + totalCostSnapshot
      );
      existing.unitCostSnapshot =
        existing.requiredQuantityBase > 0
          ? toMoney(existing.totalCostSnapshot / existing.requiredQuantityBase)
          : 0;
      if (!existing.sourceProductIds.includes(demand.productId)) {
        existing.sourceProductIds.push(demand.productId);
      }
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
    recipeModel,
    recipeVersionModel,
    recipeVersionItemModel,
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
              attributes: [
                'id',
                'orderId',
                'productId',
                'saleUnitType',
                'quantity',
                'saleQuantityBase',
                'recipeVersionId',
              ],
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
          recipeModel,
          recipeVersionModel,
          recipeVersionItemModel,
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
            demand.requiredQuantityBase,
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
              unitCostSnapshot: demand.unitCostSnapshot,
              totalCostSnapshot: demand.totalCostSnapshot,
              costingMethod: demand.costingMethod,
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
            requiredQuantityBase: item.requiredQuantityBase,
            unitCostSnapshot: item.unitCostSnapshot,
            totalCostSnapshot: item.totalCostSnapshot,
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
  toQuantity,
};
