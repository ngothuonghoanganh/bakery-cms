/**
 * Authentication Service
 * Core authentication functionality with JWT token management
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Result, ok, err } from 'neverthrow';
import { 
  UserRole, 
  UserStatus,
  AppError, 
  ErrorCode,
  createValidationError,
  JWT_CONFIG,
  type JWTPayload,
  type TokenPair,
  parseExpiresIn,
  extractBearerToken,
} from '@bakery-cms/common';

// Re-define TokenType locally to avoid conflicts
enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification', 
  PASSWORD_RESET = 'password_reset',
}

/**
 * Login request data
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request data
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Login response data
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
  };
  tokens: TokenPair;
}

/**
 * Authentication Service Implementation
 */
export class AuthService {
  /**
   * Generate JWT access token
   */
  private generateAccessToken(userId: string, email: string, role: string): string {
    const payload: JWTPayload = {
      sub: userId,
      email,
      role,
      type: TokenType.ACCESS,
      jti: randomUUID(),
    };

    return jwt.sign(payload, JWT_CONFIG.ACCESS_SECRET as string, {
      expiresIn: JWT_CONFIG.ACCESS_EXPIRES_IN,
    } as any);
  }

  /**
   * Generate JWT refresh token
   */
  private generateRefreshToken(userId: string, email: string, role: string): string {
    const payload: JWTPayload = {
      sub: userId,
      email,
      role,
      type: TokenType.REFRESH,
      jti: randomUUID(),
    };

    return jwt.sign(payload, JWT_CONFIG.REFRESH_SECRET as string, {
      expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
    } as any);
  }

  /**
   * Generate token pair
   */
  public generateTokenPair(userId: string, email: string, role: string): TokenPair {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken(userId, email, role);
    const expiresIn = parseExpiresIn(JWT_CONFIG.ACCESS_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify access token
   */
  public verifyAccessToken(token: string): Result<JWTPayload, AppError> {
    try {
      const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_SECRET) as JWTPayload;
      
      if (decoded.type !== TokenType.ACCESS) {
        return err({
          code: ErrorCode.TOKEN_INVALID,
          message: 'Invalid token type',
          statusCode: 401,
          timestamp: new Date(),
        });
      }

      return ok(decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return err({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Token has expired',
          statusCode: 401,
          timestamp: new Date(),
        });
      }

      return err({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid token',
        statusCode: 401,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): Result<JWTPayload, AppError> {
    try {
      const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_SECRET) as JWTPayload;
      
      if (decoded.type !== TokenType.REFRESH) {
        return err({
          code: ErrorCode.TOKEN_INVALID,
          message: 'Invalid token type',
          statusCode: 401,
          timestamp: new Date(),
        });
      }

      return ok(decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return err({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Refresh token has expired',
          statusCode: 401,
          timestamp: new Date(),
        });
      }

      return err({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid refresh token',
        statusCode: 401,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Extract and verify bearer token from authorization header
   */
  public extractAndVerifyToken(authHeader?: string): Result<JWTPayload, AppError> {
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      return err({
        code: ErrorCode.AUTHORIZATION_HEADER_MISSING,
        message: 'Authorization header missing or invalid',
        statusCode: 401,
        timestamp: new Date(),
      });
    }

    return this.verifyAccessToken(token);
  }

  /**
   * Hash password using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 12; // From auth constants
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  public validatePassword(password: string): Result<void, AppError> {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    if (password.length < minLength) {
      return err(createValidationError(`Password must be at least ${minLength} characters long`));
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasNonalphas) {
      return err(createValidationError(
        'Password must contain uppercase, lowercase, numbers, and special characters'
      ));
    }

    return ok(undefined);
  }

  /**
   * Validate email format
   */
  public validateEmail(email: string): Result<void, AppError> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return err(createValidationError('Invalid email format'));
    }

    return ok(undefined);
  }
}

// Export singleton instance
export const authService = new AuthService();