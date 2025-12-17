/**
 * Result type definitions using neverthrow library
 * Provides functional error handling without exceptions
 */

import { Result as NeverthrowResult, Ok, Err, ok, err } from 'neverthrow';

/**
 * Re-export neverthrow's Result type for consistent usage across the application
 */
export type Result<T, E = Error> = NeverthrowResult<T, E>;

/**
 * Re-export constructor functions
 */
export { ok, err };
export type { Ok, Err };

/**
 * Utility type to extract the success value type from a Result
 */
export type ResultValue<R> = R extends Result<infer T, unknown> ? T : never;

/**
 * Utility type to extract the error type from a Result
 */
export type ResultError<R> = R extends Result<unknown, infer E> ? E : never;

/**
 * Type guard to check if a Result is Ok
 */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T, E> => {
  return result.isOk();
};

/**
 * Type guard to check if a Result is Err
 */
export const isErr = <T, E>(result: Result<T, E>): result is Err<T, E> => {
  return result.isErr();
};
