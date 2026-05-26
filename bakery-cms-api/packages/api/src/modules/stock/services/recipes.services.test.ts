import {
  CostingMethod,
  RecipeStatus,
  RecipeVersionStatus,
  StockPurchaseUnit,
  StockUnitType,
} from '@bakery-cms/common';
import { RecipeModel } from '@bakery-cms/database';
import { createRecipeService } from './recipes.services';

const now = new Date('2026-01-01T00:00:00.000Z');

const createRepositoryMock = () =>
  ({
    findByProductId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    clearDefaultActiveByProduct: jest.fn(),
    findVersionById: jest.fn(),
    findActiveVersionByIdForProduct: jest.fn(),
    findDefaultActiveVersionByProduct: jest.fn(),
    createVersion: jest.fn(),
    updateVersion: jest.fn(),
    getNextVersionNumber: jest.fn(),
    findVersionDetail: jest.fn(),
    findVersionItems: jest.fn(),
    createVersionItem: jest.fn(),
    findVersionItem: jest.fn(),
    updateVersionItem: jest.fn(),
    deleteVersionItem: jest.fn(),
  }) as any;

describe('recipes.services', () => {
  let originalSequelize: unknown;

  beforeEach(() => {
    originalSequelize = (RecipeModel as any).sequelize;
  });

  afterEach(() => {
    (RecipeModel as any).sequelize = originalSequelize;
    jest.restoreAllMocks();
  });

  it('creates recipe version with converted yield base quantity', async () => {
    const recipeRepository = createRepositoryMock();
    recipeRepository.findById.mockResolvedValue({
      id: 'recipe-1',
      productId: 'product-1',
      name: 'Default Recipe',
      status: RecipeStatus.ACTIVE,
      isDefault: true,
      note: null,
      createdAt: now,
      updatedAt: now,
    });
    recipeRepository.getNextVersionNumber.mockResolvedValue(1);
    recipeRepository.createVersion.mockImplementation(async (attrs: any) => ({
      id: 'version-1',
      recipeId: attrs.recipeId,
      versionNumber: attrs.versionNumber,
      status: attrs.status,
      yieldQuantity: attrs.yieldQuantity,
      yieldUnit: attrs.yieldUnit,
      yieldBaseQuantity: attrs.yieldBaseQuantity,
      yieldBaseUnit: attrs.yieldBaseUnit,
      estimatedCost: attrs.estimatedCost,
      costingMethod: attrs.costingMethod,
      effectiveFrom: null,
      createdAt: now,
      updatedAt: now,
    }));

    const service = createRecipeService({
      recipeRepository,
      stockItemModel: {} as any,
      stockItemBrandModel: {} as any,
    });

    const result = await service.createRecipeVersion('product-1', 'recipe-1', {
      yieldQuantity: 2,
      yieldUnit: StockPurchaseUnit.KILOGRAM,
      status: RecipeVersionStatus.ACTIVE,
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(recipeRepository.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        recipeId: 'recipe-1',
        versionNumber: 1,
        yieldQuantity: 2,
        yieldUnit: StockPurchaseUnit.KILOGRAM,
        yieldBaseQuantity: 2000,
        yieldBaseUnit: StockPurchaseUnit.GRAM,
        status: RecipeVersionStatus.ACTIVE,
        costingMethod: CostingMethod.PREFERRED_BRAND_PRICE,
      })
    );
    expect(result.value.yieldBaseQuantity).toBe(2000);
    expect(result.value.yieldBaseUnit).toBe(StockPurchaseUnit.GRAM);
  });

  it('creates recipe version item with converted base quantity and cost snapshots', async () => {
    const recipeRepository = createRepositoryMock();
    recipeRepository.findById.mockResolvedValue({
      id: 'recipe-1',
      productId: 'product-1',
      status: RecipeStatus.ACTIVE,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
    recipeRepository.findVersionById.mockResolvedValue({
      id: 'version-1',
      recipeId: 'recipe-1',
      versionNumber: 1,
      status: RecipeVersionStatus.ACTIVE,
      yieldQuantity: 1,
      yieldUnit: StockPurchaseUnit.PIECE,
      yieldBaseQuantity: 1,
      yieldBaseUnit: StockPurchaseUnit.PIECE,
      estimatedCost: 0,
      costingMethod: CostingMethod.PREFERRED_BRAND_PRICE,
      effectiveFrom: null,
      createdAt: now,
      updatedAt: now,
    });
    recipeRepository.createVersionItem.mockResolvedValue({
      id: 'item-1',
      recipeVersionId: 'version-1',
    });
    recipeRepository.findVersionItems
      .mockResolvedValueOnce([
        {
          id: 'item-1',
          totalCostSnapshot: 165,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'item-1',
          recipeVersionId: 'version-1',
          stockItemId: 'stock-1',
          quantity: 0.5,
          unit: StockPurchaseUnit.KILOGRAM,
          baseQuantity: 500,
          baseUnit: StockPurchaseUnit.GRAM,
          wastePercent: 10,
          preferredBrandId: 'brand-1',
          unitCostSnapshot: 0.3,
          totalCostSnapshot: 165,
          note: null,
          stockItem: {
            id: 'stock-1',
            name: 'Flour',
          },
          preferredBrand: {
            id: 'brand-1',
            name: 'Brand 1',
          },
          createdAt: now,
          updatedAt: now,
        },
      ]);
    recipeRepository.updateVersion.mockResolvedValue({
      id: 'version-1',
      recipeId: 'recipe-1',
      versionNumber: 1,
      status: RecipeVersionStatus.ACTIVE,
      yieldQuantity: 1,
      yieldUnit: StockPurchaseUnit.PIECE,
      yieldBaseQuantity: 1,
      yieldBaseUnit: StockPurchaseUnit.PIECE,
      estimatedCost: 165,
      costingMethod: CostingMethod.PREFERRED_BRAND_PRICE,
      effectiveFrom: null,
      createdAt: now,
      updatedAt: now,
    });

    const stockItemModel = {
      findByPk: jest.fn().mockResolvedValue({
        id: 'stock-1',
        unitType: StockUnitType.WEIGHT,
      }),
    } as any;
    const stockItemBrandModel = {
      findOne: jest.fn().mockResolvedValue({
        stockItemId: 'stock-1',
        brandId: 'brand-1',
        unitPriceAfterTax: 0.3,
      }),
      findAll: jest.fn(),
    } as any;

    const service = createRecipeService({
      recipeRepository,
      stockItemModel,
      stockItemBrandModel,
    });

    const result = await service.addRecipeVersionItem(
      'product-1',
      'recipe-1',
      'version-1',
      {
        stockItemId: 'stock-1',
        quantity: 0.5,
        unit: StockPurchaseUnit.KILOGRAM,
        wastePercent: 10,
        preferredBrandId: 'brand-1',
      }
    );

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(recipeRepository.createVersionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        stockItemId: 'stock-1',
        quantity: 0.5,
        unit: StockPurchaseUnit.KILOGRAM,
        baseQuantity: 500,
        baseUnit: StockPurchaseUnit.GRAM,
        wastePercent: 10,
        preferredBrandId: 'brand-1',
        unitCostSnapshot: 0.3,
        totalCostSnapshot: 165,
      })
    );
    expect(recipeRepository.updateVersion).toHaveBeenCalledWith(
      'version-1',
      expect.objectContaining({
        estimatedCost: 165,
      })
    );
    expect(result.value.baseQuantity).toBe(500);
    expect(result.value.totalCostSnapshot).toBe(165);
  });

  it('enforces active-only rule when setting default recipe', async () => {
    const recipeRepository = createRepositoryMock();
    recipeRepository.findById.mockResolvedValue({
      id: 'recipe-2',
      productId: 'product-1',
      status: RecipeStatus.DRAFT,
      isDefault: false,
      update: jest.fn(),
      createdAt: now,
      updatedAt: now,
    });

    const service = createRecipeService({
      recipeRepository,
      stockItemModel: {} as any,
      stockItemBrandModel: {} as any,
    });

    const result = await service.setDefaultRecipe('product-1', 'recipe-2');
    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }
    expect(result.error.message).toContain('Only active recipe can be set as default');
  });

  it('clears previous default before setting new default recipe', async () => {
    const recipeRepository = createRepositoryMock();
    const set = jest.fn();
    recipeRepository.findById.mockResolvedValue({
      id: 'recipe-3',
      productId: 'product-1',
      name: 'Recipe 3',
      status: RecipeStatus.ACTIVE,
      isDefault: false,
      note: null,
      set,
      createdAt: now,
      updatedAt: now,
    });
    const staticUpdate = jest
      .spyOn(RecipeModel, 'update')
      .mockResolvedValue([1] as any);

    (RecipeModel as any).sequelize = {
      transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
        await callback({}),
    };

    const service = createRecipeService({
      recipeRepository,
      stockItemModel: {} as any,
      stockItemBrandModel: {} as any,
    });

    const result = await service.setDefaultRecipe('product-1', 'recipe-3');

    expect(result.isOk()).toBe(true);
    expect(recipeRepository.clearDefaultActiveByProduct).toHaveBeenCalledWith(
      'product-1',
      expect.any(Object)
    );
    expect(staticUpdate).toHaveBeenCalledWith(
      { isDefault: true },
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    expect(set).toHaveBeenCalledWith('isDefault', true);
  });
});
