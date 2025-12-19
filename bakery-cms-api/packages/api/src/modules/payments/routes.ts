/**
 * Payment routes
 * Express router configuration for payments endpoints
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../config/database';
import { createPaymentRepository } from './repositories/payments.repositories';
import { createPaymentService } from './services/payments.services';
import { createPaymentHandlers } from './handlers/payments.handlers';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { requireAuthenticated, requireStaff } from '../../middleware/rbac.middleware';
import {
  createPaymentSchema,
  paymentIdParamSchema,
  orderIdParamSchema,
  paymentListQuerySchema,
  markAsPaidSchema,
} from './validators/payments.validators';

/**
 * Create payments router
 * Pure function that returns configured Express router
 */
export const createPaymentsRouter = (): Router => {
  const router = Router();

  // Get database models
  const models = getDatabaseModels();

  // Create repository, service, and handlers (dependency injection)
  const repository = createPaymentRepository(models.Payment);
  const service = createPaymentService(repository);
  const handlers = createPaymentHandlers(service);

  /**
   * GET /api/payments
   * Get all payments with filtering and pagination
   * Requires: Staff role or higher
   */
  router.get(
    '/',
    requireStaff as any,
    validateQuery(paymentListQuerySchema),
    handlers.handleGetAllPayments as any
  );

  /**
   * GET /api/payments/order/:orderId
   * Get payment by order ID
   * Requires: Authenticated user (customers can only see own payments)
   */
  router.get(
    '/order/:orderId',
    requireAuthenticated as any,
    validateParams(orderIdParamSchema),
    handlers.handleGetPaymentByOrder as any
  );

  /**
   * GET /api/payments/order/:orderId/vietqr
   * Generate VietQR for order
   * Requires: Authenticated user
   */
  router.get(
    '/order/:orderId/vietqr',
    requireAuthenticated as any,
    validateParams(orderIdParamSchema),
    handlers.handleGetVietQR as any
  );

  /**
   * GET /api/payments/:id
   * Get payment by ID
   */
  router.get(
    '/:id',
    validateParams(paymentIdParamSchema),
    handlers.handleGetPayment as any
  );

  /**
   * POST /api/payments
   * Create new payment
   */
  router.post(
    '/',
    validateBody(createPaymentSchema),
    handlers.handleCreatePayment as any
  );

  /**
   * POST /api/payments/:id/mark-paid
   * Mark payment as paid
   */
  router.post(
    '/:id/mark-paid',
    validateParams(paymentIdParamSchema),
    validateBody(markAsPaidSchema),
    handlers.handleMarkAsPaid as any
  );

  return router;
};
