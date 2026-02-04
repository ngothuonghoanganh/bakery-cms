/**
 * Translation Utilities
 * Helper functions for translation key lookup and fallback logic
 */

import i18n from 'i18next';
import type { SupportedLanguage } from '../types';
import { DEFAULT_LANGUAGE } from '../types';

/**
 * Get a nested translation value by key path
 * Falls back to default language if key not found
 */
export const getTranslation = (
  key: string,
  language?: SupportedLanguage,
  params?: Record<string, unknown>
): string => {
  const lng = language || (i18n.language as SupportedLanguage);

  // Try to get translation for current language
  const translation = i18n.t(key as any, { lng, ...params } as any);

  // If translation is the key itself (not found), try fallback language
  if (translation === key && lng !== DEFAULT_LANGUAGE) {
    return i18n.t(key as any, { lng: DEFAULT_LANGUAGE, ...params } as any);
  }

  return translation;
};

/**
 * Check if a translation key exists
 */
export const hasTranslation = (key: string, language?: SupportedLanguage): boolean => {
  const lng = language || (i18n.language as SupportedLanguage);
  return i18n.exists(key, { lng });
};

/**
 * Get translation with fallback to a default value
 */
export const getTranslationOrDefault = (
  key: string,
  defaultValue: string,
  params?: Record<string, unknown>
): string => {
  if (hasTranslation(key)) {
    return getTranslation(key, undefined, params);
  }
  return defaultValue;
};

/**
 * Get all keys for a namespace
 */
export const getNamespaceKeys = (namespace: string): string[] => {
  const resources = i18n.getResourceBundle(i18n.language, 'translation');
  if (!resources || !resources[namespace]) return [];

  const extractKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        keys.push(...extractKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  };

  return extractKeys(resources[namespace], namespace);
};

/**
 * Pluralize a translation based on count
 */
export const pluralize = (
  key: string,
  count: number,
  params?: Record<string, unknown>
): string => {
  return i18n.t(key as any, { count, ...params } as any);
};
