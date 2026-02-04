/**
 * Brands validation schemas using Joi
 * Validates request payloads for brands endpoints
 */

import Joi from 'joi';

/**
 * UUID validation schema (reusable)
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

/**
 * Create brand validation schema
 * Validates POST /brands request body
 */
export const createBrandSchema = Joi.object({
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

  isActive: Joi.boolean()
    .optional()
    .default(true)
    .messages({
      'boolean.base': 'Is active must be a boolean',
    }),

  imageFileId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Image file ID must be a valid UUID',
    }),
});

/**
 * Update brand validation schema
 * Validates PATCH /brands/:id request body
 */
export const updateBrandSchema = Joi.object({
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

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Is active must be a boolean',
    }),

  imageFileId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Image file ID must be a valid UUID',
    }),
});

/**
 * Brand ID parameter validation schema
 * Validates :id route parameter
 */
export const brandIdParamSchema = Joi.object({
  id: uuidSchema.required().messages({
    'string.guid': 'Brand ID must be a valid UUID',
    'any.required': 'Brand ID is required',
  }),
});

/**
 * Brand list query validation schema
 * Validates GET /brands query parameters
 */
export const brandListQuerySchema = Joi.object({
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

  search: Joi.string()
    .trim()
    .optional()
    .messages({
      'string.base': 'Search must be a string',
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Is active must be a boolean',
    }),
});

/**
 * Add brand to stock item validation schema
 * Validates POST /stock-items/:id/brands request body
 */
export const addBrandToStockItemSchema = Joi.object({
  brandId: uuidSchema.required().messages({
    'string.guid': 'Brand ID must be a valid UUID',
    'any.required': 'Brand ID is required',
  }),

  priceBeforeTax: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price before tax must be a number',
      'number.positive': 'Price before tax must be positive',
      'any.required': 'Price before tax is required',
    }),

  priceAfterTax: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price after tax must be a number',
      'number.positive': 'Price after tax must be positive',
      'any.required': 'Price after tax is required',
    }),

  isPreferred: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'Is preferred must be a boolean',
    }),
});

/**
 * Update stock item brand validation schema
 * Validates PATCH /stock-items/:stockItemId/brands/:brandId request body
 */
export const updateStockItemBrandSchema = Joi.object({
  priceBeforeTax: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Price before tax must be a number',
      'number.positive': 'Price before tax must be positive',
    }),

  priceAfterTax: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Price after tax must be a number',
      'number.positive': 'Price after tax must be positive',
    }),

  isPreferred: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Is preferred must be a boolean',
    }),
});
