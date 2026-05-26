import { Result, err, ok } from 'neverthrow';
import {
  AppError,
  CostingMethod,
  RecipeStatus,
  RecipeVersionStatus,
  StockPurchaseUnit,
  StockUnitType,
} from '@bakery-cms/common';
import {
  RecipeModel,
  RecipeVersionItemModel,
  RecipeVersionModel,
  StockItemBrandModel,
  StockItemModel,
} from '@bakery-cms/database';
import { createRecipeRepository, RecipeRepository } from '../repositories/recipes.repositories';
import {
  createBusinessRuleError,
  createDatabaseError,
  createInvalidInputError,
  createNotFoundError,
} from '../../../utils/error-factory';
import {
  CreateRecipeDto,
  CreateRecipeVersionDto,
  CreateRecipeVersionItemDto,
  RecipeResponseDto,
  RecipeVersionDetailResponseDto,
  RecipeVersionItemResponseDto,
  RecipeVersionResponseDto,
  UpdateRecipeDto,
  UpdateRecipeVersionDto,
  UpdateRecipeVersionItemDto,
} from '../dto/recipes.dto';
import { unitConversionService } from './unit-conversion.services';

type RecipeVersionItemWithRelations = RecipeVersionItemModel & {
  stockItem?: StockItemModel;
  preferredBrand?: {
    id: string;
    name: string;
  } | null;
};

const toMoney = (value: number): number => Math.round(value * 100) / 100;
const toQuantity = (value: number): number => Math.round(value * 1000) / 1000;

const toRecipeResponseDto = (
  recipe: RecipeModel & { versions?: RecipeVersionModel[] }
): RecipeResponseDto => ({
  id: recipe.id,
  productId: recipe.productId,
  name: recipe.name,
  isDefault: recipe.isDefault,
  status: recipe.status as RecipeStatus,
  note: recipe.note,
  versions: (recipe.versions ?? []).map((version) => ({
    id: version.id,
    recipeId: version.recipeId,
    versionNumber: version.versionNumber,
    status: version.status as RecipeVersionStatus,
    yieldQuantity: Number(version.yieldQuantity),
    yieldUnit: version.yieldUnit as StockPurchaseUnit,
    yieldBaseQuantity: Number(version.yieldBaseQuantity),
    yieldBaseUnit: version.yieldBaseUnit as StockPurchaseUnit,
    estimatedCost: Number(version.estimatedCost),
    costingMethod: version.costingMethod as CostingMethod,
    effectiveFrom: version.effectiveFrom ? version.effectiveFrom.toISOString() : null,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  })),
  createdAt: recipe.createdAt.toISOString(),
  updatedAt: recipe.updatedAt.toISOString(),
});

const toRecipeVersionResponseDto = (
  version: RecipeVersionModel
): RecipeVersionResponseDto => ({
  id: version.id,
  recipeId: version.recipeId,
  versionNumber: version.versionNumber,
  status: version.status as RecipeVersionStatus,
  yieldQuantity: Number(version.yieldQuantity),
  yieldUnit: version.yieldUnit as StockPurchaseUnit,
  yieldBaseQuantity: Number(version.yieldBaseQuantity),
  yieldBaseUnit: version.yieldBaseUnit as StockPurchaseUnit,
  estimatedCost: Number(version.estimatedCost),
  costingMethod: version.costingMethod as CostingMethod,
  effectiveFrom: version.effectiveFrom ? version.effectiveFrom.toISOString() : null,
  createdAt: version.createdAt.toISOString(),
  updatedAt: version.updatedAt.toISOString(),
});

