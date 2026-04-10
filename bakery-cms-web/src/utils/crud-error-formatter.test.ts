import { describe, expect, it } from 'vitest';
import { ErrorCode, type AppError } from '@/types/common/error.types';
import { formatCrudError, normalizeAppError } from './crud-error-formatter';

const createT = (dictionary: Record<string, string>) => {
  return (key: string, options?: { defaultValue?: string }): string => {
    return dictionary[key] ?? options?.defaultValue ?? key;
  };
};

describe('crud-error-formatter', () => {
  it('maps error code to translated title', () => {
    const t = createT({
      'errors.codes.INTERNAL_ERROR': 'Internal error',
      'errors.codes.NOT_FOUND': 'Resource not found',
    });

    const error: AppError = {
      code: ErrorCode.NOT_FOUND,
      message: 'Product not found',
      statusCode: 404,
      timestamp: new Date(),
    };

    const formatted = formatCrudError(t as any, error);

    expect(formatted.title).toBe('Resource not found');
    expect(formatted.detailMessages).toEqual([]);
  });

  it('builds detail list from multiple validation errors', () => {
    const t = createT({
      'errors.codes.INTERNAL_ERROR': 'Internal error',
      'errors.codes.VALIDATION_ERROR': 'Validation error',
    });

    const error: AppError = {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      statusCode: 400,
      timestamp: new Date(),
      details: [
        { field: 'name', message: 'Name is required' },
        { field: 'price', message: 'Price must be greater than 0' },
      ],
    };

    const formatted = formatCrudError(t as any, error);

    expect(formatted.title).toBe('Validation error');
    expect(formatted.detailMessages).toEqual([
      'Name is required',
      'Price must be greater than 0',
    ]);
  });

  it('returns empty details when error has no details', () => {
    const t = createT({
      'errors.codes.INTERNAL_ERROR': 'Internal error',
      'errors.codes.CONFLICT': 'Conflict',
    });

    const error: AppError = {
      code: ErrorCode.CONFLICT,
      message: 'Conflict',
      statusCode: 409,
      timestamp: new Date(),
    };

    const formatted = formatCrudError(t as any, error);

    expect(formatted.title).toBe('Conflict');
    expect(formatted.detailMessages).toEqual([]);
  });

  it('falls back to internal error for unknown input', () => {
    const t = createT({
      'errors.codes.INTERNAL_ERROR': 'Internal error',
    });

    const formatted = formatCrudError(t as any, null);

    expect(formatted.error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(formatted.title).toBe('Internal error');
    expect(formatted.detailMessages).toEqual([]);
  });

  it('normalizes unknown error code to fallback code', () => {
    const normalized = normalizeAppError({
      code: 'UNLISTED_BACKEND_CODE',
      message: 'Unknown backend error code',
      statusCode: 422,
      timestamp: new Date().toISOString(),
      details: [{ field: 'x', message: 'X failed' }],
    });

    expect(normalized.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(normalized.details).toEqual([{ field: 'x', message: 'X failed' }]);
  });
});
