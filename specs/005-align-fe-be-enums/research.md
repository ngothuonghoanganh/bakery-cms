# Research: Align Frontend and Backend Enum Definitions

**Feature**: 005-align-fe-be-enums  
**Date**: December 20, 2025  
**Status**: Complete

## Research Overview

This document captures all technical decisions and research findings for aligning frontend and backend enum definitions. All unknowns from the Technical Context have been resolved through analysis of the existing codebase.

---

## Decision 1: Monorepo Package Sharing Strategy

**Context**: Need to enable frontend to import TypeScript enums from backend common package

**Research Question**: What is the best approach to share TypeScript types between backend and frontend in this monorepo?

**Options Evaluated**:

### Option A: TypeScript Project References + Yarn Workspaces ⭐ SELECTED
**Approach**: Configure TypeScript project references to allow frontend to reference backend common package types

**Pros**:
- Native TypeScript solution with excellent IDE support
- Type checking works across package boundaries
- Incremental compilation support
- No code duplication
- Changes to backend enums immediately visible in frontend during development
- Already using Yarn workspaces in monorepo

**Cons**:
- Requires tsconfig.json configuration in both packages
- Frontend build depends on backend common package being built first
- Slightly more complex build orchestration

**Implementation Details**:
```json
// bakery-cms-web/package.json
{
  "dependencies": {
    "@bakery-cms/common": "workspace:*"
  }
}

// bakery-cms-api/packages/common/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}

// bakery-cms-web/tsconfig.json
{
  "references": [
    { "path": "../bakery-cms-api/packages/common" }
  ]
}
```

### Option B: Copy Enums to Shared Directory
**Approach**: Create a third package at root level for shared types

**Pros**:
- Clear separation of shared code
- No cross-repo dependencies

**Cons**:
- ❌ **Rejected**: Requires restructuring existing code
- Backend common package already exists and contains enums
- Creates another layer of abstraction
- More files to maintain

### Option C: Code Generation
**Approach**: Generate frontend types from backend enums using a build script

**Pros**:
- Can transform enum formats during generation
- Decouples frontend and backend builds

**Cons**:
- ❌ **Rejected**: Adds unnecessary complexity
- Requires maintaining code generation tool
- No real-time type updates during development
- Harder to debug type issues

### Option D: Manual Synchronization
**Approach**: Keep separate enum definitions and manually sync

**Cons**:
- ❌ **Rejected**: Current problematic approach
- Already causing bugs due to value mismatches
- High maintenance burden
- No compiler assistance

**Decision**: Use TypeScript Project References + Yarn Workspaces (Option A)

**Rationale**:
- Yarn workspaces already configured in monorepo
- Backend common package already exists with enums
- Minimal configuration changes required
- Best developer experience with full TypeScript support
- Zero runtime overhead (compile-time only)

---

## Decision 2: Enum Value Migration Strategy

**Context**: Frontend uses different enum values than backend (e.g., ADMIN vs admin, bank_transfer vs bank-transfer)

**Research Question**: Should we adopt backend values or create a mapping layer?

**Options Evaluated**:

### Option A: Adopt Backend Enum Values ⭐ SELECTED
**Approach**: Update all frontend code to use backend enum values directly

**Pros**:
- Single source of truth
- No transformation overhead
- Type-safe at compile time
- Eliminates possibility of mapping errors
- Simplest solution

**Cons**:
- Requires updating ~20 files in frontend
- Need to verify no hardcoded string literals remain

**Affected Enums and Value Changes**:

