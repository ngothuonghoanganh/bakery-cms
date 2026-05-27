import {
  CostingMethod,
  ErrorCode,
  MovementType,
  StockPurchaseUnit,
  StockUnitType,
} from '@bakery-cms/common';
import { createStockItemService } from './stock-items.services';

describe('stock-items.services (receiving lots + pricing)', () => {
  const createDeps = () => {
    const stockItemRepository = {
      findByName: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
      forceDelete: jest.fn(),
      count: jest.fn(),
      updateQuantity: jest.fn(),
    } as any;

    const stockMovementRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    } as any;

    const stockItemModel = {
      findByPk: jest.fn(),
    } as any;

    const brandModel = {
      findByPk: jest.fn(),
    } as any;

    const stockItemBrandModel = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    } as any;

    const stockReceivingLotModel = {
      sequelize: {
        transaction: jest.fn(async (cb: any) => cb({})),
        fn: jest.fn((_name: string, _col: any) => 'fn'),
        col: jest.fn((_name: string) => 'col'),
      },
      findAll: jest.fn(),
      findAndCountAll: jest.fn(),
      create: jest.fn(),
    } as any;

    const stockMovementModel = {
      create: jest.fn(),
    } as any;

    const service = createStockItemService({
      stockItemRepository,
      stockMovementRepository,
      stockItemModel,
      brandModel,
      stockItemBrandModel,
      stockReceivingLotModel,
      stockMovementModel,
    });

    return {
      service,
      deps: {
        stockItemRepository,
        stockMovementRepository,
        stockItemModel,
        brandModel,
        stockItemBrandModel,
        stockReceivingLotModel,
        stockMovementModel,
      },
    };
  };

  it('receiveWithPricing creates receiving lot, increases stock, creates movement, updates brand price', async () => {
    const { service, deps } = createDeps();

    const stockItem: any = {
      id: 'stock-1',
      name: 'Sugar',
      description: null,
      unitType: StockUnitType.WEIGHT,
      status: 'available',
      currentQuantity: 1000,
      reorderThreshold: null,
      createdAt: new Date('2026-05-27T00:00:00.000Z'),
      updatedAt: new Date('2026-05-27T00:00:00.000Z'),
    };
    stockItem.update = jest.fn(async (attrs: any): Promise<any> => Object.assign(stockItem, attrs));
    deps.stockItemModel.findByPk.mockResolvedValue(stockItem);

    const brand = { id: 'brand-1', name: 'Bien Hoa' };
    deps.brandModel.findByPk.mockResolvedValue(brand);

    deps.stockReceivingLotModel.create.mockResolvedValue({
      id: 'lot-1',
      stockItemId: 'stock-1',
      brandId: 'brand-1',
      receivedQuantity: 1,
      receivedUnit: StockPurchaseUnit.KILOGRAM,
      receivedQuantityBase: 1000,
      baseUnit: StockPurchaseUnit.GRAM,
      priceBeforeTax: 90000,
      priceAfterTax: 100000,
      unitPriceBeforeTax: 90,
      unitPriceAfterTax: 100,
      remainingQuantityBase: 1000,
      receivedAt: new Date('2026-05-27T00:00:00.000Z'),
      supplierName: null,
      invoiceCode: null,
      note: null,
    });

    deps.stockItemBrandModel.count.mockResolvedValue(0);
    deps.stockItemBrandModel.findOne.mockResolvedValue(null);
    deps.stockItemBrandModel.create.mockResolvedValue({
      id: 'sib-1',
      stockItemId: 'stock-1',
      brandId: 'brand-1',
      purchaseQuantity: 1,
      purchaseUnit: StockPurchaseUnit.KILOGRAM,
      priceBeforeTax: 90000,
      priceAfterTax: 100000,
      unitPriceBeforeTax: 90,
      unitPriceAfterTax: 100,
      isPreferred: true,
      createdAt: new Date('2026-05-27T00:00:00.000Z'),
      updatedAt: new Date('2026-05-27T00:00:00.000Z'),
    });

    const result = await service.receiveWithPricing(
      'stock-1',
      {
        brandId: 'brand-1',
        receivedQuantity: 1,
        receivedUnit: StockPurchaseUnit.KILOGRAM,
        priceBeforeTax: 90000,
        priceAfterTax: 100000,
        receivedAt: '2026-05-27T00:00:00.000Z',
        supplierName: 'Supplier A',
        invoiceCode: 'INV-001',
        note: 'First lot',
      },
      'user-1'
    );

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(deps.stockReceivingLotModel.create).toHaveBeenCalled();
    expect(stockItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ currentQuantity: 2000 }),
      expect.anything()
    );
    expect(deps.stockMovementModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stockItemId: 'stock-1',
        brandId: 'brand-1',
        type: MovementType.RECEIVED,
        quantity: 1000,
        previousQuantity: 1000,
        newQuantity: 2000,
        unitCostSnapshot: 100,
        totalCostSnapshot: 100000,
        costingMethod: CostingMethod.RECEIVING_LOT_PRICE,
      }),
      expect.anything()
    );
    expect(deps.stockItemBrandModel.create).toHaveBeenCalled();
    expect(result.value.receivingLot.id).toBe('lot-1');
    expect(result.value.updatedBrandPrice.brandId).toBe('brand-1');
  });

  it('receiveWithPricing rejects missing brand', async () => {
    const { service } = createDeps();
    const result = await service.receiveWithPricing(
      'stock-1',
      {
        brandId: '' as any,
        receivedQuantity: 1,
        receivedUnit: StockPurchaseUnit.PIECE,
        priceBeforeTax: 0,
        priceAfterTax: 0,
      },
      'user-1'
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }
    expect(result.error.code).toBe(ErrorCode.INVALID_INPUT);
  });

  it('receiveWithPricing rejects priceAfterTax < priceBeforeTax', async () => {
    const { service } = createDeps();
    const result = await service.receiveWithPricing(
      'stock-1',
      {
        brandId: 'brand-1',
        receivedQuantity: 1,
        receivedUnit: StockPurchaseUnit.PIECE,
        priceBeforeTax: 10,
        priceAfterTax: 9,
      },
      'user-1'
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }
    expect(result.error.code).toBe(ErrorCode.INVALID_INPUT);
  });

  it('receiveWithPricing rejects incompatible unit', async () => {
    const { service, deps } = createDeps();

    deps.stockItemModel.findByPk.mockResolvedValue({
      id: 'stock-1',
      name: 'Milk',
      unitType: StockUnitType.VOLUME,
      currentQuantity: 0,
      update: jest.fn(),
    });
    deps.brandModel.findByPk.mockResolvedValue({ id: 'brand-1', name: 'Brand 1' });

    const result = await service.receiveWithPricing(
      'stock-1',
      {
        brandId: 'brand-1',
        receivedQuantity: 1,
        receivedUnit: StockPurchaseUnit.KILOGRAM,
        priceBeforeTax: 0,
        priceAfterTax: 0,
      },
      'user-1'
    );

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }
    expect(result.error.code).toBe(ErrorCode.INVALID_INPUT);
  });

  it('getReceivingLots returns history', async () => {
    const { service, deps } = createDeps();

    deps.stockItemModel.findByPk.mockResolvedValue({
      id: 'stock-1',
      name: 'Sugar',
    });
    deps.stockReceivingLotModel.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          id: 'lot-1',
          stockItemId: 'stock-1',
          brandId: 'brand-1',
          receivedQuantity: 1,
          receivedUnit: StockPurchaseUnit.KILOGRAM,
          receivedQuantityBase: 1000,
          baseUnit: StockPurchaseUnit.GRAM,
          priceBeforeTax: 90000,
          priceAfterTax: 100000,
          unitPriceBeforeTax: 90,
          unitPriceAfterTax: 100,
          remainingQuantityBase: 1000,
          receivedAt: new Date('2026-05-27T00:00:00.000Z'),
          supplierName: null,
          invoiceCode: null,
          note: null,
          brand: { id: 'brand-1', name: 'Bien Hoa' },
        },
      ],
    });

    const result = await service.getReceivingLots('stock-1', { page: 1, limit: 10 });
    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.total).toBe(1);
    expect(result.value.lots[0]?.brandName).toBe('Bien Hoa');
  });

  it('stock item list includes price summary (fallback to latest brand price)', async () => {
    const { service, deps } = createDeps();

    deps.stockItemRepository.findAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          id: 'stock-1',
          name: 'Sugar',
          description: null,
          unitType: StockUnitType.WEIGHT,
          unitOfMeasure: StockPurchaseUnit.GRAM,
          baseUnit: StockPurchaseUnit.GRAM,
          currentQuantity: 0,
          reorderThreshold: null,
          status: 'available',
          createdAt: new Date('2026-05-27T00:00:00.000Z'),
          updatedAt: new Date('2026-05-27T00:00:00.000Z'),
        },
      ],
    });

    deps.stockReceivingLotModel.findAll.mockResolvedValueOnce([]); // group query => no lots
    deps.stockItemBrandModel.findAll.mockResolvedValue([
      {
        id: 'sib-1',
        stockItemId: 'stock-1',
        brandId: 'brand-1',
        unitPriceBeforeTax: 90,
        unitPriceAfterTax: 100,
        isPreferred: true,
        brand: { id: 'brand-1', name: 'Bien Hoa' },
        updatedAt: new Date('2026-05-27T00:00:00.000Z'),
      },
    ]);

    const result = await service.getAllStockItems({ page: 1, limit: 10 });
    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    const first = result.value.data[0];
    expect(first?.priceSummary?.hasPrice).toBe(true);
    expect(first?.priceSummary?.latestUnitPriceAfterTax).toBe(100);
    expect(first?.priceSummary?.latestReceivedAt).toBeNull();
  });

  it('stock item detail includes price summary + latest receiving lot', async () => {
    const { service, deps } = createDeps();

    deps.stockItemRepository.findById.mockResolvedValue({
      id: 'stock-1',
      name: 'Sugar',
      description: null,
      unitType: StockUnitType.WEIGHT,
      unitOfMeasure: StockPurchaseUnit.GRAM,
      baseUnit: StockPurchaseUnit.GRAM,
      currentQuantity: 0,
      reorderThreshold: null,
      status: 'available',
      createdAt: new Date('2026-05-27T00:00:00.000Z'),
      updatedAt: new Date('2026-05-27T00:00:00.000Z'),
    });

    deps.stockReceivingLotModel.findAll
      .mockResolvedValueOnce([{ stockItemId: 'stock-1', maxReceivedAt: '2026-05-27T00:00:00.000Z' }])
      .mockResolvedValueOnce([
        {
          id: 'lot-1',
          stockItemId: 'stock-1',
          brandId: 'brand-1',
          receivedQuantity: 1,
          receivedUnit: StockPurchaseUnit.KILOGRAM,
          receivedQuantityBase: 1000,
          baseUnit: StockPurchaseUnit.GRAM,
          priceBeforeTax: 90000,
          priceAfterTax: 100000,
          unitPriceBeforeTax: 90,
          unitPriceAfterTax: 100,
          remainingQuantityBase: 1000,
          receivedAt: new Date('2026-05-27T00:00:00.000Z'),
          supplierName: null,
          invoiceCode: null,
          note: null,
          brand: { id: 'brand-1', name: 'Bien Hoa' },
          stockItem: { id: 'stock-1', name: 'Sugar' },
        },
      ]);

    deps.stockItemBrandModel.findAll.mockResolvedValue([]);

    const result = await service.getStockItemById('stock-1');
    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.latestReceivingLot?.id).toBe('lot-1');
    expect(result.value.priceSummary?.latestUnitPriceAfterTax).toBe(100);
    expect(result.value.priceSummary?.latestReceivedAt).toBe('2026-05-27T00:00:00.000Z');
  });
});
