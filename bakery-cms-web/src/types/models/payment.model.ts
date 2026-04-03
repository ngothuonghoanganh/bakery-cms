/**
 * Payment domain model
 * Represents payment data in the frontend domain layer
 */

import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '@bakery-cms/common';

// Re-export for backward compatibility
export { OrderStatus, PaymentMethod, PaymentStatus, PaymentType };
export type {
  OrderStatus as OrderStatusType,
  PaymentMethod as PaymentMethodType,
  PaymentStatus as PaymentStatusType,
  PaymentType as PaymentTypeType,
} from '@bakery-cms/common';

export type Payment = {
  readonly id: string;
  readonly orderId: string;
  readonly paymentType: PaymentType;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly transactionId: string | null;
  readonly vietqrData: VietQRData | null;
  readonly notes: string | null;
  readonly paidAt: Date | null;
  readonly order?: PaymentOrderBasic | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type PaymentOrderBasic = {
  readonly id: string;
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly totalAmount: number;
  readonly createdAt: Date;
};

export type VietQRData = {
  readonly bankId: string;
  readonly accountNo: string;
  readonly accountName: string;
  readonly amount: number;
  readonly addInfo: string;
  readonly template?: string;
  readonly qrDataURL?: string;
  readonly qrContent?: string;
};
