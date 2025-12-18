/**
 * Authentication Service Unit Tests
 * Comprehensive test suite for authentication business logic
 */

import { createAuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { AuthSessionRepository } from '../repositories/auth-session.repository';
import { EmailService } from '../services/email.service';
import { UserRole, UserStatus, AuthProvider } from '@bakery-cms/common';
import { UserModel } from '@bakery-cms/database/src/models/user.model';
import { AuthSessionModel } from '@bakery-cms/database/src/models/auth-session.model';
import * as passwordUtils from '../utils/password.utils';
import * as jwtUtils from '../utils/jwt.utils';
import { ok } from 'neverthrow';

// Mock dependencies
jest.mock('../utils/password.utils');
jest.mock('../utils/jwt.utils');
jest.mock('../../../utils/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

const mockPasswordUtils = passwordUtils as jest.Mocked<typeof passwordUtils>;
const mockJwtUtils = jwtUtils as jest.Mocked<typeof jwtUtils>;

describe('AuthService', () => {
  // Mock repositories and services
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockAuthSessionRepository: jest.Mocked<AuthSessionRepository>;
  let mockEmailService: jest.Mocked<EmailService>;
  let authService: ReturnType<typeof createAuthService>;

  // Test data helpers - simplified mock approach
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    provider: AuthProvider.LOCAL,
    passwordHash: 'hashed-password',
    providerId: undefined,
    emailVerifiedAt: new Date(),
    lastLoginAt: null,
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    // Mock virtual properties and methods
    fullName: 'John Doe',
    isLocked: false,
    isEmailVerified: true,
    isActive: true,
    isOAuthUser: false,
    incrementLoginAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
    lockAccount: jest.fn(),
    updateLastLogin: jest.fn(),
    verifyEmail: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    destroy: jest.fn(),
    toJSON: jest.fn(),
  } as unknown as UserModel;

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    deviceInfo: 'Test Device',
    ipAddress: '127.0.0.1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isRevoked: false,
    // Mock virtual properties and methods
    isExpired: false,
    isValid: true,
    daysUntilExpiry: 365,
    revoke: jest.fn(),
    refresh: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    destroy: jest.fn(),
    toJSON: jest.fn(),
  } as unknown as AuthSessionModel;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repositories
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
      updateLastLogin: jest.fn(),
      incrementLoginAttempts: jest.fn(),
      lockAccount: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockAuthSessionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRefreshToken: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteExpired: jest.fn(),
      revokeByUserId: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findWithPagination: jest.fn(),
      revoke: jest.fn(),
      revokeByRefreshToken: jest.fn(),
      revokeAllForUser: jest.fn(),
      cleanupRevoked: jest.fn(),
    } as unknown as jest.Mocked<AuthSessionRepository>;

    mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendSecurityAlertEmail: jest.fn(),
      verifyConnection: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    // Create auth service with mocked dependencies
    authService = createAuthService(
      mockUserRepository,
      mockAuthSessionRepository,
      mockEmailService
    );
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordUtils.verifyPassword.mockResolvedValue(ok(true));
      mockJwtUtils.generateAccessToken.mockReturnValue(ok('access-token'));
      mockJwtUtils.generateRefreshToken.mockReturnValue(ok('refresh-token'));
      mockAuthSessionRepository.create.mockResolvedValue(mockSession);
      mockUserRepository.updateLastLogin.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.user.email).toBe(mockUser.email);
        expect(result.value.tokens.accessToken).toBe('access-token');
        expect(result.value.tokens.refreshToken).toBe('refresh-token');
      }

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordUtils.verifyPassword).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockAuthSessionRepository.create).toHaveBeenCalled();
    });

    it('should fail login with non-existent user', async () => {
      // Arrange
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Invalid email or password');
        expect(result.error.statusCode).toBe(401);
      }

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockPasswordUtils.verifyPassword).not.toHaveBeenCalled();
    });

    it('should fail login with invalid password', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordUtils.verifyPassword.mockResolvedValue(ok(false));
      mockUserRepository.incrementLoginAttempts.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Invalid email or password');
        expect(result.error.statusCode).toBe(401);
      }
    });

    it('should fail login with inactive user', async () => {
      // Arrange
      const inactiveUser = { 
        ...mockUser, 
        status: UserStatus.SUSPENDED 
      } as unknown as UserModel;
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Login failed');
        expect(result.error.statusCode).toBe(500);
      }
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        acceptTerms: true,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordUtils.validatePassword.mockReturnValue({
        isValid: true,
        errors: [],
        strength: 'strong',
        score: 5,
      });
      mockPasswordUtils.hashPassword.mockResolvedValue(ok('hashed-password'));
      mockUserRepository.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        status: UserStatus.PENDING_VERIFICATION,
      } as unknown as UserModel);
      mockJwtUtils.generateAccessToken.mockReturnValue(ok('access-token'));
      mockJwtUtils.generateRefreshToken.mockReturnValue(ok('refresh-token'));
      mockJwtUtils.generateEmailVerificationToken.mockReturnValue(ok('verify-token'));
      mockAuthSessionRepository.create.mockResolvedValue(mockSession);
      mockEmailService.sendVerificationEmail.mockResolvedValue(ok({
        messageId: 'msg-123',
        accepted: ['newuser@example.com'],
        rejected: [],
        pending: [],
      }));

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe(registerDto.email);
        expect(result.value.firstName).toBe(registerDto.firstName);
        expect(result.value.lastName).toBe(registerDto.lastName);
      }

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith('password123');
      expect(mockUserRepository.create).toHaveBeenCalled();
      // Note: Email verification is sent separately, not during registration
    });

    it('should fail registration with existing email', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        acceptTerms: true,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Email already registered');
        expect(result.error.statusCode).toBe(409);
      }

      expect(mockPasswordUtils.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should fail registration with weak password', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'weak',
        firstName: 'Jane',
        lastName: 'Smith',
        acceptTerms: true,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordUtils.validatePassword.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
        strength: 'weak',
        score: 1,
      });

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Password must be at least 8 characters long');
        expect(result.error.statusCode).toBe(400);
      }

      expect(mockPasswordUtils.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should fail registration when terms not accepted', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        acceptTerms: false,
      };

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Registration failed');
        expect(result.error.statusCode).toBe(500);
      }

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid token', async () => {
      // Arrange
      const refreshDto = {
        refreshToken: 'valid-refresh-token',
      };

      mockJwtUtils.verifyRefreshToken.mockReturnValue(ok({ sub: 'user-123', email: 'test@example.com', role: 'customer', type: 'refresh' as any }));
      mockAuthSessionRepository.findByRefreshToken.mockResolvedValue(mockSession);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockJwtUtils.generateAccessToken.mockReturnValue(ok('new-access-token'));
      mockJwtUtils.generateRefreshToken.mockReturnValue(ok('new-refresh-token'));
      mockAuthSessionRepository.update.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        refreshToken: 'new-refresh-token',
      } as unknown as AuthSessionModel);

      // Act
      const result = await authService.refreshToken(refreshDto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.accessToken).toBe('new-access-token');
        expect(result.value.refreshToken).toBe('new-refresh-token');
      }

      expect(mockAuthSessionRepository.findByRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockAuthSessionRepository.update).toHaveBeenCalled();
    });

    it('should fail refresh with invalid token', async () => {
      // Arrange
      const refreshDto = {
        refreshToken: 'invalid-refresh-token',
      };

      mockAuthSessionRepository.findByRefreshToken.mockResolvedValue(null);

      // Act
      const result = await authService.refreshToken(refreshDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Token refresh failed');
        expect(result.error.statusCode).toBe(500);
      }

      expect(mockJwtUtils.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should fail refresh with expired token', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        isExpired: true,
        isValid: false,
      } as unknown as AuthSessionModel;
      const refreshDto = {
        refreshToken: 'expired-refresh-token',
      };

      mockAuthSessionRepository.findByRefreshToken.mockResolvedValue(expiredSession);

      // Act
      const result = await authService.refreshToken(refreshDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Token refresh failed');
        expect(result.error.statusCode).toBe(500);
      }
    });

    it('should fail refresh with revoked token', async () => {
      // Arrange
      const revokedSession = {
        ...mockSession,
        isRevoked: true,
        isValid: false,
      } as unknown as AuthSessionModel;
      const refreshDto = {
        refreshToken: 'revoked-refresh-token',
      };

      mockJwtUtils.verifyRefreshToken.mockReturnValue(ok({ sub: 'user-123', email: 'test@example.com', role: 'customer', type: 'refresh' as any }));
      mockAuthSessionRepository.findByRefreshToken.mockResolvedValue(revokedSession);

      // Act
      const result = await authService.refreshToken(refreshDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Refresh token has been revoked');
        expect(result.error.statusCode).toBe(401);
      }
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      // Arrange
      const changePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };
      const userId = 'user-123';

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPasswordUtils.verifyPassword.mockResolvedValue(ok(true));
      mockPasswordUtils.validatePassword.mockReturnValue({
        isValid: true,
        errors: [],
        strength: 'strong',
        score: 5,
      });
      mockPasswordUtils.hashPassword.mockResolvedValue(ok('new-hashed-password'));
      mockUserRepository.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      } as unknown as UserModel);

      // Act
      const result = await authService.changePassword(userId, changePasswordDto);

      // Assert
      expect(result.isOk()).toBe(true);

      expect(mockPasswordUtils.verifyPassword).toHaveBeenCalledWith('oldpassword', 'hashed-password');
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith('newpassword123');
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, expect.objectContaining({
        passwordHash: 'new-hashed-password',
      }));
    });

    it('should fail password change with incorrect current password', async () => {
      // Arrange
      const changePasswordDto = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };
      const userId = 'user-123';

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPasswordUtils.verifyPassword.mockResolvedValue(ok(false));

      // Act
      const result = await authService.changePassword(userId, changePasswordDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Current password is incorrect');
        expect(result.error.statusCode).toBe(401);
      }

      expect(mockPasswordUtils.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should fail password change with mismatched passwords', async () => {
      // Arrange
      const changePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      };
      const userId = 'user-123';

      // Act
      const result = await authService.changePassword(userId, changePasswordDto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('New password and confirmation do not match');
        expect(result.error.statusCode).toBe(400);
      }

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should successfully send password reset email', async () => {
      // Arrange
      const forgotPasswordDto = {
        email: 'test@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockJwtUtils.generatePasswordResetToken.mockReturnValue(ok('reset-token'));
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(ok({
        messageId: 'msg-123',
        accepted: ['test@example.com'],
        rejected: [],
        pending: [],
      }));

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result.isOk()).toBe(true);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockJwtUtils.generatePasswordResetToken).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should silently succeed with non-existent email for security', async () => {
      // Arrange
      const forgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result.isOk()).toBe(true);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockJwtUtils.generatePasswordResetToken).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully logout by revoking refresh token', async () => {
      // Arrange
      const logoutDto = {
        refreshToken: 'valid-refresh-token',
      };

      mockAuthSessionRepository.findByRefreshToken.mockResolvedValue(mockSession);
      mockAuthSessionRepository.update.mockResolvedValue({
        ...mockSession,
        isRevoked: true,
      } as unknown as AuthSessionModel);

      // Act
      const result = await authService.logout(logoutDto.refreshToken);

      // Assert
      expect(result.isOk()).toBe(true);

      expect(mockAuthSessionRepository.update).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({ isRevoked: true })
      );
    });

    it('should succeed even with invalid refresh token', async () => {
      // Arrange
      const logoutDto = {
        refreshToken: 'invalid-refresh-token',
      };

      mockAuthSessionRepository.findByRefreshToken.mockResolvedValue(null);

      // Act
      const result = await authService.logout(logoutDto.refreshToken);

      // Assert
      expect(result.isOk()).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('should successfully get user profile', async () => {
      // Arrange
      const userId = 'user-123';

      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.getProfile(userId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(mockUser.id);
        expect(result.value.email).toBe(mockUser.email);
        expect(result.value.firstName).toBe(mockUser.firstName);
        expect(result.value.lastName).toBe(mockUser.lastName);
      }

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should fail to get profile for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user';

      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await authService.getProfile(userId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('User with id non-existent-user not found');
        expect(result.error.statusCode).toBe(404);
      }
    });
  });
});