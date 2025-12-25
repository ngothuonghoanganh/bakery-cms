/**
 * Stock routes
 * Express router configuration for stock management endpoints
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../config/database';
import { createStockItemRepository } from './repositories/stock-items.repositories';
import { createStockItemService } from './services/stock-items.services';
import { createStockItemHandlers } from './handlers/stock-items.handlers';
import { createBrandRepository } from './repositories/brands.repositories';
import { createStockItemBrandRepository } from './repositories/stock-item-brands.repositories';
import { createBrandService } from './services/brands.services';
import { createBrandHandlers } from './handlers/brands.handlers';
import { createProductStockItemRepository } from './repositories/product-stock-items.repositories';
import { createProductStockService } from './services/product-stock.services';
import { createProductStockHandlers } from './handlers/product-stock.handlers';
import { createStockMovementRepository } from './repositories/stock-movements.repositories';
import { createStockMovementService } from './services/stock-movements.services';
import { createStockMovementHandlers } from './handlers/stock-movements.handlers';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { authenticateJWT } from '../../middleware';
import { requireManager } from '../../middleware/rbac.middleware';
import {
  createStockItemSchema,
  updateStockItemSchema,
  stockItemIdParamSchema,
  stockItemListQuerySchema,
  receiveStockSchema,
  adjustStockSchema,
} from './validators/stock-items.validators';
import {
  createBrandSchema,
  updateBrandSchema,
  brandIdParamSchema,
  brandListQuerySchema,
  addBrandToStockItemSchema,
  updateStockItemBrandSchema,
} from './validators/brands.validators';
import {
  addStockItemToProductSchema,
  updateProductStockItemSchema,
  productIdParamSchema,
  stockItemIdParamSchema as productStockItemIdParamSchema,
} from './validators/product-stock.validators';
import {
  stockMovementIdParamSchema,
  stockMovementListQuerySchema,
} from './validators/stock-movements.validators';

/**
 * Create stock router
 * Pure function that returns configured Express router
 */
