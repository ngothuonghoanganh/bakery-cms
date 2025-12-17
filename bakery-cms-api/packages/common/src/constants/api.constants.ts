/**
 * API routes and versioning constants
 */

/**
 * API version
 */
export const API_VERSION = 'v1' as const;

/**
 * API base path prefix
 */
export const API_PREFIX = '/api' as const;

/**
 * Full API base path with version
 */
export const API_BASE_PATH = `${API_PREFIX}/${API_VERSION}` as const;

/**
 * API route paths
 */
export const API_ROUTES = {
  // Products
  PRODUCTS: `${API_BASE_PATH}/products`,
  PRODUCT_BY_ID: `${API_BASE_PATH}/products/:id`,

  // Orders
  ORDERS: `${API_BASE_PATH}/orders`,
  ORDER_BY_ID: `${API_BASE_PATH}/orders/:id`,
  ORDER_CONFIRM: `${API_BASE_PATH}/orders/:id/confirm`,
  ORDER_CANCEL: `${API_BASE_PATH}/orders/:id/cancel`,

  // Payments
  PAYMENTS: `${API_BASE_PATH}/payments`,
  PAYMENT_BY_ID: `${API_BASE_PATH}/payments/:id`,
  PAYMENT_BY_ORDER: `${API_BASE_PATH}/payments/order/:orderId`,
  PAYMENT_MARK_PAID: `${API_BASE_PATH}/payments/:id/paid`,
  PAYMENT_VIETQR: `${API_BASE_PATH}/payments/:id/vietqr`,

  // Health check
  HEALTH: '/health',
} as const;

/**
 * Query parameter names
 */
export const QUERY_PARAMS = {
  PAGE: 'page',
  LIMIT: 'limit',
  SORT: 'sort',
  ORDER: 'order',
  SEARCH: 'search',
  FILTER: 'filter',
} as const;
