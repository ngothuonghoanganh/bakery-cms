/**
 * OAuth utilities
 * Functions for OAuth PKCE (Proof Key for Code Exchange) flow and OAuth operations
 */

import crypto from 'crypto';
import { Result, ok, err } from 'neverthrow';
import { AppError, ErrorCode } from '@bakery-cms/common';

/**
 * PKCE code verifier and challenge pair
 */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * OAuth state data structure
 */
export interface OAuthState {
  state: string;
  codeVerifier?: string;
  redirectUri: string;
  provider: string;
  timestamp: number;
}

/**
 * Generate a random string for PKCE code verifier
 * Must be 43-128 characters from [A-Z][a-z][0-9]-._~
 */
export const generateCodeVerifier = (): string => {
  return crypto
    .randomBytes(32)
    .toString('base64url'); // Creates URL-safe base64 string (43 chars)
};

/**
 * Generate PKCE code challenge from verifier using SHA256
 * code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
 */
export const generateCodeChallenge = (codeVerifier: string): string => {
  return crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
};

/**
 * Generate complete PKCE pair (verifier and challenge)
 */
export const generatePKCEPair = (): Result<PKCEPair, AppError> => {
  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    return ok({
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256' as const,
    });
  } catch (error) {
    return err({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to generate PKCE pair',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Verify PKCE code verifier against challenge
 */
export const verifyPKCEChallenge = (
  codeVerifier: string,
  codeChallenge: string
): Result<boolean, AppError> => {
  try {
    const computedChallenge = generateCodeChallenge(codeVerifier);
    const isValid = computedChallenge === codeChallenge;

    return ok(isValid);
  } catch (error) {
    return err({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to verify PKCE challenge',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Generate OAuth state parameter
 * Used to prevent CSRF attacks
 */
export const generateOAuthState = (): string => {
  return crypto.randomBytes(16).toString('hex'); // 32 character hex string
};

/**
 * Create OAuth state data with metadata
 */
export const createOAuthState = (
  provider: string,
  redirectUri: string,
  codeVerifier?: string
): Result<OAuthState, AppError> => {
  try {
    const state = generateOAuthState();

    return ok({
      state,
      codeVerifier,
      redirectUri,
      provider,
      timestamp: Date.now(),
    });
  } catch (error) {
    return err({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to create OAuth state',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Validate OAuth state is not expired
 * State should expire after 10 minutes
 */
export const validateOAuthState = (
  stateData: OAuthState,
  maxAgeMs: number = 10 * 60 * 1000 // 10 minutes
): Result<boolean, AppError> => {
  try {
    const now = Date.now();
    const age = now - stateData.timestamp;

    if (age > maxAgeMs) {
      return err({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'OAuth state has expired',
        statusCode: 401,
        timestamp: new Date(),
      });
    }

    return ok(true);
  } catch (error) {
    return err({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Failed to validate OAuth state',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Build OAuth authorization URL with PKCE parameters
 */
export const buildAuthorizationUrl = (
  baseUrl: string,
  params: Record<string, string>
): string => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
};

/**
 * Parse OAuth error response
 */
export const parseOAuthError = (
  error: string,
  errorDescription?: string
): AppError => {
  return {
    code: ErrorCode.AUTHENTICATION_ERROR,
    message: errorDescription || error || 'OAuth authentication failed',
    statusCode: 401,
    timestamp: new Date(),
  };
};

/**
 * Validate OAuth provider
 */
export const validateOAuthProvider = (
  provider: string,
  supportedProviders: string[]
): Result<void, AppError> => {
  if (!supportedProviders.includes(provider.toLowerCase())) {
    return err({
      code: ErrorCode.VALIDATION_ERROR,
      message: `Unsupported OAuth provider: ${provider}`,
      statusCode: 400,
      timestamp: new Date(),
    });
  }

  return ok(undefined);
};
