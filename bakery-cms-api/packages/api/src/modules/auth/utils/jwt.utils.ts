/**
 * JWT utilities
 * Functions for JWT token generation and validation with 365-day expiration
 */

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Result, ok, err } from 'neverthrow';
import { AppError, ErrorCode } from '@bakery-cms/common';

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN: {
    SECRET: process.env['JWT_ACCESS_SECRET'] || 'default-access-secret-change-in-production',
    EXPIRES_IN: process.env['JWT_ACCESS_EXPIRES_IN'] || '365d', // 365 days as specified
    ALGORITHM: 'HS256' as const,
  },
  REFRESH_TOKEN: {
    SECRET: process.env['JWT_REFRESH_SECRET'] || 'default-refresh-secret-change-in-production', 
    EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] || '365d', // 365 days as specified
    ALGORITHM: 'HS256' as const,
  },
  EMAIL_VERIFICATION: {
    SECRET: process.env['JWT_EMAIL_SECRET'] || 'default-email-secret-change-in-production',
    EXPIRES_IN: process.env['JWT_EMAIL_EXPIRES_IN'] || '24h',
    ALGORITHM: 'HS256' as const,
  },
  PASSWORD_RESET: {
    SECRET: process.env['JWT_PASSWORD_RESET_SECRET'] || 'default-password-reset-secret-change-in-production',
    EXPIRES_IN: process.env['JWT_PASSWORD_RESET_EXPIRES_IN'] || '1h',
    ALGORITHM: 'HS256' as const,
  },
} as const;

/**
 * Token types
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh', 
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  type: TokenType;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for tracking
}

/**
 * Token pair structure
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
  tokenType: 'Bearer';
}

/**
 * Generate an access token for a user (365 days)
 */
