/**
 * Express application setup
 * Configures middleware and routes
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getAppConfig } from './config/app';
import { getLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { createProductsRouter } from './modules/products/routes';
import { createOrdersRouter } from './modules/orders/routes';
import { createPaymentsRouter } from './modules/payments/routes';

/**
 * Create and configure Express application
 * Pure function that returns configured Express app
 */
export const createApp = (): Express => {
  const app = express();
  const config = getAppConfig();
  const logger = getLogger();
  
  // Security middleware
  app.use(helmet());
  
  // CORS middleware
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
  }));
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Rate limiting
  app.use(rateLimiter);
  
  // Request logging middleware
  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  
  // Get API base path with version
  const apiBasePath = `${config.apiPrefix}/${config.apiVersion}`;
  
  // API routes with version prefix
  app.use(`${apiBasePath}/products`, createProductsRouter());
  app.use(`${apiBasePath}/orders`, createOrdersRouter());
  app.use(`${apiBasePath}/payments`, createPaymentsRouter());
  
  // 404 handler
  app.use(notFoundHandler);
  
  // Global error handler (must be last)
  app.use(errorHandler);
  
  return app;
};
