# Feature Specification: Align Frontend and Backend Enum Definitions

**Feature Branch**: `005-align-fe-be-enums`  
**Created**: December 20, 2025  
**Status**: Draft  
**Input**: User description: "all enum in BE and FE is conflict, refer using enum in BE update all enum in FE allow enum in BE"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Type Safety and Consistency (Priority: P1)

Developers working on the frontend can import and use enum types directly from the backend common package, ensuring type safety and preventing value mismatches between frontend and backend code.

**Why this priority**: This is the core problem - enum value inconsistencies cause runtime errors and data mismatches. Resolving this prevents bugs and improves developer experience.

**Independent Test**: Can be fully tested by importing a backend enum in the frontend code, using it in API calls, and verifying that TypeScript compilation succeeds and the values match what the backend expects.

**Acceptance Scenarios**:

1. **Given** a developer is implementing a feature that uses UserRole enum, **When** they import the enum from the backend package, **Then** TypeScript provides autocomplete and type checking for all valid role values
2. **Given** the frontend sends a payment with a specific PaymentMethod value, **When** the backend receives it, **Then** the value matches exactly without transformation
3. **Given** a developer updates an enum value in the backend, **When** they rebuild the frontend, **Then** TypeScript compilation errors alert them to any places that need updating

---

### User Story 2 - Eliminate Duplicate Enum Definitions (Priority: P2)

The codebase maintains a single source of truth for all enum definitions in the backend common package, with the frontend importing these definitions rather than maintaining separate copies.

**Why this priority**: Duplicate enum definitions lead to maintenance burden and drift over time. A single source of truth prevents these issues.

**Independent Test**: Can be fully tested by searching the frontend codebase for local enum definitions and verifying they've all been replaced with imports from the backend package.

**Acceptance Scenarios**:

1. **Given** an enum is defined in the backend, **When** searching the frontend codebase, **Then** no duplicate enum definition exists
2. **Given** a developer needs to add a new enum value, **When** they add it to the backend common package, **Then** the frontend automatically has access to it after rebuilding
3. **Given** all frontend enum usages, **When** code is compiled, **Then** no runtime errors occur due to enum value mismatches

---

### User Story 3 - Smooth Migration Path (Priority: P3)

Existing frontend code using locally-defined enums can be gradually migrated to use backend enums without breaking functionality, allowing for incremental updates.

**Why this priority**: A smooth migration prevents disruption and allows the team to update code progressively rather than requiring a big-bang rewrite.

**Independent Test**: Can be fully tested by migrating one enum at a time (e.g., PaymentMethod first), running tests after each migration, and verifying all functionality remains intact.

**Acceptance Scenarios**:

1. **Given** a frontend component uses a local PaymentMethod enum, **When** the developer replaces it with the backend import, **Then** all existing functionality continues to work
2. **Given** the migration is partially complete, **When** the application runs, **Then** both migrated and non-migrated enums work correctly
3. **Given** the migration is complete, **When** running the build, **Then** no TypeScript errors occur and all tests pass

---

### Edge Cases

- What happens when an enum value exists in the frontend but not the backend (e.g., PaymentStatus.REFUNDED in FE but not in BE)?
- What happens when enum values have different casing (e.g., ADMIN vs admin)?
- What happens when enum values have different naming conventions (e.g., bank_transfer vs bank-transfer)?
- How does the frontend handle backward compatibility if backend enum values change?
- What happens when the frontend uses string literals instead of enum values in some places?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Frontend code MUST import all enum types from the backend common package (@bakery-cms/common) rather than defining local copies
- **FR-002**: All enum values in the frontend MUST exactly match the backend enum values (including casing and format)
- **FR-003**: Frontend build process MUST include the backend common package as a dependency to ensure type definitions are available
- **FR-004**: TypeScript configuration MUST allow cross-package type imports from backend to frontend
- **FR-005**: Frontend code MUST use the backend's enum types in all API request/response interfaces
- **FR-006**: All existing frontend enum usages MUST be replaced with backend enum imports
- **FR-007**: Frontend type definitions MUST be updated to reference backend enums instead of local type aliases
- **FR-008**: Enum value inconsistencies (casing, naming, missing values) MUST be resolved by aligning to backend definitions

### Key Entities

- **Backend Enums (Source of Truth)**: TypeScript enums defined in `/bakery-cms-api/packages/common/src/enums/` including:
  - UserRole (admin, manager, staff, seller, customer, viewer)
  - UserStatus (active, inactive, suspended, pending_verification)
  - AuthProvider (local, google, facebook)
  - TokenType (access, refresh, email_verification, password_reset)
  - PaymentMethod (cash, vietqr, bank-transfer)
  - PaymentStatus (pending, paid, failed, cancelled)
  - BusinessType (made-to-order, ready-to-sell, both)
  - ProductStatus (available, out-of-stock)
  
