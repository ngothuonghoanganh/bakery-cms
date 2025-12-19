/**
 * Admin Management Routes
 * Express router for admin operations
 */

import { Router } from 'express';
import { getDatabaseModels } from '../../../config/database';
import { createUserRepository } from '../repositories/user.repository';
import { createAuthSessionRepository } from '../repositories/auth-session.repository';
import { createAdminService } from '../services/admin.service';
import { createAdminHandlers } from '../controllers/admin.controller';
import { requireAdmin } from '../../../middleware/rbac.middleware';
import { validateBody } from '../../../middleware/validation';
import Joi from 'joi';

/**
 * Validation schemas
 */
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('admin', 'manager', 'staff', 'seller', 'customer', 'viewer').required(),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  role: Joi.string().valid('admin', 'manager', 'staff', 'seller', 'customer', 'viewer').optional(),
  status: Joi.string().valid('active', 'inactive', 'pending_verification', 'suspended').optional(),
}).min(1);

const unlockAccountSchema = Joi.object({
  reason: Joi.string().optional(),
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required(),
  requirePasswordChange: Joi.boolean().optional(),
});

const revokeSessionsSchema = Joi.object({
  reason: Joi.string().optional(),
});

/**
 * Create admin router
 */
export const createAdminRouter = (): Router => {
  const router = Router();

  // Get dependencies
  const models = getDatabaseModels();
  const userRepository = createUserRepository(models.User);
  const authSessionRepository = createAuthSessionRepository(models.AuthSession);
  const adminService = createAdminService(userRepository, authSessionRepository);
  const handlers = createAdminHandlers(adminService);

  // All admin routes require admin role
  router.use(requireAdmin as any);

  /**
   * GET /admin/users
   * List all users with filtering
   */
  router.get('/users', handlers.handleListUsers as any);

  /**
   * GET /admin/users/:id
   * Get user by ID
   */
  router.get('/users/:id', handlers.handleGetUser as any);

  /**
   * POST /admin/users
   * Create new user
   */
  router.post('/users', validateBody(createUserSchema), handlers.handleCreateUser as any);

  /**
   * PATCH /admin/users/:id
   * Update user
   */
  router.patch('/users/:id', validateBody(updateUserSchema), handlers.handleUpdateUser as any);

  /**
   * DELETE /admin/users/:id
   * Delete user (soft delete)
   */
  router.delete('/users/:id', handlers.handleDeleteUser as any);

  /**
   * POST /admin/users/:id/restore
   * Restore deleted user
   */
  router.post('/users/:id/restore', handlers.handleRestoreUser as any);

  /**
   * POST /admin/users/:id/unlock
   * Unlock user account
   */
  router.post('/users/:id/unlock', validateBody(unlockAccountSchema), handlers.handleUnlockAccount as any);

  /**
   * POST /admin/users/:id/reset-password
   * Reset user password
   */
  router.post('/users/:id/reset-password', validateBody(resetPasswordSchema), handlers.handleResetUserPassword as any);

  /**
   * POST /admin/users/:id/revoke-sessions
   * Revoke all user sessions
   */
  router.post('/users/:id/revoke-sessions', validateBody(revokeSessionsSchema), handlers.handleRevokeUserSessions as any);

  /**
   * GET /admin/statistics
   * Get admin statistics
   */
  router.get('/statistics', handlers.handleGetStatistics as any);

  return router;
};
