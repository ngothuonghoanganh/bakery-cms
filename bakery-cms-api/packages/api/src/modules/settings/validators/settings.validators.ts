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
