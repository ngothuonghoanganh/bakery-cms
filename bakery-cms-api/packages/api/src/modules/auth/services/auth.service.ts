/**
 * Authentication service
 * Business logic layer for authentication and user management
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import { AppError } from '@bakery-cms/common';
import { UserRole, AuthProvider } from '@bakery-cms/common';
import { UserModel, TokenType } from '@bakery-cms/database';
import { UserRepository } from '../repositories/user.repository';
import { AuthSessionRepository } from '../repositories/auth-session.repository';
import { EmailService } from './email.service';
import {
  LoginRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
  LoginResponseDto,
  TokenPairDto,
  UserResponseDto,
} from '../dto/auth.dto';
import {
  toUserResponseDto,
  toCreateUserAttributes,
  toOAuthUserAttributes,
} from '../mappers/auth.mappers';
import {
  hashPassword,
  verifyPassword,
} from '../utils/password.utils';
import {
  validatePassword,
  shouldLockAccount,
  calculateLockoutExpiration,
  isAccountLocked,
  shouldResetAttempts,
  LOCKOUT_CONFIG,
} from '../utils/security.utils';
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
} from '../utils/jwt.utils';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
  createAuthenticationError,
  createConflictError,
  createAuthorizationError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Authentication service interface
 * Defines all business operations for authentication
 */
export interface AuthService {
  // Authentication operations
  login(dto: LoginRequestDto): Promise<Result<LoginResponseDto, AppError>>;
  register(dto: RegisterRequestDto): Promise<Result<UserResponseDto, AppError>>;
  refreshToken(dto: RefreshTokenRequestDto): Promise<Result<TokenPairDto, AppError>>;
  logout(refreshToken: string): Promise<Result<void, AppError>>;
  logoutAll(userId: string): Promise<Result<void, AppError>>;
  
  // Password management
  changePassword(userId: string, dto: ChangePasswordRequestDto): Promise<Result<void, AppError>>;
  forgotPassword(dto: ForgotPasswordRequestDto): Promise<Result<void, AppError>>;
  resetPassword(dto: ResetPasswordRequestDto): Promise<Result<void, AppError>>;
  
  // Email verification
  verifyEmail(dto: VerifyEmailRequestDto): Promise<Result<void, AppError>>;
  resendEmailVerification(email: string): Promise<Result<void, AppError>>;
  
  // User profile operations
  getProfile(userId: string): Promise<Result<UserResponseDto, AppError>>;
  updateProfile(userId: string, firstName?: string, lastName?: string): Promise<Result<UserResponseDto, AppError>>;
  
  // OAuth operations
  createOAuthUser(
    email: string,
    firstName: string,
    lastName: string,
    provider: AuthProvider,
    providerId: string,
    role?: UserRole
  ): Promise<Result<LoginResponseDto, AppError>>;
  
  // Token validation
  validateAccessToken(token: string): Promise<Result<string, AppError>>; // Returns userId
}

/**
 * Create authentication service
 * Factory function that returns service implementation
 * Uses dependency injection for repositories
 */
