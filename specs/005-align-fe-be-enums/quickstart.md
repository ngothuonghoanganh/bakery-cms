# Quick Start: Using Backend Enums in Frontend

**Feature**: 005-align-fe-be-enums  
**Audience**: Frontend Developers  
**Time to Complete**: 5-10 minutes

## Overview

This guide shows you how to import and use enum types from the backend common package in your frontend code. After this alignment, all enum definitions have a single source of truth in the backend, ensuring type safety and consistency.

---

## Prerequisites

✅ Backend common package is built: `@bakery-cms/common`  
✅ Frontend has workspace dependency configured  
✅ TypeScript version 4.5+ installed  

---

## Step 1: Import Enums from Backend

### Basic Import

```typescript
// ✅ Import single enum
import { UserRole } from '@bakery-cms/common';

// ✅ Import multiple enums
import { 
  UserRole, 
  UserStatus, 
  PaymentMethod,
  PaymentStatus 
} from '@bakery-cms/common';

// ✅ Import with alias (if needed)
import { 
  UserRole as Role,
  ProductStatus as PStatus 
} from '@bakery-cms/common';
```

### Remove Old Local Definitions

```typescript
// ❌ DELETE these local enum definitions
export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  // ...
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// ✅ REPLACE with import from backend
import { UserRole } from '@bakery-cms/common';
```

---

## Step 2: Use Enums in Type Definitions

### Interface Properties

```typescript
import { UserRole, UserStatus } from '@bakery-cms/common';

// ✅ Use backend enum as type
interface User {
  id: string;
  email: string;
  role: UserRole;        // Type-safe enum
  status: UserStatus;    // Type-safe enum
}

// ✅ Function parameters
const checkAccess = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

// ✅ Return types
const getUserRole = (userId: string): Promise<UserRole> => {
  // ...
};
```

### API Request/Response Types

```typescript
import { PaymentMethod, PaymentStatus } from '@bakery-cms/common';

// ✅ Request DTO
interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;  // Backend will validate this
}

// ✅ Response DTO
interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  // ...
}
```

---

## Step 3: Use Enum Values

### Comparisons

```typescript
import { UserRole, PaymentStatus } from '@bakery-cms/common';

// ✅ Compare with enum constant
if (user.role === UserRole.ADMIN) {
  // admin logic
}

// ✅ Switch statement
switch (payment.status) {
  case PaymentStatus.PENDING:
    return 'Processing...';
  case PaymentStatus.PAID:
    return 'Payment Complete';
  case PaymentStatus.FAILED:
    return 'Payment Failed';
  case PaymentStatus.CANCELLED:
    return 'Payment Cancelled';
}

// ❌ DON'T use string literals
if (user.role === 'ADMIN') {  // Won't work - value is 'admin' not 'ADMIN'
  // ...
}
```

### API Calls

```typescript
import { UserRole, PaymentMethod } from '@bakery-cms/common';

// ✅ Send enum value to backend
const createUser = async (userData: CreateUserDTO) => {
  return apiClient.post('/users', {
    ...userData,
    role: UserRole.STAFF,  // Sends 'staff' to backend
  });
};

// ✅ Use in query parameters
const filterProducts = async (businessType: BusinessType) => {
  return apiClient.get('/products', {
    params: { businessType }  // Sends correct enum value
  });
};
```

---

## Step 4: Update React Components

### Props with Enum Types

```typescript
import { UserRole, ProductStatus } from '@bakery-cms/common';

// ✅ Component props
interface UserBadgeProps {
  role: UserRole;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ role }) => {
  const getBadgeColor = () => {
    switch (role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.MANAGER:
        return 'blue';
      case UserRole.STAFF:
        return 'green';
      default:
        return 'gray';
    }
  };

  return <Badge color={getBadgeColor()}>{role}</Badge>;
};
```

### Form Selects

```typescript
import { PaymentMethod, BusinessType } from '@bakery-cms/common';

// ✅ Select options from enum
const PaymentMethodSelect = () => {
  const options = [
    { value: PaymentMethod.CASH, label: 'Cash' },
    { value: PaymentMethod.VIETQR, label: 'VietQR' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
  ];

  return (
    <Select options={options} />
  );
};

// ✅ Get all enum values programmatically
const getAllBusinessTypes = (): BusinessType[] => {
  return Object.values(BusinessType);
};
```

---

## Step 5: Update Tests

### Test with Enum Values

```typescript
import { UserRole, PaymentStatus } from '@bakery-cms/common';

describe('User Service', () => {
  it('should create admin user', async () => {
    const userData = {
      email: 'admin@test.com',
      role: UserRole.ADMIN,  // Use enum constant
    };

    const user = await userService.create(userData);
    
    expect(user.role).toBe(UserRole.ADMIN);
    // Or check the actual string value
    expect(user.role).toBe('admin');
  });

  it('should handle payment status changes', () => {
    const payment = {
      id: '123',
      status: PaymentStatus.PENDING,
    };

    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(payment.status).toBe('pending');  // Both work
  });
});
```

---

