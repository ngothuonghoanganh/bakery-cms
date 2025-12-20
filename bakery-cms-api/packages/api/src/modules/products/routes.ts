/**
 * Product routes
 * Express router configuration for products endpoints
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../config/database';
import { createProductRepository } from './repositories/products.repositories';
import { createProductService } from './services/products.services';
import { createProductHandlers } from './handlers/products.handlers';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { authenticateJWT } from '../../middleware';
import { requireManager, requireSeller } from '../../middleware/rbac.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productListQuerySchema,
} from './validators/products.validators';

/**
 * Create products router
 * Pure function that returns configured Express router
 */
export const createProductsRouter = (): Router => {
  const router = Router();
  // Get database models
  const models = getDatabaseModels();

  // Create repository, service, and handlers (dependency injection)
  const repository = createProductRepository(models.Product);
  const service = createProductService(repository);
  const handlers = createProductHandlers(service);

  /**
   * GET /api/products
   * Get all products with filtering and pagination
   * Public access - no authentication required
   */
  router.get(
    '/',
    validateQuery(productListQuerySchema),
    handlers.handleGetAllProducts as any
  );

  /**
   * GET /api/products/:id
   * Get product by ID
   * Public access - no authentication required
   */
  router.get(
    '/:id',
    validateParams(productIdParamSchema),
    handlers.handleGetProduct as any
  );

  /**
   * POST /api/products
   * Create new product
   * Requires: Manager or Seller role
   */
  router.post(
    '/',
    authenticateJWT as any,
    requireSeller as any,
    validateBody(createProductSchema),
    handlers.handleCreateProduct as any
  );

  /**
   * PATCH /api/products/:id
   * Update product by ID
   * Requires: Manager or Seller role (sellers can only update own products)
   */
  router.patch(
    '/:id',
    authenticateJWT as any,
    requireSeller as any,
    validateParams(productIdParamSchema),
    validateBody(updateProductSchema),
    handlers.handleUpdateProduct as any
  );

  /**
   * DELETE /api/products/:id
   * Delete product by ID
   * Requires: Manager role or higher
   */
  router.delete(
    '/:id',
    authenticateJWT as any,
    requireManager as any,
    validateParams(productIdParamSchema),
    handlers.handleDeleteProduct as any
  );

  return router;
};
