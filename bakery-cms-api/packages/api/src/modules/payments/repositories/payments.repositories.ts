/**
 * Payment repository
 * Data access layer for payments using Sequelize
 */

import { Op } from 'sequelize';
import { PaymentModel } from '@bakery-cms/database';
import { PaymentStatus, PaymentType } from '@bakery-cms/common';
import { PaymentListQueryDto } from '../dto/payments.dto';

/**
 * Payment repository interface
 * Defines all data access operations for payments
 */
export interface PaymentRepository {
  findById(id: string): Promise<PaymentModel | null>;
  findByOrderId(orderId: string): Promise<PaymentModel | null>;
  findAll(query: PaymentListQueryDto): Promise<{ rows: PaymentModel[]; count: number }>;
  sumAmountByOrderIdAndStatus(
    orderId: string,
    status: PaymentStatus,
    paymentType?: PaymentType
  ): Promise<number>;
  create(attributes: Partial<PaymentModel>): Promise<PaymentModel>;
  updateStatus(id: string, status: PaymentStatus, paidAt?: Date): Promise<PaymentModel | null>;
  markAsPaid(id: string, paidAt: Date, transactionId?: string): Promise<PaymentModel | null>;
  update(id: string, attributes: Partial<PaymentModel>): Promise<PaymentModel | null>;
  delete(id: string): Promise<boolean>;
  restore(id: string): Promise<PaymentModel | null>;
  count(filters?: Partial<PaymentModel>): Promise<number>;
}

/**
 * Create payment repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createPaymentRepository = (
  model: typeof PaymentModel
): PaymentRepository => {
  const orderBasicInclude = {
    association: 'order',
    attributes: [
      'id',
      'orderNumber',
      'status',
      'customerName',
      'customerPhone',
      'totalAmount',
      'createdAt',
    ],
  };

  /**
   * Find payment by ID
   */
  const findById = async (id: string): Promise<PaymentModel | null> => {
    return await model.findByPk(id, {
      include: [orderBasicInclude],
    });
  };

  /**
   * Find payment by order ID
   */
  const findByOrderId = async (orderId: string): Promise<PaymentModel | null> => {
    return await model.findOne({
      where: {
        orderId,
        paymentType: PaymentType.PAYMENT,
      },
      include: [orderBasicInclude],
      order: [['createdAt', 'DESC']],
    });
  };

  /**
   * Find all payments with filtering and pagination
   */
  const findAll = async (
    query: PaymentListQueryDto
  ): Promise<{ rows: PaymentModel[]; count: number }> => {
    const {
      page = 1,
      limit = 10,
      paymentType,
      status,
      method,
      orderId,
      startDate,
      endDate,
    } = query;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where['status'] = status;
    }

    if (paymentType) {
      where['paymentType'] = paymentType;
    }

    if (method) {
      where['method'] = method;
    }

    if (orderId) {
      where['orderId'] = orderId;
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
    const result = await model.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [orderBasicInclude],
      distinct: true,
    });

    return result;
  };

  /**
   * Sum payment amounts by order ID and status
   */
  const sumAmountByOrderIdAndStatus = async (
    orderId: string,
    status: PaymentStatus,
    paymentType?: PaymentType
  ): Promise<number> => {
    const where: Record<string, unknown> = { orderId, status };

    if (paymentType) {
      where['paymentType'] = paymentType;
    }

    const sum = await model.sum('amount', {
      where,
    });

    return Number(sum ?? 0);
  };

  /**
   * Create new payment
   */
  const create = async (
    attributes: Partial<PaymentModel>
  ): Promise<PaymentModel> => {
    const payment = await model.create(attributes);
    return (await findById(payment.id)) ?? payment;
  };

  /**
   * Update payment status by ID
   * Returns updated payment or null if not found
   */
  const updateStatus = async (
    id: string,
    status: PaymentStatus,
    paidAt?: Date
  ): Promise<PaymentModel | null> => {
    const payment = await model.findByPk(id);

    if (!payment) {
      return null;
    }

    const updateData: any = { status };
    if (paidAt) {
      updateData.paidAt = paidAt;
    }

    await payment.update(updateData);
    return await findById(payment.id);
  };

  /**
   * Mark payment as paid
   * Returns updated payment or null if not found
   */
  const markAsPaid = async (
    id: string,
    paidAt: Date,
    transactionId?: string
  ): Promise<PaymentModel | null> => {
    const payment = await model.findByPk(id);

    if (!payment) {
      return null;
    }

    const updateData: any = {
      status: PaymentStatus.PAID,
      paidAt,
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    await payment.update(updateData);
    return await findById(payment.id);
  };

  /**
   * Update payment by ID
   * Returns updated payment or null if not found
   */
  const update = async (
    id: string,
    attributes: Partial<PaymentModel>
  ): Promise<PaymentModel | null> => {
    const payment = await model.findByPk(id);

    if (!payment) {
      return null;
    }

    await payment.update(attributes);
    return await findById(payment.id);
  };

  /**
   * Delete payment by ID (soft delete)
   * Returns true if deleted, false if not found
   */
  const deletePayment = async (id: string): Promise<boolean> => {
    const payment = await model.findByPk(id);
    
    if (!payment) {
      return false;
    }

    await payment.destroy();
    return true;
  };

  /**
   * Restore soft-deleted payment by ID
   * Returns restored payment or null if not found
   */
  const restore = async (id: string): Promise<PaymentModel | null> => {
    const payment = await model.scope('withDeleted').findByPk(id);
    
    if (!payment || !payment.deletedAt) {
      return null;
    }

    await payment.restore();
    return payment;
  };

  /**
   * Count payments with optional filters
   */
  const count = async (filters?: Partial<PaymentModel>): Promise<number> => {
    return await model.count({
      where: filters ?? {},
    });
  };

  return {
    findById,
    findByOrderId,
    findAll,
    sumAmountByOrderIdAndStatus,
    create,
    updateStatus,
    markAsPaid,
    update,
    delete: deletePayment,
    restore,
    count,
  };
};
