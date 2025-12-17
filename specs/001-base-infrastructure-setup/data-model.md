# Data Model: Base Infrastructure Setup

## Overview

This document defines the complete data model for the Bakery-CMS application, including all entities, their fields, relationships, validation rules, and state transitions. The data model supports both "made-to-order" and "ready-to-sell" business models.

---

## Entity: Product

**Description**: Represents a cookie product in the catalog. Products can be made-to-order, ready-to-sell, or both.

**Fields**:
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| id | string (UUID) | Yes | UUID v4 format | auto-generated |
| name | string | Yes | 1-255 chars, non-empty | - |
| description | text | No | 0-1000 chars | null |
| price | decimal(10,2) | Yes | > 0 | - |
| category | string | No | 1-100 chars | null |
| businessType | enum | Yes | BusinessType enum | - |
| status | enum | Yes | ProductStatus enum | available |
| imageUrl | string | No | Valid URL format | null |
| createdAt | Date | Yes | ISO 8601 format | current timestamp |
| updatedAt | Date | Yes | ISO 8601 format | current timestamp |

**Relationships**:
- hasMany: OrderItems

**Validation Rules**:
- `name` must not be empty after trimming whitespace
- `price` must be a positive number with max 2 decimal places
- `businessType` must be one of: made-to-order, ready-to-sell, both
- `status` must be one of: available, out-of-stock
- `imageUrl` must be valid URL if provided

**State Transitions**:
- available ↔ out-of-stock (can toggle)

**Sequelize Model Location**: `packages/database/src/models/product.model.ts`

**TypeScript Type Location**: `packages/common/src/types/product.types.ts`

