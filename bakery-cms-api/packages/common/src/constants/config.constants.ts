/**
 * Configuration constants
 * Application-wide configuration values
 */

/**
 * Maximum number of items allowed in a single order
 */
export const MAX_ORDER_ITEMS = 50 as const;

/**
 * Default page size for paginated results
 */
export const DEFAULT_PAGE_SIZE = 20 as const;

/**
 * Maximum page size for paginated results
 */
export const MAX_PAGE_SIZE = 100 as const;

/**
 * Minimum page size for paginated results
 */
export const MIN_PAGE_SIZE = 1 as const;

/**
 * Order number prefix
 */
export const ORDER_NUMBER_PREFIX = 'ORD' as const;

/**
 * Maximum allowed product price
 */
export const MAX_PRODUCT_PRICE = 10000000 as const; // 10 million VND

/**
 * Minimum allowed product price
 */
export const MIN_PRODUCT_PRICE = 0 as const;

/**
 * Maximum length for text fields
 */
export const MAX_TEXT_LENGTH = 1000 as const;

/**
 * Maximum length for short text fields
 */
export const MAX_SHORT_TEXT_LENGTH = 255 as const;

/**
 * UUID regex pattern
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Phone number regex pattern (Vietnamese format)
 */
export const PHONE_PATTERN = /^(\+84|0)[0-9]{9,10}$/;
