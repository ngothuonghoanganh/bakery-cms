/**
 * Permission Utilities
 * Functions for checking user permissions based on roles
 */

import { UserRole } from '@bakery-cms/common';

/**
 * Resource types in the system
 */
export enum Resource {
  USER = 'user',
  PRODUCT = 'product',
  ORDER = 'order',
  PAYMENT = 'payment',
  CATEGORY = 'category',
  REPORT = 'report',
  SETTINGS = 'settings',
}

/**
 * Action types
 */
export enum Action {
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
  readonly resource: Resource;
  readonly action: Action;
  readonly conditions?: {
    readonly ownerOnly?: boolean;
    readonly statusRestrictions?: string[];
  };
};

/**
 * Role-based permission mappings
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admins can do everything
    { resource: Resource.USER, action: Action.MANAGE },
    { resource: Resource.PRODUCT, action: Action.MANAGE },
    { resource: Resource.ORDER, action: Action.MANAGE },
    { resource: Resource.PAYMENT, action: Action.MANAGE },
    { resource: Resource.CATEGORY, action: Action.MANAGE },
    { resource: Resource.REPORT, action: Action.MANAGE },
    { resource: Resource.SETTINGS, action: Action.MANAGE },
  ],

  [UserRole.MANAGER]: [
    // Managers can view and manage most resources except critical settings
    { resource: Resource.USER, action: Action.READ },
    { resource: Resource.USER, action: Action.LIST },
    { resource: Resource.PRODUCT, action: Action.MANAGE },
    { resource: Resource.ORDER, action: Action.MANAGE },
    { resource: Resource.PAYMENT, action: Action.READ },
    { resource: Resource.PAYMENT, action: Action.LIST },
    { resource: Resource.CATEGORY, action: Action.MANAGE },
    { resource: Resource.REPORT, action: Action.READ },
    { resource: Resource.REPORT, action: Action.LIST },
  ],

  [UserRole.STAFF]: [
    // Staff can manage orders and view products
    { resource: Resource.PRODUCT, action: Action.READ },
    { resource: Resource.PRODUCT, action: Action.LIST },
    { resource: Resource.ORDER, action: Action.MANAGE },
    { resource: Resource.PAYMENT, action: Action.READ },
    { resource: Resource.PAYMENT, action: Action.LIST },
  ],

  [UserRole.SELLER]: [
    // Sellers can manage their own products and view their orders
    { resource: Resource.PRODUCT, action: Action.CREATE },
    { resource: Resource.PRODUCT, action: Action.READ },
    { resource: Resource.PRODUCT, action: Action.UPDATE, conditions: { ownerOnly: true } },
    { resource: Resource.PRODUCT, action: Action.DELETE, conditions: { ownerOnly: true } },
    { resource: Resource.PRODUCT, action: Action.LIST, conditions: { ownerOnly: true } },
    { resource: Resource.ORDER, action: Action.READ },
    { resource: Resource.ORDER, action: Action.LIST, conditions: { ownerOnly: true } },
    { resource: Resource.PAYMENT, action: Action.READ, conditions: { ownerOnly: true } },
  ],

  [UserRole.CUSTOMER]: [
    // Customers can view products and manage their own orders
    { resource: Resource.PRODUCT, action: Action.READ },
    { resource: Resource.PRODUCT, action: Action.LIST },
    { resource: Resource.ORDER, action: Action.CREATE },
    { resource: Resource.ORDER, action: Action.READ, conditions: { ownerOnly: true } },
    { resource: Resource.ORDER, action: Action.LIST, conditions: { ownerOnly: true } },
    { resource: Resource.PAYMENT, action: Action.CREATE, conditions: { ownerOnly: true } },
    { resource: Resource.PAYMENT, action: Action.READ, conditions: { ownerOnly: true } },
  ],

  [UserRole.VIEWER]: [
    // Viewers can only read public information
    { resource: Resource.PRODUCT, action: Action.READ },
    { resource: Resource.PRODUCT, action: Action.LIST },
  ],
};

/**
 * Check if a user role has permission for a specific resource and action
 */
export const hasPermission = (
  role: UserRole,
  resource: Resource,
  action: Action
): boolean => {
  const permissions = ROLE_PERMISSIONS[role];

  return permissions.some((permission) => {
    // Check if permission matches resource
    if (permission.resource !== resource) {
      return false;
    }

    // Check if permission matches action or is MANAGE (which includes all actions)
    if (permission.action === Action.MANAGE) {
      return true;
    }

    return permission.action === action;
  });
};

/**
 * Check if permission requires ownership
 */
export const requiresOwnership = (
  role: UserRole,
  resource: Resource,
  action: Action
): boolean => {
  const permissions = ROLE_PERMISSIONS[role];

  const matchingPermission = permissions.find(
    (permission) =>
      permission.resource === resource &&
      (permission.action === action || permission.action === Action.MANAGE)
  );

  return matchingPermission?.conditions?.ownerOnly === true;
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role];
};

/**
 * Check if role can access resource (any action)
 */
export const canAccessResource = (role: UserRole, resource: Resource): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.some((permission) => permission.resource === resource);
};

/**
 * Get allowed actions for a role on a specific resource
 */
export const getAllowedActions = (role: UserRole, resource: Resource): Action[] => {
  const permissions = ROLE_PERMISSIONS[role];

  return permissions
    .filter((permission) => permission.resource === resource)
    .map((permission) => {
      if (permission.action === Action.MANAGE) {
        // MANAGE includes all actions
        return [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.LIST];
      }
      return [permission.action];
    })
    .flat();
};

/**
 * Check if role is admin
 */
export const isAdmin = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

/**
 * Check if role is manager or higher
 */
export const isManagerOrHigher = (role: UserRole): boolean => {
  return role === UserRole.ADMIN || role === UserRole.MANAGER;
};

/**
 * Check if role is staff or higher
 */
export const isStaffOrHigher = (role: UserRole): boolean => {
  return (
    role === UserRole.ADMIN || role === UserRole.MANAGER || role === UserRole.STAFF
  );
};

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export const getRoleLevel = (role: UserRole): number => {
  const levels: Record<UserRole, number> = {
    [UserRole.ADMIN]: 100,
    [UserRole.MANAGER]: 80,
    [UserRole.STAFF]: 60,
    [UserRole.SELLER]: 40,
    [UserRole.CUSTOMER]: 20,
    [UserRole.VIEWER]: 10,
  };

  return levels[role];
};

/**
 * Check if role1 has higher or equal level than role2
 */
export const hasHigherOrEqualRole = (role1: UserRole, role2: UserRole): boolean => {
  return getRoleLevel(role1) >= getRoleLevel(role2);
};
