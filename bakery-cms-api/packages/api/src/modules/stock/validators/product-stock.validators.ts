/**
 * Product-stock validation schemas using Joi
 * Validates request payloads for product stock items endpoints
 */

import Joi from 'joi';

/**
 * UUID validation schema (reusable)
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

/**
 * Add stock item to product validation schema
 * Validates POST /products/:id/stock-items request body
 */
export const addStockItemToProductSchema = Joi.object({
  stockItemId: uuidSchema.required().messages({
    'string.guid': 'Stock item ID must be a valid UUID',
    'any.required': 'Stock item ID is required',
  }),

  quantity: Joi.number()
    .positive()
    .precision(3)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.positive': 'Quantity must be positive',
      'any.required': 'Quantity is required',
    }),

  preferredBrandId: uuidSchema.optional().messages({
    'string.guid': 'Preferred brand ID must be a valid UUID',
  }),

  notes: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Notes must be a string',
      'string.max': 'Notes must not exceed 500 characters',
    }),
});

/**
 * Update product stock item validation schema
 * Validates PATCH /products/:id/stock-items/:stockItemId request body
 */
export const updateProductStockItemSchema = Joi.object({
  quantity: Joi.number()
    .positive()
    .precision(3)
    .optional()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.positive': 'Quantity must be positive',
    }),

  preferredBrandId: uuidSchema.allow(null).optional().messages({
    'string.guid': 'Preferred brand ID must be a valid UUID',
  }),

  notes: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Notes must be a string',
      'string.max': 'Notes must not exceed 500 characters',
    }),
});

/**
 * Product ID parameter validation schema
 * Validates :id route parameter
 */
export const productIdParamSchema = Joi.object({
  id: uuidSchema.required().messages({
    'string.guid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
});

/**
 * Stock item ID parameter validation schema
 * Validates :stockItemId route parameter
 */
export const stockItemIdParamSchema = Joi.object({
  stockItemId: uuidSchema.required().messages({
    'string.guid': 'Stock item ID must be a valid UUID',
    'any.required': 'Stock item ID is required',
  }),
});
