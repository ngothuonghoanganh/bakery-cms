/**
 * File validation schemas using Joi
 * Validates request payloads for files endpoints
 */

import Joi from 'joi';

/**
 * UUID validation schema (reusable)
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

/**
 * File ID parameter validation schema
 * Validates :id route parameter
 */
export const fileIdParamSchema = Joi.object({
  id: uuidSchema.required().messages({
    'string.guid': 'File ID must be a valid UUID',
    'any.required': 'File ID is required',
  }),
});

/**
 * File list query validation schema
 * Validates GET /files query parameters
 */
export const fileListQuerySchema = Joi.object({
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
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),

  mimeType: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'MIME type filter must not exceed 100 characters',
    }),

  uploadedBy: uuidSchema.optional().messages({
    'string.guid': 'Uploaded by must be a valid UUID',
  }),
});

/**
 * Download query validation schema
 * Validates GET /files/:id/download query parameters
 */
export const downloadQuerySchema = Joi.object({
  disposition: Joi.string()
    .valid('inline', 'attachment')
    .optional()
    .default('inline')
    .messages({
      'any.only': 'Disposition must be either inline or attachment',
    }),
});
