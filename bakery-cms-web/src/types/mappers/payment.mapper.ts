/**
 * Payment mappers
 * Transform API responses to domain models
 */

import type { PaymentAPIResponse, VietQRDataAPIResponse } from '@/types/api/payment.api';
import type { Payment, VietQRData } from '@/types/models/payment.model';
import { PaymentMethod, PaymentStatus } from '@/types/models/payment.model';

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
