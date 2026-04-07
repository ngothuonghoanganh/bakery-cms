import { describe, expect, it } from 'vitest';
import { SaleUnitType } from '@bakery-cms/common';
import {
  calculateOrderItemSubtotal,
  formatSaleQuantity,
  getQuantityRuleBySaleUnit,
  getSaleUnitPriceSuffix,
  isValidQuantityBySaleUnit,
} from './sale-unit.utils';

describe('sale-unit.utils', () => {
  it('calculates subtotal for piece unit', () => {
    expect(
      calculateOrderItemSubtotal(4, 18000, SaleUnitType.PIECE)
    ).toBe(72000);
  });

  it('calculates subtotal for weight unit by 100g price', () => {
    expect(
      calculateOrderItemSubtotal(500, 12000, SaleUnitType.WEIGHT)
    ).toBe(60000);
  });

  it('returns correct quantity rule for weight', () => {
    expect(getQuantityRuleBySaleUnit(SaleUnitType.WEIGHT)).toEqual({
      min: 100,
      step: 100,
    });
  });

  it('validates weight quantity as integer and 100g step', () => {
    expect(isValidQuantityBySaleUnit(500, SaleUnitType.WEIGHT)).toBe(true);
    expect(isValidQuantityBySaleUnit(550, SaleUnitType.WEIGHT)).toBe(false);
    expect(isValidQuantityBySaleUnit(99, SaleUnitType.WEIGHT)).toBe(false);
  });

  it('formats suffix and quantity label correctly', () => {
    expect(getSaleUnitPriceSuffix(SaleUnitType.PIECE)).toBe('/cái');
    expect(getSaleUnitPriceSuffix(SaleUnitType.WEIGHT)).toBe('/100g');
    expect(formatSaleQuantity(3, SaleUnitType.PIECE)).toBe('3 cái');
    expect(formatSaleQuantity(400, SaleUnitType.WEIGHT)).toBe('400 g');
  });
});
