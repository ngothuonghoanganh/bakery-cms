/**
 * Order repository
 * Data access layer for orders using Sequelize
 */

import { Op } from 'sequelize';
import { OrderModel, OrderItemModel, PaymentModel } from '@bakery-cms/database';
import { OrderStatus } from '@bakery-cms/common';
import { OrderListQueryDto, OrderItemDto } from '../dto/orders.dto';

/**
 * Order repository interface
 * Defines all data access operations for orders
 */
export interface OrderRepository {
  findById(id: string): Promise<OrderModel | null>;
  findByIdWithItems(id: string): Promise<OrderModel | null>;
  findAll(query: OrderListQueryDto): Promise<{ rows: OrderModel[]; count: number }>;
  create(attributes: Partial<OrderModel>): Promise<OrderModel>;
  update(id: string, attributes: Partial<OrderModel>): Promise<OrderModel | null>;
  updateStatus(id: string, status: OrderStatus): Promise<OrderModel | null>;
  delete(id: string): Promise<boolean>;
  restore(id: string): Promise<OrderModel | null>;
  count(filters?: Partial<OrderModel>): Promise<number>;
  findByOrderNumber(orderNumber: string): Promise<OrderModel | null>;
}

/**
 * Order item repository interface
 * Defines data access operations for order items
 */
export interface OrderItemRepository {
  findByOrderId(orderId: string): Promise<OrderItemModel[]>;
  createMany(orderId: string, items: OrderItemDto[]): Promise<OrderItemModel[]>;
  deleteByOrderId(orderId: string): Promise<number>;
}

/**
 * Create order repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createOrderRepository = (
  orderModel: typeof OrderModel,
  orderItemModel: typeof OrderItemModel
): OrderRepository & { items: OrderItemRepository } => {
  /**
   * Find order by ID
   */
  const findById = async (id: string): Promise<OrderModel | null> => {
    return await orderModel.findByPk(id);
  };

  /**
   * Find order by ID with items included
   */
  const findByIdWithItems = async (id: string): Promise<OrderModel | null> => {
    return await orderModel.findByPk(id, {
      include: [
        {
          model: orderItemModel,
          as: 'items',
        },
      ],
    });
  };

  /**
   * Find all orders with filtering and pagination
   */
  const findAll = async (
    query: OrderListQueryDto
  ): Promise<{ rows: OrderModel[]; count: number }> => {
    const {
      page = 1,
      limit = 10,
      status,
      orderType,
      businessModel,
      search,
      startDate,
      endDate,
    } = query;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where['status'] = status;
    }

    if (orderType) {
      where['orderType'] = orderType;
    }

    if (businessModel) {
      where['businessModel'] = businessModel;
    }

    if (search) {
      (where as any)[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { customerPhone: { [Op.like]: `%${search}%` } },
      ];
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter[Op.lte] = new Date(endDate);
      }
      where['createdAt'] = dateFilter;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Execute query
    const result = await orderModel.findAndCountAll({
      where,
      include: [
        {
          model: orderItemModel,
          as: 'items',
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return result;
  };

  /**
   * Create new order
   */
  const create = async (
    attributes: Partial<OrderModel>
  ): Promise<OrderModel> => {
    return await orderModel.create(attributes);
  };

  /**
   * Update order by ID
   * Returns updated order or null if not found
   */
  const update = async (
    id: string,
    attributes: Partial<OrderModel>
  ): Promise<OrderModel | null> => {
    const order = await orderModel.findByPk(id);

    if (!order) {
      return null;
    }

    await order.update(attributes);
    return order;
  };

  /**
   * Update order status by ID
   * Returns updated order or null if not found
   */
  const updateStatus = async (
    id: string,
    status: OrderStatus
  ): Promise<OrderModel | null> => {
    const order = await orderModel.findByPk(id);

    if (!order) {
      return null;
    }

    await order.update({ status });
    return order;
  };

  /**
   * Delete order by ID with cascade soft delete
   * Soft deletes the order, all its items, and associated payment in a transaction
   * Returns true if deleted, false if not found
   */
  const deleteOrder = async (id: string): Promise<boolean> => {
    const transaction = await orderModel.sequelize!.transaction();

    try {
      // Find the order
      const order = await orderModel.findByPk(id, { transaction });
      
      if (!order) {
        await transaction.rollback();
        return false;
      }

      // Soft delete the order
      await order.destroy({ transaction });

      // Cascade soft delete all order items
      await orderItemModel.destroy({
        where: { orderId: id },
        transaction,
      });

      // Cascade soft delete associated payment if exists
      await PaymentModel.destroy({
        where: { orderId: id },
        transaction,
      });

      // Commit transaction
      await transaction.commit();
      return true;
    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Restore soft-deleted order with cascade
   * Restores the order, all its items, and associated payment
   * Returns restored order or null if not found or not deleted
   */
  const restore = async (id: string): Promise<OrderModel | null> => {
    const transaction = await orderModel.sequelize!.transaction();

    try {
      // Find soft-deleted order
      const order = await orderModel.scope('withDeleted').findByPk(id, { transaction });
      
      if (!order || !order.deletedAt) {
        await transaction.rollback();
        return null;
      }

      // Restore the order
      await order.restore({ transaction });

      // Cascade restore all order items
      const deletedItems = await orderItemModel.scope('withDeleted').findAll({
        where: { orderId: id },
        paranoid: false,
        transaction,
      });

      for (const item of deletedItems) {
        if (item.deletedAt) {
          await item.restore({ transaction });
        }
      }

      // Cascade restore associated payment if exists
      const deletedPayment = await PaymentModel.scope('withDeleted').findOne({
        where: { orderId: id },
        paranoid: false,
        transaction,
      });

      if (deletedPayment && deletedPayment.deletedAt) {
        await deletedPayment.restore({ transaction });
      }

      // Commit transaction
      await transaction.commit();
      return order;
    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Count orders with optional filters
   */
  const count = async (filters?: Partial<OrderModel>): Promise<number> => {
    return await orderModel.count({
      where: filters ?? {},
    });
  };

  /**
   * Find order by order number
   */
  const findByOrderNumber = async (
    orderNumber: string
  ): Promise<OrderModel | null> => {
    return await orderModel.findOne({
      where: { orderNumber },
    });
  };

  /**
   * Order item repository methods
   */
  const itemRepository: OrderItemRepository = {
    /**
     * Find all items for an order
     */
    findByOrderId: async (orderId: string): Promise<OrderItemModel[]> => {
      return await orderItemModel.findAll({
        where: { orderId },
        order: [['createdAt', 'ASC']],
      });
    },

    /**
     * Create multiple order items
     */
    createMany: async (
      orderId: string,
      items: OrderItemDto[]
    ): Promise<OrderItemModel[]> => {
      const itemAttributes = items.map((item) => ({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        notes: item.notes ?? null,
      }));

      return await orderItemModel.bulkCreate(itemAttributes);
    },

    /**
     * Delete all items for an order
     */
    deleteByOrderId: async (orderId: string): Promise<number> => {
      return await orderItemModel.destroy({
        where: { orderId },
      });
    },
  };

  return {
    findById,
    findByIdWithItems,
    findAll,
    create,
    update,
    updateStatus,
    delete: deleteOrder,
    restore,
    count,
    findByOrderNumber,
    items: itemRepository,
  };
};
