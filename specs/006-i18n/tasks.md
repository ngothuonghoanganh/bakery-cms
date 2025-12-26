# Tasks: Internationalization (i18n)

**Input**: Design documents from `/specs/006-i18n/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks included only for critical components (LanguageSelector)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `bakery-cms-web/src/`
- Based on plan.md project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and i18n dependencies

- [x] T001 Install i18n dependencies (i18next, react-i18next, i18next-browser-languagedetector) via yarn in bakery-cms-web/
- [x] T002 [P] Create i18n directory structure at bakery-cms-web/src/i18n/
- [x] T003 [P] Create TypeScript type definitions for i18n at bakery-cms-web/src/i18n/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core i18n infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create Vietnamese translation resource file at bakery-cms-web/src/i18n/locales/vi.ts with common namespace
- [x] T005 [P] Create English translation resource file at bakery-cms-web/src/i18n/locales/en.ts with common namespace
- [x] T006 Create i18next configuration and initialization at bakery-cms-web/src/i18n/index.ts
- [x] T007 Create TypeScript module augmentation for type-safe keys at bakery-cms-web/src/@types/i18next.d.ts
- [x] T008 Configure dayjs locale imports and sync utility at bakery-cms-web/src/i18n/utils/locale.utils.ts
- [x] T009 [P] Create translation key lookup and fallback utility at bakery-cms-web/src/i18n/utils/translation.utils.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Switch Application Language (Priority: P1) 🎯 MVP

**Goal**: Users can change the application language between Vietnamese and English via a language selector

**Independent Test**: Switch languages via the language selector and verify all visible text changes accordingly

### Implementation for User Story 1

- [x] T010 [US1] Create Zustand language store with setLanguage action at bakery-cms-web/src/stores/languageStore.ts
- [x] T011 [US1] Create useI18n hook for translation access at bakery-cms-web/src/hooks/useI18n.ts
- [x] T012 [P] [US1] Create useLocale hook for locale formatting at bakery-cms-web/src/hooks/useLocale.ts
- [x] T013 [P] [US1] Create LanguageSelector types at bakery-cms-web/src/components/shared/LanguageSelector/LanguageSelector.types.ts
- [x] T014 [US1] Create LanguageSelector component at bakery-cms-web/src/components/shared/LanguageSelector/LanguageSelector.tsx
- [x] T015 [US1] Create LanguageSelector test at bakery-cms-web/src/components/shared/LanguageSelector/LanguageSelector.test.tsx
- [x] T016 [US1] Integrate Ant Design ConfigProvider with language store in bakery-cms-web/src/App.tsx
- [x] T017 [US1] Add LanguageSelector to app header/layout in bakery-cms-web/src/App.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - language switching works with immediate UI updates

---

## Phase 4: User Story 2 - Persist Language Preference (Priority: P2)

**Goal**: Language preference is remembered across sessions via localStorage and browser detection

**Independent Test**: Select a language, close browser, reopen and verify the preference is maintained

### Implementation for User Story 2

- [x] T018 [US2] Add Zustand persist middleware to languageStore at bakery-cms-web/src/stores/languageStore.ts
- [x] T019 [US2] Configure i18next-browser-languagedetector in bakery-cms-web/src/i18n/index.ts
- [x] T020 [US2] Add onRehydrateStorage callback to sync i18next/dayjs on page load in bakery-cms-web/src/stores/languageStore.ts
- [x] T021 [US2] Add initializeLanguage action to detect browser language with vi/en fallback in bakery-cms-web/src/stores/languageStore.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - language persists across sessions

---

## Phase 5: User Story 3 - Display Localized Content (Priority: P3)

**Goal**: All user-facing text, labels, messages, and notifications display in the selected language

**Independent Test**: Switch to each language and verify all UI elements display correctly

### Implementation for User Story 3

- [x] T022 [P] [US3] Add auth namespace translations (login, logout, register) to bakery-cms-web/src/i18n/locales/vi.ts
- [x] T023 [P] [US3] Add auth namespace translations to bakery-cms-web/src/i18n/locales/en.ts
- [x] T024 [P] [US3] Add products namespace translations to bakery-cms-web/src/i18n/locales/vi.ts
- [x] T025 [P] [US3] Add products namespace translations to bakery-cms-web/src/i18n/locales/en.ts
- [x] T026 [P] [US3] Add orders namespace translations to bakery-cms-web/src/i18n/locales/vi.ts
- [x] T027 [P] [US3] Add orders namespace translations to bakery-cms-web/src/i18n/locales/en.ts
- [x] T028 [P] [US3] Add payments namespace translations to bakery-cms-web/src/i18n/locales/vi.ts
- [x] T029 [P] [US3] Add payments namespace translations to bakery-cms-web/src/i18n/locales/en.ts
- [x] T030 [P] [US3] Add stock namespace translations to bakery-cms-web/src/i18n/locales/vi.ts
- [x] T031 [P] [US3] Add stock namespace translations to bakery-cms-web/src/i18n/locales/en.ts
- [x] T032 [P] [US3] Add dashboard namespace translations to bakery-cms-web/src/i18n/locales/vi.ts
- [x] T033 [P] [US3] Add dashboard namespace translations to bakery-cms-web/src/i18n/locales/en.ts
- [x] T034 [P] [US3] Add validation namespace translations to bakery-cms-web/src/i18n/locales/vi.ts
- [x] T035 [P] [US3] Add validation namespace translations to bakery-cms-web/src/i18n/locales/en.ts
- [x] T036 [P] [US3] Add errors namespace translations to bakery-cms-web/src/i18n/locales/vi.ts
- [x] T037 [P] [US3] Add errors namespace translations to bakery-cms-web/src/i18n/locales/en.ts
- [x] T038 [US3] Extract and replace hardcoded strings in navigation/layout components with translation keys
- [x] T039 [US3] Extract and replace hardcoded strings in auth pages (LoginPage, RegisterPage, etc.) with translation keys
- [x] T040 [US3] Extract and replace hardcoded strings in products pages with translation keys
- [x] T041 [US3] Extract and replace hardcoded strings in orders pages with translation keys
- [x] T042 [US3] Extract and replace hardcoded strings in payments pages with translation keys
- [x] T043 [US3] Extract and replace hardcoded strings in stock pages with translation keys
- [x] T044 [US3] Extract and replace hardcoded strings in dashboard pages with translation keys
- [x] T045 [US3] Configure dayjs locale sync with language changes in bakery-cms-web/src/App.tsx

**Checkpoint**: All user stories should now be independently functional - full i18n coverage

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T046 [P] Add locale-specific number formatting utility at bakery-cms-web/src/i18n/utils/locale.utils.ts
- [x] T047 [P] Add locale-specific date formatting utility at bakery-cms-web/src/i18n/utils/locale.utils.ts
- [ ] T048 Verify all Ant Design components display in correct locale (DatePicker, Table pagination, etc.)
- [ ] T049 Run manual verification using quickstart.md test scenarios
- [ ] T050 Verify zero layout breaks when switching between Vietnamese and English text
- [ ] T051 Verify language switch completes in under 500ms

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Builds on User Story 1 (extends languageStore with persistence)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses infrastructure from US1

### Within Each User Story

- Types before implementation
- Store before hooks
- Hooks before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003: Can run in parallel (different files)
- T004, T005: Can run in parallel (separate locale files)
- T008, T009: Can run in parallel (different utilities)
- T011, T012: Can run in parallel (different hooks)
- T013, T014: T013 before T014 (types before component)
- T022-T037: All translation additions can run in parallel (different namespace files)
- T038-T044: Page extractions can run in parallel (different page directories)
- T046, T047: Can run in parallel (different utilities in same file)

---

## Parallel Example: User Story 3 Translation Tasks

```bash
# Launch all Vietnamese translation tasks in parallel:
T022: Add auth namespace translations to vi.ts
T024: Add products namespace translations to vi.ts
T026: Add orders namespace translations to vi.ts
T028: Add payments namespace translations to vi.ts
T030: Add stock namespace translations to vi.ts
T032: Add dashboard namespace translations to vi.ts
T034: Add validation namespace translations to vi.ts
T036: Add errors namespace translations to vi.ts

# Launch all English translation tasks in parallel:
T023: Add auth namespace translations to en.ts
T025: Add products namespace translations to en.ts
T027: Add orders namespace translations to en.ts
T029: Add payments namespace translations to en.ts
T031: Add stock namespace translations to en.ts
T033: Add dashboard namespace translations to en.ts
T035: Add validation namespace translations to en.ts
T037: Add errors namespace translations to en.ts

# Launch all page extraction tasks in parallel:
T038: Extract strings in navigation/layout components
T039: Extract strings in auth pages
T040: Extract strings in products pages
T041: Extract strings in orders pages
T042: Extract strings in payments pages
T043: Extract strings in stock pages
T044: Extract strings in dashboard pages
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: User Story 1 (T010-T017)
4. **STOP and VALIDATE**: Test language switching independently
5. Deploy/demo if ready - basic i18n is functional!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test persistence → Deploy/Demo
4. Add User Story 3 → Full localization coverage → Deploy/Demo
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Vietnamese is the default/fallback language
- Translation keys use `as const` for type safety