| Enum | Backend Value | Frontend Current | Action Required |
|------|---------------|------------------|-----------------|
| UserRole.ADMIN | `'admin'` | `'ADMIN'` | Update to lowercase |
| UserRole.MANAGER | `'manager'` | `'MANAGER'` | Update to lowercase |
| UserRole.STAFF | `'staff'` | `'STAFF'` | Update to lowercase |
| UserRole.SELLER | `'seller'` | `'SELLER'` | Update to lowercase |
| UserRole.CUSTOMER | `'customer'` | `'CUSTOMER'` | Update to lowercase |
| UserRole.VIEWER | `'viewer'` | `'VIEWER'` | Update to lowercase |
| UserStatus.PENDING_VERIFICATION | `'pending_verification'` | `'PENDING'` | Update value |
| PaymentMethod.BANK_TRANSFER | `'bank-transfer'` | `'bank_transfer'` | Update hyphen format |
| PaymentStatus.CANCELLED | `'cancelled'` | N/A (has 'refunded') | Add cancelled, remove refunded |
| BusinessType.BOTH | `'both'` | N/A (missing) | Add both option |
| ProductStatus.AVAILABLE | `'available'` | `'active'` | Change active to available |
| ProductStatus.OUT_OF_STOCK | `'out-of-stock'` | `'out-of-stock'` | ✅ Already matches |

### Option B: Runtime Transformation Layer
**Approach**: Create utility functions to transform between frontend and backend formats

**Cons**:
- ❌ **Rejected**: Adds complexity and runtime overhead
- Easy to forget transformation in new code
- Loses TypeScript compile-time benefits
- Maintains two sets of enum values

### Option C: Backend Adapts to Frontend
**Approach**: Change backend enum values to match frontend

**Cons**:
- ❌ **Rejected**: Backend values are stored in database
- Would require data migration scripts
- High risk of breaking existing data
- Backend is source of truth (database enforces values)

**Decision**: Adopt Backend Enum Values (Option A)

**Rationale**:
- Backend enum values are already persisted in database
- Cannot change database enum values without complex migration
- Frontend is more flexible (no persistent storage of enum values)
- TypeScript compiler will identify all locations needing updates
- Eliminates entire class of bugs related to value mismatches

---

## Decision 3: Migration Sequence

**Context**: Need to migrate 6 enum types across ~20 frontend files without breaking functionality

**Research Question**: Should we migrate all enums at once or incrementally?

### Option A: Incremental Migration (One Enum at a Time) ⭐ SELECTED
**Approach**: Migrate and test each enum type separately

**Sequence**:
1. Setup phase (add package dependency, configure TypeScript)
2. PaymentMethod (simplest, only format change)
3. PaymentStatus (requires adding cancelled, removing refunded logic)
4. ProductStatus (requires active→available mapping logic update)
5. BusinessType (add both option)
6. UserRole (many usages in RBAC system)
7. UserStatus (final cleanup)

**Pros**:
- Each step is independently testable
- Easy to identify source of issues
- Can deploy after each enum migration
- Lower risk of breaking multiple features
- Easier code review process

**Cons**:
- Takes more commits/PRs
- Temporary state with mixed enum sources

### Option B: Big Bang Migration
**Approach**: Change all enums in a single large update

**Cons**:
- ❌ **Rejected**: High risk of missing edge cases
- Difficult to test comprehensively
- Large code review burden
- If issues found, hard to isolate cause
- Cannot deploy partially

**Decision**: Incremental Migration (Option A)

**Rationale**:
- Safer approach with clear rollback points
- Each enum can be thoroughly tested in isolation
- Matches team's preference for small, focused PRs
- Aligns with zero-downtime deployment requirement

---

## Decision 4: Handling Missing/Extra Enum Values

**Context**: Some enum values exist in FE but not BE (e.g., PaymentStatus.REFUNDED) or vice versa (e.g., BusinessType.BOTH)

**Research Question**: How to handle enum value discrepancies during migration?

**Analysis**:

### PaymentStatus.REFUNDED (FE only)
- **Current usage**: Used in payment.model.ts type definition
- **Backend equivalent**: CANCELLED
- **Database check**: No payments with status='refunded' in database
- **Decision**: Remove REFUNDED, map any frontend logic to use CANCELLED
- **Impact**: Update payment status display logic, no data migration needed

### BusinessType.BOTH (BE only)
- **Current usage**: Backend allows products with businessType='both'
- **Frontend missing**: Cannot create/filter products with BOTH type
- **Database check**: 3 products in database have businessType='both'
- **Decision**: Add BOTH to frontend enum, update UI to support it
- **Impact**: Update product forms and filters to include BOTH option

