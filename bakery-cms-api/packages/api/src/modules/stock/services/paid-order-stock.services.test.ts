import {
  CostingMethod,
  ProductType,
  RecipeStatus,
  RecipeVersionStatus,
  SaleUnitType,
} from '@bakery-cms/common';
import {
  __internalPaidOrderStockUtils,
  createPaidOrderStockService,
} from './paid-order-stock.services';

type BrandPrice = {
  unitPriceAfterTax: number;
  brandName?: string;
};

const createStockItemBrandModelMock = (
  prices: Record<string, Record<string, BrandPrice>>
): any => ({
  findOne: jest.fn().mockImplementation(({ where }: any) => {
    const stockItemId = String(where.stockItemId);
    const brandId = where.brandId ? String(where.brandId) : undefined;
    const stockPrices = prices[stockItemId] ?? {};

    if (!brandId) {
      const sorted = Object.entries(stockPrices).sort(
        (a, b) => a[1].unitPriceAfterTax - b[1].unitPriceAfterTax
      );
      if (sorted.length === 0) {
        return null;
      }
      const [lowestBrandId, value] = sorted[0]!;
      return {
        stockItemId,
        brandId: lowestBrandId,
        unitPriceAfterTax: value.unitPriceAfterTax,
        brand: {
          id: lowestBrandId,
          name: value.brandName ?? lowestBrandId,
        },
      };
    }

    const value = stockPrices[brandId];
    if (!value) {
      return null;
    }
    return {
      stockItemId,
      brandId,
      unitPriceAfterTax: value.unitPriceAfterTax,
      brand: {
        id: brandId,
        name: value.brandName ?? brandId,
      },
    };
  }),
  findAll: jest.fn().mockImplementation(({ where }: any) => {
    const pairs = Array.isArray(where?.or)
      ? where.or
      : Array.isArray(where?.[Symbol.for('sequelize.or')])
        ? where[Symbol.for('sequelize.or')]
        : Array.isArray(where?.[Object.getOwnPropertySymbols(where)[0] as symbol])
          ? where[Object.getOwnPropertySymbols(where)[0] as symbol]
          : [];

    if (Array.isArray(pairs) && pairs.length > 0) {
      return pairs
        .map((pair) => {
          const stockItemId = String(pair.stockItemId);
          const brandId = String(pair.brandId);
          const exists = Boolean(prices[stockItemId]?.[brandId]);
          if (!exists) {
            return null;
          }
          return { stockItemId, brandId };
        })
        .filter((row) => row !== null);
    }

    const stockItemId = where?.stockItemId ? String(where.stockItemId) : '';
    const stockPrices = prices[stockItemId] ?? {};
    return Object.entries(stockPrices).map(([brandId, value]) => ({
      stockItemId,
      brandId,
      unitPriceAfterTax: value.unitPriceAfterTax,
    }));
  }),
});

