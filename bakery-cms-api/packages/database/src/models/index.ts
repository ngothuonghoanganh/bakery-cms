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
import { BrandModel, initBrandModel } from './brand.model';
import { StockItemModel, initStockItemModel } from './stock-item.model';
import { StockItemBrandModel, initStockItemBrandModel } from './stock-item-brand.model';
import { ProductStockItemModel, initProductStockItemModel } from './product-stock-item.model';
import { StockMovementModel, initStockMovementModel } from './stock-movement.model';
import { FileModel, initFileModel } from './file.model';
import { ProductImageModel, initProductImageModel } from './product-image.model';

// Re-export TokenType for convenience
export { TokenType } from './auth-session.model';

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
  readonly Brand: typeof BrandModel;
  readonly StockItem: typeof StockItemModel;
  readonly StockItemBrand: typeof StockItemBrandModel;
  readonly ProductStockItem: typeof ProductStockItemModel;
  readonly StockMovement: typeof StockMovementModel;
  readonly File: typeof FileModel;
  readonly ProductImage: typeof ProductImageModel;
} => {
  // Initialize all models
  const Product = initProductModel(sequelize);
  const Order = initOrderModel(sequelize);
  const OrderItem = initOrderItemModel(sequelize);
  const Payment = initPaymentModel(sequelize);
  const User = initUserModel(sequelize);
  const AuthSession = initAuthSessionModel(sequelize);
  const Brand = initBrandModel(sequelize);
  const StockItem = initStockItemModel(sequelize);
  const StockItemBrand = initStockItemBrandModel(sequelize);
  const ProductStockItem = initProductStockItemModel(sequelize);
  const StockMovement = initStockMovementModel(sequelize);
  const File = initFileModel(sequelize);
  const ProductImage = initProductImageModel(sequelize);

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

  // Stock management associations

  // StockItem associations
  StockItem.hasMany(StockItemBrand, {
    foreignKey: 'stockItemId',
    as: 'brands',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  StockItem.hasMany(ProductStockItem, {
    foreignKey: 'stockItemId',
    as: 'productStockItems',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  StockItem.hasMany(StockMovement, {
    foreignKey: 'stockItemId',
    as: 'movements',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  // Brand associations
  Brand.hasMany(StockItemBrand, {
    foreignKey: 'brandId',
    as: 'stockItemBrands',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  Brand.hasMany(ProductStockItem, {
    foreignKey: 'preferredBrandId',
    as: 'preferredProductStockItems',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // StockItemBrand associations
  StockItemBrand.belongsTo(StockItem, {
    foreignKey: 'stockItemId',
    as: 'stockItem',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  StockItemBrand.belongsTo(Brand, {
    foreignKey: 'brandId',
    as: 'brand',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  // Product associations (stock-related)
  Product.hasMany(ProductStockItem, {
    foreignKey: 'productId',
    as: 'stockItems',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // ProductStockItem associations
  ProductStockItem.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  ProductStockItem.belongsTo(StockItem, {
    foreignKey: 'stockItemId',
    as: 'stockItem',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  ProductStockItem.belongsTo(Brand, {
    foreignKey: 'preferredBrandId',
    as: 'preferredBrand',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // StockMovement associations
  StockMovement.belongsTo(StockItem, {
    foreignKey: 'stockItemId',
    as: 'stockItem',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  StockMovement.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  // User associations (stock-related)
  User.hasMany(StockMovement, {
    foreignKey: 'userId',
    as: 'stockMovements',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  // File associations
  File.belongsTo(User, {
    foreignKey: 'uploadedBy',
    as: 'uploader',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  User.hasMany(File, {
    foreignKey: 'uploadedBy',
    as: 'uploadedFiles',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  // Product-File association (image)
  Product.belongsTo(File, {
    foreignKey: 'imageFileId',
    as: 'imageFile',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  File.hasMany(Product, {
    foreignKey: 'imageFileId',
    as: 'products',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // Brand-File association (image/logo)
  Brand.belongsTo(File, {
    foreignKey: 'imageFileId',
    as: 'imageFile',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  File.hasMany(Brand, {
    foreignKey: 'imageFileId',
    as: 'brands',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // ProductImage associations (many-to-many between Product and File)
  Product.hasMany(ProductImage, {
    foreignKey: 'productId',
    as: 'images',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  ProductImage.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  ProductImage.belongsTo(File, {
    foreignKey: 'fileId',
    as: 'file',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  File.hasMany(ProductImage, {
    foreignKey: 'fileId',
    as: 'productImages',
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
    Brand,
    StockItem,
    StockItemBrand,
    ProductStockItem,
    StockMovement,
    File,
    ProductImage,
  };
};

// Export model classes for type checking
export {
  ProductModel,
  OrderModel,
  OrderItemModel,
  PaymentModel,
  UserModel,
  AuthSessionModel,
  BrandModel,
  StockItemModel,
  StockItemBrandModel,
  ProductStockItemModel,
  StockMovementModel,
  FileModel,
  ProductImageModel,
};
