# Data Model: Stock Management

**Feature Branch**: `005-stock-management`
**Created**: 2025-12-22

## Entity Overview

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   StockItem     │────<│  StockItemBrand     │>────│    Brand     │
│                 │     │  (junction + price) │     │              │
└─────────────────┘     └─────────────────────┘     └──────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐
│  StockMovement  │
│  (audit log)    │
└─────────────────┘

┌─────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│    Product      │────<│  ProductStockItem   │>────│  StockItem   │
│   (existing)    │     │   (recipe/BOM)      │     │              │
└─────────────────┘     └─────────────────────┘     └──────────────┘
```

---

## Entities

### 1. StockItem

Represents a raw material or component used in product creation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| name | VARCHAR(255) | NOT NULL, unique | Stock item name (e.g., "All-Purpose Flour") |
| description | TEXT | NULL | Optional detailed description |
| unitOfMeasure | VARCHAR(50) | NOT NULL | Unit for quantity (e.g., "g", "kg", "pcs", "ml") |
| currentQuantity | DECIMAL(10,3) | NOT NULL, DEFAULT 0, >= 0 | Current stock level |
| reorderThreshold | DECIMAL(10,3) | NULL, >= 0 | Alert threshold for low stock |
| status | ENUM | NOT NULL, computed | AVAILABLE, LOW_STOCK, OUT_OF_STOCK |
| createdAt | DATETIME | NOT NULL | Record creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |
| deletedAt | DATETIME | NULL | Soft delete timestamp |

**Indexes**:
- `idx_stock_items_name` on `name`
- `idx_stock_items_status` on `status`
- `idx_stock_items_deleted_at` on `deleted_at`

**Validation Rules**:
- `name`: 1-255 characters, unique
- `unitOfMeasure`: 1-50 characters
- `currentQuantity`: >= 0, max 3 decimal places
- `reorderThreshold`: >= 0 (if provided), max 3 decimal places

**Status Computation**:
```
if currentQuantity = 0:
  status = OUT_OF_STOCK
else if reorderThreshold IS NOT NULL AND currentQuantity <= reorderThreshold:
  status = LOW_STOCK
else:
  status = AVAILABLE
