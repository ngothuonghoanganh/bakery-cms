# Implementation Plan: Internationalization (i18n)

**Branch**: `006-i18n` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-i18n/spec.md`

## Summary

Implement internationalization (i18n) for the Bakery CMS web application with Vietnamese and English language support. The feature includes a language selector component, language preference persistence (local storage for anonymous users, account sync for authenticated users), browser language detection, and comprehensive UI text localization with proper date/number formatting.

## Technical Context

**Language/Version**: TypeScript 5.9+, React 19, Node.js 18+
**Primary Dependencies**: React, Ant Design 5.x, Zustand, Axios, dayjs
**Storage**: Local Storage (anonymous), User API (authenticated users)
**Testing**: Vitest, React Testing Library
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (monorepo with bakery-cms-web frontend)
**Performance Goals**: Language switch < 500ms, no page reload required
**Constraints**: Zero layout breaks, 100% UI text coverage
**Scale/Scope**: ~50 screens/pages, ~200-300 translation keys initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Functional Components Only | ✅ PASS | All i18n components will be functional |
| Prefer `type` over `interface` | ✅ PASS | Will use types for all i18n-related definitions |
| Custom Hooks for Reusability | ✅ PASS | Will create useI18n, useLocale hooks |
| Component Types (core/shared/detail) | ✅ PASS | LanguageSelector as shared component |
| Immutable State Updates | ✅ PASS | Language state managed immutably via Zustand |
| Data Model Transformation | ✅ PASS | N/A - no API response transformation needed for language |
| TypeScript Strict Mode | ✅ PASS | All translation keys will be typed |
| No `any` types | ✅ PASS | Will use strict typing for translations |
| Test Coverage 80%+ | ✅ PASS | Will test hooks, components, and utilities |

**Gate Status: PASSED** - No violations, proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/006-i18n/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (minimal for frontend-only feature)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
bakery-cms-web/
├── src/
│   ├── i18n/                        # New: i18n configuration and resources
│   │   ├── index.ts                 # i18n initialization and exports
│   │   ├── types.ts                 # Translation types and locale types
│   │   ├── locales/
│   │   │   ├── vi.ts                # Vietnamese translations
│   │   │   └── en.ts                # English translations
│   │   └── utils/
│   │       ├── locale.utils.ts      # Locale detection, formatting utilities
│   │       └── translation.utils.ts # Translation key lookup, fallback logic
│   │
│   ├── hooks/
│   │   ├── useI18n.ts               # New: Translation hook
│   │   └── useLocale.ts             # New: Locale/formatting hook
│   │
│   ├── stores/
│   │   └── languageStore.ts         # New: Zustand store for language state
│   │
│   ├── components/
│   │   └── shared/
│   │       └── LanguageSelector/    # New: Language switcher component
│   │           ├── LanguageSelector.tsx
│   │           ├── LanguageSelector.types.ts
│   │           └── LanguageSelector.test.tsx
│   │
│   └── services/
│       └── userService.ts           # Existing: Add language preference sync
│
└── tests/
    └── i18n/                        # i18n-specific tests
        ├── hooks.test.ts
        └── utils.test.ts
```

**Structure Decision**: Following existing bakery-cms-web structure. Creating a new `i18n/` directory for centralized localization resources and utilities. Language selector as a shared component since it's reusable across the app. Custom hooks in existing `hooks/` directory following project conventions.

## Complexity Tracking

> No violations - table not needed.

