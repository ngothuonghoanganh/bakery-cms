# i18n Research: Bakery CMS

**Date**: 2025-12-26
**Feature**: Internationalization (Vietnamese & English)
**Branch**: 006-i18n

## Research Questions Resolved

### 1. i18n Library Choice

**Decision**: react-i18next

**Rationale**:
- React 19 compatibility confirmed (v16.2.4+)
- Excellent TypeScript support with strict key checking
- Built-in language detection plugin (i18next-browser-languagedetector)
- Namespace support for organizing translations by feature
- Large community and active maintenance (6.3M+ weekly downloads)
- Lazy loading capabilities for future optimization

**Alternatives Considered**:
| Library | Why Rejected |
|---------|--------------|
| react-intl | Smaller community, less flexible plugin ecosystem |
| Custom solution | Too much implementation overhead, no built-in detection |

**Dependencies to Add**:
```bash
yarn add i18next react-i18next i18next-browser-languagedetector
```

---

### 2. Ant Design Locale Configuration

**Decision**: Use ConfigProvider with built-in locales

**Rationale**:
- Ant Design 5.x has complete Vietnamese (vi_VN) and English (en_US) locale support
- ConfigProvider integrates seamlessly with React context
- Covers all Ant Design components (DatePicker, Table pagination, etc.)

**Implementation Pattern**:
```typescript
import enUS from 'antd/es/locale/en_US';
import viVN from 'antd/es/locale/vi_VN';

const antdLocales = {
  en: enUS,
  vi: viVN,
} as const;
```

---

### 3. dayjs Locale Configuration

**Decision**: Import locales and sync with language store

**Rationale**:
- dayjs already in dependencies (^1.11.10)
- Vietnamese locale fully supported
- Lightweight approach with dynamic locale switching

**Implementation Pattern**:
```typescript
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';

dayjs.locale(currentLanguage); // Sync on language change
```

---

### 4. Type-Safe Translation Keys

**Decision**: i18next TypeScript module augmentation with `as const` resources

**Rationale**:
- TypeScript 5.9+ project fully supports strict typing
- Provides IDE autocomplete for translation keys
- Compile-time errors for invalid keys
- No runtime overhead

**Implementation Pattern**:
```typescript
// @types/i18next.d.ts
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof resources['en'];
  }
}

// resources.ts
export const resources = {
  en: { common: { save: 'Save' } },
  vi: { common: { save: 'Lưu' } },
} as const;
```

---

### 5. State Management Pattern

**Decision**: Zustand with persist middleware

**Rationale**:
- Zustand already in project dependencies (^5.0.9)
- Persist middleware provides localStorage integration automatically
- onRehydrateStorage callback syncs i18next/dayjs on page load
- Matches existing store patterns in the codebase

**Implementation Pattern**:
```typescript
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'vi',
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        dayjs.locale(lang);
        set({ language: lang });
      },
    }),
    { name: 'bakery-cms-language' }
  )
);
```

---

### 6. Browser Language Detection

**Decision**: i18next-browser-languagedetector with custom priority

**Rationale**:
- Seamless integration with react-i18next
- Configurable detection order
- Respects user's explicit choice (localStorage) first

**Detection Order**:
1. localStorage (user's saved preference)
2. navigator (browser language settings)
3. htmlTag (fallback)

**Fallback**: Vietnamese (vi) - default for target market

---

## Translation Namespace Structure

Based on existing page structure:

| Namespace | Purpose | Example Keys |
|-----------|---------|--------------|
| common | Shared UI elements | save, cancel, delete, loading |
| auth | Authentication pages | login, logout, forgotPassword |
| products | Products management | productName, price, category |
| orders | Order management | orderStatus, totalAmount |
| payments | Payment processing | paymentMethod, amount |
| stock | Stock management | stockLevel, lowStockAlert |
| dashboard | Dashboard widgets | totalSales, recentOrders |
| validation | Form validation | required, invalidEmail |
| errors | Error messages | notFound, serverError |

---

## Integration Checklist

- [ ] Install i18next, react-i18next, i18next-browser-languagedetector
- [ ] Create i18n configuration with TypeScript support
- [ ] Create translation resources (en.ts, vi.ts)
- [ ] Create Zustand language store with persistence
- [ ] Wrap App with i18n and Ant Design ConfigProvider
- [ ] Configure dayjs locale sync
- [ ] Create LanguageSelector shared component
- [ ] Extract existing hardcoded strings to translation keys

---

## Performance Considerations

- **Bundle size**: ~22KB gzipped for react-i18next
- **Initial load**: Vietnamese (default) loaded immediately
- **Language switch**: < 500ms (in-memory, no network request)
- **Future optimization**: Can implement lazy loading for additional languages if needed

---

## References

- [react-i18next TypeScript Guide](https://react.i18next.com/latest/typescript)
- [Ant Design Internationalization](https://ant.design/docs/react/i18n/)
- [dayjs Internationalization](https://day.js.org/docs/en/i18n/i18n)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector)
