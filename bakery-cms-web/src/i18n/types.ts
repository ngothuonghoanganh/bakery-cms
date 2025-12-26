/**
 * i18n Type Definitions
 * Centralized types for internationalization
 */

// Supported languages
export type SupportedLanguage = 'vi' | 'en';

// Translation namespace types
export type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'products'
  | 'orders'
  | 'payments'
  | 'stock'
  | 'dashboard'
  | 'validation'
  | 'errors';

// Locale configuration
export type LocaleConfig = {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
};

// Language store state type
export type LanguageState = {
  language: SupportedLanguage;
  isInitialized: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  initializeLanguage: () => void;
};

// Language option for selector
export type LanguageOption = {
  value: SupportedLanguage;
  label: string;
  flag?: string;
};

// Constants
export const DEFAULT_LANGUAGE: SupportedLanguage = 'vi';
export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['vi', 'en'] as const;
export const STORAGE_KEY = 'bakery-cms-language';

// Locale configurations
export const LOCALE_CONFIGS: Record<SupportedLanguage, LocaleConfig> = {
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
} as const;

// Language options for selector
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
] as const;
