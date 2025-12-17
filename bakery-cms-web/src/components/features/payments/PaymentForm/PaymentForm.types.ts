/**
 * PaymentForm component types
 */

import type { PaymentMethod, PaymentStatus } from '@/types/models/payment.model';

export type PaymentFormValues = {
  readonly orderId: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly transactionId?: string;
  readonly notes?: string;
};

export type PaymentFormProps = {
  readonly visible: boolean;
  readonly initialValues?: PaymentFormValues;
  readonly onSubmit: (values: PaymentFormValues) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly loading?: boolean;
};
