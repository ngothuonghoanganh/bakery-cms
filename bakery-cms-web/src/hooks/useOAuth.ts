/**
 * useOAuth Hook
 * Custom React hook for OAuth authentication flow
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OAuthProvider } from '../types/api/oauth.api';
import type { OAuthLoginResponse } from '../services/oauth.service';
import { oauthService } from '../services/oauth.service';
import { useAuthStore } from '../stores/authStore';
import { useNotification } from './useNotification';

/**
 * OAuth hook state
 */
interface UseOAuthState {
  isLoading: boolean;
  error: string | null;
  isOAuthCallback: boolean;
}

/**
 * OAuth hook return type
 */
interface UseOAuthReturn extends UseOAuthState {
  loginWithOAuth: (provider: OAuthProvider, usePopup?: boolean) => Promise<void>;
  handleCallback: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for OAuth authentication
 */
export const useOAuth = (): UseOAuthReturn => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { success, error: showError } = useNotification();

  const [state, setState] = useState<UseOAuthState>({
    isLoading: false,
    error: null,
    isOAuthCallback: oauthService.isOAuthCallback(),
  });

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Login with OAuth provider
   */
  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider, usePopup: boolean = false) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Get current origin for redirect URI
        const redirectUri = `${window.location.origin}/auth/oauth/callback`;

        // Initiate OAuth flow
        await oauthService.initiateOAuthLogin(provider, redirectUri, usePopup);

        // Note: Page will redirect or popup will open
        // Loading state will be reset on callback
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to initiate OAuth login';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        showError('OAuth Login Failed', errorMessage);
      }
    },
    [showError]
  );

  /**
   * Handle OAuth callback
   */
  const handleCallback = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get URL search params
      const searchParams = new URLSearchParams(window.location.search);

      // Process OAuth callback
      const response: OAuthLoginResponse = await oauthService.handleOAuthCallback(
        searchParams
      );

      // Store user and token in auth store
      setUser(
        {
          id: response.user.id,
          email: response.user.email,
          name: `${response.user.firstName} ${response.user.lastName}`,
          role: response.user.role,
        },
        response.tokens.accessToken
      );

      // Show success notification
      success(
        response.isNewUser ? 'Welcome!' : 'Welcome back!',
        response.isNewUser
          ? 'Your account has been created successfully.'
          : 'You have been logged in successfully.'
      );

      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      const errorMessage = error.message || 'OAuth authentication failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      showError('OAuth Authentication Failed', errorMessage);

      // Redirect to login page on error
      navigate('/auth/login', { replace: true });
    }
  }, [navigate, setUser, success, showError]);

  /**
   * Auto-handle callback if we're on the callback page
   */
  useEffect(() => {
    if (state.isOAuthCallback && !state.isLoading && !state.error) {
      handleCallback();
    }
  }, [state.isOAuthCallback, state.isLoading, state.error, handleCallback]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clean up any stale OAuth session data
      oauthService.clearOAuthSession();
    };
  }, []);

  return {
    ...state,
    loginWithOAuth,
    handleCallback,
    clearError,
  };
};

export default useOAuth;
