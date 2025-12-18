/**
 * OAuth PKCE Service
 * Modern OAuth 2.0 implementation with PKCE (Proof Key for Code Exchange) security
 * Replaces passport-based oauth.service.ts with more secure client-side flow
 * 
 * This implementation follows OAuth 2.0 best practices:
 * - PKCE (RFC 7636) for authorization code flow security
 * - State parameter for CSRF protection
 * - No server-side sessions required
 * - Suitable for SPA/mobile applications
 */

import { Result, ok, err } from 'neverthrow';
import axios from 'axios';
import {
  AppError,
  ErrorCode,
  OAuthProvider,
  AuthProvider,
  UserStatus,
  OAuthProfile,
  OAuthTokens,
  GoogleUserInfo,
  FacebookUserInfo,
  UserRole,
} from '@bakery-cms/common';
import { getOAuthConfig } from '../../../config/oauth.config';
import {
  generatePKCEPair,
  createOAuthState,
  buildAuthorizationUrl,
  parseOAuthError,
} from '../utils/oauth.utils';
import { UserRepository } from '../repositories/user.repository';
import { AuthSessionRepository } from '../repositories/auth-session.repository';
import { EmailService } from './email.service';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { createLogger } from '../../../utils/logger';

const logger = createLogger();

/**
 * OAuth service interface with PKCE support
 */
export interface IOAuthPKCEService {
  getAuthorizationUrl: (
    provider: OAuthProvider,
    redirectUri: string
  ) => Promise<Result<{ url: string; state: string; codeVerifier: string }, AppError>>;
  
  exchangeCodeForTokens: (
    provider: OAuthProvider,
    code: string,
    codeVerifier: string,
    redirectUri: string
  ) => Promise<Result<OAuthTokens, AppError>>;
  
  getUserProfile: (
    provider: OAuthProvider,
    accessToken: string
  ) => Promise<Result<OAuthProfile, AppError>>;

  authenticateOrCreateUser: (
    profile: OAuthProfile,
    oauthAccessToken: string
  ) => Promise<Result<{
    user: any;
    isNewUser: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }, AppError>>;
}

/**
 * OAuth PKCE Service implementation
 */
export class OAuthPKCEService implements IOAuthPKCEService {
  constructor(
    private userRepository: UserRepository,
    private authSessionRepository: AuthSessionRepository,
    private emailService: EmailService
  ) {}

