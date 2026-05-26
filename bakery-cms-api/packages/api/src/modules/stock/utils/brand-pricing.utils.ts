import { StockPurchaseUnit, StockUnitType } from '@bakery-cms/common';
import { unitConversionService } from '../services/unit-conversion.services';

export const isCompatiblePurchaseUnit = (
  stockUnitType: StockUnitType,
  purchaseUnit: StockPurchaseUnit
): boolean => {
  if (stockUnitType === StockUnitType.PIECE) {
    return purchaseUnit === StockPurchaseUnit.PIECE;
  }

  if (stockUnitType === StockUnitType.VOLUME) {
    return (
      purchaseUnit === StockPurchaseUnit.MILLILITER ||
      purchaseUnit === StockPurchaseUnit.LITER
    );
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
  const converted = unitConversionService.toStockBaseQuantity(
    stockUnitType,
    purchaseQuantity,
    purchaseUnit
  );
  if (converted.isErr()) {
    return NaN;
  }

  return converted.value;
};
