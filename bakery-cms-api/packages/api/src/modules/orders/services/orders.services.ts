/**
 * Order services
 * Business logic layer for orders
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { AppError, OrderStatus } from '@bakery-cms/common';
import { OrderRepository } from '../repositories/orders.repositories';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderListQueryDto,
  OrderResponseDto,
  OrderListResponseDto,
} from '../dto/orders.dto';
import {
  toOrderResponseDto,
  toOrderResponseDtoList,
  toOrderCreationAttributes,
  toOrderUpdateAttributes,
  calculateOrderTotal,
  validateAllItemsSubtotals,
} from '../mappers/orders.mappers';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
  createBusinessRuleError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Order service interface
 * Defines all business operations for orders
 */
export interface OrderService {
  createOrder(dto: CreateOrderDto): Promise<Result<OrderResponseDto, AppError>>;
  getOrderById(id: string): Promise<Result<OrderResponseDto, AppError>>;
  getAllOrders(query: OrderListQueryDto): Promise<Result<OrderListResponseDto, AppError>>;
  updateOrder(id: string, dto: UpdateOrderDto): Promise<Result<OrderResponseDto, AppError>>;
  confirmOrder(id: string): Promise<Result<OrderResponseDto, AppError>>;
  cancelOrder(id: string, reason?: string): Promise<Result<OrderResponseDto, AppError>>;
  deleteOrder(id: string): Promise<Result<void, AppError>>;
}

/**
 * Generate order number in format: ORD-YYYYMMDD-XXXX
 * Pure function that creates unique order numbers
 */
