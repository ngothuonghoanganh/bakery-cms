/**
 * OAuth Service
 * Handles OAuth authentication flow on the frontend
 */

import { OAuthProvider } from '../types/api/oauth.api';
import { apiClient } from './api/client';
import type { User } from './auth.service';

/**
 * OAuth authorization response
 */
export interface OAuthAuthorizationResponse {
  authorizationUrl: string;
  state: string;
}

/**
 * OAuth login response
 */
export interface OAuthLoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
  isNewUser: boolean;
}

/**
 * Get OAuth authorization URL
 * Initiates OAuth flow by getting authorization URL from backend
 */
export const getOAuthAuthorizationUrl = async (
  provider: OAuthProvider,
  redirectUri: string
): Promise<OAuthAuthorizationResponse> => {
  const response = await apiClient.get<{ data: OAuthAuthorizationResponse }>(
    `/auth/oauth/${provider}/authorize`,
    {
      params: { redirect_uri: redirectUri },
    }
  );

  if (!response.data?.data) {
    throw new Error('Failed to get OAuth authorization URL');
  }

  return response.data.data;
};

/**
 * Exchange OAuth code for tokens
 * Sends authorization code + code verifier to backend to complete OAuth flow
 */
export const exchangeOAuthCode = async (
  provider: OAuthProvider,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthLoginResponse> => {
  const response = await apiClient.post<{ data: OAuthLoginResponse }>(
    `/auth/oauth/${provider}/exchange`,
    {
      code,
      codeVerifier,
      redirectUri,
    }
  );

  if (!response.data?.data) {
    throw new Error('Failed to exchange OAuth code');
  }

  return response.data.data;
};

/**
 * Initiate OAuth login flow
 * Opens OAuth provider's authorization page in popup or redirect
 */
export const initiateOAuthLogin = async (
  provider: OAuthProvider,
  redirectUri: string,
  usePopup: boolean = false
): Promise<{ state: string; codeVerifier: string }> => {
  // Get authorization URL from backend
  const { authorizationUrl, state } = await getOAuthAuthorizationUrl(
    provider,
    redirectUri
  );

  // Store state and codeVerifier in sessionStorage for callback validation
  // Note: In production with PKCE, codeVerifier should be stored securely
  const oauthData = {
    state,
    provider,
    redirectUri,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(`oauth_${state}`, JSON.stringify(oauthData));

  // Open OAuth provider's authorization page
  if (usePopup) {
    const popup = window.open(
      authorizationUrl,
      'oauth_popup',
      'width=600,height=700,left=100,top=100'
    );

    if (!popup) {
      throw new Error('Failed to open OAuth popup. Please allow popups for this site.');
    }
  } else {
    // Redirect to OAuth provider
    window.location.href = authorizationUrl;
  }

  return { state, codeVerifier: '' }; // Backend manages codeVerifier
};

/**
 * Handle OAuth callback
 * Processes OAuth callback parameters and exchanges code for tokens
 */
export const handleOAuthCallback = async (
  searchParams: URLSearchParams
): Promise<OAuthLoginResponse> => {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    throw new Error(errorDescription || error);
  }

  // Validate required parameters
  if (!code || !state) {
    throw new Error('Missing OAuth callback parameters');
  }

  // Retrieve stored OAuth data
  const oauthDataStr = sessionStorage.getItem(`oauth_${state}`);
  if (!oauthDataStr) {
    throw new Error('Invalid or expired OAuth state');
  }

  const oauthData = JSON.parse(oauthDataStr);

  // Validate state hasn't expired (10 minutes)
  const age = Date.now() - oauthData.timestamp;
  if (age > 10 * 60 * 1000) {
    sessionStorage.removeItem(`oauth_${state}`);
    throw new Error('OAuth state has expired');
  }

  // Exchange code for tokens
  // Note: Backend manages PKCE verification
  const response = await exchangeOAuthCode(
    oauthData.provider,
    code,
    '', // codeVerifier managed by backend
    oauthData.redirectUri
  );

  // Clean up stored OAuth data
  sessionStorage.removeItem(`oauth_${state}`);

  return response;
};

/**
 * Clear OAuth session data
 * Removes all OAuth-related data from sessionStorage
 */
export const clearOAuthSession = (): void => {
  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith('oauth_')) {
      sessionStorage.removeItem(key);
    }
  });
};

/**
 * Check if currently in OAuth callback
 * Determines if current URL is an OAuth callback
 */
export const isOAuthCallback = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') && params.has('state');
};

/**
 * OAuth Service instance
 */
export const oauthService = {
  getOAuthAuthorizationUrl,
  exchangeOAuthCode,
  initiateOAuthLogin,
  handleOAuthCallback,
  clearOAuthSession,
  isOAuthCallback,
};

export default oauthService;
