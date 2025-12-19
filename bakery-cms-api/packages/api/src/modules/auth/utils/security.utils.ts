/**
 * Security Utilities
 * Password validation and security policy enforcement
 */

import { randomBytes } from 'crypto';

/**
 * Password requirements as per BR-005
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

/**
 * Account lockout configuration as per BR-008
 */
export const LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDurationMinutes: 30,
  resetAttemptsAfterMinutes: 15,
} as const;

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong',
}

/**
 * Password validation result
 */
export type PasswordValidationResult = {
  isValid: boolean;
  strength: PasswordStrength;
  errors: string[];
  score: number; // 0-100
};

/**
 * Validate password against requirements
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
    score += 20;
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }

  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }

  // Number check
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 20;
  }

  // Special character check
  const specialCharRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !specialCharRegex.test(password)) {
    errors.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`);
  } else if (specialCharRegex.test(password)) {
    score += 20;
  }

  // Additional scoring for length and complexity
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Determine strength
  let strength: PasswordStrength;
  if (score < 40) {
    strength = PasswordStrength.WEAK;
  } else if (score < 60) {
    strength = PasswordStrength.MEDIUM;
  } else if (score < 80) {
    strength = PasswordStrength.STRONG;
  } else {
    strength = PasswordStrength.VERY_STRONG;
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
    score: Math.min(score, 100),
  };
};

/**
 * Check if account should be locked based on failed attempts
 */
export const shouldLockAccount = (loginAttempts: number): boolean => {
  return loginAttempts >= LOCKOUT_CONFIG.maxAttempts;
};

/**
 * Calculate lockout expiration time
 */
export const calculateLockoutExpiration = (): Date => {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + LOCKOUT_CONFIG.lockoutDurationMinutes);
  return expiration;
};

/**
 * Check if account is currently locked
 */
export const isAccountLocked = (lockedUntil: Date | null | undefined): boolean => {
  if (!lockedUntil) return false;
  return new Date() < new Date(lockedUntil);
};

/**
 * Check if login attempts should be reset
 */
export const shouldResetAttempts = (lastAttempt: Date): boolean => {
  const now = new Date();
  const minutesSinceLastAttempt = (now.getTime() - new Date(lastAttempt).getTime()) / (1000 * 60);
  return minutesSinceLastAttempt >= LOCKOUT_CONFIG.resetAttemptsAfterMinutes;
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i]! % chars.length];
  }
  
  return token;
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
