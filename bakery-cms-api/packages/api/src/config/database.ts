/**
 * Database connection initialization
 * Initializes Sequelize with models and associations
 */

import { Sequelize } from 'sequelize';
import { getSequelizeInstance, initializeModels } from '@bakery-cms/database';
import { getEnvConfig } from './env';

/**
 * Database models type
 */
export type DatabaseModels = ReturnType<typeof initializeModels>;

/**
 * Singleton instances
 */
let sequelizeInstance: Sequelize | null = null;
let modelsInstance: DatabaseModels | null = null;

/**
 * Initialize database connection and models
 * Pure function that sets up Sequelize and returns models
 */
export const initializeDatabase = async (): Promise<DatabaseModels> => {
  const config = getEnvConfig();
  
  // Get Sequelize instance
  const sequelize = getSequelizeInstance();
  sequelizeInstance = sequelize;
  
  // Initialize models with associations
  const models = initializeModels(sequelize);
  modelsInstance = models;
  
  // Test connection
  try {
    await sequelize.authenticate();
    console.log(`[Database] Connection established successfully (${config.NODE_ENV})`);
  } catch (error) {
    console.error('[Database] Unable to connect:', error);
    throw error;
  }
  
  // Sync models in development (for testing only)
  if (config.NODE_ENV === 'development') {
    console.log('[Database] Models synchronized');
  }
  
  return models;
};

/**
 * Get database models instance
 * Returns cached models or throws error if not initialized
 */
export const getDatabaseModels = (): DatabaseModels => {
  if (!modelsInstance) {
    throw new Error('Database models not initialized. Call initializeDatabase() first.');
  }
  return modelsInstance;
};

/**
 * Get Sequelize instance
 * Returns cached instance or throws error if not initialized
 */
export const getDatabaseConnection = (): Sequelize => {
  if (!sequelizeInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return sequelizeInstance;
};

/**
 * Close database connection gracefully
 */
export const closeDatabaseConnection = async (): Promise<void> => {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    sequelizeInstance = null;
    modelsInstance = null;
    console.log('[Database] Connection closed');
  }
};
