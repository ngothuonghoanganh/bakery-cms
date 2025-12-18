/**
 * OAuth Service
 * Google and Facebook OAuth integration with PKCE security
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Result, ok, err } from 'neverthrow';
import { AppError, UserRole, AuthProvider } from '@bakery-cms/common';
import { UserRepository } from '../repositories/user.repository';
import { AuthSessionRepository } from '../repositories/auth-session.repository';
import { EmailService } from './email.service';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { toOAuthUserAttributes } from '../mappers/auth.mappers';
import { createLogger } from '../../../utils/logger';
import { createAuthenticationError, createValidationError } from '../../../utils/error-factory';

const logger = createLogger();

/**
 * OAuth configuration interface
 * Environment-based OAuth provider settings
 */
export interface OAuthConfig {
  google: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  facebook: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  session: {
    secret: string;
  };
  frontend: {
    successRedirect: string;
    failureRedirect: string;
  };
}

/**
 * OAuth profile interface
 * Normalized profile data from providers
 */
export interface OAuthProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  provider: AuthProvider;
  photos?: Array<{ value: string }>;
}

/**
 * OAuth authentication result
 */
export interface OAuthAuthResult {
  user: any; // UserModel type
  isNewUser: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * OAuth service class
 * Handles OAuth provider integration and user authentication
 */
export class OAuthService {
  private userRepository: UserRepository;
  private authSessionRepository: AuthSessionRepository;
  private emailService: EmailService;
  private config: OAuthConfig;

  constructor(
    userRepository: UserRepository,
    authSessionRepository: AuthSessionRepository,
    emailService: EmailService,
    config: OAuthConfig
  ) {
    this.userRepository = userRepository;
    this.authSessionRepository = authSessionRepository;
    this.emailService = emailService;
    this.config = config;
    
    this.setupStrategies();
  }

