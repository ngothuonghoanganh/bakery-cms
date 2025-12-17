# Soft Delete Implementation - Quick Start Guide

This guide provides step-by-step instructions for implementing the soft delete feature.

## Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ running
- Access to bakery-cms-api repository
- Database backup completed
- Staging environment available for testing

## Implementation Steps

### Step 1: Database Migration

#### 1.1 Create Migration File

```bash
cd bakery-cms-api
yarn workspace @bakery-cms/database migrate:create add-soft-delete-fields
```

#### 1.2 Implement Migration

Copy the migration code from `specification.md` section "Migration File" into the generated file.

#### 1.3 Test Migration on Local

```bash
# Backup local database first
mysqldump -u root -p bakery_cms > backup_before_soft_delete.sql

# Run migration
yarn workspace @bakery-cms/database migrate:up

# Verify tables
mysql -u root -p bakery_cms -e "DESCRIBE products;"
mysql -u root -p bakery_cms -e "SHOW INDEXES FROM products;"
```

#### 1.4 Test Rollback

```bash
# Test migration rollback
yarn workspace @bakery-cms/database migrate:down

# Re-run migration
yarn workspace @bakery-cms/database migrate:up
```

### Step 2: Update Models

#### 2.1 Update Product Model

File: `packages/database/src/models/product.model.ts`

Add `deletedAt` field and scopes:

```typescript
export class ProductModel extends Model {
  // ... existing fields ...
  declare deletedAt: Date | null; // ADD THIS
}

export const initProductModel = (sequelize: Sequelize): typeof ProductModel => {
  ProductModel.init(
    {
      // ... existing fields ...
      
      // ADD THIS FIELD
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
      
      // ADD DEFAULT SCOPE
      defaultScope: {
        where: {
          deletedAt: null,
        },
      },
      
      // ADD NAMED SCOPES
      scopes: {
        withDeleted: {
          where: {},
        },
        onlyDeleted: {
          where: {
            deletedAt: {
              [Op.ne]: null,
            },
          },
        },
      },
      
      indexes: [
        // ... existing indexes ...
        
        // ADD THIS INDEX
        {
          fields: ['deleted_at'],
        },
      ],
    }
  );

  return ProductModel;
};
```

#### 2.2 Update Order Model

File: `packages/database/src/models/order.model.ts`

Apply same changes as Product model.

#### 2.3 Update OrderItem Model

File: `packages/database/src/models/order-item.model.ts`

Apply same changes as Product model.

#### 2.4 Update Payment Model

File: `packages/database/src/models/payment.model.ts`

Apply same changes as Product model.

### Step 3: Update Repositories

#### 3.1 Update Product Repository

File: `packages/api/src/modules/products/repositories/products.repositories.ts`

Replace the `deleteProduct` function:

```typescript
/**
 * Soft delete product by ID
 * Sets deletedAt timestamp instead of removing record
 */
const deleteProduct = async (id: string): Promise<boolean> => {
  const product = await model.findByPk(id);

  if (!product) {
    return false;
  }

  // Perform soft delete
  await product.update({
    deletedAt: new Date(),
  });

  return true;
};

/**
 * Restore soft-deleted product (NEW)
 */
const restoreProduct = async (id: string): Promise<boolean> => {
  const product = await model.scope('withDeleted').findByPk(id);

  if (!product || !product.deletedAt) {
    return false;
  }

  await product.update({
    deletedAt: null,
  });

  return true;
};

// Update return object
return {
  findById,
  findAll,
  create,
  update,
  delete: deleteProduct,
  restore: restoreProduct, // ADD THIS
  count,
};
```

#### 3.2 Update Order Repository

File: `packages/api/src/modules/orders/repositories/orders.repositories.ts`

Replace the `deleteOrder` function with cascade logic:

```typescript
/**
 * Soft delete order by ID with cascade
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

    // Soft delete all order items
    await orderItemModel.update(
      { deletedAt },
      { where: { orderId: id }, transaction }
    );

    // Soft delete payment if exists
    await model.sequelize!.models.Payment.update(
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
 * Restore soft-deleted order with cascade (NEW)
 */
const restoreOrder = async (id: string): Promise<boolean> => {
  const order = await model.scope('withDeleted').findByPk(id);

  if (!order || !order.deletedAt) {
    return false;
  }

  const transaction = await model.sequelize!.transaction();

  try {
    // Restore order
    await order.update({ deletedAt: null }, { transaction });

    // Restore order items
    await orderItemModel.update(
      { deletedAt: null },
      { where: { orderId: id }, transaction }
    );

    // Restore payment
    await model.sequelize!.models.Payment.update(
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

// Update return object
return {
  // ... existing methods ...
  delete: deleteOrder,
  restore: restoreOrder, // ADD THIS
  // ... other methods ...
};
```

#### 3.3 Update Payment Repository

Similar to Product repository, update the delete method to perform soft delete.

### Step 4: Update Services

#### 4.1 Update Product Service

File: `packages/api/src/modules/products/services/products.services.ts`

Update the `deleteProduct` function:

