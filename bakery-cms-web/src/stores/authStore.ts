import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthStore = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email: string, _password: string): Promise<void> => {
        // TODO: Implement actual login logic with API
        // For now, mock implementation for development
        const mockUser: User = {
          id: '1',
          email,
          name: 'Admin User',
          role: 'admin',
        };
        const mockToken = 'mock-jwt-token';
        
        set({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        });
      },
      
      logout: () => {
        localStorage.removeItem('bakery-cms-auth');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      
      setUser: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'bakery-cms-auth',
    }
  )
);
