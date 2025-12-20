/**
 * Payment domain model
 * Represents payment data in the frontend domain layer
 */

import { PaymentMethod, PaymentStatus } from '@bakery-cms/common';

// Re-export for backward compatibility
export { PaymentMethod, PaymentStatus };
export type {
  PaymentMethod as PaymentMethodType,
  PaymentStatus as PaymentStatusType,
} from '@bakery-cms/common';

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
