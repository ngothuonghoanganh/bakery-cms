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
   */
  router.get(
    '/',
    validateQuery(productListQuerySchema),
    handlers.handleGetAllProducts
  );

  /**
   * GET /api/products/:id
   * Get product by ID
   */
  router.get(
    '/:id',
    validateParams(productIdParamSchema),
    handlers.handleGetProduct
  );

  /**
   * POST /api/products
   * Create new product
   */
  router.post(
    '/',
    validateBody(createProductSchema),
    handlers.handleCreateProduct
  );

  /**
   * PATCH /api/products/:id
   * Update product by ID
   */
  router.patch(
    '/:id',
    validateParams(productIdParamSchema),
    validateBody(updateProductSchema),
    handlers.handleUpdateProduct
  );

  /**
   * DELETE /api/products/:id
   * Delete product by ID
   */
  router.delete(
    '/:id',
    validateParams(productIdParamSchema),
    handlers.handleDeleteProduct
  );

  return router;
};
