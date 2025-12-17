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
