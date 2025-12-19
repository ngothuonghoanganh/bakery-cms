/**
 * RoleGate Component
 * Conditionally renders children based on user role
 */

import type { ReactNode } from 'react';
import { UserRole } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export interface RoleGateProps {
  /**
   * Required roles to view the content
   */
  allowedRoles: UserRole[];
  
  /**
   * Content to render if user has required role
   */
  children: ReactNode;
  
  /**
   * Optional fallback content if user doesn't have required role
   */
  fallback?: ReactNode;
  
  /**
   * If true, renders fallback instead of null when access denied
   */
  showFallback?: boolean;
}

/**
 * RoleGate component that controls access based on user role
 * 
 * @example
 * ```tsx
 * <RoleGate allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
 *   <AdminPanel />
 * </RoleGate>
 * ```
 */
export const RoleGate = ({
  allowedRoles,
  children,
  fallback = null,
  showFallback = false,
}: RoleGateProps) => {
  const { user, isAuthenticated } = useAuthStore();

  // Not authenticated - deny access
  if (!isAuthenticated || !user) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Check if user's role is in allowed roles
  if (!allowedRoles.includes(user.role)) {
    return showFallback ? <>{fallback}</> : null;
  }

  // User has required role - render children
  return <>{children}</>;
};

/**
 * Hook to check if current user has specific role
 */
export const useHasRole = (roles: UserRole[]): boolean => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return false;
  }

  return roles.includes(user.role);
};

/**
 * Hook to check if current user is admin
 */
export const useIsAdmin = (): boolean => {
  return useHasRole([UserRole.ADMIN]);
};

/**
 * Hook to check if current user is manager or higher
 */
export const useIsManagerOrHigher = (): boolean => {
  return useHasRole([UserRole.ADMIN, UserRole.MANAGER]);
};

/**
 * Hook to check if current user is staff or higher
 */
export const useIsStaffOrHigher = (): boolean => {
  return useHasRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]);
};

/**
 * Admin-only gate
 */
export const AdminGate = ({ children, fallback, showFallback }: Omit<RoleGateProps, 'allowedRoles'>) => (
  <RoleGate allowedRoles={[UserRole.ADMIN]} fallback={fallback} showFallback={showFallback}>
    {children}
  </RoleGate>
);

/**
 * Manager and above gate
 */
export const ManagerGate = ({ children, fallback, showFallback }: Omit<RoleGateProps, 'allowedRoles'>) => (
  <RoleGate allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]} fallback={fallback} showFallback={showFallback}>
    {children}
  </RoleGate>
);

/**
 * Staff and above gate
 */
export const StaffGate = ({ children, fallback, showFallback }: Omit<RoleGateProps, 'allowedRoles'>) => (
  <RoleGate
    allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]}
    fallback={fallback}
    showFallback={showFallback}
  >
    {children}
  </RoleGate>
);