**Example**:
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Chocolate Chip Cookie",
  description: "Classic chocolate chip cookie with Belgian chocolate",
  price: 5000,
  category: "Classic",
  businessType: "both",
  status: "available",
  imageUrl: "https://example.com/images/choco-chip.jpg",
  createdAt: "2025-12-16T10:00:00Z",
  updatedAt: "2025-12-16T10:00:00Z"
}
```

---

## Entity: Order

**Description**: Represents a customer order. Supports temporary (draft) and official orders for both business models.

**Fields**:
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| id | string (UUID) | Yes | UUID v4 format | auto-generated |
| orderNumber | string | Yes | Format: ORD-YYYYMMDD-XXXX | auto-generated |
| orderType | enum | Yes | OrderType enum | temporary |
| businessModel | enum | Yes | BusinessModel enum | - |
| totalAmount | decimal(10,2) | Yes | >= 0 | 0 |
| status | enum | Yes | OrderStatus enum | draft |
| customerName | string | No | 1-255 chars | null |
| customerPhone | string | No | Valid phone format | null |
| notes | text | No | 0-1000 chars | null |
| createdAt | Date | Yes | ISO 8601 format | current timestamp |
| updatedAt | Date | Yes | ISO 8601 format | current timestamp |
| confirmedAt | Date | No | ISO 8601 format | null |

**Relationships**:
- hasMany: OrderItems
- hasOne: Payment

**Validation Rules**:
- `orderNumber` must be unique
- `orderType` must be one of: temporary, official
- `businessModel` must be one of: made-to-order, ready-to-sell
- `totalAmount` must be non-negative
- `status` must be one of: draft, confirmed, paid, cancelled
- `customerPhone` must match phone number pattern if provided
- Orders must have at least one OrderItem

**State Transitions**:
- draft → confirmed (when order is confirmed)
- confirmed → paid (when payment is completed)
- draft/confirmed → cancelled (cancellation allowed before paid)
- paid → (terminal state, no transitions)
- cancelled → (terminal state, no transitions)

**Business Rules**:
- Temporary orders can be edited until converted to official
- Official orders cannot be edited after confirmation
- Total amount must equal sum of all order items

**Sequelize Model Location**: `packages/database/src/models/order.model.ts`

**TypeScript Type Location**: `packages/common/src/types/order.types.ts`

**Example**:
```typescript
{
  id: "660e8400-e29b-41d4-a716-446655440001",
  orderNumber: "ORD-20251216-0001",
  orderType: "official",
  businessModel: "made-to-order",
  totalAmount: 50000,
  status: "confirmed",
  customerName: "John Doe",
  customerPhone: "+84901234567",
  notes: "Please deliver before 5pm",
  createdAt: "2025-12-16T10:00:00Z",
  updatedAt: "2025-12-16T10:30:00Z",
  confirmedAt: "2025-12-16T10:30:00Z"
}
```

---

## Entity: OrderItem

**Description**: Line item within an order, linking orders to products with quantity and pricing.

**Fields**:
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| id | string (UUID) | Yes | UUID v4 format | auto-generated |
| orderId | string (UUID) | Yes | Valid Order ID | - |
| productId | string (UUID) | Yes | Valid Product ID | - |
| quantity | integer | Yes | > 0 | - |
| unitPrice | decimal(10,2) | Yes | > 0 | - |
| subtotal | decimal(10,2) | Yes | = quantity × unitPrice | auto-calculated |
| createdAt | Date | Yes | ISO 8601 format | current timestamp |
| updatedAt | Date | Yes | ISO 8601 format | current timestamp |

**Relationships**:
- belongsTo: Order (orderId)
- belongsTo: Product (productId)

**Validation Rules**:
- `orderId` must reference existing order
- `productId` must reference existing product
- `quantity` must be positive integer
- `unitPrice` must be positive number with max 2 decimal places
- `subtotal` must equal `quantity × unitPrice`
- Product must be available (status = 'available')

**Business Rules**:
- Unit price is captured at time of order creation (price snapshot)
- Subtotal is automatically calculated and stored for performance
- Cannot add items to paid or cancelled orders

**Sequelize Model Location**: `packages/database/src/models/order-item.model.ts`

**TypeScript Type Location**: `packages/common/src/types/order-item.types.ts`

**Example**:
```typescript
{
  id: "770e8400-e29b-41d4-a716-446655440002",
  orderId: "660e8400-e29b-41d4-a716-446655440001",
  productId: "550e8400-e29b-41d4-a716-446655440000",
  quantity: 10,
  unitPrice: 5000,
  subtotal: 50000,
  createdAt: "2025-12-16T10:00:00Z",
  updatedAt: "2025-12-16T10:00:00Z"
}
```

---

## Entity: Payment

**Description**: Payment record for an order. Supports VietQR payment method.

**Fields**:
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| id | string (UUID) | Yes | UUID v4 format | auto-generated |
| orderId | string (UUID) | Yes | Valid Order ID | - |
| paymentMethod | enum | Yes | PaymentMethod enum | - |
| amount | decimal(10,2) | Yes | > 0 | - |
| status | enum | Yes | PaymentStatus enum | pending |
| qrCodeData | text | No | VietQR format | null |
| transactionRef | string | No | Unique reference | null |
| paidAt | Date | No | ISO 8601 format | null |
| createdAt | Date | Yes | ISO 8601 format | current timestamp |
| updatedAt | Date | Yes | ISO 8601 format | current timestamp |

**Relationships**:
- belongsTo: Order (orderId)

**Validation Rules**:
- `orderId` must reference existing order
- `paymentMethod` must be one of: vietqr, cash, bank-transfer
- `amount` must match order total amount
- `status` must be one of: pending, paid, failed
- `qrCodeData` required if payment method is vietqr
- `transactionRef` must be unique if provided

**State Transitions**:
- pending → paid (successful payment)
- pending → failed (payment failure)
- paid → (terminal state, no transitions)
- failed → pending (retry payment)

**Business Rules**:
- One payment per order
- Amount must equal order total
- VietQR data generated automatically for vietqr method
- Payment cannot be deleted, only failed or refunded

**Sequelize Model Location**: `packages/database/src/models/payment.model.ts`

**TypeScript Type Location**: `packages/common/src/types/payment.types.ts`

**Example**:
```typescript
{
  id: "880e8400-e29b-41d4-a716-446655440003",
  orderId: "660e8400-e29b-41d4-a716-446655440001",
  paymentMethod: "vietqr",
  amount: 50000,
  status: "paid",
  qrCodeData: "00020101021238530010A00000072701270006970436011...",
  transactionRef: "PAY-20251216-0001",
  paidAt: "2025-12-16T10:35:00Z",
  createdAt: "2025-12-16T10:30:00Z",
  updatedAt: "2025-12-16T10:35:00Z"
}
```

---

## Enums

### BusinessType
```typescript
enum BusinessType {
  MADE_TO_ORDER = 'made-to-order',
  READY_TO_SELL = 'ready-to-sell',
  BOTH = 'both'
}
```

### ProductStatus
```typescript
enum ProductStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out-of-stock'
}
```

### OrderType
```typescript
enum OrderType {
  TEMPORARY = 'temporary',
  OFFICIAL = 'official'
}
```

### BusinessModel
```typescript
enum BusinessModel {
  MADE_TO_ORDER = 'made-to-order',
  READY_TO_SELL = 'ready-to-sell'
}
```

### OrderStatus
```typescript
enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}
```

### PaymentMethod
```typescript
enum PaymentMethod {
  VIETQR = 'vietqr',
  CASH = 'cash',
  BANK_TRANSFER = 'bank-transfer'
}
```

### PaymentStatus
```typescript
enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed'
}
```

---

## Entity Relationships Diagram

```
Product (1) ──────< (many) OrderItem (many) >────── (1) Order (1) ────── (1) Payment
   │                                                      │
   │ hasMany                                             │ hasOne
   └──────────────────────────────────────────────────────┘
