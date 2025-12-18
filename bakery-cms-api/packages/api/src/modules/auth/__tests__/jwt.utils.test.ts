/**
 * JWT Utils Unit Tests
 * Comprehensive test suite for JWT utility functions
 */

import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
  JWT_CONFIG,
  TokenType,
  type JWTPayload,
} from '../utils/jwt.utils';
import { UserRole } from '@bakery-cms/common';

// Mock the environment variables for testing
const originalEnv = process.env;
beforeAll(() => {
  process.env['JWT_ACCESS_SECRET'] = 'test-access-secret-key';
  process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-key';
  process.env['JWT_EMAIL_SECRET'] = 'test-email-secret-key';
  process.env['JWT_PASSWORD_RESET_SECRET'] = 'test-password-reset-secret-key';
  
  // Clear require cache to force re-evaluation of JWT_CONFIG with new env vars
  jest.resetModules();
});

afterAll(() => {
  process.env = originalEnv;
  jest.resetModules();
});

describe('JWTUtils', () => {
  const testUserId = 'user-123';
  const testEmail = 'test@example.com';
  const testRole = UserRole.CUSTOMER;

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      // Act
      const result = generateAccessToken(testUserId, testEmail, testRole);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeDefined();
        expect(typeof result.value).toBe('string');
        expect(result.value.split('.')).toHaveLength(3); // JWT format: header.payload.signature
      }
    });

    it('should generate different tokens for different users', () => {
      // Arrange
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      // Act
      const token1Result = generateAccessToken(userId1, testEmail, testRole);
      const token2Result = generateAccessToken(userId2, testEmail, testRole);

      // Assert
      expect(token1Result.isOk()).toBe(true);
      expect(token2Result.isOk()).toBe(true);
      if (token1Result.isOk() && token2Result.isOk()) {
        expect(token1Result.value).not.toBe(token2Result.value);
      }
    });

    it('should include correct payload structure', () => {
      // Act
      const result = generateAccessToken(testUserId, testEmail, testRole);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const decoded = jwt.decode(result.value) as JWTPayload;
        expect(decoded.sub).toBe(testUserId);
        expect(decoded.email).toBe(testEmail);
        expect(decoded.role).toBe(testRole);
        expect(decoded.type).toBe(TokenType.ACCESS);
        expect(decoded.jti).toBeDefined();
      }
    });

    it('should handle token generation errors gracefully', () => {
      // Arrange - Mock jwt.sign to throw error
      const originalSign = jwt.sign;
      jest.spyOn(jwt, 'sign').mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      // Act
      const result = generateAccessToken(testUserId, testEmail, testRole);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to generate access token');
        expect(result.error.statusCode).toBe(500);
      }

      // Cleanup
      jwt.sign = originalSign;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      // Act
      const result = generateRefreshToken(testUserId, testEmail, testRole);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeDefined();
        expect(typeof result.value).toBe('string');
        expect(result.value.split('.')).toHaveLength(3);
      }
    });

    it('should include correct token type in payload', () => {
      // Act
      const result = generateRefreshToken(testUserId, testEmail, testRole);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const decoded = jwt.decode(result.value) as JWTPayload;
        expect(decoded.type).toBe(TokenType.REFRESH);
        expect(decoded.sub).toBe(testUserId);
      }
    });

    it('should handle token generation errors gracefully', () => {
      // Arrange - Mock jwt.sign to throw error
      const originalSign = jwt.sign;
      jest.spyOn(jwt, 'sign').mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      // Act
      const result = generateRefreshToken(testUserId, testEmail, testRole);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to generate refresh token');
        expect(result.error.statusCode).toBe(500);
      }

      // Cleanup
      jwt.sign = originalSign;
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate a valid email verification token', () => {
      // Act
      const result = generateEmailVerificationToken(testUserId, testEmail);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeDefined();
        expect(typeof result.value).toBe('string');
        expect(result.value.split('.')).toHaveLength(3);
      }
    });

    it('should include correct token type in payload', () => {
      // Act
      const result = generateEmailVerificationToken(testUserId, testEmail);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const decoded = jwt.decode(result.value) as any;
        expect(decoded.type).toBe(TokenType.EMAIL_VERIFICATION);
        expect(decoded.sub).toBe(testUserId);
        expect(decoded.email).toBe(testEmail);
      }
    });

    it('should handle token generation errors gracefully', () => {
      // Arrange - Mock jwt.sign to throw error
      const originalSign = jwt.sign;
      jest.spyOn(jwt, 'sign').mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      // Act
      const result = generateEmailVerificationToken(testUserId, testEmail);

      // Assert
      expect(result.isErr()).toBe(true);

      // Cleanup
      jwt.sign = originalSign;
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a valid password reset token', () => {
      // Act
      const result = generatePasswordResetToken(testUserId, testEmail);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeDefined();
        expect(typeof result.value).toBe('string');
        expect(result.value.split('.')).toHaveLength(3);
      }
    });

    it('should include correct token type in payload', () => {
      // Act
      const result = generatePasswordResetToken(testUserId, testEmail);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const decoded = jwt.decode(result.value) as any;
        expect(decoded.type).toBe(TokenType.PASSWORD_RESET);
        expect(decoded.sub).toBe(testUserId);
        expect(decoded.email).toBe(testEmail);
      }
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      // Arrange
      const tokenResult = generateAccessToken(testUserId, testEmail, testRole);
      expect(tokenResult.isOk()).toBe(true);
      
      if (!tokenResult.isOk()) return;

      // Act
      const verifyResult = verifyAccessToken(tokenResult.value);

      // Assert
      expect(verifyResult.isOk()).toBe(true);
      if (verifyResult.isOk()) {
        expect(verifyResult.value.sub).toBe(testUserId);
        expect(verifyResult.value.email).toBe(testEmail);
        expect(verifyResult.value.role).toBe(testRole);
        expect(verifyResult.value.type).toBe(TokenType.ACCESS);
      }
    });

    it('should reject invalid token', () => {
      // Act
      const result = verifyAccessToken('invalid.token.here');

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid access token');
        expect(result.error.statusCode).toBe(401);
      }
    });

    it('should reject token with wrong type', () => {
      // Arrange
      const refreshTokenResult = generateRefreshToken(testUserId, testEmail, testRole);
      expect(refreshTokenResult.isOk()).toBe(true);
      
      if (!refreshTokenResult.isOk()) return;

      // Act
      const verifyResult = verifyAccessToken(refreshTokenResult.value);

      // Assert
      expect(verifyResult.isErr()).toBe(true);
      if (verifyResult.isErr()) {
        expect(verifyResult.error.message).toContain('Invalid');
        expect(verifyResult.error.statusCode).toBe(401);
      }
    });

    it('should handle expired tokens', () => {
      // Arrange - Create token with past expiration
      const expiredPayload = {
        sub: testUserId,
        email: testEmail,
        role: testRole,
        type: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago (expired)
      };
      
      const expiredToken = jwt.sign(expiredPayload, JWT_CONFIG.ACCESS_TOKEN.SECRET);

      // Act
      const result = verifyAccessToken(expiredToken);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('expired');
        expect(result.error.statusCode).toBe(401);
      }
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      // Arrange
      const tokenResult = generateRefreshToken(testUserId, testEmail, testRole);
      expect(tokenResult.isOk()).toBe(true);
      
      if (!tokenResult.isOk()) return;

      // Act
      const verifyResult = verifyRefreshToken(tokenResult.value);

      // Assert
      expect(verifyResult.isOk()).toBe(true);
      if (verifyResult.isOk()) {
        expect(verifyResult.value.sub).toBe(testUserId);
        expect(verifyResult.value.email).toBe(testEmail);
        expect(verifyResult.value.type).toBe(TokenType.REFRESH);
      }
    });

    it('should reject invalid refresh token', () => {
      // Act
      const result = verifyRefreshToken('invalid.token.here');

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid refresh token');
        expect(result.error.statusCode).toBe(401);
      }
    });
  });

  describe('verifyEmailVerificationToken', () => {
    it('should verify a valid email verification token', () => {
      // Arrange
      const tokenResult = generateEmailVerificationToken(testUserId, testEmail);
      expect(tokenResult.isOk()).toBe(true);
      
      if (!tokenResult.isOk()) return;

      // Act
      const verifyResult = verifyEmailVerificationToken(tokenResult.value);

      // Assert
      expect(verifyResult.isOk()).toBe(true);
      if (verifyResult.isOk()) {
        expect(verifyResult.value.sub).toBe(testUserId);
        expect(verifyResult.value.email).toBe(testEmail);
      }
    });

    it('should reject invalid email verification token', () => {
      // Act
      const result = verifyEmailVerificationToken('invalid.token.here');

      // Assert
      expect(result.isErr()).toBe(true);
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify a valid password reset token', () => {
      // Arrange
      const tokenResult = generatePasswordResetToken(testUserId, testEmail);
      expect(tokenResult.isOk()).toBe(true);
      
      if (!tokenResult.isOk()) return;

      // Act
      const verifyResult = verifyPasswordResetToken(tokenResult.value);

      // Assert
      expect(verifyResult.isOk()).toBe(true);
      if (verifyResult.isOk()) {
        expect(verifyResult.value.sub).toBe(testUserId);
        expect(verifyResult.value.email).toBe(testEmail);
      }
    });

    it('should reject invalid password reset token', () => {
      // Act
      const result = verifyPasswordResetToken('invalid.token.here');

      // Assert
      expect(result.isErr()).toBe(true);
    });
  });

  describe('JWT_CONFIG', () => {
    it('should have valid configuration structure', () => {
      expect(JWT_CONFIG.ACCESS_TOKEN).toBeDefined();
      expect(JWT_CONFIG.REFRESH_TOKEN).toBeDefined();
      expect(JWT_CONFIG.EMAIL_VERIFICATION).toBeDefined();
      expect(JWT_CONFIG.PASSWORD_RESET).toBeDefined();

      expect(JWT_CONFIG.ACCESS_TOKEN.SECRET).toBeDefined();
      expect(JWT_CONFIG.ACCESS_TOKEN.EXPIRES_IN).toBeDefined();
      expect(JWT_CONFIG.ACCESS_TOKEN.ALGORITHM).toBe('HS256');

      expect(JWT_CONFIG.REFRESH_TOKEN.SECRET).toBeDefined();
      expect(JWT_CONFIG.REFRESH_TOKEN.EXPIRES_IN).toBeDefined();
      expect(JWT_CONFIG.REFRESH_TOKEN.ALGORITHM).toBe('HS256');
    });

    it('should use environment variables when available', () => {
      // In test environment, verify the secrets are defined and not empty
      expect(JWT_CONFIG.ACCESS_TOKEN.SECRET).toBeDefined();
      expect(JWT_CONFIG.ACCESS_TOKEN.SECRET.length).toBeGreaterThan(0);
      expect(JWT_CONFIG.REFRESH_TOKEN.SECRET).toBeDefined();
      expect(JWT_CONFIG.REFRESH_TOKEN.SECRET.length).toBeGreaterThan(0);
      expect(JWT_CONFIG.EMAIL_VERIFICATION.SECRET).toBeDefined();
      expect(JWT_CONFIG.EMAIL_VERIFICATION.SECRET.length).toBeGreaterThan(0);
      expect(JWT_CONFIG.PASSWORD_RESET.SECRET).toBeDefined();
      expect(JWT_CONFIG.PASSWORD_RESET.SECRET.length).toBeGreaterThan(0);
    });

    it('should have appropriate token expiration times', () => {
      expect(JWT_CONFIG.ACCESS_TOKEN.EXPIRES_IN).toBe('365d');
      expect(JWT_CONFIG.REFRESH_TOKEN.EXPIRES_IN).toBe('365d');
      expect(JWT_CONFIG.EMAIL_VERIFICATION.EXPIRES_IN).toBe('24h');
      expect(JWT_CONFIG.PASSWORD_RESET.EXPIRES_IN).toBe('1h');
    });
  });

  describe('Token Integration', () => {
    it('should create and verify token pairs correctly', () => {
      // Act
      const accessResult = generateAccessToken(testUserId, testEmail, testRole);
      const refreshResult = generateRefreshToken(testUserId, testEmail, testRole);

      // Assert
      expect(accessResult.isOk()).toBe(true);
      expect(refreshResult.isOk()).toBe(true);

      if (accessResult.isOk() && refreshResult.isOk()) {
        const accessVerifyResult = verifyAccessToken(accessResult.value);
        const refreshVerifyResult = verifyRefreshToken(refreshResult.value);

        expect(accessVerifyResult.isOk()).toBe(true);
        expect(refreshVerifyResult.isOk()).toBe(true);

        if (accessVerifyResult.isOk() && refreshVerifyResult.isOk()) {
          expect(accessVerifyResult.value.sub).toBe(refreshVerifyResult.value.sub);
          expect(accessVerifyResult.value.email).toBe(refreshVerifyResult.value.email);
        }
      }
    });

    it('should maintain token uniqueness with JTI', () => {
      // Act
      const token1Result = generateAccessToken(testUserId, testEmail, testRole);
      const token2Result = generateAccessToken(testUserId, testEmail, testRole);

      // Assert
      expect(token1Result.isOk()).toBe(true);
      expect(token2Result.isOk()).toBe(true);

      if (token1Result.isOk() && token2Result.isOk()) {
        const decoded1 = jwt.decode(token1Result.value) as JWTPayload;
        const decoded2 = jwt.decode(token2Result.value) as JWTPayload;

        expect(decoded1.jti).not.toBe(decoded2.jti);
        expect(decoded1.jti).toBeDefined();
        expect(decoded2.jti).toBeDefined();
      }
    });
  });
});