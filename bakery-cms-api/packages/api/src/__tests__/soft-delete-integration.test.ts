/**
 * Soft Delete Integration Tests
 * End-to-end tests for soft delete functionality across all entities
 */

import { 
  ProductModel, 
  OrderModel, 
  OrderItemModel, 
  PaymentModel,
  getSequelizeInstance 
} from '@bakery-cms/database';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@bakery-cms/common';

// Use require for uuid to avoid ESM issues in Jest
const { v4: uuidv4 } = require('uuid');

describe('Soft Delete Integration Tests', () => {
  let sequelize: ReturnType<typeof getSequelizeInstance>;

  beforeAll(async () => {
    sequelize = getSequelizeInstance();
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Product Soft Delete', () => {
    it('should soft delete product and filter from default queries', async () => {
      // Create test product
      const productId = uuidv4();
      const product = await ProductModel.create({
        id: productId,
        name: 'Test Product for Soft Delete',
        description: 'Test Description',
        price: 50000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      expect(product.deletedAt).toBeNull();

      // Soft delete the product
      await product.destroy();

      // Should not appear in default query
      const foundProduct = await ProductModel.findByPk(productId);
      expect(foundProduct).toBeNull();

      // Should appear in withDeleted scope
      const foundWithDeleted = await ProductModel.scope('withDeleted').findByPk(productId);
      expect(foundWithDeleted).not.toBeNull();
      expect(foundWithDeleted?.deletedAt).toBeInstanceOf(Date);

      // Should appear in onlyDeleted scope
      const deletedProducts = await ProductModel.scope('onlyDeleted').findAll({
        where: { id: productId },
      });
      expect(deletedProducts).toHaveLength(1);
      expect(deletedProducts[0]?.id).toBe(productId);

      // Cleanup - force delete
      await ProductModel.scope('withDeleted').destroy({
        where: { id: productId },
        force: true,
      });
    });

    it('should restore soft-deleted product', async () => {
      // Create and delete product
      const productId = uuidv4();
      const product = await ProductModel.create({
        id: productId,
        name: 'Test Product for Restore',
        description: 'Test Description',
        price: 60000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      await product.destroy();

      // Verify it's deleted
      let found = await ProductModel.findByPk(productId);
      expect(found).toBeNull();

      // Restore the product
      const deletedProduct = await ProductModel.scope('withDeleted').findByPk(productId);
      await deletedProduct?.restore();

      // Should now appear in default query
      found = await ProductModel.findByPk(productId);
      expect(found).not.toBeNull();
      expect(found?.deletedAt).toBeNull();

      // Cleanup
      await ProductModel.destroy({
        where: { id: productId },
        force: true,
      });
    });

    it('should filter soft-deleted products from list queries', async () => {
      // Create two products
      const product1Id = uuidv4();
      const product2Id = uuidv4();

      await ProductModel.create({
        id: product1Id,
        name: 'Active Product',
        description: 'Active',
        price: 70000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      await ProductModel.create({
        id: product2Id,
        name: 'Deleted Product',
        description: 'Deleted',
        price: 80000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      // Delete second product
      const product2 = await ProductModel.findByPk(product2Id);
      await product2?.destroy();

      // List should only show active product
      const allProducts = await ProductModel.findAll({
        where: { id: [product1Id, product2Id] },
      });
      expect(allProducts).toHaveLength(1);
      expect(allProducts[0]?.id).toBe(product1Id);

      // With deleted scope should show both
      const allWithDeleted = await ProductModel.scope('withDeleted').findAll({
        where: { id: [product1Id, product2Id] },
      });
      expect(allWithDeleted).toHaveLength(2);

      // Cleanup
      await ProductModel.scope('withDeleted').destroy({
        where: { id: [product1Id, product2Id] },
        force: true,
      });
    });
  });

  describe('Order Cascade Soft Delete', () => {
    it('should cascade soft delete order with items and payment', async () => {
      // Create test order with items and payment
      const orderId = uuidv4();
      const productId = uuidv4();
      const paymentId = uuidv4();

      // Create product
      await ProductModel.create({
        id: productId,
        name: 'Test Product for Order',
        description: 'Test',
        price: 100000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      // Create order
      const order = await OrderModel.create({
        id: orderId,
        customerName: 'Test Customer',
        customerPhone: '0123456789',
        customerAddress: 'Test Address',
        status: OrderStatus.DRAFT,
        totalAmount: 200000,
      });

      // Create order items
      const item1Id = uuidv4();
      const item2Id = uuidv4();

      await OrderItemModel.create({
        id: item1Id,
        orderId,
        productId,
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 100000,
        subtotal: 200000,
      });

      await OrderItemModel.create({
        id: item2Id,
        orderId,
        productId,
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 100000,
        subtotal: 100000,
      });

      // Create payment
      await PaymentModel.create({
        id: paymentId,
        orderId,
        amount: 200000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
      });

      // Soft delete order (should cascade)
      await order.destroy();

      // Verify order is soft deleted
      const foundOrder = await OrderModel.findByPk(orderId);
      expect(foundOrder).toBeNull();

      // Verify order items are soft deleted
      const foundItems = await OrderItemModel.findAll({
        where: { orderId },
      });
      expect(foundItems).toHaveLength(0);

      // Verify payment is soft deleted
      const foundPayment = await PaymentModel.findByPk(paymentId);
      expect(foundPayment).toBeNull();

      // Verify with withDeleted scope
      const orderWithDeleted = await OrderModel.scope('withDeleted').findByPk(orderId);
      expect(orderWithDeleted).not.toBeNull();
      expect(orderWithDeleted?.deletedAt).toBeInstanceOf(Date);

      const itemsWithDeleted = await OrderItemModel.scope('withDeleted').findAll({
        where: { orderId },
      });
      expect(itemsWithDeleted).toHaveLength(2);
      expect(itemsWithDeleted.every(item => item.deletedAt !== null)).toBe(true);

      const paymentWithDeleted = await PaymentModel.scope('withDeleted').findByPk(paymentId);
      expect(paymentWithDeleted).not.toBeNull();
      expect(paymentWithDeleted?.deletedAt).toBeInstanceOf(Date);

      // Cleanup
      await OrderModel.scope('withDeleted').destroy({
        where: { id: orderId },
        force: true,
      });
      await OrderItemModel.scope('withDeleted').destroy({
        where: { id: [item1Id, item2Id] },
        force: true,
      });
      await PaymentModel.scope('withDeleted').destroy({
        where: { id: paymentId },
        force: true,
      });
      await ProductModel.destroy({
        where: { id: productId },
        force: true,
      });
    });

    it('should restore order with cascade to items and payment', async () => {
      // Create and delete order with dependencies
      const orderId = uuidv4();
      const productId = uuidv4();
      const paymentId = uuidv4();
      const itemId = uuidv4();

      await ProductModel.create({
        id: productId,
        name: 'Test Product',
        description: 'Test',
        price: 50000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      const order = await OrderModel.create({
        id: orderId,
        customerName: 'Test Customer',
        customerPhone: '0123456789',
        customerAddress: 'Test Address',
        status: OrderStatus.DRAFT,
        totalAmount: 50000,
      });

      await OrderItemModel.create({
        id: itemId,
        orderId,
        productId,
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 50000,
        subtotal: 50000,
      });

      await PaymentModel.create({
        id: paymentId,
        orderId,
        amount: 50000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
      });

      // Delete order
      await order.destroy();

      // Restore order
      const deletedOrder = await OrderModel.scope('withDeleted').findByPk(orderId);
      await deletedOrder?.restore();

      // Restore items (manual cascade restore)
      const deletedItems = await OrderItemModel.scope('withDeleted').findAll({
        where: { orderId },
      });
      for (const item of deletedItems) {
        await item.restore();
      }

      // Restore payment
      const deletedPayment = await PaymentModel.scope('withDeleted').findByPk(paymentId);
      await deletedPayment?.restore();

      // Verify all restored
      const restoredOrder = await OrderModel.findByPk(orderId);
      expect(restoredOrder).not.toBeNull();
      expect(restoredOrder?.deletedAt).toBeNull();

      const restoredItems = await OrderItemModel.findAll({ where: { orderId } });
      expect(restoredItems).toHaveLength(1);

      const restoredPayment = await PaymentModel.findByPk(paymentId);
      expect(restoredPayment).not.toBeNull();

      // Cleanup
      await OrderModel.destroy({ where: { id: orderId }, force: true });
      await OrderItemModel.destroy({ where: { id: itemId }, force: true });
      await PaymentModel.destroy({ where: { id: paymentId }, force: true });
      await ProductModel.destroy({ where: { id: productId }, force: true });
    });
  });

  describe('Payment Soft Delete', () => {
    it('should soft delete payment independently', async () => {
      // Create test order and payment
      const orderId = uuidv4();
      const paymentId = uuidv4();

      await OrderModel.create({
        id: orderId,
        customerName: 'Test Customer',
        customerPhone: '0123456789',
        customerAddress: 'Test Address',
        status: OrderStatus.CONFIRMED,
        totalAmount: 150000,
      });

      const payment = await PaymentModel.create({
        id: paymentId,
        orderId,
        amount: 150000,
        method: PaymentMethod.VIETQR,
        status: PaymentStatus.PENDING,
      });

      // Soft delete payment
      await payment.destroy();

      // Payment should be deleted
      const foundPayment = await PaymentModel.findByPk(paymentId);
      expect(foundPayment).toBeNull();

      // Order should still exist
      const foundOrder = await OrderModel.findByPk(orderId);
      expect(foundOrder).not.toBeNull();

      // Payment should appear in withDeleted scope
      const paymentWithDeleted = await PaymentModel.scope('withDeleted').findByPk(paymentId);
      expect(paymentWithDeleted).not.toBeNull();
      expect(paymentWithDeleted?.deletedAt).toBeInstanceOf(Date);

      // Cleanup
      await PaymentModel.scope('withDeleted').destroy({
        where: { id: paymentId },
        force: true,
      });
      await OrderModel.destroy({ where: { id: orderId }, force: true });
    });

    it('should restore soft-deleted payment', async () => {
      const orderId = uuidv4();
      const paymentId = uuidv4();

      await OrderModel.create({
        id: orderId,
        customerName: 'Test Customer',
        customerPhone: '0123456789',
        customerAddress: 'Test Address',
        status: OrderStatus.CONFIRMED,
        totalAmount: 120000,
      });

      const payment = await PaymentModel.create({
        id: paymentId,
        orderId,
        amount: 120000,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      });

      // Delete and restore
      await payment.destroy();
      
      const deletedPayment = await PaymentModel.scope('withDeleted').findByPk(paymentId);
      await deletedPayment?.restore();

      // Should be active again
      const restoredPayment = await PaymentModel.findByPk(paymentId);
      expect(restoredPayment).not.toBeNull();
      expect(restoredPayment?.deletedAt).toBeNull();

      // Cleanup
      await PaymentModel.destroy({ where: { id: paymentId }, force: true });
      await OrderModel.destroy({ where: { id: orderId }, force: true });
    });
  });

  describe('Cross-Entity Scenarios', () => {
    it('should handle complex multi-entity soft delete workflow', async () => {
      // Create complete order structure
      const orderId = uuidv4();
      const productId = uuidv4();
      const itemId = uuidv4();
      const paymentId = uuidv4();

      const product = await ProductModel.create({
        id: productId,
        name: 'Complex Test Product',
        description: 'Test',
        price: 90000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      const order = await OrderModel.create({
        id: orderId,
        customerName: 'Complex Test',
        customerPhone: '0987654321',
        customerAddress: 'Test Address',
        status: OrderStatus.DRAFT,
        totalAmount: 90000,
      });

      await OrderItemModel.create({
        id: itemId,
        orderId,
        productId,
        productName: 'Complex Test Product',
        quantity: 1,
        unitPrice: 90000,
        subtotal: 90000,
      });

      await PaymentModel.create({
        id: paymentId,
        orderId,
        amount: 90000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
      });

      // Delete product (should not affect order)
      await product.destroy();

      // Order should still exist
      let foundOrder = await OrderModel.findByPk(orderId);
      expect(foundOrder).not.toBeNull();

      // Product should be deleted
      const foundProduct = await ProductModel.findByPk(productId);
      expect(foundProduct).toBeNull();

      // Delete order (should cascade to items and payment)
      await order.destroy();

      // Everything should be deleted except we can find with scopes
      foundOrder = await OrderModel.findByPk(orderId);
      expect(foundOrder).toBeNull();

      const foundItem = await OrderItemModel.findByPk(itemId);
      expect(foundItem).toBeNull();

      const foundPayment = await PaymentModel.findByPk(paymentId);
      expect(foundPayment).toBeNull();

      // All should exist in withDeleted scopes
      const allDeleted = await Promise.all([
        ProductModel.scope('withDeleted').findByPk(productId),
        OrderModel.scope('withDeleted').findByPk(orderId),
        OrderItemModel.scope('withDeleted').findByPk(itemId),
        PaymentModel.scope('withDeleted').findByPk(paymentId),
      ]);

      expect(allDeleted.every(entity => entity !== null)).toBe(true);
      expect(allDeleted.every(entity => entity?.deletedAt !== null)).toBe(true);

      // Cleanup
      await ProductModel.scope('withDeleted').destroy({
        where: { id: productId },
        force: true,
      });
      await OrderModel.scope('withDeleted').destroy({
        where: { id: orderId },
        force: true,
      });
      await OrderItemModel.scope('withDeleted').destroy({
        where: { id: itemId },
        force: true,
      });
      await PaymentModel.scope('withDeleted').destroy({
        where: { id: paymentId },
        force: true,
      });
    });
  });

  describe('Scope Functionality', () => {
    it('should correctly filter with defaultScope', async () => {
      const activeId = uuidv4();
      const deletedId = uuidv4();

      // Create two products
      await ProductModel.create({
        id: activeId,
        name: 'Active Scope Test',
        description: 'Active',
        price: 40000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      const deletedProduct = await ProductModel.create({
        id: deletedId,
        name: 'Deleted Scope Test',
        description: 'Deleted',
        price: 45000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      await deletedProduct.destroy();

      // Default scope should only find active
      const defaultResults = await ProductModel.findAll({
        where: { id: [activeId, deletedId] },
      });
      expect(defaultResults).toHaveLength(1);
      expect(defaultResults[0]?.id).toBe(activeId);

      // Cleanup
      await ProductModel.destroy({ where: { id: activeId }, force: true });
      await ProductModel.scope('withDeleted').destroy({
        where: { id: deletedId },
        force: true,
      });
    });

    it('should correctly filter with onlyDeleted scope', async () => {
      const activeId = uuidv4();
      const deletedId = uuidv4();

      await ProductModel.create({
        id: activeId,
        name: 'Active Only Test',
        description: 'Active',
        price: 35000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      const deletedProduct = await ProductModel.create({
        id: deletedId,
        name: 'Deleted Only Test',
        description: 'Deleted',
        price: 38000,
        category: 'test',
        imageUrl: 'test.jpg',
      });

      await deletedProduct.destroy();

      // onlyDeleted scope should only find deleted
      const deletedResults = await ProductModel.scope('onlyDeleted').findAll({
        where: { id: [activeId, deletedId] },
      });
      expect(deletedResults).toHaveLength(1);
      expect(deletedResults[0]?.id).toBe(deletedId);

      // Cleanup
      await ProductModel.destroy({ where: { id: activeId }, force: true });
      await ProductModel.scope('withDeleted').destroy({
        where: { id: deletedId },
        force: true,
      });
    });
  });
});
