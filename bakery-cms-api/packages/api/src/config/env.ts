/**
 * Environment variable validation and configuration
 * Validates required environment variables at startup
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root (monorepo root)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/**
 * Environment configuration type
 */
export type EnvConfig = {
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly PORT: number;
  readonly HOST: string;
  readonly DB_HOST: string;
  readonly DB_PORT: number;
  readonly DB_NAME: string;
  readonly DB_USERNAME: string;
  readonly DB_PASSWORD: string;
  readonly DB_SSL: boolean;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRES_IN: string;
  readonly API_VERSION: string;
  readonly API_PREFIX: string;
  readonly CORS_ORIGIN: string;
  readonly RATE_LIMIT_WINDOW_MS: number;
  readonly RATE_LIMIT_MAX_REQUESTS: number;
  readonly LOG_LEVEL: string;
  readonly BASE_URL: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly FACEBOOK_CLIENT_ID: string;
  readonly FACEBOOK_CLIENT_SECRET: string;
  readonly UPLOAD_DIR: string;
  readonly MAX_IMAGE_SIZE: number;
  readonly MAX_VIDEO_SIZE: number;
};

/**
 * Get required environment variable
 * Throws error if variable is not set
 */
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

/**
 * Get optional environment variable with default value
 */
const getOptionalEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

/**
 * Parse integer from environment variable
 */
const parseIntEnv = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

/**
 * Parse boolean from environment variable
 */
const parseBoolEnv = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

/**
 * Validate and load environment configuration
 * Pure function that returns validated configuration
 */
export const loadEnvConfig = (): EnvConfig => {
  const nodeEnv = getOptionalEnv('NODE_ENV', 'development');
  
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, production, or test');
  }

  return {
    NODE_ENV: nodeEnv as 'development' | 'production' | 'test',
    PORT: parseIntEnv('PORT', 3000),
    HOST: getOptionalEnv('HOST', 'localhost'),
    DB_HOST: getRequiredEnv('DB_HOST'),
    DB_PORT: parseIntEnv('DB_PORT', 3306),
    DB_NAME: getRequiredEnv('DB_NAME'),
    DB_USERNAME: getRequiredEnv('DB_USERNAME'),
    DB_PASSWORD: getRequiredEnv('DB_PASSWORD'),
    DB_SSL: parseBoolEnv('DB_SSL', false),
    JWT_SECRET: getRequiredEnv('JWT_SECRET'),
    JWT_EXPIRES_IN: getOptionalEnv('JWT_EXPIRES_IN', '7d'),
    API_VERSION: getOptionalEnv('API_VERSION', 'v1'),
    API_PREFIX: getOptionalEnv('API_PREFIX', '/api'),
    CORS_ORIGIN: getOptionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
    RATE_LIMIT_WINDOW_MS: parseIntEnv('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseIntEnv('RATE_LIMIT_MAX_REQUESTS', 100),
    LOG_LEVEL: getOptionalEnv('LOG_LEVEL', 'info'),
    BASE_URL: getOptionalEnv('BASE_URL', `http://localhost:${parseIntEnv('PORT', 3000)}`),
    GOOGLE_CLIENT_ID: getOptionalEnv('GOOGLE_CLIENT_ID', ''),
    GOOGLE_CLIENT_SECRET: getOptionalEnv('GOOGLE_CLIENT_SECRET', ''),
    FACEBOOK_CLIENT_ID: getOptionalEnv('FACEBOOK_CLIENT_ID', ''),
    FACEBOOK_CLIENT_SECRET: getOptionalEnv('FACEBOOK_CLIENT_SECRET', ''),
    UPLOAD_DIR: getOptionalEnv('UPLOAD_DIR', './uploads'),
    MAX_IMAGE_SIZE: parseIntEnv('MAX_IMAGE_SIZE', 10 * 1024 * 1024), // 10MB
    MAX_VIDEO_SIZE: parseIntEnv('MAX_VIDEO_SIZE', 100 * 1024 * 1024), // 100MB
  };
};

/**
 * Singleton instance of environment configuration
 */
let envConfig: EnvConfig | null = null;

/**
 * Get environment configuration
 * Loads and caches configuration on first call
 */
export const getEnvConfig = (): EnvConfig => {
  if (!envConfig) {
    envConfig = loadEnvConfig();
  }
  return envConfig;
};
