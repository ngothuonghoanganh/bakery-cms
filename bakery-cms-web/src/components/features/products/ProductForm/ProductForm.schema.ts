import { z } from 'zod';
import { BusinessType, ProductStatus } from '../../../../types/models/product.model';

export const productFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(255, 'Product name must not exceed 255 characters'),

  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),

  price: z
    .number({ required_error: 'Price is required' })
    .positive('Price must be greater than 0')
    .max(999999.99, 'Price must not exceed 999,999.99'),

  category: z.string().max(100, 'Category must not exceed 100 characters').optional(),

  businessType: z.enum([BusinessType.MADE_TO_ORDER, BusinessType.READY_TO_SELL, BusinessType.BOTH], {
    required_error: 'Business type is required',
  }),

  status: z.enum([ProductStatus.AVAILABLE, ProductStatus.OUT_OF_STOCK], {
    required_error: 'Status is required',
  }),

  imageUrl: z.string().url('Image URL must be a valid URL').optional().or(z.literal('')),
});

export type ProductFormSchema = z.infer<typeof productFormSchema>;
