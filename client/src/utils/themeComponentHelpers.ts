/**
 * Theme-aware component helpers for consistent styling across the application
 */

import type { ResolvedTheme } from '../contexts/ThemeContext';
import { BRAND_COLORS } from '../hooks/useTheme';

// Component variant types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InputVariant = 'default' | 'filled' | 'outline';
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
export type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

// Theme-aware style configurations
export interface ThemeStyleConfig {
  light: Record<string, string>;
  dark: Record<string, string>;
  highContrast: Record<string, string>;
}

/**
 * Button component helper
 */
export class ButtonHelper {
  static getVariantStyles(
    variant: ButtonVariant,
    theme: ResolvedTheme,
    isHighContrast: boolean
  ): Record<string, string> {
    if (isHighContrast) {
      return this.getHighContrastStyles(variant);
    }

    const styles = theme === 'dark' ? this.getDarkStyles(variant) : this.getLightStyles(variant);
    return styles;
  }

  private static getLightStyles(variant: ButtonVariant): Record<string, string> {
    const styles = {
      primary: {
        backgroundColor: BRAND_COLORS.orange[500],
        color: '#FFFFFF',
        borderColor: BRAND_COLORS.orange[500],
        '--hover-bg': BRAND_COLORS.orange[600],
        '--active-bg': BRAND_COLORS.orange[700],
        '--focus-ring': BRAND_COLORS.orange[500],
      },
      secondary: {
        backgroundColor: BRAND_COLORS.grey[900],
        color: '#FFFFFF',
        borderColor: BRAND_COLORS.grey[900],
        '--hover-bg': BRAND_COLORS.grey[800],
        '--active-bg': BRAND_COLORS.grey[700],
        '--focus-ring': BRAND_COLORS.grey[500],
      },
      outline: {
        backgroundColor: 'transparent',
        color: BRAND_COLORS.orange[500],
        borderColor: BRAND_COLORS.orange[500],
        '--hover-bg': BRAND_COLORS.orange[500],
        '--hover-color': '#FFFFFF',
        '--focus-ring': BRAND_COLORS.orange[500],
      },
      ghost: {
        backgroundColor: 'transparent',
        color: BRAND_COLORS.grey[900],
        borderColor: 'transparent',
        '--hover-bg': BRAND_COLORS.grey[100],
        '--active-bg': BRAND_COLORS.grey[200],
        '--focus-ring': BRAND_COLORS.orange[500],
      },
      link: {
        backgroundColor: 'transparent',
        color: BRAND_COLORS.orange[500],
        borderColor: 'transparent',
        '--hover-color': BRAND_COLORS.orange[600],
        '--focus-ring': BRAND_COLORS.orange[500],
        textDecoration: 'underline',
      },
    };

    return styles[variant] || styles.primary;
  }

  private static getDarkStyles(variant: ButtonVariant): Record<string, string> {
    const styles = {
      primary: {
        backgroundColor: BRAND_COLORS.orange[500],
        color: '#FFFFFF',
        borderColor: BRAND_COLORS.orange[500],
        '--hover-bg': BRAND_COLORS.orange[400],
        '--active-bg': BRAND_COLORS.orange[600],
        '--focus-ring': BRAND_COLORS.orange[400],
      },
      secondary: {
        backgroundColor: BRAND_COLORS.grey[700],
        color: '#FFFFFF',
        borderColor: BRAND_COLORS.grey[700],
        '--hover-bg': BRAND_COLORS.grey[600],
        '--active-bg': BRAND_COLORS.grey[800],
        '--focus-ring': BRAND_COLORS.grey[400],
      },
      outline: {
        backgroundColor: 'transparent',
        color: BRAND_COLORS.orange[400],
        borderColor: BRAND_COLORS.orange[400],
        '--hover-bg': BRAND_COLORS.orange[400],
        '--hover-color': BRAND_COLORS.grey[900],
        '--focus-ring': BRAND_COLORS.orange[400],
      },
      ghost: {
        backgroundColor: 'transparent',
        color: BRAND_COLORS.grey[100],
        borderColor: 'transparent',
        '--hover-bg': BRAND_COLORS.grey[800],
        '--active-bg': BRAND_COLORS.grey[700],
        '--focus-ring': BRAND_COLORS.orange[400],
      },
      link: {
        backgroundColor: 'transparent',
        color: BRAND_COLORS.orange[400],
        borderColor: 'transparent',
        '--hover-color': BRAND_COLORS.orange[300],
        '--focus-ring': BRAND_COLORS.orange[400],
        textDecoration: 'underline',
      },
    };

    return styles[variant] || styles.primary;
  }

