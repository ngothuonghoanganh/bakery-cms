/**
 * JWT Utilities
 * Helper functions for JWT token management and validation
 */

// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_SECRET: process.env['JWT_ACCESS_SECRET'] || 'default-access-secret-change-in-production',
  REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] || 'default-refresh-secret-change-in-production',
  ACCESS_EXPIRES_IN: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
  REFRESH_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] || '365d',
  ALGORITHM: 'HS256' as const,
} as const;

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  type: TokenType;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for tracking
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate an access token for a user (implementation will use JWT library)
 */
export const generateAccessToken = (_userId: string, _email: string, _role: string): string => {
  // This will be implemented using jwt.sign in the actual service layer
  throw new Error('generateAccessToken must be implemented in service layer with JWT library');
};

/**
 * Generate a refresh token for a user (implementation will use JWT library)
 */
export const generateRefreshToken = (_userId: string, _email: string, _role: string): string => {
  // This will be implemented using jwt.sign in the actual service layer
  throw new Error('generateRefreshToken must be implemented in service layer with JWT library');
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (userId: string, email: string, role: string): TokenPair => {
  const accessToken = generateAccessToken(userId, email, role);
  const refreshToken = generateRefreshToken(userId, email, role);
  
  // Calculate expiration in seconds
  const expiresIn = parseExpiresIn(JWT_CONFIG.ACCESS_EXPIRES_IN);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
};

/**
 * Verify an access token (implementation will use JWT library)
 */
export const verifyAccessToken = (_token: string): JWTPayload | null => {
  // This will be implemented using jwt.verify in the actual service layer
  throw new Error('verifyAccessToken must be implemented in service layer with JWT library');
};

/**
 * Verify a refresh token (implementation will use JWT library)
 */
export const verifyRefreshToken = (_token: string): JWTPayload | null => {
  // This will be implemented using jwt.verify in the actual service layer
  throw new Error('verifyRefreshToken must be implemented in service layer with JWT library');
};

/**
 * Extract token from Authorization header
 */
export const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1] || null;
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