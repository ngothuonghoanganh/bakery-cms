/**
 * Result type helpers
 * Utility functions for working with Result types from neverthrow
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';

/**
 * Re-export Result type and constructors for convenience
 */
export { Result, ok, err };
export type { Ok, Err } from 'neverthrow';

/**
 * Extract value from Result or throw error
 * Use only when you're certain the Result is Ok
 */
export const unwrapResult = <T, E>(result: Result<T, E>): T => {
  if (result.isOk()) {
    return result.value;
  }
  throw result.error;
};

/**
 * Extract error from Result or throw
 * Use only when you're certain the Result is Err
 */
export const unwrapError = <T, E>(result: Result<T, E>): E => {
  if (result.isErr()) {
    return result.error;
  }
  throw new Error('Cannot unwrap error from Ok result');
};

/**
 * Convert Result to nullable value
 * Returns value if Ok, null if Err
 */
export const resultToNullable = <T, E>(result: Result<T, E>): T | null => {
  return result.isOk() ? result.value : null;
};

/**
 * Convert nullable value to Result
 * Returns Ok if value is not null, Err if null
 */
export const nullableToResult = <T>(
  value: T | null,
  error: AppError
): Result<T, AppError> => {
  return value !== null ? ok(value) : err(error);
};

/**
 * Combine multiple Results into a single Result
 * Returns Ok with array of values if all are Ok, otherwise returns first Err
 */
export const combineResults = <T, E>(
  results: readonly Result<T, E>[]
): Result<readonly T[], E> => {
  const values: T[] = [];
  
  for (const result of results) {
    if (result.isErr()) {
      return err(result.error);
    }
    values.push(result.value);
  }
  
  return ok(values);
};

/**
 * Map Result value using async function
 */
export const mapResultAsync = async <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> => {
  if (result.isErr()) {
    return err(result.error);
  }
  try {
    const newValue = await fn(result.value);
    return ok(newValue);
  } catch (error) {
    return result as unknown as Result<U, E>;
  }
};

/**
 * Wrap async function to return Result instead of throwing
 */
export const wrapAsync = <T, Args extends readonly unknown[]>(
  fn: (...args: Args) => Promise<T>,
  errorMapper: (error: unknown) => AppError
): ((...args: Args) => Promise<Result<T, AppError>>) => {
  return async (...args: Args): Promise<Result<T, AppError>> => {
    try {
      const value = await fn(...args);
      return ok(value);
    } catch (error) {
      return err(errorMapper(error));
    }
  };
};

/**
 * Wrap sync function to return Result instead of throwing
 */
export const wrapSync = <T, Args extends readonly unknown[]>(
  fn: (...args: Args) => T,
  errorMapper: (error: unknown) => AppError
): ((...args: Args) => Result<T, AppError>) => {
  return (...args: Args): Result<T, AppError> => {
    try {
      const value = fn(...args);
      return ok(value);
    } catch (error) {
      return err(errorMapper(error));
    }
  };
};