  private static getHighContrastStyles(variant: ButtonVariant): Record<string, string> {
    const styles = {
      primary: {
        backgroundColor: '#A85C00',
        color: '#FFFFFF',
        borderColor: '#A85C00',
        '--hover-bg': '#8B4A00',
        '--active-bg': '#6D3700',
        '--focus-ring': '#A85C00',
        '--focus-ring-width': '3px',
      },
      secondary: {
        backgroundColor: '#000000',
        color: '#FFFFFF',
        borderColor: '#000000',
        '--hover-bg': '#333333',
        '--active-bg': '#1A1A1A',
        '--focus-ring': '#000000',
        '--focus-ring-width': '3px',
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#A85C00',
        borderColor: '#A85C00',
        borderWidth: '2px',
        '--hover-bg': '#A85C00',
        '--hover-color': '#FFFFFF',
        '--focus-ring': '#A85C00',
        '--focus-ring-width': '3px',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#000000',
        borderColor: 'transparent',
        '--hover-bg': '#F0F0F0',
        '--active-bg': '#E0E0E0',
        '--focus-ring': '#A85C00',
        '--focus-ring-width': '3px',
      },
      link: {
        backgroundColor: 'transparent',
        color: '#A85C00',
        borderColor: 'transparent',
        '--hover-color': '#8B4A00',
        '--focus-ring': '#A85C00',
        '--focus-ring-width': '3px',
        textDecoration: 'underline',
        textDecorationThickness: '2px',
      },
    };

    return styles[variant] || styles.primary;
  }

  static getSizeStyles(size: ButtonSize): Record<string, string> {
    const sizes = {
      xs: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        lineHeight: '1rem',
      },
      sm: {
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
      },
      md: {
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
      },
      lg: {
        padding: '0.625rem 1.25rem',
        fontSize: '1rem',
        lineHeight: '1.5rem',
      },
      xl: {
        padding: '0.75rem 1.5rem',
        fontSize: '1.125rem',
        lineHeight: '1.75rem',
      },
    };

    return sizes[size] || sizes.md;
  }
}

/**
 * Input component helper
 */
export class InputHelper {
  static getVariantStyles(
    variant: InputVariant,
    theme: ResolvedTheme,
    isHighContrast: boolean
  ): Record<string, string> {
    if (isHighContrast) {
      return this.getHighContrastStyles(variant);
    }

    return theme === 'dark' ? this.getDarkStyles(variant) : this.getLightStyles(variant);
  }

