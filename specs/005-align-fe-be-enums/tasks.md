# Tasks: Align Frontend and Backend Enum Definitions

**Branch**: `005-align-fe-be-enums`  
**Feature**: Align Frontend and Backend Enum Definitions

**Input**: Design documents from `/specs/005-align-fe-be-enums/`
- ✅ plan.md (implementation plan)
- ✅ spec.md (user stories and requirements)
- ✅ research.md (technical decisions)
- ✅ data-model.md (enum mappings)
- ✅ contracts/ (TypeScript declarations)
- ✅ quickstart.md (developer guide)

**Tests**: Not explicitly requested in specification - focusing on compile-time type safety and manual verification

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Task Format

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- **File paths**: Absolute paths from repository root

## Path Conventions

This is a monorepo project with:
- Backend: `bakery-cms-api/packages/common/` (enum source of truth)
- Frontend: `bakery-cms-web/src/` (consumer of backend enums)

---

## Phase 1: Setup (Project Configuration)

**Purpose**: Configure monorepo for cross-package enum imports

**Estimated Time**: 30 minutes

- [X] T001 Add @bakery-cms/common workspace dependency to bakery-cms-web/package.json
- [X] T002 [P] Configure TypeScript project references in bakery-cms-web/tsconfig.json
- [X] T003 [P] Verify Vite resolves workspace packages in bakery-cms-web/vite.config.ts
- [X] T004 Build backend common package in bakery-cms-api/packages/common/
- [X] T005 Verify backend enum exports in bakery-cms-api/packages/common/dist/index.d.ts
- [X] T006 Test import resolution by adding temporary test import in bakery-cms-web/src/App.tsx

**Checkpoint**: ✅ Frontend can successfully import enums from @bakery-cms/common

---

## Phase 2: Foundational (Backend Package Verification)

**Purpose**: Ensure backend common package is properly configured for frontend consumption

**⚠️ CRITICAL**: This phase validates the source of truth is ready

**Estimated Time**: 20 minutes

- [X] T007 [P] Verify all enums are exported in bakery-cms-api/packages/common/src/index.ts
- [X] T008 [P] Ensure package.json has correct main and types fields in bakery-cms-api/packages/common/package.json
- [X] T009 [P] Verify tsconfig.json has composite: true in bakery-cms-api/packages/common/tsconfig.json
- [X] T010 Run TypeScript compiler and confirm .d.ts files generated in bakery-cms-api/packages/common/dist/

**Checkpoint**: ✅ Backend common package ready for consumption - user story implementation can begin

---

## Phase 3: User Story 1 - Type Safety and Consistency (Priority: P1) 🎯 MVP

**Goal**: Frontend imports enums from backend package with full TypeScript type safety

**Independent Test**: Import backend enum, use in TypeScript code, verify compilation succeeds and IDE autocomplete works

**Estimated Time**: 3-4 hours

### PaymentMethod Migration (Simplest - Start Here)

- [X] T011 [P] [US1] Import PaymentMethod from @bakery-cms/common in bakery-cms-web/src/types/models/payment.model.ts
- [X] T012 [P] [US1] Import PaymentMethod in bakery-cms-web/src/services/payment.service.ts
- [X] T013 [US1] Update PaymentMethod.BANK_TRANSFER references from 'bank_transfer' to 'bank-transfer' in bakery-cms-web/src/services/payment.service.ts
- [X] T014 [US1] Run TypeScript compilation for bakery-cms-web and fix any PaymentMethod errors
- [X] T015 [US1] Test payment creation flow with PaymentMethod.BANK_TRANSFER in browser

### PaymentStatus Migration

- [X] T016 [P] [US1] Import PaymentStatus from @bakery-cms/common in bakery-cms-web/src/types/models/payment.model.ts
- [X] T017 [US1] Update PaymentStatus references in bakery-cms-web/src/services/payment.service.ts
- [X] T018 [US1] Replace PaymentStatus.REFUNDED with PaymentStatus.CANCELLED in bakery-cms-web/src/components/features/Payments/
- [X] T019 [US1] Update payment status display logic to show 'Cancelled' instead of 'Refunded' in bakery-cms-web/src/components/features/Payments/PaymentStatusBadge.tsx
- [X] T020 [US1] Run TypeScript compilation and fix any PaymentStatus errors
- [X] T021 [US1] Test payment status display for all statuses in browser

### ProductStatus Migration

