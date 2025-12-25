/**
 * ProductRecipe component types
 */

import type { ProductRecipe, ProductCost, ProductStockItem } from '@/types/models/stock.model';

export interface ProductRecipeProps {
  productId: string;
  onRecipeChange?: () => void;
}

export interface ProductStockItemFormValues {
  stockItemId: string;
  quantity: number;
  preferredBrandId?: string;
  notes?: string;
}
