/**
 * Payment services
 * Business logic layer for payments
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import {
  AppError,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '@bakery-cms/common';
import { PaymentRepository } from '../repositories/payments.repositories';
import { SettingsRepository } from '../../settings/repositories/settings.repositories';
import type { OrderRepository } from '../../orders/repositories/orders.repositories';
import type { PaidOrderStockService } from '../../stock/services/paid-order-stock.services';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  PaymentListQueryDto,
  PaymentListResponseDto,
  VietQRData,
  VietQRResponseDto,
  MarkAsPaidDto,
  CreateRefundPaymentDto,
} from '../dto/payments.dto';
import {
  toPaymentResponseDto,
  toPaymentResponseDtoList,
  toPaymentCreationAttributes,
  stringifyVietQRData,
} from '../mappers/payments.mappers';
import { getEnvConfig } from '../../../config/env';
import { generateVietQRData } from '../utils/vietqr.utils';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
  createBusinessRuleError,
  createConflictError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

const isAppError = (value: unknown): value is AppError => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeError = value as Partial<AppError>;
  return (
    typeof maybeError.code === 'string' &&
    typeof maybeError.message === 'string' &&
    typeof maybeError.statusCode === 'number'
  );
};

/**
 * Payment service interface
 * Defines all business operations for payments
 */
export interface PaymentService {
  createPayment(dto: CreatePaymentDto): Promise<Result<PaymentResponseDto, AppError>>;
  getPaymentById(id: string): Promise<Result<PaymentResponseDto, AppError>>;
  getPaymentByOrderId(orderId: string): Promise<Result<PaymentResponseDto, AppError>>;
  getAllPayments(query: PaymentListQueryDto): Promise<Result<PaymentListResponseDto, AppError>>;
  markAsPaid(
    id: string,
    dto: MarkAsPaidDto,
    actorUserId: string
  ): Promise<Result<PaymentResponseDto, AppError>>;
  refundOrder(
    orderId: string,
    dto: CreateRefundPaymentDto
  ): Promise<Result<PaymentResponseDto, AppError>>;
  generateVietQR(orderId: string): Promise<Result<VietQRResponseDto, AppError>>;
  deletePayment(id: string): Promise<Result<boolean, AppError>>;
  restorePayment(id: string): Promise<Result<PaymentResponseDto, AppError>>;
}

/**
 * VietQR bank configuration
 * In production, this should come from environment variables
 */
interface VietQRBankConfig {
  bankBin: string;
  accountNo: string;
  accountName: string;
}

const BANK_RECEIVER_SETTING_KEY = 'vietqr.bank_receiver';

const VIETQR_CONFIG: VietQRBankConfig = {
  bankBin: '970436',
  accountNo: '0123456789',
  accountName: 'BAKERY CMS',
};

/**
 * Format order number for VietQR addInfo
 * Pure function that creates payment description
 */
const formatVietQRAddInfo = (orderNumber: string): string => {
  const normalizedOrder = orderNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `DH${normalizedOrder}`.slice(0, 25);
};

/**
 * Validate payment status transition
 * Pure function to check if status change is allowed
 */
const isValidPaymentStatusTransition = (
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus
): boolean => {
  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
    [PaymentStatus.PAID]: [], // Cannot change from paid
    [PaymentStatus.FAILED]: [PaymentStatus.PENDING], // Retry
    [PaymentStatus.CANCELLED]: [], // Cannot transition from cancelled
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
};

/**
 * Create payment service
 * Factory function that returns service implementation
 * Uses dependency injection for repository
 */
