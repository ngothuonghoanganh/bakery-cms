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
  PaginatedPaymentsAPIResponse,
  VietQRDataAPIResponse,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentFiltersRequest,
  MarkAsPaidRequest,
} from '@/types/api/payment.api';
import type { Payment, VietQRData } from '@/types/models/payment.model';
import type { PaginatedPayments } from '@/types/mappers/payment.mapper';
import { 
  mapPaymentFromAPI, 
  mapPaginatedPaymentsFromAPI, 
  mapVietQRDataFromAPI 
} from '@/types/mappers/payment.mapper';

/**
 * Payment service type definition
 */
export type PaymentService = {
  readonly getAll: (filters?: PaymentFiltersRequest) => Promise<Result<PaginatedPayments, AppError>>;
  readonly getById: (id: string) => Promise<Result<Payment | null, AppError>>;
  readonly create: (data: CreatePaymentRequest) => Promise<Result<Payment, AppError>>;
  readonly update: (id: string, data: UpdatePaymentRequest) => Promise<Result<Payment, AppError>>;
  readonly delete: (id: string) => Promise<Result<boolean, AppError>>;
  readonly getByOrderId: (orderId: string) => Promise<Result<Payment, AppError>>;
  readonly markAsPaid: (id: string, data?: MarkAsPaidRequest) => Promise<Result<Payment, AppError>>;
  readonly getVietQR: (paymentId: string) => Promise<Result<VietQRData, AppError>>;
};

/**
 * Get all payments with optional filters
 */
const getAll = async (
  filters?: PaymentFiltersRequest
): Promise<Result<PaginatedPayments, AppError>> => {
  try {
    const response = await apiClient.get<PaginatedPaymentsAPIResponse>('/payments', {
      params: filters,
    });
    const paginatedPayments = mapPaginatedPaymentsFromAPI(response.data);
    return ok(paginatedPayments);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get payment by ID
 */
const getById = async (id: string): Promise<Result<Payment | null, AppError>> => {
  try {
    const response = await apiClient.get<PaymentAPIResponse>(`/payments/${id}`);
    const payment = mapPaymentFromAPI(response.data);
    return ok(payment);
  } catch (error) {
    const appError = extractErrorFromAxiosError(error);
    if (appError.code === 'NOT_FOUND') {
      return ok(null);
    }
    return err(appError);
  }
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
 * Update a payment
 */
const update = async (
  id: string,
  data: UpdatePaymentRequest
): Promise<Result<Payment, AppError>> => {
  try {
    const response = await apiClient.put<PaymentAPIResponse>(`/payments/${id}`, data);
    const payment = mapPaymentFromAPI(response.data);
    return ok(payment);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Delete a payment
 */
const deletePaymentFunc = async (id: string): Promise<Result<boolean, AppError>> => {
  try {
    await apiClient.delete(`/payments/${id}`);
    return ok(true);
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
  getAll,
  getById,
  create,
  update,
  delete: deletePaymentFunc,
  getByOrderId,
  markAsPaid,
  getVietQR,
};

// Named exports for convenience
export const getAllPayments = getAll;
export const getPaymentById = getById;
export const createPayment = create;
export const updatePayment = update;
export const deletePayment = deletePaymentFunc;
export const getPaymentByOrderId = getByOrderId;
export const markPaymentAsPaid = markAsPaid;
export const getPaymentVietQR = getVietQR;