- [X] T022 [P] [US1] Import ProductStatus from @bakery-cms/common in bakery-cms-web/src/types/models/product.model.ts
- [X] T023 [US1] Update all 'active' references to ProductStatus.AVAILABLE in bakery-cms-web/src/services/product.service.ts
- [X] T024 [US1] Update all 'inactive' references to ProductStatus.OUT_OF_STOCK in bakery-cms-web/src/services/product.service.ts
- [X] T025 [US1] Update product status filter logic in bakery-cms-web/src/components/features/Products/ProductFilters.tsx
- [X] T026 [US1] Update product status badge display in bakery-cms-web/src/components/features/Products/ProductStatusBadge.tsx
- [X] T027 [US1] Run TypeScript compilation and fix any ProductStatus errors
- [X] T028 [US1] Test product filtering by status in browser

### BusinessType Migration

- [X] T029 [P] [US1] Import BusinessType from @bakery-cms/common in bakery-cms-web/src/types/models/product.model.ts
- [X] T030 [US1] Add BusinessType.BOTH option to product form select in bakery-cms-web/src/components/features/Products/ProductForm.tsx
- [X] T031 [US1] Add BusinessType.BOTH option to product filters in bakery-cms-web/src/components/features/Products/ProductFilters.tsx
- [X] T032 [US1] Update business type display logic in bakery-cms-web/src/components/features/Products/ProductCard.tsx
- [X] T033 [US1] Run TypeScript compilation and fix any BusinessType errors
- [X] T034 [US1] Test creating product with BusinessType.BOTH in browser

### UserRole Migration (Most Complex - RBAC System)

- [X] T035 [P] [US1] Import UserRole from @bakery-cms/common in bakery-cms-web/src/services/auth.service.ts
- [X] T036 [US1] Update all UserRole.ADMIN references from 'ADMIN' to 'admin' in bakery-cms-web/src/services/auth.service.ts
- [X] T037 [US1] Update all UserRole enum value comparisons in bakery-cms-web/src/services/rbac.service.ts
- [X] T038 [US1] Update role hierarchy mapping to use lowercase values in bakery-cms-web/src/services/rbac.service.ts
- [X] T039 [US1] Update role-based route guards in bakery-cms-web/src/config/routes.config.ts
- [X] T040 [US1] Update role display components in bakery-cms-web/src/components/shared/UserBadge/UserBadge.tsx
- [X] T041 [US1] Run TypeScript compilation and fix any UserRole errors
- [X] T042 [US1] Test role-based access control for all roles in browser

### UserStatus Migration

- [X] T043 [P] [US1] Import UserStatus from @bakery-cms/common in bakery-cms-web/src/services/auth.service.ts
- [X] T044 [US1] Update UserStatus.PENDING to UserStatus.PENDING_VERIFICATION in bakery-cms-web/src/pages/RegisterPage/RegisterPage.tsx
- [X] T045 [US1] Update user status display logic in bakery-cms-web/src/components/features/Users/UserStatusBadge.tsx
- [X] T046 [US1] Update registration success message to reference email verification in bakery-cms-web/src/pages/RegisterPage/RegisterPage.tsx
- [X] T047 [US1] Run TypeScript compilation and fix any UserStatus errors
- [X] T048 [US1] Test user registration and status display in browser

**Checkpoint**: ✅ All enums imported from backend, TypeScript compilation succeeds, basic functionality works

---

## Phase 4: User Story 2 - Eliminate Duplicate Enum Definitions (Priority: P2)

**Goal**: Remove all local enum definitions from frontend, leaving only backend imports

**Independent Test**: Search frontend codebase for enum definitions - should find zero local enum definitions

**Estimated Time**: 1 hour

### Remove Local Enum Definitions

- [X] T049 [P] [US2] Delete local PaymentMethod const object from bakery-cms-web/src/types/models/payment.model.ts
- [X] T050 [P] [US2] Delete local PaymentStatus const object from bakery-cms-web/src/types/models/payment.model.ts
- [X] T051 [P] [US2] Delete local ProductStatus const object from bakery-cms-web/src/types/models/product.model.ts
- [X] T052 [P] [US2] Delete local BusinessType const object from bakery-cms-web/src/types/models/product.model.ts
- [X] T053 [P] [US2] Delete local UserRole const object from bakery-cms-web/src/services/auth.service.ts
- [X] T054 [P] [US2] Delete local UserStatus const object from bakery-cms-web/src/services/auth.service.ts

### Verify No Duplicates Remain

- [X] T055 [US2] Search for "export const.*Role.*{" pattern in bakery-cms-web/src/ - should return 0 results
- [X] T056 [US2] Search for "export const.*Status.*{" pattern in bakery-cms-web/src/ - should return 0 results
- [X] T057 [US2] Search for "export const.*Method.*{" pattern in bakery-cms-web/src/ - should return 0 results
- [X] T058 [US2] Search for "export const.*Type.*{" pattern in bakery-cms-web/src/ - should return 0 results
- [X] T059 [US2] Run TypeScript compilation to ensure no missing type errors
- [X] T060 [US2] Run full test suite in bakery-cms-web to verify no regressions

