/**
 * Error factory functions
 * Pure functions for creating standardized errors
 */

import { AppError, ErrorCode, ValidationErrorDetail } from '@bakery-cms/common';

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
export const createDatabaseError = (message: string): AppError => ({
  code: ErrorCode.DATABASE_ERROR,
  message,
  statusCode: 500,
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
  if (error instanceof Error) {
    // Sequelize unique constraint violation
    if ('name' in error && error.name === 'SequelizeUniqueConstraintError') {
      return createConflictError('Resource already exists');
    }
    
    // Sequelize foreign key constraint violation
    if ('name' in error && error.name === 'SequelizeForeignKeyConstraintError') {
      return createInvalidInputError('Invalid reference');
    }
    
    // Sequelize validation error
    if ('name' in error && error.name === 'SequelizeValidationError') {
      return createValidationError('Validation failed');
    }
    
    // Generic database error
    return createDatabaseError(error.message);
  }
  
  return createInternalError('Unknown database error');
};
