# Implementation Plan: Align Frontend and Backend Enum Definitions

**Branch**: `005-align-fe-be-enums` | **Date**: December 20, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-align-fe-be-enums/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Eliminate enum definition conflicts between frontend and backend by establishing the backend common package as the single source of truth for all enum types. Frontend code will import enums directly from `@bakery-cms/common` instead of maintaining duplicate definitions with mismatched values (e.g., ADMIN vs admin, bank_transfer vs bank-transfer, refunded vs cancelled). This ensures type safety, eliminates runtime errors, and reduces maintenance burden through TypeScript project references and yarn workspace configuration.

## Technical Context

**Language/Version**: TypeScript 5.x (both frontend and backend)  
**Primary Dependencies**: 
  - Backend: Express.js, Sequelize, @bakery-cms/common
  - Frontend: React 18+, Vite, Zustand, Ant Design
**Storage**: MySQL (enum values stored in database, cannot be changed)  
**Testing**: Jest (backend), Vitest (frontend), E2E testing for integration  
**Target Platform**: Web application (Node.js backend + browser frontend)  
**Project Type**: Monorepo with separate backend/frontend workspaces  
**Performance Goals**: No build time increase >5s, bundle size increase <5KB  
**Constraints**: 
  - Must maintain backward compatibility with existing database data
  - Cannot break existing API endpoints
  - Zero downtime deployment required
  - Must not change backend enum values (stored in DB)
**Scale/Scope**: 
  - 6 enum types to migrate (UserRole, UserStatus, PaymentMethod, PaymentStatus, BusinessType, ProductStatus)
  - ~20 files affected across frontend codebase
  - 50+ enum value references to update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Review

✅ **Functional Programming Principles**
- No violations: This feature updates type imports and enum usage, maintaining existing functional patterns
- Pure functions remain pure (no behavioral changes)
- Immutability preserved (enum values are constants)

✅ **Component Architecture** (Frontend)
- No violations: Changes only affect import statements and type definitions
- Component structure unchanged (Core/Shared/Detail hierarchy maintained)
- No new components created

✅ **Type Safety**
- **ENHANCEMENT**: Improves type safety by using backend enums as source of truth
- Eliminates type mismatches between frontend and backend
- Leverages TypeScript's type system for compile-time checking

✅ **Code Organization**
- Follows DRY principle by eliminating duplicate enum definitions
- Maintains monorepo structure
- No architectural changes required

✅ **Testing Requirements**
- Existing tests will be updated to use backend enum imports
- No reduction in test coverage
- Integration tests will verify enum value consistency

### Gates Assessment

**All gates PASSED** ✅

- No complexity increases (refactoring only)
- No new dependencies added (using existing workspace packages)
- Maintains backward compatibility
- Follows established patterns for monorepo code sharing
- Improves maintainability by reducing duplication

**Re-check Required**: After Phase 1 design completion to verify implementation approach maintains compliance.

## Project Structure

### Documentation (this feature)

```text
specs/005-align-fe-be-enums/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── enum-exports.ts  # TypeScript declarations for shared enums
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo with separate backend and frontend

bakery-cms-api/
├── packages/
│   └── common/
│       ├── package.json           # Exports enums for frontend consumption
│       ├── tsconfig.json          # Configured for composite builds
│       └── src/
│           ├── enums/             # ✅ SOURCE OF TRUTH
│           │   ├── auth.enums.ts  # UserRole, UserStatus, AuthProvider, TokenType
│           │   ├── payment.enums.ts # PaymentMethod, PaymentStatus
│           │   └── product.enums.ts # BusinessType, ProductStatus
│           └── index.ts           # Re-exports all enums

bakery-cms-web/
├── package.json                   # Add: "@bakery-cms/common": "workspace:*"
├── tsconfig.json                  # Configure path aliases and references
├── vite.config.ts                 # Ensure workspace package resolution
└── src/
    ├── types/
    │   └── models/
    │       ├── payment.model.ts   # ❌ REMOVE local PaymentMethod/PaymentStatus
    │       └── product.model.ts   # ❌ REMOVE local BusinessType/ProductStatus
    ├── services/
    │   └── auth.service.ts        # ❌ REMOVE local UserRole/UserStatus
    └── [all files using enums]    # ✅ UPDATE to import from @bakery-cms/common
```

