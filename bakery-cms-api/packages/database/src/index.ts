/**
 * Database package entry point
 * Exports database configuration, models, and initialization functions
 */

export {
  getDatabaseConfig,
  createSequelizeInstance,
  getSequelizeInstance,
  testConnection,
  closeConnection,
} from './config/database.config';

export {
  initializeModels,
  ProductModel,
  OrderModel,
  OrderItemModel,
  PaymentModel,
} from './models';
