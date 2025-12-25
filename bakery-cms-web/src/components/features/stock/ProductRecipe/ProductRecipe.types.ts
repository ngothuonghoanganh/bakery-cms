/**
 * ProductRecipe component types
 */

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