  private static getLightStyles(variant: InputVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: '#FFFFFF',
        color: BRAND_COLORS.grey[900],
        borderColor: BRAND_COLORS.grey[300],
        '--placeholder-color': BRAND_COLORS.grey[500],
        '--focus-border': BRAND_COLORS.orange[500],
        '--focus-ring': BRAND_COLORS.orange[500],
      },
      filled: {
        backgroundColor: BRAND_COLORS.grey[50],
        color: BRAND_COLORS.grey[900],
        borderColor: 'transparent',
        '--placeholder-color': BRAND_COLORS.grey[500],
        '--focus-bg': '#FFFFFF',
        '--focus-border': BRAND_COLORS.orange[500],
        '--focus-ring': BRAND_COLORS.orange[500],
      },
      outline: {
        backgroundColor: 'transparent',
        color: BRAND_COLORS.grey[900],
        borderColor: BRAND_COLORS.grey[400],
        borderWidth: '2px',
        '--placeholder-color': BRAND_COLORS.grey[500],
        '--focus-border': BRAND_COLORS.orange[500],
        '--focus-ring': BRAND_COLORS.orange[500],
      },
    };

    return styles[variant] || styles.default;
  }

  private static getDarkStyles(variant: InputVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: BRAND_COLORS.grey[800],
        color: BRAND_COLORS.grey[100],
        borderColor: BRAND_COLORS.grey[600],
        '--placeholder-color': BRAND_COLORS.grey[400],
        '--focus-border': BRAND_COLORS.orange[400],
        '--focus-ring': BRAND_COLORS.orange[400],
      },
      filled: {
        backgroundColor: BRAND_COLORS.grey[700],
        color: BRAND_COLORS.grey[100],
        borderColor: 'transparent',
        '--placeholder-color': BRAND_COLORS.grey[400],
        '--focus-bg': BRAND_COLORS.grey[800],
        '--focus-border': BRAND_COLORS.orange[400],
        '--focus-ring': BRAND_COLORS.orange[400],
      },
      outline: {
        backgroundColor: 'transparent',
        color: BRAND_COLORS.grey[100],
        borderColor: BRAND_COLORS.grey[500],
        borderWidth: '2px',
        '--placeholder-color': BRAND_COLORS.grey[400],
        '--focus-border': BRAND_COLORS.orange[400],
        '--focus-ring': BRAND_COLORS.orange[400],
      },
    };

    return styles[variant] || styles.default;
  }

  private static getHighContrastStyles(variant: InputVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '2px',
        '--placeholder-color': '#666666',
        '--focus-border': '#A85C00',
        '--focus-ring': '#A85C00',
        '--focus-ring-width': '3px',
      },
      filled: {
        backgroundColor: '#F8F8F8',
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '2px',
        '--placeholder-color': '#666666',
        '--focus-bg': '#FFFFFF',
        '--focus-border': '#A85C00',
        '--focus-ring': '#A85C00',
        '--focus-ring-width': '3px',
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '3px',
        '--placeholder-color': '#666666',
        '--focus-border': '#A85C00',
        '--focus-ring': '#A85C00',
        '--focus-ring-width': '3px',
      },
    };

    return styles[variant] || styles.default;
  }
}

/**
 * Card component helper
 */
export class CardHelper {
  static getVariantStyles(
    variant: CardVariant,
    theme: ResolvedTheme,
    isHighContrast: boolean
  ): Record<string, string> {
    if (isHighContrast) {
      return this.getHighContrastStyles(variant);
    }

    return theme === 'dark' ? this.getDarkStyles(variant) : this.getLightStyles(variant);
  }

  private static getLightStyles(variant: CardVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: '#FFFFFF',
        color: BRAND_COLORS.grey[900],
        borderColor: BRAND_COLORS.grey[200],
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      elevated: {
        backgroundColor: '#FFFFFF',
        color: BRAND_COLORS.grey[900],
        borderColor: 'transparent',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      outlined: {
        backgroundColor: '#FFFFFF',
        color: BRAND_COLORS.grey[900],
        borderColor: BRAND_COLORS.grey[300],
        borderWidth: '2px',
        boxShadow: 'none',
      },
      filled: {
        backgroundColor: BRAND_COLORS.grey[50],
        color: BRAND_COLORS.grey[900],
        borderColor: 'transparent',
        boxShadow: 'none',
      },
    };

    return styles[variant] || styles.default;
  }

  private static getDarkStyles(variant: CardVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: BRAND_COLORS.grey[800],
        color: BRAND_COLORS.grey[100],
        borderColor: BRAND_COLORS.grey[700],
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      },
      elevated: {
        backgroundColor: BRAND_COLORS.grey[800],
        color: BRAND_COLORS.grey[100],
        borderColor: 'transparent',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
      outlined: {
        backgroundColor: BRAND_COLORS.grey[800],
        color: BRAND_COLORS.grey[100],
        borderColor: BRAND_COLORS.grey[600],
        borderWidth: '2px',
        boxShadow: 'none',
      },
      filled: {
        backgroundColor: BRAND_COLORS.grey[700],
        color: BRAND_COLORS.grey[100],
        borderColor: 'transparent',
        boxShadow: 'none',
      },
    };

