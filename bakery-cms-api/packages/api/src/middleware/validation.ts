/**
 * Request validation middleware
 * Validates request body, query, and params using Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationErrorDetail } from '@bakery-cms/common';
import { createValidationError } from '../utils/error-factory';

/**
 * Validation target type
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation options
 */
export type ValidationOptions = {
  readonly abortEarly?: boolean;
  readonly stripUnknown?: boolean;
};

/**
 * Convert Joi validation error to ValidationErrorDetail array
 * Pure function that transforms Joi error format
 */
const mapJoiError = (error: Joi.ValidationError): readonly ValidationErrorDetail[] => {
  return error.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value,
  }));
};

/**
 * Validate request data against Joi schema
 * Pure function that performs validation
 */
const validateData = (
  schema: Joi.Schema,
  data: unknown,
  options: ValidationOptions = {}
): { readonly valid: boolean; readonly data?: unknown; readonly errors?: readonly ValidationErrorDetail[] } => {
  const { error, value } = schema.validate(data, {
    abortEarly: options.abortEarly ?? false,
    stripUnknown: options.stripUnknown ?? true,
  });
  
  if (error) {
    return {
      valid: false,
      errors: mapJoiError(error),
    };
  }
  
  return {
    valid: true,
    data: value,
  };
};

/**
 * Create validation middleware
 * Factory function that returns middleware for validating request data
 */
export const validate = (
  schema: Joi.Schema,
  target: ValidationTarget = 'body',
  options?: ValidationOptions
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Get data to validate based on target
    const data = target === 'body' ? req.body : target === 'query' ? req.query : req.params;
    
    // Perform validation
    const result = validateData(schema, data, options);
    
    if (!result.valid) {
      // Create validation error
      const error = createValidationError(
        `Validation failed for ${target}`,
        result.errors
      );
      next(error);
      return;
    }
    
    // Replace request data with validated data
    if (target === 'body') {
      req.body = result.data;
    } else if (target === 'query') {
      req.query = result.data as typeof req.query;
    } else {
      req.params = result.data as typeof req.params;
    }
    
    next();
  };
};

/**
 * Validate request body
 * Convenience function for body validation
 */
export const validateBody = (schema: Joi.Schema, options?: ValidationOptions) => {
  return validate(schema, 'body', options);
};

/**
 * Validate query parameters
 * Convenience function for query validation
 */
export const validateQuery = (schema: Joi.Schema, options?: ValidationOptions) => {
  return validate(schema, 'query', options);
};

/**
 * Validate route parameters
 * Convenience function for params validation
 */
export const validateParams = (schema: Joi.Schema, options?: ValidationOptions) => {
  return validate(schema, 'params', options);
};
