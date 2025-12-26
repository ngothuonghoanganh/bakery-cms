# Data Model: Internationalization (i18n)

**Date**: 2025-12-26
**Feature Branch**: 006-i18n

## Entity Overview

The i18n feature is primarily frontend-focused with minimal data persistence requirements.

### 1. Language Preference

Represents the user's selected language.

| Field | Type | Description | Storage |
|-------|------|-------------|---------|
| language | `'vi' \| 'en'` | Selected language code | localStorage / User API |

**Persistence Strategy**:
- **Anonymous users**: localStorage (`bakery-cms-language`)
- **Authenticated users**: User account API field (future enhancement)

---

### 2. Translation Resource

A collection of translated strings organized by namespace.

```typescript
type SupportedLanguage = 'vi' | 'en';

type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'products'
  | 'orders'
  | 'payments'
  | 'stock'
  | 'dashboard'
  | 'validation'
  | 'errors';

type TranslationResource = {
  [key: string]: string | TranslationResource; // Nested keys supported
};

type TranslationResources = {
  [lang in SupportedLanguage]: {
    [ns in TranslationNamespace]?: TranslationResource;
  };
};
```

**Storage**: Static files bundled with application (`src/i18n/locales/`)

---

### 3. Locale Settings

Configuration for date, time, and number formatting.

| Setting | Vietnamese (vi) | English (en) |
|---------|-----------------|--------------|
| Date format | DD/MM/YYYY | MM/DD/YYYY |
| Time format | HH:mm | h:mm A |
| Currency | ₫ (VND) | ₫ (VND) |
| Number grouping | 1.000.000 | 1,000,000 |
| Decimal separator | , | . |

**Implementation**: Handled by dayjs locale and Ant Design ConfigProvider

---

## State Model

### LanguageStore (Zustand)

```typescript
type LanguageState = {
  // State
  language: SupportedLanguage;
  isInitialized: boolean;

  // Actions
  setLanguage: (lang: SupportedLanguage) => void;
  initializeLanguage: () => void;
};
```

**State Transitions**:

```
[Initial Load]
    │
    ▼
┌─────────────────────┐
│ Check localStorage  │
└─────────────────────┘
    │
    ├─── Found ───► Use stored language
    │
    └─── Not Found ───► Detect browser language
                             │
                             ├─── vi/en ───► Use detected
                             │
                             └─── Other ───► Default to 'vi'
```

---

## Translation Key Structure

Hierarchical key organization for maintainability:

```typescript
const translations = {
  // Common namespace - shared across all pages
  common: {
    actions: {
      save: 'Lưu',
      cancel: 'Hủy',
      delete: 'Xóa',
      edit: 'Sửa',
      add: 'Thêm',
      search: 'Tìm kiếm',
      filter: 'Lọc',
      refresh: 'Làm mới',
    },
    status: {
      loading: 'Đang tải...',
      success: 'Thành công',
      error: 'Có lỗi xảy ra',
    },
    pagination: {
      total: 'Tổng {{count}} mục',
      page: 'Trang',
    },
  },

  // Feature-specific namespaces
  products: {
    title: 'Quản lý sản phẩm',
    form: {
      name: 'Tên sản phẩm',
      price: 'Giá',
      description: 'Mô tả',
    },
  },

  // Validation messages
  validation: {
    required: '{{field}} là bắt buộc',
    min: '{{field}} phải ít nhất {{min}} ký tự',
    max: '{{field}} không được quá {{max}} ký tự',
    email: 'Email không hợp lệ',
  },
};
```

---

## API Contract (Future Enhancement)

For authenticated user preference sync:

### GET /api/users/me/preferences

```json
{
  "language": "vi"
}
```

### PATCH /api/users/me/preferences

Request:
```json
{
  "language": "en"
}
```

Response:
```json
{
  "language": "en",
  "updatedAt": "2025-12-26T10:00:00Z"
}
```

**Note**: API integration is a future enhancement (FR-005). Initial implementation uses localStorage only.

---

## Relationships

```
┌─────────────────┐
│   User Session  │
└────────┬────────┘
         │
         │ has one
         ▼
┌─────────────────┐     references      ┌─────────────────┐
│ Language        │ ◄─────────────────► │ Translation     │
│ Preference      │                     │ Resources       │
└────────┬────────┘                     └─────────────────┘
         │
         │ configures
         ▼
┌─────────────────┐
│ Locale Settings │
│ (Ant Design,    │
│  dayjs)         │
└─────────────────┘
```
