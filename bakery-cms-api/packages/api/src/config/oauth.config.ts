/**
 * OAuth configuration
 * Configuration for OAuth providers (Google, Facebook)
 */

import { getEnvConfig } from './env';

/**
 * OAuth provider configuration interface
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
 * Complete OAuth configuration
 */
export interface OAuthConfig {
  google: OAuthProviderConfig;
  facebook: OAuthProviderConfig;
  enablePKCE: boolean;
  stateExpirationMs: number;
}

/**
 * Get OAuth configuration
 */
const createOAuthConfig = (): OAuthConfig => {
  const env = getEnvConfig();

  /**
   * Google OAuth configuration
   */
  const googleConfig: OAuthProviderConfig = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    redirectUri: `${env.BASE_URL}/api/auth/oauth/google/callback`,
    callbackPath: '/api/auth/oauth/google/callback',
  };

  /**
   * Facebook OAuth configuration
   */
  const facebookConfig: OAuthProviderConfig = {
    clientId: env.FACEBOOK_CLIENT_ID,
    clientSecret: env.FACEBOOK_CLIENT_SECRET,
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/v18.0/me',
    scope: ['email', 'public_profile'],
    redirectUri: `${env.BASE_URL}/api/auth/oauth/facebook/callback`,
    callbackPath: '/api/auth/oauth/facebook/callback',
  };

  return {
    google: googleConfig,
    facebook: facebookConfig,
    enablePKCE: true, // Enable PKCE for enhanced security (BR-007)
    stateExpirationMs: 10 * 60 * 1000, // 10 minutes
  };
};

/**
 * Main OAuth configuration
 */
export const oauthConfig: OAuthConfig = createOAuthConfig();

/**
 * Get OAuth provider configuration by name
 */
export const getOAuthProviderConfig = (
  provider: string
): OAuthProviderConfig | null => {
  const providerLower = provider.toLowerCase();
  
  switch (providerLower) {
    case 'google':
      return oauthConfig.google;
    case 'facebook':
      return oauthConfig.facebook;
    default:
      return null;
  }
};

/**
 * Get OAuth provider configuration (alias for service compatibility)
 * Returns the provider config or null if not found
 */
export const getOAuthConfig = getOAuthProviderConfig;

/**
 * Validate OAuth configuration on startup
 */
export const validateOAuthConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const env = getEnvConfig();

  // Validate Google config
  if (!oauthConfig.google.clientId) {
    errors.push('Google OAuth client ID is not configured');
  }
  if (!oauthConfig.google.clientSecret) {
    errors.push('Google OAuth client secret is not configured');
  }

  // Validate Facebook config
  if (!oauthConfig.facebook.clientId) {
    errors.push('Facebook OAuth client ID is not configured');
  }
  if (!oauthConfig.facebook.clientSecret) {
    errors.push('Facebook OAuth client secret is not configured');
  }

  // Validate base URL
  if (!env.BASE_URL) {
    errors.push('Application base URL is not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Supported OAuth providers
 */
export const SUPPORTED_OAUTH_PROVIDERS = ['google', 'facebook'] as const;

export type SupportedOAuthProvider = typeof SUPPORTED_OAUTH_PROVIDERS[number];