## Common Patterns

### Pattern 1: Enum in Zustand Store

```typescript
import { UserRole, UserStatus } from '@bakery-cms/common';
import { create } from 'zustand';

interface AuthStore {
  user: {
    id: string;
    role: UserRole;
    status: UserStatus;
  } | null;
  setUser: (user: AuthStore['user']) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// Usage
const { user } = useAuthStore();
if (user?.role === UserRole.ADMIN) {
  // ...
}
```

### Pattern 2: Enum in RBAC Logic

```typescript
import { UserRole } from '@bakery-cms/common';

const roleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.MANAGER]: 80,
  [UserRole.STAFF]: 60,
  [UserRole.SELLER]: 40,
  [UserRole.CUSTOMER]: 20,
  [UserRole.VIEWER]: 10,
};

export const hasPermission = (
  userRole: UserRole,
  requiredRole: UserRole
): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
```

### Pattern 3: Enum Display Labels

```typescript
import { ProductStatus, PaymentStatus } from '@bakery-cms/common';

const productStatusLabels: Record<ProductStatus, string> = {
  [ProductStatus.AVAILABLE]: 'In Stock',
  [ProductStatus.OUT_OF_STOCK]: 'Out of Stock',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Processing',
  [PaymentStatus.PAID]: 'Completed',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.CANCELLED]: 'Cancelled',
};

// Usage in component
export const StatusDisplay = ({ status }: { status: ProductStatus }) => {
  return <span>{productStatusLabels[status]}</span>;
};
```

---

## Important Value Changes

### UserRole (lowercase now)
```typescript
// ❌ OLD values (won't work)
'ADMIN', 'MANAGER', 'STAFF'

// ✅ NEW values (correct)
'admin', 'manager', 'staff'

// Always use enum constant
UserRole.ADMIN  // resolves to 'admin'
```

### PaymentMethod (hyphen format)
```typescript
// ❌ OLD value
'bank_transfer'  // underscore

// ✅ NEW value
'bank-transfer'  // hyphen

// Always use enum constant
PaymentMethod.BANK_TRANSFER  // resolves to 'bank-transfer'
```

### PaymentStatus (cancelled not refunded)
```typescript
// ❌ OLD - refunded doesn't exist
PaymentStatus.REFUNDED  // TypeScript error!

// ✅ NEW - use cancelled
PaymentStatus.CANCELLED  // resolves to 'cancelled'
```

### ProductStatus (available not active)
```typescript
// ❌ OLD values
'active', 'inactive'

// ✅ NEW values
'available', 'out-of-stock'

// Always use enum constant
ProductStatus.AVAILABLE  // resolves to 'available'
```

---

## Troubleshooting

### "Cannot find module '@bakery-cms/common'"

**Solution**:
```bash
# 1. Ensure backend common package is built
cd bakery-cms-api/packages/common
yarn build

# 2. Reinstall frontend dependencies
cd bakery-cms-web
yarn install

# 3. Restart TypeScript server in VS Code
# Command Palette > "TypeScript: Restart TS Server"
```

### "Type error: enum value doesn't match"

**Problem**: Using old enum values like `'ADMIN'` instead of `'admin'`

**Solution**: Update all string literals to use enum constants
```typescript
// ❌ Wrong
if (role === 'ADMIN')

// ✅ Correct
if (role === UserRole.ADMIN)
```

### "IntelliSense not showing enum options"

**Solution**:
```bash
# 1. Check tsconfig.json has correct references
# 2. Restart TS Server (VS Code Command Palette)
# 3. Rebuild backend common package
cd bakery-cms-api/packages/common && yarn build
```

---

## Verification Checklist

After migrating a file, verify:

- [ ] All enum imports come from `@bakery-cms/common`
- [ ] No local enum definitions remain
- [ ] All string literals replaced with enum constants
- [ ] TypeScript compilation succeeds (no type errors)
- [ ] Tests pass with updated enum values
- [ ] API calls use correct enum values
- [ ] IDE autocomplete works for enum values

---

## Best Practices

### ✅ DO

- Always import enums from `@bakery-cms/common`
- Use enum constants in comparisons and switches
- Add TypeScript types for enum-based parameters
- Test API integration with actual enum values
- Use enum constants in form options

### ❌ DON'T

- Don't create local enum definitions
- Don't use string literals for enum values
- Don't assume enum value format (check docs)
- Don't skip TypeScript compilation checks
- Don't mix old and new enum formats

---

## Additional Resources

- **Enum Definitions**: See [contracts/enum-exports.ts](./contracts/enum-exports.ts)
- **Value Mappings**: See [data-model.md](./data-model.md)
- **Research**: See [research.md](./research.md)
- **Implementation Plan**: See [plan.md](./plan.md)

---

## Support

If you encounter issues:

1. Check [data-model.md](./data-model.md) for enum value mappings
2. Verify backend common package is built
3. Restart TypeScript server
4. Check console for detailed TypeScript errors
5. Ask in team chat with specific error message

---

**Last Updated**: December 20, 2025  
**Status**: Ready for Implementation
