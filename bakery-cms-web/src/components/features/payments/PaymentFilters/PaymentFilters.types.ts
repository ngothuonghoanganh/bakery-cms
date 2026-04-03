/**
 * PaymentFilters component types
 */

import type { PaymentMethod, PaymentStatus, PaymentType } from '@/types/models/payment.model';

export type PaymentFiltersValue = {
  readonly orderId?: string;
  readonly search?: string;
  readonly paymentType?: PaymentType;
  readonly status?: PaymentStatus;
  readonly method?: PaymentMethod;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
};

export type PaymentFiltersProps = {
  readonly value?: PaymentFiltersValue;
  readonly onChange?: (value: PaymentFiltersValue) => void;
};
