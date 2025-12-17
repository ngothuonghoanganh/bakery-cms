/**
 * PaymentDetail component types
 */

import type { Payment } from '@/types/models/payment.model';

export type PaymentDetailProps = {
  readonly payment: Payment;
  readonly loading?: boolean;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
  readonly onMarkAsPaid?: () => void;
  readonly onBack?: () => void;
};
