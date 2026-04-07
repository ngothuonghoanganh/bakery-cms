import { StockPurchaseUnit, StockUnitType } from '@bakery-cms/common';

export const isCompatiblePurchaseUnit = (
  stockUnitType: StockUnitType,
  purchaseUnit: StockPurchaseUnit
): boolean => {
  if (stockUnitType === StockUnitType.PIECE) {
    return purchaseUnit === StockPurchaseUnit.PIECE;
  }

  return (
    purchaseUnit === StockPurchaseUnit.GRAM ||
    purchaseUnit === StockPurchaseUnit.KILOGRAM
  );
};

/**
 * Convert purchase quantity into stock base unit quantity.
 * - piece stock base unit: piece
 * - weight stock base unit: gram
 */
export const toStockBaseQuantity = (
  stockUnitType: StockUnitType,
  purchaseQuantity: number,
  purchaseUnit: StockPurchaseUnit
): number => {
  if (stockUnitType === StockUnitType.PIECE) {
    return purchaseQuantity;
  }

  if (purchaseUnit === StockPurchaseUnit.KILOGRAM) {
    return purchaseQuantity * 1000;
  }

  return purchaseQuantity;
};
