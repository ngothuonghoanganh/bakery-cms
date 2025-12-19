/**
 * Role-Based Route Component
 * Wrapper for routes that require specific roles
 */

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserRole, hasRole } from '@/services/auth.service';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallbackMessage?: string;
}

export const RoleRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = '/unauthorized',
  fallbackMessage = 'You do not have permission to access this page.'
}: RoleRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>; // Replace with your loading component
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (!hasRole(user, allowedRoles)) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: fallbackMessage 
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};
