# Data Model: Ant Design CMS Frontend

**Feature**: Ant Design CMS Frontend Setup
**Date**: December 17, 2025

---

## Overview

This document defines all TypeScript types used in the frontend application, including domain models, API response types, form DTOs, and UI state types. All types follow functional programming principles with immutability and type safety.

---

## Enums

### ProductStatus

```typescript
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}
```

**Usage**: Product availability status
**Location**: `src/types/models/product.model.ts`

### BusinessType

```typescript
export enum BusinessType {
  B2C = 'b2c',
  B2B = 'b2b',
  BOTH = 'both',
}
```

**Usage**: Product business model classification
**Location**: `src/types/models/product.model.ts`

### OrderStatus

```typescript
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}
```

**Usage**: Order workflow status tracking
**Location**: `src/types/models/order.model.ts`

### PaymentStatus

```typescript
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
```

**Usage**: Payment transaction status
**Location**: `src/types/models/payment.model.ts`

### PaymentMethod

```typescript
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet',
  QR_CODE = 'qr_code',
}
```

**Usage**: Payment method classification
**Location**: `src/types/models/payment.model.ts`

---

## Domain Models

### Product

```typescript
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  businessType: BusinessType;
  status: ProductStatus;
  imageUrl?: string;
  stockQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
};
```

**Description**: Bakery product domain model (camelCase)
**Location**: `src/types/models/product.model.ts`
**Source**: Mapped from ProductAPIResponse (snake_case API)

### Order

```typescript
export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Description**: Customer order domain model
**Location**: `src/types/models/order.model.ts`

### OrderItem

```typescript
export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};
```

**Description**: Individual item within an order
**Location**: `src/types/models/order.model.ts`

### Payment

```typescript
export type Payment = {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  qrCodeUrl?: string;
  transactionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
```

**Description**: Payment transaction domain model
**Location**: `src/types/models/payment.model.ts`

---

## API Response Types

### ProductAPIResponse

```typescript
export type ProductAPIResponse = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  business_type: string;  // snake_case from API
  status: string;
  image_url?: string;
  stock_quantity?: number;
  created_at: string;     // ISO string from API
  updated_at: string;     // ISO string from API
};
```

**Description**: Product API response structure (matches backend snake_case)
**Location**: `src/types/api/product.api.ts`

### OrderAPIResponse

```typescript
export type OrderAPIResponse = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItemAPIResponse[];
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type OrderItemAPIResponse = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};
```

**Description**: Order API response structure
**Location**: `src/types/api/order.api.ts`

### PaymentAPIResponse

```typescript
export type PaymentAPIResponse = {
  id: string;
  order_id: string;
  order_number: string;
  amount: number;
  method: string;
  status: string;
  qr_code_url?: string;
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
};
```

**Description**: Payment API response structure
**Location**: `src/types/api/payment.api.ts`

### PaginatedResponse

```typescript
export type PaginatedAPIResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};
```

**Description**: Generic paginated API response wrapper
**Location**: `src/types/api/common.api.ts`

---

## Mappers

### mapProductFromAPI

```typescript
export const mapProductFromAPI = (response: ProductAPIResponse): Product => ({
  id: response.id,
  name: response.name,
  description: response.description,
  price: response.price,
  category: response.category,
  businessType: response.business_type as BusinessType,
  status: response.status as ProductStatus,
  imageUrl: response.image_url,
  stockQuantity: response.stock_quantity,
  createdAt: new Date(response.created_at),
  updatedAt: new Date(response.updated_at),
});
```

**Purpose**: Transform API response (snake_case) to domain model (camelCase)
**Location**: `src/types/mappers/product.mapper.ts`

### mapOrderFromAPI

```typescript
export const mapOrderFromAPI = (response: OrderAPIResponse): Order => ({
  id: response.id,
  orderNumber: response.order_number,
  customerName: response.customer_name,
  customerPhone: response.customer_phone,
  customerEmail: response.customer_email,
  items: response.items.map(mapOrderItemFromAPI),
  totalAmount: response.total_amount,
  status: response.status as OrderStatus,
  notes: response.notes,
  createdAt: new Date(response.created_at),
  updatedAt: new Date(response.updated_at),
});
```

**Location**: `src/types/mappers/order.mapper.ts`

### mapPaymentFromAPI

```typescript
export const mapPaymentFromAPI = (response: PaymentAPIResponse): Payment => ({
  id: response.id,
  orderId: response.order_id,
  orderNumber: response.order_number,
  amount: response.amount,
  method: response.method as PaymentMethod,
  status: response.status as PaymentStatus,
  qrCodeUrl: response.qr_code_url,
  transactionId: response.transaction_id,
  paidAt: response.paid_at ? new Date(response.paid_at) : undefined,
  createdAt: new Date(response.created_at),
  updatedAt: new Date(response.updated_at),
});
```

**Location**: `src/types/mappers/payment.mapper.ts`

---

## Form DTOs

### CreateProductForm

```typescript
export type CreateProductForm = {
  name: string;
  description: string;
  price: number;
  category: string;
  businessType: BusinessType;
  status: ProductStatus;
  imageUrl?: string;
  stockQuantity?: number;
};
```

**Usage**: Product creation form data
**Validation**: Zod schema `productSchema`
**Location**: `src/types/models/product.model.ts`

### UpdateProductForm

```typescript
export type UpdateProductForm = Partial<CreateProductForm>;
```

**Usage**: Product update form data (all fields optional)
**Location**: `src/types/models/product.model.ts`

### CreateOrderForm

```typescript
export type CreateOrderForm = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  notes?: string;
};
```

**Usage**: Order creation form data
**Validation**: Zod schema `createOrderSchema`
**Location**: `src/types/models/order.model.ts`

### UpdateOrderStatusForm

```typescript
export type UpdateOrderStatusForm = {
  status: OrderStatus;
  notes?: string;
};
```

**Usage**: Order status update form
**Validation**: Zod schema `updateOrderStatusSchema`
**Location**: `src/types/models/order.model.ts`

---

## Table Data Types

### ProductTableRow

```typescript
export type ProductTableRow = {
  key: string;
  id: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  businessType: BusinessType;
  stockQuantity?: number;
  updatedAt: Date;
};
```

**Usage**: Data structure for product table rows
**Location**: `src/types/ui/table.types.ts`

### OrderTableRow

```typescript
export type OrderTableRow = {
  key: string;
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: Date;
};
```

**Usage**: Data structure for order table rows
**Location**: `src/types/ui/table.types.ts`

### PaymentTableRow

```typescript
export type PaymentTableRow = {
  key: string;
  id: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
};
```

**Usage**: Data structure for payment table rows
**Location**: `src/types/ui/table.types.ts`

---

## Filter Types

### ProductFilters

```typescript
export type ProductFilters = {
  search?: string;
  category?: string;
  status?: ProductStatus;
  businessType?: BusinessType;
};
```

**Usage**: Product list filtering parameters
**Location**: `src/types/models/product.model.ts`

### OrderFilters

```typescript
export type OrderFilters = {
  search?: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
};
```

**Usage**: Order list filtering parameters
**Location**: `src/types/models/order.model.ts`

### PaymentFilters

```typescript
export type PaymentFilters = {
  search?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
};
```

**Usage**: Payment list filtering parameters
**Location**: `src/types/models/payment.model.ts`

---

## Pagination Types

### PaginationParams

```typescript
export type PaginationParams = {
  page: number;
  pageSize: number;
};
```

**Usage**: Request pagination parameters
**Location**: `src/types/common/result.types.ts`

### PaginatedResponse

```typescript
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
```

**Usage**: Domain paginated response wrapper
**Location**: `src/types/common/result.types.ts`

---

## UI State Types

### LoadingState

```typescript
export type LoadingState = {
  isLoading: boolean;
  error: string | null;
};
```

**Usage**: Generic loading/error state
**Location**: `src/types/ui/form.types.ts`

### ModalState

```typescript
export type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  data?: any;
};
```

**Usage**: Modal dialog state management
**Location**: `src/types/ui/form.types.ts`

### ThemeMode

```typescript
export type ThemeMode = 'light' | 'dark';
```

**Usage**: Application theme mode
**Location**: `src/stores/themeStore.ts`

### NotificationType

```typescript
export type NotificationType = 'success' | 'error' | 'info' | 'warning';
```

**Usage**: Notification message types
**Location**: `src/stores/notificationStore.ts`

---

## Validation Schemas

### productSchema

```typescript
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  price: z.number().positive('Price must be positive').min(0.01),
  category: z.string().min(1, 'Category is required'),
  businessType: z.nativeEnum(BusinessType),
  status: z.nativeEnum(ProductStatus),
  stockQuantity: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
});
```

**Usage**: Product form validation
**Location**: `src/types/models/product.model.ts`

### createOrderSchema

```typescript
export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  customerPhone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number'),
  customerEmail: z.string().email('Invalid email').optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive('Quantity must be positive'),
    })
  ).min(1, 'Order must have at least one item'),
  notes: z.string().max(500).optional(),
});
```

**Usage**: Order creation form validation
**Location**: `src/types/models/order.model.ts`

### updateOrderStatusSchema

```typescript
export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().max(500).optional(),
});
```

**Usage**: Order status update validation
**Location**: `src/types/models/order.model.ts`

---

## Result Type Pattern

### Result Type

```typescript
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export const ok = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

