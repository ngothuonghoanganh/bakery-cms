/**
 * Payment repository
 * Data access layer for payments using Sequelize
 */

import { Op } from 'sequelize';
import { PaymentModel } from '@bakery-cms/database';
import { PaymentStatus } from '@bakery-cms/common';
import { PaymentListQueryDto } from '../dto/payments.dto';

/**
 * Payment repository interface
 * Defines all data access operations for payments
 */
export interface PaymentRepository {
  findById(id: string): Promise<PaymentModel | null>;
  findByOrderId(orderId: string): Promise<PaymentModel | null>;
  findAll(query: PaymentListQueryDto): Promise<{ rows: PaymentModel[]; count: number }>;
  create(attributes: Partial<PaymentModel>): Promise<PaymentModel>;
  updateStatus(id: string, status: PaymentStatus, paidAt?: Date): Promise<PaymentModel | null>;
  markAsPaid(id: string, paidAt: Date, transactionId?: string): Promise<PaymentModel | null>;
  update(id: string, attributes: Partial<PaymentModel>): Promise<PaymentModel | null>;
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
  /**
   * Find payment by ID
   */
  const findById = async (id: string): Promise<PaymentModel | null> => {
    return await model.findByPk(id);
  };

  /**
   * Find payment by order ID
   */
  const findByOrderId = async (orderId: string): Promise<PaymentModel | null> => {
    return await model.findOne({
      where: { orderId },
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
    });

    return result;
  };

  /**
   * Create new payment
   */
  const create = async (
    attributes: Partial<PaymentModel>
  ): Promise<PaymentModel> => {
    return await model.create(attributes);
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
    return payment;
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
    return payment;
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
    create,
    updateStatus,
    markAsPaid,
    update,
    count,
  };
};
