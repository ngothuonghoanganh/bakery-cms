/**
 * useI18n Hook
 * Custom hook for accessing translation functions
 */

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useLanguage } from '../stores/languageStore';

/**
 * Hook for accessing i18n translation functions
 * Wraps react-i18next's useTranslation with additional utilities
 */
export const useI18n = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = useLanguage();

  /**
   * Translate a key with optional parameters
   */
  const translate = useCallback(
    (key: string, params?: Record<string, unknown>) => {
      return t(key, params as Record<string, string>);
    },
    [t]
  );

  /**
   * Check if a translation key exists
   */
  const exists = useCallback(
    (key: string) => {
      return i18n.exists(key);
    },
    [i18n]
  );

  /**
   * Get translation or return fallback
   */
  const translateOrDefault = useCallback(
    (key: string, defaultValue: string, params?: Record<string, unknown>) => {
      if (i18n.exists(key)) {
        return t(key, params as Record<string, string>);
      }
      return defaultValue;
    },
    [t, i18n]
  );

  return {
    t: translate,
    translate,
    exists,
    translateOrDefault,
    language: currentLanguage,
    i18n,
  };
};

export default useI18n;