export const generateAccessToken = (
  userId: string,
  email: string, 
  role: string
): Result<string, AppError> => {
  try {
    const payload: JWTPayload = {
      sub: userId,
      email,
      role,
      type: TokenType.ACCESS,
      jti: randomUUID(),
    };

    const token = jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN.SECRET as string, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN.EXPIRES_IN,
      algorithm: JWT_CONFIG.ACCESS_TOKEN.ALGORITHM,
    } as any);

    return ok(token);
  } catch (error) {
    return err({
      code: ErrorCode.TOKEN_GENERATION_FAILED,
      message: 'Failed to generate access token',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Generate a refresh token for a user (365 days)
 */
export const generateRefreshToken = (
  userId: string,
  email: string,
  role: string
): Result<string, AppError> => {
  try {
    const payload: JWTPayload = {
      sub: userId,
      email, 
      role,
      type: TokenType.REFRESH,
      jti: randomUUID(),
    };

    const token = jwt.sign(payload, JWT_CONFIG.REFRESH_TOKEN.SECRET as string, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN.EXPIRES_IN,
      algorithm: JWT_CONFIG.REFRESH_TOKEN.ALGORITHM,
    } as any);

    return ok(token);
  } catch (error) {
    return err({
      code: ErrorCode.TOKEN_GENERATION_FAILED,
      message: 'Failed to generate refresh token',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (
  userId: string,
  email: string
): Result<string, AppError> => {
  try {
    const payload = {
      sub: userId,
      email,
      type: TokenType.EMAIL_VERIFICATION,
      jti: randomUUID(),
    };

    const token = jwt.sign(payload, JWT_CONFIG.EMAIL_VERIFICATION.SECRET as string, {
      expiresIn: JWT_CONFIG.EMAIL_VERIFICATION.EXPIRES_IN,
      algorithm: JWT_CONFIG.EMAIL_VERIFICATION.ALGORITHM,
    } as any);

    return ok(token);
  } catch (error) {
    return err({
      code: ErrorCode.TOKEN_GENERATION_FAILED,
      message: 'Failed to generate email verification token',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (
  userId: string,
  email: string
): Result<string, AppError> => {
  try {
    const payload = {
      sub: userId,
      email,
      type: TokenType.PASSWORD_RESET,
      jti: randomUUID(),
    };

    const token = jwt.sign(payload, JWT_CONFIG.PASSWORD_RESET.SECRET as string, {
      expiresIn: JWT_CONFIG.PASSWORD_RESET.EXPIRES_IN,
      algorithm: JWT_CONFIG.PASSWORD_RESET.ALGORITHM,
    } as any);

    return ok(token);
  } catch (error) {
    return err({
      code: ErrorCode.TOKEN_GENERATION_FAILED,
      message: 'Failed to generate password reset token',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (
  userId: string,
  email: string,
  role: string
): Result<TokenPair, AppError> => {
  const accessTokenResult = generateAccessToken(userId, email, role);
  if (accessTokenResult.isErr()) {
    return err(accessTokenResult.error);
  }

  const refreshTokenResult = generateRefreshToken(userId, email, role);
  if (refreshTokenResult.isErr()) {
    return err(refreshTokenResult.error);
  }

  // Calculate expires in seconds (365 days)
  const expiresIn = parseExpiresIn(JWT_CONFIG.ACCESS_TOKEN.EXPIRES_IN);

  return ok({
    accessToken: accessTokenResult.value,
    refreshToken: refreshTokenResult.value,
    expiresIn,
    tokenType: 'Bearer',
  });
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): Result<JWTPayload, AppError> => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN.SECRET, {
      algorithms: [JWT_CONFIG.ACCESS_TOKEN.ALGORITHM],
    }) as JWTPayload;

    if (decoded.type !== TokenType.ACCESS) {
      return err({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid token type for access token',
        statusCode: 401,
        timestamp: new Date(),
      });
    }

    return ok(decoded);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return err({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Access token has expired',
        statusCode: 401,
        timestamp: new Date(),
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return err({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid access token',
        statusCode: 401,
        timestamp: new Date(),
      });
    }

    return err({
      code: ErrorCode.TOKEN_VERIFICATION_FAILED,
      message: 'Failed to verify access token',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): Result<JWTPayload, AppError> => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN.SECRET, {
      algorithms: [JWT_CONFIG.REFRESH_TOKEN.ALGORITHM],
    }) as JWTPayload;

    if (decoded.type !== TokenType.REFRESH) {
      return err({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid token type for refresh token',
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

    if (error instanceof jwt.JsonWebTokenError) {
      return err({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid refresh token',
        statusCode: 401,
        timestamp: new Date(),
      });
    }

    return err({
      code: ErrorCode.TOKEN_VERIFICATION_FAILED,
      message: 'Failed to verify refresh token',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
};

/**
 * Verify email verification token
 */
export const verifyEmailVerificationToken = (token: string): Result<any, AppError> => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.EMAIL_VERIFICATION.SECRET, {
      algorithms: [JWT_CONFIG.EMAIL_VERIFICATION.ALGORITHM],
    });

    return ok(decoded);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return err({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Email verification token has expired',
        statusCode: 401,
        timestamp: new Date(),
      });
    }

    return err({
      code: ErrorCode.TOKEN_INVALID,
      message: 'Invalid email verification token',
      statusCode: 401,
      timestamp: new Date(),
    });
  }
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token: string): Result<any, AppError> => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.PASSWORD_RESET.SECRET, {
      algorithms: [JWT_CONFIG.PASSWORD_RESET.ALGORITHM],
    });

    return ok(decoded);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return err({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Password reset token has expired',
        statusCode: 401,
        timestamp: new Date(),
      });
    }

    return err({
      code: ErrorCode.TOKEN_INVALID,
      message: 'Invalid password reset token',
      statusCode: 401,
      timestamp: new Date(),
    });
  }
};

/**
 * Extract token from Authorization header
 */
export const extractBearerToken = (authHeader?: string): Result<string, AppError> => {
  if (!authHeader) {
    return err({
      code: ErrorCode.AUTHORIZATION_HEADER_MISSING,
      message: 'Authorization header is missing',
      statusCode: 401,
      timestamp: new Date(),
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return err({
      code: ErrorCode.AUTHORIZATION_HEADER_INVALID,
      message: 'Authorization header format is invalid. Expected: Bearer <token>',
      statusCode: 401,
      timestamp: new Date(),
    });
  }

  const token = parts[1];
  if (!token || token.trim() === '') {
    return err({
      code: ErrorCode.TOKEN_MISSING,
      message: 'Token is empty',
      statusCode: 401,
      timestamp: new Date(),
    });
  }

  return ok(token);
};

/**
 * Get token expiration date
 */
export const getTokenExpiration = (expiresIn: string): Date => {
  const now = new Date();
  const expirationSeconds = parseExpiresIn(expiresIn);
  return new Date(now.getTime() + expirationSeconds * 1000);
};

/**
 * Parse expires in string to seconds
 */
export const parseExpiresIn = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid expires in format: ${expiresIn}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: throw new Error(`Unsupported time unit: ${unit}`);
  }
};

/**
 * Check if a token is expired based on its payload
 */
export const isTokenExpired = (payload: JWTPayload): boolean => {
  if (!payload.exp) {
    return false; // No expiration claim
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
};

/**
 * Get time until token expires in seconds
 */
export const getTimeUntilExpiry = (payload: JWTPayload): number => {
  if (!payload.exp) {
    return Infinity; // No expiration
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): Result<JWTPayload, AppError> => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    
    if (!decoded) {
      return err({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Token could not be decoded',
        statusCode: 400,
        timestamp: new Date(),
      });
    }

    return ok(decoded);
  } catch (error) {
    return err({
      code: ErrorCode.TOKEN_INVALID,
      message: 'Invalid token format',
      statusCode: 400,
      timestamp: new Date(),
    });
  }
};