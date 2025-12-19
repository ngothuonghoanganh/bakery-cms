/**
 * Authentication request handlers  
 * HTTP layer for authentication endpoints
 * Handles Express request/response
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import {
  LoginRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
  UpdateProfileRequestDto,
  LogoutRequestDto,
} from '../dto/auth.dto';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Authentication handlers interface
 * Defines all HTTP handlers for authentication endpoints
 */
export interface AuthHandlers {
  handleLogin(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleRegister(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleRefreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleLogout(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleLogoutAll(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleChangePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleForgotPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleResetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleVerifyEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleResendEmailVerification(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleGetProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleUpdateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Create authentication handlers
 * Factory function that returns handler implementation
 * Uses dependency injection for service
 */
export const createAuthHandlers = (service: AuthService): AuthHandlers => {
  
  /**
   * Handle login request
   * POST /auth/login
   */
  const handleLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: LoginRequestDto = req.body;

      // Extract additional context
      const loginData = {
        ...dto,
        deviceInfo: req.headers['user-agent'] || undefined,
      };

      const result = await service.login(loginData);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('User login successful', { 
        email: dto.email,
        userId: result.value.user.id,
      });

      res.status(200).json({
        success: true,
        data: result.value,
        message: 'Login successful',
      });
    } catch (error) {
      logger.error('Unhandled error in handleLogin', { error });
      next(error);
    }
  };

  /**
   * Handle register request
   * POST /auth/register
   */
  const handleRegister = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: RegisterRequestDto = req.body;

      const result = await service.register(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('User registration successful', { 
        email: dto.email,
        userId: result.value.id,
      });

      res.status(201).json({
        success: true,
        data: result.value,
        message: 'Registration successful. Please check your email for verification.',
      });
    } catch (error) {
      logger.error('Unhandled error in handleRegister', { error });
      next(error);
    }
  };

  /**
   * Handle refresh token request
   * POST /auth/refresh
   */
  const handleRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: RefreshTokenRequestDto = req.body;

      const result = await service.refreshToken(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Token refresh successful');

      res.status(200).json({
        success: true,
        data: result.value,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      logger.error('Unhandled error in handleRefreshToken', { error });
      next(error);
    }
  };

  /**
   * Handle logout request
   * POST /auth/logout
   */
  const handleLogout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: LogoutRequestDto = req.body;
      
      // Get refresh token from body or Authorization header
      const refreshToken = dto.refreshToken || extractRefreshTokenFromHeader(req);
      
      if (!refreshToken) {
        return next(new Error('Refresh token is required'));
      }

      const result = await service.logout(refreshToken);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('User logout successful');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Unhandled error in handleLogout', { error });
      next(error);
    }
  };

  /**
   * Handle logout all devices request
   * POST /auth/logout/all
   */
  const handleLogoutAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return next(new Error('User not authenticated'));
      }

      const result = await service.logoutAll(userId);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('User logout all devices successful', { userId });

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      logger.error('Unhandled error in handleLogoutAll', { error });
      next(error);
    }
  };

  /**
   * Handle change password request
   * PATCH /auth/password
   */
  const handleChangePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const dto: ChangePasswordRequestDto = req.body;

      if (!userId) {
        return next(new Error('User not authenticated'));
      }

      const result = await service.changePassword(userId, dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Password changed successfully', { userId });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. You have been logged out from all devices.',
        requiresReLogin: true,
      });
    } catch (error) {
      logger.error('Unhandled error in handleChangePassword', { error });
      next(error);
    }
  };

  /**
   * Handle forgot password request
   * POST /auth/forgot-password
   */
  const handleForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: ForgotPasswordRequestDto = req.body;

      const result = await service.forgotPassword(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Forgot password request processed', { email: dto.email });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        emailSent: true,
      });
    } catch (error) {
      logger.error('Unhandled error in handleForgotPassword', { error });
      next(error);
    }
  };

  /**
   * Handle reset password request
   * POST /auth/reset-password
   */
  const handleResetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: ResetPasswordRequestDto = req.body;

      const result = await service.resetPassword(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Password reset successful');

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
      });
    } catch (error) {
      logger.error('Unhandled error in handleResetPassword', { error });
      next(error);
    }
  };

  /**
   * Handle verify email request
   * POST /auth/verify-email
   */
  const handleVerifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: VerifyEmailRequestDto = req.body;

      const result = await service.verifyEmail(dto);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Email verification successful');

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. Your account is now active.',
      });
    } catch (error) {
      logger.error('Unhandled error in handleVerifyEmail', { error });
      next(error);
    }
  };

  /**
   * Handle resend email verification request
   * POST /auth/resend-verification
   */
  const handleResendEmailVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        return next(new Error('Email is required'));
      }

      const result = await service.resendEmailVerification(email);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Email verification resent', { email });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a verification email has been sent.',
      });
    } catch (error) {
      logger.error('Unhandled error in handleResendEmailVerification', { error });
      next(error);
    }
  };

  /**
   * Handle get profile request
   * GET /auth/profile
   */
  const handleGetProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return next(new Error('User not authenticated'));
      }

      const result = await service.getProfile(userId);

      if (result.isErr()) {
        return next(result.error);
      }

      res.status(200).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      logger.error('Unhandled error in handleGetProfile', { error });
      next(error);
    }
  };

  /**
   * Handle update profile request
   * PATCH /auth/profile
   */
  const handleUpdateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const dto: UpdateProfileRequestDto = req.body;

      if (!userId) {
        return next(new Error('User not authenticated'));
      }

      const result = await service.updateProfile(userId, dto.firstName, dto.lastName);

      if (result.isErr()) {
        return next(result.error);
      }

      logger.http('Profile updated successfully', { userId });

      res.status(200).json({
        success: true,
        data: result.value,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      logger.error('Unhandled error in handleUpdateProfile', { error });
      next(error);
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleRefreshToken,
    handleLogout,
    handleLogoutAll,
    handleChangePassword,
    handleForgotPassword,
    handleResetPassword,
    handleVerifyEmail,
    handleResendEmailVerification,
    handleGetProfile,
    handleUpdateProfile,
  };
};

/**
 * Helper function to extract refresh token from Authorization header
 */
const extractRefreshTokenFromHeader = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
};