**Structure Decision**: Using existing monorepo structure with workspace dependencies. The backend `common` package already exists and contains enum definitions. Frontend will add it as a workspace dependency to enable direct TypeScript imports. No new directories or restructuring required - only import statement updates and removal of duplicate enum definitions.

## Complexity Tracking

**No violations identified** - All constitution gates passed ✅

This feature reduces complexity by:
- Eliminating duplicate enum definitions (DRY principle)
- Reducing maintenance burden (single source of truth)
- Improving type safety (compile-time checking)
- Following established monorepo patterns

---

## Phase 0: Research (COMPLETE ✅)

**Output**: [research.md](./research.md)

**Key Decisions Made**:

1. **Package Sharing Strategy**: TypeScript Project References + Yarn Workspaces
   - Leverages existing monorepo setup
   - Provides excellent IDE support and type checking
   - No code duplication

2. **Enum Value Migration**: Adopt backend values as authoritative
   - Backend values stored in database (cannot change)
   - Frontend more flexible (no persistent storage)
   - TypeScript compiler identifies all update locations

3. **Migration Sequence**: Incremental (one enum at a time)
   - Lower risk with clear rollback points
   - Easier testing and code review
   - Aligns with zero-downtime requirement

4. **Handling Discrepancies**: Align to backend, add missing options
   - Remove PaymentStatus.REFUNDED → use CANCELLED
   - Add BusinessType.BOTH to frontend
   - Update ProductStatus: active → available

**All Research Questions Resolved**: No clarifications needed ✅

---

## Phase 1: Design & Contracts (COMPLETE ✅)

**Outputs**:
- [data-model.md](./data-model.md) - Enum type mappings and transformations
- [contracts/enum-exports.ts](./contracts/enum-exports.ts) - TypeScript declarations
- [quickstart.md](./quickstart.md) - Developer guide

**Data Model Summary**:

| Enum | Values | Frontend Change Required |
|------|--------|-------------------------|
| UserRole | admin, manager, staff, seller, customer, viewer | UPPERCASE → lowercase |
| UserStatus | active, inactive, suspended, pending_verification | PENDING → pending_verification |
| PaymentMethod | cash, vietqr, bank-transfer | bank_transfer → bank-transfer |
| PaymentStatus | pending, paid, failed, cancelled | Remove refunded, use cancelled |
| BusinessType | made-to-order, ready-to-sell, both | Add both option |
| ProductStatus | available, out-of-stock | active → available, remove inactive |

**Contracts Defined**:
- Export structure documented in `contracts/enum-exports.ts`
- All 6 enum types fully specified with JSDoc
- Usage examples provided
- Migration notes included

**Developer Guide Created**:
- Step-by-step import instructions
- Common patterns (Zustand, RBAC, display labels)
- Troubleshooting section
- Value change reference table

### Constitution Re-check

✅ **All compliance requirements still met after design**
- No architectural changes
- Maintains functional programming patterns
- Improves type safety
- No test coverage reduction

---

## Phase 2: Implementation Tasks (NEXT STEP)

**Command**: `/speckit.tasks` (NOT run by this command)

The tasks phase will break down implementation into:

1. **Setup Tasks**
   - Configure frontend package.json dependency
   - Update tsconfig.json for project references
   - Build backend common package
   - Verify Vite configuration

2. **Migration Tasks** (per enum)
   - Update import statements
   - Remove local enum definitions
   - Replace string literals with enum constants
   - Update test files
   - Verify TypeScript compilation
   - Run integration tests

3. **Cleanup Tasks**
   - Remove unused imports
   - Update documentation
   - Verify no hardcoded strings remain
   - Final E2E test run

