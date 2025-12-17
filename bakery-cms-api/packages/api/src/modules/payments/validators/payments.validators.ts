/**
 * Payment validation schemas using Joi
 * Validates request payloads for payments endpoints
 */

import Joi from 'joi';
import { PaymentMethod, PaymentStatus } from '@bakery-cms/common';

/**
 * UUID validation schema (reusable)
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

/**
 * Create payment validation schema
 * Validates POST /payments request body
 */
export const createPaymentSchema = Joi.object({
  orderId: uuidSchema.required().messages({
    'string.guid': 'Order ID must be a valid UUID',
    'any.required': 'Order ID is required',
  }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required',
    }),

  method: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .required()
    .messages({
      'any.only': `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
      'any.required': 'Payment method is required',
    }),

  transactionId: Joi.string()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Transaction ID must not exceed 255 characters',
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
});

/**
 * Update payment status validation schema
 * Validates PATCH /payments/:id/status request body
 */
export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(PaymentStatus))
    .required()
    .messages({
      'any.only': `Payment status must be one of: ${Object.values(PaymentStatus).join(', ')}`,
      'any.required': 'Payment status is required',
    }),

  transactionId: Joi.string()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Transaction ID must not exceed 255 characters',
    }),

  paidAt: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Paid at must be in ISO format',
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
});

/**
 * Mark as paid validation schema
 * Validates POST /payments/:id/mark-paid request body
 */
export const markAsPaidSchema = Joi.object({
  transactionId: Joi.string()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Transaction ID must not exceed 255 characters',
    }),

  paidAt: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Paid at must be in ISO format',
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
});

/**
 * Payment ID parameter validation schema
 * Validates :id route parameter
 */
export const paymentIdParamSchema = Joi.object({
  id: uuidSchema.required().messages({
    'string.guid': 'Payment ID must be a valid UUID',
    'any.required': 'Payment ID is required',
  }),
});

/**
 * Order ID parameter validation schema
 * Validates :orderId route parameter
 */
export const orderIdParamSchema = Joi.object({
  orderId: uuidSchema.required().messages({
    'string.guid': 'Order ID must be a valid UUID',
    'any.required': 'Order ID is required',
  }),
});

/**
 * Payment list query validation schema
 * Validates GET /payments query parameters
 */
export const paymentListQuerySchema = Joi.object({
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
    .valid(...Object.values(PaymentStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(PaymentStatus).join(', ')}`,
    }),

  method: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .optional()
    .messages({
      'any.only': `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
    }),

  orderId: uuidSchema.optional().messages({
    'string.guid': 'Order ID must be a valid UUID',
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
