/**
 * Error types matching backend error structure
 */

// Using const object instead of enum for erasableSyntaxOnly compatibility
export const ErrorCode = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Authentication/Authorization errors (401, 403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Resource errors (404, 409)
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business logic errors (422)
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  INSUFFICIENT_QUANTITY: 'INSUFFICIENT_QUANTITY',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Network errors (client-side)
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export type ValidationErrorDetail = {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
};

export type AppError = {
  readonly code: ErrorCode;
  readonly message: string;
  readonly statusCode: number;
  readonly details?: readonly ValidationErrorDetail[];
  readonly timestamp: Date;
  readonly path?: string;
};

/**
 * Create a validation error
 */
export const createValidationError = (
  message: string,
  details?: readonly ValidationErrorDetail[]
): AppError => ({
  code: ErrorCode.VALIDATION_ERROR,
  message,
  statusCode: 400,
  details,
  timestamp: new Date(),
});

/**
 * Create a not found error
 */
export const createNotFoundError = (resource: string, id?: string): AppError => ({
  code: ErrorCode.NOT_FOUND,
  message: id ? `${resource} with id '${id}' not found` : `${resource} not found`,
  statusCode: 404,
  timestamp: new Date(),
});

/**
 * Create a network error
 */
export const createNetworkError = (message: string = 'Network error occurred'): AppError => ({
  code: ErrorCode.NETWORK_ERROR,
  message,
  statusCode: 0,
  timestamp: new Date(),
});

/**
 * Create an internal error
 */
export const createInternalError = (message: string = 'An internal error occurred'): AppError => ({
  code: ErrorCode.INTERNAL_ERROR,
  message,
  statusCode: 500,
  timestamp: new Date(),
});