**Estimated Scope**: 15-20 tasks across all enums

---

## Implementation Sequence

### Recommended Order

1. **Setup Phase** (Prerequisites)
   - Add workspace dependency
   - Configure TypeScript
   - Build backend common package
   - Verify IDE resolution

2. **Enum Migration** (Incremental)
   - PaymentMethod (simplest - format change only)
   - PaymentStatus (add cancelled, remove refunded logic)
   - ProductStatus (active → available mapping)
   - BusinessType (add both option)
   - UserRole (many RBAC usages)
   - UserStatus (final cleanup)

3. **Testing & Validation**
   - Unit tests after each enum
   - Integration tests after all enums
   - E2E tests for critical flows
   - Manual verification of UI displays

4. **Documentation**
   - Update component storybook (if exists)
   - Update API documentation
   - Add migration notes to changelog

### Risk Mitigation Per Phase

**Setup Phase Risks**:
- Vite may not resolve workspace packages
- IDE may not show autocomplete
- Mitigation: Test with simple import first

**Migration Phase Risks**:
- Missed hardcoded string literals
- Broken API calls
- Mitigation: TypeScript errors + grep search + tests

**Testing Phase Risks**:
- Edge cases with enum values
- API integration failures
- Mitigation: Comprehensive test suite + manual QA

---

## Success Metrics

### Phase Completion Criteria

**Phase 0 - Research** ✅
- [x] All technical decisions documented
- [x] No NEEDS CLARIFICATION markers
- [x] Migration strategy defined
- [x] Risks identified and mitigated

**Phase 1 - Design** ✅
- [x] Data model documented
- [x] Contracts defined
- [x] Developer guide created
- [x] Constitution re-check passed

**Phase 2 - Tasks** (To be completed by `/speckit.tasks`)
- [ ] Implementation tasks defined
- [ ] Task dependencies identified
- [ ] Effort estimates provided
- [ ] Acceptance criteria per task

### Feature Completion Criteria

From [spec.md](./spec.md) Success Criteria:

- [ ] **SC-001**: 0 enum-related TypeScript compilation errors
- [ ] **SC-002**: 100% of frontend enum references import from backend
- [ ] **SC-003**: All E2E tests pass with matching enum values
- [ ] **SC-004**: Adding new enum value requires changes in only one location
- [ ] **SC-005**: Zero runtime errors due to enum value mismatches

---

## Files Affected (Estimated)

### Frontend Files to Modify

**Type Definitions** (~3 files):
- `src/types/models/payment.model.ts`
- `src/types/models/product.model.ts`
- `src/types/models/order.model.ts`

**Services** (~5 files):
- `src/services/auth.service.ts`
- `src/services/rbac.service.ts`
- `src/services/payment.service.ts`
- `src/services/product.service.ts`
- `src/services/order.service.ts`

**Components** (~8 files):
- Role-based access components
- Payment status displays
- Product status badges
- User status indicators
- Form selects with enum options

**Tests** (~5 files):
- Service tests
- Component tests
- Integration tests

**Configuration** (~3 files):
- `package.json`
- `tsconfig.json`
- `vite.config.ts` (verification only)

**Total Estimated**: ~24 files

---

## Next Steps

1. **Review this plan** with team for approval
2. **Run `/speckit.tasks`** to generate detailed implementation tasks
3. **Assign tasks** to team members
4. **Begin implementation** following the incremental migration sequence
5. **Track progress** using the tasks.md checklist

---

## Related Documentation

- **Feature Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Contracts**: [contracts/enum-exports.ts](./contracts/enum-exports.ts)
- **Quick Start**: [quickstart.md](./quickstart.md)
- **Constitution**: `/.specify/memory/constitution.md`

---

**Plan Status**: ✅ COMPLETE - Ready for task breakdown
**Last Updated**: December 20, 2025
**Next Command**: `/speckit.tasks` to generate implementation tasks
