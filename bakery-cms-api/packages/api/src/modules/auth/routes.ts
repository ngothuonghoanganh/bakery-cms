/**
 * Authentication routes
 * Express router configuration for authentication endpoints
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../config/database';
import { createUserRepository } from './repositories/user.repository';
import { createAuthSessionRepository } from './repositories/auth-session.repository';
import { createAuthService } from './services/auth.service';
import { createEmailService, getDefaultEmailConfig } from './services/email.service';
import { createOAuthService, getDefaultOAuthConfig } from './services/oauth.service';
import { createOAuthPKCEService } from './services/oauth-pkce.service';
import { createOAuthController } from './controllers/oauth.controller';
import { createAuthHandlers } from './controllers/auth.controllers';
import { createOAuthHandlers } from './controllers/oauth.controllers';
import { validateBody } from '../../middleware/validation';
import { createJwtAuthMiddleware, requireStatus } from '../../middleware/jwt-auth';
import {
  validateOAuthProvider,
  validateOAuthCallback,
  validateOAuthExchangeBody,
  sanitizeRedirectUri,
  logOAuthEvent,
} from '../../middleware/oauth.middleware';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  logoutSchema,
} from './validators/auth.validators';

/**
 * Create authentication router
 * Pure function that returns configured Express router
 */
export const createAuthRouter = (): Router => {
  const router = Router();
  
  // Get database models
  const models = getDatabaseModels();

  // Create repositories, service, and handlers (dependency injection)
  const userRepository = createUserRepository(models.User);
  const authSessionRepository = createAuthSessionRepository(models.AuthSession);
  const emailService = createEmailService(getDefaultEmailConfig());
  const oauthService = createOAuthService(userRepository, authSessionRepository, emailService, getDefaultOAuthConfig());
  const oauthPKCEService = createOAuthPKCEService(userRepository, authSessionRepository, emailService);
  const oauthController = createOAuthController(oauthPKCEService);
  const service = createAuthService(userRepository, authSessionRepository, emailService);
  const handlers = createAuthHandlers(service);
  const oauthHandlers = createOAuthHandlers({ oauthService });

  // Create JWT middleware (cast to any to avoid TypeScript conflicts)
  const jwtAuth = createJwtAuthMiddleware(service, userRepository)() as any;
  const statusAuth = requireStatus('active') as any;

  /**
   * POST /auth/login
   * Authenticate user with email/password
   */
  router.post(
    '/login',
    validateBody(loginSchema),
    handlers.handleLogin
  );

  /**
   * POST /auth/register
   * Register new user account
   */
  router.post(
    '/register',
    validateBody(registerSchema),
    handlers.handleRegister
  );

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  router.post(
    '/refresh',
    validateBody(refreshTokenSchema),
    handlers.handleRefreshToken
  );

  /**
   * POST /auth/logout
   * Logout from current session
   */
  router.post(
    '/logout',
    validateBody(logoutSchema),
    handlers.handleLogout
  );

  /**
   * POST /auth/logout/all
   * Logout from all sessions/devices
   * Requires authentication
   */
  router.post(
    '/logout/all',
    jwtAuth,
    statusAuth,
    handlers.handleLogoutAll
  );

  /**
   * PATCH /auth/password
   * Change user password
   * Requires authentication
   */
  router.patch(
    '/password',
    jwtAuth,
    statusAuth,
    validateBody(changePasswordSchema),
    handlers.handleChangePassword
  );

  /**
   * POST /auth/forgot-password
   * Initiate password reset process
   */
  router.post(
    '/forgot-password',
    validateBody(forgotPasswordSchema),
    handlers.handleForgotPassword
  );

  /**
   * POST /auth/reset-password
   * Reset password using token
   */
  router.post(
    '/reset-password',
    validateBody(resetPasswordSchema),
    handlers.handleResetPassword
  );

  /**
   * POST /auth/verify-email
   * Verify email address using token
   */
  router.post(
    '/verify-email',
    validateBody(verifyEmailSchema),
    handlers.handleVerifyEmail
  );

  /**
   * POST /auth/resend-verification
   * Resend email verification
   */
  router.post(
    '/resend-verification',
    validateBody(resendVerificationSchema),
    handlers.handleResendEmailVerification
  );

  /**
   * GET /auth/profile
   * Get current user profile
   * Requires authentication
   */
  router.get(
    '/profile',
    jwtAuth,
    statusAuth,
    handlers.handleGetProfile
  );

  /**
   * PATCH /auth/profile
   * Update current user profile
   * Requires authentication
   */
  router.patch(
    '/profile',
    jwtAuth,
    statusAuth,
    validateBody(updateProfileSchema),
    handlers.handleUpdateProfile
  );

  // =======================
  // OAuth Routes
  // =======================

  /**
   * GET /auth/google
   * Initiate Google OAuth flow
   */
  router.get('/google', oauthHandlers.initiateGoogleAuth);

  /**
   * GET /auth/google/callback
   * Handle Google OAuth callback
   */
  router.get('/google/callback', ...oauthHandlers.handleGoogleCallback);

  /**
   * GET /auth/facebook
   * Initiate Facebook OAuth flow
   */
  router.get('/facebook', oauthHandlers.initiateFacebookAuth);

  /**
   * GET /auth/facebook/callback
   * Handle Facebook OAuth callback
   */
  router.get('/facebook/callback', ...oauthHandlers.handleFacebookCallback);

  /**
   * GET /auth/oauth/urls
   * Get OAuth authorization URLs for client-side flows
   */
  router.get('/oauth/urls', oauthHandlers.getOAuthUrls);

  /**
   * POST /auth/oauth/link
   * Link OAuth provider to existing account
   * Requires authentication
   */
  router.post('/oauth/link', jwtAuth, statusAuth, oauthHandlers.linkOAuthProvider);

  /**
   * DELETE /auth/oauth/unlink
   * Unlink OAuth provider from account
   * Requires authentication
   */
  router.delete('/oauth/unlink', jwtAuth, statusAuth, oauthHandlers.unlinkOAuthProvider);

  /**
   * POST /auth/oauth/revoke
   * Revoke OAuth tokens and sessions
   * Requires authentication
   */
  router.post('/oauth/revoke', jwtAuth, statusAuth, oauthHandlers.revokeOAuthTokens);

  // =======================
  // OAuth PKCE Routes (New)
  // Modern OAuth 2.0 with PKCE security
  // =======================

  /**
   * GET /auth/oauth/:provider/authorize
   * Get OAuth authorization URL with PKCE challenge
   * Client-initiated OAuth flow
   */
  router.get(
    '/oauth/:provider/authorize',
    validateOAuthProvider,
    sanitizeRedirectUri,
    logOAuthEvent('authorize'),
    oauthController.getAuthorizationUrl.bind(oauthController)
  );

  /**
   * GET /auth/oauth/:provider/callback
   * Handle OAuth callback from provider
   * Completes PKCE flow and returns JWT tokens
   */
  router.get(
    '/oauth/:provider/callback',
    validateOAuthProvider,
    validateOAuthCallback,
    logOAuthEvent('callback'),
    oauthController.handleCallback.bind(oauthController)
  );

  /**
   * POST /auth/oauth/:provider/exchange
   * Direct code exchange for client-side flows
   * Client sends code + codeVerifier directly
   */
  router.post(
    '/oauth/:provider/exchange',
    validateOAuthProvider,
    validateOAuthExchangeBody,
    logOAuthEvent('exchange'),
    oauthController.exchangeCode.bind(oauthController)
  );

  return router;
};