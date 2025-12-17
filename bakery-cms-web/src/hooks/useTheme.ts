import { useThemeStore } from '../stores/themeStore';

export const useTheme = () => {
  const { mode, toggleTheme, setTheme } = useThemeStore();

  return {
    mode,
    toggleTheme,
    setTheme,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };
};
