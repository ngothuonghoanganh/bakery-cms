/**
 * Global error handling middleware
 * Catches and formats all errors in a consistent way
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '@bakery-cms/common';
import { getLogger } from '../utils/logger';
import { getAppConfig } from '../config/app';

/**
 * Error response type
 */
type ErrorResponse = {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
    readonly timestamp: string;
    readonly path?: string;
  };
};

/**
 * Check if error is AppError
 */
const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'statusCode' in error
  );
};

/**
 * Format error response
 * Pure function that transforms AppError to response format
 */
const formatErrorResponse = (error: AppError, path: string): ErrorResponse => {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp.toISOString(),
      path,
    },
  };
};

/**
 * Convert unknown error to AppError
 */
const toAppError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
      statusCode: 500,
      timestamp: new Date(),
    };
  }
  
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date(),
  };
};

/**
 * Global error handler middleware
 * Catches all errors and sends consistent error responses
 */
export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const logger = getLogger();
  const config = getAppConfig();
  const appError = toAppError(error);
  
  // Log error
  logger.error('Request error', {
    code: appError.code,
    message: appError.message,
    path: req.path,
    method: req.method,
    statusCode: appError.statusCode,
    details: appError.details,
  });
  
  // Format response
  const response = formatErrorResponse(appError, req.path);
  
  // Add stack trace in development
  if (config.isDevelopment && error instanceof Error) {
    Object.assign(response.error, { stack: error.stack });
  }
  
  // Send response
  res.status(appError.statusCode).json(response);
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  const error: AppError = {
    code: ErrorCode.NOT_FOUND,
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
    timestamp: new Date(),
  };
  
  const response = formatErrorResponse(error, req.path);
  res.status(404).json(response);
};