  /**
   * Get OAuth authorization URL with PKCE parameters
   * Client initiates OAuth flow by redirecting to this URL
   */
  async getAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string
  ): Promise<Result<{ url: string; state: string; codeVerifier: string }, AppError>> {
    try {
      // Get OAuth configuration
      const config = getOAuthConfig(provider);
      if (!config) {
        return err({
          code: ErrorCode.CONFIGURATION_ERROR,
          message: `OAuth configuration not found for provider: ${provider}`,
          statusCode: 500,
          timestamp: new Date(),
        });
      }

      // Generate PKCE pair
      const pkcePairResult = generatePKCEPair();
      if (pkcePairResult.isErr()) {
        return err(pkcePairResult.error);
      }
      const { codeVerifier, codeChallenge, codeChallengeMethod } = pkcePairResult.value;

      // Create OAuth state for CSRF protection
      const stateResult = createOAuthState(provider, redirectUri, codeVerifier);
      if (stateResult.isErr()) {
        return err(stateResult.error);
      }
      const { state } = stateResult.value;

      // Build authorization URL parameters
      const params: Record<string, string> = {
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scope.join(' '),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
      };

      // Add provider-specific parameters
      if (provider === OAuthProvider.GOOGLE) {
        params['access_type'] = 'offline';
        params['prompt'] = 'consent';
      }

      // Build full authorization URL
      const url = buildAuthorizationUrl(config.authorizationUrl, params);

      logger.info('Generated OAuth authorization URL', { provider, state });
      return ok({ url, state, codeVerifier });
    } catch (error) {
      logger.error('Failed to generate authorization URL', { provider, error });
      return err({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to generate authorization URL',
        statusCode: 500,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Exchange authorization code for access tokens using PKCE
   * Called after OAuth provider redirects back with authorization code
   */
  async exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<Result<OAuthTokens, AppError>> {
    try {
      // Get OAuth configuration
      const config = getOAuthConfig(provider);
      if (!config) {
        return err({
          code: ErrorCode.CONFIGURATION_ERROR,
          message: `OAuth configuration not found for provider: ${provider}`,
          statusCode: 500,
          timestamp: new Date(),
        });
      }

      // Prepare token exchange request
      const tokenParams = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      // Exchange code for tokens
      logger.info('Exchanging OAuth code for tokens', { provider });
      const response = await axios.post(
        config.tokenUrl,
        tokenParams.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Parse token response
      const { access_token, refresh_token, expires_in, token_type, scope } = response.data;

      if (!access_token) {
        return err({
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: 'No access token received from OAuth provider',
          statusCode: 401,
          timestamp: new Date(),
        });
      }

      logger.info('Successfully exchanged OAuth code for tokens', { provider });
      return ok({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        tokenType: token_type || 'Bearer',
        scope: scope,
      });
    } catch (error: any) {
      logger.error('Failed to exchange OAuth code for tokens', { provider, error });
      
      // Handle OAuth error response
      if (error.response?.data?.error) {
        return err(parseOAuthError(
          error.response.data.error,
          error.response.data.error_description
        ));
      }

      return err({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Failed to exchange authorization code for tokens',
        statusCode: 401,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get user profile from OAuth provider
   * Maps provider-specific response to common OAuthProfile format
   */
  async getUserProfile(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<Result<OAuthProfile, AppError>> {
    try {
      const config = getOAuthConfig(provider);
      if (!config) {
        return err({
          code: ErrorCode.CONFIGURATION_ERROR,
          message: `OAuth configuration not found for provider: ${provider}`,
          statusCode: 500,
          timestamp: new Date(),
        });
      }

      // Fetch user info from provider
      logger.info('Fetching user profile from OAuth provider', { provider });
      const response = await axios.get(config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Map provider-specific response to common profile
      if (provider === OAuthProvider.GOOGLE) {
        return this.mapGoogleProfile(response.data);
      } else if (provider === OAuthProvider.FACEBOOK) {
        return this.mapFacebookProfile(response.data);
      }

      return err({
        code: ErrorCode.INTERNAL_ERROR,
        message: `Unsupported OAuth provider: ${provider}`,
        statusCode: 500,
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Failed to fetch user profile', { provider, error });
      return err({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Failed to fetch user profile from OAuth provider',
        statusCode: 401,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Authenticate user or create new account from OAuth profile
   * Complete OAuth login flow - handles both new and existing users
   */
  async authenticateOrCreateUser(
    profile: OAuthProfile,
    _oauthAccessToken: string
  ): Promise<Result<{
    user: any;
    isNewUser: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }, AppError>> {
    try {
      logger.info('Authenticating OAuth user', { 
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email 
      });

      // Convert OAuthProvider to AuthProvider
      const authProvider = profile.provider === OAuthProvider.GOOGLE 
        ? AuthProvider.GOOGLE 
        : AuthProvider.FACEBOOK;

      // Check if user exists with this OAuth provider
      let user = await this.userRepository.findByProvider(
        authProvider,
        profile.providerId
      );

      let isNewUser = false;

      if (!user) {
        // Check if user exists with same email (different provider)
        const existingUser = await this.userRepository.findByEmail(profile.email);

        if (existingUser) {
          // Link OAuth account to existing user
          await this.userRepository.update(existingUser.id, {
            provider: authProvider,
            providerId: profile.providerId,
            lastLoginAt: new Date(),
          });
          user = await this.userRepository.findById(existingUser.id);
          logger.info('Linked OAuth provider to existing user', {
            userId: existingUser.id,
            provider: profile.provider
          });
        } else {
          // Create new user from OAuth profile
          user = await this.userRepository.create({
            email: profile.email,
            passwordHash: undefined, // OAuth users don't have passwords
            firstName: profile.firstName || 'User',
            lastName: profile.lastName || '',
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            provider: authProvider,
            providerId: profile.providerId,
            emailVerifiedAt: profile.emailVerified ? new Date() : undefined,
          });

          if (!user) {
            return err({
              code: ErrorCode.INTERNAL_ERROR,
              message: 'Failed to create user from OAuth profile',
              statusCode: 500,
              timestamp: new Date(),
            });
          }

          isNewUser = true;
          logger.info('Created new user from OAuth', { userId: user.id, provider: profile.provider });

          // Send welcome email
          const welcomeResult = await this.emailService.sendWelcomeEmail(user.email, {
            firstName: user.firstName,
            dashboardUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000',
          });

          if (welcomeResult.isErr()) {
            logger.warn('Failed to send welcome email', { userId: user.id });
          }
        }
      } else {
        // Update last login for existing user
        await this.userRepository.update(user.id, {
          lastLoginAt: new Date(),
        });
        const updatedUser = await this.userRepository.findById(user.id);
        if (updatedUser) {
          user = updatedUser;
        }
        logger.info('Existing OAuth user logged in', { userId: user.id, provider: profile.provider });
      }

      if (!user) {
        return err({
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: 'User authentication failed',
          statusCode: 401,
          timestamp: new Date(),
        });
      }

      // Generate JWT tokens
      const accessTokenResult = await generateAccessToken(user.id, user.email, user.role);
      if (accessTokenResult.isErr()) {
        return err(accessTokenResult.error);
      }

      const refreshTokenResult = await generateRefreshToken(user.id, user.email, user.role);
      if (refreshTokenResult.isErr()) {
        return err(refreshTokenResult.error);
      }

      // Create auth session
      const sessionResult = await this.authSessionRepository.create({
        userId: user.id,
        refreshToken: refreshTokenResult.value,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
        deviceInfo: `OAuth ${profile.provider}`,
        ipAddress: '0.0.0.0', // Will be set by middleware
      });

      if (!sessionResult) {
        return err({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed to create auth session',
          statusCode: 500,
          timestamp: new Date(),
        });
      }

      logger.info('OAuth authentication successful', { 
        userId: user.id, 
        isNewUser,
        provider: profile.provider 
      });

      return ok({
        user,
        isNewUser,
        accessToken: accessTokenResult.value,
        refreshToken: refreshTokenResult.value,
        expiresIn: 365 * 24 * 60 * 60, // 365 days in seconds
      });

    } catch (error) {
      logger.error('OAuth authentication failed', { error });
      return err({
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'OAuth authentication failed',
        statusCode: 401,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Map Google user info to common OAuth profile format
   */
  private mapGoogleProfile(userInfo: GoogleUserInfo): Result<OAuthProfile, AppError> {
    try {
      return ok({
        id: userInfo.id,
        provider: OAuthProvider.GOOGLE,
        providerId: userInfo.id,
        email: userInfo.email,
        emailVerified: userInfo.verified_email,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        displayName: userInfo.name,
        profilePicture: userInfo.picture,
        locale: userInfo.locale,
      });
    } catch (error) {
      return err({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to map Google user profile',
        statusCode: 500,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Map Facebook user info to common OAuth profile format
   */
  private mapFacebookProfile(userInfo: FacebookUserInfo): Result<OAuthProfile, AppError> {
    try {
      return ok({
        id: userInfo.id,
        provider: OAuthProvider.FACEBOOK,
        providerId: userInfo.id,
        email: userInfo.email,
        emailVerified: true, // Facebook only returns verified emails
        firstName: userInfo.first_name || '',
        lastName: userInfo.last_name || '',
        displayName: userInfo.name,
        profilePicture: userInfo.picture?.data?.url,
        locale: undefined, // Facebook doesn't provide locale in basic profile
      });
    } catch (error) {
      return err({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to map Facebook user profile',
        statusCode: 500,
        timestamp: new Date(),
      });
    }
  }
}

/**
 * Factory function to create OAuth PKCE service instance
 */
export const createOAuthPKCEService = (
  userRepository: UserRepository,
  authSessionRepository: AuthSessionRepository,
  emailService: EmailService
): IOAuthPKCEService => {
  return new OAuthPKCEService(userRepository, authSessionRepository, emailService);
};
