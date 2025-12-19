/**
 * RBAC Service
 * Frontend service for role-based access control
 */

import { UserRole } from '@/services/auth.service';

/**
 * Resource types in the system
 */
export const Resource = {
  USER: 'user',
  PRODUCT: 'product',
  ORDER: 'order',
  PAYMENT: 'payment',
  CATEGORY: 'category',
  REPORT: 'report',
  SETTINGS: 'settings',
} as const;

export type Resource = typeof Resource[keyof typeof Resource];

/**
 * Action types
 */
export const Action = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  MANAGE: 'manage',
} as const;

export type Action = typeof Action[keyof typeof Action];

/**
 * Check if a user role has permission for a specific resource and action
 */
export const hasPermission = (
  role: UserRole,
  resource: Resource,
  action: Action
): boolean => {
  // Admin can do everything
  if (role === UserRole.ADMIN) {
    return true;
  }

  // Manager permissions
  if (role === UserRole.MANAGER) {
    if (resource === Resource.SETTINGS && action !== Action.READ) {
      return false;
    }
    return true;
  }

  // Staff permissions
  if (role === UserRole.STAFF) {
    const allowedResources: Resource[] = [Resource.PRODUCT, Resource.ORDER, Resource.PAYMENT];
    if (!allowedResources.includes(resource as Resource)) {
      return false;
    }
    if (resource === Resource.PRODUCT && action !== Action.READ && action !== Action.LIST) {
      return false;
    }
    return true;
  }

  // Seller permissions
  if (role === UserRole.SELLER) {
    if (resource === Resource.PRODUCT) {
      return true; // Can manage own products
    }
    if (resource === Resource.ORDER && (action === Action.READ || action === Action.LIST)) {
      return true;
    }
    return false;
  }

  // Customer permissions
  if (role === UserRole.CUSTOMER) {
    if (resource === Resource.PRODUCT && (action === Action.READ || action === Action.LIST)) {
      return true;
    }
    if (resource === Resource.ORDER || resource === Resource.PAYMENT) {
      return true; // Can manage own orders/payments
    }
    return false;
  }

  // Viewer permissions
  if (role === UserRole.VIEWER) {
    return resource === Resource.PRODUCT && (action === Action.READ || action === Action.LIST);
  }

  return false;
};

/**
 * Check if user can access a resource
 */
export const canAccessResource = (role: UserRole, resource: Resource): boolean => {
  return hasPermission(role, resource, Action.READ);
};

/**
 * Get role level (higher number = more permissions)
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

  return levels[role] || 0;
};

/**
 * Check if role1 has higher or equal level than role2
 */
export const hasHigherOrEqualRole = (role1: UserRole, role2: UserRole): boolean => {
  return getRoleLevel(role1) >= getRoleLevel(role2);
};

/**
 * Filter navigation items based on user role
 */
export const filterNavigationByRole = <T extends { allowedRoles?: UserRole[] }>(
  items: T[],
  userRole: UserRole
): T[] => {
  return items.filter((item) => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) {
      return true; // No restriction
    }
    return item.allowedRoles.includes(userRole);
  });
};
