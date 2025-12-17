/**
 * Error handling utilities
 * Centralized error handling and transformation
 */

import type { AppError } from '@/types/common/error.types';
import { extractErrorFromAxiosError } from '@/services/api/client';

/**
 * Handle API errors and convert to AppError
 */
export const handleAPIError = (error: unknown): AppError => {
  return extractErrorFromAxiosError(error);
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: AppError): string => {
  if (error.details && error.details.length > 0) {
    return `${error.message}: ${error.details.map((d) => d.message).join(', ')}`;
  }
  return error.message;
};

/**
 * Check if error is a specific type
 */
export const isErrorCode = (error: AppError, code: string): boolean => {
  return error.code === code;
};
