/**
 * Stable key helpers for hook dependencies and request dedupe.
 * Ensures object keys are sorted so equivalent inputs produce the same key.
 */

const normalizeForStableKey = (value: unknown): unknown => {
  if (value === undefined) {
    return '__undefined__';
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForStableKey(item));
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, normalizeForStableKey(nestedValue)]);
    return Object.fromEntries(entries);
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'function') {
    return '__function__';
  }

  if (typeof value === 'symbol') {
    return value.toString();
  }

  return value;
};

export const createStableKey = (value: unknown): string =>
  JSON.stringify(normalizeForStableKey(value));
