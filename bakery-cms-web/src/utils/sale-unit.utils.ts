import { SaleUnitType } from '@bakery-cms/common';

export const WEIGHT_ORDER_MIN_GRAM = 100;
export const WEIGHT_ORDER_STEP_GRAM = 100;

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export const calculateOrderItemSubtotal = (
  quantity: number,
  unitPrice: number,
  saleUnitType: SaleUnitType
): number => {
  if (saleUnitType === SaleUnitType.WEIGHT) {
    return roundMoney((quantity / 100) * unitPrice);
  }

  return roundMoney(quantity * unitPrice);
};

export const getQuantityRuleBySaleUnit = (
  saleUnitType: SaleUnitType
): { min: number; step: number } => {
  if (saleUnitType === SaleUnitType.WEIGHT) {
    return {
      min: WEIGHT_ORDER_MIN_GRAM,
      step: WEIGHT_ORDER_STEP_GRAM,
    };
  }

  return {
    min: 1,
    step: 1,
  };
};

export const isValidQuantityBySaleUnit = (
  quantity: number,
  saleUnitType: SaleUnitType
): boolean => {
  if (!Number.isInteger(quantity)) {
    return false;
  }

  if (saleUnitType === SaleUnitType.WEIGHT) {
    return quantity >= WEIGHT_ORDER_MIN_GRAM && quantity % WEIGHT_ORDER_STEP_GRAM === 0;
  }

  return quantity >= 1;
};

export const getSaleUnitPriceSuffix = (saleUnitType: SaleUnitType): string => {
  return saleUnitType === SaleUnitType.WEIGHT ? '/100g' : '/cái';
};

export const formatSaleQuantity = (
  quantity: number,
  saleUnitType: SaleUnitType
): string => {
  return saleUnitType === SaleUnitType.WEIGHT ? `${quantity} g` : `${quantity} cái`;
};
