# Quickstart: i18n Implementation

**Feature**: Internationalization (Vietnamese & English)
**Branch**: 006-i18n

## Prerequisites

- Node.js 18+
- Yarn
- bakery-cms-web project set up

## Installation

```bash
cd bakery-cms-web
yarn add i18next react-i18next i18next-browser-languagedetector
```

## Quick Setup (5 Steps)

### Step 1: Create Translation Resources

```typescript
// src/i18n/locales/vi.ts
export const vi = {
  common: {
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    loading: 'Đang tải...',
  },
} as const;

// src/i18n/locales/en.ts
export const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    loading: 'Loading...',
  },
} as const;
```

### Step 2: Initialize i18next

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { vi } from './locales/vi';
import { en } from './locales/en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'bakery-cms-language',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### Step 3: Create Language Store

```typescript
// src/stores/languageStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

type SupportedLanguage = 'vi' | 'en';

type LanguageState = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'vi',
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
    }),
    {
      name: 'bakery-cms-language',
    }
  )
);
```

### Step 4: Integrate with App

```tsx
// src/App.tsx
import { ConfigProvider } from 'antd';
import enUS from 'antd/es/locale/en_US';
import viVN from 'antd/es/locale/vi_VN';
import './i18n'; // Initialize i18n
import { useLanguageStore } from './stores/languageStore';

const antdLocales = { en: enUS, vi: viVN };

function App() {
  const { language } = useLanguageStore();

  return (
    <ConfigProvider locale={antdLocales[language]}>
      {/* Your app content */}
    </ConfigProvider>
  );
}
```

### Step 5: Use Translations in Components

```tsx
// Any component
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <button>{t('common.save')}</button>
  );
}
```

## Create Language Selector

```tsx
// src/components/shared/LanguageSelector/LanguageSelector.tsx
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguageStore } from '../../../stores/languageStore';

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguageStore();

  return (
    <Select
      value={language}
      onChange={setLanguage}
      suffixIcon={<GlobalOutlined />}
      options={[
        { value: 'vi', label: 'Tiếng Việt' },
        { value: 'en', label: 'English' },
      ]}
      style={{ width: 120 }}
    />
  );
};
```

## Verification

1. Start the dev server: `yarn dev`
2. Open browser console and run: `localStorage.getItem('bakery-cms-language')`
3. Switch language using the selector
4. Verify text updates immediately without page reload
5. Refresh page and verify language preference persists

## Common Issues

### Translation not updating?
- Ensure `i18n.changeLanguage()` is called in the store
- Check that the translation key exists in both locale files

### Ant Design components not translating?
- Verify ConfigProvider wraps the entire app
- Check that the correct locale is passed to ConfigProvider

### TypeScript errors on translation keys?
- Add the type declaration file (see full implementation guide)
- Ensure resources are marked with `as const`
