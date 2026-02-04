/**
 * Product Images validators
 * Joi schemas for request validation
 */

import Joi from 'joi';

/**
 * Add product image schema
 */
export const addProductImageSchema = Joi.object({
  fileId: Joi.string().uuid().required().messages({
    'string.guid': 'File ID must be a valid UUID',
    'any.required': 'File ID is required',
  }),
  displayOrder: Joi.number().integer().min(0).optional().messages({
    'number.integer': 'Display order must be an integer',
    'number.min': 'Display order must be at least 0',
  }),
  isPrimary: Joi.boolean().optional(),
});

/**
 * Update product image schema
 */
export const updateProductImageSchema = Joi.object({
  displayOrder: Joi.number().integer().min(0).optional().messages({
    'number.integer': 'Display order must be an integer',
    'number.min': 'Display order must be at least 0',
  }),
  isPrimary: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Reorder product images schema
 */
export const reorderProductImagesSchema = Joi.object({
  imageIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one image ID is required',
      'any.required': 'Image IDs are required',
    }),
});
