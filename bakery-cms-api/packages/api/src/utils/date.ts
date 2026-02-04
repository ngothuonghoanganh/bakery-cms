/**
 * Date utilities
 * Lightweight helpers for consistent date formatting
 */

/**
 * Safely convert a date-like value to ISO string.
 * Returns empty string when value is missing or invalid.
 */
export const toIsoString = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  const maybeIso = value as { toISOString?: () => string };
  if (typeof maybeIso.toISOString === 'function') {
    return maybeIso.toISOString();
  }

  return '';
};
