/**
 * i18n Configuration and Initialization
 * Uses i18next with react-i18next for internationalization
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { vi } from './locales/vi';
import { en } from './locales/en';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, STORAGE_KEY } from './types';

// Resources configuration
export const resources = {
  vi: { translation: vi },
  en: { translation: en },
} as const;

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],

    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
    },

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // TypeScript options
    returnNull: false,
    returnEmptyString: false,

    // React options
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Re-export types
export * from './types';
