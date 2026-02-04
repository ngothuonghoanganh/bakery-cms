/**
 * Payment services
 * Business logic layer for payments
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { AppError, PaymentStatus, PaymentMethod } from '@bakery-cms/common';
import { PaymentRepository } from '../repositories/payments.repositories';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  PaymentListQueryDto,
  PaymentListResponseDto,
  VietQRData,
  VietQRResponseDto,
  MarkAsPaidDto,
} from '../dto/payments.dto';
import {
  toPaymentResponseDto,
  toPaymentResponseDtoList,
  toPaymentCreationAttributes,
  stringifyVietQRData,
} from '../mappers/payments.mappers';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
  createBusinessRuleError,
  createConflictError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Payment service interface
 * Defines all business operations for payments
 */
export interface PaymentService {
  createPayment(dto: CreatePaymentDto): Promise<Result<PaymentResponseDto, AppError>>;
  getPaymentById(id: string): Promise<Result<PaymentResponseDto, AppError>>;
  getPaymentByOrderId(orderId: string): Promise<Result<PaymentResponseDto, AppError>>;
  getAllPayments(query: PaymentListQueryDto): Promise<Result<PaymentListResponseDto, AppError>>;
  markAsPaid(id: string, dto: MarkAsPaidDto): Promise<Result<PaymentResponseDto, AppError>>;
  generateVietQR(orderId: string): Promise<Result<VietQRResponseDto, AppError>>;
  deletePayment(id: string): Promise<Result<boolean, AppError>>;
  restorePayment(id: string): Promise<Result<PaymentResponseDto, AppError>>;
}

/**
 * VietQR bank configuration
 * In production, this should come from environment variables
 */
interface VietQRBankConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
}

const VIETQR_CONFIG: VietQRBankConfig = {
  bankId: 'VCB', // Vietcombank
  accountNo: '0123456789',
  accountName: 'NGUYEN VAN A',
};

/**
 * Generate VietQR content string
 * Pure function that creates VietQR standard format
 * Format: https://www.vietqr.io/danh-sach-api
 */
export const generateVietQRContent = (
  bankId: string,
  accountNo: string,
  amount: number,
  addInfo: string
): string => {
  // VietQR format follows EMVCo standard
  // For simplicity, we'll use a basic format
  // In production, use proper VietQR library or API
  const amountStr = amount.toFixed(0);
  const content = `${bankId}|${accountNo}|${amountStr}|${addInfo}`;
  return content;
};

/**
 * Generate VietQR data URL (QR code image)
 * Pure function that creates QR code using third-party service
 * In production, consider using local QR generation library or VietQR API
 */
export const generateVietQRDataURL = (content: string): string => {
  // Using QuickChart API for QR code generation (free, no auth required)
  // Alternative: Use VietQR.io API or a local library like 'qrcode'
  const encodedContent = encodeURIComponent(content);
  const size = 300;
  return `https://quickchart.io/qr?text=${encodedContent}&size=${size}`;
};

/**
 * Format order number for VietQR addInfo
 * Pure function that creates payment description
 */
const formatVietQRAddInfo = (orderNumber: string): string => {
  return `Thanh toan don hang ${orderNumber}`;
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
  repository: PaymentRepository
): PaymentService => {
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
    dto: MarkAsPaidDto
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

      // Update notes if provided
      if (dto.notes) {
        await repository.update(id, { notes: dto.notes });
        const finalPayment = await repository.findById(id);
        if (finalPayment) {
          logger.info('Payment marked as paid successfully', { paymentId: id });
          return ok(toPaymentResponseDto(finalPayment));
        }
      }

      logger.info('Payment marked as paid successfully', { paymentId: id });

      return ok(toPaymentResponseDto(updatedPayment));
    } catch (error) {
      logger.error('Failed to mark payment as paid', { error, paymentId: id });
      return err(createDatabaseError('Failed to mark payment as paid', error));
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

      const vietqrData: VietQRData = {
        bankId: VIETQR_CONFIG.bankId,
        accountNo: VIETQR_CONFIG.accountNo,
        accountName: VIETQR_CONFIG.accountName,
        amount: Number(payment.amount),
        addInfo,
        template: 'compact',
      };

      // Generate QR content and data URL
      const qrContent = generateVietQRContent(
        vietqrData.bankId,
        vietqrData.accountNo,
        vietqrData.amount,
        vietqrData.addInfo
      );

      const qrDataURL = generateVietQRDataURL(qrContent);

      // Store VietQR data in payment
      await repository.update(payment.id, {
        vietqrData: stringifyVietQRData(vietqrData),
      });

      const response: VietQRResponseDto = {
        qrDataURL,
        qrContent,
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
    generateVietQR,
    deletePayment,
    restorePayment,
  };
};