**Checkpoint**: ✅ No duplicate enum definitions exist, all imports come from backend

---

## Phase 5: User Story 3 - Smooth Migration Path (Priority: P3)

**Goal**: Ensure migration is complete with no hardcoded strings and proper validation

**Independent Test**: Run full application test suite - all tests pass, no TypeScript errors

**Estimated Time**: 2 hours

### Eliminate Hardcoded String Literals

- [X] T061 [P] [US3] Search for hardcoded 'ADMIN'/'MANAGER' strings in bakery-cms-web/src/ and replace with UserRole enums
- [X] T062 [P] [US3] Search for hardcoded 'bank_transfer' strings in bakery-cms-web/src/ and replace with PaymentMethod.BANK_TRANSFER
- [X] T063 [P] [US3] Search for hardcoded 'refunded' strings in bakery-cms-web/src/ and replace with PaymentStatus.CANCELLED
- [X] T064 [P] [US3] Search for hardcoded 'active'/'inactive' product status strings and replace with ProductStatus enums
- [X] T065 [US3] Run global search for enum value strings (e.g., grep -r "'admin'" bakery-cms-web/src/) and verify all are now enum constants

### Update Type Definitions

- [X] T066 [P] [US3] Update User interface to use backend UserRole type in bakery-cms-web/src/types/models/user.model.ts
- [X] T067 [P] [US3] Update Payment interface to use backend PaymentMethod/PaymentStatus types in bakery-cms-web/src/types/models/payment.model.ts
- [X] T068 [P] [US3] Update Product interface to use backend BusinessType/ProductStatus types in bakery-cms-web/src/types/models/product.model.ts
- [X] T069 [US3] Update API request/response DTOs to use backend enum types in bakery-cms-web/src/types/api/

### Test Suite Updates

- [X] T070 [P] [US3] Update auth service tests to use backend UserRole enum in bakery-cms-web/src/services/__tests__/auth.service.test.ts
- [X] T071 [P] [US3] Update payment service tests to use backend PaymentMethod/PaymentStatus enums in bakery-cms-web/src/services/__tests__/payment.service.test.ts
- [X] T072 [P] [US3] Update product service tests to use backend enum imports in bakery-cms-web/src/services/__tests__/product.service.test.ts
- [X] T073 [P] [US3] Update RBAC service tests to use backend UserRole enum in bakery-cms-web/src/services/__tests__/rbac.service.test.ts
- [X] T074 [US3] Run full unit test suite and verify all tests pass

### Integration Testing

- [X] T075 [US3] Test user login with all role types (admin, manager, staff, seller, customer, viewer)
- [X] T076 [US3] Test payment creation with all payment methods (cash, vietqr, bank-transfer)
- [X] T077 [US3] Test product creation with all business types (made-to-order, ready-to-sell, both)
- [X] T078 [US3] Test product status transitions (available ↔ out-of-stock)
- [X] T079 [US3] Test payment status transitions (pending → paid/failed/cancelled)
- [X] T080 [US3] Test role-based access control for protected routes

**Checkpoint**: ✅ Migration complete, no hardcoded strings, all tests pass

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and final verification

**Estimated Time**: 1 hour

### Documentation

- [X] T081 [P] Update component Storybook examples to use backend enums (if Storybook exists) in bakery-cms-web/.storybook/
- [X] T082 [P] Add migration notes to CHANGELOG.md in bakery-cms-web/
- [X] T083 [P] Update developer onboarding docs to reference quickstart.md in bakery-cms-web/docs/
- [X] T084 Create PR description with enum value mapping table and testing checklist

### Code Quality

- [X] T085 [P] Run ESLint on modified frontend files and fix any new warnings in bakery-cms-web/src/
- [X] T086 [P] Run Prettier to format all modified files in bakery-cms-web/src/
- [X] T087 Remove temporary test import from T006 in bakery-cms-web/src/App.tsx
- [X] T088 Remove any unused imports from modified files

### Final Verification

- [X] T089 Build frontend production bundle and verify bundle size increase <5KB
- [X] T090 Measure frontend build time and verify increase <5 seconds
- [X] T091 Run TypeScript type checking with --noEmit and confirm 0 errors
- [X] T092 Verify IDE autocomplete works for all imported enums (VS Code Go to Definition)
- [X] T093 Run full E2E test suite for critical user flows
- [X] T094 Perform manual QA testing of all enum-related features
- [X] T095 Update feature status to "Complete" in specs/005-align-fe-be-enums/spec.md

