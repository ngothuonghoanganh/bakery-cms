/**
 * Payment-related enumerations
 */

/**
 * Payment method options
 */
export enum PaymentMethod {
  CASH = 'cash',
  VIETQR = 'vietqr',
  BANK_TRANSFER = 'bank-transfer',
}

/**
 * Payment status lifecycle
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Helper to check if a value is a valid PaymentMethod
 */
export const isValidPaymentMethod = (value: string): value is PaymentMethod => {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
};

/**
 * Helper to check if a value is a valid PaymentStatus
 */
export const isValidPaymentStatus = (value: string): value is PaymentStatus => {
  return Object.values(PaymentStatus).includes(value as PaymentStatus);
};
