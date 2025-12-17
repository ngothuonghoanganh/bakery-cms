# Soft Delete Data Model

This document provides detailed data model specifications for the soft delete implementation.

## Table Structure Changes

### Products Table

```sql
ALTER TABLE products 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_products_deleted_at (deleted_at),
ADD INDEX idx_products_active (id, deleted_at) WHERE deleted_at IS NULL;
```

**Schema:**
```
products
├── id                  UUID PRIMARY KEY
├── name                VARCHAR(255) NOT NULL
├── description         TEXT
├── price               DECIMAL(10,2) NOT NULL
├── category            VARCHAR(100)
├── business_type       ENUM(...) NOT NULL
├── status              ENUM(...) NOT NULL
├── image_url           VARCHAR(500)
├── created_at          TIMESTAMP NOT NULL
├── updated_at          TIMESTAMP NOT NULL
└── deleted_at          TIMESTAMP NULL          [NEW]
```

### Orders Table

```sql
ALTER TABLE orders 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_orders_deleted_at (deleted_at),
ADD INDEX idx_orders_active (id, deleted_at) WHERE deleted_at IS NULL;

-- Update unique constraint
DROP INDEX orders_order_number_key;
CREATE UNIQUE INDEX orders_order_number_unique 
  ON orders(order_number) 
  WHERE deleted_at IS NULL;
```

**Schema:**
```
orders
├── id                  UUID PRIMARY KEY
├── order_number        VARCHAR(50) NOT NULL UNIQUE (WHERE deleted_at IS NULL)
├── order_type          ENUM(...) NOT NULL
├── business_model      ENUM(...) NOT NULL
├── total_amount        DECIMAL(10,2) NOT NULL
├── status              ENUM(...) NOT NULL
├── customer_name       VARCHAR(255)
├── customer_phone      VARCHAR(20)
├── notes               TEXT
├── confirmed_at        TIMESTAMP
├── created_at          TIMESTAMP NOT NULL
├── updated_at          TIMESTAMP NOT NULL
└── deleted_at          TIMESTAMP NULL          [NEW]
```

### Order Items Table

```sql
ALTER TABLE order_items 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_order_items_deleted_at (deleted_at),
ADD INDEX idx_order_items_active (order_id, deleted_at) WHERE deleted_at IS NULL;
```

**Schema:**
```
order_items
├── id                  UUID PRIMARY KEY
├── order_id            UUID NOT NULL FK(orders.id)
├── product_id          UUID NOT NULL FK(products.id)
├── quantity            INTEGER NOT NULL
├── unit_price          DECIMAL(10,2) NOT NULL
├── subtotal            DECIMAL(10,2) NOT NULL
├── notes               TEXT
├── created_at          TIMESTAMP NOT NULL
├── updated_at          TIMESTAMP NOT NULL
└── deleted_at          TIMESTAMP NULL          [NEW]
```

### Payments Table

```sql
ALTER TABLE payments 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_payments_deleted_at (deleted_at),
ADD INDEX idx_payments_active (order_id, deleted_at) WHERE deleted_at IS NULL;

-- Update unique constraint
DROP INDEX payments_order_id_key;
CREATE UNIQUE INDEX payments_order_id_unique 
  ON payments(order_id) 
  WHERE deleted_at IS NULL;
```

**Schema:**
```
payments
├── id                  UUID PRIMARY KEY
├── order_id            UUID NOT NULL UNIQUE (WHERE deleted_at IS NULL) FK(orders.id)
├── amount              DECIMAL(10,2) NOT NULL
├── method              ENUM(...) NOT NULL
├── status              ENUM(...) NOT NULL
├── transaction_id      VARCHAR(255)
├── vietqr_data         TEXT
├── paid_at             TIMESTAMP
├── notes               TEXT
├── created_at          TIMESTAMP NOT NULL
├── updated_at          TIMESTAMP NOT NULL
└── deleted_at          TIMESTAMP NULL          [NEW]
```

## Index Strategy

### Standard Indexes
All tables receive a standard index on `deleted_at`:
```sql
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
```

**Purpose:** 
- Quickly filter out deleted records
- Support admin queries for deleted records
- Enable efficient ORDER BY on deletion date

