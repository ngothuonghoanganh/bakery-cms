/**
 * Order routes
 * Express router configuration for orders endpoints
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../config/database';
import { createOrderRepository } from './repositories/orders.repositories';
import { createOrderService } from './services/orders.services';
import { createOrderHandlers } from './handlers/orders.handlers';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { authenticateJWT } from '../../middleware';
import { requireAuthenticated, requireStaff } from '../../middleware/rbac.middleware';
import {
  createOrderSchema,
  updateOrderSchema,
  orderIdParamSchema,
  orderListQuerySchema,
  confirmOrderSchema,
  cancelOrderSchema,
} from './validators/orders.validators';

/**
 * Create orders router
 * Pure function that returns configured Express router
 */
export const createOrdersRouter = (): Router => {
  const router = Router();

  // Get database models
  const models = getDatabaseModels();

  // Create repository, service, and handlers (dependency injection)
  const repository = createOrderRepository(models.Order, models.OrderItem);
  const service = createOrderService(repository);
  const handlers = createOrderHandlers(service);

  /**
   * GET /api/orders
   * Get all orders with filtering and pagination
   * Requires: Staff role or higher
   */
  router.get(
    '/',
    authenticateJWT as any,
    requireStaff as any,
    validateQuery(orderListQuerySchema),
    handlers.handleGetAllOrders as any
  );

  /**
   * GET /api/orders/:id
   * Get order by ID
   * Requires: Authenticated user (customers can only see own orders)
   */
  router.get(
    '/:id',
    authenticateJWT as any,
    requireAuthenticated as any,
    validateParams(orderIdParamSchema),
    handlers.handleGetOrder as any
  );

  /**
   * POST /api/orders
   * Create new order
   * Requires: Authenticated user
   */
  router.post(
    '/',
    authenticateJWT as any,
    requireAuthenticated as any,
    validateBody(createOrderSchema),
    handlers.handleCreateOrder as any
  );

  /**
   * PATCH /api/orders/:id
   * Update order by ID
   * Requires: Staff role or higher
   */
  router.patch(
    '/:id',
    authenticateJWT as any,
    requireStaff as any,
    validateParams(orderIdParamSchema),
    validateBody(updateOrderSchema),
    handlers.handleUpdateOrder as any
  );

  /**
   * POST /api/orders/:id/confirm
   * Confirm order
   * Requires: Staff role or higher
   */
  router.post(
    '/:id/confirm',
    authenticateJWT as any,
    requireStaff as any,
    validateParams(orderIdParamSchema),
    validateBody(confirmOrderSchema),
    handlers.handleConfirmOrder as any
  );

  /**
   * POST /api/orders/:id/cancel
   * Cancel order
   * Requires: Authenticated user
   */
  router.post(
    '/:id/cancel',
    authenticateJWT as any,
    requireAuthenticated as any,
    validateParams(orderIdParamSchema),
    validateBody(cancelOrderSchema),
    handlers.handleCancelOrder as any
  );

  /**
   * DELETE /api/orders/:id
   * Delete order by ID
   * Requires: Staff role or higher
   */
  router.delete(
    '/:id',
    authenticateJWT as any,
    requireStaff as any,
    validateParams(orderIdParamSchema),
    handlers.handleDeleteOrder as any
  );

  return router;
};
