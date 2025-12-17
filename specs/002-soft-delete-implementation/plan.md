# Implementation Plan: Soft Delete Implementation

**Branch**: `002-soft-delete-implementation` | **Date**: December 17, 2025 | **Spec**: [specification.md](./specification.md)
**Input**: Feature specification from `/specs/002-soft-delete-implementation/specification.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement soft delete functionality for Products, Orders, OrderItems, and Payments to enable data recovery and maintain audit trails. Instead of permanently removing records, a `deletedAt` timestamp will be set, and records will be filtered from standard queries using Sequelize model-level scopes. This approach preserves the clean database configuration, provides full control over delete behavior, and supports business requirements for data retention and compliance.

**Technical Approach**: 
- Manual soft delete implementation using Sequelize model-level scopes (NOT global paranoid mode)
- Preserves existing clean database configuration
- Transaction-based cascade soft delete for Orders → OrderItems → Payment
- Partial and regular indexes for query optimization
- Functional programming patterns throughout implementation

## Technical Context

**Language/Version**: TypeScript with Node.js 18+  
**Primary Dependencies**: Express.js, Sequelize ORM 6.x, MySQL 8.0+  
**Storage**: MySQL with Sequelize ORM (existing infrastructure)  
**Testing**: Jest for unit tests and integration tests  
**Target Platform**: Backend: Node.js API Server  
**Project Type**: Backend Monorepo (bakery-cms-api)  
**Performance Goals**: <200ms p95 API response time, <100ms p95 database queries, <10ms overhead for soft delete filtering  
**Constraints**: Functional programming paradigm (pure functions, immutability), TypeScript strict mode, no breaking changes to existing API contracts  
**Scale/Scope**: 4 database tables modified (products, orders, order_items, payments), 3 repository modules updated, 1 migration file, ~15 new test cases, preserve all existing functionality

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Backend Checks:
- [x] **Functional programming paradigm enforced** - All new repository and service functions will be pure functions with no mutation
- [x] **TypeScript strict mode enabled** - Existing tsconfig.json has strict: true
- [x] **No class-based patterns** - Using Sequelize models (allowed exception for ORM), all business logic in pure functions
- [x] **Monorepo structure** - Changes confined to existing packages: api, common, database
- [x] **Sequelize ORM for data access** - Using existing Sequelize setup, adding model-level scopes
- [x] **Repository pattern using functional composition** - Extending existing functional repositories with soft delete methods
- [x] **Service layer with pure functions** - All service functions remain pure with Result type returns
- [x] **Result type for error handling** - Consistent with existing error handling patterns
- [x] **Yarn package manager** - Using existing yarn workspace
- [x] **No secrets in code** - No new secrets introduced

### Universal Checks:
- [x] **Test coverage ≥ 80%** - Target 100% coverage for new soft delete functionality
- [x] **Security-first configuration** - No security implications, maintains existing patterns
- [x] **No any types** - All new types explicitly defined in common/src/types/soft-delete.types.ts
- [x] **Explicit return types on all functions** - All new functions have explicit return types

### Feature-Specific Checks:
- [x] **No breaking changes to API** - All existing DELETE endpoints maintain same response format (204 No Content)
- [x] **Backward compatibility** - Existing queries continue to work, soft-deleted records automatically filtered
- [x] **Database migration safety** - Migration is reversible with down() method
- [x] **Transaction safety** - Cascade deletes use transactions for atomicity
- [x] **Performance optimization** - Indexes added for soft delete queries

**GATE STATUS**: ✅ **ALL CHECKS PASSED** - No violations, no exceptions needed

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

## Project Structure

### Documentation (this feature)

```text
specs/002-soft-delete-implementation/
├── plan.md              # This file (/speckit.plan command output)
├── specification.md     # Feature specification (already exists)
├── data-model.md        # Data model with soft delete fields (already exists)
├── diagrams.md          # Sequence and ER diagrams (already exists)
├── quickstart.md        # Testing guide (already exists)
├── testing-guide.md     # Comprehensive testing guide (already exists)
└── README.md            # Feature overview (already exists)
```

### Source Code (Backend Repository: bakery-cms-api)

```text
bakery-cms-api/
├── packages/
│   ├── database/
│   │   └── src/
│   │       ├── models/
│   │       │   ├── product.model.ts          # UPDATE: Add deletedAt field + scopes
│   │       │   ├── order.model.ts            # UPDATE: Add deletedAt field + scopes
│   │       │   ├── order-item.model.ts       # UPDATE: Add deletedAt field + scopes
│   │       │   └── payment.model.ts          # UPDATE: Add deletedAt field + scopes
│   │       ├── migrations/
│   │       │   └── YYYYMMDDHHMMSS-add-soft-delete-fields.ts  # NEW: Soft delete migration
│   │       └── config/
│   │           └── database.config.ts        # NO CHANGE: Preserve clean config
│   │
│   ├── common/
│   │   └── src/
│   │       ├── types/
│   │       │   └── soft-delete.types.ts      # NEW: Soft delete type definitions
│   │       └── index.ts                      # UPDATE: Export soft delete types
│   │
│   └── api/
│       └── src/
│           └── modules/
│               ├── products/
│               │   ├── repositories/
│               │   │   └── products.repositories.ts    # UPDATE: Add delete/restore methods
│               │   ├── services/
│               │   │   └── products.services.ts        # UPDATE: Soft delete logic
│               │   └── tests/
│               │       └── products.test.ts            # UPDATE: Add soft delete tests
│               │
│               ├── orders/
│               │   ├── repositories/
│               │   │   └── orders.repositories.ts      # UPDATE: Cascade soft delete
│               │   ├── services/
│               │   │   └── orders.services.ts          # UPDATE: Business rules
│               │   └── tests/
│               │       └── orders.test.ts              # UPDATE: Add soft delete tests
│               │
│               └── payments/
│                   ├── repositories/
│                   │   └── payments.repositories.ts    # UPDATE: Soft delete method
│                   ├── services/
│                   │   └── payments.services.ts        # UPDATE: Soft delete logic
│                   └── tests/
│                       └── payments.test.ts            # UPDATE: Add soft delete tests
```

**Structure Decision**: This is a **Backend-only** feature modifying existing backend infrastructure. No frontend changes required. Implementation focuses on:

1. **Database Layer** (packages/database):
   - Add `deletedAt` column to 4 models via migration
   - Configure model-level scopes (defaultScope, withDeleted, onlyDeleted)
   - Add indexes for query performance

2. **Common Types** (packages/common):
   - Define shared soft delete types and interfaces
   - Export for use across api and database packages

3. **Repository Layer** (packages/api/modules/*/repositories):
   - Update delete methods to perform soft delete (UPDATE instead of DELETE)
   - Add restore methods for recovery operations
   - Implement cascade soft delete for orders (with transactions)

4. **Service Layer** (packages/api/modules/*/services):
   - Update business logic to use new repository methods
   - Maintain existing business rules (e.g., only DRAFT orders can be deleted)
   - Add logging for soft delete operations

5. **Test Layer**:
   - Add unit tests for soft delete functionality
   - Update integration tests to verify soft delete behavior
   - Test cascade delete transactions
   - Verify scopes work correctly

**No changes to**:
- API handlers (endpoints remain the same)
- Frontend repository (bakery-cms-web)
- Database configuration (no global paranoid mode)
- Middleware (no new middleware needed)

## Complexity Tracking

**No constitution violations detected.**

All implementation follows constitutional requirements:
- Functional programming patterns maintained
- TypeScript strict mode preserved
- No breaking API changes
- Existing architecture enhanced, not violated
- Manual soft delete approach provides better control than global paranoid mode
- Aligns with "no global changes" philosophy by using model-level scopes

---

## Implementation Steps

### Step 1: Code Structure Setup

**Files to Create:**
```typescript
// packages/common/src/types/soft-delete.types.ts
export type SoftDeletable = {
  deletedAt: Date | null;
};

