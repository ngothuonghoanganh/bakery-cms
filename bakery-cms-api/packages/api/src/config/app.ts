/**
 * Application configuration
 * Centralized configuration for the API server
 */

import { getEnvConfig } from './env';

/**
 * Application configuration type
 */
export type AppConfig = {
  readonly port: number;
  readonly host: string;
  readonly apiPrefix: string;
  readonly apiVersion: string;
  readonly corsOrigin: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly isTest: boolean;
  readonly rateLimitWindow: number;
  readonly rateLimitMax: number;
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
};

/**
 * Load application configuration from environment
 * Pure function that returns application configuration
 */
export const loadAppConfig = (): AppConfig => {
  const envConfig = getEnvConfig();
  
  return {
    port: envConfig.PORT,
    host: envConfig.HOST,
    apiPrefix: envConfig.API_PREFIX,
    apiVersion: envConfig.API_VERSION,
    corsOrigin: envConfig.CORS_ORIGIN,
    isDevelopment: envConfig.NODE_ENV === 'development',
    isProduction: envConfig.NODE_ENV === 'production',
    isTest: envConfig.NODE_ENV === 'test',
    rateLimitWindow: envConfig.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: envConfig.RATE_LIMIT_MAX_REQUESTS,
    jwtSecret: envConfig.JWT_SECRET,
    jwtExpiresIn: envConfig.JWT_EXPIRES_IN,
  };
};

/**
 * Singleton instance of application configuration
 */
let appConfig: AppConfig | null = null;

/**
 * Get application configuration
 * Loads and caches configuration on first call
 */
export const getAppConfig = (): AppConfig => {
  if (!appConfig) {
    appConfig = loadAppConfig();
  }
  return appConfig;
};

/**
 * Get full API base URL
 */
export const getApiBaseUrl = (): string => {
  const config = getAppConfig();
  return `${config.apiPrefix}/${config.apiVersion}`;
};
