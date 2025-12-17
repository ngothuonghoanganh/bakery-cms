/**
 * Payment service
 * Handles all payment-related API calls with Result type pattern
 */

import { apiClient, extractErrorFromAxiosError } from './api/client';
import type { Result } from '@/types/common/result.types';
import { ok, err } from '@/types/common/result.types';
import type { AppError } from '@/types/common/error.types';
import type {
  PaymentAPIResponse,
  VietQRDataAPIResponse,
  CreatePaymentRequest,
  MarkAsPaidRequest,
} from '@/types/api/payment.api';
import type { Payment, VietQRData } from '@/types/models/payment.model';
import { mapPaymentFromAPI, mapVietQRDataFromAPI } from '@/types/mappers/payment.mapper';

/**
 * Payment service type definition
 */
export type PaymentService = {
  readonly create: (data: CreatePaymentRequest) => Promise<Result<Payment, AppError>>;
  readonly getByOrderId: (orderId: string) => Promise<Result<Payment, AppError>>;
  readonly markAsPaid: (id: string, data?: MarkAsPaidRequest) => Promise<Result<Payment, AppError>>;
  readonly getVietQR: (paymentId: string) => Promise<Result<VietQRData, AppError>>;
};

/**
 * Create a new payment
 */
const create = async (data: CreatePaymentRequest): Promise<Result<Payment, AppError>> => {
  try {
    const response = await apiClient.post<PaymentAPIResponse>('/payments', data);
    const payment = mapPaymentFromAPI(response.data);
    return ok(payment);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get payment by order ID
 */
const getByOrderId = async (orderId: string): Promise<Result<Payment, AppError>> => {
  try {
    const response = await apiClient.get<PaymentAPIResponse>(`/payments/order/${orderId}`);
    const payment = mapPaymentFromAPI(response.data);
    return ok(payment);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Mark payment as paid
 */
const markAsPaid = async (id: string, data?: MarkAsPaidRequest): Promise<Result<Payment, AppError>> => {
  try {
    const response = await apiClient.post<PaymentAPIResponse>(`/payments/${id}/mark-paid`, data);
    const payment = mapPaymentFromAPI(response.data);
    return ok(payment);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get VietQR data for payment
 */
const getVietQR = async (paymentId: string): Promise<Result<VietQRData, AppError>> => {
  try {
    const response = await apiClient.get<VietQRDataAPIResponse>(`/payments/${paymentId}/vietqr`);
    const vietqrData = mapVietQRDataFromAPI(response.data);
    return ok(vietqrData);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Payment service instance
 */
export const paymentService: PaymentService = {
  create,
  getByOrderId,
  markAsPaid,
  getVietQR,
};
