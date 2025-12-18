/**
 * Authentication validation schemas using Joi
 * Validates request payloads for authentication endpoints
 */

import Joi from 'joi';
import { UserRole } from '@bakery-cms/common';

/**
 * Email validation schema (reusable)
 */
const emailSchema = Joi.string()
  .trim()
  .lowercase()
  .email()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email must not exceed 255 characters',
    'any.required': 'Email is required',
  });

/**
 * Password validation schema (reusable)
 * Mirrors password.utils.ts requirements
 */
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .required()
  .pattern(new RegExp('(?=.*[a-z])'))
  .pattern(new RegExp('(?=.*[A-Z])'))
  .pattern(new RegExp('(?=.*\\d)'))
  .pattern(new RegExp('(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?])'))
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'Password is required',
  });

/**
 * Name validation schema (reusable)
 */
const nameSchema = Joi.string()
  .trim()
  .min(1)
  .max(100)
  .required()
  .messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  });

/**
 * JWT token validation schema (reusable)
 */
const jwtTokenSchema = Joi.string()
  .required()
  .messages({
    'string.empty': 'Token is required',
    'any.required': 'Token is required',
  });

/**
 * Login request validation schema
 * Validates POST /auth/login request body
 */
export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
  rememberMe: Joi.boolean().optional(),
  deviceInfo: Joi.string().trim().max(255).optional(),
});

/**
 * Register request validation schema
 * Validates POST /auth/register request body
 */
export const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional()
    .messages({
      'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
    }),
  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the terms and conditions',
      'any.required': 'You must accept the terms and conditions',
    }),
});

/**
 * Refresh token request validation schema
 * Validates POST /auth/refresh request body
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: jwtTokenSchema,
  deviceInfo: Joi.string().trim().max(255).optional(),
});

/**
 * Change password request validation schema
 * Validates PATCH /auth/password request body
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required',
    }),
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'any.only': 'Password confirmation does not match new password',
      'any.required': 'Password confirmation is required',
    }),
});

/**
 * Forgot password request validation schema
 * Validates POST /auth/forgot-password request body
 */
export const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});

/**
 * Reset password request validation schema
 * Validates POST /auth/reset-password request body
 */
export const resetPasswordSchema = Joi.object({
  token: jwtTokenSchema,
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'any.only': 'Password confirmation does not match new password',
      'any.required': 'Password confirmation is required',
    }),
});

/**
 * Verify email request validation schema
 * Validates POST /auth/verify-email request body
 */
export const verifyEmailSchema = Joi.object({
  token: jwtTokenSchema,
});

/**
 * Resend email verification request validation schema
 * Validates POST /auth/resend-verification request body
 */
export const resendVerificationSchema = Joi.object({
  email: emailSchema,
});

/**
 * Update profile request validation schema
 * Validates PATCH /auth/profile request body
 */
export const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'First name cannot be empty',
      'string.min': 'First name must be at least 1 character',
      'string.max': 'First name must not exceed 100 characters',
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Last name cannot be empty',
      'string.min': 'Last name must be at least 1 character',
      'string.max': 'Last name must not exceed 100 characters',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Logout request validation schema
 * Validates POST /auth/logout request body
 */
export const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional(),
  allDevices: Joi.boolean().optional(),
});