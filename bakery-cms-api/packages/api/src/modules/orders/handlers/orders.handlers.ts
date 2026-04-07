/**
 * Order request handlers
 * HTTP layer for orders endpoints
 * Handles Express request/response
 */

import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orders.services';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderListQueryDto,
  ConfirmOrderDto,
  AddOrderExtrasDto,
  SaveOrderBillDto,
  VoidOrderBillDto,
} from '../dto/orders.dto';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Order handlers interface
 * Defines all HTTP handlers for orders endpoints
 */
export interface OrderHandlers {
  handleCreateOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetAllOrders(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleConfirmOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleAddOrderExtras(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleCancelOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleDeleteOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetOrderBills(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleSaveOrderBill(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleVoidOrderBill(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create order handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createOrderHandlers = (service: OrderService): OrderHandlers => {
  /**
   * Handle create order request
   * POST /api/orders
   */
  const handleCreateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: CreateOrderDto = req.body;

      const result = await service.createOrder(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Order created', { orderId: result.value.id });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleCreateOrder', { error });
      next(error);
    }
  };

  /**
   * Handle get order by ID request
   * GET /api/orders/:id
   */
  const handleGetOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.getOrderById(id);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetOrder', { error });
      next(error);
    }
  };

  /**
   * Handle get all orders request
   * GET /api/orders
   */
  const handleGetAllOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query: OrderListQueryDto = {
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined,
        status: req.query['status'] as any,
        orderType: req.query['orderType'] as any,
        businessModel: req.query['businessModel'] as any,
        search: req.query['search'] as string,
        startDate: req.query['startDate'] as string,
        endDate: req.query['endDate'] as string,
      };

      const result = await service.getAllOrders(query);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        ...result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetAllOrders', { error });
      next(error);
    }
  };

  /**
   * Handle update order request
   * PATCH /api/orders/:id
   */
  const handleUpdateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateOrderDto = req.body;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.updateOrder(id, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Order updated', { orderId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateOrder', { error });
      next(error);
    }
  };

  /**
   * Handle confirm order request
   * POST /api/orders/:id/confirm
   */
  const handleConfirmOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: ConfirmOrderDto = req.body;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.confirmOrder(id, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Order confirmed', { orderId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleConfirmOrder', { error });
      next(error);
    }
  };

  /**
   * Handle add/update extras request
   * POST /api/orders/:id/extras
   */
  const handleAddOrderExtras = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: AddOrderExtrasDto = req.body;
      const actorUserId = (req as any).user?.id as string | undefined;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      if (!actorUserId) {
        return next(new Error('User authentication required'));
      }

      const result = await service.addOrderExtras(id, dto, actorUserId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Order extras updated', { orderId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleAddOrderExtras', { error });
      next(error);
    }
  };

  /**
   * Handle cancel order request
   * POST /api/orders/:id/cancel
   */
  const handleCancelOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.cancelOrder(id, reason);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Order cancelled', { orderId: id });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleCancelOrder', { error });
      next(error);
    }
  };

  /**
   * Handle delete order request
   * DELETE /api/orders/:id
   */
  const handleDeleteOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.deleteOrder(id);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Order deleted', { orderId: id });

      res.status(204).send();
    } catch (error) {
      logger.error('Unhandled error in handleDeleteOrder', { error });
      next(error);
    }
  };

  /**
   * Handle get order bills request
   * GET /api/orders/:id/bills
   */
  const handleGetOrderBills = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.getOrderBills(id);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetOrderBills', { error });
      next(error);
    }
  };

  /**
   * Handle save order bill request
   * POST /api/orders/:id/bills
   */
  const handleSaveOrderBill = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: SaveOrderBillDto = req.body;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      const result = await service.saveOrderBill(id, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Order bill saved', {
        orderId: id,
        billId: result.value.id,
        billNumber: result.value.billNumber,
      });

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleSaveOrderBill', { error });
      next(error);
    }
  };

  /**
   * Handle void order bill request
   * POST /api/orders/:id/bills/:billId/void
   */
  const handleVoidOrderBill = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id, billId } = req.params;
      const dto: VoidOrderBillDto = req.body;

      if (!id) {
        return next(new Error('Order ID is required'));
      }

      if (!billId) {
        return next(new Error('Bill ID is required'));
      }

      const result = await service.voidOrderBill(id, billId, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Order bill voided', {
        orderId: id,
        billId,
      });

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleVoidOrderBill', { error });
      next(error);
    }
  };

  return {
    handleCreateOrder,
    handleGetOrder,
    handleGetAllOrders,
    handleUpdateOrder,
    handleConfirmOrder,
    handleAddOrderExtras,
    handleCancelOrder,
    handleDeleteOrder,
    handleGetOrderBills,
    handleSaveOrderBill,
    handleVoidOrderBill,
  };
};
