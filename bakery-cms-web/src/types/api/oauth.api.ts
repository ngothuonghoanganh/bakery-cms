/**
 * OAuth API Types
 * Type definitions for OAuth API requests and responses
 */

/**
 * OAuth Provider enum
 */
export const OAuthProvider = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

export type OAuthProvider = typeof OAuthProvider[keyof typeof OAuthProvider];

/**
 * OAuth authorization request
 */
export interface OAuthAuthorizationRequest {
  provider: OAuthProvider;
  redirectUri: string;
}

/**
 * OAuth authorization response
 */
export interface OAuthAuthorizationResponse {
  authorizationUrl: string;
  state: string;
}

/**
 * OAuth callback request
 */
export interface OAuthCallbackRequest {
  code: string;
  state: string;
  provider: OAuthProvider;
}

/**
 * OAuth code exchange request
 */
export interface OAuthCodeExchangeRequest {
  provider: OAuthProvider;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

/**
 * OAuth user from response
 */
export interface OAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  provider: string;
}

/**
 * OAuth tokens from response
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * OAuth login response
 */
export interface OAuthLoginResponse {
  user: OAuthUser;
  tokens: OAuthTokens;
  isNewUser: boolean;
}

/**
 * OAuth error response
 */
export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * OAuth state data stored in session
 */
export interface OAuthStateData {
  state: string;
  provider: OAuthProvider;
  redirectUri: string;
  timestamp: number;
}
