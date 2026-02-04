/**
 * useLocale Hook
 * Custom hook for locale-aware formatting
 */

import { useCallback, useMemo } from 'react';
import { useLanguage } from '../stores/languageStore';
import {
  formatNumber,
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  getLocaleConfig,
} from '../i18n/utils/locale.utils';

/**
 * Hook for locale-aware formatting utilities
 */
export const useLocale = () => {
  const language = useLanguage();

  const localeConfig = useMemo(() => getLocaleConfig(language), [language]);

  const formatNumberValue = useCallback(
    (value: number) => formatNumber(value, language),
    [language]
  );

  const formatCurrencyValue = useCallback(
    (value: number) => formatCurrency(value, language),
    [language]
  );

  const formatDateValue = useCallback(
    (date: Date | string | number, format?: string) => formatDate(date, language, format),
    [language]
  );

  const formatTimeValue = useCallback(
    (date: Date | string | number, format?: string) => formatTime(date, language, format),
    [language]
  );

  const formatDateTimeValue = useCallback(
    (date: Date | string | number) => formatDateTime(date, language),
    [language]
  );

  return {
    language,
    localeConfig,
    formatNumber: formatNumberValue,
    formatCurrency: formatCurrencyValue,
    formatDate: formatDateValue,
    formatTime: formatTimeValue,
    formatDateTime: formatDateTimeValue,
  };
};

export default useLocale;
