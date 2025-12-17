/**
 * Database configuration for Sequelize
 * Supports multiple environments with connection pooling
 */

import { Sequelize, Options } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Database configuration type
 */
type DatabaseConfig = {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly dialect: 'mysql';
  readonly dialectOptions?: {
    readonly ssl?: {
      readonly require: boolean;
      readonly rejectUnauthorized: boolean;
    };
  };
  readonly pool: {
    readonly max: number;
    readonly min: number;
    readonly acquire: number;
    readonly idle: number;
  };
  readonly logging: boolean | ((sql: string) => void);
};

/**
 * Get database configuration from environment variables
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  const baseConfig: DatabaseConfig = {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '3306', 10),
    database: process.env['DB_NAME'] || 'bakery_cms',
    username: process.env['DB_USERNAME'] || 'root',
    password: process.env['DB_PASSWORD'] || '',
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: process.env['NODE_ENV'] === 'development' ? console.log : false,
  };

  // Add SSL for cloud databases
  if (process.env['DB_SSL'] === 'true') {
    return {
      ...baseConfig,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    };
  }

  return baseConfig;
};

/**
 * Create and export Sequelize instance
 */
export const createSequelizeInstance = (): Sequelize => {
  const config = getDatabaseConfig();
  return new Sequelize(config as Options);
};

/**
 * Singleton instance
 */
let sequelizeInstance: Sequelize | null = null;

/**
 * Get or create Sequelize instance
 */
export const getSequelizeInstance = (): Sequelize => {
  if (!sequelizeInstance) {
    sequelizeInstance = createSequelizeInstance();
  }
  return sequelizeInstance;
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const sequelize = getSequelizeInstance();
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

/**
 * Close database connection
 */
export const closeConnection = async (): Promise<void> => {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    sequelizeInstance = null;
    console.log('Database connection closed.');
  }
};