export type SoftDeleteFilter = 'active' | 'deleted' | 'all';

export type SoftDeleteMetadata = {
  entityType: string;
  entityId: string;
  deletedAt: Date;
  deletedBy?: string;
  reason?: string;
};
```

**Files to Update:**
- `packages/common/src/index.ts` - Export soft delete types
- All model files (4 files)
- All repository files (3 files)
- All service files (3 files)
- All test files (3 files)

### Step 2: Data Types Setup

#### Soft Delete Types

```typescript
// packages/common/src/types/soft-delete.types.ts

/**
 * Base interface for models with soft delete support
 */
export type SoftDeletable = {
  deletedAt: Date | null;
};

/**
 * Utility type to include soft-deleted records
 */
export type WithDeleted<T> = T & {
  includeDeleted: true;
};

/**
 * Soft delete filter options
 */
export type SoftDeleteFilter = 
  | 'active'        // Only non-deleted records (default)
  | 'deleted'       // Only deleted records
  | 'all';          // All records including deleted

/**
 * Soft delete metadata for logging
 */
export type SoftDeleteMetadata = {
  entityType: string;
  entityId: string;
  deletedAt: Date;
  deletedBy?: string;
  reason?: string;
};

/**
 * Repository delete method return type
 */
export type DeleteResult = {
  success: boolean;
  recordsAffected: number;
};

