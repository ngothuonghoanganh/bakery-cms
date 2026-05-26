/**
 * ProductRecipe component types
 */

import type { RecipeStatus } from '@/types/models/stock.model';
import type { StockPurchaseUnit } from '@bakery-cms/common';

export interface ProductRecipeProps {
  productId: string;
  onRecipeChange?: () => void;
}

export interface RecipeFormValues {
  name: string;
  status: RecipeStatus;
  isDefault?: boolean;
  note?: string;
}

export interface RecipeVersionFormValues {
  status: RecipeStatus;
  yieldQuantity: number;
  yieldUnit: StockPurchaseUnit;
  effectiveFrom?: string | null;
}

export interface RecipeVersionItemFormValues {
  stockItemId: string;
  quantity: number;
  unit: StockPurchaseUnit;
  wastePercent?: number;
  preferredBrandId?: string | null;
  note?: string | null;
}
