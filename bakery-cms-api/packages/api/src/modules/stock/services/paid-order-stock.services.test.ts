import { ProductType, SaleUnitType } from '@bakery-cms/common';
import {
  __internalPaidOrderStockUtils,
  createPaidOrderStockService,
} from './paid-order-stock.services';

describe('paid-order-stock.services', () => {
  describe('expandOrderItemsToProductDemand', () => {
    it('expands combo items one level and aggregates quantities', () => {
      const orderItems = [
        {
          productId: 'single-1',
          quantity: 2,
          saleUnitType: SaleUnitType.PIECE,
          product: {
            id: 'single-1',
            productType: ProductType.SINGLE,
            saleUnitType: SaleUnitType.PIECE,
          },
        },
        {
          productId: 'combo-1',
          quantity: 3,
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
              {
                quantity: 50,
                itemProduct: {
                  id: 'child-weight',
                  productType: ProductType.SINGLE,
                  saleUnitType: SaleUnitType.WEIGHT,
                },
              },
            ],
          },
        },
      ] as any;

      const result =
        __internalPaidOrderStockUtils.expandOrderItemsToProductDemand(orderItems);

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      const byKey = new Map(
        result.value.map((item) => [
          `${item.productId}:${item.saleUnitType}`,
          item.orderedQuantity,
        ])
      );

      expect(byKey.get(`single-1:${SaleUnitType.PIECE}`)).toBe(2);
      expect(byKey.get(`child-piece:${SaleUnitType.PIECE}`)).toBe(6);
      expect(byKey.get(`child-weight:${SaleUnitType.WEIGHT}`)).toBe(150);
    });

    it('fails when a combo contains a nested combo child', () => {
      const orderItems = [
        {
          productId: 'combo-1',
          quantity: 1,
          saleUnitType: SaleUnitType.PIECE,
          product: {
            id: 'combo-1',
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
      ] as any;

      const result =
        __internalPaidOrderStockUtils.expandOrderItemsToProductDemand(orderItems);

      expect(result.isErr()).toBe(true);
      if (result.isOk()) {
        return;
      }

      expect(result.error.message).toContain('Nested combo is not supported');
    });

    it('expands combo weight by gram basis and supports decimal combo quantities', () => {
      const orderItems = [
        {
          productId: 'combo-weight-1',
          quantity: 250.5,
          saleUnitType: SaleUnitType.WEIGHT,
          product: {
            id: 'combo-weight-1',
            productType: ProductType.COMBO,
            saleUnitType: SaleUnitType.WEIGHT,
            comboItems: [
              {
                quantity: 0.5,
                itemProduct: {
                  id: 'child-piece',
                  productType: ProductType.SINGLE,
                  saleUnitType: SaleUnitType.PIECE,
                },
              },
              {
                quantity: 1.25,
                itemProduct: {
                  id: 'child-weight',
                  productType: ProductType.SINGLE,
                  saleUnitType: SaleUnitType.WEIGHT,
                },
              },
            ],
          },
        },
      ] as any;

      const result =
        __internalPaidOrderStockUtils.expandOrderItemsToProductDemand(orderItems);

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      const byKey = new Map(
        result.value.map((item) => [
          `${item.productId}:${item.saleUnitType}`,
          item.orderedQuantity,
        ])
      );

      expect(byKey.get(`child-piece:${SaleUnitType.PIECE}`)).toBe(125.25);
      expect(byKey.get(`child-weight:${SaleUnitType.WEIGHT}`)).toBe(313.125);
    });

    it('fails when order item quantity is invalid', () => {
      const orderItems = [
        {
          productId: 'single-1',
          quantity: 0,
          saleUnitType: SaleUnitType.PIECE,
          product: {
            id: 'single-1',
            productType: ProductType.SINGLE,
            saleUnitType: SaleUnitType.PIECE,
          },
        },
      ] as any;

      const result =
        __internalPaidOrderStockUtils.expandOrderItemsToProductDemand(orderItems);

      expect(result.isErr()).toBe(true);
      if (result.isOk()) {
        return;
      }

      expect(result.error.message).toContain('Order item quantity');
    });

    it('fails when combo item quantity is invalid', () => {
      const orderItems = [
        {
          productId: 'combo-1',
          quantity: 1,
          saleUnitType: SaleUnitType.PIECE,
          product: {
            id: 'combo-1',
            productType: ProductType.COMBO,
            comboItems: [
              {
                quantity: 0,
                itemProduct: {
                  id: 'child-piece',
                  productType: ProductType.SINGLE,
                  saleUnitType: SaleUnitType.PIECE,
                },
              },
            ],
          },
        },
      ] as any;

      const result =
        __internalPaidOrderStockUtils.expandOrderItemsToProductDemand(orderItems);

      expect(result.isErr()).toBe(true);
      if (result.isOk()) {
        return;
      }

      expect(result.error.message).toContain('Combo item quantity');
    });
  });

  describe('buildStockUsageDemand', () => {
    it('fails when preferred brand is missing in recipe', async () => {
      const productDemand = [
        {
          productId: 'product-1',
          saleUnitType: SaleUnitType.PIECE,
          orderedQuantity: 2,
        },
      ];

      const productStockItemModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            productId: 'product-1',
            stockItemId: 'stock-1',
            quantity: 1,
            preferredBrandId: null,
            stockItem: { id: 'stock-1', name: 'Flour' },
            preferredBrand: null,
          },
        ]),
      } as any;

      const stockItemBrandModel = {
        findAll: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await __internalPaidOrderStockUtils.buildStockUsageDemand(
        productDemand,
        productStockItemModel,
        stockItemBrandModel
      );

      expect(result.isErr()).toBe(true);
      if (result.isOk()) {
        return;
      }

      expect(result.error.message).toContain('Missing preferred brand');
    });

    it('multiplies weight recipe by gram and validates preferred brand link', async () => {
      const productDemand = [
        {
          productId: 'weight-product',
          saleUnitType: SaleUnitType.WEIGHT,
          orderedQuantity: 250,
        },
      ];

      const productStockItemModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            productId: 'weight-product',
            stockItemId: 'stock-1',
            quantity: 0.8,
            preferredBrandId: 'brand-1',
            stockItem: { id: 'stock-1', name: 'Cream' },
            preferredBrand: { id: 'brand-1', name: 'Brand A' },
          },
        ]),
      } as any;

      const stockItemBrandModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            stockItemId: 'stock-1',
            brandId: 'brand-1',
          },
        ]),
      } as any;

      const result = await __internalPaidOrderStockUtils.buildStockUsageDemand(
        productDemand,
        productStockItemModel,
        stockItemBrandModel
      );

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.requiredQuantity).toBe(200);
      expect(result.value[0]?.brandId).toBe('brand-1');
    });

    it('fails when recipe quantity is invalid', async () => {
      const productDemand = [
        {
          productId: 'product-1',
          saleUnitType: SaleUnitType.PIECE,
          orderedQuantity: 2,
        },
      ];

      const productStockItemModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            productId: 'product-1',
            stockItemId: 'stock-1',
            quantity: 0,
            preferredBrandId: 'brand-1',
            stockItem: { id: 'stock-1', name: 'Flour' },
            preferredBrand: { id: 'brand-1', name: 'Brand A' },
          },
        ]),
      } as any;

      const stockItemBrandModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            stockItemId: 'stock-1',
            brandId: 'brand-1',
          },
        ]),
      } as any;

      const result = await __internalPaidOrderStockUtils.buildStockUsageDemand(
        productDemand,
        productStockItemModel,
        stockItemBrandModel
      );

      expect(result.isErr()).toBe(true);
      if (result.isOk()) {
        return;
      }

      expect(result.error.message).toContain('Recipe quantity');
    });
  });

  describe('consumeStockForPaidOrder', () => {
    it('is idempotent when movements already exist for the order', async () => {
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

      const orderModel = {
        findByPk: jest.fn(),
      } as any;

      const service = createPaidOrderStockService({
        orderModel,
        orderItemModel: {} as any,
        productModel: {} as any,
        productComboItemModel: {} as any,
        productStockItemModel: {} as any,
        stockItemModel: {} as any,
        stockItemBrandModel: {} as any,
        stockMovementModel,
      });

      const result = await service.consumeStockForPaidOrder('order-1', 'user-1');

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      expect(result.value.executed).toBe(false);
      expect(result.value.movementCount).toBe(0);
      expect(orderModel.findByPk).not.toHaveBeenCalled();
    });

    it('allows negative stock and still records movement', async () => {
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
        create: jest.fn(),
      } as any;

      const orderModel = {
        findByPk: jest.fn().mockResolvedValue({
          id: 'order-1',
          items: [
            {
              id: 'item-1',
              orderId: 'order-1',
              productId: 'prod-1',
              quantity: 2,
              saleUnitType: SaleUnitType.PIECE,
              product: {
                id: 'prod-1',
                productType: ProductType.SINGLE,
                saleUnitType: SaleUnitType.PIECE,
              },
            },
          ],
        }),
      } as any;

      const productStockItemModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            productId: 'prod-1',
            stockItemId: 'stock-1',
            quantity: 2,
            preferredBrandId: 'brand-1',
            stockItem: { id: 'stock-1', name: 'Flour' },
            preferredBrand: { id: 'brand-1', name: 'Brand A' },
          },
        ]),
      } as any;

      const stockItemBrandModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            stockItemId: 'stock-1',
            brandId: 'brand-1',
          },
        ]),
      } as any;

      const stockItemRecord = {
        id: 'stock-1',
        currentQuantity: 3,
        update: jest.fn(),
      };

      const stockItemModel = {
        findAll: jest.fn().mockResolvedValue([stockItemRecord]),
      } as any;

      const service = createPaidOrderStockService({
        orderModel,
        orderItemModel: {} as any,
        productModel: {} as any,
        productComboItemModel: {} as any,
        productStockItemModel,
        stockItemModel,
        stockItemBrandModel,
        stockMovementModel,
      });

      const result = await service.consumeStockForPaidOrder('order-1', 'user-1');

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      expect(result.value.executed).toBe(true);
      expect(result.value.movementCount).toBe(1);
      expect(stockItemRecord.update).toHaveBeenCalledWith(
        { currentQuantity: -1 },
        { transaction: transactionContext }
      );
      expect(stockMovementModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stockItemId: 'stock-1',
          brandId: 'brand-1',
          quantity: -4,
          previousQuantity: 3,
          newQuantity: -1,
          referenceId: 'order-1',
        }),
        { transaction: transactionContext }
      );
    });

    it('deducts stock and records movement when stock is sufficient', async () => {
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
          id: 'order-1',
          items: [
            {
              id: 'item-1',
              orderId: 'order-1',
              productId: 'prod-1',
              quantity: 2,
              saleUnitType: SaleUnitType.PIECE,
              product: {
                id: 'prod-1',
                productType: ProductType.SINGLE,
                saleUnitType: SaleUnitType.PIECE,
              },
            },
          ],
        }),
      } as any;

      const productStockItemModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            productId: 'prod-1',
            stockItemId: 'stock-1',
            quantity: 2,
            preferredBrandId: 'brand-1',
            stockItem: { id: 'stock-1', name: 'Flour' },
            preferredBrand: { id: 'brand-1', name: 'Brand A' },
          },
        ]),
      } as any;

      const stockItemBrandModel = {
        findAll: jest.fn().mockResolvedValue([
          {
            stockItemId: 'stock-1',
            brandId: 'brand-1',
          },
        ]),
      } as any;

      const stockItemRecord = {
        id: 'stock-1',
        currentQuantity: 10,
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
        productStockItemModel,
        stockItemModel,
        stockItemBrandModel,
        stockMovementModel,
      });

      const result = await service.consumeStockForPaidOrder('order-1', 'user-1');

      expect(result.isOk()).toBe(true);
      if (result.isErr()) {
        return;
      }

      expect(result.value.executed).toBe(true);
      expect(result.value.movementCount).toBe(1);
      expect(stockItemRecord.update).toHaveBeenCalledWith(
        { currentQuantity: 6 },
        { transaction: transactionContext }
      );
      expect(stockMovementModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stockItemId: 'stock-1',
          brandId: 'brand-1',
          quantity: -4,
          previousQuantity: 10,
          newQuantity: 6,
          referenceId: 'order-1',
        }),
        { transaction: transactionContext }
      );
    });
  });
});
