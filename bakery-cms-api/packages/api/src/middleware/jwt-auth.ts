/**
 * JWT Authentication middleware
 * Validates JWT tokens and injects user context into requests
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/services/auth.service';
import { UserRepository } from '../modules/auth/repositories/user.repository';
import { extractBearerToken } from '../modules/auth/utils/jwt.utils';
import { createAuthenticationError } from '../utils/error-factory';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Extended Request interface with user context
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

/**
 * JWT authentication middleware options
 */
export interface JwtAuthOptions {
  optional?: boolean; // If true, doesn't fail when token is missing
}

/**
 * Create JWT authentication middleware
 * Factory function with dependency injection
 */
export const createJwtAuthMiddleware = (
  authService: AuthService,
  userRepository: UserRepository
) => {
  /**
   * JWT authentication middleware
   * Validates access token and injects user context
   */
  return (options: JwtAuthOptions = {}) => {
    return async (
      req: AuthenticatedRequest,
      _res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const tokenResult = extractBearerToken(authHeader);

        // Handle missing or invalid token
        if (tokenResult.isErr()) {
          if (options.optional) {
            return next(); // Continue without user context
          }
          
          logger.warn('JWT middleware: missing or invalid token', { 
            path: req.path,
            method: req.method,
            error: tokenResult.error.message,
          });
          
          return next(createAuthenticationError('Access token is required'));
        }

        const token = tokenResult.value;

        // Validate token
        const userIdResult = await authService.validateAccessToken(token);
        if (userIdResult.isErr()) {
          logger.warn('JWT middleware: invalid token', {
            path: req.path,
            method: req.method,
            error: userIdResult.error.message,
          });
          
          return next(userIdResult.error);
        }

        const userId = userIdResult.value;

        // Fetch user details for context
        const user = await userRepository.findById(userId);
        if (!user || !user.isActive) {
          logger.warn('JWT middleware: user not found or inactive', {
            userId,
            path: req.path,
            method: req.method,
          });
          
          return next(createAuthenticationError('User account not available'));
        }

        // Inject user context into request
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        };

        logger.debug('JWT middleware: authentication successful', {
          userId: user.id,
          path: req.path,
          method: req.method,
        });

        next();
      } catch (error) {
        logger.error('JWT middleware: unexpected error', {
          error,
          path: req.path,
          method: req.method,
        });
        
        next(createAuthenticationError('Authentication failed'));
      }
    };
  };
};

/**
 * Role-based authorization middleware
 * Requires user to have specific roles
 */
export const requireRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        logger.warn('Role middleware: user not authenticated', {
          path: req.path,
          method: req.method,
          requiredRoles: roles,
        });
        
        return next(createAuthenticationError('Authentication required'));
      }

      if (!roles.includes(user.role)) {
        logger.warn('Role middleware: insufficient permissions', {
          userId: user.id,
          userRole: user.role,
          requiredRoles: roles,
          path: req.path,
          method: req.method,
        });
        
        return next(createAuthenticationError('Insufficient permissions'));
      }

      logger.debug('Role middleware: authorization successful', {
        userId: user.id,
        userRole: user.role,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('Role middleware: unexpected error', {
        error,
        path: req.path,
        method: req.method,
      });
      
      next(createAuthenticationError('Authorization failed'));
    }
  };
};

/**
 * Status-based authorization middleware
 * Requires user to have specific status
 */
export const requireStatus = (...statuses: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        logger.warn('Status middleware: user not authenticated', {
          path: req.path,
          method: req.method,
          requiredStatuses: statuses,
        });
        
        return next(createAuthenticationError('Authentication required'));
      }

      if (!statuses.includes(user.status)) {
        logger.warn('Status middleware: invalid user status', {
          userId: user.id,
          userStatus: user.status,
          requiredStatuses: statuses,
          path: req.path,
          method: req.method,
        });
        
        return next(createAuthenticationError('Account status not valid for this operation'));
      }

      logger.debug('Status middleware: authorization successful', {
        userId: user.id,
        userStatus: user.status,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('Status middleware: unexpected error', {
        error,
        path: req.path,
        method: req.method,
      });
      
      next(createAuthenticationError('Authorization failed'));
    }
  };
};

/**
 * Convenience middleware for authenticated routes
 * Combines JWT auth with active status requirement
 */
export const requireAuth = (authService: AuthService, userRepository: UserRepository) => {
  const jwtAuth = createJwtAuthMiddleware(authService, userRepository)();
  const statusCheck = requireStatus('active');
  
  return [jwtAuth, statusCheck];
};

/**
 * Convenience middleware for admin routes
 * Requires admin role and active status
 */
export const requireAdmin = (authService: AuthService, userRepository: UserRepository) => {
  const jwtAuth = createJwtAuthMiddleware(authService, userRepository)();
  const roleCheck = requireRoles('admin');
  const statusCheck = requireStatus('active');
  
  return [jwtAuth, roleCheck, statusCheck];
};