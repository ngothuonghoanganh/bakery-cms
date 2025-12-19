/**
 * RBAC Types
 * Type definitions for Role-Based Access Control
 */

import { UserRole } from '../enums/auth.enums';
import { Permission, PermissionQuery, PermissionCheckResult } from './permissions.types';

/**
 * RBAC Service function types
 */
export type RBACService = {
  readonly checkPermission: (query: PermissionQuery) => PermissionCheckResult;
  readonly getRolePermissions: (role: UserRole) => Permission[];
  readonly canAccessResource: (role: UserRole, resource: string) => boolean;
  readonly requiresOwnership: (role: UserRole, resource: string, action: string) => boolean;
};

/**
 * Role assignment data
 */
export type RoleAssignment = {
  readonly userId: string;
  readonly role: UserRole;
  readonly assignedBy: string;
  readonly assignedAt: Date;
  readonly reason?: string;
};

/**
 * Role change request
 */
export type ChangeRoleDTO = {
  readonly userId: string;
  readonly newRole: UserRole;
  readonly reason?: string;
};

/**
 * Role change result
 */
export type RoleChangeResult = {
  readonly userId: string;
  readonly previousRole: UserRole;
  readonly newRole: UserRole;
  readonly changedAt: Date;
};

/**
 * Access control entry
 */
export type AccessControlEntry = {
  readonly role: UserRole;
  readonly resource: string;
  readonly actions: string[];
  readonly conditions?: Record<string, unknown>;
};

/**
 * Access control list
 */
export type AccessControlList = {
  readonly entries: AccessControlEntry[];
  readonly defaultDeny: boolean;
};