- **Frontend Enum Replacements**: Const objects and type aliases in frontend code that need to be replaced with backend imports:
  - UserRole in `/bakery-cms-web/src/services/auth.service.ts` (uses UPPERCASE values like ADMIN, MANAGER)
  - UserStatus in `/bakery-cms-web/src/services/auth.service.ts` (uses UPPERCASE values like ACTIVE, PENDING)
  - PaymentMethod in `/bakery-cms-web/src/types/models/payment.model.ts` (uses bank_transfer vs bank-transfer)
  - PaymentStatus in `/bakery-cms-web/src/types/models/payment.model.ts` (uses refunded which doesn't exist in BE, missing cancelled)
  - BusinessType in `/bakery-cms-web/src/types/models/product.model.ts` (missing "both" option)
  - ProductStatus in `/bakery-cms-web/src/types/models/product.model.ts` (uses active/inactive vs available/out-of-stock)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All enum-related TypeScript compilation errors are eliminated (0 enum-related type errors in build output)
- **SC-002**: 100% of frontend enum references import from backend common package (verified by code search showing no local enum definitions)
- **SC-003**: All API calls between frontend and backend use matching enum values (verified by end-to-end tests passing)
- **SC-004**: Developer productivity improves - adding a new enum value requires changes in only one location (backend common package)
- **SC-005**: Zero runtime errors occur due to enum value mismatches (verified by production error logs)

## Non-Functional Requirements

- **NFR-001**: Build time should not increase by more than 5 seconds when adding backend package dependency
- **NFR-002**: Frontend bundle size should not increase significantly (less than 5KB increase)
- **NFR-003**: TypeScript IntelliSense and autocomplete must work for imported backend enums
- **NFR-004**: Changes should not break existing functionality or require database migrations

## Assumptions

- The backend enum values represent the correct, authoritative definitions
- The backend common package can be imported as a dependency in the frontend project
- TypeScript is configured to allow path aliases and cross-package imports
- The monorepo structure allows sharing code between backend and frontend packages
- Existing API contracts will continue to use the backend enum values

## Constraints

- Must maintain backward compatibility with existing data in the database
- Cannot change backend enum values as they may be stored in the database
- Must not break existing API endpoints that clients depend on
- Changes should be completed without requiring system downtime

## Dependencies

- Backend common package (`@bakery-cms/common`) must be properly exported and built
- Frontend package.json must include backend common package as a dependency
- TypeScript configuration must support workspace references or path mapping
- Build tools (Vite/Webpack) must be configured to resolve backend package imports

## Out of Scope

- Changing backend enum value definitions or adding new enum values
- Database migrations to update stored enum values
- Creating a code generator or automated synchronization tool
- Adding runtime enum validation (beyond TypeScript type checking)
- Implementing enum value transformation layers or adapters

## Technical Considerations

### Current State Analysis

**Backend Enum Locations** (Source of Truth):
```
bakery-cms-api/packages/common/src/enums/
├── auth.enums.ts (UserRole, UserStatus, AuthProvider, TokenType, AuthEventType)
├── payment.enums.ts (PaymentMethod, PaymentStatus)
└── product.enums.ts (BusinessType, ProductStatus)
```

**Frontend Enum Conflicts Identified**:

1. **UserRole** - Casing mismatch:
   - Backend: `admin`, `manager`, `staff`, `seller`, `customer`, `viewer` (lowercase)
   - Frontend: `ADMIN`, `MANAGER`, `STAFF`, `SELLER`, `CUSTOMER`, `VIEWER` (UPPERCASE)

2. **UserStatus** - Casing and naming mismatch:
   - Backend: `active`, `inactive`, `suspended`, `pending_verification`
   - Frontend: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING` (UPPERCASE and PENDING vs pending_verification)

3. **PaymentMethod** - Value format mismatch:
   - Backend: `cash`, `vietqr`, `bank-transfer` (hyphenated)
   - Frontend: `cash`, `vietqr`, `bank_transfer` (underscored)

4. **PaymentStatus** - Value mismatch:
   - Backend: `pending`, `paid`, `failed`, `cancelled`
   - Frontend: `pending`, `paid`, `failed`, `refunded` (has refunded instead of cancelled)

5. **BusinessType** - Missing value:
   - Backend: `made-to-order`, `ready-to-sell`, `both`
   - Frontend: `made-to-order`, `ready-to-sell` (missing "both")

6. **ProductStatus** - Complete value mismatch:
   - Backend: `available`, `out-of-stock`
   - Frontend: `active`, `inactive`, `out-of-stock` (uses active/inactive instead of available)

### Migration Strategy

The migration should follow this sequence:

1. **Setup Phase**: Configure frontend to import backend common package
2. **Type Replacement Phase**: Replace frontend type definitions with backend imports
3. **Value Update Phase**: Update all hardcoded string literals to use backend enum values
4. **Testing Phase**: Verify all functionality with updated enums
5. **Cleanup Phase**: Remove old enum definitions and unused imports

### Risk Assessment

**High Risk**:
- Enum value mismatches could break API communication if not updated everywhere
- Database queries using enum values might fail if values change

**Medium Risk**:
- Build configuration issues could prevent frontend from importing backend package
- TypeScript compilation errors could be widespread during migration

**Low Risk**:
- Bundle size increase from importing backend package
- Build time increase from additional dependencies

## Research & Technology Decisions

### Technology Choice: Monorepo Package Sharing Strategy

**Purpose**: Enable the frontend to import and use TypeScript enums defined in the backend common package

**Options Considered**:

1. **TypeScript Project References (Workspace References)**
   - Pros: Native TypeScript solution, excellent IDE support, maintains type safety, incremental builds
   - Cons: Requires careful tsconfig.json setup, more complex build configuration
   
2. **Symlink via yarn/npm workspaces**
   - Pros: Simple setup, works with existing monorepo tools, no special TypeScript config needed
   - Cons: May require build step for backend package before frontend can use it
   
3. **Copy enums to shared directory**
   - Pros: No cross-package dependencies, simpler build setup
   - Cons: Violates DRY principle, requires manual synchronization, high maintenance burden
   
4. **Generate types from backend to frontend**
   - Pros: Can include runtime validation, can transform enum formats
   - Cons: Adds build complexity, requires code generation tool, not real-time updates during development

**Selected**: TypeScript Project References (Workspace References) with yarn workspaces

**Justification**: 
- Maintains single source of truth without duplication
- Provides excellent developer experience with IntelliSense and type checking
- Already using monorepo structure with yarn workspaces
- Native TypeScript solution with no additional tooling required
- Supports incremental builds for faster development

**Trade-offs**: 
- Initial setup requires updating tsconfig.json in both packages
- Frontend build depends on backend common package being built first
- More complex build orchestration in CI/CD

**References**:
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)

### Business Solution: Enum Value Migration Approach

**Problem**: Frontend uses different enum values than backend, causing potential runtime errors and data inconsistencies

**Proposed Solution**: Adopt backend enum values as the authoritative source and update all frontend code to use these values

**Alternatives Considered**:

1. **Backend adapts to frontend values**
   - Rejected: Backend values are already stored in database; changing them would require data migrations

2. **Runtime transformation layer**
   - Rejected: Adds unnecessary complexity and performance overhead; TypeScript compile-time checking is preferable

3. **Maintain both sets of values with mapping**
   - Rejected: Violates DRY principle; mapping layer adds complexity and maintenance burden

**Expected Impact**: 
- Eliminates enum-related bugs and type errors
- Reduces maintenance burden by removing duplicate definitions
- Improves developer confidence in API integration
- Enables faster feature development with shared types

**Risk Assessment**: 
- Risk: Breaking existing functionality during migration
- Mitigation: Incremental migration with thorough testing after each step

**Mitigation Strategy**:
- Create comprehensive test suite covering all enum usages before starting migration
- Migrate one enum at a time rather than all at once
- Use TypeScript compiler to identify all locations that need updates
- Keep detailed documentation of value mappings for reference

## Implementation Notes

### Frontend Configuration Changes Required

1. **package.json** - Add backend common package as dependency:
```json
{
  "dependencies": {
    "@bakery-cms/common": "workspace:*"
  }
}
```

2. **tsconfig.json** - Configure project references (if using TypeScript project references):
```json
{
  "references": [
    { "path": "../bakery-cms-api/packages/common" }
  ]
}
```

3. **vite.config.ts** - Ensure Vite can resolve workspace packages (may already be configured)

### Enum Migration Checklist

For each enum, follow these steps:

1. ✅ Identify all frontend locations using the enum
2. ✅ Update import statements to reference backend package
3. ✅ Update any hardcoded string literals to use enum values
4. ✅ Update type definitions to use backend enum type
5. ✅ Remove local enum definition
6. ✅ Run TypeScript compilation and fix errors
7. ✅ Run tests and verify functionality
8. ✅ Update any related documentation

### Testing Strategy

**Unit Tests**:
- Verify enum imports work correctly
- Test that components using enums compile without errors
- Validate that API service functions use correct enum values

**Integration Tests**:
- Test API calls with enum values are successful
- Verify backend accepts frontend enum values without transformation
- Test roundtrip serialization/deserialization of enum values

**E2E Tests**:
- Test critical user flows involving enum values (e.g., creating payment, updating product status)
- Verify UI correctly displays enum-based statuses and selections
- Test form submissions with enum values

## Acceptance Criteria

✅ All frontend enum definitions are removed and replaced with backend imports  
✅ TypeScript compilation succeeds with no enum-related type errors  
✅ All unit tests pass with updated enum imports  
✅ All integration tests pass with matching enum values between FE and BE  
✅ All E2E tests pass demonstrating full functionality  
✅ Code review confirms no duplicate enum definitions exist  
✅ Documentation is updated to reflect single source of truth approach  
✅ Developer guide includes instructions for adding new enum values  

## Related Documentation

- Backend enum definitions: `/bakery-cms-api/packages/common/src/enums/`
- Frontend type models: `/bakery-cms-web/src/types/models/`
- API service implementations: `/bakery-cms-web/src/services/`
- TypeScript configuration: `/bakery-cms-web/tsconfig.json`
