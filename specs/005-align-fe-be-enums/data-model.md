# Data Model: Enum Type Mappings

**Feature**: 005-align-fe-be-enums  
**Date**: December 20, 2025  
**Phase**: Design (Phase 1)

## Overview

This document defines the enum type structures and mapping rules for aligning frontend and backend enum definitions. The backend enums serve as the authoritative source, and this document shows how frontend code will transition from local definitions to backend imports.

---

## Enum Definitions (Source of Truth)

All enums are defined in `bakery-cms-api/packages/common/src/enums/`

### Authentication Enums

#### UserRole
**File**: `auth.enums.ts`  
**Purpose**: Define user permission levels in the system

```typescript
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  SELLER = 'seller',
  CUSTOMER = 'customer',
  VIEWER = 'viewer',
}
```

**Value Semantics**:
- `admin`: Full system access, can manage all resources
- `manager`: Can manage products, orders, and staff
- `staff`: Can manage orders and view products
- `seller`: Can create products and manage own inventory
- `customer`: Can place orders
- `viewer`: Read-only access

**Frontend Migration**:
- **Current**: Uses UPPERCASE values (`'ADMIN'`, `'MANAGER'`)
- **Target**: Use lowercase values (`'admin'`, `'manager'`)
- **Files Affected**: `auth.service.ts`, `rbac.service.ts`, role-based components

#### UserStatus
**File**: `auth.enums.ts`  
**Purpose**: Track user account state

```typescript
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}
```

**Value Semantics**:
- `active`: User can log in and use system
- `inactive`: User account deactivated, cannot log in
- `suspended`: Temporarily blocked, usually for policy violation
- `pending_verification`: Email not verified, limited access

**Frontend Migration**:
- **Current**: Uses `'PENDING'` instead of `'pending_verification'`
- **Target**: Use `'pending_verification'`
- **Files Affected**: `auth.service.ts`, registration flow, user status displays

#### AuthProvider
**File**: `auth.enums.ts`  
**Purpose**: Track authentication method used

```typescript
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}
```

**Value Semantics**:
- `local`: Email/password authentication
- `google`: OAuth with Google
- `facebook`: OAuth with Facebook

**Frontend Migration**: No conflicts (not duplicated in frontend)

#### TokenType
**File**: `auth.enums.ts`  
**Purpose**: Differentiate JWT token purposes

```typescript
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}
```

**Frontend Migration**: No conflicts (not duplicated in frontend)

---

### Payment Enums

#### PaymentMethod
**File**: `payment.enums.ts`  
**Purpose**: Supported payment methods

```typescript
export enum PaymentMethod {
  CASH = 'cash',
  VIETQR = 'vietqr',
  BANK_TRANSFER = 'bank-transfer',
}
```

**Value Semantics**:
- `cash`: Cash on delivery/pickup
- `vietqr`: QR code payment (Vietnamese standard)
- `bank-transfer`: Direct bank transfer (note: hyphenated)

**Frontend Migration**:
- **Current**: Uses `'bank_transfer'` (underscored)
- **Target**: Use `'bank-transfer'` (hyphenated)
- **Files Affected**: `payment.model.ts`, payment forms, payment status displays

#### PaymentStatus
**File**: `payment.enums.ts`  
**Purpose**: Track payment lifecycle

```typescript
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
```

**Value Semantics**:
- `pending`: Payment initiated, awaiting confirmation
- `paid`: Payment successfully completed
- `failed`: Payment attempt failed
- `cancelled`: Payment cancelled by user or system

**Frontend Migration**:
- **Current**: Has `'refunded'` instead of `'cancelled'`
- **Target**: Use `'cancelled'`, remove `'refunded'` references
- **Files Affected**: `payment.model.ts`, payment status displays
- **Note**: No payments with status='refunded' exist in database

---

### Product Enums

#### BusinessType
**File**: `product.enums.ts`  
**Purpose**: Define product availability model

```typescript
export enum BusinessType {
  MADE_TO_ORDER = 'made-to-order',
  READY_TO_SELL = 'ready-to-sell',
  BOTH = 'both',
}
```

