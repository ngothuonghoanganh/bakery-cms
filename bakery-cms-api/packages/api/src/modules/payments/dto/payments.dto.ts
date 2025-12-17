/**
 * Payment DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { PaymentMethod, PaymentStatus } from '@bakery-cms/common';

/**
 * VietQR data structure
 * Contains information for VietQR payment generation
 */
export interface VietQRData {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
  template: string;
}

/**
 * VietQR response DTO
 * Contains the generated QR code data
 */
export interface VietQRResponseDto {
  qrDataURL: string;
  qrContent: string;
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
}

/**
 * Payment response DTO
 * Returned in API responses
 */
export interface PaymentResponseDto {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string | null;
  vietqrData: VietQRData | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create payment request DTO
 * Expected in POST /payments
 */
export interface CreatePaymentDto {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  notes?: string;
}

/**
 * Update payment status request DTO
 * Expected in PATCH /payments/:id/status
 */
export interface UpdatePaymentStatusDto {
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  notes?: string;
}

/**
 * Mark payment as paid request DTO
 * Expected in POST /payments/:id/mark-paid
 */
export interface MarkAsPaidDto {
  transactionId?: string;
  paidAt?: string;
  notes?: string;
}

/**
 * Payment list query parameters
 * Expected in GET /payments
 */
export interface PaymentListQueryDto {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  orderId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Paginated payment list response
 */
export interface PaymentListResponseDto {
  data: PaymentResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