/**
 * Repository restore method return type
 */
export type RestoreResult = {
  success: boolean;
  recordsRestored: number;
};
```

#### Updated Model Types

```typescript
// Example: packages/database/src/models/product.model.ts
export class ProductModel extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare price: number;
  declare category: string | null;
  declare businessType: string;
  declare status: string;
  declare imageUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare deletedAt: Date | null; // NEW: Soft delete field
}
```

### Step 3: Data Model Updates

See [data-model.md](./data-model.md) for complete entity definitions.

**Summary of Changes:**
- **Products Table**: Add `deletedAt` TIMESTAMP NULL
- **Orders Table**: Add `deletedAt` TIMESTAMP NULL
- **OrderItems Table**: Add `deletedAt` TIMESTAMP NULL
- **Payments Table**: Add `deletedAt` TIMESTAMP NULL

**Indexes to Add:**
```sql
-- Regular indexes for all delete operations
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at);
CREATE INDEX idx_order_items_deleted_at ON order_items(deleted_at);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);

-- Partial indexes for active records (MySQL 8.0+)
CREATE INDEX idx_products_active ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_active ON orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_order_items_active ON order_items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_active ON payments(deleted_at) WHERE deleted_at IS NULL;
```

**Constraints to Update:**
```sql
-- Orders: Update unique constraint to exclude deleted records
ALTER TABLE orders DROP CONSTRAINT orders_order_number_key;
CREATE UNIQUE INDEX orders_order_number_unique 
  ON orders(order_number) WHERE deleted_at IS NULL;

-- Payments: Update unique constraint to exclude deleted records
ALTER TABLE payments DROP CONSTRAINT payments_order_id_key;
CREATE UNIQUE INDEX payments_order_id_unique 
  ON payments(order_id) WHERE deleted_at IS NULL;
