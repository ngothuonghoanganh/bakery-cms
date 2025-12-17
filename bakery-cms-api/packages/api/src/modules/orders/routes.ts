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
   */
  router.get(
    '/',
    validateQuery(orderListQuerySchema),
    handlers.handleGetAllOrders
  );

  /**
   * GET /api/orders/:id
   * Get order by ID
   */
  router.get(
    '/:id',
    validateParams(orderIdParamSchema),
    handlers.handleGetOrder
  );

  /**
   * POST /api/orders
   * Create new order
   */
  router.post(
    '/',
    validateBody(createOrderSchema),
    handlers.handleCreateOrder
  );

  /**
   * PATCH /api/orders/:id
   * Update order by ID
   */
  router.patch(
    '/:id',
    validateParams(orderIdParamSchema),
    validateBody(updateOrderSchema),
    handlers.handleUpdateOrder
  );

  /**
   * POST /api/orders/:id/confirm
   * Confirm order
   */
  router.post(
    '/:id/confirm',
    validateParams(orderIdParamSchema),
    validateBody(confirmOrderSchema),
    handlers.handleConfirmOrder
  );

  /**
   * POST /api/orders/:id/cancel
   * Cancel order
   */
  router.post(
    '/:id/cancel',
    validateParams(orderIdParamSchema),
    validateBody(cancelOrderSchema),
    handlers.handleCancelOrder
  );

  /**
   * DELETE /api/orders/:id
   * Delete order by ID
   */
  router.delete(
    '/:id',
    validateParams(orderIdParamSchema),
    handlers.handleDeleteOrder
  );

  return router;
};