```

**Relationship Details**:
- One Product can appear in many OrderItems
- One Order has many OrderItems
- One Order has one Payment
- OrderItem links Product and Order (junction with additional data)

---

## Database Indexes

**Performance Optimization**:
- `products.status` - for filtering available products
- `products.businessType` - for filtering by business model
- `orders.orderNumber` - unique index for order lookup
- `orders.status` - for filtering orders by status
- `orders.createdAt` - for date-based queries and statistics
- `order_items.orderId` - foreign key index
- `order_items.productId` - foreign key index
- `payments.orderId` - foreign key index, unique
- `payments.status` - for filtering payment status
- `payments.transactionRef` - unique index for transaction lookup

---

## Frontend Domain Models

### Domain Model: Product

**API Response Type** (`src/types/api/product.api.ts`):
```typescript
type ProductAPIResponse = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  business_type: string;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};
```

**Domain Model Type** (`src/types/models/product.model.ts`):
```typescript
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  businessType: BusinessType;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

**Mapper** (`src/types/mappers/product.mapper.ts`):
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
  createdAt: new Date(response.created_at),
  updatedAt: new Date(response.updated_at),
});
```

### Domain Model: Order

**API Response Type** (`src/types/api/order.api.ts`):
```typescript
type OrderAPIResponse = {
  id: string;
  order_number: string;
  order_type: string;
  business_model: string;
  total_amount: number;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  items: OrderItemAPIResponse[];
};
```

**Domain Model Type** (`src/types/models/order.model.ts`):
```typescript
type Order = {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  businessModel: BusinessModel;
  totalAmount: number;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  items: OrderItem[];
};
```

**Mapper** (`src/types/mappers/order.mapper.ts`):
```typescript
export const mapOrderFromAPI = (response: OrderAPIResponse): Order => ({
  id: response.id,
  orderNumber: response.order_number,
  orderType: response.order_type as OrderType,
  businessModel: response.business_model as BusinessModel,
  totalAmount: response.total_amount,
  status: response.status as OrderStatus,
  customerName: response.customer_name,
  customerPhone: response.customer_phone,
  notes: response.notes,
  createdAt: new Date(response.created_at),
  updatedAt: new Date(response.updated_at),
  confirmedAt: response.confirmed_at ? new Date(response.confirmed_at) : null,
  items: response.items.map(mapOrderItemFromAPI),
});
```

### Domain Model: Payment

**API Response Type** (`src/types/api/payment.api.ts`):
```typescript
type PaymentAPIResponse = {
  id: string;
  order_id: string;
  payment_method: string;
  amount: number;
  status: string;
  qr_code_data: string | null;
  transaction_ref: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};
```

**Domain Model Type** (`src/types/models/payment.model.ts`):
```typescript
type Payment = {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  qrCodeData: string | null;
  transactionRef: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
```

**Mapper** (`src/types/mappers/payment.mapper.ts`):
```typescript
export const mapPaymentFromAPI = (response: PaymentAPIResponse): Payment => ({
  id: response.id,
  orderId: response.order_id,
  paymentMethod: response.payment_method as PaymentMethod,
  amount: response.amount,
  status: response.status as PaymentStatus,
  qrCodeData: response.qr_code_data,
  transactionRef: response.transaction_ref,
  paidAt: response.paid_at ? new Date(response.paid_at) : null,
  createdAt: new Date(response.created_at),
  updatedAt: new Date(response.updated_at),
});
```

---

## Data Integrity Constraints

1. **Referential Integrity**: All foreign keys must reference existing records
2. **Cascade Rules**:
   - Delete Product: Restrict if referenced in OrderItems
   - Delete Order: Cascade delete OrderItems and Payment
3. **Unique Constraints**:
   - `orders.orderNumber` must be unique
   - `payments.orderId` must be unique (one payment per order)
   - `payments.transactionRef` must be unique if not null
4. **Check Constraints**:
   - All price and amount fields must be non-negative
   - All quantity fields must be positive
   - Status fields must match enum values

---

## Data Migration Strategy

1. **Phase 1**: Create all tables with indexes
2. **Phase 2**: Add foreign key constraints
3. **Phase 3**: Seed initial product data (optional)
4. **Phase 4**: Verify data integrity

**Rollback Strategy**: Each migration includes down() method to reverse changes
