/**
 * Stock items validation schemas using Joi
 * Validates request payloads for stock items endpoints
 */

import Joi from 'joi';
import { StockItemStatus } from '@bakery-cms/common';

/**
 * UUID validation schema (reusable)
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

/**
 * Create stock item validation schema
 * Validates POST /stock-items request body
 */
export const createStockItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must be at least 1 character',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required',
    }),

  description: Joi.string()
    .trim()
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Description must be a string',
    }),

  unitOfMeasure: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.base': 'Unit of measure must be a string',
      'string.empty': 'Unit of measure cannot be empty',
      'string.min': 'Unit of measure must be at least 1 character',
      'string.max': 'Unit of measure must not exceed 50 characters',
      'any.required': 'Unit of measure is required',
    }),

  currentQuantity: Joi.number()
    .min(0)
    .precision(3)
    .optional()
    .default(0)
    .messages({
      'number.base': 'Current quantity must be a number',
      'number.min': 'Current quantity must be at least 0',
    }),

  reorderThreshold: Joi.number()
    .min(0)
    .precision(3)
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Reorder threshold must be a number',
      'number.min': 'Reorder threshold must be at least 0',
    }),
});

/**
 * Update stock item validation schema
 * Validates PATCH /stock-items/:id request body
 */
export const updateStockItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must be at least 1 character',
      'string.max': 'Name must not exceed 255 characters',
    }),

  description: Joi.string()
    .trim()
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Description must be a string',
    }),

  unitOfMeasure: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.base': 'Unit of measure must be a string',
      'string.empty': 'Unit of measure cannot be empty',
      'string.min': 'Unit of measure must be at least 1 character',
      'string.max': 'Unit of measure must not exceed 50 characters',
    }),

  reorderThreshold: Joi.number()
    .min(0)
    .precision(3)
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Reorder threshold must be a number',
      'number.min': 'Reorder threshold must be at least 0',
    }),
});

/**
 * Receive stock validation schema
 * Validates POST /stock-items/:id/receive request body
 */
export const receiveStockSchema = Joi.object({
  quantity: Joi.number()
    .positive()
    .precision(3)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.positive': 'Quantity must be positive',
      'any.required': 'Quantity is required',
    }),

  reason: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Reason must be a string',
      'string.max': 'Reason must not exceed 500 characters',
    }),
});

/**
 * Adjust stock validation schema
 * Validates POST /stock-items/:id/adjust request body
 */
export const adjustStockSchema = Joi.object({
  quantity: Joi.number()
    .precision(3)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'any.required': 'Quantity is required',
    }),

  reason: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.base': 'Reason must be a string',
      'string.empty': 'Reason cannot be empty',
      'string.min': 'Reason must be at least 1 character',
      'string.max': 'Reason must not exceed 500 characters',
      'any.required': 'Reason is required',
    }),
});

/**
 * Stock item ID parameter validation schema
 * Validates :id route parameter
 */
export const stockItemIdParamSchema = Joi.object({
  id: uuidSchema.required().messages({
    'string.guid': 'Stock item ID must be a valid UUID',
    'any.required': 'Stock item ID is required',
  }),
});

/**
 * Stock item list query validation schema
 * Validates GET /stock-items query parameters
 */
export const stockItemListQuerySchema = Joi.object({
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
    .valid(...Object.values(StockItemStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(StockItemStatus).join(', ')}`,
    }),

  search: Joi.string()
    .trim()
    .optional()
    .messages({
      'string.base': 'Search must be a string',
    }),

  lowStockOnly: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Low stock only must be a boolean',
    }),
});
