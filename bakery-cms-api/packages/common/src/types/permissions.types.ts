/**
 * Permission Types
 * Type definitions for permission-based access control
 */

import { UserRole } from '../enums/auth.enums';

/**
 * Resource types in the system
 */
export enum ResourceType {
  USER = 'user',
  PRODUCT = 'product',
  ORDER = 'order',
  PAYMENT = 'payment',
  CATEGORY = 'category',
  REPORT = 'report',
  SETTINGS = 'settings',
}

/**
 * Permission action types
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  MANAGE = 'manage',
}

/**
 * Permission definition
 */
export type Permission = {
  readonly resource: ResourceType;
  readonly action: PermissionAction;
  readonly conditions?: PermissionConditions;
};

/**
 * Conditions for permission checks
 */
export type PermissionConditions = {
  readonly ownerOnly?: boolean;
  readonly statusRestrictions?: string[];
  readonly fieldRestrictions?: string[];
};

/**
 * Permission check result
 */
export type PermissionCheckResult = {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly requiresOwnership?: boolean;
};

/**
 * Role-based permission set
 */
export type RolePermissionSet = {
  readonly role: UserRole;
  readonly permissions: Permission[];
  readonly description: string;
};

/**
 * Permission context for checking permissions
 */
export type PermissionContext = {
  readonly userId: string;
  readonly role: UserRole;
  readonly resourceOwnerId?: string;
  readonly resourceStatus?: string;
};

/**
 * Permission query
 */
export type PermissionQuery = {
  readonly resource: ResourceType;
  readonly action: PermissionAction;
  readonly context: PermissionContext;
};
