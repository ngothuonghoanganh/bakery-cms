import { SaleUnitType } from '@bakery-cms/common';

const toMoney = (value: number): number => Math.round(value * 100) / 100;

/**
 * Calculate subtotal for one order item by sale unit type.
 * - piece: quantity * unitPrice
 * - weight: (quantity gram / 100) * unitPrice (unitPrice is VND/100g)
 */
export const calculateOrderItemSubtotal = (
  quantity: number,
  unitPrice: number,
  saleUnitType: SaleUnitType = SaleUnitType.PIECE
): number => {
  if (saleUnitType === SaleUnitType.WEIGHT) {
    return toMoney((quantity / 100) * unitPrice);
  }

  return toMoney(quantity * unitPrice);
};
