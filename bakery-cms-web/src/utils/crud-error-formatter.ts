import type { TFunction } from 'i18next';
import { extractErrorFromAxiosError } from '@/services/api/client';
import { ErrorCode, type AppError, type ValidationErrorDetail } from '@/types/common/error.types';

type AppErrorLike = Partial<AppError> & { readonly code?: unknown };

const ERROR_CODE_VALUES = new Set<ErrorCode>(Object.values(ErrorCode));

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isValidationErrorDetail = (value: unknown): value is ValidationErrorDetail => {
  return (
    isObject(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string'
  );
};

const isErrorCode = (value: unknown): value is ErrorCode => {
  return typeof value === 'string' && ERROR_CODE_VALUES.has(value as ErrorCode);
};

const isAppErrorLike = (value: unknown): value is AppErrorLike => {
  return (
    isObject(value) &&
    'code' in value &&
    'message' in value &&
    'statusCode' in value
  );
};

const normalizeDetails = (
  details: unknown
): readonly ValidationErrorDetail[] | undefined => {
  if (!Array.isArray(details)) {
    return undefined;
  }

  const normalized = details.filter(isValidationErrorDetail);
  return normalized.length > 0 ? normalized : undefined;
};

export const normalizeAppError = (
  error: unknown,
  fallbackCode: ErrorCode = ErrorCode.INTERNAL_ERROR
): AppError => {
  const source: AppErrorLike = isAppErrorLike(error)
    ? error
    : extractErrorFromAxiosError(error);

  return {
    code: isErrorCode(source.code) ? source.code : fallbackCode,
    message: typeof source.message === 'string' ? source.message : '',
    statusCode: typeof source.statusCode === 'number' ? source.statusCode : 500,
    details: normalizeDetails(source.details),
    timestamp:
      source.timestamp instanceof Date || typeof source.timestamp === 'string'
        ? source.timestamp
        : new Date(),
    path: typeof source.path === 'string' ? source.path : undefined,
  };
};

export type CrudErrorPresentation = {
  readonly error: AppError;
  readonly title: string;
  readonly detailMessages: readonly string[];
};

export const formatCrudError = (
  t: TFunction,
  error: unknown,
  fallbackCode: ErrorCode = ErrorCode.INTERNAL_ERROR
): CrudErrorPresentation => {
  const normalizedError = normalizeAppError(error, fallbackCode);
  const title = t(`errors.codes.${normalizedError.code}`, {
    defaultValue: t('errors.codes.INTERNAL_ERROR', {
      defaultValue: t('errors.generic'),
    }),
  });
  const detailMessages = (normalizedError.details ?? [])
    .map((detail) => detail.message.trim())
    .filter((message) => message.length > 0);

  return {
    error: normalizedError,
    title,
    detailMessages,
  };
};
