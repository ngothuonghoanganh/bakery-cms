/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient } from './api/client';
import { UserRole, UserStatus } from '@bakery-cms/common';

// Re-export for backward compatibility
export { UserRole, UserStatus };
export type { UserRole as UserRoleType, UserStatus as UserStatusType } from '@bakery-cms/common';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  provider?: string;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/**
 * Login response
 */
export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  errors: string[];
  score: number;
}

/**
 * Register new user
 */
export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<{ success: boolean; data: LoginResponse }>(
    '/auth/register',
    data
  );
  return response.data.data;
};

/**
 * Login with email and password
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<{ success: boolean; data: LoginResponse }>(
    '/auth/login',
    data
  );
  return response.data.data;
};

/**
 * Logout from current session
 */
export const logout = async (refreshToken: string): Promise<void> => {
  await apiClient.post('/auth/logout', { refreshToken });
};

/**
 * Logout from all sessions/devices
 */
export const logoutAll = async (): Promise<void> => {
  await apiClient.post('/auth/logout/all');
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<AuthTokens> => {
  const response = await apiClient.post<{ success: boolean; data: AuthTokens }>('/auth/refresh', {
    refreshToken,
  });
  return response.data.data;
};

/**
 * Change current user password
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await apiClient.patch('/auth/password', data);
};

/**
 * Request password reset email
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  await apiClient.post('/auth/forgot-password', data);
};

/**
 * Reset password with token
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await apiClient.post('/auth/reset-password', data);
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<void> => {
  await apiClient.get(`/auth/verify-email?token=${token}`);
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
  return response.data.data;
};

/**
 * Validate password strength (client-side)
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;

  // Minimum length
  if (password.length < 8) {
    errors.push('At least 8 characters');
  } else {
    score += 20;
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  } else {
    score += 20;
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  } else {
    score += 20;
  }

  // Number
  if (!/[0-9]/.test(password)) {
    errors.push('One number');
  } else {
    score += 20;
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('One special character');
  } else {
    score += 20;
  }

  // Bonus points for longer passwords
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Determine strength
  let strength: PasswordValidationResult['strength'];
  if (score < 40) {
    strength = 'weak';
  } else if (score < 60) {
    strength = 'medium';
  } else if (score < 80) {
    strength = 'strong';
  } else {
    strength = 'very_strong';
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
    score: Math.min(score, 100),
  };
};

/**
 * Check if user has specific role
 */
export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, [UserRole.ADMIN]);
};

/**
 * Check if user is staff or higher
 */
export const isStaff = (user: User | null): boolean => {
  return hasRole(user, [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]);
};

/**
 * Check if user is seller or higher
 */
export const isSeller = (user: User | null): boolean => {
  return hasRole(user, [UserRole.ADMIN, UserRole.MANAGER, UserRole.SELLER]);
};