```typescript
/**
 * Soft delete product by ID
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
 * Restore soft-deleted product (NEW)
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

// Update return object
return {
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
  restoreProduct, // ADD THIS
};
```

#### 4.2 Update Order Service

Similar changes, keeping the business rule that only DRAFT orders can be deleted.

### Step 5: Run Tests

#### 5.1 Unit Tests

```bash
# Run all tests
yarn test

# Run specific module tests
yarn test products.repositories
yarn test orders.repositories
yarn test products.services
```

#### 5.2 Create Soft Delete Tests

Create new test file: `packages/api/src/modules/products/repositories/__tests__/soft-delete.test.ts`

```typescript
import { ProductModel } from '@bakery-cms/database';
import { createProductRepository } from '../products.repositories';

describe('Product Repository - Soft Delete', () => {
  let repository: ReturnType<typeof createProductRepository>;

  beforeEach(() => {
    repository = createProductRepository(ProductModel);
  });

  it('should soft delete product instead of removing', async () => {
    // Create test product
    const product = await repository.create({
      name: 'Test Cookie',
      price: 10.99,
      businessType: 'retail',
      status: 'available',
    });

    // Soft delete
    const deleted = await repository.delete(product.id);
    expect(deleted).toBe(true);

    // Should not be found in normal query
    const found = await repository.findById(product.id);
    expect(found).toBeNull();

    // Should be found with withDeleted scope
    const foundWithDeleted = await ProductModel.scope('withDeleted')
      .findByPk(product.id);
    expect(foundWithDeleted).not.toBeNull();
    expect(foundWithDeleted!.deletedAt).toBeInstanceOf(Date);
  });

  it('should restore soft-deleted product', async () => {
    const product = await repository.create({
      name: 'Test Cookie',
      price: 10.99,
      businessType: 'retail',
      status: 'available',
    });

    await repository.delete(product.id);
    const restored = await repository.restore(product.id);
    
    expect(restored).toBe(true);

    const found = await repository.findById(product.id);
    expect(found).not.toBeNull();
    expect(found!.deletedAt).toBeNull();
  });
});
```

### Step 6: Integration Testing

#### 6.1 Test API Endpoints

```bash
# Start the API server
yarn dev

# In another terminal, test the endpoints
curl -X DELETE http://localhost:3000/api/products/{product-id}

# Verify product is not in list
curl http://localhost:3000/api/products

# Check database directly
mysql -u root -p bakery_cms -e "SELECT id, name, deleted_at FROM products WHERE id = '{product-id}';"
```

### Step 7: Deploy to Staging

#### 7.1 Run Migration on Staging

```bash
# Connect to staging database
# Run migration
yarn workspace @bakery-cms/database migrate:up

# Verify
mysql -h staging-db -u user -p bakery_cms -e "DESCRIBE products;"
```

#### 7.2 Deploy Code to Staging

```bash
# Build the project
yarn build

# Deploy to staging
# (Your deployment process)
```

#### 7.3 Smoke Test on Staging

```bash
# Test delete operation
curl -X DELETE https://staging.bakery-cms.com/api/products/{id}

# Test list operation (deleted should not appear)
curl https://staging.bakery-cms.com/api/products

# Verify in database
mysql -h staging-db -u user -p -e "SELECT COUNT(*) FROM products WHERE deleted_at IS NOT NULL;"
```

### Step 8: Production Deployment

#### 8.1 Pre-Deployment Checklist

- [ ] All tests passing on staging
- [ ] Database backup completed
- [ ] Migration tested on staging
- [ ] Performance benchmarks acceptable
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

#### 8.2 Run Migration on Production

```bash
# Create database backup
mysqldump -h prod-db -u user -p bakery_cms > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
NODE_ENV=production yarn workspace @bakery-cms/database migrate:up
```

#### 8.3 Deploy Code

```bash
# Build for production
NODE_ENV=production yarn build

# Deploy
# (Your production deployment process)
```

#### 8.4 Post-Deployment Verification

```bash
# Check health endpoint
curl https://api.bakery-cms.com/health

# Test delete operation
curl -X DELETE https://api.bakery-cms.com/api/products/{test-id}

# Verify metrics
# Check Grafana/monitoring dashboards
```

### Step 9: Monitoring

#### 9.1 Set Up Alerts

- Alert on unusual deletion volume (> 100 deletes/hour)
- Alert on database size growth (> 20% increase)
- Alert on query performance degradation (> 10% slower)

#### 9.2 Create Dashboard

Monitor:
- Total deleted vs active records
- Deletion rate over time
- Query performance metrics
- Database table sizes

#### 9.3 Log Analysis

```bash
# Check soft delete logs
grep "soft deleted successfully" application.log | wc -l

# Check for errors
grep "Failed to soft delete" application.log
```

## Verification Checklist

After implementation, verify:

- [x] Migration applied successfully ✅
- [x] All models have `deletedAt` field ✅
- [x] Default scopes filter deleted records ✅
- [x] Delete operations set `deletedAt` instead of removing records ✅
- [x] Cascade delete works for orders ✅
- [x] Unique constraints work with soft delete ✅
- [x] Indexes created on `deleted_at` columns ✅
- [x] Integration tests pass ✅
- [x] API responses unchanged (backward compatible) ✅
- [x] Documentation updated ✅
- [ ] Monitoring in place (for production)