export const createStockRouter = (): Router => {
  const router = Router();

  // Get database models
  const models = getDatabaseModels();

  // Create stock movements repository (needed by stock items service)
  const stockMovementRepository = createStockMovementRepository(models.StockMovement);

  // Create stock items repository, service, and handlers (dependency injection)
  const stockItemRepository = createStockItemRepository(models.StockItem);
  const stockItemService = createStockItemService(stockItemRepository, stockMovementRepository);
  const stockItemHandlers = createStockItemHandlers(stockItemService);

  // Create brands repositories, service, and handlers (dependency injection)
  const brandRepository = createBrandRepository(models.Brand);
  const stockItemBrandRepository = createStockItemBrandRepository(
    models.StockItemBrand,
    models.Brand
  );
  const brandService = createBrandService(brandRepository, stockItemBrandRepository);
  const brandHandlers = createBrandHandlers(brandService);

  // Create product-stock repositories, service, and handlers (dependency injection)
  const productStockItemRepository = createProductStockItemRepository(
    models.ProductStockItem
  );
  const productStockService = createProductStockService(
    productStockItemRepository,
    stockItemRepository,
    stockItemBrandRepository
  );
  const productStockHandlers = createProductStockHandlers(productStockService);

  // Create stock movements service and handlers (reusing repository from above)
  const stockMovementService = createStockMovementService(stockMovementRepository);
  const stockMovementHandlers = createStockMovementHandlers(stockMovementService);

  /**
   * Stock Items Routes
   */

  /**
   * GET /api/stock/stock-items
   * Get all stock items with filtering and pagination
   * Requires: Manager role or higher
   */
  router.get(
    '/stock-items',
    authenticateJWT as any,
    requireManager as any,
    validateQuery(stockItemListQuerySchema),
    stockItemHandlers.handleGetAllStockItems as any
  );

  /**
   * GET /api/stock/stock-items/:id
   * Get stock item by ID
   * Requires: Manager role or higher
   */
  router.get(
    '/stock-items/:id',
    authenticateJWT as any,
    requireManager as any,
    validateParams(stockItemIdParamSchema),
    stockItemHandlers.handleGetStockItem as any
  );

  /**
   * POST /api/stock/stock-items
   * Create new stock item
   * Requires: Manager role or higher
   */
  router.post(
    '/stock-items',
    authenticateJWT as any,
    requireManager as any,
    validateBody(createStockItemSchema),
    stockItemHandlers.handleCreateStockItem as any
  );

  /**
   * PATCH /api/stock/stock-items/:id
   * Update stock item by ID
   * Requires: Manager role or higher
   */
  router.patch(
    '/stock-items/:id',
    authenticateJWT as any,
    requireManager as any,
    validateParams(stockItemIdParamSchema),
    validateBody(updateStockItemSchema),
    stockItemHandlers.handleUpdateStockItem as any
  );

  /**
   * DELETE /api/stock/stock-items/:id
   * Soft delete stock item by ID
   * Requires: Manager role or higher
   */
  router.delete(
    '/stock-items/:id',
    authenticateJWT as any,
    requireManager as any,
    validateParams(stockItemIdParamSchema),
    stockItemHandlers.handleDeleteStockItem as any
  );

  /**
   * POST /api/stock/stock-items/:id/restore
   * Restore soft-deleted stock item by ID
   * Requires: Manager role or higher
   */
  router.post(
    '/stock-items/:id/restore',
    authenticateJWT as any,
    requireManager as any,
    validateParams(stockItemIdParamSchema),
    stockItemHandlers.handleRestoreStockItem as any
  );

  /**
   * POST /api/stock/stock-items/:id/receive
   * Receive stock (add to inventory)
   * Requires: Manager role or higher
   */
  router.post(
    '/stock-items/:id/receive',
    authenticateJWT as any,
    requireManager as any,
    validateParams(stockItemIdParamSchema),
    validateBody(receiveStockSchema),
    stockItemHandlers.handleReceiveStock as any
  );

  /**
   * POST /api/stock/stock-items/:id/adjust
   * Adjust stock quantity
   * Requires: Manager role or higher
   */
  router.post(
    '/stock-items/:id/adjust',
    authenticateJWT as any,
    requireManager as any,
    validateParams(stockItemIdParamSchema),
    validateBody(adjustStockSchema),
    stockItemHandlers.handleAdjustStock as any
  );

  /**
   * Brands Routes
   */

  /**
   * GET /api/stock/brands
   * Get all brands with filtering and pagination
   * Requires: Manager role or higher
   */
  router.get(
    '/brands',
    authenticateJWT as any,
    requireManager as any,
    validateQuery(brandListQuerySchema),
    brandHandlers.handleGetAllBrands as any
  );

  /**
   * GET /api/stock/brands/:id
   * Get brand by ID
   * Requires: Manager role or higher
   */
  router.get(
    '/brands/:id',
    authenticateJWT as any,
    requireManager as any,
    validateParams(brandIdParamSchema),
    brandHandlers.handleGetBrand as any
  );

  /**
   * POST /api/stock/brands
   * Create new brand
   * Requires: Manager role or higher
   */
  router.post(
    '/brands',
    authenticateJWT as any,
    requireManager as any,
    validateBody(createBrandSchema),
    brandHandlers.handleCreateBrand as any
  );

  /**
   * PATCH /api/stock/brands/:id
   * Update brand by ID
   * Requires: Manager role or higher
   */
  router.patch(
    '/brands/:id',
    authenticateJWT as any,
    requireManager as any,
    validateParams(brandIdParamSchema),
    validateBody(updateBrandSchema),
    brandHandlers.handleUpdateBrand as any
  );

  /**
   * DELETE /api/stock/brands/:id
   * Soft delete brand by ID
   * Requires: Manager role or higher
   */
  router.delete(
    '/brands/:id',
    authenticateJWT as any,
    requireManager as any,
    validateParams(brandIdParamSchema),
    brandHandlers.handleDeleteBrand as any
  );

  /**
   * POST /api/stock/brands/:id/restore
   * Restore soft-deleted brand by ID
   * Requires: Manager role or higher
   */
  router.post(
    '/brands/:id/restore',
    authenticateJWT as any,
    requireManager as any,
    validateParams(brandIdParamSchema),
    brandHandlers.handleRestoreBrand as any
  );

  /**
   * Stock Item Brands Routes (Pricing Association)
   */

  /**
   * GET /api/stock/stock-items/:stockItemId/brands
   * Get all brands associated with a stock item
   * Requires: Manager role or higher
   */
  router.get(
    '/stock-items/:stockItemId/brands',
    authenticateJWT as any,
    requireManager as any,
    brandHandlers.handleGetStockItemBrands as any
  );

  /**
   * POST /api/stock/stock-items/:stockItemId/brands
   * Add brand to stock item with pricing
   * Requires: Manager role or higher
   */
  router.post(
    '/stock-items/:stockItemId/brands',
    authenticateJWT as any,
    requireManager as any,
    validateBody(addBrandToStockItemSchema),
    brandHandlers.handleAddBrandToStockItem as any
  );

  /**
   * PATCH /api/stock/stock-items/:stockItemId/brands/:brandId
   * Update stock item brand pricing
   * Requires: Manager role or higher
   */
  router.patch(
    '/stock-items/:stockItemId/brands/:brandId',
    authenticateJWT as any,
    requireManager as any,
    validateBody(updateStockItemBrandSchema),
    brandHandlers.handleUpdateStockItemBrand as any
  );

  /**
   * DELETE /api/stock/stock-items/:stockItemId/brands/:brandId
   * Remove brand from stock item
   * Requires: Manager role or higher
   */
  router.delete(
    '/stock-items/:stockItemId/brands/:brandId',
    authenticateJWT as any,
    requireManager as any,
    brandHandlers.handleRemoveBrandFromStockItem as any
  );

  /**
   * POST /api/stock/stock-items/:stockItemId/brands/:brandId/set-preferred
   * Set preferred brand for stock item
   * Requires: Manager role or higher
   */
  router.post(
    '/stock-items/:stockItemId/brands/:brandId/set-preferred',
    authenticateJWT as any,
    requireManager as any,
    brandHandlers.handleSetPreferredBrand as any
  );

  /**
   * Product Stock Items Routes (Recipe Management)
   */

  /**
   * GET /api/stock/products/:id/stock-items
   * Get product recipe (all stock items linked to product)
   * Requires: Manager role or higher
   */
  router.get(
    '/products/:id/stock-items',
    authenticateJWT as any,
    requireManager as any,
    validateParams(productIdParamSchema),
    productStockHandlers.handleGetProductRecipe as any
  );

  /**
   * POST /api/stock/products/:id/stock-items
   * Add stock item to product (add ingredient to recipe)
   * Requires: Manager role or higher
   */
  router.post(
    '/products/:id/stock-items',
    authenticateJWT as any,
    requireManager as any,
    validateParams(productIdParamSchema),
    validateBody(addStockItemToProductSchema),
    productStockHandlers.handleAddStockItemToProduct as any
  );

  /**
   * PATCH /api/stock/products/:id/stock-items/:stockItemId
   * Update product stock item (quantity, preferred brand, notes)
   * Requires: Manager role or higher
   */
  router.patch(
    '/products/:id/stock-items/:stockItemId',
    authenticateJWT as any,
    requireManager as any,
    validateParams(productIdParamSchema),
    validateParams(productStockItemIdParamSchema),
    validateBody(updateProductStockItemSchema),
    productStockHandlers.handleUpdateProductStockItem as any
  );

  /**
   * DELETE /api/stock/products/:id/stock-items/:stockItemId
   * Remove stock item from product (remove ingredient from recipe)
   * Requires: Manager role or higher
   */
  router.delete(
    '/products/:id/stock-items/:stockItemId',
    authenticateJWT as any,
    requireManager as any,
    validateParams(productIdParamSchema),
    validateParams(productStockItemIdParamSchema),
    productStockHandlers.handleRemoveStockItemFromProduct as any
  );

  /**
   * GET /api/stock/products/:id/cost
   * Calculate product cost based on recipe and brand prices
   * Requires: Manager role or higher
   */
  router.get(
    '/products/:id/cost',
    authenticateJWT as any,
    requireManager as any,
    validateParams(productIdParamSchema),
    productStockHandlers.handleGetProductCost as any
  );

  /**
   * GET /api/stock/stock-items/:id/deletion-protection
   * Check if stock item can be deleted (deletion protection)
   * Requires: Manager role or higher
   */
  router.get(
    '/stock-items/:id/deletion-protection',
    authenticateJWT as any,
    requireManager as any,
    validateParams(stockItemIdParamSchema),
    productStockHandlers.handleCheckStockItemDeletionProtection as any
  );

  /**
   * Stock Movements Routes (Audit Trail - Read Only)
   */

  /**
   * GET /api/stock/stock-movements
   * Get all stock movements with filtering and pagination
   * Requires: Manager role or higher
   */
  router.get(
    '/stock-movements',
    authenticateJWT as any,
    requireManager as any,
    validateQuery(stockMovementListQuerySchema),
    stockMovementHandlers.handleGetAllStockMovements as any
  );

  /**
   * GET /api/stock/stock-movements/:id
   * Get stock movement by ID
   * Requires: Manager role or higher
   */
  router.get(
    '/stock-movements/:id',
    authenticateJWT as any,
    requireManager as any,
    validateParams(stockMovementIdParamSchema),
    stockMovementHandlers.handleGetStockMovement as any
  );

  return router;
};
