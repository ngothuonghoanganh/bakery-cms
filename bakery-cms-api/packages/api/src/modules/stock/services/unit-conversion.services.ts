import { Result, err, ok } from 'neverthrow';
import {
  AppError,
  SaleUnitType,
  StockPurchaseUnit,
  StockUnitType,
} from '@bakery-cms/common';
import { createInvalidInputError } from '../../../utils/error-factory';

const toNormalizedQuantity = (value: number): number => {
  return Math.round(value * 1_000_000) / 1_000_000;
};

const assertPositiveQuantity = (quantity: number): Result<number, AppError> => {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return err(createInvalidInputError('Quantity must be a positive number'));
  }

  return ok(quantity);
};

const getConversionFactor = (
  from: StockPurchaseUnit,
  to: StockPurchaseUnit
): number | null => {
  if (from === to) {
    return 1;
  }

  if (from === StockPurchaseUnit.KILOGRAM && to === StockPurchaseUnit.GRAM) {
    return 1000;
  }

  if (from === StockPurchaseUnit.LITER && to === StockPurchaseUnit.MILLILITER) {
    return 1000;
  }

  return null;
};

const getStockBaseUnit = (unitType: StockUnitType): StockPurchaseUnit => {
  if (unitType === StockUnitType.WEIGHT) {
    return StockPurchaseUnit.GRAM;
  }
  if (unitType === StockUnitType.VOLUME) {
    return StockPurchaseUnit.MILLILITER;
  }
  return StockPurchaseUnit.PIECE;
};

const getDefaultSaleUnit = (saleUnitType: SaleUnitType): StockPurchaseUnit => {
  if (saleUnitType === SaleUnitType.WEIGHT) {
    return StockPurchaseUnit.GRAM;
  }
  return StockPurchaseUnit.PIECE;
};

export interface UnitConversionService {
  convert(
    quantity: number,
    from: StockPurchaseUnit,
    to: StockPurchaseUnit
  ): Result<number, AppError>;
  toStockBaseQuantity(
    unitType: StockUnitType,
    quantity: number,
    unit: StockPurchaseUnit
  ): Result<number, AppError>;
  resolveStockBaseUnit(unitType: StockUnitType): StockPurchaseUnit;
  resolveDefaultSaleUnit(saleUnitType: SaleUnitType): StockPurchaseUnit;
}

export const createUnitConversionService = (): UnitConversionService => {
  const convert = (
    quantity: number,
    from: StockPurchaseUnit,
    to: StockPurchaseUnit
  ): Result<number, AppError> => {
    const quantityResult = assertPositiveQuantity(quantity);
    if (quantityResult.isErr()) {
      return err(quantityResult.error);
    }

    const factor = getConversionFactor(from, to);
    if (factor === null) {
      return err(
        createInvalidInputError(
          `Invalid unit conversion: ${from} -> ${to}`
        )
      );
    }

    return ok(toNormalizedQuantity(quantityResult.value * factor));
  };

  const toStockBaseQuantity = (
    unitType: StockUnitType,
    quantity: number,
    unit: StockPurchaseUnit
  ): Result<number, AppError> => {
    return convert(quantity, unit, getStockBaseUnit(unitType));
  };

  return {
    convert,
    toStockBaseQuantity,
    resolveStockBaseUnit: getStockBaseUnit,
    resolveDefaultSaleUnit: getDefaultSaleUnit,
  };
};

export const unitConversionService = createUnitConversionService();
