/**
 * Order validation schemas using Joi
 * Validates request payloads for orders endpoints
 */

import Joi from 'joi';
import { OrderStatus, OrderType, BusinessModel } from '@bakery-cms/common';

/**
 * UUID validation schema (reusable)
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

/**
 * Phone number validation schema (Vietnamese format)
 */
const phoneSchema = Joi.string()
  .pattern(/^(\+84|0)[0-9]{9,10}$/)
  .messages({
    'string.pattern.base': 'Phone number must be a valid Vietnamese phone number',
  });

/**
 * Order item validation schema
 */
const orderItemSchema = Joi.object({
  id: uuidSchema.optional(),
  productId: uuidSchema.required().messages({
    'string.guid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),
  unitPrice: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Unit price must be a number',
      'number.positive': 'Unit price must be positive',
      'any.required': 'Unit price is required',
    }),
  subtotal: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Subtotal must be a number',
      'number.positive': 'Subtotal must be positive',
      'any.required': 'Subtotal is required',
    }),
  notes: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Item notes must not exceed 500 characters',
    }),
});

/**
 * Create order validation schema
 * Validates POST /orders request body
 */
export const createOrderSchema = Joi.object({
  orderType: Joi.string()
    .valid(...Object.values(OrderType))
    .required()
    .messages({
      'any.only': `Order type must be one of: ${Object.values(OrderType).join(', ')}`,
      'any.required': 'Order type is required',
    }),

  businessModel: Joi.string()
    .valid(...Object.values(BusinessModel))
    .required()
    .messages({
      'any.only': `Business model must be one of: ${Object.values(BusinessModel).join(', ')}`,
      'any.required': 'Business model is required',
    }),

  customerName: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Customer name must not exceed 255 characters',
    }),

  customerPhone: phoneSchema.allow('', null).optional(),

  notes: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 1000 characters',
    }),

  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one order item is required',
      'any.required': 'Order items are required',
    }),
});

/**
 * Update order validation schema
 * Validates PATCH /orders/:id request body
 */
export const updateOrderSchema = Joi.object({
  orderType: Joi.string()
    .valid(...Object.values(OrderType))
    .optional()
    .messages({
      'any.only': `Order type must be one of: ${Object.values(OrderType).join(', ')}`,
    }),

  businessModel: Joi.string()
    .valid(...Object.values(BusinessModel))
    .optional()
    .messages({
      'any.only': `Business model must be one of: ${Object.values(BusinessModel).join(', ')}`,
    }),

  customerName: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Customer name must not exceed 255 characters',
    }),

  customerPhone: phoneSchema.allow('', null).optional(),

  notes: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 1000 characters',
    }),

  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .optional()
    .messages({
      'array.min': 'At least one order item is required if items are provided',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Order ID parameter validation schema
 * Validates :id route parameter
 */
export const orderIdParamSchema = Joi.object({
  id: uuidSchema.required().messages({
    'string.guid': 'Order ID must be a valid UUID',
    'any.required': 'Order ID is required',
  }),
});

/**
 * Order list query validation schema
 * Validates GET /orders query parameters
 */
export const orderListQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),

  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
    }),

  orderType: Joi.string()
    .valid(...Object.values(OrderType))
    .optional()
    .messages({
      'any.only': `Order type must be one of: ${Object.values(OrderType).join(', ')}`,
    }),

  businessModel: Joi.string()
    .valid(...Object.values(BusinessModel))
    .optional()
    .messages({
      'any.only': `Business model must be one of: ${Object.values(BusinessModel).join(', ')}`,
    }),

  search: Joi.string()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Search query must not exceed 255 characters',
    }),

  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format',
    }),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date',
    }),
});

/**
 * Confirm order validation schema
 * Validates POST /orders/:id/confirm request body
 */
export const confirmOrderSchema = Joi.object({
  confirmedAt: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Confirmed at must be in ISO format',
    }),
});

/**
 * Cancel order validation schema
 * Validates POST /orders/:id/cancel request body
 */
export const cancelOrderSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Cancellation reason must not exceed 500 characters',
    }),
});
