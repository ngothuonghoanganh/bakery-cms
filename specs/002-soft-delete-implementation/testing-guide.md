# Soft Delete Implementation - Testing Guide

This document provides comprehensive testing strategies for the soft delete feature.

## Test Coverage Goals

- **Unit Tests**: 100% coverage for repositories and services
- **Integration Tests**: All API endpoints
- **Migration Tests**: Database schema changes
- **Performance Tests**: Query performance benchmarks
- **E2E Tests**: Complete user workflows

## Unit Tests

### Product Repository Tests

File: `packages/api/src/modules/products/repositories/__tests__/products.repositories.soft-delete.test.ts`

```typescript
import { ProductModel } from '@bakery-cms/database';
import { createProductRepository } from '../products.repositories';
import { setupTestDatabase, teardownTestDatabase } from '../../../../test/helpers';

describe('ProductRepository - Soft Delete', () => {
  let repository: ReturnType<typeof createProductRepository>;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    repository = createProductRepository(ProductModel);
  });

  afterEach(async () => {
    await ProductModel.destroy({ where: {}, force: true });
  });

  describe('delete', () => {
    it('should set deletedAt timestamp instead of removing record', async () => {
      const product = await repository.create({
        name: 'Chocolate Chip Cookie',
        price: 12.99,
        businessType: 'retail',
        status: 'available',
      });

      const deleted = await repository.delete(product.id);

      expect(deleted).toBe(true);

      // Should not find in default scope
      const found = await repository.findById(product.id);
      expect(found).toBeNull();

      // Should find with withDeleted scope
      const foundDeleted = await ProductModel.scope('withDeleted').findByPk(product.id);
      expect(foundDeleted).not.toBeNull();
      expect(foundDeleted!.deletedAt).toBeInstanceOf(Date);
    });

    it('should return false when product not found', async () => {
      const deleted = await repository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('should return false when trying to delete already deleted product', async () => {
      const product = await repository.create({
        name: 'Test Product',
        price: 10.00,
        businessType: 'retail',
        status: 'available',
      });

      await repository.delete(product.id);
      const deletedAgain = await repository.delete(product.id);

      expect(deletedAgain).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted product', async () => {
      const product = await repository.create({
        name: 'Oatmeal Cookie',
        price: 9.99,
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

    it('should return false when product not found', async () => {
      const restored = await repository.restore('non-existent-id');
      expect(restored).toBe(false);
    });

    it('should return false when product is not deleted', async () => {
      const product = await repository.create({
        name: 'Active Product',
        price: 10.00,
        businessType: 'retail',
        status: 'available',
      });

      const restored = await repository.restore(product.id);
      expect(restored).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should not return soft-deleted products', async () => {
      await repository.create({
        name: 'Active Product 1',
        price: 10.00,
        businessType: 'retail',
        status: 'available',
      });

      const deleted = await repository.create({
        name: 'Deleted Product',
        price: 12.00,
        businessType: 'retail',
        status: 'available',
      });

      await repository.create({
        name: 'Active Product 2',
        price: 15.00,
        businessType: 'retail',
        status: 'available',
      });

      await repository.delete(deleted.id);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.count).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows.every(p => p.deletedAt === null)).toBe(true);
    });
  });

  describe('count', () => {
    it('should not count soft-deleted products', async () => {
      await repository.create({
        name: 'Product 1',
        price: 10.00,
        businessType: 'retail',
        status: 'available',
      });

      const toDelete = await repository.create({
        name: 'Product 2',
        price: 12.00,
        businessType: 'retail',
        status: 'available',
      });

      await repository.create({
        name: 'Product 3',
        price: 15.00,
        businessType: 'retail',
        status: 'available',
      });

      let count = await repository.count();
      expect(count).toBe(3);

      await repository.delete(toDelete.id);

      count = await repository.count();
      expect(count).toBe(2);
    });
  });
});
```

### Order Repository Tests

File: `packages/api/src/modules/orders/repositories/__tests__/orders.repositories.soft-delete.test.ts`

