/**
 * Admin Management Types
 * Types for admin user management operations
 */

import { UserRole, UserStatus } from '../enums/auth.enums';

/**
 * Admin user creation DTO
 */
export type CreateAdminUserDTO = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

/**
 * Admin user update DTO
 */
export type UpdateAdminUserDTO = {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
};

/**
 * Admin user response
 */
export type AdminUserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  provider: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Admin user list query
 */
export type AdminUserListQuery = {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'lastLoginAt' | 'email';
  sortOrder?: 'asc' | 'desc';
};

/**
 * Admin user list response
 */
export type AdminUserListResponse = {
  users: AdminUserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Admin statistics
 */
export type AdminStatistics = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  usersByRole: Record<UserRole, number>;
  recentLogins: number; // Last 24 hours
  newUsersThisWeek: number;
};

/**
 * Admin audit log entry
 */
export type AdminAuditLog = {
  id: string;
  adminId: string;
  adminEmail: string;
  action: AdminAction;
  targetUserId?: string;
  targetUserEmail?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
};

/**
 * Admin action types
 */
export enum AdminAction {
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  RESTORE_USER = 'restore_user',
  CHANGE_USER_ROLE = 'change_user_role',
  CHANGE_USER_STATUS = 'change_user_status',
  UNLOCK_USER_ACCOUNT = 'unlock_user_account',
  RESET_USER_PASSWORD = 'reset_user_password',
  REVOKE_USER_SESSIONS = 'revoke_user_sessions',
}

/**
 * Unlock account DTO (already defined in security.types but repeated here for admin context)
 */
export type UnlockUserAccountDTO = {
  userId: string;
  reason: string;
};

/**
 * Reset user password DTO (admin-initiated)
 */
export type AdminResetPasswordDTO = {
  userId: string;
  newPassword: string;
  requirePasswordChange: boolean;
};

/**
 * Revoke user sessions DTO
 */
export type RevokeUserSessionsDTO = {
  userId: string;
  reason: string;
};
