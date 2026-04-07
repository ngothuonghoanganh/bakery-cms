/**
 * Product-related enumerations
 */

/**
 * Business type determines how the product is sold
 */
export enum BusinessType {
  MADE_TO_ORDER = 'made-to-order',
  READY_TO_SELL = 'ready-to-sell',
  BOTH = 'both',
}

/**
 * Product availability status
 */
export enum ProductStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out-of-stock',
}

/**
 * Product type
 * - single: standalone product
 * - combo: bundle of multiple products with custom quantities
 */
export enum ProductType {
  SINGLE = 'single',
  COMBO = 'combo',
}

/**
 * Sale unit type
 * - piece: sold by item count
 * - weight: sold by weight (price is stored per 100g)
 */
export enum SaleUnitType {
  PIECE = 'piece',
  WEIGHT = 'weight',
}

/**
 * Helper to check if a value is a valid BusinessType
 */
export const isValidBusinessType = (value: string): value is BusinessType => {
  return Object.values(BusinessType).includes(value as BusinessType);
};

/**
 * Helper to check if a value is a valid ProductStatus
 */
export const isValidProductStatus = (value: string): value is ProductStatus => {
  return Object.values(ProductStatus).includes(value as ProductStatus);
};

/**
 * Helper to check if a value is a valid ProductType
 */
export const isValidProductType = (value: string): value is ProductType => {
  return Object.values(ProductType).includes(value as ProductType);
};

/**
 * Helper to check if a value is a valid SaleUnitType
 */
export const isValidSaleUnitType = (value: string): value is SaleUnitType => {
  return Object.values(SaleUnitType).includes(value as SaleUnitType);
};
