import { SaleUnitType } from '@bakery-cms/common';
import { calculateOrderItemSubtotal } from './order-pricing.utils';

describe('order-pricing.utils', () => {
  describe('calculateOrderItemSubtotal', () => {
    it('calculates subtotal for piece unit as quantity * unitPrice', () => {
      const subtotal = calculateOrderItemSubtotal(
        3,
        25000,
        SaleUnitType.PIECE
      );

      expect(subtotal).toBe(75000);
    });

    it('calculates subtotal for weight unit as (quantity / 100) * unitPrice', () => {
      const subtotal = calculateOrderItemSubtotal(
        500,
        12000,
        SaleUnitType.WEIGHT
      );

      expect(subtotal).toBe(60000);
    });

    it('rounds to 2 decimal places for fractional results', () => {
      const subtotal = calculateOrderItemSubtotal(
        333,
        10001,
        SaleUnitType.WEIGHT
      );

      expect(subtotal).toBe(33303.33);
    });
  });
});
