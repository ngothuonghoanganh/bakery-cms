/**
 * Locale Utilities
 * Functions for locale detection, formatting, and dayjs configuration
 */

import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';

import type { SupportedLanguage } from '../types';
import { LOCALE_CONFIGS, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../types';

/**
 * Set dayjs locale globally
 */
export const setDayjsLocale = (language: SupportedLanguage): void => {
  dayjs.locale(language);
};

/**
 * Get locale configuration for a language
 */
export const getLocaleConfig = (language: SupportedLanguage) => {
  return LOCALE_CONFIGS[language];
};

/**
 * Detect browser language and return supported language or default
 */
export const detectBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split('-')[0].toLowerCase();

  if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }

  return DEFAULT_LANGUAGE;
};

/**
 * Check if a language code is supported
 */
export const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
};

/**
 * Format number according to locale
 */
export const formatNumber = (value: number, language: SupportedLanguage): string => {
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format currency (VND) according to locale
 */
export const formatCurrency = (value: number, language: SupportedLanguage): string => {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date according to locale using dayjs
 */
export const formatDate = (
  date: Date | string | number,
  language: SupportedLanguage,
  format?: string
): string => {
  const config = LOCALE_CONFIGS[language];
  return dayjs(date).locale(language).format(format || config.dateFormat);
};

/**
 * Format time according to locale using dayjs
 */
export const formatTime = (
  date: Date | string | number,
  language: SupportedLanguage,
  format?: string
): string => {
  const config = LOCALE_CONFIGS[language];
  return dayjs(date).locale(language).format(format || config.timeFormat);
};

/**
 * Format datetime according to locale using dayjs
 */
export const formatDateTime = (
  date: Date | string | number,
  language: SupportedLanguage
): string => {
  const config = LOCALE_CONFIGS[language];
  return dayjs(date).locale(language).format(`${config.dateFormat} ${config.timeFormat}`);
};