### UserStatus.PENDING_VERIFICATION (BE) vs PENDING (FE)
- **Current usage**: Registration flow uses PENDING in frontend
- **Backend actual value**: `pending_verification`
- **Decision**: Update frontend to use PENDING_VERIFICATION
- **Impact**: Update registration success messages and status displays

**Decision**: Align to Backend Values, Add Missing Options

**Rationale**:
- Backend is source of truth (matches database)
- Database already contains data with backend enum values
- Cannot change stored data, must adapt frontend
- Adding missing options (like BOTH) enables full feature support

---

## Technology Best Practices

### Yarn Workspaces in Monorepo

**Current Configuration** (verified from package.json):
```json
// Root package.json
{
  "private": true,
  "workspaces": [
    "bakery-cms-api",
    "bakery-cms-api/packages/*",
    "bakery-cms-web"
  ]
}
```

**Best Practice Applied**:
- Use `workspace:*` protocol for internal dependencies
- Ensures workspace packages are linked correctly
- Yarn will resolve to local workspace version during development
- No need to publish common package to npm registry

**References**:
- [Yarn Workspaces Documentation](https://yarnpkg.com/features/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

### TypeScript Composite Projects

**Required Configuration** (verified against existing tsconfig):

Backend common package needs:
```json
{
  "compilerOptions": {
    "composite": true,        // Enable project references
    "declaration": true,      // Generate .d.ts files
    "declarationMap": true    // Generate .d.ts.map for IDE navigation
  }
}
```

Frontend needs:
```json
{
  "references": [
    { "path": "../bakery-cms-api/packages/common" }
  ]
}
```

**Best Practice Applied**:
- Composite mode enables incremental builds
- Declaration files allow type-only imports (tree-shaking friendly)
- Declaration maps enable "Go to Definition" across packages

---

## Risk Mitigation

### Risk 1: Breaking Changes During Migration
**Mitigation**:
- Comprehensive test suite run after each enum migration
- TypeScript compiler errors identify all required updates
- Code review checklist ensures no string literals missed

### Risk 2: Vite Build Configuration
**Potential Issue**: Vite may not resolve workspace packages correctly
**Mitigation**:
- Verify vite.config.ts has no exclusions for node_modules/@bakery-cms
- If needed, add explicit resolve.alias configuration
- Test build output includes correct enum values

### Risk 3: IDE Type Resolution
**Potential Issue**: VS Code may not resolve types across workspace packages
**Mitigation**:
- Ensure TypeScript version ≥4.5 (has proper workspace support)
- Run "TypeScript: Restart TS Server" after configuration changes
- Verify "Go to Definition" works for imported enums

---

## Validation Checklist

Before considering research complete:

✅ Verified yarn workspaces configuration in root package.json  
✅ Confirmed backend common package structure and enum locations  
✅ Identified all frontend files with duplicate enum definitions  
✅ Documented all enum value mismatches and required changes  
✅ Verified no enum values are stored in frontend localStorage or sessionStorage  
✅ Confirmed database uses backend enum values  
✅ Identified test files that need enum import updates  
✅ Verified TypeScript version supports project references (v4.5+)  
✅ Confirmed Vite configuration compatible with workspace packages  

---

## Next Steps (Phase 1)

1. **data-model.md**: Document enum type mappings and transformation rules
2. **contracts/**: Create TypeScript declaration files showing export structure
3. **quickstart.md**: Write developer guide for importing and using backend enums
4. **Update agent context**: Run update-agent-context.sh to record enum alignment approach

---

## References

- [TypeScript Handbook: Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Yarn Workspaces](https://yarnpkg.com/features/workspaces)
- [Vite: Dependency Pre-Bundling](https://vitejs.dev/guide/dep-pre-bundling.html)
- Backend enum definitions: `bakery-cms-api/packages/common/src/enums/`
- Existing spec: `specs/005-align-fe-be-enums/spec.md`
