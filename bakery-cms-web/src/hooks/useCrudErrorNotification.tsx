import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from './useNotification';
import { formatCrudError } from '@/utils/crud-error-formatter';
import { ErrorCode, type AppError } from '@/types/common/error.types';

const buildDetailsList = (detailMessages: readonly string[]): ReactNode | undefined => {
  if (detailMessages.length === 0) {
    return undefined;
  }

  return (
    <ul style={{ margin: 0, paddingInlineStart: 18 }}>
      {detailMessages.map((message, index) => (
        <li key={`${index}:${message}`}>{message}</li>
      ))}
    </ul>
  );
};

export const useCrudErrorNotification = (): {
  readonly showCrudError: (error: unknown, fallbackCode?: ErrorCode) => AppError;
} => {
  const { t } = useTranslation();
  const { error: notifyError } = useNotification();

  const showCrudError = useCallback(
    (error: unknown, fallbackCode: ErrorCode = ErrorCode.INTERNAL_ERROR): AppError => {
      const presentation = formatCrudError(t, error, fallbackCode);
      notifyError(presentation.title, buildDetailsList(presentation.detailMessages));
      return presentation.error;
    },
    [notifyError, t]
  );

  return { showCrudError };
};
