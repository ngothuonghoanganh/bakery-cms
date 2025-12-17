/**
 * Structured logging utility using Winston
 * Provides consistent logging across the application
 */

import winston from 'winston';
import { getEnvConfig } from '../config/env';

/**
 * Log levels type
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

/**
 * Log metadata type
 */
export type LogMetadata = {
  readonly [key: string]: unknown;
};

/**
 * Logger interface
 */
export type Logger = {
  readonly error: (message: string, meta?: LogMetadata) => void;
  readonly warn: (message: string, meta?: LogMetadata) => void;
  readonly info: (message: string, meta?: LogMetadata) => void;
  readonly http: (message: string, meta?: LogMetadata) => void;
  readonly debug: (message: string, meta?: LogMetadata) => void;
};

/**
 * Create Winston logger instance
 * Pure function that returns configured logger
 */
const createWinstonLogger = (): winston.Logger => {
  const config = getEnvConfig();
  
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );
  
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
  );
  
  return winston.createLogger({
    level: config.LOG_LEVEL,
    format: logFormat,
    transports: [
      // Console transport
      new winston.transports.Console({
        format: config.NODE_ENV === 'development' ? consoleFormat : logFormat,
      }),
      // File transport for errors
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
      }),
      // File transport for all logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      }),
    ],
  });
};

/**
 * Singleton Winston logger instance
 */
let winstonLogger: winston.Logger | null = null;

/**
 * Get Winston logger instance
 */
const getWinstonLogger = (): winston.Logger => {
  if (!winstonLogger) {
    winstonLogger = createWinstonLogger();
  }
  return winstonLogger;
};

/**
 * Create application logger
 * Returns functional logger interface
 */
export const createLogger = (): Logger => {
  const logger = getWinstonLogger();
  
  return {
    error: (message: string, meta?: LogMetadata): void => {
      logger.error(message, meta);
    },
    warn: (message: string, meta?: LogMetadata): void => {
      logger.warn(message, meta);
    },
    info: (message: string, meta?: LogMetadata): void => {
      logger.info(message, meta);
    },
    http: (message: string, meta?: LogMetadata): void => {
      logger.http(message, meta);
    },
    debug: (message: string, meta?: LogMetadata): void => {
      logger.debug(message, meta);
    },
  };
};

/**
 * Singleton logger instance
 */
let loggerInstance: Logger | null = null;

/**
 * Get application logger
 */
export const getLogger = (): Logger => {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
};
