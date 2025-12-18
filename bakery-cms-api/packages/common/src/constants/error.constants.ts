/**
 * Error messages and error codes
 */

import { ErrorCode } from '../types/error.types';

/**
 * Standard error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',

  // Authentication/Authorization errors
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.FORBIDDEN]: 'Access forbidden',
  [ErrorCode.INVALID_TOKEN]: 'Invalid or expired token',
  [ErrorCode.TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCode.TOKEN_INVALID]: 'Token is invalid',
  [ErrorCode.TOKEN_GENERATION_FAILED]: 'Failed to generate token',
  [ErrorCode.TOKEN_VERIFICATION_FAILED]: 'Token verification failed',
  [ErrorCode.TOKEN_MISSING]: 'Token is missing',
  [ErrorCode.AUTHORIZATION_HEADER_MISSING]: 'Authorization header is missing',
  [ErrorCode.AUTHORIZATION_HEADER_INVALID]: 'Authorization header format is invalid',

  // Resource errors
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.CONFLICT]: 'Resource conflict occurred',

  // Business logic errors
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Business rule violation',
  [ErrorCode.INVALID_STATE_TRANSITION]: 'Invalid state transition',
  [ErrorCode.INSUFFICIENT_QUANTITY]: 'Insufficient quantity available',

  // Server errors
  [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',

  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests, please try again later',
} as const;

/**
 * Field-specific validation error messages
 */
export const FIELD_ERROR_MESSAGES = {
  REQUIRED: (field: string): string => `${field} is required`,
  INVALID_FORMAT: (field: string): string => `${field} has invalid format`,
  TOO_LONG: (field: string, max: number): string => `${field} must not exceed ${max} characters`,
  TOO_SHORT: (field: string, min: number): string => `${field} must be at least ${min} characters`,
  OUT_OF_RANGE: (field: string, min: number, max: number): string =>
    `${field} must be between ${min} and ${max}`,
  INVALID_ENUM: (field: string, values: readonly string[]): string =>
    `${field} must be one of: ${values.join(', ')}`,
} as const;

/**
 * Entity-specific error messages
 */
export const ENTITY_ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Product not found',
  ORDER_NOT_FOUND: 'Order not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
  
  PRODUCT_OUT_OF_STOCK: 'Product is out of stock',
  ORDER_ALREADY_PAID: 'Order has already been paid',
  ORDER_ALREADY_CANCELLED: 'Order has already been cancelled',
  PAYMENT_ALREADY_PAID: 'Payment has already been processed',
  
  INVALID_ORDER_STATUS: 'Invalid order status transition',
  EMPTY_ORDER: 'Order must contain at least one item',
  INVALID_QUANTITY: 'Quantity must be greater than zero',
} as const;
