/**
 * OAuth Controllers
 * HTTP handlers for OAuth authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { OAuthService } from '../services/oauth.service';
import { AuthProvider } from '@bakery-cms/common';
import { createLogger } from '../../../utils/logger';

const logger = createLogger();

/**
 * OAuth controller dependencies
 */
interface OAuthControllerDependencies {
  oauthService: OAuthService;
}

/**
 * OAuth controller factory
 * Creates OAuth HTTP handlers with dependency injection
 */
export const createOAuthHandlers = ({ oauthService }: OAuthControllerDependencies) => {

  /**
   * GET /auth/google
   * Initiate Google OAuth flow
   */
  const initiateGoogleAuth = (req: Request, res: Response, next: NextFunction): void => {
    logger.info('Google OAuth initiation', { ip: req.ip });
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent',
    })(req, res, next);
  };

  /**
   * GET /auth/google/callback
   * Handle Google OAuth callback
   */
  const handleGoogleCallback = [
    passport.authenticate('google', { 
      session: false,
      failureRedirect: process.env['OAUTH_FAILURE_REDIRECT'] || 'http://localhost:3000/auth/login?error=oauth_failed'
    }),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const authResult = req.user as any;
        
        if (!authResult) {
          logger.error('Google OAuth callback failed - no auth result');
          res.redirect(process.env['OAUTH_FAILURE_REDIRECT'] || 'http://localhost:3000/auth/login?error=oauth_failed');
          return;
        }

        // Set JWT tokens as HTTP-only cookies
        res.cookie('accessToken', authResult.accessToken, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'lax',
          maxAge: authResult.expiresIn * 1000,
        });

        res.cookie('refreshToken', authResult.refreshToken, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
        });

        logger.info('Google OAuth success', { 
          userId: authResult.user.id,
          isNewUser: authResult.isNewUser
        });

        // Redirect to frontend with success indicator
        const successUrl = new URL(process.env['OAUTH_SUCCESS_REDIRECT'] || 'http://localhost:3000/dashboard');
        successUrl.searchParams.set('auth', 'success');
        if (authResult.isNewUser) {
          successUrl.searchParams.set('newUser', 'true');
        }

        res.redirect(successUrl.toString());

      } catch (error) {
        logger.error('Google OAuth callback error', { error });
        res.redirect(process.env['OAUTH_FAILURE_REDIRECT'] || 'http://localhost:3000/auth/login?error=oauth_failed');
      }
    }
  ];

  /**
   * GET /auth/facebook
   * Initiate Facebook OAuth flow
   */
  const initiateFacebookAuth = (req: Request, res: Response, next: NextFunction): void => {
    logger.info('Facebook OAuth initiation', { ip: req.ip });
    passport.authenticate('facebook', {
      scope: ['email'],
    })(req, res, next);
  };

  /**
   * GET /auth/facebook/callback
   * Handle Facebook OAuth callback
   */
  const handleFacebookCallback = [
    passport.authenticate('facebook', { 
      session: false,
      failureRedirect: process.env['OAUTH_FAILURE_REDIRECT'] || 'http://localhost:3000/auth/login?error=oauth_failed'
    }),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const authResult = req.user as any;
        
        if (!authResult) {
          logger.error('Facebook OAuth callback failed - no auth result');
          res.redirect(process.env['OAUTH_FAILURE_REDIRECT'] || 'http://localhost:3000/auth/login?error=oauth_failed');
          return;
        }

        // Set JWT tokens as HTTP-only cookies
        res.cookie('accessToken', authResult.accessToken, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'lax',
          maxAge: authResult.expiresIn * 1000,
        });

        res.cookie('refreshToken', authResult.refreshToken, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
        });

        logger.info('Facebook OAuth success', { 
          userId: authResult.user.id,
          isNewUser: authResult.isNewUser
        });

        // Redirect to frontend with success indicator
        const successUrl = new URL(process.env['OAUTH_SUCCESS_REDIRECT'] || 'http://localhost:3000/dashboard');
        successUrl.searchParams.set('auth', 'success');
        if (authResult.isNewUser) {
          successUrl.searchParams.set('newUser', 'true');
        }

        res.redirect(successUrl.toString());

      } catch (error) {
        logger.error('Facebook OAuth callback error', { error });
        res.redirect(process.env['OAUTH_FAILURE_REDIRECT'] || 'http://localhost:3000/auth/login?error=oauth_failed');
      }
    }
  ];

  /**
   * GET /auth/oauth/urls
   * Get OAuth authorization URLs for client-side flows
   */
  const getOAuthUrls = async (req: Request, res: Response): Promise<void> => {
    try {
      const state = req.query['state'] as string;

      const googleUrlResult = await oauthService.getAuthorizationUrl(AuthProvider.GOOGLE, state);
      const facebookUrlResult = await oauthService.getAuthorizationUrl(AuthProvider.FACEBOOK, state);

      if (googleUrlResult.isErr() || facebookUrlResult.isErr()) {
        res.status(500).json({
          error: {
            code: 'OAUTH_URL_ERROR',
            message: 'Failed to generate OAuth URLs',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.json({
        google: googleUrlResult.value,
        facebook: facebookUrlResult.value,
      });

    } catch (error) {
      logger.error('OAuth URLs generation failed', { error });
      res.status(500).json({
        error: {
          code: 'OAUTH_URL_ERROR',
          message: 'Failed to generate OAuth URLs',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * POST /auth/oauth/link
   * Link OAuth provider to existing account
   */
  const linkOAuthProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      // This would require authenticated user context
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const { provider, providerId } = req.body;

      if (!provider || !providerId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Provider and providerId are required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await oauthService.linkProvider(userId, provider, providerId);

      if (result.isErr()) {
        res.status(result.error.statusCode).json({
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: result.error.timestamp.toISOString(),
          },
        });
        return;
      }

      logger.info('OAuth provider linked', { userId, provider });
      res.json({
        message: 'OAuth provider linked successfully',
        success: true,
      });

    } catch (error) {
      logger.error('OAuth provider linking failed', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to link OAuth provider',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * DELETE /auth/oauth/unlink
   * Unlink OAuth provider from account
   */
  const unlinkOAuthProvider = async (req: Request, res: Response): Promise<void> => {
    try {
      // This would require authenticated user context
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await oauthService.unlinkProvider(userId);

      if (result.isErr()) {
        res.status(result.error.statusCode).json({
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: result.error.timestamp.toISOString(),
          },
        });
        return;
      }

      logger.info('OAuth provider unlinked', { userId });
      res.json({
        message: 'OAuth provider unlinked successfully',
        success: true,
      });

    } catch (error) {
      logger.error('OAuth provider unlinking failed', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unlink OAuth provider',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * POST /auth/oauth/revoke
   * Revoke OAuth tokens and sessions
   */
  const revokeOAuthTokens = async (req: Request, res: Response): Promise<void> => {
    try {
      // This would require authenticated user context
      const userId = (req as any).user?.id;
      const provider = (req as any).user?.provider;
      
      if (!userId || !provider) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await oauthService.revokeTokens(userId, provider);

      if (result.isErr()) {
        res.status(result.error.statusCode).json({
          error: {
            code: result.error.code,
            message: result.error.message,
            timestamp: result.error.timestamp.toISOString(),
          },
        });
        return;
      }

      logger.info('OAuth tokens revoked', { userId, provider });
      res.json({
        message: 'OAuth tokens revoked successfully',
        success: true,
      });

    } catch (error) {
      logger.error('OAuth token revocation failed', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to revoke OAuth tokens',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  return {
    initiateGoogleAuth,
    handleGoogleCallback,
    initiateFacebookAuth,
    handleFacebookCallback,
    getOAuthUrls,
    linkOAuthProvider,
    unlinkOAuthProvider,
    revokeOAuthTokens,
  };
};

/**
 * OAuth handler type
 * Type definition for OAuth handlers object
 */
export type OAuthHandlers = ReturnType<typeof createOAuthHandlers>;