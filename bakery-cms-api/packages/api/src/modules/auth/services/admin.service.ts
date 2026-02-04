/**
 * Admin Management Service
 * Business logic for admin operations on users
 */

import { Result, ok, err } from 'neverthrow';
import {
  AppError,
  AdminUserResponse,
  AdminUserListQuery,
  AdminUserListResponse,
  AdminStatistics,
  CreateAdminUserDTO,
  UpdateAdminUserDTO,
  UnlockUserAccountDTO,
  AdminResetPasswordDTO,
  RevokeUserSessionsDTO,
  UserRole,
  UserStatus,
} from '@bakery-cms/common';
import { UserRepository } from '../repositories/user.repository';
import { AuthSessionRepository } from '../repositories/auth-session.repository';
import { hashPassword } from '../utils/password.utils';
import { validatePassword } from '../utils/security.utils';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
  createConflictError,
  createAuthorizationError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

/**
 * Admin service interface
 */
export interface AdminService {
  // User management
  listUsers(query: AdminUserListQuery): Promise<Result<AdminUserListResponse, AppError>>;
  getUserById(id: string): Promise<Result<AdminUserResponse, AppError>>;
  createUser(dto: CreateAdminUserDTO, adminId: string): Promise<Result<AdminUserResponse, AppError>>;
  updateUser(id: string, dto: UpdateAdminUserDTO, adminId: string): Promise<Result<AdminUserResponse, AppError>>;
  deleteUser(id: string, adminId: string): Promise<Result<void, AppError>>;
  restoreUser(id: string, adminId: string): Promise<Result<AdminUserResponse, AppError>>;
  
  // User actions
  unlockUserAccount(dto: UnlockUserAccountDTO, adminId: string): Promise<Result<void, AppError>>;
  resetUserPassword(dto: AdminResetPasswordDTO, adminId: string): Promise<Result<void, AppError>>;
  revokeUserSessions(dto: RevokeUserSessionsDTO, adminId: string): Promise<Result<void, AppError>>;
  
  // Statistics
  getStatistics(): Promise<Result<AdminStatistics, AppError>>;
}

/**
 * Create admin service
 */
