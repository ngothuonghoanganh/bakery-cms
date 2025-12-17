/**
 * PaymentFilters component types
 */

import type { PaymentMethod, PaymentStatus } from '@/types/models/payment.model';

export type PaymentFiltersValue = {
  readonly search?: string;
  readonly status?: PaymentStatus;
  readonly method?: PaymentMethod;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
};

export type PaymentFiltersProps = {
  readonly value?: PaymentFiltersValue;
  readonly onChange?: (value: PaymentFiltersValue) => void;
};
