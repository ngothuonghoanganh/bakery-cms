/**
 * API response types for Payment endpoints
 */

export type PaymentAPIResponse = {
  readonly id: string;
  readonly orderId: string;
  readonly amount: number;
  readonly method: string;
  readonly status: string;
  readonly transactionId: string | null;
  readonly vietqrData: string | null;
  readonly notes: string | null;
  readonly paidAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type PaginatedPaymentsAPIResponse = {
  readonly payments: readonly PaymentAPIResponse[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
};

export type VietQRDataAPIResponse = {
  readonly accountNo: string;
  readonly accountName: string;
  readonly bankBin: string;
  readonly amount: number;
  readonly description: string;
  readonly qrDataURL: string;
};

export type CreatePaymentRequest = {
  readonly orderId: string;
  readonly amount: number;
  readonly method: string;
  readonly notes?: string;
};

export type UpdatePaymentRequest = {
  readonly amount?: number;
  readonly method?: string;
  readonly status?: string;
  readonly transactionId?: string;
  readonly notes?: string;
};

export type PaymentFiltersRequest = {
  readonly search?: string;
  readonly status?: string;
  readonly method?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly pageSize?: number;
};

export type MarkAsPaidRequest = {
  readonly transactionId?: string;
};

