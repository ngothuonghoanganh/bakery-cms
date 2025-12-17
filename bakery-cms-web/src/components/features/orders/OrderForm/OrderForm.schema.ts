/**
 * OrderForm validation schema using Zod
 */

import { z } from 'zod';
import { OrderType, BusinessModel, OrderStatus } from '../../../../types/models/order.model';

// Order item validation schema
export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(9999, 'Quantity cannot exceed 9999'),
  unitPrice: z
    .number()
    .min(0, 'Price must be non-negative')
    .max(999999999, 'Price is too large'),
});

// Order form validation schema
export const orderFormSchema = z.object({
  orderType: z.enum([OrderType.TEMPORARY, OrderType.OFFICIAL], {
    errorMap: () => ({ message: 'Order type is required' }),
  }),
  businessModel: z.enum([BusinessModel.MADE_TO_ORDER, BusinessModel.READY_TO_SELL], {
    errorMap: () => ({ message: 'Business model is required' }),
  }),
  customerName: z
    .string()
    .max(100, 'Customer name cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  customerPhone: z
    .string()
    .regex(/^[0-9+\-() ]*$/, 'Phone number can only contain digits and +, -, (, ), space')
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Cannot exceed 100 items per order'),
  status: z.enum(
    [OrderStatus.DRAFT, OrderStatus.CONFIRMED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    {
      errorMap: () => ({ message: 'Status is required' }),
    }
  ),
});

export type OrderFormSchemaType = z.infer<typeof orderFormSchema>;
