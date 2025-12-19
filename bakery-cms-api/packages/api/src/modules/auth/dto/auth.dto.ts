/**
 * Authentication DTOs (Data Transfer Objects)
 * Type definitions for authentication API request/response payloads
 */

import { UserRole, UserStatus, AuthProvider } from '@bakery-cms/common';

/**
 * Login request DTO
 * Expected in POST /auth/login
 */
export interface LoginRequestDto {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: string;
}

/**
 * Login response DTO
 * Returned from POST /auth/login
 */
export interface LoginResponseDto {
  user: UserResponseDto;
  tokens: TokenPairDto;
  expiresAt: string;
}

/**
 * Register request DTO
 * Expected in POST /auth/register
 */
export interface RegisterRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

/**
 * Register response DTO
 * Returned from POST /auth/register
 */
export interface RegisterResponseDto {
  user: UserResponseDto;
  tokens: TokenPairDto;
  expiresAt: string;
  message: string;
}

/**
 * Refresh token request DTO
 * Expected in POST /auth/refresh
 */
export interface RefreshTokenRequestDto {
  refreshToken: string;
  deviceInfo?: string;
}

/**
 * Refresh token response DTO
 * Returned from POST /auth/refresh
 */
export interface RefreshTokenResponseDto {
  tokens: TokenPairDto;
  expiresAt: string;
}

/**
 * User response DTO
 * User data in API responses
 */
export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Token pair DTO
 * JWT access and refresh tokens
 */
export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
}

/**
 * Change password request DTO
 * Expected in PATCH /auth/password
 */
export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change password response DTO
 * Returned from PATCH /auth/password
 */
export interface ChangePasswordResponseDto {
  message: string;
  requiresReLogin: boolean;
}

/**
 * Forgot password request DTO
 * Expected in POST /auth/forgot-password
 */
export interface ForgotPasswordRequestDto {
  email: string;
}

/**
 * Forgot password response DTO
 * Returned from POST /auth/forgot-password
 */
export interface ForgotPasswordResponseDto {
  message: string;
  emailSent: boolean;
}

/**
 * Reset password request DTO
 * Expected in POST /auth/reset-password
 */
export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset password response DTO
 * Returned from POST /auth/reset-password
 */
export interface ResetPasswordResponseDto {
  message: string;
  success: boolean;
}

/**
 * Logout request DTO
 * Expected in POST /auth/logout
 */
export interface LogoutRequestDto {
  refreshToken?: string;
  allDevices?: boolean;
}

/**
 * Logout response DTO
 * Returned from POST /auth/logout
 */
export interface LogoutResponseDto {
  message: string;
  success: boolean;
}

/**
 * Verify email request DTO
 * Expected in POST /auth/verify-email
 */
export interface VerifyEmailRequestDto {
  token: string;
}

/**
 * Verify email response DTO
 * Returned from POST /auth/verify-email
 */
export interface VerifyEmailResponseDto {
  message: string;
  success: boolean;
  user: UserResponseDto;
}

/**
 * Profile update request DTO
 * Expected in PATCH /auth/profile
 */
export interface UpdateProfileRequestDto {
  firstName?: string;
  lastName?: string;
}

/**
 * Profile update response DTO
 * Returned from PATCH /auth/profile
 */
export interface UpdateProfileResponseDto {
  user: UserResponseDto;
  message: string;
}