    return styles[variant] || styles.default;
  }

  private static getHighContrastStyles(variant: CardVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '2px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
      elevated: {
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '3px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
      },
      outlined: {
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '3px',
        boxShadow: 'none',
      },
      filled: {
        backgroundColor: '#F8F8F8',
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '2px',
        boxShadow: 'none',
      },
    };

    return styles[variant] || styles.default;
  }
}

/**
 * Alert component helper
 */
export class AlertHelper {
  static getVariantStyles(
    variant: AlertVariant,
    theme: ResolvedTheme,
    isHighContrast: boolean
  ): Record<string, string> {
    if (isHighContrast) {
      return this.getHighContrastStyles(variant);
    }

    return theme === 'dark' ? this.getDarkStyles(variant) : this.getLightStyles(variant);
  }

  private static getLightStyles(variant: AlertVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: BRAND_COLORS.grey[50],
        color: BRAND_COLORS.grey[900],
        borderColor: BRAND_COLORS.grey[200],
        '--icon-color': BRAND_COLORS.grey[600],
      },
      success: {
        backgroundColor: '#F0FDF4',
        color: '#166534',
        borderColor: '#BBF7D0',
        '--icon-color': '#16A34A',
      },
      warning: {
        backgroundColor: '#FFFBEB',
        color: '#92400E',
        borderColor: '#FED7AA',
        '--icon-color': BRAND_COLORS.orange[500],
      },
      error: {
        backgroundColor: '#FEF2F2',
        color: '#991B1B',
        borderColor: '#FECACA',
        '--icon-color': '#DC2626',
      },
      info: {
        backgroundColor: '#EFF6FF',
        color: '#1E40AF',
        borderColor: '#DBEAFE',
        '--icon-color': '#3B82F6',
      },
    };

    return styles[variant] || styles.default;
  }

  private static getDarkStyles(variant: AlertVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: BRAND_COLORS.grey[800],
        color: BRAND_COLORS.grey[100],
        borderColor: BRAND_COLORS.grey[700],
        '--icon-color': BRAND_COLORS.grey[400],
      },
      success: {
        backgroundColor: '#064E3B',
        color: '#A7F3D0',
        borderColor: '#065F46',
        '--icon-color': '#34D399',
      },
      warning: {
        backgroundColor: '#78350F',
        color: '#FED7AA',
        borderColor: '#92400E',
        '--icon-color': BRAND_COLORS.orange[400],
      },
      error: {
        backgroundColor: '#7F1D1D',
        color: '#FECACA',
        borderColor: '#991B1B',
        '--icon-color': '#F87171',
      },
      info: {
        backgroundColor: '#1E3A8A',
        color: '#DBEAFE',
        borderColor: '#1E40AF',
        '--icon-color': '#60A5FA',
      },
    };

    return styles[variant] || styles.default;
  }

  private static getHighContrastStyles(variant: AlertVariant): Record<string, string> {
    const styles = {
      default: {
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '2px',
        '--icon-color': '#000000',
      },
      success: {
        backgroundColor: '#FFFFFF',
        color: '#006600',
        borderColor: '#006600',
        borderWidth: '2px',
        '--icon-color': '#006600',
      },
      warning: {
        backgroundColor: '#FFFFFF',
        color: '#A85C00',
        borderColor: '#A85C00',
        borderWidth: '2px',
        '--icon-color': '#A85C00',
      },
      error: {
        backgroundColor: '#FFFFFF',
        color: '#CC0000',
        borderColor: '#CC0000',
        borderWidth: '2px',
        '--icon-color': '#CC0000',
      },
      info: {
        backgroundColor: '#FFFFFF',
        color: '#0066CC',
        borderColor: '#0066CC',
        borderWidth: '2px',
        '--icon-color': '#0066CC',
      },
    };

    return styles[variant] || styles.default;
  }
}

/**
 * Navigation component helper
 */
