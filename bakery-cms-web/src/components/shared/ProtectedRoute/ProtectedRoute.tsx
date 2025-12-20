/**
 * ProtectedRoute Component
 * Route wrapper that requires authentication and specific roles
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { UserRole } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export interface ProtectedRouteProps {
  /**
   * Required roles to access the route
   */
  allowedRoles: UserRole[];

  /**
   * Path to redirect to if access is denied
   */
  redirectTo?: string;

  /**
   * Content to render if user has access
   */
  children: ReactNode;
}

/**
 * ProtectedRoute component that redirects unauthorized users
 *
 * @example
 * ```tsx
 * <Route
 *   path="/admin"
 *   element={
 *     <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
export const ProtectedRoute = ({
  allowedRoles,
  redirectTo = '/login',
  children,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(user.role)) {
    // Authenticated but not authorized - redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

/**
 * Admin-only protected route
 */
export const AdminRoute = ({ children, redirectTo }: Omit<ProtectedRouteProps, 'allowedRoles'>) => (
  <ProtectedRoute allowedRoles={[UserRole.ADMIN]} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

/**
 * Manager and above protected route
 */
export const ManagerRoute = ({
  children,
  redirectTo,
}: Omit<ProtectedRouteProps, 'allowedRoles'>) => (
  <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]} redirectTo={redirectTo}>
    {children}
  </ProtectedRoute>
);

/**
 * Staff and above protected route
 */
export const StaffRoute = ({ children, redirectTo }: Omit<ProtectedRouteProps, 'allowedRoles'>) => (
  <ProtectedRoute
    allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]}
    redirectTo={redirectTo}
  >
    {children}
  </ProtectedRoute>
);
