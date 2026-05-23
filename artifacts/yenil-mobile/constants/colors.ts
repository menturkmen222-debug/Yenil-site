export type ThemeKey = "green" | "dark" | "white" | "girls";

export interface ColorPalette {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  success: string;
  warning: string;
  tabBarBg: string;
  headerGradientStart: string;
  headerGradientEnd: string;
  isDark: boolean;
  radius: number;
}

export const themes: Record<ThemeKey, ColorPalette> = {
  green: {
    text: "#0f3d22",
    tint: "#1B6B3A",
    background: "#f0fdf4",
    foreground: "#0f3d22",
    card: "#ffffff",
    cardForeground: "#0f3d22",
    primary: "#1B6B3A",
    primaryForeground: "#ffffff",
    secondary: "#dcfce7",
    secondaryForeground: "#0f3d22",
    muted: "#f0fdf4",
    mutedForeground: "#4b7c5e",
    accent: "#155230",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#bbf7d0",
    input: "#d1fae5",
    success: "#22c55e",
    warning: "#d97706",
    tabBarBg: "#ffffff",
    headerGradientStart: "#0d4222",
    headerGradientEnd: "#1B6B3A",
    isDark: false,
    radius: 16,
  },
  dark: {
    text: "#f1f5f9",
    tint: "#22c55e",
    background: "#0d0d0d",
    foreground: "#f1f5f9",
    card: "#1a1a1a",
    cardForeground: "#f1f5f9",
    primary: "#22c55e",
    primaryForeground: "#0a0a0a",
    secondary: "#1e3a2a",
    secondaryForeground: "#bbf7d0",
    muted: "#1e1e1e",
    mutedForeground: "#94a3b8",
    accent: "#16a34a",
    accentForeground: "#ffffff",
    destructive: "#f87171",
    destructiveForeground: "#ffffff",
    border: "#2a2a2a",
    input: "#262626",
    success: "#22c55e",
    warning: "#f59e0b",
    tabBarBg: "#0d0d0d",
    headerGradientStart: "#111111",
    headerGradientEnd: "#1a1a1a",
    isDark: true,
    radius: 16,
  },
  white: {
    text: "#0f172a",
    tint: "#3b82f6",
    background: "#ffffff",
    foreground: "#0f172a",
    card: "#f8fafc",
    cardForeground: "#0f172a",
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    secondary: "#eff6ff",
    secondaryForeground: "#1e40af",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    accent: "#2563eb",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#e2e8f0",
    input: "#f1f5f9",
    success: "#22c55e",
    warning: "#f59e0b",
    tabBarBg: "#ffffff",
    headerGradientStart: "#1d4ed8",
    headerGradientEnd: "#3b82f6",
    isDark: false,
    radius: 16,
  },
  girls: {
    text: "#831843",
    tint: "#db2777",
    background: "#fff0f8",
    foreground: "#831843",
    card: "#ffffff",
    cardForeground: "#831843",
    primary: "#ec4899",
    primaryForeground: "#ffffff",
    secondary: "#fce7f3",
    secondaryForeground: "#9d174d",
    muted: "#fdf2f8",
    mutedForeground: "#9d174d",
    accent: "#db2777",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#fbcfe8",
    input: "#fce7f3",
    success: "#22c55e",
    warning: "#f59e0b",
    tabBarBg: "#ffffff",
    headerGradientStart: "#9d174d",
    headerGradientEnd: "#ec4899",
    isDark: false,
    radius: 16,
  },
};

export const themeRadius = 16;

const colors = {
  light: themes.green,
  dark: themes.dark,
  radius: themeRadius,
};

export default colors;
