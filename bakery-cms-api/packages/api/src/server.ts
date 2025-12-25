/**
 * Server entry point
 * Initializes and starts the Express server
 */

import { createApp } from './app';
import { getAppConfig } from './config/app';
import { getLogger } from './utils/logger';
import { initializeDatabase, closeDatabaseConnection } from './config/database';

/**
 * Start the server
 * Initializes database and starts listening for requests
 */
const startServer = async (): Promise<void> => {
  const logger = getLogger();
  const config = getAppConfig();
  
  try {
    // Log startup
    logger.info('Starting Bakery CMS API', {
      environment: config.isDevelopment ? 'development' : config.isProduction ? 'production' : 'test',
      port: config.port,
      apiVersion: config.apiVersion,
    });
    
    // Initialize database
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('Database initialized successfully');
    
    // Create Express app
    const app = createApp();
    
    // Start listening
    const server = app.listen(config.port, config.host, () => {
      logger.info(`Server is running`, {
        url: `http://${config.host}:${config.port}`,
        apiPrefix: config.apiPrefix,
        apiVersion: config.apiVersion,
      });
    });
    
    // Graceful shutdown handling
    const shutdownSignals: readonly NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
    
    shutdownSignals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        
        // Stop accepting new connections
        server.close(async () => {
          logger.info('HTTP server closed');
          
          // Close database connection
          try {
            await closeDatabaseConnection();
            logger.info('Database connection closed');
            process.exit(0);
          } catch (error) {
            logger.error('Error closing database connection', { error });
            process.exit(1);
          }
        });
        
        // Force shutdown after timeout
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000); // 10 seconds
      });
    });
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

// Start the server
startServer();
