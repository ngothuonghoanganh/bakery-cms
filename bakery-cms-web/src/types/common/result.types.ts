/**
 * Result type for functional error handling
 * Simplified version compatible with backend Result pattern
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export type Success<T> = {
  readonly success: true;
  readonly data: T;
};

export type Failure<E> = {
  readonly success: false;
  readonly error: E;
};

/**
 * Constructor functions for Result type
 */
export const ok = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

export const err = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});

/**
 * Type guard to check if Result is Success
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => {
  return result.success === true;
};

/**
 * Type guard to check if Result is Failure
 */
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => {
  return result.success === false;
};

/**
 * Utility type to extract the success value type from a Result
 */
export type ResultValue<R> = R extends Result<infer T, unknown> ? T : never;

/**
 * Utility type to extract the error type from a Result
 */
export type ResultError<R> = R extends Result<unknown, infer E> ? E : never;
