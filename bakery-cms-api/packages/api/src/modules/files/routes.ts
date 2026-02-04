/**
 * File routes
 * Express router configuration for files endpoints
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../config/database';
import { createFileRepository } from './repositories/files.repositories';
import { createFileService } from './services/files.services';
import { createFileHandlers } from './handlers/files.handlers';
import { validateParams, validateQuery } from '../../middleware/validation';
import { authenticateJWT } from '../../middleware';
import { requireSeller } from '../../middleware/rbac.middleware';
import { uploadSingle } from './middleware/multer.middleware';
import {
  fileIdParamSchema,
  fileListQuerySchema,
  downloadQuerySchema,
} from './validators/files.validators';

/**
 * Create files router
 * Pure function that returns configured Express router
 */
export const createFilesRouter = (): Router => {
  const router = Router();

  // Get database models
  const models = getDatabaseModels();

  // Create repository, service, and handlers (dependency injection)
  const repository = createFileRepository(models.File);
  const service = createFileService(repository);
  const handlers = createFileHandlers(service);

  /**
   * POST /api/files/upload
   * Upload a new file
   * Requires: Seller role or higher (authenticated)
   */
  router.post(
    '/upload',
    authenticateJWT as any,
    requireSeller as any,
    uploadSingle() as any,
    handlers.handleUploadFile as any
  );

  /**
   * GET /api/files
   * Get all files with filtering and pagination
   * Requires: Seller role or higher (authenticated)
   */
  router.get(
    '/',
    authenticateJWT as any,
    requireSeller as any,
    validateQuery(fileListQuerySchema),
    handlers.handleGetAllFiles as any
  );

  /**
   * GET /api/files/:id
   * Get file metadata by ID
   * Requires: Seller role or higher (authenticated)
   */
  router.get(
    '/:id',
    authenticateJWT as any,
    requireSeller as any,
    validateParams(fileIdParamSchema),
    handlers.handleGetFile as any
  );

  /**
   * GET /api/files/:id/download
   * Download/view file content
   * Public access with caching support
   */
  router.get(
    '/:id/download',
    validateParams(fileIdParamSchema),
    validateQuery(downloadQuerySchema),
    handlers.handleDownloadFile as any
  );

  /**
   * DELETE /api/files/:id
   * Delete file by ID
   * Requires: Seller role or higher (authenticated)
   */
  router.delete(
    '/:id',
    authenticateJWT as any,
    requireSeller as any,
    validateParams(fileIdParamSchema),
    handlers.handleDeleteFile as any
  );

  return router;
};
