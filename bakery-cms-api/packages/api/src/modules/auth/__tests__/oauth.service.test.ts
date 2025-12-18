/**
 * OAuth Service Unit Tests
 * Comprehensive test suite for OAuth service functionality
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { OAuthService } from '../services/oauth.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { AuthSessionRepository } from '../repositories/auth-session.repository';
import { EmailService } from '../services/email.service';
import { OAuthProvider, UserModel, AuthSessionModel } from '@bakery-cms/common';
import { ok, err } from 'neverthrow';

// Mock passport and strategies
jest.mock('passport');
jest.mock('passport-google-oauth20');
jest.mock('passport-facebook');

// Mock repositories and services
jest.mock('../../users/repositories/user.repository');
jest.mock('../repositories/auth-session.repository');
jest.mock('../services/email.service');

const mockPassport = passport as jest.Mocked<typeof passport>;
const mockGoogleStrategy = GoogleStrategy as jest.MockedClass<typeof GoogleStrategy>;
const mockFacebookStrategy = FacebookStrategy as jest.MockedClass<typeof FacebookStrategy>;

describe('OAuthService', () => {
  let oauthService: OAuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockAuthSessionRepository: jest.Mocked<AuthSessionRepository>;
  let mockEmailService: jest.Mocked<EmailService>;

  const mockUser: Partial<UserModel> = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    provider: OAuthProvider.EMAIL,
    status: 'ACTIVE' as any,
    role: 'CUSTOMER' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession: Partial<AuthSessionModel> = {
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 3600000),
    deviceInfo: 'Test Device',
    ipAddress: '127.0.0.1',
    isRevoked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByProvider: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findWithPagination: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockAuthSessionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRefreshToken: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findWithPagination: jest.fn(),
    } as unknown as jest.Mocked<AuthSessionRepository>;

    mockEmailService = {
      sendWelcomeEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendSecurityAlertEmail: jest.fn(),
      verifyConnection: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    // Mock passport methods
    mockPassport.use = jest.fn();
    mockPassport.serializeUser = jest.fn();
    mockPassport.deserializeUser = jest.fn();

    oauthService = new OAuthService(
      mockUserRepository,
      mockAuthSessionRepository,
      mockEmailService
    );
  });

  describe('constructor and strategy setup', () => {
    it('should setup Google OAuth strategy', () => {
      expect(mockPassport.use).toHaveBeenCalledWith(expect.any(GoogleStrategy));
      expect(mockGoogleStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          clientID: expect.any(String),
          clientSecret: expect.any(String),
          callbackURL: expect.any(String),
        }),
        expect.any(Function)
      );
    });

    it('should setup Facebook OAuth strategy', () => {
      expect(mockPassport.use).toHaveBeenCalledWith(expect.any(FacebookStrategy));
      expect(mockFacebookStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          clientID: expect.any(String),
          clientSecret: expect.any(String),
          callbackURL: expect.any(String),
        }),
        expect.any(Function)
      );
    });

    it('should setup passport serialization', () => {
      expect(mockPassport.serializeUser).toHaveBeenCalled();
      expect(mockPassport.deserializeUser).toHaveBeenCalled();
    });
  });

  describe('handleOAuthCallback', () => {
    const mockGoogleProfile = {
      id: 'google-123',
      emails: [{ value: 'test@gmail.com', verified: true }],
      name: { givenName: 'John', familyName: 'Doe' },
      provider: 'google',
    };

    const mockFacebookProfile = {
      id: 'facebook-123',
      emails: [{ value: 'test@facebook.com' }],
      name: { givenName: 'Jane', familyName: 'Smith' },
      provider: 'facebook',
    };

    it('should handle new Google user registration', async () => {
      // Arrange
      mockUserRepository.findByProvider.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser as UserModel);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(ok(undefined));

      // Act
      const result = await oauthService.handleOAuthCallback(
        'access-token',
        'refresh-token',
        mockGoogleProfile as any
      );

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.findByProvider).toHaveBeenCalledWith(
        'google-123',
        OAuthProvider.GOOGLE
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@gmail.com',
          firstName: 'John',
          lastName: 'Doe',
          provider: OAuthProvider.GOOGLE,
        })
      );
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@gmail.com',
        'John'
      );
    });

    it('should handle existing Google user login', async () => {
      // Arrange
      mockUserRepository.findByProvider.mockResolvedValue(mockUser as UserModel);

      // Act
      const result = await oauthService.handleOAuthCallback(
        'access-token',
        'refresh-token',
        mockGoogleProfile as any
      );

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.findByProvider).toHaveBeenCalledWith(
        'google-123',
        OAuthProvider.GOOGLE
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should handle new Facebook user registration', async () => {
      // Arrange
      mockUserRepository.findByProvider.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        ...mockUser,
        email: 'test@facebook.com',
        firstName: 'Jane',
        lastName: 'Smith',
        provider: OAuthProvider.FACEBOOK,
      } as UserModel);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(ok(undefined));

      // Act
      const result = await oauthService.handleOAuthCallback(
        'access-token',
        'refresh-token',
        mockFacebookProfile as any
      );

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.findByProvider).toHaveBeenCalledWith(
        'facebook-123',
        OAuthProvider.FACEBOOK
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@facebook.com',
          firstName: 'Jane',
          lastName: 'Smith',
          provider: OAuthProvider.FACEBOOK,
        })
      );
    });

    it('should handle account linking for existing email user', async () => {
      // Arrange
      const existingUser = { ...mockUser, provider: OAuthProvider.EMAIL };
      mockUserRepository.findByProvider.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(existingUser as UserModel);
      mockUserRepository.update.mockResolvedValue(true);

      // Act
      const result = await oauthService.handleOAuthCallback(
        'access-token',
        'refresh-token',
        mockGoogleProfile as any
      );

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        existingUser.id,
        expect.objectContaining({
          oAuthProviders: expect.arrayContaining([
            expect.objectContaining({
              provider: OAuthProvider.GOOGLE,
              providerId: 'google-123',
            }),
          ]),
        })
      );
    });

    it('should handle missing email in OAuth profile', async () => {
      // Arrange
      const profileWithoutEmail = {
        id: 'google-123',
        emails: [],
        name: { givenName: 'John', familyName: 'Doe' },
        provider: 'google',
      };

      // Act
      const result = await oauthService.handleOAuthCallback(
        'access-token',
        'refresh-token',
        profileWithoutEmail as any
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('No email address');
        expect(result.error.statusCode).toBe(400);
      }
    });

    it('should handle user creation failure', async () => {
      // Arrange
      mockUserRepository.findByProvider.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await oauthService.handleOAuthCallback(
        'access-token',
        'refresh-token',
        mockGoogleProfile as any
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to create user');
        expect(result.error.statusCode).toBe(500);
      }
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate Google authorization URL', () => {
      // Act
      const result = oauthService.getAuthorizationUrl(OAuthProvider.GOOGLE, 'state123');

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('accounts.google.com');
        expect(result.value).toContain('client_id=');
        expect(result.value).toContain('state=state123');
        expect(result.value).toContain('scope=');
      }
    });

    it('should generate Facebook authorization URL', () => {
      // Act
      const result = oauthService.getAuthorizationUrl(OAuthProvider.FACEBOOK, 'state456');

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('facebook.com');
        expect(result.value).toContain('client_id=');
        expect(result.value).toContain('state=state456');
      }
    });

    it('should handle unsupported provider', () => {
      // Act
      const result = oauthService.getAuthorizationUrl('UNSUPPORTED' as OAuthProvider, 'state');

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Unsupported OAuth provider');
        expect(result.error.statusCode).toBe(400);
      }
    });

    it('should include PKCE parameters in authorization URL', () => {
      // Act
      const result = oauthService.getAuthorizationUrl(OAuthProvider.GOOGLE, 'state123');

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('code_challenge=');
        expect(result.value).toContain('code_challenge_method=S256');
      }
    });
  });

  describe('linkProvider', () => {
    it('should link OAuth provider to existing user', async () => {
      // Arrange
      const userId = 'user-123';
      const providerId = 'google-456';
      const provider = OAuthProvider.GOOGLE;
      
      mockUserRepository.findById.mockResolvedValue(mockUser as UserModel);
      mockUserRepository.update.mockResolvedValue(true);

      // Act
      const result = await oauthService.linkProvider(userId, provider, providerId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          oAuthProviders: expect.arrayContaining([
            expect.objectContaining({
              provider,
              providerId,
            }),
          ]),
        })
      );
    });

    it('should handle user not found', async () => {
      // Arrange
      const userId = 'nonexistent-user';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await oauthService.linkProvider(userId, OAuthProvider.GOOGLE, 'google-123');

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('User not found');
        expect(result.error.statusCode).toBe(404);
      }
    });

    it('should handle provider already linked', async () => {
      // Arrange
      const userId = 'user-123';
      const existingProvider = {
        provider: OAuthProvider.GOOGLE,
        providerId: 'google-456',
        linkedAt: new Date(),
      };
      
      const userWithLinkedProvider = {
        ...mockUser,
        oAuthProviders: [existingProvider],
      };
      
      mockUserRepository.findById.mockResolvedValue(userWithLinkedProvider as UserModel);

      // Act
      const result = await oauthService.linkProvider(
        userId,
        OAuthProvider.GOOGLE,
        'google-456'
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Provider already linked');
        expect(result.error.statusCode).toBe(409);
      }
    });

    it('should handle database update failure', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser as UserModel);
      mockUserRepository.update.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await oauthService.linkProvider(
        'user-123',
        OAuthProvider.GOOGLE,
        'google-123'
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to link provider');
        expect(result.error.statusCode).toBe(500);
      }
    });
  });

  describe('Profile Normalization', () => {
    it('should normalize Google profile correctly', () => {
      // This tests the internal profile normalization
      // Would be a private method test in real implementation
      const googleProfile = {
        id: 'google-123',
        emails: [{ value: 'test@gmail.com', verified: true }],
        name: { givenName: 'John', familyName: 'Doe' },
        provider: 'google',
      };

      // The normalization would happen internally during handleOAuthCallback
      // We can verify it by checking the create call
      mockUserRepository.findByProvider.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser as UserModel);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(ok(undefined));

      oauthService.handleOAuthCallback('access', 'refresh', googleProfile as any);

      // The create call would show normalized data
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@gmail.com',
          firstName: 'John',
          lastName: 'Doe',
          provider: OAuthProvider.GOOGLE,
        })
      );
    });

    it('should normalize Facebook profile correctly', async () => {
      // Arrange
      const facebookProfile = {
        id: 'facebook-123',
        emails: [{ value: 'test@facebook.com' }],
        name: { givenName: 'Jane', familyName: 'Smith' },
        provider: 'facebook',
      };

      mockUserRepository.findByProvider.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        ...mockUser,
        email: 'test@facebook.com',
        firstName: 'Jane',
        lastName: 'Smith',
      } as UserModel);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(ok(undefined));

      // Act
      await oauthService.handleOAuthCallback('access', 'refresh', facebookProfile as any);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@facebook.com',
          firstName: 'Jane',
          lastName: 'Smith',
          provider: OAuthProvider.FACEBOOK,
        })
      );
    });

    it('should handle missing name fields gracefully', async () => {
      // Arrange
      const incompleteProfile = {
        id: 'google-123',
        emails: [{ value: 'test@gmail.com' }],
        name: {},
        provider: 'google',
      };

      mockUserRepository.findByProvider.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser as UserModel);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(ok(undefined));

      // Act
      await oauthService.handleOAuthCallback('access', 'refresh', incompleteProfile as any);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@gmail.com',
          firstName: '',
          lastName: '',
          provider: OAuthProvider.GOOGLE,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during OAuth flow', async () => {
      // Arrange
      mockUserRepository.findByProvider.mockRejectedValue(new Error('Network timeout'));

      // Act
      const result = await oauthService.handleOAuthCallback(
        'access',
        'refresh',
        { id: 'test', emails: [{ value: 'test@example.com' }], provider: 'google' } as any
      );

      // Assert
      expect(result.isErr()).toBe(true);
    });

    it('should handle email service failures gracefully', async () => {
      // Arrange
      mockUserRepository.findByProvider.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser as UserModel);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(err({
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email',
        statusCode: 500,
        timestamp: new Date(),
      }));

      // Act
      const result = await oauthService.handleOAuthCallback(
        'access',
        'refresh',
        { id: 'test', emails: [{ value: 'test@example.com' }], provider: 'google' } as any
      );

      // Assert - Should still succeed even if email fails
      expect(result.isOk()).toBe(true);
    });
  });
});