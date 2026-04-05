/**
 * Settings validation schemas using Joi
 */

import Joi from 'joi';

/**
 * Update bank receiver settings schema
 * Validates PUT /settings/system/bank-receiver request body
 */
export const updateBankReceiverSchema = Joi.object({
  bankBin: Joi.string()
    .trim()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'Bank BIN must be 6 digits',
      'any.required': 'Bank BIN is required',
    }),
  accountNo: Joi.string()
    .trim()
    .min(6)
    .max(19)
    .required()
    .messages({
      'string.min': 'Account number must be at least 6 characters',
      'string.max': 'Account number must not exceed 19 characters',
      'any.required': 'Account number is required',
    }),
  accountName: Joi.string()
    .trim()
    .min(2)
    .max(120)
    .required()
    .messages({
      'string.min': 'Account name must be at least 2 characters',
      'string.max': 'Account name must not exceed 120 characters',
      'any.required': 'Account name is required',
    }),
});

/**
 * Update order extra fee templates schema
 * Validates PUT /settings/system/order-extra-fees request body
 */
export const updateOrderExtraFeesSchema = Joi.object({
  fees: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().trim().max(80).required().messages({
          'any.required': 'Fee id is required',
        }),
        name: Joi.string().trim().min(1).max(120).required().messages({
          'string.empty': 'Fee name is required',
          'any.required': 'Fee name is required',
        }),
        defaultAmount: Joi.number().min(0).precision(2).required().messages({
          'number.min': 'Default amount must be at least 0',
          'any.required': 'Default amount is required',
        }),
      })
    )
    .required()
    .messages({
      'any.required': 'fees is required',
    }),
});

/**
 * Update invoice language schema
 * Validates PUT /settings/system/invoice-language request body
 */
export const updateInvoiceLanguageSchema = Joi.object({
  language: Joi.string().trim().valid('vi', 'en').required().messages({
    'any.only': 'language must be one of: vi, en',
    'any.required': 'language is required',
  }),
});

/**
 * Update store profile schema
 * Validates PUT /settings/system/store-profile request body
 */
export const updateStoreProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(160).required().messages({
    'string.empty': 'Store name is required',
    'any.required': 'Store name is required',
    'string.max': 'Store name must not exceed 160 characters',
  }),
  logoUrl: Joi.string().trim().max(1000).allow('', null).optional().messages({
    'string.max': 'Logo URL must not exceed 1000 characters',
  }),
});
