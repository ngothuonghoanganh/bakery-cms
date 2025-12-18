/**
 * OAuth Controller
 * Handles OAuth authentication endpoints with PKCE security
 */

import { Request, Response, NextFunction } from 'express';
import { OAuthProvider } from '@bakery-cms/common';
import { IOAuthPKCEService } from '../services/oauth-pkce.service';
import { validateOAuthState } from '../utils/oauth.utils';
import { createLogger } from '../../../utils/logger';

const logger = createLogger();

/**
 * OAuth state storage interface
 * In production, use Redis or similar for state management
 */
interface OAuthStateStore {
  [state: string]: {
    provider: OAuthProvider;
    codeVerifier: string;
    redirectUri: string;
    timestamp: number;
  };
}

// Temporary in-memory state storage (replace with Redis in production)
const stateStore: OAuthStateStore = {};

/**
 * OAuth Controller class
 */
export class OAuthController {
  constructor(private oauthService: IOAuthPKCEService) {}

  /**
   * GET /auth/oauth/:provider/authorize
   * Initiates OAuth authorization flow
   * Returns authorization URL with PKCE challenge
   */
  async getAuthorizationUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = req.params['provider']?.toLowerCase() as OAuthProvider;
      const redirectUri = req.query['redirect_uri'] as string;

