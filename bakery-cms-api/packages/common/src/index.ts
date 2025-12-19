/**
 * @bakery-cms/common
 * Shared types, constants, and utilities for Bakery CMS
 */

// Export all types
export * from './types';

// Export all enums
export * from './enums';

// Export all constants
export * from './constants';

// Export utilities with explicit re-exports to avoid conflicts
export {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractBearerToken,
  getTokenExpiration,
  parseExpiresIn,
} from './utils/jwt.utils';

export type {
  JWTPayload,
  TokenPair,
} from './utils/jwt.utils';

