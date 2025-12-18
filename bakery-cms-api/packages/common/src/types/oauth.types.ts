/**
 * OAuth types
 * Type definitions for OAuth authentication and PKCE flow
 */

import { Result } from 'neverthrow';
import { AppError } from './error.types';
import { UserRole } from '../enums/auth.enums';

/**
 * OAuth Provider enum
 * Supported OAuth authentication providers
 */
export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

/**
 * OAuth user profile from provider
 * Standardized user data from OAuth providers
 */
export interface OAuthProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  profilePicture?: string;
  provider: OAuthProvider;
  providerId: string;
  raw?: Record<string, any>; // Original provider response
}

/**
 * OAuth tokens from provider
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
  idToken?: string;
}

/**
 * OAuth authorization request data
 */
export interface OAuthAuthorizationRequest {
  provider: OAuthProvider;
  redirectUri: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256';
  scope?: string[];
}

/**
 * OAuth callback request data
 */
export interface OAuthCallbackRequest {
  provider: OAuthProvider;
  code: string;
  state: string;
  codeVerifier?: string;
  error?: string;
  errorDescription?: string;
}

/**
 * OAuth authentication result
 */
export interface OAuthAuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    provider: OAuthProvider;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  isNewUser: boolean;
}

/**
 * OAuth state data stored in session/cache
 */
export interface OAuthStateData {
  state: string;
  codeVerifier?: string;
  redirectUri: string;
  provider: OAuthProvider;
  timestamp: number;
  expiresAt: number;
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string[];
  redirectUri: string;
  callbackPath: string;
}

/**
 * OAuth service operations interface
 * Defines all OAuth operations (actual type may be defined in auth.types.ts)
 */
export interface IOAuthService {
  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri?: string
  ): Promise<Result<string, AppError>>;

  /**
   * Handle OAuth callback and authenticate user
   */
  handleCallback(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<Result<OAuthAuthResult, AppError>>;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string,
    codeVerifier?: string
  ): Promise<Result<OAuthTokens, AppError>>;

  /**
   * Get user profile from provider
   */
  getUserProfile(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<Result<OAuthProfile, AppError>>;

  /**
   * Link OAuth provider to existing user
   */
  linkProvider(
    userId: string,
    provider: OAuthProvider,
    providerId: string
  ): Promise<Result<void, AppError>>;

  /**
   * Unlink OAuth provider from user
   */
  unlinkProvider(
    userId: string,
    provider: OAuthProvider
  ): Promise<Result<void, AppError>>;

  /**
   * Verify OAuth state is valid
   */
  verifyState(
    state: string,
    storedState: OAuthStateData
  ): Promise<Result<boolean, AppError>>;
}

/**
 * OAuth token exchange response from provider
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  id_token?: string;
}

/**
 * Google OAuth user info response
 */
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
}

/**
 * Facebook OAuth user info response
 */
export interface FacebookUserInfo {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  picture?: {
    data: {
      url: string;
      is_silhouette: boolean;
    };
  };
}

/**
 * OAuth error response from provider
 */
export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}