**Value Semantics**:
- `made-to-order`: Products created after order placement
- `ready-to-sell`: Products available in inventory
- `both`: Can be sold from inventory or made to order

**Frontend Migration**:
- **Current**: Missing `'both'` option
- **Target**: Add `'both'` option to UI and filters
- **Files Affected**: `product.model.ts`, product forms, filter components
- **Database Impact**: 3 products in database have businessType='both'

#### ProductStatus
**File**: `product.enums.ts`  
**Purpose**: Track product availability

```typescript
export enum ProductStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out-of-stock',
}
```

**Value Semantics**:
- `available`: Product can be ordered
- `out-of-stock`: Product currently unavailable

**Frontend Migration**:
- **Current**: Uses `'active'`/`'inactive'` instead of `'available'`/`'out-of-stock'`
- **Target**: Use `'available'`/`'out-of-stock'`
- **Files Affected**: `product.model.ts`, product status displays, filter logic
- **Note**: `out-of-stock` already matches, only need to change `active` → `available`, remove `inactive`

---

## Enum Export Structure

### Backend Package Exports

**File**: `bakery-cms-api/packages/common/src/index.ts`

```typescript
// Export all enums from a single entry point
export {
  UserRole,
  UserStatus,
  AuthProvider,
  TokenType,
  AuthEventType,
} from './enums/auth.enums';

export {
  PaymentMethod,
  PaymentStatus,
} from './enums/payment.enums';

export {
  BusinessType,
  ProductStatus,
} from './enums/product.enums';
```

**Package Configuration**: `bakery-cms-api/packages/common/package.json`

```json
{
  "name": "@bakery-cms/common",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc"
  }
}
```

### Frontend Imports

**Pattern**: Import directly from backend common package

```typescript
// ✅ Correct: Import from backend package
import { 
  UserRole, 
  UserStatus, 
  PaymentMethod, 
  PaymentStatus,
  BusinessType,
  ProductStatus 
} from '@bakery-cms/common';

// ❌ Incorrect: Local enum definitions (remove these)
export const UserRole = {
  ADMIN: 'ADMIN',
  // ...
} as const;
```

---

## Type Transformations

### No Runtime Transformations Required

Because we're adopting backend enum values directly, **no runtime transformation functions are needed**. All changes are compile-time type updates.

### Compile-Time Type Checking

TypeScript will enforce enum value correctness:

```typescript
// Before migration (runtime error risk)
const role: string = 'ADMIN'; // No compile-time check
apiClient.post('/users', { role }); // May fail if backend expects 'admin'

// After migration (compile-time safety)
import { UserRole } from '@bakery-cms/common';
const role: UserRole = UserRole.ADMIN; // TypeScript ensures 'admin' value
apiClient.post('/users', { role }); // Type-safe, guaranteed to match backend
```

---

## Frontend Type Definition Changes

### Before Migration

**File**: `bakery-cms-web/src/types/models/payment.model.ts`

```typescript
// ❌ Local enum definitions (to be removed)
export const PaymentMethod = {
  CASH: 'cash',
  VIETQR: 'vietqr',
  BANK_TRANSFER: 'bank_transfer', // ⚠️ Mismatch: underscore vs hyphen
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded', // ⚠️ Does not exist in backend
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export type Payment = {
  readonly id: string;
  readonly method: PaymentMethod; // Uses local type
  readonly status: PaymentStatus; // Uses local type
  // ...
};
```

### After Migration

**File**: `bakery-cms-web/src/types/models/payment.model.ts`

```typescript
// ✅ Import from backend
import { PaymentMethod, PaymentStatus } from '@bakery-cms/common';

// ✅ Use backend enum types directly
export type Payment = {
  readonly id: string;
  readonly method: PaymentMethod; // Now uses backend enum
  readonly status: PaymentStatus; // Now uses backend enum
  // ...
};

// Note: Local PaymentMethod and PaymentStatus definitions removed
```

---

## String Literal Updates

### Identifying Hardcoded Values

Search patterns to find hardcoded enum values:

