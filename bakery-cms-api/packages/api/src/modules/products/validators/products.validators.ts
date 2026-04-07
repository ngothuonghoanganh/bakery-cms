/**
 * Product validation schemas using Joi
 * Validates request payloads for products endpoints
 */

import Joi from 'joi';
import {
  BusinessType,
  ProductStatus,
  ProductType,
  SaleUnitType,
} from '@bakery-cms/common';

/**
 * UUID validation schema (reusable)
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

const productCodeSchema = Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[A-Z0-9-]{3,50}$/)
  .messages({
    'string.empty': 'Product code cannot be empty',
    'string.pattern.base':
      'Product code must contain only uppercase letters, numbers, or hyphen (3-50 chars)',
  });

/**
 * Create product validation schema
 * Validates POST /products request body
 */
export const createProductSchema = Joi.object({
  productCode: productCodeSchema.optional(),

  name: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 1 character',
      'string.max': 'Product name must not exceed 255 characters',
      'any.required': 'Product name is required',
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required',
    }),

  saleUnitType: Joi.string()
    .valid(...Object.values(SaleUnitType))
    .optional()
    .default(SaleUnitType.PIECE)
    .messages({
      'any.only': `Sale unit type must be one of: ${Object.values(SaleUnitType).join(', ')}`,
    }),

  category: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Category must not exceed 100 characters',
    }),

  businessType: Joi.string()
    .valid(...Object.values(BusinessType))
    .required()
    .messages({
      'any.only': `Business type must be one of: ${Object.values(BusinessType).join(', ')}`,
      'any.required': 'Business type is required',
    }),

  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .optional()
    .default(ProductStatus.AVAILABLE)
    .messages({
      'any.only': `Status must be one of: ${Object.values(ProductStatus).join(', ')}`,
    }),

  productType: Joi.string()
    .valid(...Object.values(ProductType))
    .optional()
    .default(ProductType.SINGLE)
    .messages({
      'any.only': `Product type must be one of: ${Object.values(ProductType).join(', ')}`,
    }),

  isPublished: Joi.boolean()
    .optional()
    .default(true)
    .messages({
      'boolean.base': 'isPublished must be a boolean',
    }),

  imageUrl: Joi.string()
    .uri()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.uri': 'Image URL must be a valid URL',
      'string.max': 'Image URL must not exceed 500 characters',
    }),

  imageFileId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .allow(null)
    .optional()
    .messages({
      'string.guid': 'Image file ID must be a valid UUID',
    }),

  images: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        fileId: Joi.string()
          .uuid({ version: 'uuidv4' })
          .required()
          .messages({
            'string.guid': 'File ID must be a valid UUID',
            'any.required': 'File ID is required for each image',
          }),
        displayOrder: Joi.number().integer().min(0).optional(),
        isPrimary: Joi.boolean().optional(),
      })
    )
    .optional()
    .messages({
      'array.base': 'Images must be an array',
    }),

  comboItems: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        itemProductId: Joi.string()
          .uuid({ version: 'uuidv4' })
          .required()
          .messages({
            'string.guid': 'Item product ID must be a valid UUID',
            'any.required': 'Item product ID is required for each combo item',
          }),
        quantity: Joi.number()
          .positive()
          .precision(3)
          .required()
          .messages({
            'number.base': 'Quantity must be a number',
            'number.positive': 'Quantity must be greater than 0',
            'any.required': 'Quantity is required for each combo item',
          }),
        displayOrder: Joi.number().integer().min(0).optional(),
      })
    )
    .optional()
    .messages({
      'array.base': 'Combo items must be an array',
    }),
});

/**
 * Update product validation schema
 * Validates PATCH /products/:id request body
 */
export const updateProductSchema = Joi.object({
  productCode: productCodeSchema.optional(),

  name: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.min': 'Product name must be at least 1 character',
      'string.max': 'Product name must not exceed 255 characters',
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive',
    }),

  saleUnitType: Joi.string()
    .valid(...Object.values(SaleUnitType))
    .optional()
    .messages({
      'any.only': `Sale unit type must be one of: ${Object.values(SaleUnitType).join(', ')}`,
    }),

  category: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Category must not exceed 100 characters',
    }),

  businessType: Joi.string()
    .valid(...Object.values(BusinessType))
    .optional()
    .messages({
      'any.only': `Business type must be one of: ${Object.values(BusinessType).join(', ')}`,
    }),

  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(ProductStatus).join(', ')}`,
    }),

  productType: Joi.string()
    .valid(...Object.values(ProductType))
    .optional()
    .messages({
      'any.only': `Product type must be one of: ${Object.values(ProductType).join(', ')}`,
    }),

  isPublished: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isPublished must be a boolean',
    }),

  imageUrl: Joi.string()
    .uri()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.uri': 'Image URL must be a valid URL',
      'string.max': 'Image URL must not exceed 500 characters',
    }),

  imageFileId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .allow(null)
    .optional()
    .messages({
      'string.guid': 'Image file ID must be a valid UUID',
    }),

  images: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        fileId: Joi.string()
          .uuid({ version: 'uuidv4' })
          .required()
          .messages({
            'string.guid': 'File ID must be a valid UUID',
            'any.required': 'File ID is required for each image',
          }),
        displayOrder: Joi.number().integer().min(0).optional(),
        isPrimary: Joi.boolean().optional(),
      })
    )
    .optional()
    .messages({
      'array.base': 'Images must be an array',
    }),

  comboItems: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        itemProductId: Joi.string()
          .uuid({ version: 'uuidv4' })
          .required()
          .messages({
            'string.guid': 'Item product ID must be a valid UUID',
            'any.required': 'Item product ID is required for each combo item',
          }),
        quantity: Joi.number()
          .positive()
          .precision(3)
          .required()
          .messages({
            'number.base': 'Quantity must be a number',
            'number.positive': 'Quantity must be greater than 0',
            'any.required': 'Quantity is required for each combo item',
          }),
        displayOrder: Joi.number().integer().min(0).optional(),
      })
    )
    .optional()
    .messages({
      'array.base': 'Combo items must be an array',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
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
 * Product list query validation schema
 * Validates GET /products query parameters
 */
export const productListQuerySchema = Joi.object({
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

  businessType: Joi.string()
    .valid(...Object.values(BusinessType))
    .optional()
    .messages({
      'any.only': `Business type must be one of: ${Object.values(BusinessType).join(', ')}`,
    }),

  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(ProductStatus).join(', ')}`,
    }),

  productType: Joi.string()
    .valid(...Object.values(ProductType))
    .optional()
    .messages({
      'any.only': `Product type must be one of: ${Object.values(ProductType).join(', ')}`,
    }),

  saleUnitType: Joi.string()
    .valid(...Object.values(SaleUnitType))
    .optional()
    .messages({
      'any.only': `Sale unit type must be one of: ${Object.values(SaleUnitType).join(', ')}`,
    }),

  isPublished: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isPublished must be a boolean',
    }),

  category: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Category must not exceed 100 characters',
    }),

  search: Joi.string()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Search query must not exceed 255 characters',
    }),
});
