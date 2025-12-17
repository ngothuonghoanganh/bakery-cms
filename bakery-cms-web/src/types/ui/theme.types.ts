export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
}
