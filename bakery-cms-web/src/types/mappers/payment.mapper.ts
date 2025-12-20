/**
 * Payment mappers
 * Transform API responses to domain models
 */

import type {
  PaymentAPIResponse,
  VietQRDataAPIResponse,
  PaginatedPaymentsAPIResponse,
} from '@/types/api/payment.api';
import type { Payment, VietQRData } from '@/types/models/payment.model';
import { PaymentMethod, PaymentStatus } from '@/types/models/payment.model';

export type PaginatedPayments = {
  readonly payments: readonly Payment[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
};

/**
 * Map API response to Payment domain model
 */
export const mapPaymentFromAPI = (apiPayment: PaymentAPIResponse): Payment => ({
  id: apiPayment.id,
  orderId: apiPayment.orderId,
  amount: apiPayment.amount,
  method: apiPayment.method as PaymentMethod,
  status: apiPayment.status as PaymentStatus,
  transactionId: apiPayment.transactionId,
  vietqrData: apiPayment.vietqrData,
  notes: apiPayment.notes,
  paidAt: apiPayment.paidAt ? new Date(apiPayment.paidAt) : null,
  createdAt: new Date(apiPayment.createdAt),
  updatedAt: new Date(apiPayment.updatedAt),
});

/**
 * Map paginated API response to domain model
 */
export const mapPaginatedPaymentsFromAPI = (
  apiResponse: PaginatedPaymentsAPIResponse
): PaginatedPayments => ({
  payments: apiResponse.payments.map(mapPaymentFromAPI),
  total: apiResponse.total,
  page: apiResponse.page,
  pageSize: apiResponse.pageSize,
});

/**
 * Map API response to VietQRData domain model
 */
export const mapVietQRDataFromAPI = (apiData: VietQRDataAPIResponse): VietQRData => ({
  accountNo: apiData.accountNo,
  accountName: apiData.accountName,
  bankBin: apiData.bankBin,
  amount: apiData.amount,
  description: apiData.description,
  qrDataURL: apiData.qrDataURL,
});