export const createPaymentService = (
  repository: PaymentRepository,
  settingsRepository: SettingsRepository,
  orderRepository: OrderRepository,
  paidOrderStockService: PaidOrderStockService
): PaymentService => {
  const toMoney = (value: number): number => Math.round(value * 100) / 100;

  const envConfig = getEnvConfig();
  const vietqrCredentials =
    envConfig.VIETQR_CLIENT_ID && envConfig.VIETQR_API_KEY
      ? {
          clientId: envConfig.VIETQR_CLIENT_ID,
          apiKey: envConfig.VIETQR_API_KEY,
        }
      : null;

  const getVietQRBankConfig = async (): Promise<VietQRBankConfig> => {
    const setting = await settingsRepository.findByKey(BANK_RECEIVER_SETTING_KEY);
    if (!setting?.value) {
      return VIETQR_CONFIG;
    }

    try {
      const parsed = JSON.parse(setting.value) as Partial<{
        bankBin: string;
        accountNo: string;
        accountName: string;
      }>;
      const accountName =
        typeof parsed.accountName === 'string' ? parsed.accountName.trim() : '';

      return {
        bankBin: parsed.bankBin || VIETQR_CONFIG.bankBin,
        accountNo: parsed.accountNo || VIETQR_CONFIG.accountNo,
        accountName: accountName || VIETQR_CONFIG.accountName,
      };
    } catch {
      return VIETQR_CONFIG;
    }
  };

  const syncOrderPaidStatusIfNeeded = async (
    orderId: string,
    actorUserId: string
  ): Promise<void> => {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      logger.warn('Order not found while syncing payment status', { orderId });
      return;
    }

    const orderTotalAmount = Number(order.totalAmount);
    const totalPaidAmount = await repository.sumAmountByOrderIdAndStatus(
      orderId,
      PaymentStatus.PAID,
      PaymentType.PAYMENT
    );
    const isFullyPaid = Math.abs(orderTotalAmount - totalPaidAmount) < 0.01;

    if (!isFullyPaid) {
      if (
        order.status === OrderStatus.PAID &&
        !(order as any).hasPendingExtraPayment
      ) {
        await orderRepository.update(orderId, { hasPendingExtraPayment: true } as any);
      }

      logger.debug('Order is not fully paid yet', {
        orderId,
        orderTotalAmount,
        totalPaidAmount,
      });
      return;
    }

    if (order.status === OrderStatus.PAID) {
      if ((order as any).hasPendingExtraPayment) {
        await orderRepository.update(orderId, { hasPendingExtraPayment: false } as any);
      }
      return;
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      logger.warn('Order fully paid but status transition is not allowed', {
        orderId,
        currentStatus: order.status,
        expectedStatus: OrderStatus.CONFIRMED,
      });
      return;
    }

    const stockConsumptionResult =
      await paidOrderStockService.consumeStockForPaidOrder(orderId, actorUserId);
    if (stockConsumptionResult.isErr()) {
      throw stockConsumptionResult.error;
    }

    const updatedOrder = await orderRepository.update(
      orderId,
      { status: OrderStatus.PAID, hasPendingExtraPayment: false } as any
    );

    if (!updatedOrder) {
      throw createDatabaseError('Failed to update order status to paid');
    }

    logger.info('Order marked as paid based on confirmed payment totals', {
      orderId,
      totalPaidAmount,
      orderTotalAmount,
    });
  };

  const syncOrderRefundedStatusIfNeeded = async (orderId: string): Promise<void> => {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      logger.warn('Order not found while syncing refund status', { orderId });
      return;
    }

    if (order.status === OrderStatus.REFUNDED) {
      return;
    }

    if (order.status !== OrderStatus.REFUND_PENDING) {
      logger.warn('Order status does not allow refund completion sync', {
        orderId,
        currentStatus: order.status,
        expectedStatus: OrderStatus.REFUND_PENDING,
      });
      return;
    }

    const totalRefundedAmount = await repository.sumAmountByOrderIdAndStatus(
      orderId,
      PaymentStatus.PAID,
      PaymentType.REFUND
    );

    if (totalRefundedAmount <= 0) {
      logger.debug('No paid refund amount found yet', { orderId });
      return;
    }

    const updatedOrder = await orderRepository.updateStatus(orderId, OrderStatus.REFUNDED);
    if (!updatedOrder) {
      throw createDatabaseError('Failed to update order status to refunded');
    }

    logger.info('Order marked as refunded based on confirmed refund payment', {
      orderId,
      totalRefundedAmount,
    });
  };

  /**
   * Create new payment
   */
  const createPayment = async (
    dto: CreatePaymentDto
  ): Promise<Result<PaymentResponseDto, AppError>> => {
    try {
      logger.info('Creating new payment', { orderId: dto.orderId });

      // Check if payment already exists for this order
      const existingPayment = await repository.findByOrderId(dto.orderId);
      if (existingPayment) {
        return err(
          createConflictError(`Payment already exists for order: ${dto.orderId}`)
        );
      }

      // Create payment
      const attributes = toPaymentCreationAttributes(dto);
      const payment = await repository.create(attributes);

      logger.info('Payment created successfully', { paymentId: payment.id });

      return ok(toPaymentResponseDto(payment));
    } catch (error) {
      logger.error('Failed to create payment', { error, dto });
      return err(createDatabaseError('Failed to create payment', error));
    }
  };

  /**
   * Get payment by ID
   */
  const getPaymentById = async (
    id: string
  ): Promise<Result<PaymentResponseDto, AppError>> => {
    try {
      logger.debug('Fetching payment by ID', { paymentId: id });

      const payment = await repository.findById(id);

      if (!payment) {
        logger.warn('Payment not found', { paymentId: id });
        return err(createNotFoundError('Payment', id));
      }

      return ok(toPaymentResponseDto(payment));
    } catch (error) {
      logger.error('Failed to fetch payment', { error, paymentId: id });
      return err(createDatabaseError('Failed to fetch payment', error));
    }
  };

  /**
   * Get payment by order ID
   */
  const getPaymentByOrderId = async (
    orderId: string
  ): Promise<Result<PaymentResponseDto, AppError>> => {
    try {
      logger.debug('Fetching payment by order ID', { orderId });

      const payment = await repository.findByOrderId(orderId);

      if (!payment) {
        logger.warn('Payment not found for order', { orderId });
        return err(createNotFoundError('Payment', `order ${orderId}`));
      }

      return ok(toPaymentResponseDto(payment));
    } catch (error) {
      logger.error('Failed to fetch payment by order', { error, orderId });
      return err(createDatabaseError('Failed to fetch payment', error));
    }
  };

  /**
   * Get all payments with filtering and pagination
   */
  const getAllPayments = async (
    query: PaymentListQueryDto
  ): Promise<Result<PaymentListResponseDto, AppError>> => {
    try {
      logger.debug('Fetching payments list', { query });

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

      const response: PaymentListResponseDto = {
        data: toPaymentResponseDtoList(result.rows),
        pagination: {
          page,
          limit,
          total: result.count,
          totalPages,
        },
      };

      logger.debug('Payments list fetched successfully', {
        count: result.rows.length,
        total: result.count,
      });

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch payments list', { error, query });
      return err(createDatabaseError('Failed to fetch payments', error));
    }
  };

  /**
   * Mark payment as paid
   */
  const markAsPaid = async (
    id: string,
    dto: MarkAsPaidDto,
    actorUserId: string
  ): Promise<Result<PaymentResponseDto, AppError>> => {
    try {
      logger.info('Marking payment as paid', { paymentId: id });

      const payment = await repository.findById(id);

      if (!payment) {
        logger.warn('Payment not found', { paymentId: id });
        return err(createNotFoundError('Payment', id));
      }

      // Validate status transition
      if (
        !isValidPaymentStatusTransition(
          payment.status as PaymentStatus,
          PaymentStatus.PAID
        )
      ) {
        return err(
          createBusinessRuleError(
            `Cannot mark payment as paid with current status: ${payment.status}`
          )
        );
      }

      const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
      const updatedPayment = await repository.markAsPaid(
        id,
        paidAt,
        dto.transactionId
      );

      if (!updatedPayment) {
        return err(createDatabaseError('Failed to mark payment as paid'));
      }

      let paymentToReturn = updatedPayment;

      // Update notes if provided
      if (dto.notes) {
        const paymentWithNotes = await repository.update(id, { notes: dto.notes });
        if (paymentWithNotes) {
          paymentToReturn = paymentWithNotes;
        }
      }

      if (paymentToReturn.paymentType === PaymentType.REFUND) {
        await syncOrderRefundedStatusIfNeeded(paymentToReturn.orderId);
      } else {
        await syncOrderPaidStatusIfNeeded(paymentToReturn.orderId, actorUserId);
      }

      const finalPayment = await repository.findById(id);
      logger.info('Payment marked as paid successfully', { paymentId: id });

      return ok(toPaymentResponseDto(finalPayment ?? paymentToReturn));
    } catch (error) {
      if (isAppError(error)) {
        logger.warn('Failed to mark payment as paid due to business/app validation', {
          error,
          paymentId: id,
        });
        return err(error);
      }

      logger.error('Failed to mark payment as paid', { error, paymentId: id });
      return err(createDatabaseError('Failed to mark payment as paid', error));
    }
  };

  /**
   * Create refund payment for a paid order
   */
  const refundOrder = async (
    orderId: string,
    dto: CreateRefundPaymentDto
  ): Promise<Result<PaymentResponseDto, AppError>> => {
    try {
      logger.info('Creating refund payment', { orderId, amount: dto.amount });

      const order = await orderRepository.findById(orderId);

      if (!order) {
        return err(createNotFoundError('Order', orderId));
      }

      if (order.status !== OrderStatus.PAID) {
        return err(
          createBusinessRuleError(
            `Cannot refund order with status: ${order.status}. Only paid orders can be refunded.`
          )
        );
      }

      if (dto.amount <= 0) {
        return err(createInvalidInputError('Refund amount must be greater than 0'));
      }

      const totalPaidAmount = await repository.sumAmountByOrderIdAndStatus(
        orderId,
        PaymentStatus.PAID,
        PaymentType.PAYMENT
      );
      const totalRefundedAmount = await repository.sumAmountByOrderIdAndStatus(
        orderId,
        PaymentStatus.PAID,
        PaymentType.REFUND
      );

      const refundableAmount = toMoney(totalPaidAmount - totalRefundedAmount);
      const requestedAmount = toMoney(dto.amount);

      if (requestedAmount > refundableAmount + 0.01) {
        return err(
          createBusinessRuleError(
            `Refund amount exceeds refundable balance. Requested: ${requestedAmount}, refundable: ${refundableAmount}`
          )
        );
      }

      const refundPayment = await repository.create({
        orderId,
        paymentType: PaymentType.REFUND,
        amount: requestedAmount,
        method: dto.method,
        status: PaymentStatus.PENDING,
        transactionId: dto.transactionId ?? null,
        paidAt: null,
        notes: dto.notes ?? null,
        vietqrData: null,
      });

      const updatedOrder = await orderRepository.updateStatus(
        orderId,
        OrderStatus.REFUND_PENDING
      );
      if (!updatedOrder) {
        return err(createDatabaseError('Failed to update order status to refund pending'));
      }

      logger.info('Refund payment created successfully', {
        orderId,
        paymentId: refundPayment.id,
        amount: requestedAmount,
      });

      return ok(toPaymentResponseDto(refundPayment));
    } catch (error) {
      logger.error('Failed to create refund payment', { error, orderId, dto });
      return err(createDatabaseError('Failed to create refund payment', error));
    }
  };

  /**
   * Generate VietQR for order payment
   * Creates QR code for bank transfer
   */
  const generateVietQR = async (
    orderId: string
  ): Promise<Result<VietQRResponseDto, AppError>> => {
    try {
      logger.info('Generating VietQR', { orderId });

      // Find payment for order
      const payment = await repository.findByOrderId(orderId);

      if (!payment) {
        return err(
          createNotFoundError('Payment', `order ${orderId}`)
        );
      }

      // Only generate VietQR for VietQR payment method
      if (payment.method !== PaymentMethod.VIETQR) {
        return err(
          createBusinessRuleError(
            `Cannot generate VietQR for payment method: ${payment.method}`
          )
        );
      }

      // Generate VietQR data
      // Note: In production, fetch order details to get order number
      const orderNumber = orderId.substring(0, 8); // Simplified
      const addInfo = formatVietQRAddInfo(orderNumber);
      const bankConfig = await getVietQRBankConfig();

      const generated = await generateVietQRData(
        {
          bankBin: bankConfig.bankBin,
          accountNo: bankConfig.accountNo,
          accountName: bankConfig.accountName,
          amount: Number(payment.amount),
          addInfo,
          template: 'compact',
        },
        vietqrCredentials
      );

      if (generated.warning) {
        logger.warn('VietQR API unavailable, fallback to Quick Link', {
          orderId,
          paymentId: payment.id,
          warning: generated.warning,
        });
      }

      const vietqrData: VietQRData = {
        bankId: bankConfig.bankBin,
        accountNo: bankConfig.accountNo,
        accountName: generated.accountName,
        amount: Number(payment.amount),
        addInfo: generated.addInfo,
        template: generated.template,
        qrDataURL: generated.qrDataURL,
        qrContent: generated.qrContent,
      };

      // Store VietQR data in payment
      await repository.update(payment.id, {
        vietqrData: stringifyVietQRData(vietqrData),
      });

      const response: VietQRResponseDto = {
        qrDataURL: generated.qrDataURL,
        qrContent: generated.qrContent,
        bankId: vietqrData.bankId,
        accountNo: vietqrData.accountNo,
        accountName: vietqrData.accountName,
        amount: vietqrData.amount,
        addInfo: vietqrData.addInfo,
      };

      logger.info('VietQR generated successfully', { orderId, paymentId: payment.id });

      return ok(response);
    } catch (error) {
      logger.error('Failed to generate VietQR', { error, orderId });
      return err(createDatabaseError('Failed to generate VietQR', error));
    }
  };

  /**
   * Soft delete payment by ID
   * Marks payment as deleted without permanent removal
   */
  const deletePayment = async (
    id: string
  ): Promise<Result<boolean, AppError>> => {
    try {
      logger.info('Soft deleting payment', {
        paymentId: id,
        operation: 'soft_delete',
        metadata: {
          action: 'soft_delete',
          recoverable: true,
        },
      });

      const payment = await repository.findById(id);

      if (!payment) {
        logger.warn('Payment not found for deletion', { paymentId: id });
        return err(createNotFoundError('Payment', id));
      }

      const deleted = await repository.delete(id);

      if (!deleted) {
        logger.error('Failed to soft delete payment', { paymentId: id });
        return err(createDatabaseError('Failed to delete payment'));
      }

      logger.info('Payment soft deleted successfully', {
        paymentId: id,
        previousStatus: payment.status,
      });

      return ok(true);
    } catch (error) {
      logger.error('Failed to soft delete payment', { error, paymentId: id });
      return err(createDatabaseError('Failed to delete payment', error));
    }
  };

  /**
   * Restore soft-deleted payment by ID
   * Recovers a previously deleted payment
   */
  const restorePayment = async (
    id: string
  ): Promise<Result<PaymentResponseDto, AppError>> => {
    try {
      logger.info('Restoring payment', {
        paymentId: id,
        operation: 'restore',
        metadata: {
          action: 'restore',
          previousState: 'deleted',
        },
      });

      const restoredPayment = await repository.restore(id);

      if (!restoredPayment) {
        logger.warn('Payment not found or not deleted', { paymentId: id });
        return err(
          createNotFoundError('Deleted payment', id)
        );
      }

      logger.info('Payment restored successfully', {
        paymentId: id,
        currentStatus: restoredPayment.status,
      });

      return ok(toPaymentResponseDto(restoredPayment));
    } catch (error) {
      logger.error('Failed to restore payment', { error, paymentId: id });
      return err(createDatabaseError('Failed to restore payment', error));
    }
  };

  return {
    createPayment,
    getPaymentById,
    getPaymentByOrderId,
    getAllPayments,
    markAsPaid,
    refundOrder,
    generateVietQR,
    deletePayment,
    restorePayment,
  };
};
