/**
 * RBAC Middleware
 * Role-Based Access Control middleware for protecting endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@bakery-cms/common';
import { createUnauthorizedError, createForbiddenError } from '@bakery-cms/common';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    status: string;
    provider: string;
  };
}

/**
 * Middleware to check if user has required role
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      const error = createUnauthorizedError('Authentication required');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      const error = createForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    // User has required role, proceed
    next();
  };
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Middleware to check if user is admin or manager
 */
export const requireManager = requireRole([UserRole.ADMIN, UserRole.MANAGER]);

/**
 * Middleware to check if user is admin, manager, or staff
 */
export const requireStaff = requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]);

/**
 * Middleware to check if user is seller (can manage own products)
 */
export const requireSeller = requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.SELLER]);

/**
 * Middleware that allows any authenticated user
 */
export const requireAuthenticated = requireRole([
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
  UserRole.SELLER,
  UserRole.CUSTOMER,
  UserRole.VIEWER,
]);

/**
 * Check if user owns the resource
 * @param getUserIdFromRequest - Function to extract user ID from request (e.g., from params)
 */
export const requireOwnership = (
  getUserIdFromRequest: (req: AuthenticatedRequest) => string
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error = createUnauthorizedError('Authentication required');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    const resourceUserId = getUserIdFromRequest(req);

    // Admins can access any resource
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // Check ownership
    if (req.user.id !== resourceUserId) {
      const error = createForbiddenError('You can only access your own resources');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Combined middleware: require role OR ownership
 * @param allowedRoles - Roles that have full access
 * @param getUserIdFromRequest - Function to extract user ID for ownership check
 */
export const requireRoleOrOwnership = (
  allowedRoles: UserRole[],
  getUserIdFromRequest: (req: AuthenticatedRequest) => string
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error = createUnauthorizedError('Authentication required');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    // Check if user has required role
    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    // Check ownership
    const resourceUserId = getUserIdFromRequest(req);
    if (req.user.id === resourceUserId) {
      next();
      return;
    }

    // Neither role nor ownership matched
    const error = createForbiddenError('Access denied');
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  };
};
