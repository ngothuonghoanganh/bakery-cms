/**
 * Payment mappers
 * Transform between Sequelize models and DTOs
 */

import { PaymentModel } from '@bakery-cms/database';
import { PaymentMethod, PaymentStatus } from '@bakery-cms/common';
import {
  PaymentResponseDto,
  CreatePaymentDto,
  VietQRData,
} from '../dto/payments.dto';

/**
 * Parse VietQR data from JSON string
 * Pure function that safely parses stored JSON
 */
const parseVietQRData = (vietqrData: string | null): VietQRData | null => {
  if (!vietqrData) {
    return null;
  }

  try {
    return JSON.parse(vietqrData) as VietQRData;
  } catch {
    return null;
  }
};

/**
 * Map PaymentModel to PaymentResponseDto
 * Pure function that transforms database entity to API response
 */
export const toPaymentResponseDto = (model: PaymentModel): PaymentResponseDto => {
  return {
    id: model.id,
    orderId: model.orderId,
    amount: Number(model.amount),
    method: model.method as PaymentMethod,
    status: model.status as PaymentStatus,
    transactionId: model.transactionId,
    vietqrData: parseVietQRData(model.vietqrData),
    paidAt: model.paidAt ? model.paidAt.toISOString() : null,
    notes: model.notes,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
};

/**
 * Map array of PaymentModel to array of PaymentResponseDto
 * Pure function for batch transformation
 */
export const toPaymentResponseDtoList = (
  models: PaymentModel[]
): PaymentResponseDto[] => {
  return models.map(toPaymentResponseDto);
};

/**
 * Map CreatePaymentDto to PaymentModel creation attributes
 * Pure function that prepares data for model creation
 */
export const toPaymentCreationAttributes = (
  dto: CreatePaymentDto
): Partial<PaymentModel> => {
  return {
    orderId: dto.orderId,
    amount: dto.amount,
    method: dto.method,
    status: PaymentStatus.PENDING,
    transactionId: dto.transactionId ?? null,
    vietqrData: null,
    paidAt: null,
    notes: dto.notes ?? null,
  };
};

/**
 * Stringify VietQR data for storage
 * Pure function that converts object to JSON string
 */
export const stringifyVietQRData = (data: VietQRData): string => {
  return JSON.stringify(data);
};
