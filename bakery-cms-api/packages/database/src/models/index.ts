/**
 * Database models initialization and associations
 * Exports a pure function that sets up all models and their relationships
 */

import { Sequelize } from 'sequelize';
import { ProductModel, initProductModel } from './product.model';
import { OrderModel, initOrderModel } from './order.model';
import { OrderItemModel, initOrderItemModel } from './order-item.model';
import { PaymentModel, initPaymentModel } from './payment.model';
import { UserModel, initUserModel } from './user.model';
import { AuthSessionModel, initAuthSessionModel } from './auth-session.model';

/**
 * Initialize all models and define their associations
 * Pure function that takes a Sequelize instance and returns configured models
 */
export const initializeModels = (sequelize: Sequelize): {
  readonly Product: typeof ProductModel;
  readonly Order: typeof OrderModel;
  readonly OrderItem: typeof OrderItemModel;
  readonly Payment: typeof PaymentModel;
  readonly User: typeof UserModel;
  readonly AuthSession: typeof AuthSessionModel;
} => {
  // Initialize all models
  const Product = initProductModel(sequelize);
  const Order = initOrderModel(sequelize);
  const OrderItem = initOrderItemModel(sequelize);
  const Payment = initPaymentModel(sequelize);
  const User = initUserModel(sequelize);
  const AuthSession = initAuthSessionModel(sequelize);

  // Define associations
  
  // Product associations
  Product.hasMany(OrderItem, {
    foreignKey: 'productId',
    as: 'orderItems',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  // Order associations
  Order.hasMany(OrderItem, {
    foreignKey: 'orderId',
    as: 'items',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Order.hasOne(Payment, {
    foreignKey: 'orderId',
    as: 'payment',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // OrderItem associations
  OrderItem.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  OrderItem.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Payment associations
  Payment.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // User associations
  User.hasMany(AuthSession, {
    foreignKey: 'userId',
    as: 'authSessions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // AuthSession associations
  AuthSession.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  return {
    Product,
    Order,
    OrderItem,
    Payment,
    User,
    AuthSession,
  };
};

// Export model classes for type checking
export { ProductModel, OrderModel, OrderItemModel, PaymentModel, UserModel, AuthSessionModel };