```bash
# Find potential hardcoded role values
grep -r "role.*=.*['\"]ADMIN['\"]" bakery-cms-web/src/

# Find potential payment method strings
grep -r "bank_transfer" bakery-cms-web/src/

# Find refunded status references
grep -r "refunded" bakery-cms-web/src/
```

### Update Examples

**Before**:
```typescript
// Hardcoded string literal
if (user.role === 'ADMIN') { // ❌ Will break after migration
  // admin logic
}

// String in API call
apiClient.post('/payments', {
  method: 'bank_transfer', // ❌ Wrong format
});
```

**After**:
```typescript
import { UserRole, PaymentMethod } from '@bakery-cms/common';

// Use enum constant
if (user.role === UserRole.ADMIN) { // ✅ Type-safe, correct value
  // admin logic
}

// Use enum in API call
apiClient.post('/payments', {
  method: PaymentMethod.BANK_TRANSFER, // ✅ Correct: 'bank-transfer'
});
```

---

## Validation Rules

### Type Guards (Keep These)

Existing type guard functions should continue to work with backend enums:

```typescript
// Backend provides these helpers (keep using them)
import { isValidPaymentMethod, isValidPaymentStatus } from '@bakery-cms/common';

// Frontend validation
const validatePaymentData = (data: unknown) => {
  if (!isValidPaymentMethod(data.method)) {
    throw new Error('Invalid payment method');
  }
  // ...
};
```

---

## Database Alignment

### Verification Queries

To confirm backend enum values match database:

```sql
-- Check UserRole values in database
SELECT DISTINCT role FROM users;
-- Expected: admin, manager, staff, seller, customer, viewer

-- Check PaymentStatus values
SELECT DISTINCT status FROM payments;
-- Expected: pending, paid, failed, cancelled (NOT refunded)

-- Check BusinessType values
SELECT DISTINCT businessType FROM products;
-- Expected: made-to-order, ready-to-sell, both

-- Check ProductStatus values
SELECT DISTINCT status FROM products;
-- Expected: available, out-of-stock (NOT active, NOT inactive)
```

### Migration Impact

- **No database migrations required**: All changes are in frontend code only
- **Backward compatible**: Existing database values remain unchanged
- **Forward compatible**: Frontend will now use correct database values

---

## Testing Considerations

### Type Testing

```typescript
// tests/types/enum-imports.test.ts
import { UserRole, PaymentMethod, ProductStatus } from '@bakery-cms/common';

describe('Enum imports', () => {
  it('should import UserRole from backend', () => {
    expect(UserRole.ADMIN).toBe('admin'); // lowercase value
  });

  it('should import PaymentMethod with correct format', () => {
    expect(PaymentMethod.BANK_TRANSFER).toBe('bank-transfer'); // hyphenated
  });

  it('should have all required enum values', () => {
    expect(ProductStatus.AVAILABLE).toBe('available');
    expect(ProductStatus.OUT_OF_STOCK).toBe('out-of-stock');
  });
});
```

### Integration Testing

```typescript
// Test API calls use correct enum values
it('should create user with backend enum value', async () => {
  const userData = {
    email: 'test@example.com',
    role: UserRole.ADMIN, // Will send 'admin' to backend
  };
  
  const response = await apiClient.post('/users', userData);
  expect(response.status).toBe(201);
  expect(response.data.role).toBe('admin'); // Matches backend
});
```

---

## Summary of Changes

| Enum Type | Current FE Values | Target BE Values | Impact |
|-----------|------------------|------------------|--------|
| UserRole | UPPERCASE | lowercase | Update RBAC logic |
| UserStatus | PENDING | pending_verification | Update registration flow |
| PaymentMethod | bank_transfer | bank-transfer | Update payment forms |
| PaymentStatus | includes refunded | includes cancelled | Remove refunded logic |
| BusinessType | 2 values | 3 values (add both) | Update product forms/filters |
| ProductStatus | active/inactive | available/out-of-stock | Update status displays |

**Total Files to Update**: ~20 files across services, types, and components
**Total Enum References**: 50+ individual usages

---

## Next Steps

1. **contracts/**: Create TypeScript declaration examples
2. **quickstart.md**: Developer guide for using backend enums
3. **tasks.md**: Break down implementation into specific tasks (Phase 2)