```typescript
import { OrderModel, OrderItemModel, PaymentModel } from '@bakery-cms/database';
import { createOrderRepository } from '../orders.repositories';
import { OrderStatus } from '@bakery-cms/common';

describe('OrderRepository - Soft Delete', () => {
  let repository: ReturnType<typeof createOrderRepository>;

  beforeEach(() => {
    repository = createOrderRepository(OrderModel, OrderItemModel);
  });

  describe('delete with cascade', () => {
    it('should soft delete order and all related records', async () => {
      // Create order with items and payment
      const order = await repository.create({
        orderNumber: 'ORD-001',
        orderType: 'temporary',
        businessModel: 'retail',
        totalAmount: 100.00,
        status: OrderStatus.DRAFT,
      });

      await OrderItemModel.create({
        orderId: order.id,
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 50.00,
        subtotal: 100.00,
      });

      await PaymentModel.create({
        orderId: order.id,
        amount: 100.00,
        method: 'vietqr',
        status: 'pending',
      });

      // Soft delete order
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

      // Verify payment is soft deleted
      const payment = await PaymentModel.findOne({
        where: { orderId: order.id }
      });
      expect(payment).toBeNull();

      // Verify with withDeleted scope
      const deletedOrder = await OrderModel.scope('withDeleted').findByPk(order.id);
      expect(deletedOrder).not.toBeNull();
      expect(deletedOrder!.deletedAt).toBeInstanceOf(Date);

      const deletedItems = await OrderItemModel.scope('withDeleted').findAll({
        where: { orderId: order.id }
      });
      expect(deletedItems).toHaveLength(1);
      expect(deletedItems[0].deletedAt).toBeInstanceOf(Date);

      const deletedPayment = await PaymentModel.scope('withDeleted').findOne({
        where: { orderId: order.id }
      });
      expect(deletedPayment).not.toBeNull();
      expect(deletedPayment!.deletedAt).toBeInstanceOf(Date);
    });

    it('should handle transaction rollback on error', async () => {
      // This test would require mocking to simulate an error
      // during the cascade delete process
    });
  });

  describe('restore with cascade', () => {
    it('should restore order and all related records', async () => {
      const order = await repository.create({
        orderNumber: 'ORD-002',
        orderType: 'temporary',
        businessModel: 'retail',
        totalAmount: 100.00,
        status: OrderStatus.DRAFT,
      });

      await OrderItemModel.create({
        orderId: order.id,
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 100.00,
        subtotal: 100.00,
      });

      await repository.delete(order.id);
      const restored = await repository.restore(order.id);

      expect(restored).toBe(true);

      // Verify order is restored
      const foundOrder = await repository.findById(order.id);
      expect(foundOrder).not.toBeNull();
      expect(foundOrder!.deletedAt).toBeNull();

      // Verify items are restored
      const items = await OrderItemModel.findAll({
        where: { orderId: order.id }
      });
      expect(items).toHaveLength(1);
      expect(items[0].deletedAt).toBeNull();
    });
  });
});
```

### Service Tests

File: `packages/api/src/modules/products/services/__tests__/products.services.soft-delete.test.ts`

```typescript
import { createProductService } from '../products.services';
import { createNotFoundError } from '../../../../utils/error-factory';

describe('ProductService - Soft Delete', () => {
  let service: ReturnType<typeof createProductService>;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };
    service = createProductService(mockRepository);
  });

  describe('deleteProduct', () => {
    it('should successfully soft delete product', async () => {
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.deleteProduct('product-id');

      expect(result.isOk()).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith('product-id');
    });

    it('should return error when product not found', async () => {
      mockRepository.delete.mockResolvedValue(false);

      const result = await service.deleteProduct('non-existent-id');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('NOT_FOUND');
    });

    it('should handle database errors', async () => {
      mockRepository.delete.mockRejectedValue(new Error('DB Error'));

      const result = await service.deleteProduct('product-id');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('DATABASE_ERROR');
    });
  });

  describe('restoreProduct', () => {
    it('should successfully restore product', async () => {
      const mockProduct = {
        id: 'product-id',
        name: 'Test Product',
        price: 10.00,
        deletedAt: null,
      };

      mockRepository.restore.mockResolvedValue(true);
      mockRepository.findById.mockResolvedValue(mockProduct);

      const result = await service.restoreProduct('product-id');

      expect(result.isOk()).toBe(true);
      expect(mockRepository.restore).toHaveBeenCalledWith('product-id');
      expect(mockRepository.findById).toHaveBeenCalledWith('product-id');
    });

    it('should return error when product not found or not deleted', async () => {
      mockRepository.restore.mockResolvedValue(false);

      const result = await service.restoreProduct('product-id');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('NOT_FOUND');
    });
  });
});
```

