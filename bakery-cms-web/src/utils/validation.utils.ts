import { z } from 'zod';

/**
 * Common validation schemas
 */

export const emailSchema = z.string().min(1, 'Email is required').email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const urlSchema = z.string().url('Invalid URL format');

export const positiveNumberSchema = z.number().positive('Must be a positive number');

export const nonNegativeNumberSchema = z.number().nonnegative('Must be a non-negative number');

/**
 * Validation helper functions
 */

export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const validateUrl = (url: string): boolean => {
  return urlSchema.safeParse(url).success;
};

/**
 * Create custom validation schema with error messages
 */
export const createValidationSchema = <T extends z.ZodType>(
  schema: T,
  errorMessages?: Record<string, string>
): T => {
  if (!errorMessages) return schema;

  // Custom error mapping could be implemented here
  return schema;
};