export const generateOrderNumber = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 4-digit number
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${random}`;
};

/**
 * Validate order status transition
 * Pure function to check if status change is allowed
 */
const isValidStatusTransition = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean => {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.CANCELLED],
    [OrderStatus.CANCELLED]: [], // Cannot transition from cancelled
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
};

/**
 * Create order service
 * Factory function that returns service implementation
 * Uses dependency injection for repository
 */
export const createOrderService = (
  repository: OrderRepository & { items: any }
): OrderService => {
  /**
   * Create new order with items
   */
  const createOrder = async (
    dto: CreateOrderDto
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.info('Creating new order', { itemCount: dto.items.length });

      // Validate items subtotals
      if (!validateAllItemsSubtotals(dto.items)) {
        return err(
          createInvalidInputError('One or more item subtotals are incorrect')
        );
      }

      // Generate unique order number
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const existing = await repository.findByOrderNumber(orderNumber);
        if (!existing) {
          break;
        }
        orderNumber = generateOrderNumber();
        attempts++;
      }

      if (attempts === maxAttempts) {
        return err(createDatabaseError('Failed to generate unique order number'));
      }

      // Calculate total amount
      const totalAmount = calculateOrderTotal(dto.items);

      // Create order
      const orderAttributes = toOrderCreationAttributes(dto, orderNumber);
      orderAttributes.totalAmount = totalAmount;

      const order = await repository.create(orderAttributes);

      // Create order items
      await repository.items.createMany(order.id, dto.items);

      // Fetch order with items
      const orderWithItems = await repository.findByIdWithItems(order.id);

      if (!orderWithItems) {
        return err(createDatabaseError('Failed to retrieve created order'));
      }

      logger.info('Order created successfully', {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      return ok(
        toOrderResponseDto(orderWithItems, (orderWithItems as any).items)
      );
    } catch (error) {
      logger.error('Failed to create order', { error, dto });
      return err(createDatabaseError('Failed to create order'));
    }
  };

  /**
   * Get order by ID with items
   */
  const getOrderById = async (
    id: string
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.debug('Fetching order by ID', { orderId: id });

      const order = await repository.findByIdWithItems(id);

      if (!order) {
        logger.warn('Order not found', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      return ok(toOrderResponseDto(order, (order as any).items));
    } catch (error) {
      logger.error('Failed to fetch order', { error, orderId: id });
      return err(createDatabaseError('Failed to fetch order'));
    }
  };

  /**
   * Get all orders with filtering and pagination
   */
  const getAllOrders = async (
    query: OrderListQueryDto
  ): Promise<Result<OrderListResponseDto, AppError>> => {
    try {
      logger.debug('Fetching orders list', { query });

      const { page = 1, limit = 10 } = query;

      // Validate pagination
      if (page < 1) {
        return err(createInvalidInputError('Page must be at least 1'));
      }

      if (limit < 1 || limit > 100) {
        return err(createInvalidInputError('Limit must be between 1 and 100'));
      }

      const result = await repository.findAll(query);

      const totalPages = Math.ceil(result.count / limit);

      const response: OrderListResponseDto = {
        data: toOrderResponseDtoList(result.rows as any),
        pagination: {
          page,
          limit,
          total: result.count,
          totalPages,
        },
      };

      logger.debug('Orders list fetched successfully', {
        count: result.rows.length,
        total: result.count,
      });

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch orders list', { error, query });
      return err(createDatabaseError('Failed to fetch orders'));
    }
  };

  /**
   * Update order by ID
   */
  const updateOrder = async (
    id: string,
    dto: UpdateOrderDto
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.info('Updating order', { orderId: id, updates: dto });

      // Check if order exists
      const existingOrder = await repository.findByIdWithItems(id);

      if (!existingOrder) {
        logger.warn('Order not found for update', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      // Check if order can be updated (not paid or cancelled)
      if (
        existingOrder.status === OrderStatus.PAID ||
        existingOrder.status === OrderStatus.CANCELLED
      ) {
        return err(
          createBusinessRuleError(
            `Cannot update order with status: ${existingOrder.status}`
          )
        );
      }

      const attributes = toOrderUpdateAttributes(dto);

      // Update order items if provided
      if (dto.items) {
        // Validate items subtotals
        if (!validateAllItemsSubtotals(dto.items)) {
          return err(
            createInvalidInputError('One or more item subtotals are incorrect')
          );
        }

        // Calculate new total
        const totalAmount = calculateOrderTotal(dto.items);
        attributes.totalAmount = totalAmount;

        // Delete existing items and create new ones
        await repository.items.deleteByOrderId(id);
        await repository.items.createMany(id, dto.items);
      }

      // Check if there are any attributes to update
      if (Object.keys(attributes).length === 0 && !dto.items) {
        return err(createInvalidInputError('No valid fields provided for update'));
      }

      // Update order
      const order = await repository.update(id, attributes);

      if (!order) {
        return err(createNotFoundError('Order', id));
      }

      // Fetch updated order with items
      const updatedOrder = await repository.findByIdWithItems(id);

      if (!updatedOrder) {
        return err(createDatabaseError('Failed to retrieve updated order'));
      }

      logger.info('Order updated successfully', { orderId: id });

      return ok(
        toOrderResponseDto(updatedOrder, (updatedOrder as any).items)
      );
    } catch (error) {
      logger.error('Failed to update order', { error, orderId: id, dto });
      return err(createDatabaseError('Failed to update order'));
    }
  };

  /**
   * Confirm order (change status to CONFIRMED)
   */
  const confirmOrder = async (
    id: string
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.info('Confirming order', { orderId: id });

      const order = await repository.findByIdWithItems(id);

      if (!order) {
        logger.warn('Order not found for confirmation', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      // Validate status transition
      if (!isValidStatusTransition(order.status as OrderStatus, OrderStatus.CONFIRMED)) {
        return err(
          createBusinessRuleError(
            `Cannot confirm order with status: ${order.status}`
          )
        );
      }

      // Update status and confirmation timestamp
      const updatedOrder = await repository.update(id, {
        status: OrderStatus.CONFIRMED,
        confirmedAt: new Date(),
      });

      if (!updatedOrder) {
        return err(createDatabaseError('Failed to confirm order'));
      }

      // Fetch with items
      const orderWithItems = await repository.findByIdWithItems(id);

      logger.info('Order confirmed successfully', { orderId: id });

      return ok(
        toOrderResponseDto(orderWithItems!, (orderWithItems as any).items)
      );
    } catch (error) {
      logger.error('Failed to confirm order', { error, orderId: id });
      return err(createDatabaseError('Failed to confirm order'));
    }
  };

  /**
   * Cancel order (change status to CANCELLED)
   */
  const cancelOrder = async (
    id: string,
    reason?: string
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.info('Cancelling order', { orderId: id, reason });

      const order = await repository.findByIdWithItems(id);

      if (!order) {
        logger.warn('Order not found for cancellation', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      // Validate status transition
      if (!isValidStatusTransition(order.status as OrderStatus, OrderStatus.CANCELLED)) {
        return err(
          createBusinessRuleError(
            `Cannot cancel order with status: ${order.status}`
          )
        );
      }

      // Update status and add cancellation reason to notes
      const updateData: any = {
        status: OrderStatus.CANCELLED,
      };

      if (reason) {
        updateData.notes = order.notes
          ? `${order.notes}\n\nCancellation reason: ${reason}`
          : `Cancellation reason: ${reason}`;
      }

      const updatedOrder = await repository.update(id, updateData);

      if (!updatedOrder) {
        return err(createDatabaseError('Failed to cancel order'));
      }

      // Fetch with items
      const orderWithItems = await repository.findByIdWithItems(id);

      logger.info('Order cancelled successfully', { orderId: id });

      return ok(
        toOrderResponseDto(orderWithItems!, (orderWithItems as any).items)
      );
    } catch (error) {
      logger.error('Failed to cancel order', { error, orderId: id });
      return err(createDatabaseError('Failed to cancel order'));
    }
  };

  /**
   * Delete order by ID
   */
  const deleteOrder = async (id: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Deleting order', { orderId: id });

      // Check if order exists and can be deleted
      const order = await repository.findById(id);

      if (!order) {
        logger.warn('Order not found for deletion', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      // Only allow deletion of draft orders
      if (order.status !== OrderStatus.DRAFT) {
        return err(
          createBusinessRuleError(
            `Cannot delete order with status: ${order.status}. Only draft orders can be deleted.`
          )
        );
      }

      const deleted = await repository.delete(id);

      if (!deleted) {
        return err(createDatabaseError('Failed to delete order'));
      }

      logger.info('Order deleted successfully', { orderId: id });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete order', { error, orderId: id });
      return err(createDatabaseError('Failed to delete order'));
    }
  };

  return {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    confirmOrder,
    cancelOrder,
    deleteOrder,
  };
};
