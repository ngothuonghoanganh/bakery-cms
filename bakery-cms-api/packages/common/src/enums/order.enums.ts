/**
 * Order-related enumerations
 */

/**
 * Order status represents the lifecycle state
 */
export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

/**
 * Order type determines if the order is temporary or official
 */
export enum OrderType {
  TEMPORARY = 'temporary',
  OFFICIAL = 'official',
}

/**
 * Business model for the order
 */
export enum BusinessModel {
  MADE_TO_ORDER = 'made-to-order',
  READY_TO_SELL = 'ready-to-sell',
}

/**
 * Helper to check if a value is a valid OrderStatus
 */
export const isValidOrderStatus = (value: string): value is OrderStatus => {
  return Object.values(OrderStatus).includes(value as OrderStatus);
};

/**
 * Helper to check if a value is a valid OrderType
 */
export const isValidOrderType = (value: string): value is OrderType => {
  return Object.values(OrderType).includes(value as OrderType);
};

/**
 * Helper to check if a value is a valid BusinessModel
 */
export const isValidBusinessModel = (value: string): value is BusinessModel => {
  return Object.values(BusinessModel).includes(value as BusinessModel);
};

/**
 * Helper to validate order status transitions
 */
export const isValidStatusTransition = (from: OrderStatus, to: OrderStatus): boolean => {
  const validTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [], // Terminal state
    [OrderStatus.CANCELLED]: [], // Terminal state
  };

  return validTransitions[from].includes(to);
};
