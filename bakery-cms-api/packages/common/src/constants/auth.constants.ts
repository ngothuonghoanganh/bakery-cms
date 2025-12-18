/**
 * Authentication Constants
 * Centralized authentication-related constants and configuration values
 */

// JWT Configuration
export const JWT_CONSTANTS = {
  DEFAULT_ACCESS_EXPIRES_IN: '365d',
  DEFAULT_REFRESH_EXPIRES_IN: '730d',
  ALGORITHM: 'HS256',
  ISSUER: 'bakery-cms-api',
  AUDIENCE: 'bakery-cms',
  MIN_SECRET_LENGTH: 32,
} as const;

// Password Security
export const PASSWORD_CONSTANTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  BCRYPT_ROUNDS: 12,
  COMPLEXITY_REQUIREMENTS: {
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },
} as const;

// Account Security
export const ACCOUNT_SECURITY_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_WINDOW_MINUTES: 15,
  LOCKOUT_DURATION_MINUTES: 30,
  PASSWORD_RESET_TOKEN_EXPIRES_MINUTES: 60,
  EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS: 24,
} as const;

// OAuth Configuration
export const OAUTH_CONSTANTS = {
  SUPPORTED_PROVIDERS: ['google', 'facebook'] as const,
  PKCE_CODE_VERIFIER_LENGTH: 128,
  PKCE_CODE_CHALLENGE_METHOD: 'S256',
  STATE_PARAMETER_LENGTH: 32,
  OAUTH_SESSION_EXPIRES_MINUTES: 10,
} as const;

// Rate Limiting
export const RATE_LIMIT_CONSTANTS = {
  LOGIN_ATTEMPTS: {
    WINDOW_MINUTES: 15,
    MAX_ATTEMPTS: 5,
  },
  REGISTRATION_ATTEMPTS: {
    WINDOW_MINUTES: 60,
    MAX_ATTEMPTS: 3,
  },
  PASSWORD_RESET_ATTEMPTS: {
    WINDOW_MINUTES: 60,
    MAX_ATTEMPTS: 3,
  },
  OAUTH_ATTEMPTS: {
    WINDOW_MINUTES: 15,
    MAX_ATTEMPTS: 10,
  },
} as const;

// Session Management
export const SESSION_CONSTANTS = {
  COOKIE_NAME: 'bakery_cms_auth',
  REFRESH_COOKIE_NAME: 'bakery_cms_refresh',
  CSRF_HEADER_NAME: 'x-csrf-token',
  CSRF_COOKIE_NAME: 'bakery_cms_csrf',
  SESSION_CLEANUP_INTERVAL_HOURS: 24,
} as const;

// HTTP Headers
export const AUTH_HEADER_CONSTANTS = {
  AUTHORIZATION: 'Authorization',
  BEARER_PREFIX: 'Bearer',
  CSRF_TOKEN: 'X-CSRF-Token',
  CLIENT_ID: 'X-Client-ID',
} as const;

// Error Codes
export const AUTH_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  ROLE_NOT_AUTHORIZED: 'AUTH_ROLE_NOT_AUTHORIZED',
  RESOURCE_ACCESS_DENIED: 'AUTH_RESOURCE_ACCESS_DENIED',
  
  // Token errors
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  TOKEN_MALFORMED: 'AUTH_TOKEN_MALFORMED',
  TOKEN_NOT_PROVIDED: 'AUTH_TOKEN_NOT_PROVIDED',
  REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  
  // OAuth errors
  OAUTH_STATE_MISMATCH: 'OAUTH_STATE_MISMATCH',
  OAUTH_CODE_EXCHANGE_FAILED: 'OAUTH_CODE_EXCHANGE_FAILED',
  OAUTH_PROVIDER_ERROR: 'OAUTH_PROVIDER_ERROR',
  OAUTH_USER_CANCELLED: 'OAUTH_USER_CANCELLED',
  
  // Registration errors
  EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  INVALID_EMAIL_FORMAT: 'AUTH_INVALID_EMAIL_FORMAT',
  
  // Password errors
  PASSWORD_RESET_TOKEN_EXPIRED: 'AUTH_PASSWORD_RESET_TOKEN_EXPIRED',
  PASSWORD_RESET_TOKEN_INVALID: 'AUTH_PASSWORD_RESET_TOKEN_INVALID',
  CURRENT_PASSWORD_INCORRECT: 'AUTH_CURRENT_PASSWORD_INCORRECT',
  
  // Rate limiting
  TOO_MANY_ATTEMPTS: 'AUTH_TOO_MANY_ATTEMPTS',
  RATE_LIMIT_EXCEEDED: 'AUTH_RATE_LIMIT_EXCEEDED',
  
  // General errors
  INTERNAL_ERROR: 'AUTH_INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'AUTH_SERVICE_UNAVAILABLE',
} as const;

// Success Messages
export const AUTH_SUCCESS_MESSAGES = {
  LOGIN_SUCCESSFUL: 'Login successful',
  REGISTRATION_SUCCESSFUL: 'Registration successful',
  LOGOUT_SUCCESSFUL: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  EMAIL_VERIFIED: 'Email verified successfully',
  ACCOUNT_ACTIVATED: 'Account activated successfully',
} as const;

// API Endpoints
export const AUTH_ENDPOINTS = {
  BASE: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  CHANGE_PASSWORD: '/auth/change-password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  OAUTH: {
    BASE: '/auth/oauth',
    GOOGLE: {
      AUTH_URL: '/auth/oauth/google',
      CALLBACK: '/auth/oauth/google/callback',
    },
    FACEBOOK: {
      AUTH_URL: '/auth/oauth/facebook',
      CALLBACK: '/auth/oauth/facebook/callback',
    },
  },
  USER: {
    PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
  },
} as const;

// Validation Patterns
export const AUTH_VALIDATION_PATTERNS = {
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  NAME_REGEX: /^[a-zA-Z\s-']{1,50}$/,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// Default User Configuration
export const DEFAULT_USER_CONFIG = {
  DEFAULT_ROLE: 'customer',
  DEFAULT_STATUS: 'pending_verification',
  DEFAULT_PROVIDER: 'local',
  ADMIN_ROLE: 'admin',
} as const;

// Environment Variable Keys
export const ENV_KEYS = {
  JWT_SECRET: 'JWT_SECRET',
  JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET',
  JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',
  JWT_REFRESH_EXPIRES_IN: 'JWT_REFRESH_EXPIRES_IN',
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  GOOGLE_REDIRECT_URI: 'GOOGLE_REDIRECT_URI',
  FACEBOOK_CLIENT_ID: 'FACEBOOK_CLIENT_ID',
  FACEBOOK_CLIENT_SECRET: 'FACEBOOK_CLIENT_SECRET',
  FACEBOOK_REDIRECT_URI: 'FACEBOOK_REDIRECT_URI',
  ADMIN_EMAIL: 'ADMIN_EMAIL',
  ADMIN_PASSWORD: 'ADMIN_PASSWORD',
  ADMIN_FIRST_NAME: 'ADMIN_FIRST_NAME',
  ADMIN_LAST_NAME: 'ADMIN_LAST_NAME',
} as const;