export const createAdminService = (
  userRepository: UserRepository,
  authSessionRepository: AuthSessionRepository
): AdminService => {
  
  /**
   * Map user model to admin user response
   */
  const toAdminUserResponse = (user: any): AdminUserResponse => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    provider: user.provider,
    emailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt?.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });

  /**
   * List all users with filtering and pagination
   */
  const listUsers = async (query: AdminUserListQuery): Promise<Result<AdminUserListResponse, AppError>> => {
    try {
      logger.info('Admin listing users', { query });

      const result = await userRepository.findAll({
        role: query.role,
        status: query.status,
        search: query.search,
        page: query.page || 1,
        limit: query.limit || 20,
      });

      const users = result.rows.map(toAdminUserResponse);
      const page = query.page || 1;
      const limit = query.limit || 20;
      const totalPages = Math.ceil(result.count / limit);

      return ok({
        users,
        total: result.count,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      logger.error('Failed to list users', { error });
      return err(createDatabaseError('Failed to retrieve users', error));
    }
  };

  /**
   * Get user by ID
   */
  const getUserById = async (id: string): Promise<Result<AdminUserResponse, AppError>> => {
    try {
      logger.info('Admin getting user by ID', { id });

      const user = await userRepository.findById(id);
      if (!user) {
        return err(createNotFoundError('User', id));
      }

      return ok(toAdminUserResponse(user));
    } catch (error) {
      logger.error('Failed to get user', { error, id });
      return err(createDatabaseError('Failed to retrieve user', error));
    }
  };

  /**
   * Create new user (admin-initiated)
   */
  const createUser = async (dto: CreateAdminUserDTO, adminId: string): Promise<Result<AdminUserResponse, AppError>> => {
    try {
      logger.info('Admin creating user', { email: dto.email, adminId });

      // Check if email already exists
      const existingUser = await userRepository.findByEmail(dto.email);
      if (existingUser) {
        return err(createConflictError('Email already registered'));
      }

      // Validate password
      const passwordValidation = validatePassword(dto.password);
      if (!passwordValidation.isValid) {
        return err(createInvalidInputError(`Password requirements not met: ${passwordValidation.errors.join(', ')}`));
      }

      // Hash password
      const hashResult = await hashPassword(dto.password);
      if (hashResult.isErr()) {
        logger.error('Password hashing failed', { error: hashResult.error });
        return err(createDatabaseError('User creation failed'));
      }

      // Create user
      const user = await userRepository.create({
        email: dto.email,
        passwordHash: hashResult.value,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: UserStatus.ACTIVE,
        provider: 'local' as any,
        emailVerifiedAt: new Date(), // Admin-created users are pre-verified
      });

      logger.info('Admin created user successfully', { userId: user.id, adminId });
      return ok(toAdminUserResponse(user));
    } catch (error) {
      logger.error('Failed to create user', { error, adminId });
      return err(createDatabaseError('User creation failed', error));
    }
  };

  /**
   * Update user
   */
  const updateUser = async (id: string, dto: UpdateAdminUserDTO, adminId: string): Promise<Result<AdminUserResponse, AppError>> => {
    try {
      logger.info('Admin updating user', { id, adminId });

      const user = await userRepository.findById(id);
      if (!user) {
        return err(createNotFoundError('User', id));
      }

      // Prevent admin from modifying their own role/status
      if (user.id === adminId && (dto.role || dto.status)) {
        return err(createAuthorizationError('Cannot modify your own role or status'));
      }

      // Check email uniqueness if changing email
      if (dto.email && dto.email !== user.email) {
        const existingUser = await userRepository.findByEmail(dto.email);
        if (existingUser) {
          return err(createConflictError('Email already in use'));
        }
      }

      const updatedUser = await userRepository.update(id, dto as any);
      if (!updatedUser) {
        return err(createDatabaseError('User update failed'));
      }

      logger.info('Admin updated user successfully', { userId: id, adminId });
      return ok(toAdminUserResponse(updatedUser));
    } catch (error) {
      logger.error('Failed to update user', { error, id, adminId });
      return err(createDatabaseError('User update failed', error));
    }
  };

  /**
   * Delete user (soft delete)
   */
  const deleteUser = async (id: string, adminId: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Admin deleting user', { id, adminId });

      const user = await userRepository.findById(id);
      if (!user) {
        return err(createNotFoundError('User', id));
      }

      // Prevent admin from deleting themselves
      if (user.id === adminId) {
        return err(createAuthorizationError('Cannot delete your own account'));
      }

      const success = await userRepository.delete(id);
      if (!success) {
        return err(createDatabaseError('User deletion failed'));
      }

      logger.info('Admin deleted user successfully', { userId: id, adminId });
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete user', { error, id, adminId });
      return err(createDatabaseError('User deletion failed', error));
    }
  };

  /**
   * Restore deleted user
   */
  const restoreUser = async (id: string, adminId: string): Promise<Result<AdminUserResponse, AppError>> => {
    try {
      logger.info('Admin restoring user', { id, adminId });

      const user = await userRepository.restore(id);
      if (!user) {
        return err(createNotFoundError('User', id));
      }

      logger.info('Admin restored user successfully', { userId: id, adminId });
      return ok(toAdminUserResponse(user));
    } catch (error) {
      logger.error('Failed to restore user', { error, id, adminId });
      return err(createDatabaseError('User restoration failed', error));
    }
  };

  /**
   * Unlock user account
   */
  const unlockUserAccount = async (dto: UnlockUserAccountDTO, adminId: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Admin unlocking user account', { userId: dto.userId, adminId, reason: dto.reason });

      const user = await userRepository.findById(dto.userId);
      if (!user) {
        return err(createNotFoundError('User', dto.userId));
      }

      await userRepository.resetLoginAttempts(dto.userId);

      logger.info('Admin unlocked user account successfully', { userId: dto.userId, adminId });
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to unlock user account', { error, userId: dto.userId, adminId });
      return err(createDatabaseError('Account unlock failed', error));
    }
  };

  /**
   * Reset user password (admin-initiated)
   */
  const resetUserPassword = async (dto: AdminResetPasswordDTO, adminId: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Admin resetting user password', { userId: dto.userId, adminId });

      const user = await userRepository.findById(dto.userId);
      if (!user) {
        return err(createNotFoundError('User', dto.userId));
      }

      // Validate password
      const passwordValidation = validatePassword(dto.newPassword);
      if (!passwordValidation.isValid) {
        return err(createInvalidInputError(`Password requirements not met: ${passwordValidation.errors.join(', ')}`));
      }

      // Hash password
      const hashResult = await hashPassword(dto.newPassword);
      if (hashResult.isErr()) {
        return err(createDatabaseError('Password reset failed'));
      }

      // Update password and reset login attempts
      await userRepository.update(dto.userId, {
        passwordHash: hashResult.value,
        loginAttempts: 0,
        lockedUntil: undefined,
        lastLoginAttemptAt: undefined,
      } as any);

      // Revoke all sessions for security
      await authSessionRepository.revokeAllForUser(dto.userId);

      logger.info('Admin reset user password successfully', { userId: dto.userId, adminId });
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to reset user password', { error, userId: dto.userId, adminId });
      return err(createDatabaseError('Password reset failed', error));
    }
  };

  /**
   * Revoke all user sessions
   */
  const revokeUserSessions = async (dto: RevokeUserSessionsDTO, adminId: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Admin revoking user sessions', { userId: dto.userId, adminId, reason: dto.reason });

      const user = await userRepository.findById(dto.userId);
      if (!user) {
        return err(createNotFoundError('User', dto.userId));
      }

      await authSessionRepository.revokeAllForUser(dto.userId);

      logger.info('Admin revoked user sessions successfully', { userId: dto.userId, adminId });
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to revoke user sessions', { error, userId: dto.userId, adminId });
      return err(createDatabaseError('Session revocation failed', error));
    }
  };

  /**
   * Get admin statistics
   */
  const getStatistics = async (): Promise<Result<AdminStatistics, AppError>> => {
    try {
      logger.info('Admin getting statistics');

      const [
        totalUsers,
        activeUsers,
        adminCount,
        managerCount,
        staffCount,
        sellerCount,
        customerCount,
        viewerCount,
      ] = await Promise.all([
        userRepository.count({}),
        userRepository.count({ status: UserStatus.ACTIVE }),
        userRepository.countByRole(UserRole.ADMIN),
        userRepository.countByRole(UserRole.MANAGER),
        userRepository.countByRole(UserRole.STAFF),
        userRepository.countByRole(UserRole.SELLER),
        userRepository.countByRole(UserRole.CUSTOMER),
        userRepository.countByRole(UserRole.VIEWER),
      ]);

      const inactiveUsers = totalUsers - activeUsers;
      
      // For locked users, we'd need a custom query (simplified here)
      const lockedUsers = 0;

      const statistics: AdminStatistics = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        lockedUsers,
        usersByRole: {
          [UserRole.ADMIN]: adminCount,
          [UserRole.MANAGER]: managerCount,
          [UserRole.STAFF]: staffCount,
          [UserRole.SELLER]: sellerCount,
          [UserRole.CUSTOMER]: customerCount,
          [UserRole.VIEWER]: viewerCount,
        },
        recentLogins: 0, // Would require time-based query
        newUsersThisWeek: 0, // Would require time-based query
      };

      return ok(statistics);
    } catch (error) {
      logger.error('Failed to get statistics', { error });
      return err(createDatabaseError('Failed to retrieve statistics', error));
    }
  };

  return {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
    unlockUserAccount,
    resetUserPassword,
    revokeUserSessions,
    getStatistics,
  };
};