export const createAuthService = (
  userRepository: UserRepository,
  authSessionRepository: AuthSessionRepository,
  emailService: EmailService
): AuthService => {
  
  /**
   * Login with email and password
   */
  const login = async (dto: LoginRequestDto): Promise<Result<LoginResponseDto, AppError>> => {
    try {
      logger.info('User login attempt', { email: dto.email });

      // Find user by email
      const user = await userRepository.findByEmail(dto.email);
      if (!user) {
        logger.warn('Login failed: user not found', { email: dto.email });
        return err(createAuthenticationError('Invalid email or password'));
      }

      // Check if account is locked (BR-008: Account Lockout)
      if (isAccountLocked(user.lockedUntil)) {
        const remainingMinutes = Math.ceil((new Date(user.lockedUntil!).getTime() - Date.now()) / (1000 * 60));
        logger.warn('Login blocked: account locked', { userId: user.id, remainingMinutes });
        return err(createAuthorizationError(`Account is temporarily locked. Try again in ${remainingMinutes} minutes.`));
      }

      // Check if login attempts should be reset (BR-008: Reset after 15 minutes of inactivity)
      if (user.lastLoginAttemptAt && shouldResetAttempts(user.lastLoginAttemptAt)) {
        await userRepository.resetLoginAttempts(user.id);
        user.loginAttempts = 0;
      }

      // For OAuth users, password login is not allowed
      if (user.isOAuthUser) {
        logger.warn('Login failed: OAuth user attempted password login', { userId: user.id });
        return err(createAuthenticationError('Please login using your OAuth provider'));
      }

      // Verify password
      if (!user.passwordHash || !dto.password) {
        logger.warn('Login failed: missing password data', { userId: user.id });
        return err(createAuthenticationError('Invalid email or password'));
      }

      const passwordVerifyResult = await verifyPassword(dto.password, user.passwordHash);
      if (passwordVerifyResult.isErr()) {
        logger.error('Password verification failed', { userId: user.id, error: passwordVerifyResult.error });
        await userRepository.incrementLoginAttempts(user.id);
        
        // Check if should lock account after failed attempt (BR-008: Lock after 5 attempts)
        const updatedUser = await userRepository.findById(user.id);
        if (updatedUser && shouldLockAccount(updatedUser.loginAttempts)) {
          const lockoutExpiration = calculateLockoutExpiration();
          await userRepository.lockAccount(user.id, LOCKOUT_CONFIG.lockoutDurationMinutes);
          logger.warn('Account locked due to excessive login attempts', { 
            userId: user.id, 
            attempts: updatedUser.loginAttempts,
            lockedUntil: lockoutExpiration 
          });
          return err(createAuthorizationError('Account locked due to too many failed login attempts. Try again in 30 minutes.'));
        }
        
        const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - (updatedUser?.loginAttempts || 0);
        return err(createAuthenticationError(`Invalid email or password. ${remainingAttempts} attempts remaining before account lockout.`));
      }

      if (!passwordVerifyResult.value) {
        await userRepository.incrementLoginAttempts(user.id);
        
        const updatedUser = await userRepository.findById(user.id);
        if (updatedUser && shouldLockAccount(updatedUser.loginAttempts)) {
          const lockoutExpiration = calculateLockoutExpiration();
          await userRepository.lockAccount(user.id, LOCKOUT_CONFIG.lockoutDurationMinutes);
          logger.warn('Account locked due to excessive login attempts', { 
            userId: user.id, 
            attempts: updatedUser.loginAttempts,
            lockedUntil: lockoutExpiration 
          });
          return err(createAuthorizationError('Account locked due to too many failed login attempts. Try again in 30 minutes.'));
        }
        
        const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - (updatedUser?.loginAttempts || 0);
        return err(createAuthenticationError(`Invalid email or password. ${remainingAttempts} attempts remaining before account lockout.`));
      }

      // Check if email is verified for local users
      if (user.provider === AuthProvider.LOCAL && !user.isEmailVerified) {
        logger.warn('Login failed: email not verified', { userId: user.id });
        return err(createAuthorizationError('Please verify your email before logging in'));
      }

      // Generate tokens
      const accessTokenResult = await generateAccessToken(user.id, user.email, user.role as string);
      const refreshTokenResult = await generateRefreshToken(user.id, user.email, user.role as string);

      if (accessTokenResult.isErr()) {
        logger.error('Failed to generate access token', { userId: user.id, error: accessTokenResult.error });
        return err(createDatabaseError('Authentication failed'));
      }

      if (refreshTokenResult.isErr()) {
        logger.error('Failed to generate refresh token', { userId: user.id, error: refreshTokenResult.error });
        return err(createDatabaseError('Authentication failed'));
      }

      // Create auth session
      const sessionData = {
        userId: user.id,
        refreshToken: refreshTokenResult.value,
        tokenType: TokenType.REFRESH,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
        deviceInfo: dto.deviceInfo || undefined,
        ipAddress: undefined,
        userAgent: undefined,
      };

      const session = await authSessionRepository.create(sessionData);
      if (!session) {
        logger.error('Failed to create auth session', { userId: user.id });
        return err(createDatabaseError('Authentication failed'));
      }

      // Update user login information and reset login attempts
      await userRepository.updateLastLogin(user.id);
      await userRepository.resetLoginAttempts(user.id);

      logger.info('User login successful', { userId: user.id });

      // Build LoginResponseDto
      const response: LoginResponseDto = {
        user: toUserResponseDto(user),
        tokens: {
          accessToken: accessTokenResult.value,
          refreshToken: refreshTokenResult.value,
          tokenType: 'Bearer',
          expiresIn: 365 * 24 * 60 * 60, // 365 days in seconds
        },
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      return ok(response);
    } catch (error) {
      logger.error('Login failed with error', { error, email: dto.email });
      return err(createDatabaseError('Login failed'));
    }
  };

  /**
   * Register new user
   */
  const register = async (dto: RegisterRequestDto): Promise<Result<UserResponseDto, AppError>> => {
    try {
      logger.info('User registration attempt', { email: dto.email });

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(dto.email);
      if (existingUser) {
        logger.warn('Registration failed: email already exists', { email: dto.email });
        return err(createConflictError('Email already registered'));
      }

      // Validate password strength (BR-005: Password Requirements)
      const passwordValidation = validatePassword(dto.password);
      if (!passwordValidation.isValid) {
        logger.warn('Registration failed: weak password', { 
          email: dto.email, 
          errors: passwordValidation.errors 
        });
        return err(createInvalidInputError(`Password requirements not met: ${passwordValidation.errors.join(', ')}`));
      }

      // Hash password
      const hashResult = await hashPassword(dto.password);
      if (hashResult.isErr()) {
        logger.error('Password hashing failed', { email: dto.email, error: hashResult.error });
        return err(createDatabaseError('Registration failed'));
      }

      // Create user
      const userAttributes = toCreateUserAttributes(dto, hashResult.value);
      const user = await userRepository.create(userAttributes);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return ok(toUserResponseDto(user));
    } catch (error) {
      logger.error('Registration failed with error', { error, email: dto.email });
      return err(createDatabaseError('Registration failed'));
    }
  };

  /**
   * Refresh access token
   */
  const refreshToken = async (dto: RefreshTokenRequestDto): Promise<Result<TokenPairDto, AppError>> => {
    try {
      logger.debug('Token refresh attempt', { refreshToken: dto.refreshToken.substring(0, 20) + '...' });

      // Verify refresh token
      const tokenVerifyResult = await verifyRefreshToken(dto.refreshToken);
      if (tokenVerifyResult.isErr()) {
        logger.warn('Token refresh failed: invalid token', { error: tokenVerifyResult.error });
        return err(createAuthenticationError('Invalid refresh token'));
      }

      const { sub: userId } = tokenVerifyResult.value;

      // Find auth session
      const session = await authSessionRepository.findByRefreshToken(dto.refreshToken);
      if (!session) {
        logger.warn('Token refresh failed: session not found or inactive', { userId });
        return err(createAuthenticationError('Invalid refresh token'));
      }

      // Check if session is revoked
      if (session.isRevoked) {
        logger.warn('Token refresh failed: session revoked', { userId, sessionId: session.id });
        return err(createAuthenticationError('Refresh token has been revoked'));
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        logger.warn('Token refresh failed: session expired', { userId, sessionId: session.id });
        await authSessionRepository.revoke(session.id);
        return err(createAuthenticationError('Session expired'));
      }

      // Find user
      const user = await userRepository.findById(userId);
      if (!user || !user.isActive) {
        logger.warn('Token refresh failed: user not found or inactive', { userId });
        await authSessionRepository.revokeAllForUser(userId);
        return err(createAuthenticationError('User account not available'));
      }

      // Generate new tokens
      const accessTokenResult = await generateAccessToken(user.id, user.email, user.role as string);
      const newRefreshTokenResult = await generateRefreshToken(user.id, user.email, user.role as string);

      if (accessTokenResult.isErr() || newRefreshTokenResult.isErr()) {
        logger.error('Token generation failed during refresh', { userId });
        return err(createDatabaseError('Token refresh failed'));
      }

      // Update session with new refresh token
      const updatedSession = await authSessionRepository.update(session.id, {
        refreshToken: newRefreshTokenResult.value,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
      });

      if (!updatedSession) {
        logger.error('Session update failed during token refresh', { userId, sessionId: session.id });
        return err(createDatabaseError('Token refresh failed'));
      }

      logger.debug('Token refresh successful', { userId });

      const response: TokenPairDto = {
        accessToken: accessTokenResult.value,
        refreshToken: newRefreshTokenResult.value,
        tokenType: 'Bearer',
        expiresIn: 365 * 24 * 60 * 60, // 365 days in seconds
      };

      return ok(response);
    } catch (error) {
      logger.error('Token refresh failed with error', { error, refreshToken: dto.refreshToken.substring(0, 20) + '...' });
      return err(createDatabaseError('Token refresh failed'));
    }
  };

  /**
   * Logout user (revoke refresh token)
   */
  const logout = async (refreshToken: string): Promise<Result<void, AppError>> => {
    try {
      logger.debug('User logout attempt');

      const session = await authSessionRepository.findByRefreshToken(refreshToken);
      if (!session) {
        // If session doesn't exist, consider logout successful
        logger.debug('Logout: session not found (already logged out)');
        return ok(undefined);
      }

      await authSessionRepository.update(session.id, { isRevoked: true });
      logger.info('User logged out successfully', { userId: session.userId, sessionId: session.id });

      return ok(undefined);
    } catch (error) {
      logger.error('Logout failed with error', { error });
      return err(createDatabaseError('Logout failed'));
    }
  };

  /**
   * Logout from all devices
   */
  const logoutAll = async (userId: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Logout all devices attempt', { userId });

      await authSessionRepository.revokeAllForUser(userId);
      
      logger.info('Logged out from all devices successfully', { userId });
      return ok(undefined);
    } catch (error) {
      logger.error('Logout all failed with error', { error, userId });
      return err(createDatabaseError('Logout all failed'));
    }
  };

  /**
   * Change password
   */
  const changePassword = async (
    userId: string,
    dto: ChangePasswordRequestDto
  ): Promise<Result<void, AppError>> => {
    try {
      logger.info('Password change attempt', { userId });

      // Validate that new password and confirmation match
      if (dto.newPassword !== dto.confirmPassword) {
        logger.warn('Password change failed: passwords do not match', { userId });
        return err(createInvalidInputError('New password and confirmation do not match'));
      }

      // Find user
      const user = await userRepository.findById(userId);
      if (!user) {
        logger.warn('Password change failed: user not found', { userId });
        return err(createNotFoundError('User', userId));
      }

      // For OAuth users, password change is not allowed
      if (user.isOAuthUser) {
        logger.warn('Password change failed: OAuth user', { userId });
        return err(createAuthorizationError('OAuth users cannot change password'));
      }

      // Verify current password
      if (!user.passwordHash) {
        logger.error('Password change failed: no password hash', { userId });
        return err(createAuthorizationError('Account has no password set'));
      }

      const currentPasswordVerifyResult = await verifyPassword(dto.currentPassword, user.passwordHash);
      if (currentPasswordVerifyResult.isErr() || !currentPasswordVerifyResult.value) {
        logger.warn('Password change failed: invalid current password', { userId });
        return err(createAuthenticationError('Current password is incorrect'));
      }

      // Validate new password strength (BR-005: Password Requirements)
      const passwordValidation = validatePassword(dto.newPassword);
      if (!passwordValidation.isValid) {
        logger.warn('Password change failed: weak new password', { 
          userId, 
          errors: passwordValidation.errors 
        });
        return err(createInvalidInputError(`Password requirements not met: ${passwordValidation.errors.join(', ')}`));
      }

      // Hash new password
      const hashResult = await hashPassword(dto.newPassword);
      if (hashResult.isErr()) {
        logger.error('Password hashing failed during change', { userId, error: hashResult.error });
        return err(createDatabaseError('Password change failed'));
      }

      // Update user password
      const updatedUser = await userRepository.update(userId, {
        passwordHash: hashResult.value,
      });

      if (!updatedUser) {
        logger.error('User update failed during password change', { userId });
        return err(createDatabaseError('Password change failed'));
      }

      // Revoke all existing sessions for security (BR-006: Secure Session Management)
      await authSessionRepository.revokeAllForUser(userId);

      logger.info('Password changed successfully', { userId });
      return ok(undefined);
    } catch (error) {
      logger.error('Password change failed with error', { error, userId });
      return err(createDatabaseError('Password change failed'));
    }
  };

  /**
   * Initiate forgot password process
   */
  const forgotPassword = async (dto: ForgotPasswordRequestDto): Promise<Result<void, AppError>> => {
    try {
      logger.info('Forgot password request', { email: dto.email });

      // Find user by email
      const user = await userRepository.findByEmail(dto.email);
      if (!user) {
        // Don't reveal if email exists for security
        logger.debug('Forgot password: user not found', { email: dto.email });
        return ok(undefined);
      }

      // For OAuth users, password reset is not allowed
      if (user.isOAuthUser) {
        logger.debug('Forgot password: OAuth user', { userId: user.id });
        return ok(undefined); // Don't reveal user type
      }

      // Generate password reset token
      const tokenResult = await generatePasswordResetToken(user.id, user.email);
      if (tokenResult.isErr()) {
        logger.error('Password reset token generation failed', { userId: user.id, error: tokenResult.error });
        return err(createDatabaseError('Password reset request failed'));
      }

      // Send password reset email
      const resetUrl = `${process.env['FRONTEND_URL']}/auth/reset-password?token=${tokenResult.value}`;
      const emailResult = await emailService.sendPasswordResetEmail(user.email, {
        firstName: user.firstName,
        resetUrl,
        expirationHours: 24,
      });
      
      if (emailResult.isErr()) {
        logger.error('Password reset email failed', { userId: user.id, error: emailResult.error });
        // Don't return error - token is generated, email is secondary
      }

      logger.info('Password reset token generated', { userId: user.id });
      return ok(undefined);
    } catch (error) {
      logger.error('Forgot password failed with error', { error, email: dto.email });
      return err(createDatabaseError('Password reset request failed'));
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (dto: ResetPasswordRequestDto): Promise<Result<void, AppError>> => {
    try {
      logger.info('Password reset attempt');

      // Verify reset token
      const tokenVerifyResult = await verifyPasswordResetToken(dto.token);
      if (tokenVerifyResult.isErr()) {
        logger.warn('Password reset failed: invalid token', { error: tokenVerifyResult.error });
        return err(createAuthenticationError('Invalid or expired reset token'));
      }

      const { sub: userId } = tokenVerifyResult.value;

      // Find user
      const user = await userRepository.findById(userId);
      if (!user || !user.isActive) {
        logger.warn('Password reset failed: user not found or inactive', { userId });
        return err(createNotFoundError('User', userId));
      }

      // Validate new password strength (BR-005: Password Requirements)
      const passwordValidation = validatePassword(dto.newPassword);
      if (!passwordValidation.isValid) {
        logger.warn('Password reset failed: weak password', { 
          userId, 
          errors: passwordValidation.errors 
        });
        return err(createInvalidInputError(`Password requirements not met: ${passwordValidation.errors.join(', ')}`));
      }

      // Hash new password
      const hashResult = await hashPassword(dto.newPassword);
      if (hashResult.isErr()) {
        logger.error('Password hashing failed during reset', { userId, error: hashResult.error });
        return err(createDatabaseError('Password reset failed'));
      }

      // Update user password and reset login attempts/lockout (BR-008: Reset on password reset)
      const updatedUser = await userRepository.update(userId, {
        passwordHash: hashResult.value,
        loginAttempts: 0,
        lockedUntil: undefined,
        lastLoginAttemptAt: undefined,
      });

      if (!updatedUser) {
        logger.error('User update failed during password reset', { userId });
        return err(createDatabaseError('Password reset failed'));
      }

      // Revoke all existing sessions for security (BR-006: Secure Session Management)
      await authSessionRepository.revokeAllForUser(userId);

      logger.info('Password reset successful', { userId });
      return ok(undefined);
    } catch (error) {
      logger.error('Password reset failed with error', { error });
      return err(createDatabaseError('Password reset failed'));
    }
  };

  /**
   * Verify email with token
   */
  const verifyEmail = async (dto: VerifyEmailRequestDto): Promise<Result<void, AppError>> => {
    try {
      logger.info('Email verification attempt');

      // Verify email verification token
      const tokenVerifyResult = await verifyEmailVerificationToken(dto.token);
      if (tokenVerifyResult.isErr()) {
        logger.warn('Email verification failed: invalid token', { error: tokenVerifyResult.error });
        return err(createAuthenticationError('Invalid or expired verification token'));
      }

      const { sub: userId } = tokenVerifyResult.value;

      // Find user
      const user = await userRepository.findById(userId);
      if (!user) {
        logger.warn('Email verification failed: user not found', { userId });
        return err(createNotFoundError('User', userId));
      }

      // Check if already verified
      if (user.isEmailVerified) {
        logger.debug('Email verification: already verified', { userId });
        return ok(undefined);
      }

      // Update user email verification
      const updatedUser = await userRepository.verifyEmail(userId);
      if (!updatedUser) {
        logger.error('User update failed during email verification', { userId });
        return err(createDatabaseError('Email verification failed'));
      }

      logger.info('Email verified successfully', { userId });
      return ok(undefined);
    } catch (error) {
      logger.error('Email verification failed with error', { error });
      return err(createDatabaseError('Email verification failed'));
    }
  };

  /**
   * Resend email verification
   */
  const resendEmailVerification = async (email: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Resend email verification request', { email });

      // Find user by email
      const user = await userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        logger.debug('Resend verification: user not found', { email });
        return ok(undefined);
      }

      // Check if already verified
      if (user.isEmailVerified) {
        logger.debug('Resend verification: already verified', { userId: user.id });
        return ok(undefined);
      }

      // Generate email verification token
      // Generate email verification token
      const tokenResult = await generateEmailVerificationToken(user.id, user.email);
      if (tokenResult.isErr()) {
        logger.error('Email verification token generation failed', { userId: user.id, error: tokenResult.error });
        return err(createDatabaseError('Email verification request failed'));
      }

      // Send verification email
      const verificationUrl = `${process.env['FRONTEND_URL']}/auth/verify-email?token=${tokenResult.value}`;
      const emailResult = await emailService.sendVerificationEmail(user.email, {
        firstName: user.firstName,
        verificationUrl,
        expirationHours: 24,
      });
      
      if (emailResult.isErr()) {
        logger.error('Verification email failed', { userId: user.id, error: emailResult.error });
        // Don't return error - token is generated, email is secondary
      }

      logger.info('Email verification token resent', { userId: user.id });
      return ok(undefined);
    } catch (error) {
      logger.error('Resend email verification failed with error', { error, email });
      return err(createDatabaseError('Email verification request failed'));
    }
  };

  /**
   * Get user profile
   */
  const getProfile = async (userId: string): Promise<Result<UserResponseDto, AppError>> => {
    try {
      logger.debug('Get profile request', { userId });

      const user = await userRepository.findById(userId);
      if (!user) {
        logger.warn('Get profile failed: user not found', { userId });
        return err(createNotFoundError('User', userId));
      }

      return ok(toUserResponseDto(user));
    } catch (error) {
      logger.error('Get profile failed with error', { error, userId });
      return err(createDatabaseError('Failed to get user profile'));
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (
    userId: string,
    firstName?: string,
    lastName?: string
  ): Promise<Result<UserResponseDto, AppError>> => {
    try {
      logger.info('Update profile request', { userId, firstName, lastName });

      // Build update data
      const updateData: { firstName?: string; lastName?: string } = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return err(createInvalidInputError('No valid fields provided for update'));
      }

      // Update user
      const updatedUser = await userRepository.update(userId, updateData);
      if (!updatedUser) {
        logger.warn('Update profile failed: user not found', { userId });
        return err(createNotFoundError('User', userId));
      }

      logger.info('Profile updated successfully', { userId });
      return ok(toUserResponseDto(updatedUser));
    } catch (error) {
      logger.error('Update profile failed with error', { error, userId });
      return err(createDatabaseError('Profile update failed'));
    }
  };

  /**
   * Create OAuth user and authenticate
   */
  const createOAuthUser = async (
    email: string,
    firstName: string,
    lastName: string,
    provider: AuthProvider,
    providerId: string,
    role: UserRole = UserRole.CUSTOMER
  ): Promise<Result<LoginResponseDto, AppError>> => {
    try {
      logger.info('OAuth user creation', { email, provider, providerId });

      // Check if user already exists with this provider
      const existingUser = await userRepository.findByProvider(provider, providerId);
      if (existingUser) {
        // User exists, proceed with authentication
        return await authenticateOAuthUser(existingUser);
      }

      // Check if user exists with the same email but different provider
      const existingEmailUser = await userRepository.findByEmail(email);
      if (existingEmailUser) {
        logger.warn('OAuth user creation failed: email already registered with different provider', {
          email,
          existingProvider: existingEmailUser.provider,
          newProvider: provider,
        });
        return err(createConflictError('Email already registered with a different authentication method'));
      }

      // Create new OAuth user
      const userAttributes = toOAuthUserAttributes(email, firstName, lastName, provider, providerId, role);
      const user = await userRepository.create(userAttributes);

      logger.info('OAuth user created successfully', { userId: user.id, email, provider });

      return await authenticateOAuthUser(user);
    } catch (error) {
      logger.error('OAuth user creation failed with error', { error, email, provider });
      return err(createDatabaseError('OAuth authentication failed'));
    }
  };

  /**
   * Helper function to authenticate OAuth user (internal)
   */
  const authenticateOAuthUser = async (user: UserModel): Promise<Result<LoginResponseDto, AppError>> => {
    // Generate tokens
    const accessTokenResult = await generateAccessToken(user.id, user.email, user.role as string);
    const refreshTokenResult = await generateRefreshToken(user.id, user.email, user.role as string);

    if (accessTokenResult.isErr() || refreshTokenResult.isErr()) {
      logger.error('Token generation failed for OAuth user', { userId: user.id });
      return err(createDatabaseError('Authentication failed'));
    }

    // Create auth session
    const sessionData = {
      userId: user.id,
      refreshToken: refreshTokenResult.value,
      tokenType: TokenType.REFRESH,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
      deviceInfo: undefined,
      ipAddress: undefined,
      userAgent: undefined,
    };

    const session = await authSessionRepository.create(sessionData);
    if (!session) {
      logger.error('Failed to create auth session for OAuth user', { userId: user.id });
      return err(createDatabaseError('Authentication failed'));
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    logger.info('OAuth user authenticated successfully', { userId: user.id });

    const response: LoginResponseDto = {
      user: toUserResponseDto(user),
      tokens: {
        accessToken: accessTokenResult.value,
        refreshToken: refreshTokenResult.value,
        tokenType: 'Bearer',
        expiresIn: 365 * 24 * 60 * 60, // 365 days in seconds
      },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return ok(response);
  };

  /**
   * Validate access token
   */
  const validateAccessToken = async (token: string): Promise<Result<string, AppError>> => {
    try {
      const verifyResult = await verifyAccessToken(token);
      if (verifyResult.isErr()) {
        logger.debug('Access token validation failed', { error: verifyResult.error });
        return err(createAuthenticationError('Invalid access token'));
      }

      const { sub: userId } = verifyResult.value;

      // Verify user still exists and is active
      const user = await userRepository.findById(userId);
      if (!user || !user.isActive) {
        logger.warn('Access token validation failed: user not found or inactive', { userId });
        return err(createAuthenticationError('User account not available'));
      }

      return ok(userId);
    } catch (error) {
      logger.error('Access token validation failed with error', { error });
      return err(createAuthenticationError('Invalid access token'));
    }
  };

  return {
    login,
    register,
    refreshToken,
    logout,
    logoutAll,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendEmailVerification,
    getProfile,
    updateProfile,
    createOAuthUser,
    validateAccessToken,
  };
};