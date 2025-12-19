/**
 * RBAC Service
 * Service layer for role-based access control operations
 */

import { UserRole, Permission } from '@bakery-cms/common';
import {
  hasPermission,
  requiresOwnership,
  getRolePermissions,
  canAccessResource,
  Resource,
  Action,
} from '../utils/permissions.utils';
import type {
  PermissionQuery,
  PermissionCheckResult,
  RBACService,
} from '@bakery-cms/common';

/**
 * Create RBAC service
 * Factory function following functional programming principles
 */
export const createRBACService = (): RBACService => {
  /**
   * Check if user has permission for a specific action on a resource
   */
  const checkPermission = (query: PermissionQuery): PermissionCheckResult => {
    const { resource, action, context } = query;
    const { role, userId, resourceOwnerId } = context;

    // Convert string resource/action to enum values
    const resourceEnum = resource as unknown as Resource;
    const actionEnum = action as unknown as Action;

    // Check if role has permission
    const hasAccess = hasPermission(role, resourceEnum, actionEnum);

    if (!hasAccess) {
      return {
        allowed: false,
        reason: `Role ${role} does not have permission to ${action} ${resource}`,
      };
    }

    // Check if ownership is required
    const needsOwnership = requiresOwnership(role, resourceEnum, actionEnum);

    if (needsOwnership) {
      // If ownership is required but no owner info provided
      if (!userId || !resourceOwnerId) {
        return {
          allowed: false,
          reason: 'Ownership verification required but owner information missing',
          requiresOwnership: true,
        };
      }

      // Check ownership
      if (userId !== resourceOwnerId) {
        return {
          allowed: false,
          reason: 'You can only access your own resources',
          requiresOwnership: true,
        };
      }
    }

    // Permission granted
    return {
      allowed: true,
      requiresOwnership: needsOwnership,
    };
  };

  /**
   * Get all permissions for a specific role
   */
  const getRolePermissionsForRole = (role: UserRole): Permission[] => {
    return getRolePermissions(role) as unknown as Permission[];
  };

  /**
   * Check if role can access any action on a resource
   */
  const canAccessResourceByRole = (role: UserRole, resource: string): boolean => {
    const resourceEnum = resource as unknown as Resource;
    return canAccessResource(role, resourceEnum);
  };

  /**
   * Check if a specific permission requires ownership
   */
  const requiresOwnershipCheck = (
    role: UserRole,
    resource: string,
    action: string
  ): boolean => {
    const resourceEnum = resource as unknown as Resource;
    const actionEnum = action as unknown as Action;
    return requiresOwnership(role, resourceEnum, actionEnum);
  };

  return {
    checkPermission,
    getRolePermissions: getRolePermissionsForRole,
    canAccessResource: canAccessResourceByRole,
    requiresOwnership: requiresOwnershipCheck,
  };
};

/**
 * Default RBAC service instance
 */
export const rbacService = createRBACService();
