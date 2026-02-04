/**
 * Product routes
 * Express router configuration for products endpoints
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../config/database';
import { createProductRepository } from './repositories/products.repositories';
import { createProductService } from './services/products.services';
import { createProductHandlers } from './handlers/products.handlers';
import { createProductImageRepository } from './repositories/product-images.repositories';
import { createProductImageService } from './services/product-images.services';
import { createProductImageHandlers } from './handlers/product-images.handlers';
import { createFileRepository } from '../files/repositories/files.repositories';
import { createFileService } from '../files/services/files.services';
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

  // Create repositories
  const repository = createProductRepository(models.Product);
  const fileRepository = createFileRepository(models.File);
  const productImageRepository = createProductImageRepository(models.ProductImage);

  // Create file service for cleanup operations
  const fileService = createFileService(fileRepository);

  // Create product service and handlers (dependency injection)
  const service = createProductService({ repository, fileService, productImageRepository });
  const handlers = createProductHandlers(service);

  // Create product images service and handlers
  const productImageService = createProductImageService({
    repository: productImageRepository,
    fileRepository,
  });
  const productImageHandlers = createProductImageHandlers(productImageService);

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

  // ==================== Product Images Routes ====================

  /**
   * GET /api/products/:productId/images
   * Get all images for a product
   * Public access
   */
  router.get(
    '/:productId/images',
    productImageHandlers.getProductImages as any
  );

  /**
   * POST /api/products/:productId/images
   * Add an image to a product
   * Requires: Seller role or higher
   */
  router.post(
    '/:productId/images',
    authenticateJWT as any,
    requireSeller as any,
    productImageHandlers.addProductImage as any
  );

  /**
   * PATCH /api/products/:productId/images/:imageId
   * Update a product image
   * Requires: Seller role or higher
   */
  router.patch(
    '/:productId/images/:imageId',
    authenticateJWT as any,
    requireSeller as any,
    productImageHandlers.updateProductImage as any
  );

  /**
   * DELETE /api/products/:productId/images/:imageId
   * Delete a product image
   * Requires: Seller role or higher
   */
  router.delete(
    '/:productId/images/:imageId',
    authenticateJWT as any,
    requireSeller as any,
    productImageHandlers.deleteProductImage as any
  );

  /**
   * PUT /api/products/:productId/images/:imageId/primary
   * Set an image as primary
   * Requires: Seller role or higher
   */
  router.put(
    '/:productId/images/:imageId/primary',
    authenticateJWT as any,
    requireSeller as any,
    productImageHandlers.setPrimaryImage as any
  );

  /**
   * PUT /api/products/:productId/images/reorder
   * Reorder product images
   * Requires: Seller role or higher
   */
  router.put(
    '/:productId/images/reorder',
    authenticateJWT as any,
    requireSeller as any,
    productImageHandlers.reorderImages as any
  );

  return router;
};
