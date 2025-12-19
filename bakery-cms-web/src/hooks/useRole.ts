/**
 * useRole Hook
 * Custom hook for role-based access control in components
 */

import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/services/auth.service';

/**
 * Hook to get current user's role and role-checking utilities
 */
export const useRole = () => {
  const { user, isAuthenticated } = useAuthStore();

  /**
   * Check if user has any of the specified roles
   */
  const hasRole = (roles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return roles.includes(user.role);
  };

  /**
   * Check if user has a specific role
   */
  const isRole = (role: UserRole): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return user.role === role;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return isRole(UserRole.ADMIN);
  };

  /**
   * Check if user is manager or higher
   */
  const isManagerOrHigher = (): boolean => {
    return hasRole([UserRole.ADMIN, UserRole.MANAGER]);
  };

  /**
   * Check if user is staff or higher
   */
  const isStaffOrHigher = (): boolean => {
    return hasRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]);
  };

  /**
   * Check if user is seller
   */
  const isSeller = (): boolean => {
    return hasRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.SELLER]);
  };

  /**
   * Check if user is customer
   */
  const isCustomer = (): boolean => {
    return isRole(UserRole.CUSTOMER);
  };

  /**
   * Check if user is viewer
   */
  const isViewer = (): boolean => {
    return isRole(UserRole.VIEWER);
  };

  /**
   * Get role level (higher number = more permissions)
   */
  const getRoleLevel = (): number => {
    if (!user) return 0;

    const levels: Record<UserRole, number> = {
      [UserRole.ADMIN]: 100,
      [UserRole.MANAGER]: 80,
      [UserRole.STAFF]: 60,
      [UserRole.SELLER]: 40,
      [UserRole.CUSTOMER]: 20,
      [UserRole.VIEWER]: 10,
    };

    return levels[user.role] || 0;
  };

  /**
   * Check if user has higher or equal role level than specified role
   */
  const hasHigherOrEqualRole = (targetRole: UserRole): boolean => {
    if (!user) return false;

    const levels: Record<UserRole, number> = {
      [UserRole.ADMIN]: 100,
      [UserRole.MANAGER]: 80,
      [UserRole.STAFF]: 60,
      [UserRole.SELLER]: 40,
      [UserRole.CUSTOMER]: 20,
      [UserRole.VIEWER]: 10,
    };

    return levels[user.role] >= levels[targetRole];
  };

  return {
    role: user?.role,
    hasRole,
    isRole,
    isAdmin,
    isManagerOrHigher,
    isStaffOrHigher,
    isSeller,
    isCustomer,
    isViewer,
    getRoleLevel,
    hasHigherOrEqualRole,
  };
};