## Validation Scenarios

### Scenario 1: Product Soft Delete

```bash
# Create a test product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "For soft delete testing",
    "price": 50000,
    "category": "test",
    "imageUrl": "test.jpg"
  }'

# Note the product ID from response
PRODUCT_ID="<product-id>"

# Soft delete the product
curl -X DELETE http://localhost:3000/api/products/$PRODUCT_ID

# Try to GET the product - should return 404
curl http://localhost:3000/api/products/$PRODUCT_ID

# Verify in database - record should exist with deletedAt set
mysql -e "SELECT id, name, deleted_at FROM products WHERE id='$PRODUCT_ID';"

# Expected: Record exists with deletedAt timestamp
```

### Scenario 2: Order Cascade Soft Delete

```bash
# Create a draft order with items
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerPhone": "0123456789",
    "customerAddress": "Test Address",
    "status": "draft",
    "items": [
      {
        "productId": "<product-id>",
        "quantity": 2,
        "unitPrice": 50000
      }
    ]
  }'

ORDER_ID="<order-id>"

# Soft delete the order (only DRAFT orders can be deleted)
curl -X DELETE http://localhost:3000/api/orders/$ORDER_ID

# Verify cascade - order, items, and payment should all be soft deleted
mysql -e "
SELECT 'orders' as table_name, COUNT(*) as soft_deleted 
FROM orders WHERE id='$ORDER_ID' AND deleted_at IS NOT NULL
UNION ALL
SELECT 'order_items', COUNT(*) 
FROM order_items WHERE order_id='$ORDER_ID' AND deleted_at IS NOT NULL
UNION ALL
SELECT 'payments', COUNT(*) 
FROM payments WHERE order_id='$ORDER_ID' AND deleted_at IS NOT NULL;
"

# Expected: All 3 tables show count > 0
```

### Scenario 3: List Query Filtering

```bash
# Create multiple products
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/products \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Product $i\",
      \"description\": \"Test\",
      \"price\": 50000,
      \"category\": \"test\",
      \"imageUrl\": \"test.jpg\"
    }"
done

# Delete the second product
curl -X DELETE http://localhost:3000/api/products/$PRODUCT_2_ID

# List all products - should NOT include deleted product
curl http://localhost:3000/api/products

# Expected: Only 2 products returned (not the deleted one)

# Verify in database - 3 products exist, 1 soft deleted
mysql -e "
SELECT 
  COUNT(*) as total_products,
  SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted
FROM products 
WHERE name LIKE 'Product %';
"

# Expected: total=3, active=2, deleted=1
```

### Scenario 4: Restore Functionality (Admin Operation)

```typescript
// In database package or admin tool
import { ProductModel } from '@bakery-cms/database';

// Find soft-deleted product
const deletedProduct = await ProductModel.scope('withDeleted')
  .findByPk('product-id');

// Restore it
if (deletedProduct && deletedProduct.deletedAt) {
  await deletedProduct.restore();
  console.log('Product restored successfully');
}

// Verify - product should now appear in normal queries
const restoredProduct = await ProductModel.findByPk('product-id');
console.log('Product is active:', restoredProduct !== null);
```

### Scenario 5: Performance Validation

```bash
# Test query performance with index
mysql -e "
EXPLAIN SELECT * FROM products 
WHERE deleted_at IS NULL 
LIMIT 10;
"

# Expected: Should use idx_products_deleted_at index
# type: ref, key: idx_products_deleted_at

# Benchmark query time (should be < 50ms)
time mysql -e "SELECT COUNT(*) FROM products WHERE deleted_at IS NULL;"
```

## Rollback Procedure

If issues are detected:

1. **Rollback Code Deployment**
   ```bash
   # Deploy previous version
   git checkout previous-tag
   yarn build
   # Deploy
   ```

2. **Rollback Database Migration** (if needed)
   ```bash
   yarn workspace @bakery-cms/database migrate:down
   ```

3. **Verify Rollback**
   ```bash
   # Check tables
   mysql -e "DESCRIBE products;"
   
   # Test API
   curl https://api.bakery-cms.com/health
   ```

## Common Issues and Solutions

### Issue: Migration Fails on Production

**Solution:**
- Check database permissions
- Verify MySQL version (8.0+ required for partial indexes)
- Check for existing data conflicts
- Review migration logs

### Issue: Queries Slower After Deployment

**Solution:**
- Run ANALYZE TABLE on affected tables
- Check if indexes were created correctly
- Verify query plans with EXPLAIN
- Consider adjusting index strategy

### Issue: Unique Constraint Violations

**Solution:**
- Verify partial unique indexes were created
- Check for data inconsistencies
- Ensure scopes are used correctly in queries

## Support

For issues or questions:
- Check logs: `tail -f logs/application.log`
- Review specification: `specs/002-soft-delete-implementation/specification.md`
- Contact: [Your Team Contact Info]