      // Validate provider
      if (!provider || !Object.values(OAuthProvider).includes(provider as OAuthProvider)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid OAuth provider',
          },
        });
        return;
      }

      // Validate redirect URI
      if (!redirectUri) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'redirect_uri is required',
          },
        });
        return;
      }

      // Get authorization URL with PKCE
      const result = await this.oauthService.getAuthorizationUrl(
        provider as OAuthProvider,
        redirectUri
      );

      if (result.isErr()) {
        res.status(result.error.statusCode || 500).json({
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        });
        return;
      }

      const { url, state, codeVerifier } = result.value;

      // Store state and code verifier for callback validation
      stateStore[state] = {
        provider: provider as OAuthProvider,
        codeVerifier,
        redirectUri,
        timestamp: Date.now(),
      };

      logger.info('OAuth authorization URL generated', { provider, state });

      res.status(200).json({
        success: true,
        data: {
          authorizationUrl: url,
          state, // Client should store this to validate callback
        },
      });
    } catch (error) {
      logger.error('Failed to generate OAuth authorization URL', { error });
      next(error);
    }
  }

  /**
   * GET /auth/oauth/:provider/callback
   * Handles OAuth provider callback after user authorization
   * Completes OAuth flow and returns JWT tokens
   */
  async handleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = req.params['provider']?.toLowerCase() as OAuthProvider;
      const code = req.query['code'] as string;
      const state = req.query['state'] as string;
      const error = req.query['error'] as string;
      const errorDescription = req.query['error_description'] as string;

      // Handle OAuth errors from provider
      if (error) {
        logger.warn('OAuth provider returned error', { provider, error, errorDescription });
        res.status(401).json({
          success: false,
          error: {
            code: 'OAUTH_ERROR',
            message: errorDescription || error,
          },
        });
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing code or state parameter',
          },
        });
        return;
      }

      // Retrieve and validate state
      const stateData = stateStore[state];
      if (!stateData) {
        logger.warn('Invalid or expired OAuth state', { state });
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Invalid or expired OAuth state',
          },
        });
        return;
      }

      // Validate state expiration (10 minutes)
      const stateValidation = validateOAuthState(
        {
          state,
          provider: stateData.provider,
          codeVerifier: stateData.codeVerifier,
          redirectUri: stateData.redirectUri,
          timestamp: stateData.timestamp,
        },
        10 * 60 * 1000
      );

      if (stateValidation.isErr()) {
        delete stateStore[state];
        res.status(401).json({
          success: false,
          error: {
            code: stateValidation.error.code,
            message: stateValidation.error.message,
          },
        });
        return;
      }

      // Verify provider matches
      if (stateData.provider !== provider) {
        delete stateStore[state];
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Provider mismatch',
          },
        });
        return;
      }

      // Exchange code for tokens
      const tokenResult = await this.oauthService.exchangeCodeForTokens(
        provider as OAuthProvider,
        code,
        stateData.codeVerifier,
        stateData.redirectUri
      );

      if (tokenResult.isErr()) {
        delete stateStore[state];
        res.status(tokenResult.error.statusCode || 401).json({
          success: false,
          error: {
            code: tokenResult.error.code,
            message: tokenResult.error.message,
          },
        });
        return;
      }

      const oauthTokens = tokenResult.value;

      // Get user profile from OAuth provider
      const profileResult = await this.oauthService.getUserProfile(
        provider as OAuthProvider,
        oauthTokens.accessToken
      );

      if (profileResult.isErr()) {
        delete stateStore[state];
        res.status(profileResult.error.statusCode || 401).json({
          success: false,
          error: {
            code: profileResult.error.code,
            message: profileResult.error.message,
          },
        });
        return;
      }

      const profile = profileResult.value;

      // Authenticate or create user
      const authResult = await this.oauthService.authenticateOrCreateUser(
        profile,
        oauthTokens.accessToken
      );

      if (authResult.isErr()) {
        delete stateStore[state];
        res.status(authResult.error.statusCode || 401).json({
          success: false,
          error: {
            code: authResult.error.code,
            message: authResult.error.message,
          },
        });
        return;
      }

      const { user, isNewUser, accessToken, refreshToken, expiresIn } = authResult.value;

      // Clean up state
      delete stateStore[state];

      logger.info('OAuth authentication successful', {
        userId: user.id,
        provider,
        isNewUser,
      });

      // Return authentication tokens
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            provider: user.provider,
          },
          tokens: {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn,
          },
          isNewUser,
        },
      });
    } catch (error) {
      logger.error('OAuth callback failed', { error });
      next(error);
    }
  }

  /**
   * POST /auth/oauth/:provider/exchange
   * Alternative endpoint for client-side token exchange
   * Client sends code + codeVerifier directly (no state storage)
   */
  async exchangeCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = req.params['provider']?.toLowerCase() as OAuthProvider;
      const { code, codeVerifier, redirectUri } = req.body;

      // Validate inputs
      if (!provider || !Object.values(OAuthProvider).includes(provider as OAuthProvider)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid OAuth provider',
          },
        });
        return;
      }

      if (!code || !codeVerifier || !redirectUri) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'code, codeVerifier, and redirectUri are required',
          },
        });
        return;
      }

      // Exchange code for tokens
      const tokenResult = await this.oauthService.exchangeCodeForTokens(
        provider as OAuthProvider,
        code,
        codeVerifier,
        redirectUri
      );

      if (tokenResult.isErr()) {
        res.status(tokenResult.error.statusCode || 401).json({
          success: false,
          error: {
            code: tokenResult.error.code,
            message: tokenResult.error.message,
          },
        });
        return;
      }

      const oauthTokens = tokenResult.value;

      // Get user profile
      const profileResult = await this.oauthService.getUserProfile(
        provider as OAuthProvider,
        oauthTokens.accessToken
      );

      if (profileResult.isErr()) {
        res.status(profileResult.error.statusCode || 401).json({
          success: false,
          error: {
            code: profileResult.error.code,
            message: profileResult.error.message,
          },
        });
        return;
      }

      const profile = profileResult.value;

      // Authenticate or create user
      const authResult = await this.oauthService.authenticateOrCreateUser(
        profile,
        oauthTokens.accessToken
      );

      if (authResult.isErr()) {
        res.status(authResult.error.statusCode || 401).json({
          success: false,
          error: {
            code: authResult.error.code,
            message: authResult.error.message,
          },
        });
        return;
      }

      const { user, isNewUser, accessToken, refreshToken, expiresIn } = authResult.value;

      logger.info('OAuth code exchange successful', {
        userId: user.id,
        provider,
        isNewUser,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            provider: user.provider,
          },
          tokens: {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn,
          },
          isNewUser,
        },
      });
    } catch (error) {
      logger.error('OAuth code exchange failed', { error });
      next(error);
    }
  }
}

/**
 * Factory function to create OAuth controller
 */
export const createOAuthController = (oauthService: IOAuthPKCEService): OAuthController => {
  return new OAuthController(oauthService);
};