## Integration Tests

### API Endpoint Tests

File: `packages/api/src/modules/products/__tests__/products.integration.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../../app';
import { ProductModel } from '@bakery-cms/database';

describe('DELETE /api/products/:id', () => {
  let productId: string;

  beforeEach(async () => {
    const product = await ProductModel.create({
      name: 'Test Cookie',
      price: 12.99,
      businessType: 'retail',
      status: 'available',
    });
    productId = product.id;
  });

  afterEach(async () => {
    await ProductModel.destroy({ where: {}, force: true });
  });

  it('should soft delete product and return 204', async () => {
    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .expect(204);

    // Verify product is not in list
    const listResponse = await request(app)
      .get('/api/products')
      .expect(200);

    const productIds = listResponse.body.data.map((p: any) => p.id);
    expect(productIds).not.toContain(productId);

    // Verify in database
    const product = await ProductModel.scope('withDeleted').findByPk(productId);
    expect(product).not.toBeNull();
    expect(product!.deletedAt).toBeInstanceOf(Date);
  });

  it('should return 404 when product not found', async () => {
    await request(app)
      .delete('/api/products/non-existent-id')
      .expect(404);
  });

  it('should return 404 when trying to delete already deleted product', async () => {
    await request(app)
      .delete(`/api/products/${productId}`)
      .expect(204);

    await request(app)
      .delete(`/api/products/${productId}`)
      .expect(404);
  });
});

describe('GET /api/products', () => {
  it('should not return soft-deleted products', async () => {
    const active = await ProductModel.create({
      name: 'Active Product',
      price: 10.00,
      businessType: 'retail',
      status: 'available',
    });

    const toDelete = await ProductModel.create({
      name: 'To Delete',
      price: 12.00,
      businessType: 'retail',
      status: 'available',
    });

    // Soft delete one product
    await toDelete.update({ deletedAt: new Date() });

    const response = await request(app)
      .get('/api/products')
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(active.id);
  });
});

describe('GET /api/products/:id', () => {
  it('should return 404 for soft-deleted product', async () => {
    const product = await ProductModel.create({
      name: 'Test Product',
      price: 10.00,
      businessType: 'retail',
      status: 'available',
    });

    await product.update({ deletedAt: new Date() });

    await request(app)
      .get(`/api/products/${product.id}`)
      .expect(404);
  });
});
```

## Migration Tests

File: `packages/database/src/migrations/__tests__/add-soft-delete-fields.test.ts`

