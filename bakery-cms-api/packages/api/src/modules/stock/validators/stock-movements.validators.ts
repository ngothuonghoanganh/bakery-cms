/**
 * Stock movements validation schemas using Joi
 * Validates request payloads for stock movements endpoints
 */

import Joi from 'joi';
import { MovementType } from '@bakery-cms/common';

/**
 * UUID validation schema (reusable)
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

/**
 * Stock movement ID parameter validation schema
 * Validates :id route parameter
 */
export const stockMovementIdParamSchema = Joi.object({
  id: uuidSchema.required().messages({
    'string.guid': 'Stock movement ID must be a valid UUID',
    'any.required': 'Stock movement ID is required',
  }),
});

/**
 * Stock movement list query validation schema
 * Validates GET /stock-movements query parameters
 */
export const stockMovementListQuerySchema = Joi.object({
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

  stockItemId: uuidSchema.optional().messages({
    'string.guid': 'Stock item ID must be a valid UUID',
  }),

  type: Joi.string()
    .valid(...Object.values(MovementType))
    .optional()
    .messages({
      'any.only': `Type must be one of: ${Object.values(MovementType).join(', ')}`,
    }),

  userId: uuidSchema.optional().messages({
    'string.guid': 'User ID must be a valid UUID',
  }),

  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO 8601 format',
    }),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO 8601 format',
      'date.min': 'End date must be after or equal to start date',
    }),
});