```

---

### 2. Brand

Represents a supplier/brand for stock items.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| name | VARCHAR(255) | NOT NULL, unique | Brand name (e.g., "Golden Bell", "Vinamilk") |
| description | TEXT | NULL | Optional brand description |
| isActive | BOOLEAN | NOT NULL, DEFAULT true | Whether brand is currently active |
| createdAt | DATETIME | NOT NULL | Record creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |
| deletedAt | DATETIME | NULL | Soft delete timestamp |

**Indexes**:
- `idx_brands_name` on `name`
- `idx_brands_is_active` on `is_active`
- `idx_brands_deleted_at` on `deleted_at`

**Validation Rules**:
- `name`: 1-255 characters, unique

---

### 3. StockItemBrand (Junction Table)

Links stock items to brands with pricing information.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| stockItemId | UUID | FK to StockItem, NOT NULL | Reference to stock item |
| brandId | UUID | FK to Brand, NOT NULL | Reference to brand |
| priceBeforeTax | DECIMAL(12,2) | NOT NULL, >= 0 | Unit price before tax |
| priceAfterTax | DECIMAL(12,2) | NOT NULL, >= priceBeforeTax | Unit price after tax |
| isPreferred | BOOLEAN | NOT NULL, DEFAULT false | Preferred brand for this item |
| createdAt | DATETIME | NOT NULL | Record creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |
| deletedAt | DATETIME | NULL | Soft delete timestamp |

**Indexes**:
- `idx_sib_stock_item_id` on `stock_item_id`
- `idx_sib_brand_id` on `brand_id`
- `idx_sib_unique` UNIQUE on `(stock_item_id, brand_id)` WHERE `deleted_at IS NULL`

**Relationships**:
- `StockItem` 1:N `StockItemBrand` (CASCADE on delete)
- `Brand` 1:N `StockItemBrand` (RESTRICT on delete)

**Validation Rules**:
- `priceBeforeTax`: >= 0, max 2 decimal places
- `priceAfterTax`: >= priceBeforeTax, max 2 decimal places
- Only one `isPreferred = true` per stockItemId

---

### 4. ProductStockItem (Junction Table)

Links products to their required stock items (recipe/BOM).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| productId | UUID | FK to Product, NOT NULL | Reference to product |
| stockItemId | UUID | FK to StockItem, NOT NULL | Reference to stock item |
| quantity | DECIMAL(10,3) | NOT NULL, > 0 | Quantity of stock item per product unit |
| preferredBrandId | UUID | FK to Brand, NULL | Optional preferred brand for cost calculation |
| notes | TEXT | NULL | Optional notes (e.g., "use organic if available") |
| createdAt | DATETIME | NOT NULL | Record creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |
| deletedAt | DATETIME | NULL | Soft delete timestamp |

**Indexes**:
- `idx_psi_product_id` on `product_id`
- `idx_psi_stock_item_id` on `stock_item_id`
- `idx_psi_unique` UNIQUE on `(product_id, stock_item_id)` WHERE `deleted_at IS NULL`

**Relationships**:
- `Product` 1:N `ProductStockItem` (CASCADE on delete)
- `StockItem` 1:N `ProductStockItem` (RESTRICT on delete)
- `Brand` 1:N `ProductStockItem` (SET NULL on delete)

**Validation Rules**:
- `quantity`: > 0, max 3 decimal places
- `preferredBrandId`: Must be a valid brand associated with the stockItemId (if provided)

---

### 5. StockMovement

Records all inventory changes for audit trail.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| stockItemId | UUID | FK to StockItem, NOT NULL | Reference to stock item |
| type | ENUM | NOT NULL | RECEIVED, USED, ADJUSTED, DAMAGED, EXPIRED |
| quantity | DECIMAL(10,3) | NOT NULL, != 0 | Change amount (positive for add, negative for deduct) |
| previousQuantity | DECIMAL(10,3) | NOT NULL | Quantity before this movement |
| newQuantity | DECIMAL(10,3) | NOT NULL | Quantity after this movement |
| reason | VARCHAR(500) | Conditional | Required for ADJUSTED, DAMAGED, EXPIRED types |
| referenceType | VARCHAR(50) | NULL | Type of reference (e.g., "order", "adjustment") |
| referenceId | UUID | NULL | ID of related entity (e.g., order ID) |
| userId | UUID | FK to User, NOT NULL | User who made the change |
| createdAt | DATETIME | NOT NULL | Movement timestamp |

**Indexes**:
- `idx_sm_stock_item_id` on `stock_item_id`
- `idx_sm_type` on `type`
- `idx_sm_created_at` on `created_at`
- `idx_sm_user_id` on `user_id`
- `idx_sm_reference` on `(reference_type, reference_id)`

**Relationships**:
- `StockItem` 1:N `StockMovement` (RESTRICT on delete)
- `User` 1:N `StockMovement` (RESTRICT on delete)

**Validation Rules**:
- `quantity`: != 0, max 3 decimal places
- `reason`: Required when type is ADJUSTED, DAMAGED, or EXPIRED
- `newQuantity`: Must equal previousQuantity + quantity
- `newQuantity`: >= 0 (prevents negative stock)

**Note**: StockMovement records are immutable - no updates or deletes allowed.

---

## Enums

### StockItemStatus

```typescript
enum StockItemStatus {
  AVAILABLE = 'available',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}
```

### MovementType

```typescript
enum MovementType {
  RECEIVED = 'received',     // Stock added from supplier
  USED = 'used',             // Stock consumed for production
  ADJUSTED = 'adjusted',     // Manual inventory correction
  DAMAGED = 'damaged',       // Stock written off - damage
  EXPIRED = 'expired',       // Stock written off - expiration
}
```

---

## Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| StockItem → StockItemBrand | 1:N | One stock item can have many brands |
| Brand → StockItemBrand | 1:N | One brand can be used for many stock items |
| StockItem → StockMovement | 1:N | One stock item has many movement records |
| Product → ProductStockItem | 1:N | One product has many ingredients |
| StockItem → ProductStockItem | 1:N | One stock item can be used in many products |
| User → StockMovement | 1:N | One user can create many movements |

---

## State Transitions

### Stock Item Status

```
                  ┌─────────────┐
     receive      │             │     deplete
    ──────────────│  AVAILABLE  │──────────────┐
                  │             │              │
                  └──────┬──────┘              │
                         │                     │
                         │ deplete to          │
                         │ threshold           │
                         ▼                     │
                  ┌─────────────┐              │
                  │             │              │
    ──────────────│  LOW_STOCK  │◄─────────────┤
       receive    │             │              │
                  └──────┬──────┘              │
                         │                     │
                         │ deplete to 0        │
                         ▼                     ▼
                  ┌─────────────┐
                  │             │
                  │OUT_OF_STOCK │
                  │             │
                  └─────────────┘
                         │
                         │ receive
                         ▼
              (returns to AVAILABLE or LOW_STOCK)
```

---

## Migration Order

1. `create-brands` - Create brands table (no dependencies)
2. `create-stock-items` - Create stock items table (no dependencies)
3. `create-stock-item-brands` - Create junction table (depends on 1, 2)
4. `create-product-stock-items` - Create recipe table (depends on 2, existing products)
5. `create-stock-movements` - Create audit table (depends on 2, existing users)
