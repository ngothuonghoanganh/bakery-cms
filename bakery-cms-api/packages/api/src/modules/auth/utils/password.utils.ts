/**
 * Password utilities
 * Functions for password hashing, verification, and validation using bcrypt
 */

import bcrypt from 'bcrypt';
import { Result, ok, err } from 'neverthrow';
import { AppError, ErrorCode } from '@bakery-cms/common';

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

/**
 * Password configuration constants
 */
export const PASSWORD_CONFIG = {
  SALT_ROUNDS: 12,
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  MAX_REPEATED_CHARS: 3,
} as const;

/**
 * Special characters for password validation
 */
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Hash a password using bcrypt with 12 salt rounds
 */
export const hashPassword = async (password: string): Promise<Result<string, AppError>> => {
  try {
    if (!password || password.length === 0) {
      return err({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Password is required',
        statusCode: 400,
        timestamp: new Date(),
      });
    }

    if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
      return err({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Password cannot exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`,
        statusCode: 400,
        timestamp: new Date(),
      });
    }

    const hash = await bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
    return ok(hash);
  } catch (error) {
    return err({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to hash password',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Verify a password against its hash
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<Result<boolean, AppError>> => {
  try {
    if (!password || !hash) {
      return err({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Password and hash are required',
        statusCode: 400,
        timestamp: new Date(),
      });
    }

    const isValid = await bcrypt.compare(password, hash);
    return ok(isValid);
  } catch (error) {
    return err({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to verify password',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Validate password strength and requirements
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;

  // Check if password exists
  if (!password) {
    errors.push('Password is required');
    return {
      isValid: false,
      errors,
      strength: 'weak',
      score: 0,
    };
  }

  // Check minimum length
  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`);
  } else {
    score += 1;
  }

  // Check maximum length
  if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
    errors.push(`Password cannot exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`);
  }

  // Check for uppercase letters
  if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // Check for lowercase letters
  if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // Check for numbers
  if (PASSWORD_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 1;
  }

  // Check for special characters
  if (PASSWORD_CONFIG.REQUIRE_SPECIAL_CHARS && !SPECIAL_CHARS.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;\':".,<>?/)');
  } else if (SPECIAL_CHARS.test(password)) {
    score += 1;
  }

  // Check for repeated characters
  if (hasRepeatedChars(password, PASSWORD_CONFIG.MAX_REPEATED_CHARS)) {
    errors.push(`Password cannot have more than ${PASSWORD_CONFIG.MAX_REPEATED_CHARS} consecutive repeated characters`);
    score -= 1;
  }

  // Check for common patterns
  if (hasCommonPatterns(password)) {
    errors.push('Password contains common patterns (123456, abcdef, qwerty, etc.)');
    score -= 1;
  }

  // Additional scoring for length
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 6) {
    strength = 'strong';
  } else if (score >= 4) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, score),
  };
};

/**
 * Check if password has too many repeated characters
 */
const hasRepeatedChars = (password: string, maxRepeated: number): boolean => {
  let count = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      count++;
      if (count > maxRepeated) {
        return true;
      }
    } else {
      count = 1;
    }
  }
  return false;
};

/**
 * Check if password contains common patterns
 */
const hasCommonPatterns = (password: string): boolean => {
  const commonPatterns = [
    '123456789',
    'abcdefghi',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    '987654321',
    'password',
    'admin',
    'user',
    'login',
    'welcome',
    'hello',
    'test',
  ];

  const lowerPassword = password.toLowerCase();
  return commonPatterns.some(pattern => lowerPassword.includes(pattern));
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  // Enforce minimum length of 12 characters for security
  const actualLength = Math.max(12, length);
  
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/';
  
  const allChars = uppercase + lowercase + numbers + specialChars;
  
  let password = '';
  
  // Ensure at least one character from each required group
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < actualLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Validate that two passwords match
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): Result<void, AppError> => {
  if (password !== confirmPassword) {
    return err({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Passwords do not match',
      statusCode: 400,
      timestamp: new Date(),
    });
  }
  
  return ok(undefined);
};

/**
 * Check if password is in a list of commonly used passwords
 */
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    '123456',
    'password',
    '123456789',
    '12345678',
    '12345',
    '111111',
    '1234567',
    'sunshine',
    'qwerty',
    'iloveyou',
    'admin',
    'welcome',
    'monkey',
    'login',
    'abc123',
    '123123',
    'dragon',
    'pass',
    'master',
    'hello',
    'freedom',
    'whatever',
    'qazwsx',
    'trustno1',
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};