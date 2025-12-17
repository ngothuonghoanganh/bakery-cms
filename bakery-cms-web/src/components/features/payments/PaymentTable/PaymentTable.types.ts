/**
 * PaymentTable component types
 */

import type { Payment } from '@/types/models/payment.model';

export type PaymentTableProps = {
  readonly payments: readonly Payment[];
  readonly loading?: boolean;
  readonly onView?: (payment: Payment) => void;
  readonly onEdit?: (payment: Payment) => void;
  readonly onDelete?: (id: string) => void;
  readonly onMarkAsPaid?: (id: string) => void;
};
