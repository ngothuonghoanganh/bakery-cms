import {
  BusinessModel,
  OrderStatus,
  OrderType,
  SaleUnitType,
  StockPurchaseUnit,
} from '@bakery-cms/common';
import { createOrderService } from './orders.services';

const now = new Date('2026-01-01T00:00:00.000Z');

const createBaseRepositoryMock = () => {
  const items = {
    findByOrderId: jest.fn(),
    findProductSaleInfo: jest.fn(),
    findActiveRecipeVersionById: jest.fn(),
    findDefaultActiveRecipeVersion: jest.fn(),
    createMany: jest.fn().mockResolvedValue([]),
    deleteByOrderId: jest.fn(),
  };

  const order = {
    id: 'order-1',
    orderNumber: 'ORD-20260101-0001',
    orderType: OrderType.TEMPORARY,
    businessModel: BusinessModel.READY_TO_SELL,
    totalAmount: 0,
    extraAmount: 0,
    extraFees: '[]',
    hasPendingExtraPayment: false,
    status: OrderStatus.DRAFT,
    customerName: null,
    customerPhone: null,
    customerAddress: null,
    notes: null,
    confirmedAt: null,
    createdAt: now,
    updatedAt: now,
    items: [],
  };

  const repository = {
    items,
    bills: {} as any,
    findById: jest.fn(),
    findByIdWithItems: jest.fn().mockResolvedValue(order),
    findAll: jest.fn(),
    create: jest.fn().mockResolvedValue(order),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
    count: jest.fn(),
    findByOrderNumber: jest.fn().mockResolvedValue(null),
  };

  return repository as any;
};

describe('orders.services recipe snapshot', () => {
  it('auto-resolves default active recipe version when recipeVersionId is not provided', async () => {
    const repository = createBaseRepositoryMock();
    repository.items.findProductSaleInfo.mockResolvedValue([
      {
        id: 'product-1',
        saleUnitType: SaleUnitType.PIECE,
      },
    ]);
    repository.items.findDefaultActiveRecipeVersion.mockResolvedValue({
      recipeId: 'recipe-1',
      recipeName: 'Default Recipe',
      recipeVersionId: 'version-1',
      recipeVersionNumber: 1,
      recipeEstimatedCost: 25000,
    });

    const service = createOrderService(
      repository,
      {} as any,
      {
        findByKey: jest.fn().mockResolvedValue(null),
      } as any,
      {
        consumeStockForPaidOrder: jest.fn(),
      } as any
    );

    const result = await service.createOrder({
      orderType: OrderType.TEMPORARY,
      businessModel: BusinessModel.READY_TO_SELL,
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          unitPrice: 20000,
          subtotal: 40000,
        },
      ],
    });

    expect(result.isOk()).toBe(true);
    expect(repository.items.findDefaultActiveRecipeVersion).toHaveBeenCalledWith('product-1');
    expect(repository.items.findActiveRecipeVersionById).not.toHaveBeenCalled();
    expect(repository.items.createMany).toHaveBeenCalledWith(
      'order-1',
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-1',
          quantity: 2,
          saleUnitType: SaleUnitType.PIECE,
          saleUnit: StockPurchaseUnit.PIECE,
          saleQuantityBase: 2,
          saleBaseUnit: StockPurchaseUnit.PIECE,
          recipeId: 'recipe-1',
          recipeVersionId: 'version-1',
          recipeNameSnapshot: 'Default Recipe',
          recipeVersionSnapshot: 1,
          recipeEstimatedCostSnapshot: 25000,
        }),
      ])
    );
  });

  it('supports override recipeVersionId and weight quantity conversion to gram', async () => {
    const repository = createBaseRepositoryMock();
    repository.items.findProductSaleInfo.mockResolvedValue([
      {
        id: 'product-2',
        saleUnitType: SaleUnitType.WEIGHT,
      },
    ]);
    repository.items.findActiveRecipeVersionById.mockResolvedValue({
      recipeId: 'recipe-2',
      recipeName: 'Alt Recipe',
      recipeVersionId: 'version-2',
      recipeVersionNumber: 2,
      recipeEstimatedCost: 12000,
    });

    const service = createOrderService(
      repository,
      {} as any,
      {
        findByKey: jest.fn().mockResolvedValue(null),
      } as any,
      {
        consumeStockForPaidOrder: jest.fn(),
      } as any
    );

    const result = await service.createOrder({
      orderType: OrderType.TEMPORARY,
      businessModel: BusinessModel.READY_TO_SELL,
      items: [
        {
          productId: 'product-2',
          quantity: 0.5,
          saleUnit: StockPurchaseUnit.KILOGRAM,
          recipeVersionId: 'version-2',
          unitPrice: 12000,
          subtotal: 60000,
        },
      ],
    });

    expect(result.isOk()).toBe(true);
    expect(repository.items.findActiveRecipeVersionById).toHaveBeenCalledWith(
      'product-2',
      'version-2'
    );
    expect(repository.items.findDefaultActiveRecipeVersion).not.toHaveBeenCalled();
    expect(repository.items.createMany).toHaveBeenCalledWith(
      'order-1',
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-2',
          quantity: 0.5,
          saleUnitType: SaleUnitType.WEIGHT,
          saleUnit: StockPurchaseUnit.KILOGRAM,
          saleQuantityBase: 500,
          saleBaseUnit: StockPurchaseUnit.GRAM,
          recipeId: 'recipe-2',
          recipeVersionId: 'version-2',
          recipeNameSnapshot: 'Alt Recipe',
          recipeVersionSnapshot: 2,
          recipeEstimatedCostSnapshot: 12000,
        }),
      ])
    );
  });
});
