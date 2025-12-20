/**
 * Middleware exports
 * Centralized exports for all middleware
 */

import { getDatabaseModels } from '../config/database';
import { createUserRepository } from '../modules/auth/repositories/user.repository';
import { createAuthSessionRepository } from '../modules/auth/repositories/auth-session.repository';
import { createAuthService } from '../modules/auth/services/auth.service';
import { createEmailService, getDefaultEmailConfig } from '../modules/auth/services/email.service';
import { createJwtAuthMiddleware } from './jwt-auth';
import type { Request, Response, NextFunction } from 'express';

// Lazy initialization cache
let _authenticateJWT: any = null;
let _authenticateJWTOptional: any = null;

/**
 * Get JWT auth middleware instance (lazy initialization)
 */
const getAuthMiddleware = () => {
  if (!_authenticateJWT) {
    const models = getDatabaseModels();
    const userRepository = createUserRepository(models.User);
    const sessionRepository = createAuthSessionRepository(models.AuthSession);
    const emailConfig = getDefaultEmailConfig();
    const emailService = createEmailService(emailConfig);
    const authService = createAuthService(userRepository, sessionRepository, emailService);
    
    _authenticateJWT = createJwtAuthMiddleware(authService, userRepository)();
    _authenticateJWTOptional = createJwtAuthMiddleware(authService, userRepository)({ optional: true });
  }
  return { authenticateJWT: _authenticateJWT!, authenticateJWTOptional: _authenticateJWTOptional! };
};

/**
 * Shared JWT authentication middleware instance
 * Validates JWT tokens and injects user context into requests
 * Use this middleware before any role-based middleware
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const { authenticateJWT } = getAuthMiddleware();
  return authenticateJWT(req, res, next);
};

/**
 * Optional JWT authentication middleware
 * Doesn't fail when token is missing, but validates if present
 */
export const authenticateJWTOptional = (req: Request, res: Response, next: NextFunction) => {
  const { authenticateJWTOptional } = getAuthMiddleware();
  return authenticateJWTOptional(req, res, next);
};

// Re-export other middleware
export * from './rbac.middleware';
export * from './validation';
export * from './error-handler';
export * from './rate-limiter';
