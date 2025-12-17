/**
 * PaymentForm validation schema
 */

import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@/types/models/payment.model';

export const paymentFormSchema = z.object({
  orderId: z.string().min(1, 'Order is required'),
  amount: z.number().positive('Amount must be positive'),
  method: z.nativeEnum(PaymentMethod, { required_error: 'Payment method is required' }),
  status: z.nativeEnum(PaymentStatus, { required_error: 'Payment status is required' }),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentFormSchema = z.infer<typeof paymentFormSchema>;