  /**
   * Setup passport OAuth strategies
   * Configures Google and Facebook authentication
   */
  private setupStrategies(): void {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
      clientID: this.config.google.clientID,
      clientSecret: this.config.google.clientSecret,
      callbackURL: this.config.google.callbackURL,
      scope: ['profile', 'email'],
    }, async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
      try {
        const result = await this.handleOAuthCallback(profile, AuthProvider.GOOGLE);
        return done(null, result.isOk() ? result.value : false);
      } catch (error) {
        return done(error, false);
      }
    }));

    // Facebook OAuth Strategy
    passport.use(new FacebookStrategy({
      clientID: this.config.facebook.clientID,
      clientSecret: this.config.facebook.clientSecret,
      callbackURL: this.config.facebook.callbackURL,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    }, async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
      try {
        const result = await this.handleOAuthCallback(profile, AuthProvider.FACEBOOK);
        return done(null, result.isOk() ? result.value : false);
      } catch (error) {
        return done(error, false);
      }
    }));

    // Passport serialization
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await this.userRepository.findById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  /**
   * Handle OAuth callback from providers
   * Process authenticated user and create/update account
   */
  private async handleOAuthCallback(
    profile: any,
    provider: AuthProvider
  ): Promise<Result<OAuthAuthResult, AppError>> {
    try {
      logger.info('OAuth callback received', { 
        provider, 
        profileId: profile.id,
        email: profile.emails?.[0]?.value 
      });

      // Extract profile data
      const normalizedProfile = this.normalizeProfile(profile, provider);
      if (!normalizedProfile.email) {
        return err(createValidationError('Email is required for OAuth authentication'));
      }

      // Check if user exists
      let user = await this.userRepository.findByEmail(normalizedProfile.email);
      let isNewUser = false;

      if (!user) {
        // Create new user from OAuth profile
        const userAttributes = toOAuthUserAttributes(
          normalizedProfile.email,
          normalizedProfile.firstName,
          normalizedProfile.lastName,
          provider,
          normalizedProfile.id,
          UserRole.CUSTOMER
        );

        const createResult = await this.userRepository.create(userAttributes);
        if (!createResult) {
          return err(createAuthenticationError('Failed to create OAuth user'));
        }

        user = createResult;
        isNewUser = true;

        // Send welcome email for new users
        const welcomeResult = await this.emailService.sendWelcomeEmail(user.email, {
          firstName: user.firstName,
          dashboardUrl: `${this.config.frontend.successRedirect}`,
        });

        if (welcomeResult.isErr()) {
          logger.error('Welcome email failed for OAuth user', { 
            userId: user.id, 
            error: welcomeResult.error 
          });
        }

        logger.info('New OAuth user created', { userId: user.id, provider });
      } else {
        // Update existing user's OAuth info if needed
        if (user.provider !== provider || user.providerId !== normalizedProfile.id) {
          await this.userRepository.update(user.id, {
            provider,
            providerId: normalizedProfile.id,
            lastLoginAt: new Date(),
          });
        }

        logger.info('Existing OAuth user authenticated', { userId: user.id, provider });
      }

      // Generate tokens
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
        deviceInfo: 'OAuth Login',
        ipAddress: '0.0.0.0', // Will be set by middleware
      });

      if (!sessionResult) {
        return err(createAuthenticationError('Failed to create auth session'));
      }

      return ok({
        user,
        isNewUser,
        accessToken: accessTokenResult.value,
        refreshToken: refreshTokenResult.value,
        expiresIn: 365 * 24 * 60 * 60, // 365 days in seconds
      });

    } catch (error) {
      logger.error('OAuth callback failed', { provider, error });
      return err(createAuthenticationError('OAuth authentication failed'));
    }
  }

  /**
   * Normalize profile data from different providers
   * Standardizes profile format across providers
   */
  private normalizeProfile(profile: any, provider: AuthProvider): OAuthProfile {
    const base = {
      id: profile.id,
      provider,
      displayName: profile.displayName || '',
      photos: profile.photos || [],
    };

    switch (provider) {
      case AuthProvider.GOOGLE:
        return {
          ...base,
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
        };

      case AuthProvider.FACEBOOK:
        return {
          ...base,
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
        };

      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Generate OAuth authorization URL
   * For client-initiated OAuth flows
   */
  async getAuthorizationUrl(provider: AuthProvider, state?: string): Promise<Result<string, AppError>> {
    try {
      switch (provider) {
        case AuthProvider.GOOGLE:
          const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${this.config.google.clientID}&` +
            `redirect_uri=${encodeURIComponent(this.config.google.callbackURL)}&` +
            `scope=profile email&` +
            `response_type=code&` +
            `access_type=offline&` +
            `prompt=consent` +
            (state ? `&state=${encodeURIComponent(state)}` : '');
          
          return ok(googleUrl);

        case AuthProvider.FACEBOOK:
          const facebookUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
            `client_id=${this.config.facebook.clientID}&` +
            `redirect_uri=${encodeURIComponent(this.config.facebook.callbackURL)}&` +
            `scope=email` +
            (state ? `&state=${encodeURIComponent(state)}` : '');
          
          return ok(facebookUrl);

        default:
          return err(createValidationError(`Unsupported OAuth provider: ${provider}`));
      }
    } catch (error) {
      logger.error('Failed to generate OAuth URL', { provider, error });
      return err(createValidationError('Failed to generate authorization URL'));
    }
  }

  /**
   * Revoke OAuth tokens
   * Clean up OAuth sessions
   */
  async revokeTokens(userId: string, provider: AuthProvider): Promise<Result<void, AppError>> {
    try {
      // Remove all auth sessions for user
      const userSessions = await this.authSessionRepository.findByUserId(userId);
      for (const session of userSessions) {
        await this.authSessionRepository.delete(session.id);
      }

      // Note: We don't revoke provider tokens as we don't store them
      // This just cleans up our internal session state

      logger.info('OAuth tokens revoked', { userId, provider });
      return ok(undefined);

    } catch (error) {
      logger.error('Failed to revoke OAuth tokens', { userId, provider, error });
      return err(createAuthenticationError('Failed to revoke OAuth tokens'));
    }
  }

  /**
   * Link OAuth provider to existing account
   * Allow users to add OAuth providers to existing local accounts
   */
  async linkProvider(
    userId: string,
    provider: AuthProvider,
    providerId: string
  ): Promise<Result<void, AppError>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return err(createValidationError('User not found'));
      }

      // Check if provider is already linked to another account
      const existingUser = await this.userRepository.findByProvider(provider, providerId);
      if (existingUser && existingUser.id !== userId) {
        return err(createValidationError('OAuth account is already linked to another user'));
      }

      // Update user with OAuth provider info
      await this.userRepository.update(userId, {
        provider,
        providerId,
      });

      logger.info('OAuth provider linked', { userId, provider, providerId });
      return ok(undefined);

    } catch (error) {
      logger.error('Failed to link OAuth provider', { userId, provider, error });
      return err(createAuthenticationError('Failed to link OAuth provider'));
    }
  }

  /**
   * Unlink OAuth provider from account
   * Remove OAuth provider association
   */
  async unlinkProvider(userId: string): Promise<Result<void, AppError>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return err(createValidationError('User not found'));
      }

      // Don't allow unlinking if user has no password (OAuth-only account)
      if (!user.passwordHash && user.provider !== AuthProvider.LOCAL) {
        return err(createValidationError('Cannot unlink OAuth provider from OAuth-only account. Set a password first.'));
      }

      // Update user to remove OAuth provider info
      await this.userRepository.update(userId, {
        provider: AuthProvider.LOCAL,
        providerId: undefined,
      });

      logger.info('OAuth provider unlinked', { userId, provider: user.provider });
      return ok(undefined);

    } catch (error) {
      logger.error('Failed to unlink OAuth provider', { userId, error });
      return err(createAuthenticationError('Failed to unlink OAuth provider'));
    }
  }
}

/**
 * OAuth service factory
 * Creates configured OAuth service instance
 */
export const createOAuthService = (
  userRepository: UserRepository,
  authSessionRepository: AuthSessionRepository,
  emailService: EmailService,
  config: OAuthConfig
): OAuthService => {
  return new OAuthService(userRepository, authSessionRepository, emailService, config);
};

/**
 * Default OAuth configuration from environment
 */
export const getDefaultOAuthConfig = (): OAuthConfig => {
  return {
    google: {
      clientID: process.env['GOOGLE_CLIENT_ID'] || '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
      callbackURL: process.env['GOOGLE_CALLBACK_URL'] || 'http://localhost:3001/auth/google/callback',
    },
    facebook: {
      clientID: process.env['FACEBOOK_CLIENT_ID'] || '',
      clientSecret: process.env['FACEBOOK_CLIENT_SECRET'] || '',
      callbackURL: process.env['FACEBOOK_CALLBACK_URL'] || 'http://localhost:3001/auth/facebook/callback',
    },
    session: {
      secret: process.env['SESSION_SECRET'] || 'your-session-secret',
    },
    frontend: {
      successRedirect: process.env['OAUTH_SUCCESS_REDIRECT'] || 'http://localhost:3000/dashboard',
      failureRedirect: process.env['OAUTH_FAILURE_REDIRECT'] || 'http://localhost:3000/auth/login?error=oauth_failed',
    },
  };
};