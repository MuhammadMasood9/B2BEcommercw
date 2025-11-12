/**
 * Tests for useTheme hook and theme utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BRAND_COLORS } from '../useTheme';
import { ColorManipulator, ThemeClassGenerator, AccessibilityEnhancer } from '../../utils/themeUtils';
import { ThemeComponentHelper } from '../../utils/themeComponentHelpers';

// Mock window for browser APIs
const mockMatchMedia = vi.fn();
Object.defineProperty(global, 'window', {
  writable: true,
  value: {
    matchMedia: mockMatchMedia,
  },
});

describe('Theme Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  describe('ColorManipulator', () => {
    it('should convert hex to RGB correctly', () => {
      const rgb = ColorManipulator['hexToRgb']('#F2A30F');
      expect(rgb).toEqual({ r: 242, g: 163, b: 15 });
    });

    it('should convert RGB to hex correctly', () => {
      const hex = ColorManipulator['rgbToHex'](242, 163, 15);
      expect(hex).toBe('#f2a30f');
    });

    it('should lighten colors correctly', () => {
      const lightened = ColorManipulator['lighten']('#F2A30F', 20);
      expect(lightened).toBeDefined();
      expect(lightened).not.toBe('#F2A30F');
    });

    it('should darken colors correctly', () => {
      const darkened = ColorManipulator['darken']('#F2A30F', 20);
      expect(darkened).toBeDefined();
      expect(darkened).not.toBe('#F2A30F');
    });

    it('should calculate contrast ratios correctly', () => {
      const ratio = ColorManipulator['getContrastRatio']('#000000', '#FFFFFF');
      expect(ratio).toBe(21);
    });

    it('should generate color palettes', () => {
      const palette = ColorManipulator.generatePalette('#F2A30F', 9);
      expect(palette).toHaveLength(9);
      expect(palette[0]).toBeDefined();
      expect(palette[8]).toBeDefined();
    });

    it('should find accessible colors', () => {
      const accessibleColor = ColorManipulator.findAccessibleColor('#FFFF00', '#FFFFFF', 4.5);
      expect(accessibleColor).toBeDefined();
      expect(accessibleColor).not.toBe('#FFFF00'); // Should be adjusted
    });

    it('should calculate Delta E color difference', () => {
      const deltaE = ColorManipulator.deltaE(
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 }
      );
      expect(deltaE).toBeGreaterThan(0);
    });
  });

  describe('ThemeClassGenerator', () => {
    it('should generate responsive classes', () => {
      const classes = ThemeClassGenerator.responsive(
        'base-class',
        'light-class',
        'dark-class',
        'high-contrast-class'
      );
      
      expect(classes).toContain('base-class');
      expect(classes).toContain('light:light-class');
      expect(classes).toContain('dark:dark-class');
      expect(classes).toContain('high-contrast:high-contrast-class');
    });

    it('should generate button classes', () => {
      const primaryButton = ThemeClassGenerator.button('primary', 'md');
      const secondaryButton = ThemeClassGenerator.button('secondary', 'lg');
      const outlineButton = ThemeClassGenerator.button('outline', 'sm');
      
      expect(primaryButton).toContain('font-medium');
      expect(primaryButton).toContain('transition-all');
      expect(secondaryButton).toContain('px-6 py-3 text-lg');
      expect(outlineButton).toContain('px-3 py-1.5 text-sm');
    });

    it('should generate input classes', () => {
      const inputClasses = ThemeClassGenerator.input();
      
      expect(inputClasses).toContain('w-full');
      expect(inputClasses).toContain('px-3 py-2');
      expect(inputClasses).toContain('border');
      expect(inputClasses).toContain('rounded-md');
    });

    it('should generate card classes', () => {
      const cardClasses = ThemeClassGenerator.card();
      
      expect(cardClasses).toContain('rounded-lg');
      expect(cardClasses).toContain('border');
      expect(cardClasses).toContain('transition-colors');
    });
  });

  describe('AccessibilityEnhancer', () => {
    it('should generate focus ring styles', () => {
      const focusRing = AccessibilityEnhancer.focusRing();
      
      expect(focusRing).toContain('focus:outline-none');
      expect(focusRing).toContain('focus:ring-2');
      expect(focusRing).toContain('focus:ring-brand-orange-500');
    });

    it('should generate skip link styles', () => {
      const skipLink = AccessibilityEnhancer.skipLink();
      
      expect(skipLink).toContain('sr-only');
      expect(skipLink).toContain('focus:not-sr-only');
      expect(skipLink).toContain('focus:absolute');
    });

    it('should generate screen reader only styles', () => {
      const srOnly = AccessibilityEnhancer.srOnly();
      
      expect(srOnly).toContain('absolute');
      expect(srOnly).toContain('w-px h-px');
      expect(srOnly).toContain('overflow-hidden');
    });

    it('should detect high contrast preference', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      const isHighContrast = AccessibilityEnhancer.detectHighContrast();
      expect(typeof isHighContrast).toBe('boolean');
    });

    it('should detect reduced motion preference', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      const isReducedMotion = AccessibilityEnhancer.detectReducedMotion();
      expect(typeof isReducedMotion).toBe('boolean');
    });
  });
});

describe('Theme Component Helpers', () => {
  describe('ButtonHelper', () => {
    it('should provide variant styles for light theme', () => {
      const primaryStyles = ThemeComponentHelper.button.getVariantStyles('primary', 'light', false);
      const secondaryStyles = ThemeComponentHelper.button.getVariantStyles('secondary', 'light', false);
      const outlineStyles = ThemeComponentHelper.button.getVariantStyles('outline', 'light', false);
      
      expect(primaryStyles.backgroundColor).toBeDefined();
      expect(primaryStyles.color).toBeDefined();
      expect(secondaryStyles.backgroundColor).toBeDefined();
      expect(outlineStyles.backgroundColor).toBe('transparent');
    });

    it('should provide variant styles for dark theme', () => {
      const primaryStyles = ThemeComponentHelper.button.getVariantStyles('primary', 'dark', false);
      
      expect(primaryStyles.backgroundColor).toBeDefined();
      expect(primaryStyles.color).toBeDefined();
      expect(primaryStyles['--hover-bg']).toBeDefined();
    });

    it('should provide high contrast styles', () => {
      const primaryStyles = ThemeComponentHelper.button.getVariantStyles('primary', 'light', true);
      
      expect(primaryStyles.backgroundColor).toBe('#A85C00');
      expect(primaryStyles['--focus-ring-width']).toBe('3px');
    });

    it('should provide size styles', () => {
      const smallSize = ThemeComponentHelper.button.getSizeStyles('sm');
      const largeSize = ThemeComponentHelper.button.getSizeStyles('lg');
      
      expect(smallSize.padding).toBe('0.375rem 0.75rem');
      expect(largeSize.padding).toBe('0.625rem 1.25rem');
    });
  });

  describe('InputHelper', () => {
    it('should provide variant styles for different themes', () => {
      const lightStyles = ThemeComponentHelper.input.getVariantStyles('default', 'light', false);
      const darkStyles = ThemeComponentHelper.input.getVariantStyles('default', 'dark', false);
      const highContrastStyles = ThemeComponentHelper.input.getVariantStyles('default', 'light', true);
      
      expect(lightStyles.backgroundColor).toBe('#FFFFFF');
      expect(darkStyles.backgroundColor).toBeDefined();
      expect(highContrastStyles.borderWidth).toBe('2px');
    });
  });

  describe('CardHelper', () => {
    it('should provide variant styles for different themes', () => {
      const defaultCard = ThemeComponentHelper.card.getVariantStyles('default', 'light', false);
      const elevatedCard = ThemeComponentHelper.card.getVariantStyles('elevated', 'dark', false);
      
      expect(defaultCard.backgroundColor).toBe('#FFFFFF');
      expect(defaultCard.boxShadow).toBeDefined();
      expect(elevatedCard.boxShadow).toBeDefined();
    });
  });

  describe('AlertHelper', () => {
    it('should provide variant styles for different alert types', () => {
      const successAlert = ThemeComponentHelper.alert.getVariantStyles('success', 'light', false);
      const errorAlert = ThemeComponentHelper.alert.getVariantStyles('error', 'dark', false);
      
      expect(successAlert.backgroundColor).toBeDefined();
      expect(successAlert['--icon-color']).toBeDefined();
      expect(errorAlert.backgroundColor).toBeDefined();
    });
  });

  describe('NavigationHelper', () => {
    it('should provide navigation styles for different themes', () => {
      const lightNav = ThemeComponentHelper.navigation.getStyles('light', false);
      const darkNav = ThemeComponentHelper.navigation.getStyles('dark', false);
      const highContrastNav = ThemeComponentHelper.navigation.getStyles('light', true);
      
      expect(lightNav.backgroundColor).toBe('#FFFFFF');
      expect(darkNav.backgroundColor).toBeDefined();
      expect(highContrastNav['--focus-ring-width']).toBe('3px');
    });
  });

  describe('TypographyHelper', () => {
    it('should provide text styles for different themes', () => {
      const lightText = ThemeComponentHelper.typography.getTextStyles('light', false);
      const darkText = ThemeComponentHelper.typography.getTextStyles('dark', false);
      
      expect(lightText.primary.color).toBeDefined();
      expect(lightText.secondary.color).toBeDefined();
      expect(darkText.primary.color).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    it('should generate complete component styles', () => {
      const buttonStyles = ThemeComponentHelper.generateComponentStyles(
        'button',
        'primary',
        'light',
        false,
        'md'
      );
      
      expect(buttonStyles.backgroundColor).toBeDefined();
      expect(buttonStyles.padding).toBeDefined();
    });

    it('should convert styles to CSS string', () => {
      const styles = { backgroundColor: 'red', color: 'white' };
      const cssString = ThemeComponentHelper.stylesToCSS(styles);
      
      expect(cssString).toContain('backgroundColor: red;');
      expect(cssString).toContain('color: white;');
    });

    it('should convert styles to custom properties', () => {
      const styles = { backgroundColor: 'red', fontSize: '16px' };
      const customProps = ThemeComponentHelper.stylesToCustomProperties(styles, 'btn-');
      
      expect(customProps['--btn-background-color']).toBe('red');
      expect(customProps['--btn-font-size']).toBe('16px');
    });
  });
});

describe('Brand Colors', () => {
  it('should have correct brand color values', () => {
    expect(BRAND_COLORS.orange[500]).toBe('#F2A30F');
    expect(BRAND_COLORS.grey[900]).toBe('#212121');
    expect(BRAND_COLORS.grey[200]).toBe('#EEEEEE');
  });

  it('should have complete color scales', () => {
    expect(Object.keys(BRAND_COLORS.orange)).toHaveLength(10);
    expect(Object.keys(BRAND_COLORS.grey)).toHaveLength(10);
    
    // Check that all shades exist
    const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
    expectedShades.forEach(shade => {
      expect(BRAND_COLORS.orange[shade as keyof typeof BRAND_COLORS.orange]).toBeDefined();
      expect(BRAND_COLORS.grey[shade as keyof typeof BRAND_COLORS.grey]).toBeDefined();
    });
  });
});

describe('Error Handling', () => {
  it('should handle invalid hex colors gracefully', () => {
    const invalidRgb = ColorManipulator['hexToRgb']('invalid');
    expect(invalidRgb).toBeNull();
  });

  it('should handle invalid contrast calculations', () => {
    const ratio = ColorManipulator['getContrastRatio']('invalid', '#FFFFFF');
    expect(ratio).toBe(0);
  });
});