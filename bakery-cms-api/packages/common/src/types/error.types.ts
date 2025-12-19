/**
 * Error types and error handling utilities
 * Provides structured error handling across the application
 */

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Authentication/Authorization errors (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_GENERATION_FAILED = 'TOKEN_GENERATION_FAILED',
  TOKEN_VERIFICATION_FAILED = 'TOKEN_VERIFICATION_FAILED',
  TOKEN_MISSING = 'TOKEN_MISSING',
  AUTHORIZATION_HEADER_MISSING = 'AUTHORIZATION_HEADER_MISSING',
  AUTHORIZATION_HEADER_INVALID = 'AUTHORIZATION_HEADER_INVALID',

  // Resource errors (404, 409)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Business logic errors (422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  INSUFFICIENT_QUANTITY = 'INSUFFICIENT_QUANTITY',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * Validation error detail for field-level errors
 */
export type ValidationErrorDetail = {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
};

/**
 * Application error type with structured information
 */
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
export const createNotFoundError = (
  resource: string,
  id?: string
): AppError => ({
  code: ErrorCode.NOT_FOUND,
  message: id ? `${resource} with id '${id}' not found` : `${resource} not found`,
  statusCode: 404,
  timestamp: new Date(),
});

/**
 * Create a conflict error
 */
export const createConflictError = (
  message: string
): AppError => ({
  code: ErrorCode.CONFLICT,
  message,
  statusCode: 409,
  timestamp: new Date(),
});

/**
 * Create a business rule violation error
 */
export const createBusinessRuleError = (
  message: string
): AppError => ({
  code: ErrorCode.BUSINESS_RULE_VIOLATION,
  message,
  statusCode: 422,
  timestamp: new Date(),
});

/**
 * Create an internal server error
 */
export const createInternalError = (
  message: string = 'An internal error occurred'
): AppError => ({
  code: ErrorCode.INTERNAL_ERROR,
  message,
  statusCode: 500,
  timestamp: new Date(),
});

/**
 * Create a database error
 */
export const createDatabaseError = (
  message: string = 'A database error occurred'
): AppError => ({
  code: ErrorCode.DATABASE_ERROR,
  message,
  statusCode: 500,
  timestamp: new Date(),
});

/**
 * Create an unauthorized error (401)
 */
export const createUnauthorizedError = (
  message: string = 'Authentication required'
): AppError => ({
  code: ErrorCode.UNAUTHORIZED,
  message,
  statusCode: 401,
  timestamp: new Date(),
});

/**
 * Create a forbidden error (403)
 */
export const createForbiddenError = (
  message: string = 'Access forbidden'
): AppError => ({
  code: ErrorCode.FORBIDDEN,
  message,
  statusCode: 403,
  timestamp: new Date(),
});
