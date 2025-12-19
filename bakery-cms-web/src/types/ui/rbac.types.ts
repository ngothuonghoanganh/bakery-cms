/**
 * RBAC Component Types
 * Type definitions for role-based access control components
 */

import type { ReactNode } from 'react';
import { UserRole } from '@/services/auth.service';

/**
 * Props for RoleGate component
 */
export interface RoleGateProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * Props for ProtectedRoute component
 */
export interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Permission check function type
 */
export type PermissionCheckFn = (role: UserRole, resource: string, action: string) => boolean;

/**
 * Resource access map
 */
export type ResourceAccessMap = {
  [resource: string]: {
    [action: string]: UserRole[];
  };
};

/**
 * Role-based navigation item
 */
export interface RoleBasedNavigationItem {
  path: string;
  label: string;
  icon?: ReactNode;
  allowedRoles: UserRole[];
  children?: RoleBasedNavigationItem[];
}
