/**
 * Error factory functions
 * Pure functions for creating standardized errors
 */

import { AppError, ErrorCode, ValidationErrorDetail } from '@bakery-cms/common';

/**
 * Extract database error details (development only)
 */
const getDatabaseErrorDetails = (
  error: unknown
): readonly ValidationErrorDetail[] | undefined => {
  const nodeEnv = process.env['NODE_ENV'] || 'development';

  if (nodeEnv !== 'development') {
    return undefined;
  }

  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const anyError = error as {
    name?: string;
    message?: string;
    errors?: Array<{
      path?: string;
      attribute?: string;
      message?: string;
      value?: unknown;
    }>;
    fields?: unknown;
    index?: string;
    table?: string;
    value?: unknown;
    sql?: string;
    parent?: {
      code?: string;
      errno?: number;
      sqlMessage?: string;
      sqlState?: string;
      sql?: string;
    };
    original?: {
      code?: string;
      errno?: number;
      sqlMessage?: string;
      sqlState?: string;
      sql?: string;
    };
  };

  if (
    anyError.name === 'SequelizeValidationError' ||
    anyError.name === 'SequelizeUniqueConstraintError'
  ) {
    if (Array.isArray(anyError.errors)) {
      return anyError.errors.map((item) => ({
        field: item.path || item.attribute || 'unknown',
        message: item.message || 'Validation error',
        value: item.value,
      }));
    }
  }

  if (anyError.name === 'SequelizeForeignKeyConstraintError') {
    return [
      {
        field: anyError.index || anyError.table || 'foreign_key',
        message: anyError.message || 'Foreign key constraint error',
        value: anyError.fields ?? anyError.value,
      },
    ];
  }

  if (
    anyError.name === 'SequelizeDatabaseError' ||
    anyError.name === 'SequelizeConnectionError' ||
    anyError.name === 'SequelizeTimeoutError'
  ) {
    const source = anyError.parent ?? anyError.original;

    return [
      {
        field: 'database',
        message: source?.sqlMessage || anyError.message || 'Database error',
        value: {
          code: source?.code,
          errno: source?.errno,
          sqlState: source?.sqlState,
          sql: source?.sql || anyError.sql,
        },
      },
    ];
  }

  if (error instanceof Error) {
    return [
      {
        field: 'database',
        message: error.message,
      },
    ];
  }

  return undefined;
};

/**
 * Create validation error
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
 * Create not found error
 */
export const createNotFoundError = (resource: string, id?: string): AppError => ({
  code: ErrorCode.NOT_FOUND,
  message: id ? `${resource} with id ${id} not found` : `${resource} not found`,
  statusCode: 404,
  timestamp: new Date(),
});

/**
 * Create database error
 */
export const createDatabaseError = (
  message: string,
  error?: unknown
): AppError => ({
  code: ErrorCode.DATABASE_ERROR,
  message,
  statusCode: 500,
  details: getDatabaseErrorDetails(error),
  timestamp: new Date(),
});

/**
 * Create authentication error
 */
export const createAuthenticationError = (message: string = 'Authentication required'): AppError => ({
  code: ErrorCode.UNAUTHORIZED,
  message,
  statusCode: 401,
  timestamp: new Date(),
});

/**
 * Create authorization error
 */
export const createAuthorizationError = (message: string = 'Insufficient permissions'): AppError => ({
  code: ErrorCode.FORBIDDEN,
  message,
  statusCode: 403,
  timestamp: new Date(),
});

/**
 * Create conflict error
 */
export const createConflictError = (message: string, details?: readonly ValidationErrorDetail[]): AppError => ({
  code: ErrorCode.CONFLICT,
  message,
  statusCode: 409,
  details,
  timestamp: new Date(),
});

/**
 * Create invalid input error
 */
export const createInvalidInputError = (message: string, details?: readonly ValidationErrorDetail[]): AppError => ({
  code: ErrorCode.INVALID_INPUT,
  message,
  statusCode: 400,
  details,
  timestamp: new Date(),
});

/**
 * Create internal server error
 */
export const createInternalError = (message: string = 'Internal server error'): AppError => ({
  code: ErrorCode.INTERNAL_ERROR,
  message,
  statusCode: 500,
  timestamp: new Date(),
});

/**
 * Create business rule error
 */
export const createBusinessRuleError = (message: string): AppError => ({
  code: ErrorCode.BUSINESS_RULE_VIOLATION,
  message,
  statusCode: 422,
  timestamp: new Date(),
});

/**
 * Create rate limit error
 */
export const createRateLimitError = (message: string = 'Too many requests'): AppError => ({
  code: ErrorCode.RATE_LIMIT_EXCEEDED,
  message,
  statusCode: 429,
  timestamp: new Date(),
});

/**
 * Map database error to AppError
 */
export const mapDatabaseError = (error: unknown): AppError => {
  const details = getDatabaseErrorDetails(error);

  if (error instanceof Error) {
    // Sequelize unique constraint violation
    if ('name' in error && error.name === 'SequelizeUniqueConstraintError') {
      return createConflictError('Resource already exists', details);
    }
    
    // Sequelize foreign key constraint violation
    if ('name' in error && error.name === 'SequelizeForeignKeyConstraintError') {
      return createInvalidInputError('Invalid reference', details);
    }
    
    // Sequelize validation error
    if ('name' in error && error.name === 'SequelizeValidationError') {
      return createValidationError('Validation failed', details);
    }
    
    // Generic database error
    return createDatabaseError(error.message, error);
  }
  
  return createInternalError('Unknown database error');
};
