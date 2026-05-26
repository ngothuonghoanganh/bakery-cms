import { StockPurchaseUnit } from '@bakery-cms/common';
import { createUnitConversionService } from './unit-conversion.services';

describe('unit-conversion.services', () => {
  const service = createUnitConversionService();

  it('converts kilogram to gram', () => {
    const result = service.convert(
      2,
      StockPurchaseUnit.KILOGRAM,
      StockPurchaseUnit.GRAM
    );
    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }
    expect(result.value).toBe(2000);
  });

  it('keeps gram to gram', () => {
    const result = service.convert(
      150,
      StockPurchaseUnit.GRAM,
      StockPurchaseUnit.GRAM
    );
    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }
    expect(result.value).toBe(150);
  });

  it('converts liter to milliliter', () => {
    const result = service.convert(
      1.5,
      StockPurchaseUnit.LITER,
      StockPurchaseUnit.MILLILITER
    );
    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }
    expect(result.value).toBe(1500);
  });

  it('keeps milliliter to milliliter', () => {
    const result = service.convert(
      275,
      StockPurchaseUnit.MILLILITER,
      StockPurchaseUnit.MILLILITER
    );
    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }
    expect(result.value).toBe(275);
  });

  it('keeps piece to piece', () => {
    const result = service.convert(
      12,
      StockPurchaseUnit.PIECE,
      StockPurchaseUnit.PIECE
    );
    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }
    expect(result.value).toBe(12);
  });

  it('rejects gram to milliliter conversion', () => {
    const result = service.convert(
      10,
      StockPurchaseUnit.GRAM,
      StockPurchaseUnit.MILLILITER
    );
    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }
    expect(result.error.message).toContain('Invalid unit conversion');
  });

  it('rejects milliliter to gram conversion', () => {
    const result = service.convert(
      10,
      StockPurchaseUnit.MILLILITER,
      StockPurchaseUnit.GRAM
    );
    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }
    expect(result.error.message).toContain('Invalid unit conversion');
  });
});
