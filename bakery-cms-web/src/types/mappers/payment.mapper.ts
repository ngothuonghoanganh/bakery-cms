/**
 * Payment mappers
 * Transform API responses to domain models
 */

import type {
  PaymentAPIResponse,
  PaymentOrderBasicAPIResponse,
  VietQRDataAPIResponse,
  PaginatedPaymentsAPIResponse,
} from '@/types/api/payment.api';
import type {
  OrderStatusType as OrderStatus,
  Payment,
  PaymentOrderBasic,
  PaymentTypeType as PaymentType,
  VietQRData,
} from '@/types/models/payment.model';
import { PaymentMethod, PaymentStatus } from '@/types/models/payment.model';

export type PaginatedPayments = {
  readonly payments: readonly Payment[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};

const mapPaymentOrderFromAPI = (
  apiOrder: PaymentOrderBasicAPIResponse
): PaymentOrderBasic => ({
  id: apiOrder.id,
  orderNumber: apiOrder.orderNumber,
  status: apiOrder.status as OrderStatus,
  customerName: apiOrder.customerName,
  customerPhone: apiOrder.customerPhone,
  totalAmount: apiOrder.totalAmount,
  createdAt: new Date(apiOrder.createdAt),
});

/**
 * Map API response to Payment domain model
 */
export const mapPaymentFromAPI = (apiPayment: PaymentAPIResponse): Payment => ({
  id: apiPayment.id,
  orderId: apiPayment.orderId,
  paymentType: (apiPayment.paymentType || 'payment') as PaymentType,
  amount: apiPayment.amount,
  method: apiPayment.method as PaymentMethod,
  status: apiPayment.status as PaymentStatus,
  transactionId: apiPayment.transactionId,
  vietqrData: apiPayment.vietqrData,
  notes: apiPayment.notes,
  paidAt: apiPayment.paidAt ? new Date(apiPayment.paidAt) : null,
  order: apiPayment.order ? mapPaymentOrderFromAPI(apiPayment.order) : null,
  createdAt: new Date(apiPayment.createdAt),
  updatedAt: new Date(apiPayment.updatedAt),
});

/**
 * Map paginated API response to domain model
 */
export const mapPaginatedPaymentsFromAPI = (
  apiResponse: PaginatedPaymentsAPIResponse
): PaginatedPayments => ({
  payments: apiResponse?.data?.map(mapPaymentFromAPI) ?? [],
  total: apiResponse.pagination?.total ?? apiResponse.total ?? 0,
  page: apiResponse.pagination?.page ?? apiResponse.page ?? 1,
  limit:
    apiResponse.pagination?.limit ??
    apiResponse.limit ??
    apiResponse.pageSize ??
    apiResponse.data.length,
  totalPages:
    apiResponse.pagination?.totalPages ??
    Math.max(
      1,
      Math.ceil(
        (apiResponse.pagination?.total ?? apiResponse.total ?? 0) /
          Math.max(
            1,
            apiResponse.pagination?.limit ??
              apiResponse.limit ??
              apiResponse.pageSize ??
              apiResponse.data.length
          )
      )
    ),
});

/**
 * Map API response to VietQRData domain model
 */
export const mapVietQRDataFromAPI = (apiData: VietQRDataAPIResponse): VietQRData => ({
  bankId: apiData.bankId,
  accountNo: apiData.accountNo,
  accountName: apiData.accountName,
  amount: apiData.amount,
  addInfo: apiData.addInfo,
  qrDataURL: apiData.qrDataURL,
  qrContent: apiData.qrContent,
});