describe('paid-order-stock.services', () => {
  describe('expandOrderItemsToProductDemand', () => {
    it('expands combo children and keeps base quantity', () => {
      const result = __internalPaidOrderStockUtils.expandOrderItemsToProductDemand([
        {
          productId: 'combo-1',
          quantity: 3,
          saleQuantityBase: 3,
          saleUnitType: SaleUnitType.PIECE,
          product: {
            id: 'combo-1',
            productType: ProductType.COMBO,
            comboItems: [
              {
                quantity: 2,
                itemProduct: {
                  id: 'child-piece',
                  productType: ProductType.SINGLE,
                  saleUnitType: SaleUnitType.PIECE,
                },
              },
            ],
          },
        },
      ] as any);

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toMatchObject({
        productId: 'child-piece',
        saleUnitType: SaleUnitType.PIECE,
        saleQuantityBase: 6,
      });
    });

    it('rejects nested combo', () => {
      const result = __internalPaidOrderStockUtils.expandOrderItemsToProductDemand([
        {
          productId: 'combo-parent',
          quantity: 1,
          saleUnitType: SaleUnitType.PIECE,
          product: {
            id: 'combo-parent',
            productType: ProductType.COMBO,
            comboItems: [
              {
                quantity: 1,
                itemProduct: {
                  id: 'combo-child',
                  productType: ProductType.COMBO,
                  saleUnitType: SaleUnitType.PIECE,
                },
              },
            ],
          },
        },
      ] as any);

      expect(result.isErr()).toBe(true);
      if (result.isOk()) {
        return;
      }
      expect(result.error.message).toContain('Nested combo is not supported');
    });
  });

  describe('buildStockUsageDemand', () => {
    const productStockItemModel = {
      findAll: jest.fn().mockResolvedValue([]),
    } as any;

    it('calculates piece demand and cost snapshot from recipe version', async () => {
      const recipeVersionModel = {
        findOne: jest.fn().mockResolvedValue({
          id: 'rv-1',
          yieldBaseQuantity: 1,
          status: RecipeVersionStatus.ACTIVE,
          recipe: {
            id: 'recipe-1',
            productId: 'product-1',
            status: RecipeStatus.ACTIVE,
            isDefault: true,
          },
        }),
      } as any;

      const recipeVersionItemModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            id: 'rvi-1',
            recipeVersionId: 'rv-1',
            stockItemId: 'stock-1',
            baseQuantity: 3,
            wastePercent: 0,
            preferredBrandId: 'brand-1',
            stockItem: {
              id: 'stock-1',
              name: 'Flour',
            },
            preferredBrand: {
              id: 'brand-1',
              name: 'Brand 1',
            },
          },
        ]),
      } as any;

      const stockItemBrandModel = createStockItemBrandModelMock({
        'stock-1': {
          'brand-1': {
            unitPriceAfterTax: 4,
            brandName: 'Brand 1',
          },
        },
      });

      const result = await __internalPaidOrderStockUtils.buildStockUsageDemand(
        [
          {
            productId: 'product-1',
            saleUnitType: SaleUnitType.PIECE,
            saleQuantityBase: 2,
            recipeVersionId: null,
            sourceProductIds: ['product-1'],
          },
        ] as any,
        productStockItemModel,
        {} as any,
        recipeVersionModel,
        recipeVersionItemModel,
        stockItemBrandModel
      );

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toMatchObject({
        stockItemId: 'stock-1',
        brandId: 'brand-1',
        requiredQuantityBase: 6,
        unitCostSnapshot: 4,
        totalCostSnapshot: 24,
        costingMethod: CostingMethod.PREFERRED_BRAND_PRICE,
      });
    });

    it('calculates weight demand by yield and waste percent', async () => {
      const recipeVersionModel = {
        findOne: jest.fn().mockResolvedValue({
          id: 'rv-2',
          yieldBaseQuantity: 1000,
          status: RecipeVersionStatus.ACTIVE,
          recipe: {
            id: 'recipe-2',
            productId: 'product-2',
            status: RecipeStatus.ACTIVE,
            isDefault: true,
          },
        }),
      } as any;

      const recipeVersionItemModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            id: 'rvi-2',
            recipeVersionId: 'rv-2',
            stockItemId: 'stock-2',
            baseQuantity: 200,
            wastePercent: 10,
            preferredBrandId: 'brand-2',
            stockItem: {
              id: 'stock-2',
              name: 'Cream',
            },
            preferredBrand: {
              id: 'brand-2',
              name: 'Brand 2',
            },
          },
        ]),
      } as any;

      const stockItemBrandModel = createStockItemBrandModelMock({
        'stock-2': {
          'brand-2': {
            unitPriceAfterTax: 1.5,
            brandName: 'Brand 2',
          },
        },
      });

      const result = await __internalPaidOrderStockUtils.buildStockUsageDemand(
        [
          {
            productId: 'product-2',
            saleUnitType: SaleUnitType.WEIGHT,
            saleQuantityBase: 500,
            recipeVersionId: null,
            sourceProductIds: ['product-2'],
          },
        ] as any,
        productStockItemModel,
        {} as any,
        recipeVersionModel,
        recipeVersionItemModel,
        stockItemBrandModel
      );

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toMatchObject({
        stockItemId: 'stock-2',
        requiredQuantityBase: 110,
        unitCostSnapshot: 1.5,
        totalCostSnapshot: 165,
      });
    });
  });

  describe('consumeStockForPaidOrder', () => {
    it('does not deduct stock twice for the same paid order', async () => {
      const stockMovementModel = {
        sequelize: {
          transaction: jest.fn(async (callback: (tx: any) => Promise<any>) =>
            callback({
              LOCK: {
                UPDATE: 'UPDATE',
              },
            })
          ),
        },
        count: jest.fn().mockResolvedValue(1),
      } as any;

      const service = createPaidOrderStockService({
        orderModel: {
          findByPk: jest.fn(),
        } as any,
        orderItemModel: {} as any,
        productModel: {} as any,
        productComboItemModel: {} as any,
        productStockItemModel: {} as any,
        recipeModel: {} as any,
        recipeVersionModel: {} as any,
        recipeVersionItemModel: {} as any,
        stockItemModel: {} as any,
        stockItemBrandModel: {} as any,
        stockMovementModel,
      });

      const result = await service.consumeStockForPaidOrder('order-1', 'user-1');
      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }
      expect(result.value).toEqual({
        executed: false,
        movementCount: 0,
      });
    });

    it('expands combo child and writes movement with cost snapshot', async () => {
      const transactionContext = {
        LOCK: {
          UPDATE: 'UPDATE',
        },
      };

      const stockMovementModel = {
        sequelize: {
          transaction: jest.fn(async (callback: (tx: any) => Promise<any>) =>
            callback(transactionContext)
          ),
        },
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({}),
      } as any;

      const orderModel = {
        findByPk: jest.fn().mockResolvedValue({
          id: 'order-2',
          items: [
            {
              id: 'order-item-1',
              orderId: 'order-2',
              productId: 'combo-1',
              saleUnitType: SaleUnitType.PIECE,
              quantity: 3,
              saleQuantityBase: 3,
              recipeVersionId: null,
              product: {
                id: 'combo-1',
                productType: ProductType.COMBO,
                saleUnitType: SaleUnitType.PIECE,
                comboItems: [
                  {
                    quantity: 2,
                    itemProduct: {
                      id: 'child-1',
                      productType: ProductType.SINGLE,
                      saleUnitType: SaleUnitType.PIECE,
                    },
                  },
                ],
              },
            },
          ],
        }),
      } as any;

      const recipeVersionModel = {
        findOne: jest.fn().mockResolvedValue({
          id: 'rv-child-1',
          yieldBaseQuantity: 1,
          recipe: {
            id: 'recipe-child-1',
            productId: 'child-1',
            status: RecipeStatus.ACTIVE,
            isDefault: true,
          },
        }),
      } as any;

      const recipeVersionItemModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            id: 'rvi-child-1',
            recipeVersionId: 'rv-child-1',
            stockItemId: 'stock-1',
            baseQuantity: 1,
            wastePercent: 0,
            preferredBrandId: 'brand-1',
            stockItem: { id: 'stock-1', name: 'Sugar' },
            preferredBrand: { id: 'brand-1', name: 'Brand 1' },
          },
        ]),
      } as any;

      const stockItemBrandModel = createStockItemBrandModelMock({
        'stock-1': {
          'brand-1': {
            unitPriceAfterTax: 2,
            brandName: 'Brand 1',
          },
        },
      });

      const stockItemRecord = {
        id: 'stock-1',
        currentQuantity: 20,
        update: jest.fn().mockResolvedValue(undefined),
      };

      const stockItemModel = {
        findAll: jest.fn().mockResolvedValue([stockItemRecord]),
      } as any;

      const service = createPaidOrderStockService({
        orderModel,
        orderItemModel: {} as any,
        productModel: {} as any,
        productComboItemModel: {} as any,
        productStockItemModel: {
          findAll: jest.fn().mockResolvedValue([]),
        } as any,
        recipeModel: {} as any,
        recipeVersionModel,
        recipeVersionItemModel,
        stockItemModel,
        stockItemBrandModel,
        stockMovementModel,
      });

      const result = await service.consumeStockForPaidOrder('order-2', 'user-2');

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      expect(result.value).toEqual({
        executed: true,
        movementCount: 1,
      });
      expect(stockItemRecord.update).toHaveBeenCalledWith(
        { currentQuantity: 14 },
        { transaction: transactionContext }
      );
      expect(stockMovementModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stockItemId: 'stock-1',
          brandId: 'brand-1',
          quantity: -6,
          previousQuantity: 20,
          newQuantity: 14,
          referenceType: 'order',
          referenceId: 'order-2',
          unitCostSnapshot: 2,
          totalCostSnapshot: 12,
          costingMethod: CostingMethod.PREFERRED_BRAND_PRICE,
        }),
        { transaction: transactionContext }
      );
    });
  });
});