```typescript
import { QueryInterface } from 'sequelize';
import { up, down } from '../YYYYMMDDHHMMSS-add-soft-delete-fields';

describe('Add Soft Delete Fields Migration', () => {
  let queryInterface: QueryInterface;

  beforeAll(async () => {
    // Setup test database connection
    queryInterface = await setupTestQueryInterface();
  });

  afterAll(async () => {
    await teardownTestQueryInterface();
  });

  describe('up', () => {
    it('should add deletedAt column to all tables', async () => {
      await up(queryInterface);

      const productsTable = await queryInterface.describeTable('products');
      expect(productsTable.deleted_at).toBeDefined();
      expect(productsTable.deleted_at.allowNull).toBe(true);
      expect(productsTable.deleted_at.type).toContain('TIMESTAMP');

      const ordersTable = await queryInterface.describeTable('orders');
      expect(ordersTable.deleted_at).toBeDefined();

      const orderItemsTable = await queryInterface.describeTable('order_items');
      expect(orderItemsTable.deleted_at).toBeDefined();

      const paymentsTable = await queryInterface.describeTable('payments');
      expect(paymentsTable.deleted_at).toBeDefined();
    });

    it('should add indexes on deletedAt columns', async () => {
      await up(queryInterface);

      const indexes = await queryInterface.showIndex('products');
      const deletedAtIndex = indexes.find(idx => idx.name === 'idx_products_deleted_at');
      expect(deletedAtIndex).toBeDefined();
    });

    it('should update unique constraints', async () => {
      await up(queryInterface);

      const ordersIndexes = await queryInterface.showIndex('orders');
      const uniqueIndex = ordersIndexes.find(
        idx => idx.name === 'orders_order_number_unique'
      );
      expect(uniqueIndex).toBeDefined();
    });
  });

  describe('down', () => {
    it('should remove deletedAt columns', async () => {
      await up(queryInterface);
      await down(queryInterface);

      const productsTable = await queryInterface.describeTable('products');
      expect(productsTable.deleted_at).toBeUndefined();

      const ordersTable = await queryInterface.describeTable('orders');
      expect(ordersTable.deleted_at).toBeUndefined();
    });

    it('should restore original unique constraints', async () => {
      await up(queryInterface);
      await down(queryInterface);

      const constraints = await queryInterface.showConstraint('orders', 'order_number');
      expect(constraints).toBeDefined();
    });
  });

  describe('migration idempotency', () => {
    it('should be safe to run up multiple times', async () => {
      await up(queryInterface);
      // Should not throw error
      await expect(up(queryInterface)).resolves.not.toThrow();
    });

    it('should be safe to run down multiple times', async () => {
      await up(queryInterface);
      await down(queryInterface);
      // Should not throw error
      await expect(down(queryInterface)).resolves.not.toThrow();
    });
  });
});
```

## Performance Tests

File: `packages/api/src/modules/products/__tests__/products.performance.test.ts`

```typescript
describe('Soft Delete Performance', () => {
  beforeAll(async () => {
    // Create large dataset
    const products = [];
    for (let i = 0; i < 10000; i++) {
      products.push({
        name: `Product ${i}`,
        price: Math.random() * 100,
        businessType: 'retail',
        status: 'available',
      });
    }
    await ProductModel.bulkCreate(products);

    // Soft delete 30% of products
    const toDelete = await ProductModel.findAll({ limit: 3000 });
    await Promise.all(
      toDelete.map(p => p.update({ deletedAt: new Date() }))
    );
  });

  it('should query active products efficiently', async () => {
    const startTime = Date.now();
    
    const result = await ProductModel.findAll({
      limit: 100,
    });

    const duration = Date.now() - startTime;

    expect(result).toHaveLength(100);
    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });

  it('should count active products efficiently', async () => {
    const startTime = Date.now();
    
    const count = await ProductModel.count();

    const duration = Date.now() - startTime;

    expect(count).toBe(7000);
    expect(duration).toBeLessThan(50); // Should complete in < 50ms
  });

  it('should filter by status and deletedAt efficiently', async () => {
    const startTime = Date.now();
    
    const result = await ProductModel.findAll({
      where: {
        status: 'available',
      },
      limit: 100,
    });

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(100);
  });
});
```

## E2E Tests

File: `tests/e2e/soft-delete.e2e.test.ts`