export class NavigationHelper {
  static getStyles(theme: ResolvedTheme, isHighContrast: boolean): Record<string, string> {
    if (isHighContrast) {
      return {
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderColor: '#000000',
        '--active-bg': '#A85C00',
        '--active-color': '#FFFFFF',
        '--hover-bg': '#F0F0F0',
        '--focus-ring': '#A85C00',
        '--focus-ring-width': '3px',
      };
    }

    if (theme === 'dark') {
      return {
        backgroundColor: BRAND_COLORS.grey[900],
        color: BRAND_COLORS.grey[100],
        borderColor: BRAND_COLORS.grey[800],
        '--active-bg': BRAND_COLORS.orange[500],
        '--active-color': '#FFFFFF',
        '--hover-bg': BRAND_COLORS.grey[800],
        '--focus-ring': BRAND_COLORS.orange[400],
      };
    }

    return {
      backgroundColor: '#FFFFFF',
      color: BRAND_COLORS.grey[900],
      borderColor: BRAND_COLORS.grey[200],
      '--active-bg': BRAND_COLORS.orange[500],
      '--active-color': '#FFFFFF',
      '--hover-bg': BRAND_COLORS.grey[50],
      '--focus-ring': BRAND_COLORS.orange[500],
    };
  }
}

/**
 * Typography helper
 */
export class TypographyHelper {
  static getTextStyles(theme: ResolvedTheme, isHighContrast: boolean): Record<string, Record<string, string>> {
    if (isHighContrast) {
      return {
        primary: { color: '#000000' },
        secondary: { color: '#333333' },
        muted: { color: '#666666' },
        accent: { color: '#A85C00' },
        link: { color: '#A85C00', textDecorationThickness: '2px' },
      };
    }

    if (theme === 'dark') {
      return {
        primary: { color: BRAND_COLORS.grey[100] },
        secondary: { color: BRAND_COLORS.grey[300] },
        muted: { color: BRAND_COLORS.grey[400] },
        accent: { color: BRAND_COLORS.orange[400] },
        link: { color: BRAND_COLORS.orange[400] },
      };
    }

    return {
      primary: { color: BRAND_COLORS.grey[900] },
      secondary: { color: BRAND_COLORS.grey[700] },
      muted: { color: BRAND_COLORS.grey[500] },
      accent: { color: BRAND_COLORS.orange[500] },
      link: { color: BRAND_COLORS.orange[500] },
    };
  }
}

/**
 * Main theme component helper class
 */
export class ThemeComponentHelper {
  static button = ButtonHelper;
  static input = InputHelper;
  static card = CardHelper;
  static alert = AlertHelper;
  static navigation = NavigationHelper;
  static typography = TypographyHelper;

  /**
   * Generate complete component styles
   */
  static generateComponentStyles(
    component: 'button' | 'input' | 'card' | 'alert' | 'navigation',
    variant: string,
    theme: ResolvedTheme,
    isHighContrast: boolean,
    size?: string
  ): Record<string, string> {
    let styles: Record<string, string> = {};

    switch (component) {
      case 'button':
        styles = ButtonHelper.getVariantStyles(variant as ButtonVariant, theme, isHighContrast);
        if (size) {
          Object.assign(styles, ButtonHelper.getSizeStyles(size as ButtonSize));
        }
        break;
      case 'input':
        styles = InputHelper.getVariantStyles(variant as InputVariant, theme, isHighContrast);
        break;
      case 'card':
        styles = CardHelper.getVariantStyles(variant as CardVariant, theme, isHighContrast);
        break;
      case 'alert':
        styles = AlertHelper.getVariantStyles(variant as AlertVariant, theme, isHighContrast);
        break;
      case 'navigation':
        styles = NavigationHelper.getStyles(theme, isHighContrast);
        break;
    }

    return styles;
  }

  /**
   * Convert styles object to CSS string
   */
  static stylesToCSS(styles: Record<string, string>): string {
    return Object.entries(styles)
      .map(([property, value]) => `${property}: ${value};`)
      .join(' ');
  }

  /**
   * Convert styles object to CSS custom properties
   */
  static stylesToCustomProperties(styles: Record<string, string>, prefix: string = ''): Record<string, string> {
    const customProperties: Record<string, string> = {};
    
    Object.entries(styles).forEach(([property, value]) => {
      const customProperty = `--${prefix}${property.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      customProperties[customProperty] = value;
    });

    return customProperties;
  }
}

export default ThemeComponentHelper;