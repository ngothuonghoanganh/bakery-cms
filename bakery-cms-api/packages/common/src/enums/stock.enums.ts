export enum StockItemStatus {
  AVAILABLE = 'available',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

/**
 * Canonical stock unit type
 * - piece: inventory tracked by each unit
 * - weight: inventory tracked by gram
 */
export enum StockUnitType {
  PIECE = 'piece',
  WEIGHT = 'weight',
}

/**
 * Purchase unit for stock brand pricing input
 */
export enum StockPurchaseUnit {
  PIECE = 'piece',
  GRAM = 'gram',
  KILOGRAM = 'kilogram',
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
