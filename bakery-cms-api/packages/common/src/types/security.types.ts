/**
 * Security Policy Types
 * Types for password validation, account lockout, and security policies
 */

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
 * Password requirements configuration
 */
export type PasswordRequirements = {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  specialChars: string;
};

/**
 * Account lockout configuration
 */
export type AccountLockoutConfig = {
  maxAttempts: number;
  lockoutDurationMinutes: number;
  resetAttemptsAfterMinutes: number;
};

/**
 * Account lockout status
 */
export type AccountLockoutStatus = {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
  lockoutReason?: string;
};

/**
 * Security audit event types
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGIN_BLOCKED = 'login_blocked',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  EMAIL_VERIFIED = 'email_verified',
  OAUTH_LINKED = 'oauth_linked',
  OAUTH_UNLINKED = 'oauth_unlinked',
  SESSION_CREATED = 'session_created',
  SESSION_REVOKED = 'session_revoked',
  ROLE_CHANGED = 'role_changed',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

/**
 * Security audit log entry
 */
export type SecurityAuditLog = {
  id: string;
  userId: string;
  eventType: SecurityEventType;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: Date;
};

/**
 * Rate limiting configuration
 */
export type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Max attempts per window
  blockDurationMs?: number; // Block duration after max attempts exceeded
  keyGenerator?: (req: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  message?: string; // Custom error message
};

/**
 * Rate limit status
 */
export type RateLimitStatus = {
  count: number;
  resetTime: number;
  blockedUntil?: number;
  isBlocked: boolean;
  remainingAttempts: number;
};

/**
 * Session security configuration
 */
export type SessionSecurityConfig = {
  cookieMaxAge: number; // Cookie max age in milliseconds
  httpOnly: boolean; // HttpOnly flag
  secure: boolean; // Secure flag (HTTPS only)
  sameSite: 'strict' | 'lax' | 'none'; // SameSite attribute
  domain?: string; // Cookie domain
  path: string; // Cookie path
};

/**
 * CSRF token configuration
 */
export type CsrfConfig = {
  enabled: boolean;
  tokenLength: number;
  cookieName: string;
  headerName: string;
  ignoreMethods: string[]; // Methods to ignore (e.g., GET, HEAD, OPTIONS)
};

/**
 * Security notification types
 */
export enum SecurityNotificationType {
  ACCOUNT_LOCKED = 'account_locked',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset',
  NEW_LOGIN = 'new_login',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  OAUTH_LINKED = 'oauth_linked',
  ROLE_CHANGED = 'role_changed',
}

/**
 * Security notification
 */
export type SecurityNotification = {
  type: SecurityNotificationType;
  userId: string;
  email: string;
  subject: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
};

/**
 * Password change result
 */
export type PasswordChangeResult = {
  success: boolean;
  message: string;
  requiresReauthentication?: boolean;
};

/**
 * Account unlock request
 */
export type UnlockAccountDTO = {
  userId: string;
  reason: string;
  unlockedBy: string; // Admin user ID
};

/**
 * Account unlock result
 */
export type AccountUnlockResult = {
  success: boolean;
  message: string;
  unlockedAt: Date;
};