```

### Step 4: Migration File

```typescript
// packages/database/src/migrations/YYYYMMDDHHMMSS-add-soft-delete-fields.ts

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // 1. Add deletedAt columns to all tables
  await queryInterface.addColumn('products', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  await queryInterface.addColumn('orders', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  await queryInterface.addColumn('order_items', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  await queryInterface.addColumn('payments', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  // 2. Add indexes for performance
  await queryInterface.addIndex('products', ['deleted_at'], {
    name: 'idx_products_deleted_at',
  });

  await queryInterface.addIndex('orders', ['deleted_at'], {
    name: 'idx_orders_deleted_at',
  });

  await queryInterface.addIndex('order_items', ['deleted_at'], {
    name: 'idx_order_items_deleted_at',
  });

  await queryInterface.addIndex('payments', ['deleted_at'], {
    name: 'idx_payments_deleted_at',
  });

  // 3. Update unique constraints
  await queryInterface.removeConstraint('orders', 'orders_order_number_key');
  await queryInterface.sequelize.query(`
    CREATE UNIQUE INDEX orders_order_number_unique 
    ON orders(order_number) 
    WHERE deleted_at IS NULL
  `);

  await queryInterface.removeConstraint('payments', 'payments_order_id_key');
  await queryInterface.sequelize.query(`
    CREATE UNIQUE INDEX payments_order_id_unique 
    ON payments(order_id) 
    WHERE deleted_at IS NULL
  `);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Remove indexes
  await queryInterface.removeIndex('products', 'idx_products_deleted_at');
  await queryInterface.removeIndex('orders', 'idx_orders_deleted_at');
  await queryInterface.removeIndex('order_items', 'idx_order_items_deleted_at');
  await queryInterface.removeIndex('payments', 'idx_payments_deleted_at');

  // Restore original unique constraints
  await queryInterface.sequelize.query('DROP INDEX IF EXISTS orders_order_number_unique');
  await queryInterface.addConstraint('orders', {
    fields: ['order_number'],
    type: 'unique',
    name: 'orders_order_number_key',
  });

  await queryInterface.sequelize.query('DROP INDEX IF EXISTS payments_order_id_unique');
  await queryInterface.addConstraint('payments', {
    fields: ['order_id'],
    type: 'unique',
    name: 'payments_order_id_key',
  });

  // Remove columns
  await queryInterface.removeColumn('payments', 'deleted_at');
  await queryInterface.removeColumn('order_items', 'deleted_at');
  await queryInterface.removeColumn('orders', 'deleted_at');
  await queryInterface.removeColumn('products', 'deleted_at');
};
```

### Step 5: Seed Data

**Not applicable** - No seed data needed for this feature. Existing records will have `deletedAt = NULL` by default.

### Step 6: Business Functions Design

#### Product Repository Functions

```typescript
// packages/api/src/modules/products/repositories/products.repositories.ts

/**
 * Soft delete product by ID
 * Pure function that returns boolean indicating success
 */
const deleteProduct = async (id: string): Promise<boolean> => {
  const product = await model.findByPk(id);

  if (!product) {
    return false;
  }

  await product.update({ deletedAt: new Date() });
  return true;
};

/**
 * Restore soft-deleted product
 * Pure function that returns boolean indicating success
 */
const restoreProduct = async (id: string): Promise<boolean> => {
  const product = await model.scope('withDeleted').findByPk(id);

  if (!product || !product.deletedAt) {
    return false;
  }

  await product.update({ deletedAt: null });
  return true;
};

/**
 * Force delete product (hard delete)
 * Should only be used for maintenance operations
 */
const forceDeleteProduct = async (id: string): Promise<boolean> => {
  const rowsDeleted = await model.scope('withDeleted').destroy({
    where: { id },
    force: true,
  });

  return rowsDeleted > 0;
};

return {
  // ... existing methods
  delete: deleteProduct,
  restore: restoreProduct,
  forceDelete: forceDeleteProduct,
};
```

#### Order Repository Functions (with Cascade)

```typescript
// packages/api/src/modules/orders/repositories/orders.repositories.ts

/**
 * Soft delete order with cascade to related records
 * Uses transaction for atomicity
 */
const deleteOrder = async (id: string): Promise<boolean> => {
  const order = await model.findByPk(id);

  if (!order) {
    return false;
  }

  const deletedAt = new Date();
  const transaction = await model.sequelize!.transaction();

  try {
    // Soft delete order
    await order.update({ deletedAt }, { transaction });

    // Cascade soft delete to order items
    await orderItemModel.update(
      { deletedAt },
      { where: { orderId: id }, transaction }
    );

    // Cascade soft delete to payment
    await paymentModel.update(
      { deletedAt },
      { where: { orderId: id }, transaction }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Restore soft-deleted order with cascade
 */
const restoreOrder = async (id: string): Promise<boolean> => {
  const order = await model.scope('withDeleted').findByPk(id);

  if (!order || !order.deletedAt) {
    return false;
  }

  const transaction = await model.sequelize!.transaction();

  try {
    await order.update({ deletedAt: null }, { transaction });

    await orderItemModel.update(
      { deletedAt: null },
      { where: { orderId: id }, transaction }
    );

    await paymentModel.update(
      { deletedAt: null },
      { where: { orderId: id }, transaction }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

return {
  // ... existing methods
  delete: deleteOrder,
  restore: restoreOrder,
};
```

#### Product Service Functions

```typescript
// packages/api/src/modules/products/services/products.services.ts

/**
 * Soft delete product by ID
 * Business logic wrapper with logging and error handling
 */
const deleteProduct = async (id: string): Promise<Result<void, AppError>> => {
  try {
    logger.info('Soft deleting product', { productId: id });

    const deleted = await repository.delete(id);

    if (!deleted) {
      logger.warn('Product not found for deletion', { productId: id });
      return err(createNotFoundError('Product', id));
    }

    logger.info('Product soft deleted successfully', { productId: id });
    return ok(undefined);
  } catch (error) {
    logger.error('Failed to soft delete product', { error, productId: id });
    return err(createDatabaseError('Failed to delete product'));
  }
};

/**
 * Restore soft-deleted product
 */
const restoreProduct = async (id: string): Promise<Result<ProductResponseDto, AppError>> => {
  try {
    logger.info('Restoring soft-deleted product', { productId: id });

    const restored = await repository.restore(id);

    if (!restored) {
      logger.warn('Product not found or not deleted', { productId: id });
      return err(createNotFoundError('Product', id));
    }

    const product = await repository.findById(id);
    
    if (!product) {
      return err(createDatabaseError('Failed to fetch restored product'));
    }

    logger.info('Product restored successfully', { productId: id });
    return ok(toProductResponseDto(product));
  } catch (error) {
    logger.error('Failed to restore product', { error, productId: id });
    return err(createDatabaseError('Failed to restore product'));
  }
};

return {
  // ... existing methods
  deleteProduct,
  restoreProduct,
};
```

#### Order Service Functions (with Business Rules)

```typescript
// packages/api/src/modules/orders/services/orders.services.ts

/**
 * Soft delete order by ID
 * Business rule: Only DRAFT orders can be deleted
 */
const deleteOrder = async (id: string): Promise<Result<void, AppError>> => {
  try {
    logger.info('Soft deleting order', { orderId: id });

    const order = await repository.findById(id);

    if (!order) {
      logger.warn('Order not found for deletion', { orderId: id });
      return err(createNotFoundError('Order', id));
    }

    // Business rule enforcement
    if (order.status !== OrderStatus.DRAFT) {
      return err(
        createBusinessRuleError(
          `Cannot delete order with status: ${order.status}. Only draft orders can be deleted.`
        )
      );
    }

    const deleted = await repository.delete(id);

    if (!deleted) {
      return err(createDatabaseError('Failed to delete order'));
    }

    logger.info('Order soft deleted successfully', { orderId: id });
    return ok(undefined);
  } catch (error) {
    logger.error('Failed to soft delete order', { error, orderId: id });
    return err(createDatabaseError('Failed to delete order'));
  }
};

return {
  // ... existing methods
  deleteOrder,
  restoreOrder,
};
```

### Step 7: Logic Implementation

#### Model Configuration Logic

Each model needs defaultScope and custom scopes:

```typescript
// Example: packages/database/src/models/product.model.ts

export const initProductModel = (sequelize: Sequelize): typeof ProductModel => {
  ProductModel.init(
    {
      // ... all fields including deletedAt
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      tableName: 'products',
      timestamps: true,
      underscored: true,
      // DEFAULT SCOPE: Automatically filters out deleted records
      defaultScope: {
        where: {
          deletedAt: null,
        },
      },
      // CUSTOM SCOPES: For special queries
      scopes: {
        // Include soft-deleted records
        withDeleted: {
          where: {},
        },
        // Show only soft-deleted records
        onlyDeleted: {
          where: {
            deletedAt: {
              [Op.ne]: null,
            },
          },
        },
      },
    }
  );

  return ProductModel;
};
```

#### Transaction Logic for Cascade Delete

```typescript
// Logic flow for order deletion with transaction

1. Start Transaction
2. Find Order by ID
3. If not found → rollback, return false
4. If found and status !== DRAFT → rollback, throw business rule error
5. Update Order.deletedAt = NOW()
6. Update OrderItems.deletedAt = NOW() WHERE orderId = id
7. Update Payment.deletedAt = NOW() WHERE orderId = id
8. Commit Transaction
9. Return true
10. On any error → Rollback and throw
```

#### Query Filtering Logic

```typescript
// Default behavior (uses defaultScope)
const products = await ProductModel.findAll();
// SELECT * FROM products WHERE deleted_at IS NULL

// Include deleted records (use scope)
const allProducts = await ProductModel.scope('withDeleted').findAll();
// SELECT * FROM products

// Only deleted records (use scope)
const deletedProducts = await ProductModel.scope('onlyDeleted').findAll();
// SELECT * FROM products WHERE deleted_at IS NOT NULL
```

### Step 8: Unit Test Design

#### Repository Tests

```typescript
// packages/api/src/modules/products/tests/products.repositories.test.ts

describe('ProductRepository - Soft Delete', () => {
  describe('delete', () => {
    it('should set deletedAt timestamp instead of removing record', async () => {
      const product = await repository.create(mockProductData);
      const deleted = await repository.delete(product.id);
      
      expect(deleted).toBe(true);
      
      // Should not appear in normal query
      const found = await repository.findById(product.id);
      expect(found).toBeNull();
      
      // Should appear in withDeleted scope
      const foundWithDeleted = await ProductModel.scope('withDeleted')
        .findByPk(product.id);
      expect(foundWithDeleted).not.toBeNull();
      expect(foundWithDeleted!.deletedAt).toBeInstanceOf(Date);
    });

    it('should return false when product not found', async () => {
      const deleted = await repository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted product', async () => {
      const product = await repository.create(mockProductData);
      await repository.delete(product.id);
      
      const restored = await repository.restore(product.id);
      expect(restored).toBe(true);
      
      // Should now appear in normal query
      const found = await repository.findById(product.id);
      expect(found).not.toBeNull();
      expect(found!.deletedAt).toBeNull();
    });

    it('should return false when product not deleted', async () => {
      const product = await repository.create(mockProductData);
      const restored = await repository.restore(product.id);
      expect(restored).toBe(false);
    });
  });
});

describe('OrderRepository - Cascade Soft Delete', () => {
  describe('delete', () => {
    it('should soft delete order and all related records in transaction', async () => {
      const order = await createTestOrderWithItems();
      const deleted = await repository.delete(order.id);
      
      expect(deleted).toBe(true);
      
      // Verify order is soft deleted
      const foundOrder = await repository.findById(order.id);
      expect(foundOrder).toBeNull();
      
      // Verify order items are soft deleted
      const items = await OrderItemModel.findAll({
        where: { orderId: order.id }
      });
      expect(items).toHaveLength(0);
      
      // Verify with withDeleted scope
      const deletedItems = await OrderItemModel.scope('withDeleted').findAll({
        where: { orderId: order.id }
      });
      expect(deletedItems.length).toBeGreaterThan(0);
      expect(deletedItems.every(item => item.deletedAt !== null)).toBe(true);
    });

    it('should rollback transaction on error', async () => {
      // Mock error during cascade delete
      jest.spyOn(OrderItemModel, 'update').mockRejectedValueOnce(new Error('DB Error'));
      
      const order = await createTestOrderWithItems();
      
      await expect(repository.delete(order.id)).rejects.toThrow('DB Error');
      
      // Order should still exist (not soft deleted)
      const foundOrder = await repository.findById(order.id);
      expect(foundOrder).not.toBeNull();
    });
  });
});
```

#### Service Tests

```typescript
// packages/api/src/modules/products/tests/products.services.test.ts

describe('ProductService - Soft Delete', () => {
  describe('deleteProduct', () => {
    it('should successfully delete product', async () => {
      const product = await createTestProduct();
      
      const result = await service.deleteProduct(product.id);
      
      expect(result.success).toBe(true);
    });

    it('should return NOT_FOUND error when product does not exist', async () => {
      const result = await service.deleteProduct('non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('restoreProduct', () => {
    it('should restore soft-deleted product', async () => {
      const product = await createTestProduct();
      await service.deleteProduct(product.id);
      
      const result = await service.restoreProduct(product.id);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(product.id);
    });
  });
});

describe('OrderService - Business Rules', () => {
  describe('deleteOrder', () => {
    it('should delete DRAFT order', async () => {
      const order = await createTestOrder({ status: OrderStatus.DRAFT });
      
      const result = await service.deleteOrder(order.id);
      
      expect(result.success).toBe(true);
    });

    it('should reject deletion of CONFIRMED order', async () => {
      const order = await createTestOrder({ status: OrderStatus.CONFIRMED });
      
      const result = await service.deleteOrder(order.id);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('BUSINESS_RULE_ERROR');
      expect(result.error.message).toContain('Only draft orders can be deleted');
    });
  });
});
```

#### Integration Tests

```typescript
// Integration test for DELETE endpoints

describe('DELETE /api/products/:id', () => {
  it('should soft delete product and return 204', async () => {
    const product = await createTestProduct();
    
    const response = await request(app)
      .delete(`/api/products/${product.id}`)
      .expect(204);
    
    // Verify product is not in list
    const listResponse = await request(app)
      .get('/api/products')
      .expect(200);
    
    const productIds = listResponse.body.data.map((p: any) => p.id);
    expect(productIds).not.toContain(product.id);
  });
  
  it('should return 404 when trying to delete already deleted product', async () => {
    const product = await createTestProduct();
    await repository.delete(product.id);
    
    await request(app)
      .delete(`/api/products/${product.id}`)
      .expect(404);
  });
});
```

#### Migration Tests

```typescript
// packages/database/src/migrations/__tests__/soft-delete-migration.test.ts

describe('Soft Delete Migration', () => {
  it('should add deletedAt column to all tables', async () => {
    await up(queryInterface);
    
    const tables = ['products', 'orders', 'order_items', 'payments'];
    
    for (const tableName of tables) {
      const tableDescription = await queryInterface.describeTable(tableName);
      expect(tableDescription.deleted_at).toBeDefined();
      expect(tableDescription.deleted_at.allowNull).toBe(true);
      expect(tableDescription.deleted_at.type).toContain('DATETIME');
    }
  });
  
  it('should create indexes on deletedAt columns', async () => {
    await up(queryInterface);
    
    const indexes = await queryInterface.showIndex('products');
    const deletedAtIndex = indexes.find(idx => idx.name === 'idx_products_deleted_at');
    
    expect(deletedAtIndex).toBeDefined();
    expect(deletedAtIndex!.fields).toContain({ attribute: 'deleted_at' });
  });
  
  it('should rollback cleanly', async () => {
    await up(queryInterface);
    await down(queryInterface);
    
    const productsTable = await queryInterface.describeTable('products');
    expect(productsTable.deleted_at).toBeUndefined();
  });
});
```

**Test Coverage Targets:**
- Repository functions: 100%
- Service functions: 100%
- Migration up/down: 100%
- Integration endpoints: 100%
- Overall feature coverage: >95%

---

## Next Steps

After plan approval:

1. ✅ Run `/speckit.tasks` to generate implementation tasks breakdown
2. Begin implementation following task order
3. Test each component as it's built
4. Integration testing after all components complete
5. Documentation updates
6. Code review and approval
7. Deploy to staging for validation
8. Deploy to production with monitoring

---

## References

- **Specification**: [specification.md](./specification.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Diagrams**: [diagrams.md](./diagrams.md)
- **Testing Guide**: [testing-guide.md](./testing-guide.md)
- **Quickstart**: [quickstart.md](./quickstart.md)
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
