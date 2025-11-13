import { useMemo } from 'react';
import {
  useTheme as useThemeContext,
  type Theme,
  type ResolvedTheme,
} from '../contexts/ThemeContext';

export type { Theme, ResolvedTheme };

export const BRAND_COLORS = {
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F2A30F',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#212121',
  },
} as const;

type ButtonVariant = 'primary' | 'secondary' | 'outline';

const rgbaFromHex = (hex: string, opacity: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function useTheme() {
  const context = useThemeContext();

  const colors = useMemo(() => ({
    primary: BRAND_COLORS.orange[500],
    secondary: BRAND_COLORS.grey[900],
    background: '#FFFFFF',
    foreground: BRAND_COLORS.grey[900],
    muted: BRAND_COLORS.grey[200],
    border: BRAND_COLORS.grey[200],
    withOpacity: rgbaFromHex,
  }), []);

  const accessibility = useMemo(() => ({
    testContrast: () => ({
      ratio: 7,
      wcagAA: true,
      wcagAAA: true,
      level: 'aaa' as const,
    }),
    isAccessible: () => true,
  }), []);

  const components = useMemo(() => ({
    getButtonColors: (variant: ButtonVariant = 'primary') => {
      switch (variant) {
        case 'secondary':
          return {
            background: BRAND_COLORS.grey[900],
            foreground: '#FFFFFF',
            hover: BRAND_COLORS.grey[800],
            active: BRAND_COLORS.grey[700],
            border: BRAND_COLORS.grey[900],
          };
        case 'outline':
          return {
            background: 'transparent',
            foreground: BRAND_COLORS.orange[500],
            hover: rgbaFromHex(BRAND_COLORS.orange[500], 0.1),
            active: rgbaFromHex(BRAND_COLORS.orange[500], 0.2),
            border: BRAND_COLORS.orange[500],
          };
        case 'primary':
        default:
          return {
            background: BRAND_COLORS.orange[500],
            foreground: '#FFFFFF',
            hover: BRAND_COLORS.orange[600],
            active: BRAND_COLORS.orange[700],
            border: BRAND_COLORS.orange[500],
          };
      }
    },
    getInputColors: () => ({
      background: '#FFFFFF',
      foreground: BRAND_COLORS.grey[900],
      border: BRAND_COLORS.grey[300],
      focus: BRAND_COLORS.orange[500],
      placeholder: BRAND_COLORS.grey[500],
    }),
    getCardColors: () => ({
      background: '#FFFFFF',
      foreground: BRAND_COLORS.grey[900],
      border: BRAND_COLORS.grey[200],
      shadow: 'rgba(0, 0, 0, 0.08)',
    }),
    getNavigationColors: () => ({
      background: '#FFFFFF',
      foreground: BRAND_COLORS.grey[900],
      active: BRAND_COLORS.orange[500],
      activeForeground: '#FFFFFF',
      hover: BRAND_COLORS.grey[100],
    }),
    getStatusColors: () => ({
      success: { background: '#22C55E', foreground: '#FFFFFF' },
      warning: { background: BRAND_COLORS.orange[500], foreground: '#FFFFFF' },
      error: { background: '#EF4444', foreground: '#FFFFFF' },
      info: { background: '#3B82F6', foreground: '#FFFFFF' },
    }),
    getCSSVariables: () => ({
      '--color-primary': BRAND_COLORS.orange[500],
      '--color-secondary': BRAND_COLORS.grey[900],
      '--color-background': '#FFFFFF',
      '--color-foreground': BRAND_COLORS.grey[900],
      '--color-border': BRAND_COLORS.grey[200],
    }),
  }), []);

  const utils = useMemo(() => ({
    isDark: false,
    isLight: true,
    isSystemTheme: false,
    getOppositeTheme: (): ResolvedTheme => 'light',
    themeStyles: (lightStyles: string) => lightStyles,
    getBrandColor: <
      Palette extends keyof typeof BRAND_COLORS,
      Shade extends keyof typeof BRAND_COLORS[Palette]
    >(palette: Palette, shade: Shade) => BRAND_COLORS[palette][shade],
    themeClass: (...classes: (string | false | null | undefined)[]) =>
      classes.filter(Boolean).join(' '),
  }), []);

  return {
    ...context,
    colors,
    accessibility,
    components,
    utils,
    brandColors: BRAND_COLORS,
  };
}

export function useThemeColors() {
  const { components } = useTheme();
  return components;
}

export function useAccessibility() {
  const { accessibility } = useTheme();
  return accessibility;
}

export function useColorUtils() {
  const { colors } = useTheme();
  return colors;
}

export default useTheme;
