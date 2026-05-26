import {
  CostingMethod,
  RecipeStatus,
  RecipeVersionStatus,
  StockPurchaseUnit,
} from '@bakery-cms/common';

export interface RecipeResponseDto {
  id: string;
  productId: string;
  name: string;
  isDefault: boolean;
  status: RecipeStatus;
  note: string | null;
  versions?: RecipeVersionResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeVersionResponseDto {
  id: string;
  recipeId: string;
  versionNumber: number;
  status: RecipeVersionStatus;
  yieldQuantity: number;
  yieldUnit: StockPurchaseUnit;
  yieldBaseQuantity: number;
  yieldBaseUnit: StockPurchaseUnit;
  estimatedCost: number;
  costingMethod: CostingMethod;
  effectiveFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeVersionItemResponseDto {
  id: string;
  recipeVersionId: string;
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  unit: StockPurchaseUnit;
  baseQuantity: number;
  baseUnit: StockPurchaseUnit;
  wastePercent: number;
  preferredBrandId: string | null;
  preferredBrandName: string | null;
  unitCostSnapshot: number;
  totalCostSnapshot: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeWithVersionsResponseDto extends RecipeResponseDto {
  versions: RecipeVersionResponseDto[];
}

export interface RecipeVersionDetailResponseDto extends RecipeVersionResponseDto {
  items: RecipeVersionItemResponseDto[];
}

export interface CreateRecipeDto {
  name: string;
  isDefault?: boolean;
  status?: RecipeStatus;
  note?: string;
}

export interface UpdateRecipeDto {
  name?: string;
  isDefault?: boolean;
  status?: RecipeStatus;
  note?: string | null;
}

export interface CreateRecipeVersionDto {
  status?: RecipeVersionStatus;
  yieldQuantity: number;
  yieldUnit: StockPurchaseUnit;
  effectiveFrom?: string | null;
}

export interface UpdateRecipeVersionDto {
  status?: RecipeVersionStatus;
  yieldQuantity?: number;
  yieldUnit?: StockPurchaseUnit;
  effectiveFrom?: string | null;
}

export interface CreateRecipeVersionItemDto {
  stockItemId: string;
  quantity: number;
  unit: StockPurchaseUnit;
  wastePercent?: number;
  preferredBrandId?: string | null;
  note?: string | null;
}

export interface UpdateRecipeVersionItemDto {
  quantity?: number;
  unit?: StockPurchaseUnit;
  wastePercent?: number;
  preferredBrandId?: string | null;
  note?: string | null;
}

export interface SetDefaultRecipeDto {
  recipeId: string;
}
