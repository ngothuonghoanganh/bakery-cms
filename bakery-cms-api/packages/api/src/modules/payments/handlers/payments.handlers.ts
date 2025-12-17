/**
 * Payment request handlers
 * HTTP layer for payments endpoints
 * Handles Express request/response
 */

import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payments.services';
import {
  CreatePaymentDto,
  PaymentListQueryDto,
  MarkAsPaidDto,
} from '../dto/payments.dto';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Payment handlers interface
 * Defines all HTTP handlers for payments endpoints
 */
export interface PaymentHandlers {
  handleCreatePayment(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetPaymentByOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetAllPayments(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleMarkAsPaid(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetVietQR(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create payment handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createPaymentHandlers = (
  service: PaymentService
): PaymentHandlers => {
  /**
   * Handle create payment request
   * POST /api/payments
   */
  const handleCreatePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: CreatePaymentDto = req.body;

      const result = await service.createPayment(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Payment created', { paymentId: result.value.id });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleCreatePayment', { error });
      next(error);
    }
  };

  /**
   * Handle get payment by ID request
   * GET /api/payments/:id
   */
  const handleGetPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Payment ID is required'));
      }

      const result = await service.getPaymentById(id);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetPayment', { error });
      next(error);
    }
  };

  /**
   * Handle get payment by order ID request
   * GET /api/payments/order/:orderId
   */
  const handleGetPaymentByOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.getPaymentByOrderId(orderId);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetPaymentByOrder', { error });
      next(error);
    }
  };

  /**
   * Handle get all payments request
   * GET /api/payments
   */
  const handleGetAllPayments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query: PaymentListQueryDto = {
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
        status: req.query['status'] as any,
        method: req.query['method'] as any,
        orderId: req.query['orderId'] as string,
        startDate: req.query['startDate'] as string,
        endDate: req.query['endDate'] as string,
      };

      const result = await service.getAllPayments(query);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        ...result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetAllPayments', { error });
      next(error);
    }
  };

  /**
   * Handle mark payment as paid request
   * POST /api/payments/:id/mark-paid
   */
  const handleMarkAsPaid = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: MarkAsPaidDto = req.body;

      if (!id) {
        return next(new Error('Payment ID is required'));
      }

      const result = await service.markAsPaid(id, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Payment marked as paid', { paymentId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleMarkAsPaid', { error });
      next(error);
    }
  };

  /**
   * Handle get VietQR request
   * GET /api/payments/order/:orderId/vietqr
   */
  const handleGetVietQR = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.generateVietQR(orderId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('VietQR generated', { orderId });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetVietQR', { error });
      next(error);
    }
  };

  return {
    handleCreatePayment,
    handleGetPayment,
    handleGetPaymentByOrder,
    handleGetAllPayments,
    handleMarkAsPaid,
    handleGetVietQR,
  };
};
