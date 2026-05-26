import { StockPurchaseUnit, StockUnitType } from '@bakery-cms/common';
import {
  isCompatiblePurchaseUnit,
  toStockBaseQuantity,
} from './brand-pricing.utils';

describe('brand-pricing.utils', () => {
  describe('isCompatiblePurchaseUnit', () => {
    it('accepts piece purchase unit for piece stock unit', () => {
      expect(
        isCompatiblePurchaseUnit(StockUnitType.PIECE, StockPurchaseUnit.PIECE)
      ).toBe(true);
    });

    it('rejects gram purchase unit for piece stock unit', () => {
      expect(
        isCompatiblePurchaseUnit(StockUnitType.PIECE, StockPurchaseUnit.GRAM)
      ).toBe(false);
    });

    it('accepts gram and kilogram purchase units for weight stock unit', () => {
      expect(
        isCompatiblePurchaseUnit(StockUnitType.WEIGHT, StockPurchaseUnit.GRAM)
      ).toBe(true);
      expect(
        isCompatiblePurchaseUnit(
          StockUnitType.WEIGHT,
          StockPurchaseUnit.KILOGRAM
        )
      ).toBe(true);
    });

    it('accepts milliliter and liter purchase units for volume stock unit', () => {
      expect(
        isCompatiblePurchaseUnit(
          StockUnitType.VOLUME,
          StockPurchaseUnit.MILLILITER
        )
      ).toBe(true);
      expect(
        isCompatiblePurchaseUnit(StockUnitType.VOLUME, StockPurchaseUnit.LITER)
      ).toBe(true);
    });
  });

  describe('toStockBaseQuantity', () => {
    it('keeps piece quantity as-is', () => {
      expect(
        toStockBaseQuantity(
          StockUnitType.PIECE,
          12,
          StockPurchaseUnit.PIECE
        )
      ).toBe(12);
    });

    it('keeps gram quantity as-is for weight stock', () => {
      expect(
        toStockBaseQuantity(
          StockUnitType.WEIGHT,
          750,
          StockPurchaseUnit.GRAM
        )
      ).toBe(750);
    });

    it('converts kilogram quantity to gram for weight stock', () => {
      expect(
        toStockBaseQuantity(
          StockUnitType.WEIGHT,
          25,
          StockPurchaseUnit.KILOGRAM
        )
      ).toBe(25000);
    });

    it('converts liter quantity to milliliter for volume stock', () => {
      expect(
        toStockBaseQuantity(
          StockUnitType.VOLUME,
          2.5,
          StockPurchaseUnit.LITER
        )
      ).toBe(2500);
    });
  });
});
