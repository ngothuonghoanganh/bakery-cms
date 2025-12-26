/**
 * Language Store
 * Zustand store for managing language state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import i18n from '../i18n';
import { setDayjsLocale, detectBrowserLanguage } from '../i18n/utils/locale.utils';
import type { SupportedLanguage, LanguageState } from '../i18n/types';
import { DEFAULT_LANGUAGE, STORAGE_KEY, SUPPORTED_LANGUAGES } from '../i18n/types';

/**
 * Sync all i18n systems with the selected language
 */
const syncLanguage = (language: SupportedLanguage): void => {
  // Sync i18next
  i18n.changeLanguage(language);
  // Sync dayjs
  setDayjsLocale(language);
};

/**
 * Language store with persistence
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: DEFAULT_LANGUAGE,
      isInitialized: false,

      setLanguage: (lang: SupportedLanguage) => {
        if (!SUPPORTED_LANGUAGES.includes(lang)) {
          console.warn(`Unsupported language: ${lang}, falling back to ${DEFAULT_LANGUAGE}`);
          lang = DEFAULT_LANGUAGE;
        }

        syncLanguage(lang);
        set({ language: lang });
      },

      initializeLanguage: () => {
        const { isInitialized, language } = get();

        if (isInitialized) return;

        // If no stored language, detect from browser
        const storedLang = localStorage.getItem(STORAGE_KEY);
        if (!storedLang) {
          const detectedLang = detectBrowserLanguage();
          syncLanguage(detectedLang);
          set({ language: detectedLang, isInitialized: true });
        } else {
          // Sync with stored language
          syncLanguage(language);
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        // Sync i18next and dayjs when store rehydrates
        if (state?.language) {
          syncLanguage(state.language);
        }
      },
    }
  )
);

// Selectors for optimized re-renders
export const useLanguage = () => useLanguageStore((state) => state.language);
export const useSetLanguage = () => useLanguageStore((state) => state.setLanguage);
export const useInitializeLanguage = () => useLanguageStore((state) => state.initializeLanguage);
