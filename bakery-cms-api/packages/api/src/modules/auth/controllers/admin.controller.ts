/**
 * Admin Management Controllers
 * HTTP request handlers for admin operations
 */

import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import {
  AdminUserListQuery,
  CreateAdminUserDTO,
  UpdateAdminUserDTO,
  UnlockUserAccountDTO,
  AdminResetPasswordDTO,
  RevokeUserSessionsDTO,
} from '@bakery-cms/common';

/**
 * Authenticated request with guaranteed user info
 * Used for routes protected by auth middleware
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

/**
 * Create admin handlers
 */
export const createAdminHandlers = (adminService: AdminService) => {
  /**
   * List users
   */
  const handleListUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query: AdminUserListQuery = {
      role: req.query['role'] as any,
      status: req.query['status'] as any,
      search: req.query['search'] as string,
      page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
      limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : undefined,
      sortBy: req.query['sortBy'] as any,
      sortOrder: req.query['sortOrder'] as any,
    };

    const result = await adminService.listUsers(query);
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(200).json(result.value);
  };

  /**
   * Get user by ID
   */
  const handleGetUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const result = await adminService.getUserById(id as string); // From route params
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(200).json(result.value);
  };

  /**
   * Create user
   */
  const handleCreateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const dto: CreateAdminUserDTO = req.body;
    const adminId = req.user.id;

    const result = await adminService.createUser(dto, adminId);
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(201).json(result.value);
  };

  /**
   * Update user
   */
  const handleUpdateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const dto: UpdateAdminUserDTO = req.body;
    const adminId = req.user.id;

    const result = await adminService.updateUser(id as string, dto, adminId); // From route params
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(200).json(result.value);
  };

  /**
   * Delete user
   */
  const handleDeleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await adminService.deleteUser(id as string, adminId); // From route params
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(204).send();
  };

  /**
   * Restore user
   */
  const handleRestoreUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await adminService.restoreUser(id as string, adminId); // From route params
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(200).json(result.value);
  };

  /**
   * Unlock user account
   */
  const handleUnlockAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const dto: UnlockUserAccountDTO = {
      userId: id as string, // From route params
      reason: req.body.reason as string, // Validated by Joi
    };
    const adminId = req.user.id;

    const result = await adminService.unlockUserAccount(dto, adminId);
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(200).json({ message: 'Account unlocked successfully' });
  };

  /**
   * Reset user password
   */
  const handleResetUserPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const dto: AdminResetPasswordDTO = {
      userId: id as string, // From route params
      newPassword: req.body.newPassword as string, // Validated by Joi
      requirePasswordChange: req.body.requirePasswordChange as boolean, // Validated by Joi
    };
    const adminId = req.user.id;

    const result = await adminService.resetUserPassword(dto, adminId);
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(200).json({ message: 'Password reset successfully' });
  };

  /**
   * Revoke user sessions
   */
  const handleRevokeUserSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const dto: RevokeUserSessionsDTO = {
      userId: id as string, // From route params
      reason: req.body.reason as string, // Validated by Joi
    };
    const adminId = req.user.id;

    const result = await adminService.revokeUserSessions(dto, adminId);
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(200).json({ message: 'Sessions revoked successfully' });
  };

  /**
   * Get statistics
   */
  const handleGetStatistics = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await adminService.getStatistics();
    
    if (result.isErr()) {
      res.status(result.error.statusCode).json(result.error);
      return;
    }

    res.status(200).json(result.value);
  };

  return {
    handleListUsers,
    handleGetUser,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleRestoreUser,
    handleUnlockAccount,
    handleResetUserPassword,
    handleRevokeUserSessions,
    handleGetStatistics,
  };
};