const toRecipeVersionItemResponseDto = (
  item: RecipeVersionItemWithRelations
): RecipeVersionItemResponseDto => ({
  id: item.id,
  recipeVersionId: item.recipeVersionId,
  stockItemId: item.stockItemId,
  stockItemName: item.stockItem?.name ?? '',
  quantity: Number(item.quantity),
  unit: item.unit as StockPurchaseUnit,
  baseQuantity: Number(item.baseQuantity),
  baseUnit: item.baseUnit as StockPurchaseUnit,
  wastePercent: Number(item.wastePercent),
  preferredBrandId: item.preferredBrandId,
  preferredBrandName: item.preferredBrand?.name ?? null,
  unitCostSnapshot: Number(item.unitCostSnapshot),
  totalCostSnapshot: Number(item.totalCostSnapshot),
  note: item.note,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export interface RecipeService {
  getProductRecipes(productId: string): Promise<Result<RecipeResponseDto[], AppError>>;
  createRecipe(
    productId: string,
    dto: CreateRecipeDto
  ): Promise<Result<RecipeResponseDto, AppError>>;
  updateRecipe(
    productId: string,
    recipeId: string,
    dto: UpdateRecipeDto
  ): Promise<Result<RecipeResponseDto, AppError>>;
  setDefaultRecipe(
    productId: string,
    recipeId: string
  ): Promise<Result<RecipeResponseDto, AppError>>;
  createRecipeVersion(
    productId: string,
    recipeId: string,
    dto: CreateRecipeVersionDto
  ): Promise<Result<RecipeVersionResponseDto, AppError>>;
  getRecipeVersionDetail(
    productId: string,
    recipeId: string,
    versionId: string
  ): Promise<Result<RecipeVersionDetailResponseDto, AppError>>;
  updateRecipeVersion(
    productId: string,
    recipeId: string,
    versionId: string,
    dto: UpdateRecipeVersionDto
  ): Promise<Result<RecipeVersionResponseDto, AppError>>;
  addRecipeVersionItem(
    productId: string,
    recipeId: string,
    versionId: string,
    dto: CreateRecipeVersionItemDto
  ): Promise<Result<RecipeVersionItemResponseDto, AppError>>;
  updateRecipeVersionItem(
    productId: string,
    recipeId: string,
    versionId: string,
    itemId: string,
    dto: UpdateRecipeVersionItemDto
  ): Promise<Result<RecipeVersionItemResponseDto, AppError>>;
  deleteRecipeVersionItem(
    productId: string,
    recipeId: string,
    versionId: string,
    itemId: string
  ): Promise<Result<void, AppError>>;
}

type RecipeServiceDeps = {
  recipeRepository: RecipeRepository;
  stockItemModel: typeof StockItemModel;
  stockItemBrandModel: typeof StockItemBrandModel;
};

const getUnitCostFromPreferredOrLowest = async (
  stockItemBrandModel: typeof StockItemBrandModel,
  stockItemId: string,
  preferredBrandId?: string | null
): Promise<Result<{ preferredBrandId: string | null; unitCost: number }, AppError>> => {
  if (preferredBrandId) {
    const brand = await stockItemBrandModel.findOne({
      where: {
        stockItemId,
        brandId: preferredBrandId,
      },
    });

    if (!brand) {
      return err(
        createInvalidInputError(
          `Preferred brand ${preferredBrandId} is not linked to stock item ${stockItemId}`
        )
      );
    }

    return ok({
      preferredBrandId,
      unitCost: Number(brand.unitPriceAfterTax),
    });
  }

  const brands = await stockItemBrandModel.findAll({
    where: {
      stockItemId,
    },
    order: [['unitPriceAfterTax', 'ASC']],
  });

  if (brands.length === 0) {
    return ok({
      preferredBrandId: null,
      unitCost: 0,
    });
  }

  const lowestBrand = brands[0]!;
  return ok({
    preferredBrandId: lowestBrand.brandId,
    unitCost: Number(lowestBrand.unitPriceAfterTax),
  });
};

const calculateBaseQuantity = (
  stockItemUnitType: StockUnitType,
  quantity: number,
  unit: StockPurchaseUnit
): Result<{
  baseQuantity: number;
  baseUnit: StockPurchaseUnit;
}, AppError> => {
  const converted = unitConversionService.toStockBaseQuantity(
    stockItemUnitType,
    quantity,
    unit
  );
  if (converted.isErr()) {
    return err(converted.error);
  }

  return ok({
    baseQuantity: toQuantity(converted.value),
    baseUnit: unitConversionService.resolveStockBaseUnit(stockItemUnitType),
  });
};

const ensurePositiveYield = (
  yieldBaseQuantity: number
): Result<void, AppError> => {
  if (!Number.isFinite(yieldBaseQuantity) || yieldBaseQuantity <= 0) {
    return err(createInvalidInputError('yieldBaseQuantity must be greater than 0'));
  }

  return ok(undefined);
};

export const createRecipeService = (deps: RecipeServiceDeps): RecipeService => {
  const { recipeRepository, stockItemModel, stockItemBrandModel } = deps;

  const recalculateEstimatedCost = async (
    versionId: string
  ): Promise<Result<void, AppError>> => {
    const items = await recipeRepository.findVersionItems(versionId);
    const estimatedCost = items.reduce(
      (sum, item) => sum + Number(item.totalCostSnapshot),
      0
    );
    const updated = await recipeRepository.updateVersion(versionId, {
      estimatedCost: toMoney(estimatedCost),
    });
    if (!updated) {
      return err(createNotFoundError('Recipe version', versionId));
    }
    return ok(undefined);
  };

  const ensureProductRecipe = async (
    productId: string,
    recipeId: string
  ): Promise<Result<RecipeModel, AppError>> => {
    const recipe = await recipeRepository.findById(productId, recipeId);
    if (!recipe) {
      return err(createNotFoundError('Recipe', recipeId));
    }
    return ok(recipe);
  };

  const getProductRecipes = async (
    productId: string
  ): Promise<Result<RecipeResponseDto[], AppError>> => {
    try {
      const recipes = await recipeRepository.findByProductId(productId);
      return ok(recipes.map(toRecipeResponseDto));
    } catch (error) {
      return err(createDatabaseError('Failed to fetch recipes', error));
    }
  };

  const createRecipe = async (
    productId: string,
    dto: CreateRecipeDto
  ): Promise<Result<RecipeResponseDto, AppError>> => {
    try {
      const status = dto.status ?? RecipeStatus.DRAFT;
      const wantsDefault = Boolean(dto.isDefault);

      if (wantsDefault && status !== RecipeStatus.ACTIVE) {
        return err(
          createBusinessRuleError('Default recipe must have active status')
        );
      }

      const sequelize = RecipeModel.sequelize;
      if (!sequelize) {
        return err(createDatabaseError('Database connection is not available'));
      }

      const recipe = await sequelize.transaction(async (transaction) => {
        if (wantsDefault) {
          await recipeRepository.clearDefaultActiveByProduct(productId, transaction);
        }

        return await RecipeModel.create(
          {
            productId,
            name: dto.name,
            isDefault: wantsDefault,
            status,
            note: dto.note ?? null,
          },
          { transaction }
        );
      });

      return ok(toRecipeResponseDto(recipe));
    } catch (error) {
      return err(createDatabaseError('Failed to create recipe', error));
    }
  };

  const updateRecipe = async (
    productId: string,
    recipeId: string,
    dto: UpdateRecipeDto
  ): Promise<Result<RecipeResponseDto, AppError>> => {
    try {
      const recipeResult = await ensureProductRecipe(productId, recipeId);
      if (recipeResult.isErr()) {
        return err(recipeResult.error);
      }
      const recipe = recipeResult.value;

      const nextStatus = dto.status ?? (recipe.status as RecipeStatus);
      const nextIsDefault = dto.isDefault ?? recipe.isDefault;

      if (nextIsDefault && nextStatus !== RecipeStatus.ACTIVE) {
        return err(
          createBusinessRuleError('Default recipe must have active status')
        );
      }

      const sequelize = RecipeModel.sequelize;
      if (!sequelize) {
        return err(createDatabaseError('Database connection is not available'));
      }

      const updatedRecipe = await sequelize.transaction(async (transaction) => {
        if (nextIsDefault) {
          await recipeRepository.clearDefaultActiveByProduct(productId, transaction);
        }

        await recipe.update(
          {
            name: dto.name ?? recipe.name,
            isDefault: nextIsDefault,
            status: nextStatus,
            note: dto.note !== undefined ? dto.note : recipe.note,
          },
          { transaction }
        );

        return recipe;
      });

      return ok(toRecipeResponseDto(updatedRecipe));
    } catch (error) {
      return err(createDatabaseError('Failed to update recipe', error));
    }
  };

  const setDefaultRecipe = async (
    productId: string,
    recipeId: string
  ): Promise<Result<RecipeResponseDto, AppError>> => {
    try {
      const recipeResult = await ensureProductRecipe(productId, recipeId);
      if (recipeResult.isErr()) {
        return err(recipeResult.error);
      }

      const recipe = recipeResult.value;
      if (recipe.status !== RecipeStatus.ACTIVE) {
        return err(
          createBusinessRuleError('Only active recipe can be set as default')
        );
      }

      const sequelize = RecipeModel.sequelize;
      if (!sequelize) {
        return err(createDatabaseError('Database connection is not available'));
      }

      await sequelize.transaction(async (transaction) => {
        await recipeRepository.clearDefaultActiveByProduct(productId, transaction);
        await RecipeModel.update(
          { isDefault: true },
          {
            where: {
              id: recipe.id,
            },
            transaction,
          }
        );
        recipe.set('isDefault', true);
      });

      return ok(toRecipeResponseDto(recipe));
    } catch (error) {
      return err(createDatabaseError('Failed to set default recipe', error));
    }
  };

  const createRecipeVersion = async (
    productId: string,
    recipeId: string,
    dto: CreateRecipeVersionDto
  ): Promise<Result<RecipeVersionResponseDto, AppError>> => {
    try {
      const recipeResult = await ensureProductRecipe(productId, recipeId);
      if (recipeResult.isErr()) {
        return err(recipeResult.error);
      }

      const versionNumber = await recipeRepository.getNextVersionNumber(recipeId);
      const yieldUnit = dto.yieldUnit;
      const yieldQuantity = Number(dto.yieldQuantity);
      const yieldBaseUnit =
        yieldUnit === StockPurchaseUnit.KILOGRAM
          ? StockPurchaseUnit.GRAM
          : yieldUnit === StockPurchaseUnit.LITER
            ? StockPurchaseUnit.MILLILITER
            : yieldUnit;

      const convertedYield = unitConversionService.convert(
        yieldQuantity,
        yieldUnit,
        yieldBaseUnit
      );
      if (convertedYield.isErr()) {
        return err(convertedYield.error);
      }

      const yieldBaseQuantity = toQuantity(convertedYield.value);
      const yieldValidation = ensurePositiveYield(yieldBaseQuantity);
      if (yieldValidation.isErr()) {
        return err(yieldValidation.error);
      }

      const version = await recipeRepository.createVersion({
        recipeId,
        versionNumber,
        status: dto.status ?? RecipeVersionStatus.DRAFT,
        yieldQuantity,
        yieldUnit,
        yieldBaseQuantity,
        yieldBaseUnit,
        estimatedCost: 0,
        costingMethod: CostingMethod.PREFERRED_BRAND_PRICE,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
      });

      return ok(toRecipeVersionResponseDto(version));
    } catch (error) {
      return err(createDatabaseError('Failed to create recipe version', error));
    }
  };

  const getRecipeVersionDetail = async (
    productId: string,
    recipeId: string,
    versionId: string
  ): Promise<Result<RecipeVersionDetailResponseDto, AppError>> => {
    try {
      const recipeResult = await ensureProductRecipe(productId, recipeId);
      if (recipeResult.isErr()) {
        return err(recipeResult.error);
      }

      const detail = await recipeRepository.findVersionDetail(recipeId, versionId);
      if (!detail) {
        return err(createNotFoundError('Recipe version', versionId));
      }

      return ok({
        ...toRecipeVersionResponseDto(detail),
        items: (detail.items ?? []).map((item) =>
          toRecipeVersionItemResponseDto(item as RecipeVersionItemWithRelations)
        ),
      });
    } catch (error) {
      return err(createDatabaseError('Failed to fetch recipe version detail', error));
    }
  };

  const updateRecipeVersion = async (
    productId: string,
    recipeId: string,
    versionId: string,
    dto: UpdateRecipeVersionDto
  ): Promise<Result<RecipeVersionResponseDto, AppError>> => {
    try {
      const recipeResult = await ensureProductRecipe(productId, recipeId);
      if (recipeResult.isErr()) {
        return err(recipeResult.error);
      }

      const version = await recipeRepository.findVersionById(recipeId, versionId);
      if (!version) {
        return err(createNotFoundError('Recipe version', versionId));
      }

      const nextYieldUnit = dto.yieldUnit ?? (version.yieldUnit as StockPurchaseUnit);
      const nextYieldQuantity = Number(dto.yieldQuantity ?? version.yieldQuantity);
      const nextStatus = dto.status ?? (version.status as RecipeVersionStatus);

      const nextYieldBaseUnit =
        nextYieldUnit === StockPurchaseUnit.KILOGRAM
          ? StockPurchaseUnit.GRAM
          : nextYieldUnit === StockPurchaseUnit.LITER
            ? StockPurchaseUnit.MILLILITER
            : nextYieldUnit;

      const convertedYield = unitConversionService.convert(
        nextYieldQuantity,
        nextYieldUnit,
        nextYieldBaseUnit
      );
      if (convertedYield.isErr()) {
        return err(convertedYield.error);
      }
      const nextYieldBaseQuantity = toQuantity(convertedYield.value);
      const yieldValidation = ensurePositiveYield(nextYieldBaseQuantity);
      if (yieldValidation.isErr()) {
        return err(yieldValidation.error);
      }

      const updated = await recipeRepository.updateVersion(versionId, {
        status: nextStatus,
        yieldQuantity: nextYieldQuantity,
        yieldUnit: nextYieldUnit,
        yieldBaseQuantity: nextYieldBaseQuantity,
        yieldBaseUnit: nextYieldBaseUnit,
        effectiveFrom:
          dto.effectiveFrom !== undefined
            ? dto.effectiveFrom
              ? new Date(dto.effectiveFrom)
              : null
            : version.effectiveFrom,
      });

      if (!updated) {
        return err(createNotFoundError('Recipe version', versionId));
      }

      return ok(toRecipeVersionResponseDto(updated));
    } catch (error) {
      return err(createDatabaseError('Failed to update recipe version', error));
    }
  };

  const addRecipeVersionItem = async (
    productId: string,
    recipeId: string,
    versionId: string,
    dto: CreateRecipeVersionItemDto
  ): Promise<Result<RecipeVersionItemResponseDto, AppError>> => {
    try {
      const recipeResult = await ensureProductRecipe(productId, recipeId);
      if (recipeResult.isErr()) {
        return err(recipeResult.error);
      }

      const version = await recipeRepository.findVersionById(recipeId, versionId);
      if (!version) {
        return err(createNotFoundError('Recipe version', versionId));
      }

      const stockItem = await stockItemModel.findByPk(dto.stockItemId);
      if (!stockItem) {
        return err(createNotFoundError('Stock item', dto.stockItemId));
      }

      const baseQuantityResult = calculateBaseQuantity(
        (stockItem.unitType as StockUnitType) ?? StockUnitType.PIECE,
        Number(dto.quantity),
        dto.unit
      );
      if (baseQuantityResult.isErr()) {
        return err(baseQuantityResult.error);
      }

      const priceResult = await getUnitCostFromPreferredOrLowest(
        stockItemBrandModel,
        dto.stockItemId,
        dto.preferredBrandId
      );
      if (priceResult.isErr()) {
        return err(priceResult.error);
      }

      const wastePercent = Number(dto.wastePercent ?? 0);
      const effectiveBaseQuantity =
        baseQuantityResult.value.baseQuantity * (1 + wastePercent / 100);
      const totalCostSnapshot = toMoney(effectiveBaseQuantity * priceResult.value.unitCost);

      const created = await recipeRepository.createVersionItem({
        recipeVersionId: versionId,
        stockItemId: dto.stockItemId,
        quantity: Number(dto.quantity),
        unit: dto.unit,
        baseQuantity: baseQuantityResult.value.baseQuantity,
        baseUnit: baseQuantityResult.value.baseUnit,
        wastePercent,
        preferredBrandId: priceResult.value.preferredBrandId,
        unitCostSnapshot: priceResult.value.unitCost,
        totalCostSnapshot,
        note: dto.note ?? null,
      });

      const recalcResult = await recalculateEstimatedCost(versionId);
      if (recalcResult.isErr()) {
        return err(recalcResult.error);
      }

      const hydrated = await recipeRepository.findVersionItems(versionId);
      const item = hydrated.find((x) => x.id === created.id) as
        | RecipeVersionItemWithRelations
        | undefined;
      if (!item) {
        return err(createDatabaseError('Failed to load created recipe version item'));
      }

      return ok(toRecipeVersionItemResponseDto(item));
    } catch (error) {
      return err(createDatabaseError('Failed to create recipe version item', error));
    }
  };

  const updateRecipeVersionItem = async (
    productId: string,
    recipeId: string,
    versionId: string,
    itemId: string,
    dto: UpdateRecipeVersionItemDto
  ): Promise<Result<RecipeVersionItemResponseDto, AppError>> => {
    try {
      const recipeResult = await ensureProductRecipe(productId, recipeId);
      if (recipeResult.isErr()) {
        return err(recipeResult.error);
      }

      const version = await recipeRepository.findVersionById(recipeId, versionId);
      if (!version) {
        return err(createNotFoundError('Recipe version', versionId));
      }

      const existingItem = await recipeRepository.findVersionItem(versionId, itemId);
      if (!existingItem) {
        return err(createNotFoundError('Recipe version item', itemId));
      }

      const stockItem = await stockItemModel.findByPk(existingItem.stockItemId);
      if (!stockItem) {
        return err(createNotFoundError('Stock item', existingItem.stockItemId));
      }

      const nextQuantity = Number(dto.quantity ?? existingItem.quantity);
      const nextUnit = (dto.unit ?? existingItem.unit) as StockPurchaseUnit;
      const nextWaste = Number(dto.wastePercent ?? existingItem.wastePercent);
      const nextPreferredBrandId =
        dto.preferredBrandId !== undefined
          ? dto.preferredBrandId
          : existingItem.preferredBrandId;

      const baseQuantityResult = calculateBaseQuantity(
        (stockItem.unitType as StockUnitType) ?? StockUnitType.PIECE,
        nextQuantity,
        nextUnit
      );
      if (baseQuantityResult.isErr()) {
        return err(baseQuantityResult.error);
      }

      const priceResult = await getUnitCostFromPreferredOrLowest(
        stockItemBrandModel,
        existingItem.stockItemId,
        nextPreferredBrandId
      );
      if (priceResult.isErr()) {
        return err(priceResult.error);
      }

      const effectiveBaseQuantity =
        baseQuantityResult.value.baseQuantity * (1 + nextWaste / 100);
      const totalCostSnapshot = toMoney(effectiveBaseQuantity * priceResult.value.unitCost);

      const updated = await recipeRepository.updateVersionItem(itemId, {
        quantity: nextQuantity,
        unit: nextUnit,
        baseQuantity: baseQuantityResult.value.baseQuantity,
        baseUnit: baseQuantityResult.value.baseUnit,
        wastePercent: nextWaste,
        preferredBrandId: priceResult.value.preferredBrandId,
        unitCostSnapshot: priceResult.value.unitCost,
        totalCostSnapshot,
        note: dto.note !== undefined ? dto.note : existingItem.note,
      });

      if (!updated) {
        return err(createNotFoundError('Recipe version item', itemId));
      }

      const recalcResult = await recalculateEstimatedCost(versionId);
      if (recalcResult.isErr()) {
        return err(recalcResult.error);
      }

      const hydrated = await recipeRepository.findVersionItems(versionId);
      const item = hydrated.find((x) => x.id === itemId) as
        | RecipeVersionItemWithRelations
        | undefined;
      if (!item) {
        return err(createDatabaseError('Failed to load updated recipe version item'));
      }

      return ok(toRecipeVersionItemResponseDto(item));
    } catch (error) {
      return err(createDatabaseError('Failed to update recipe version item', error));
    }
  };

  const deleteRecipeVersionItem = async (
    productId: string,
    recipeId: string,
    versionId: string,
    itemId: string
  ): Promise<Result<void, AppError>> => {
    try {
      const recipeResult = await ensureProductRecipe(productId, recipeId);
      if (recipeResult.isErr()) {
        return err(recipeResult.error);
      }

      const version = await recipeRepository.findVersionById(recipeId, versionId);
      if (!version) {
        return err(createNotFoundError('Recipe version', versionId));
      }

      const deleted = await recipeRepository.deleteVersionItem(versionId, itemId);
      if (!deleted) {
        return err(createNotFoundError('Recipe version item', itemId));
      }

      const recalcResult = await recalculateEstimatedCost(versionId);
      if (recalcResult.isErr()) {
        return err(recalcResult.error);
      }

      return ok(undefined);
    } catch (error) {
      return err(createDatabaseError('Failed to delete recipe version item', error));
    }
  };

  return {
    getProductRecipes,
    createRecipe,
    updateRecipe,
    setDefaultRecipe,
    createRecipeVersion,
    getRecipeVersionDetail,
    updateRecipeVersion,
    addRecipeVersionItem,
    updateRecipeVersionItem,
    deleteRecipeVersionItem,
  };
};

export const createRecipeServiceFromModels = (
  recipeModel: typeof RecipeModel,
  recipeVersionModel: typeof RecipeVersionModel,
  recipeVersionItemModel: typeof RecipeVersionItemModel,
  stockItemModel: typeof StockItemModel,
  stockItemBrandModel: typeof StockItemBrandModel
): RecipeService => {
  const recipeRepository = createRecipeRepository(
    recipeModel,
    recipeVersionModel,
    recipeVersionItemModel
  );

  return createRecipeService({
    recipeRepository,
    stockItemModel,
    stockItemBrandModel,
  });
};