### Partial Indexes
Partial indexes for active (non-deleted) records:
```sql
CREATE INDEX idx_{table}_active ON {table}(id, deleted_at) 
  WHERE deleted_at IS NULL;
```

**Purpose:**
- Optimize common case (most queries are for active records)
- Smaller index size (only indexes non-deleted records)
- Faster lookups for active records

### Composite Indexes
For specific query patterns:
```sql
-- Orders by status and deletion state
CREATE INDEX idx_orders_status_active 
  ON orders(status, deleted_at) 
  WHERE deleted_at IS NULL;

-- Order items by order with active filter
CREATE INDEX idx_order_items_order_active 
  ON order_items(order_id, deleted_at) 
  WHERE deleted_at IS NULL;
```

## Query Patterns

### Finding Active Records (Default)
```sql
-- Automatic with default scope
SELECT * FROM products WHERE deleted_at IS NULL;

-- With additional filters
SELECT * FROM products 
WHERE deleted_at IS NULL 
  AND status = 'available'
  AND category = 'cookies';
```

**Index Used:** `idx_products_active` (partial index)

### Finding Deleted Records (Admin)
```sql
SELECT * FROM products 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

**Index Used:** `idx_products_deleted_at`

### Finding All Records (Admin)
```sql
-- No filter on deleted_at
SELECT * FROM products 
ORDER BY created_at DESC;
```

**Index Used:** `idx_products_created_at` (existing)

### Cascade Query (Order with Items)
```sql
-- Get order with non-deleted items
SELECT o.*, oi.*
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.deleted_at IS NULL
WHERE o.id = ? AND o.deleted_at IS NULL;
```

**Index Used:** 
- `idx_orders_active` for order lookup
- `idx_order_items_order_active` for items join

## Sequelize Scopes

### Current Sequelize Configuration
The project currently uses a clean Sequelize configuration in `packages/database/src/config/database.config.ts` without any global paranoid mode or soft delete settings. This is by design and allows for manual soft delete implementation with full control.

**Current Config:**
- No `paranoid: true` in global config
- No `timestamps` or `deletedAt` configuration at Sequelize instance level
- Clean, minimal configuration focused on connection pooling and SSL

### Model-Level Scopes (To Be Added)

### Default Scope
Applied automatically to all queries at the model level:
```typescript
defaultScope: {
  where: {
    deletedAt: null
  }
}
```

### Named Scopes

#### withDeleted
Include soft-deleted records in query:
```typescript
scopes: {
  withDeleted: {
    where: {}
  }
}

// Usage
ProductModel.scope('withDeleted').findByPk(id);
```

#### onlyDeleted
Show only soft-deleted records:
```typescript
scopes: {
  onlyDeleted: {
    where: {
      deletedAt: {
        [Op.ne]: null
      }
    }
  }
}

// Usage
ProductModel.scope('onlyDeleted').findAll();
```

#### activeWithCategory
Example of combining scopes:
```typescript
scopes: {
  activeWithCategory: (category: string) => ({
    where: {
      deletedAt: null,
      category
    }
  })
}

// Usage
ProductModel.scope('activeWithCategory', 'cookies').findAll();
```

## Cascade Delete Strategy

### Order Deletion Cascade
When an order is soft deleted, cascade to:
1. All order items for that order
2. The payment for that order (if exists)

```typescript
// Transaction ensures atomicity
const transaction = await sequelize.transaction();

