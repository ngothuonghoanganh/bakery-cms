import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '@/services/auth.service';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
} from '@/services/auth.service';

// Re-export User type for convenience
export type { User } from '@/services/auth.service';

type AuthStore = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setUser: (user: User, accessToken: string, refreshToken: string) => void;
  refreshAuth: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      login: async (credentials: LoginRequest): Promise<void> => {
        try {
          set({ isLoading: true });
          const response = await authService.login(credentials);

          set({
            user: response.user,
            token: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterRequest): Promise<void> => {
        try {
          set({ isLoading: true });
          const response = await authService.register(data);

          set({
            user: response.user,
            token: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async (): Promise<void> => {
        try {
          const { refreshToken } = get();
          if (refreshToken) {
            await authService.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          get().clearAuth();
        }
      },

      logoutAll: async (): Promise<void> => {
        try {
          await authService.logoutAll();
        } catch (error) {
          console.error('Logout all error:', error);
        } finally {
          get().clearAuth();
        }
      },

      setUser: (user: User, accessToken: string, refreshToken: string) => {
        set({
          user,
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      refreshAuth: async (): Promise<void> => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const tokens = await authService.refreshToken(refreshToken);

          set({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        } catch (error) {
          get().clearAuth();
          throw error;
        }
      },

      changePassword: async (data: ChangePasswordRequest): Promise<void> => {
        await authService.changePassword(data);
      },

      fetchCurrentUser: async (): Promise<void> => {
        try {
          set({ isLoading: true });
          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          get().clearAuth();
          throw error;
        }
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: 'bakery-cms-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
