/**
 * Payment domain model
 * Represents payment data in the frontend domain layer
 */

export const PaymentMethod = {
  CASH: 'cash',
  VIETQR: 'vietqr',
  BANK_TRANSFER: 'bank_transfer',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export type Payment = {
  readonly id: string;
  readonly orderId: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly transactionId: string | null;
  readonly vietqrData: string | null;
  readonly notes: string | null;
  readonly paidAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type VietQRData = {
  readonly accountNo: string;
  readonly accountName: string;
  readonly bankBin: string;
  readonly amount: number;
  readonly description: string;
  readonly qrDataURL: string;
};