```typescript
describe('Soft Delete E2E', () => {
  describe('Product Lifecycle', () => {
    it('should complete full product lifecycle with soft delete', async () => {
      // Create product
      const createResponse = await request(app)
        .post('/api/products')
        .send({
          name: 'E2E Test Cookie',
          price: 15.99,
          businessType: 'retail',
          status: 'available',
        })
        .expect(201);

      const productId = createResponse.body.data.id;

      // Verify product in list
      let listResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(listResponse.body.data.some((p: any) => p.id === productId)).toBe(true);

      // Soft delete product
      await request(app)
        .delete(`/api/products/${productId}`)
        .expect(204);

      // Verify product not in list
      listResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(listResponse.body.data.some((p: any) => p.id === productId)).toBe(false);

      // Verify 404 on get by id
      await request(app)
        .get(`/api/products/${productId}`)
        .expect(404);

      // Verify in database
      const product = await ProductModel.scope('withDeleted').findByPk(productId);
      expect(product).not.toBeNull();
      expect(product!.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('Order Cascade Delete', () => {
    it('should cascade delete order with items and payment', async () => {
      // Create order with items
      const orderResponse = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'temporary',
          businessModel: 'retail',
          items: [
            { productId: 'prod-1', quantity: 2, unitPrice: 10.00 },
          ],
        })
        .expect(201);

      const orderId = orderResponse.body.data.id;

      // Create payment
      await request(app)
        .post('/api/payments')
        .send({
          orderId,
          amount: 20.00,
          method: 'vietqr',
        })
        .expect(201);

      // Soft delete order
      await request(app)
        .delete(`/api/orders/${orderId}`)
        .expect(204);

      // Verify order not found
      await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(404);

      // Verify in database all related records are soft deleted
      const order = await OrderModel.scope('withDeleted').findByPk(orderId);
      expect(order).not.toBeNull();
      expect(order!.deletedAt).toBeInstanceOf(Date);

      const items = await OrderItemModel.scope('withDeleted').findAll({
        where: { orderId },
      });
      expect(items.every(i => i.deletedAt !== null)).toBe(true);

      const payment = await PaymentModel.scope('withDeleted').findOne({
        where: { orderId },
      });
      expect(payment).not.toBeNull();
      expect(payment!.deletedAt).toBeInstanceOf(Date);
    });
  });
});
```

## Test Execution Plan

### Local Development
```bash
# Run all tests
yarn test

# Run specific test suites
yarn test --grep "Soft Delete"

# Run with coverage
yarn test:coverage

# Watch mode for TDD
yarn test:watch
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
- name: Unit Tests
  run: yarn test:unit

- name: Integration Tests
  run: yarn test:integration

- name: Migration Tests
  run: yarn test:migrations

- name: E2E Tests
  run: yarn test:e2e

- name: Coverage Report
  run: yarn test:coverage
```

### Performance Benchmarks
```bash
# Run performance tests
yarn test:performance

# Generate performance report
yarn test:performance --reporter json > performance-report.json
```

## Test Data Management

### Fixtures
Create reusable test data:

```typescript
// test/fixtures/products.ts
export const mockProducts = {
  active: {
    name: 'Active Cookie',
    price: 10.00,
    businessType: 'retail',
    status: 'available',
    deletedAt: null,
  },
  deleted: {
    name: 'Deleted Cookie',
    price: 12.00,
    businessType: 'retail',
    status: 'available',
    deletedAt: new Date(),
  },
};
```

### Database Seeding
```bash
# Seed test database
yarn test:seed

# Reset test database
yarn test:reset
```

## Acceptance Criteria Verification

### Checklist

- [ ] All unit tests pass (100% coverage for new code)
- [ ] All integration tests pass
- [ ] Migration tests verify schema changes
- [ ] Performance tests meet benchmarks
- [ ] E2E tests cover main workflows
- [ ] No regression in existing tests
- [ ] Code coverage maintained > 80%
- [ ] All edge cases tested
- [ ] Error scenarios covered
- [ ] Transaction rollback tested

## Continuous Testing

### Pre-commit Hook
```bash
# .husky/pre-commit
yarn test:changed
yarn test:lint
```

### Pre-push Hook
```bash
# .husky/pre-push
yarn test:all
```

### Scheduled Tests
```yaml
# Weekly comprehensive test run
- cron: '0 2 * * 0'
  run: yarn test:comprehensive
```
