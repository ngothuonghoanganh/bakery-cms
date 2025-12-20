/**
 * Protected Route Component
 * Wrapper for routes that require authentication
 */

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, redirectTo = '/login' }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const location = useLocation();

  // Wait for state to be hydrated from localStorage
  if (!_hasHydrated) {
    return <div>Loading...</div>; // Replace with your loading component
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>; // Replace with your loading component
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
