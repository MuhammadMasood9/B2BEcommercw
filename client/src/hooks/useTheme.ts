import { useContext, useMemo, useCallback } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import type { Theme, ResolvedTheme } from '../contexts/ThemeContext';

// Re-export theme types for convenience
export type { Theme, ResolvedTheme };

// Color manipulation utilities
export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

export interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  level: 'fail' | 'aa' | 'aaa';
}

// Brand color definitions
export const BRAND_COLORS = {
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F2A30F', // Primary brand orange
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE', // Light grey background
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#212121', // Dark grey/black
  },
} as const;

/**
 * Enhanced useTheme hook with utilities and helpers
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  // Color manipulation utilities
  const colorUtils = useMemo(() => ({
    /**
     * Convert hex color to RGB
     */
    hexToRgb: (hex: string): ColorRGB | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

    /**
     * Convert RGB to hex
     */
    rgbToHex: (r: number, g: number, b: number): string => {
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    },

    /**
     * Convert RGB to HSL
     */
    rgbToHsl: (r: number, g: number, b: number): ColorHSL => {
      r /= 255;
      g /= 255;
      b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return { h: h * 360, s: s * 100, l: l * 100 };
    },

    /**
     * Convert HSL to RGB
     */
    hslToRgb: (h: number, s: number, l: number): ColorRGB => {
      h /= 360;
      s /= 100;
      l /= 100;

      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      let r: number, g: number, b: number;

      if (s === 0) {
        r = g = b = l; // achromatic
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    },

    /**
     * Lighten a color by a percentage
     */
    lighten: (hex: string, percentage: number): string => {
      const rgb = colorUtils.hexToRgb(hex);
      if (!rgb) return hex;

      const hsl = colorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
      hsl.l = Math.min(100, hsl.l + percentage);
      
      const newRgb = colorUtils.hslToRgb(hsl.h, hsl.s, hsl.l);
      return colorUtils.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    },

    /**
     * Darken a color by a percentage
     */
    darken: (hex: string, percentage: number): string => {
      const rgb = colorUtils.hexToRgb(hex);
      if (!rgb) return hex;

      const hsl = colorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
      hsl.l = Math.max(0, hsl.l - percentage);
      
      const newRgb = colorUtils.hslToRgb(hsl.h, hsl.s, hsl.l);
      return colorUtils.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    },

    /**
     * Adjust color opacity
     */
    withOpacity: (hex: string, opacity: number): string => {
      const rgb = colorUtils.hexToRgb(hex);
      if (!rgb) return hex;
      
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },

    /**
     * Get theme-appropriate color variant
     */
    getThemeColor: (lightColor: string, darkColor: string, currentTheme: ResolvedTheme): string => {
      return currentTheme === 'dark' ? darkColor : lightColor;
    },
  }), []);

  // Accessibility helpers
  const accessibilityUtils = useMemo(() => ({
    /**
     * Calculate relative luminance of a color
     */
    getLuminance: (color: ColorRGB): number => {
      const { r, g, b } = color;
      
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    },

    /**
     * Calculate contrast ratio between two colors
     */
    getContrastRatio: (color1: ColorRGB, color2: ColorRGB): number => {
      const lum1 = accessibilityUtils.getLuminance(color1);
      const lum2 = accessibilityUtils.getLuminance(color2);
      
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      
      return (brightest + 0.05) / (darkest + 0.05);
    },

    /**
     * Test contrast ratio and return WCAG compliance
     */
    testContrast: (foreground: string, background: string): ContrastResult => {
      const fg = colorUtils.hexToRgb(foreground);
      const bg = colorUtils.hexToRgb(background);
      
      if (!fg || !bg) {
        return {
          ratio: 0,
          wcagAA: false,
          wcagAAA: false,
          level: 'fail'
        };
      }
      
      const ratio = accessibilityUtils.getContrastRatio(fg, bg);
      const wcagAA = ratio >= 4.5;
      const wcagAAA = ratio >= 7;
      
      return {
        ratio: Math.round(ratio * 100) / 100,
        wcagAA,
        wcagAAA,
        level: wcagAAA ? 'aaa' : wcagAA ? 'aa' : 'fail'
      };
    },

    /**
     * Get accessible color variant if contrast is insufficient
     */
    getAccessibleColor: (foreground: string, background: string, targetRatio: number = 4.5): string => {
      const result = accessibilityUtils.testContrast(foreground, background);
      
      if (result.ratio >= targetRatio) {
        return foreground;
      }
      
      // Try to adjust the color to meet contrast requirements
      const fg = colorUtils.hexToRgb(foreground);
      const bg = colorUtils.hexToRgb(background);
      
      if (!fg || !bg) return foreground;
      
      const bgLuminance = accessibilityUtils.getLuminance(bg);
      
      // If background is light, darken the foreground
      if (bgLuminance > 0.5) {
        let adjustedColor = foreground;
        for (let i = 10; i <= 50; i += 10) {
          adjustedColor = colorUtils.darken(foreground, i);
          const testResult = accessibilityUtils.testContrast(adjustedColor, background);
          if (testResult.ratio >= targetRatio) {
            return adjustedColor;
          }
        }
      } else {
        // If background is dark, lighten the foreground
        let adjustedColor = foreground;
        for (let i = 10; i <= 50; i += 10) {
          adjustedColor = colorUtils.lighten(foreground, i);
          const testResult = accessibilityUtils.testContrast(adjustedColor, background);
          if (testResult.ratio >= targetRatio) {
            return adjustedColor;
          }
        }
      }
      
      return foreground;
    },

    /**
     * Check if a color combination is accessible
     */
    isAccessible: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
      const result = accessibilityUtils.testContrast(foreground, background);
      return level === 'AA' ? result.wcagAA : result.wcagAAA;
    },

    /**
     * Get high contrast color variants
     */
    getHighContrastColors: () => ({
      primary: context.isHighContrast ? '#A85C00' : BRAND_COLORS.orange[500],
      secondary: context.isHighContrast ? '#000000' : BRAND_COLORS.grey[900],
      background: context.isHighContrast ? '#FFFFFF' : BRAND_COLORS.grey[200],
      foreground: context.isHighContrast ? '#000000' : BRAND_COLORS.grey[900],
    }),
  }), [colorUtils, context.isHighContrast]);

  // Theme-aware component helpers
  const componentHelpers = useMemo(() => ({
    /**
     * Get button variant colors based on current theme
     */
    getButtonColors: (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
      const { resolvedTheme, isHighContrast } = context;
      
      if (isHighContrast) {
        switch (variant) {
          case 'primary':
            return {
              background: '#A85C00',
              foreground: '#FFFFFF',
              hover: '#8B4A00',
              active: '#6D3700',
            };
          case 'secondary':
            return {
              background: '#000000',
              foreground: '#FFFFFF',
              hover: '#333333',
              active: '#1A1A1A',
            };
          case 'outline':
            return {
              background: 'transparent',
              foreground: '#A85C00',
              border: '#A85C00',
              hover: '#A85C00',
              hoverForeground: '#FFFFFF',
            };
        }
      }

      if (resolvedTheme === 'dark') {
        switch (variant) {
          case 'primary':
            return {
              background: BRAND_COLORS.orange[500],
              foreground: '#FFFFFF',
              hover: BRAND_COLORS.orange[600],
              active: BRAND_COLORS.orange[700],
            };
          case 'secondary':
            return {
              background: BRAND_COLORS.grey[700],
              foreground: '#FFFFFF',
              hover: BRAND_COLORS.grey[600],
              active: BRAND_COLORS.grey[800],
            };
          case 'outline':
            return {
              background: 'transparent',
              foreground: BRAND_COLORS.orange[400],
              border: BRAND_COLORS.orange[400],
              hover: BRAND_COLORS.orange[400],
              hoverForeground: BRAND_COLORS.grey[900],
            };
        }
      }

      // Light theme
      switch (variant) {
        case 'primary':
          return {
            background: BRAND_COLORS.orange[500],
            foreground: '#FFFFFF',
            hover: BRAND_COLORS.orange[600],
            active: BRAND_COLORS.orange[700],
          };
        case 'secondary':
          return {
            background: BRAND_COLORS.grey[900],
            foreground: '#FFFFFF',
            hover: BRAND_COLORS.grey[800],
            active: BRAND_COLORS.grey[700],
          };
        case 'outline':
          return {
            background: 'transparent',
            foreground: BRAND_COLORS.orange[500],
            border: BRAND_COLORS.orange[500],
            hover: BRAND_COLORS.orange[500],
            hoverForeground: '#FFFFFF',
          };
      }
    },

    /**
     * Get input field colors based on current theme
     */
    getInputColors: () => {
      const { resolvedTheme, isHighContrast } = context;
      
      if (isHighContrast) {
        return {
          background: '#FFFFFF',
          foreground: '#000000',
          border: '#000000',
          focus: '#A85C00',
          placeholder: '#666666',
        };
      }

      if (resolvedTheme === 'dark') {
        return {
          background: BRAND_COLORS.grey[800],
          foreground: BRAND_COLORS.grey[100],
          border: BRAND_COLORS.grey[600],
          focus: BRAND_COLORS.orange[400],
          placeholder: BRAND_COLORS.grey[400],
        };
      }

      return {
        background: '#FFFFFF',
        foreground: BRAND_COLORS.grey[900],
        border: BRAND_COLORS.grey[300],
        focus: BRAND_COLORS.orange[500],
        placeholder: BRAND_COLORS.grey[500],
      };
    },

    /**
     * Get card colors based on current theme
     */
    getCardColors: () => {
      const { resolvedTheme, isHighContrast } = context;
      
      if (isHighContrast) {
        return {
          background: '#FFFFFF',
          foreground: '#000000',
          border: '#000000',
          shadow: 'rgba(0, 0, 0, 0.3)',
        };
      }

      if (resolvedTheme === 'dark') {
        return {
          background: BRAND_COLORS.grey[800],
          foreground: BRAND_COLORS.grey[100],
          border: BRAND_COLORS.grey[700],
          shadow: 'rgba(0, 0, 0, 0.5)',
        };
      }

      return {
        background: '#FFFFFF',
        foreground: BRAND_COLORS.grey[900],
        border: BRAND_COLORS.grey[200],
        shadow: 'rgba(0, 0, 0, 0.1)',
      };
    },

    /**
     * Get navigation colors based on current theme
     */
    getNavigationColors: () => {
      const { resolvedTheme, isHighContrast } = context;
      
      if (isHighContrast) {
        return {
          background: '#FFFFFF',
          foreground: '#000000',
          active: '#A85C00',
          activeForeground: '#FFFFFF',
          hover: '#F0F0F0',
        };
      }

      if (resolvedTheme === 'dark') {
        return {
          background: BRAND_COLORS.grey[900],
          foreground: BRAND_COLORS.grey[100],
          active: BRAND_COLORS.orange[500],
          activeForeground: '#FFFFFF',
          hover: BRAND_COLORS.grey[800],
        };
      }

      return {
        background: '#FFFFFF',
        foreground: BRAND_COLORS.grey[900],
        active: BRAND_COLORS.orange[500],
        activeForeground: '#FFFFFF',
        hover: BRAND_COLORS.grey[50],
      };
    },

    /**
     * Get status colors (success, warning, error) based on current theme
     */
    getStatusColors: () => {
      const { resolvedTheme, isHighContrast } = context;
      
      const baseColors = {
        success: { light: '#22C55E', dark: '#16A34A' },
        warning: { light: BRAND_COLORS.orange[500], dark: BRAND_COLORS.orange[400] },
        error: { light: '#EF4444', dark: '#DC2626' },
        info: { light: '#3B82F6', dark: '#2563EB' },
      };

      if (isHighContrast) {
        return {
          success: { background: '#006600', foreground: '#FFFFFF' },
          warning: { background: '#A85C00', foreground: '#FFFFFF' },
          error: { background: '#CC0000', foreground: '#FFFFFF' },
          info: { background: '#0066CC', foreground: '#FFFFFF' },
        };
      }

      return Object.entries(baseColors).reduce((acc, [key, colors]) => {
        acc[key as keyof typeof baseColors] = {
          background: resolvedTheme === 'dark' ? colors.dark : colors.light,
          foreground: '#FFFFFF',
        };
        return acc;
      }, {} as Record<string, { background: string; foreground: string }>);
    },

    /**
     * Generate CSS custom properties for current theme
     */
    getCSSVariables: () => {
      const { resolvedTheme, isHighContrast } = context;
      
      const variables: Record<string, string> = {};
      
      if (isHighContrast) {
        variables['--color-primary'] = '#A85C00';
        variables['--color-secondary'] = '#000000';
        variables['--color-background'] = '#FFFFFF';
        variables['--color-foreground'] = '#000000';
        variables['--color-border'] = '#000000';
      } else if (resolvedTheme === 'dark') {
        variables['--color-primary'] = BRAND_COLORS.orange[500];
        variables['--color-secondary'] = BRAND_COLORS.grey[700];
        variables['--color-background'] = BRAND_COLORS.grey[900];
        variables['--color-foreground'] = BRAND_COLORS.grey[100];
        variables['--color-border'] = BRAND_COLORS.grey[700];
      } else {
        variables['--color-primary'] = BRAND_COLORS.orange[500];
        variables['--color-secondary'] = BRAND_COLORS.grey[900];
        variables['--color-background'] = '#FFFFFF';
        variables['--color-foreground'] = BRAND_COLORS.grey[900];
        variables['--color-border'] = BRAND_COLORS.grey[200];
      }
      
      return variables;
    },
  }), [context]);

  // Utility functions
  const utils = useMemo(() => ({
    /**
     * Check if current theme is dark
     */
    isDark: context.resolvedTheme === 'dark',

    /**
     * Check if current theme is light
     */
    isLight: context.resolvedTheme === 'light',

    /**
     * Check if system theme is being used
     */
    isSystemTheme: context.theme === 'system',

    /**
     * Get opposite theme
     */
    getOppositeTheme: (): ResolvedTheme => {
      return context.resolvedTheme === 'light' ? 'dark' : 'light';
    },

    /**
     * Apply theme-aware styles conditionally
     */
    themeStyles: (lightStyles: string, darkStyles: string): string => {
      return context.resolvedTheme === 'dark' ? darkStyles : lightStyles;
    },

    /**
     * Get brand color with theme awareness
     */
    getBrandColor: (color: keyof typeof BRAND_COLORS, shade: keyof typeof BRAND_COLORS.orange = '500'): string => {
      return BRAND_COLORS[color][shade];
    },

    /**
     * Create theme-aware class names
     */
    themeClass: (...classes: (string | undefined | null | false)[]): string => {
      return classes.filter(Boolean).join(' ');
    },
  }), [context]);

  return {
    // Theme context values
    ...context,
    
    // Utility objects
    colors: colorUtils,
    accessibility: accessibilityUtils,
    components: componentHelpers,
    utils,
    
    // Brand colors for easy access
    brandColors: BRAND_COLORS,
  };
}

// Convenience hooks for specific use cases
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