export const err = <E = AppError>(error: E): Result<never, E> => ({
  success: false,
  error,
});
```

**Usage**: Functional error handling in services
**Location**: `src/types/common/result.types.ts`

### AppError

```typescript
export type AppError = {
  code: string;
  message: string;
  details?: any;
};
```

**Usage**: Application error structure
**Location**: `src/types/common/error.types.ts`

---

## Type Organization Summary

```
src/types/
├── api/                     # API response types (snake_case)
│   ├── product.api.ts
│   ├── order.api.ts
│   ├── payment.api.ts
│   └── common.api.ts
│
├── models/                  # Domain models (camelCase)
│   ├── product.model.ts
│   ├── order.model.ts
│   └── payment.model.ts
│
├── mappers/                 # API → Domain transformers
│   ├── product.mapper.ts
│   ├── order.mapper.ts
│   └── payment.mapper.ts
│
├── common/                  # Shared types
│   ├── error.types.ts
│   └── result.types.ts
│
└── ui/                      # UI-specific types
    ├── table.types.ts
    ├── form.types.ts
    └── theme.types.ts
```

---

## Key Principles

1. **API Separation**: API types use snake_case (match backend), domain models use camelCase (TypeScript convention)
2. **Immutability**: All types are readonly or treated as immutable
3. **Type Safety**: No `any` types, strict TypeScript mode enabled
4. **Validation**: Zod schemas for form validation
5. **Result Pattern**: Functional error handling with Result<T, E> type
6. **Mapping Layer**: Explicit mappers transform API responses to domain models
7. **Enums**: Use TypeScript enums for closed sets of values
8. **Optional Fields**: Use `?` for optional properties, avoid `| undefined`

---

**End of Data Model Documentation**