**Final Checkpoint**: ✅ All acceptance criteria met, feature ready for deployment

---

## Task Dependency Graph

```
Setup Phase (T001-T006)
  ↓
Foundational Phase (T007-T010)
  ↓
╔═══════════════════════════════════════════════════════════════╗
║ User Story 1 (T011-T048) - Can work in parallel per enum     ║
║   PaymentMethod (T011-T015) [P]                               ║
║   PaymentStatus (T016-T021) [P]                               ║
║   ProductStatus (T022-T028) [P]                               ║
║   BusinessType (T029-T034) [P]                                ║
║   UserRole (T035-T042) [P]                                    ║
║   UserStatus (T043-T048) [P]                                  ║
╚═══════════════════════════════════════════════════════════════╝
  ↓
User Story 2 (T049-T060) - Remove duplicates after imports done
  ↓
User Story 3 (T061-T080) - Cleanup and validation
  ↓
Final Phase (T081-T095) - Polish and verification
```

## Parallel Execution Opportunities

### Maximum Parallelization (Per User Story)

**US1 - Enum Migrations** (can be done in parallel):
- Developer A: PaymentMethod + PaymentStatus (T011-T021)
- Developer B: ProductStatus + BusinessType (T022-T034)
- Developer C: UserRole + UserStatus (T035-T048)

**US2 - Remove Duplicates** (can be done in parallel):
- All deletion tasks T049-T054 can run in parallel
- All search verification tasks T055-T058 can run in parallel

**US3 - Cleanup** (partially parallel):
- String literal searches T061-T064 can run in parallel
- Type definition updates T066-T068 can run in parallel
- Test updates T070-T073 can run in parallel

**Final Phase** (mostly parallel):
- Documentation tasks T081-T083 can run in parallel
- Code quality tasks T085-T086 can run in parallel

## Success Metrics (from spec.md)

Track these metrics during implementation:

- [ ] **SC-001**: 0 enum-related TypeScript compilation errors (check after T091)
- [ ] **SC-002**: 100% of frontend enum references import from backend (verify in T055-T058)
- [ ] **SC-003**: All E2E tests pass (verify in T093)
- [ ] **SC-004**: Adding new enum value requires changes in only one location (verify after migration complete)
- [ ] **SC-005**: Zero runtime errors due to enum mismatches (verify in T094)

## Testing Strategy

**Compile-Time Validation** (Primary):
- TypeScript compiler after each enum migration
- IDE type checking and autocomplete verification
- ESLint/Prettier to catch issues

**Runtime Validation** (Secondary):
- Manual browser testing after each migration
- Full test suite execution
- E2E tests for critical flows

**No Automated Tests Required**: Spec does not request test creation. Focus on TypeScript type safety and manual verification.

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Deliver User Story 1 First** (P1):
- Complete T001-T048 (Setup + Foundational + US1)
- This delivers immediate value: type safety and enum imports working
- Can be deployed and tested independently
- Estimated time: 4-5 hours

**Then User Story 2** (P2):
- Complete T049-T060 (Remove duplicates)
- Further improves code quality
- Estimated time: 1 hour

**Finally User Story 3** (P3):
- Complete T061-T080 (Cleanup and validation)
- Polish and ensure completeness
- Estimated time: 2 hours

**Total Estimated Time**: 8-9 hours for complete feature

### Incremental Delivery

Each enum migration can be:
- Developed in a separate commit
- Tested independently
- Deployed incrementally
- Rolled back if issues arise

**Suggested Commit Strategy**:
1. Setup + Foundational (T001-T010)
2. PaymentMethod migration (T011-T015)
3. PaymentStatus migration (T016-T021)
4. ProductStatus migration (T022-T028)
5. BusinessType migration (T029-T034)
6. UserRole migration (T035-T042)
7. UserStatus migration (T043-T048)
8. Remove duplicates (T049-T060)
9. Cleanup phase (T061-T080)
10. Final polish (T081-T095)

---

## Task Checklist Summary

**Total Tasks**: 95
- Setup: 6 tasks
- Foundational: 4 tasks
- User Story 1 (P1): 38 tasks ⭐ MVP
- User Story 2 (P2): 12 tasks
- User Story 3 (P3): 20 tasks
- Final Phase: 15 tasks

**Parallel Tasks**: 31 tasks marked with [P]
**Sequential Tasks**: 64 tasks

**Estimated Total Time**: 8-9 hours (can be reduced with parallel execution)

---

**Last Updated**: December 20, 2025  
**Status**: Ready for Implementation  
**Next Step**: Assign tasks to developers and begin with T001 (Setup Phase)
