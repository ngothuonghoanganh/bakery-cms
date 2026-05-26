export enum StockItemStatus {
  AVAILABLE = 'available',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

/**
 * Canonical stock unit type
 * - piece: inventory tracked by each unit
 * - weight: inventory tracked by gram
 * - volume: inventory tracked by milliliter
 */
export enum StockUnitType {
  PIECE = 'piece',
  WEIGHT = 'weight',
  VOLUME = 'volume',
}

/**
 * Purchase unit for stock brand pricing input
 */
export enum StockPurchaseUnit {
  PIECE = 'piece',
  GRAM = 'gram',
  KILOGRAM = 'kilogram',
  MILLILITER = 'milliliter',
  LITER = 'liter',
}

export enum RecipeStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum RecipeVersionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum CostingMethod {
  PREFERRED_BRAND_PRICE = 'preferred_brand_price',
}

export enum MovementType {
  RECEIVED = 'received',
  USED = 'used',
  ADJUSTED = 'adjusted',
  DAMAGED = 'damaged',
  EXPIRED = 'expired',
}

export const isValidStockUnitType = (value: string): value is StockUnitType => {
  return Object.values(StockUnitType).includes(value as StockUnitType);
};

export const isValidStockPurchaseUnit = (
  value: string
): value is StockPurchaseUnit => {
  return Object.values(StockPurchaseUnit).includes(value as StockPurchaseUnit);
};

export const isValidRecipeStatus = (value: string): value is RecipeStatus => {
  return Object.values(RecipeStatus).includes(value as RecipeStatus);
};

export const isValidRecipeVersionStatus = (
  value: string
): value is RecipeVersionStatus => {
  return Object.values(RecipeVersionStatus).includes(
    value as RecipeVersionStatus
  );
};

export const isValidCostingMethod = (value: string): value is CostingMethod => {
  return Object.values(CostingMethod).includes(value as CostingMethod);
};