try {
  // Soft delete order
  await order.update({ deletedAt: new Date() }, { transaction });
  
  // Soft delete all items
  await OrderItemModel.update(
    { deletedAt: new Date() },
    { where: { orderId: order.id }, transaction }
  );
  
  // Soft delete payment
  await PaymentModel.update(
    { deletedAt: new Date() },
    { where: { orderId: order.id }, transaction }
  );
  
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### Product Deletion (No Cascade)
Product deletion does NOT cascade to order items:
- Preserves historical order data
- Order items remain visible with product reference
- Product name/price captured in order item

```typescript
// Only soft delete the product
await product.update({ deletedAt: new Date() });

// Order items remain active
// Product reference is maintained via productId FK
```

## Constraints and Validations

### Check Constraints
```sql
-- Ensure deletedAt is not in the future
ALTER TABLE products 
ADD CONSTRAINT chk_products_deleted_at 
CHECK (deleted_at IS NULL OR deleted_at <= CURRENT_TIMESTAMP);

ALTER TABLE orders 
ADD CONSTRAINT chk_orders_deleted_at 
CHECK (deleted_at IS NULL OR deleted_at <= CURRENT_TIMESTAMP);

ALTER TABLE order_items 
ADD CONSTRAINT chk_order_items_deleted_at 
CHECK (deleted_at IS NULL OR deleted_at <= CURRENT_TIMESTAMP);

ALTER TABLE payments 
ADD CONSTRAINT chk_payments_deleted_at 
CHECK (deleted_at IS NULL OR deleted_at <= CURRENT_TIMESTAMP);
```

### Unique Constraints with Soft Delete
```sql
-- Order number unique only for non-deleted orders
CREATE UNIQUE INDEX orders_order_number_unique 
  ON orders(order_number) 
  WHERE deleted_at IS NULL;

-- Payment order_id unique only for non-deleted payments
CREATE UNIQUE INDEX payments_order_id_unique 
  ON payments(order_id) 
  WHERE deleted_at IS NULL;
```

This allows:
- Same order number can be reused if original is soft deleted
- Multiple soft-deleted payments for same order (if needed)
- Prevents duplicate active records

## Data Lifecycle

```
┌─────────────┐
│   CREATED   │
│ deletedAt:  │
│    NULL     │
└──────┬──────┘
       │
       │ Normal Operations
       │ (CRUD)
       │
       ▼
┌─────────────┐
│   ACTIVE    │
│ deletedAt:  │
│    NULL     │
└──────┬──────┘
       │
       │ Soft Delete
       │ SET deletedAt = NOW()
       │
       ▼
┌─────────────┐         ┌──────────────┐
│ SOFT        │ Restore │   ACTIVE     │
│ DELETED     │────────▶│  deletedAt:  │
│ deletedAt:  │         │    NULL      │
│  timestamp  │         └──────────────┘
└──────┬──────┘
       │
       │ Force Delete (Admin)
       │ DELETE FROM table
       │
       ▼
┌─────────────┐
│  PERMANENTLY│
│   DELETED   │
│ (Record     │
│  Removed)   │
└─────────────┘
```

## Storage Considerations

### Database Size Impact
With soft delete, database size will grow over time:

**Estimated Growth:**
- Products: Minimal (not frequently deleted)
- Orders: Moderate (only DRAFT orders deleted)
- Order Items: Moderate (linked to order deletion)
- Payments: Minimal (rarely deleted independently)

**Monitoring:**
```sql
-- Count active vs deleted records
SELECT 
  'products' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted
FROM products

UNION ALL

SELECT 
  'orders' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted
FROM orders;
```

### Archival Strategy (Future)
For records deleted > 1 year ago:
1. Move to archive table
2. Or export to cold storage
3. Keep reference link for audit

```sql
-- Move old deleted records to archive
INSERT INTO products_archive 
SELECT * FROM products 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL 1 YEAR;

DELETE FROM products 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL 1 YEAR;
```

## Performance Benchmarks

### Query Performance
Expected impact of soft delete on query performance:

| Query Type | Before | After | Impact |
|------------|--------|-------|--------|
| SELECT by ID | 1ms | 1.1ms | +10% |
| SELECT all (paginated) | 5ms | 5.3ms | +6% |
| DELETE operation | 2ms | 2.5ms | +25% (now UPDATE) |
| Complex JOIN | 10ms | 10.5ms | +5% |

### Index Size Impact
```sql
-- Check index sizes
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  ROUND(STAT_VALUE * @@innodb_page_size / 1024 / 1024, 2) as SIZE_MB
FROM mysql.innodb_index_stats
WHERE TABLE_NAME IN ('products', 'orders', 'order_items', 'payments')
  AND STAT_NAME = 'size'
ORDER BY TABLE_NAME, INDEX_NAME;
```

Expected index size increase: 10-15% due to additional indexes on `deleted_at`.
