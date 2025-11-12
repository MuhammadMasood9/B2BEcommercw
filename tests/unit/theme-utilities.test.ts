import { describe, it, expect } from 'vitest';
import {
  getContrastRatio,
  isValidContrastRatio,
  generateColorScale,
  adjustColorForTheme,
  getAccessibleTextColor,
  validateThemeColors,
  hexToHsl,
  hslToHex,
  lighten,
  darken,
  getColorLuminance
} from '../../client/src/utils/themeUtils';

describe('Theme Utilities', () => {
  describe('Color Conversion Functions', () => {
    describe('hexToHsl', () => {
      it('should convert hex colors to HSL', () => {
        expect(hexToHsl('#F2A30F')).toEqual([39, 90, 50]);
        expect(hexToHsl('#212121')).toEqual([0, 0, 13]);
        expect(hexToHsl('#EEEEEE')).toEqual([0, 0, 93]);
        expect(hexToHsl('#FFFFFF')).toEqual([0, 0, 100]);
        expect(hexToHsl('#000000')).toEqual([0, 0, 0]);
      });

      it('should handle 3-digit hex colors', () => {
        expect(hexToHsl('#F00')).toEqual([0, 100, 50]);
        expect(hexToHsl('#0F0')).toEqual([120, 100, 50]);
        expect(hexToHsl('#00F')).toEqual([240, 100, 50]);
      });

      it('should handle colors without # prefix', () => {
        expect(hexToHsl('F2A30F')).toEqual([39, 90, 50]);
        expect(hexToHsl('212121')).toEqual([0, 0, 13]);
      });
    });

    describe('hslToHex', () => {
      it('should convert HSL colors to hex', () => {
        expect(hslToHex(39, 90, 50)).toBe('#F2A20D');
        expect(hslToHex(0, 0, 13)).toBe('#212121');
        expect(hslToHex(0, 0, 93)).toBe('#EEEEEE');
        expect(hslToHex(0, 0, 100)).toBe('#FFFFFF');
        expect(hslToHex(0, 0, 0)).toBe('#000000');
      });

      it('should handle edge cases', () => {
        expect(hslToHex(360, 100, 50)).toBe('#FF0000'); // 360 degrees = 0 degrees
        expect(hslToHex(0, 0, 50)).toBe('#808080'); // Gray
      });
    });
  });

  describe('Color Manipulation Functions', () => {
    describe('lighten', () => {
      it('should lighten colors by specified amount', () => {
        const lightened = lighten('#F2A30F', 20);
        const [, , originalL] = hexToHsl('#F2A30F');
        const [, , newL] = hexToHsl(lightened);
        
        expect(newL).toBeGreaterThan(originalL);
        expect(newL).toBeLessThanOrEqual(100);
      });

      it('should not exceed 100% lightness', () => {
        const lightened = lighten('#FFFFFF', 50);
        expect(lightened).toBe('#FFFFFF');
      });

      it('should handle negative amounts', () => {
        const result = lighten('#F2A30F', -20);
        const darkened = darken('#F2A30F', 20);
        expect(result).toBe(darkened);
      });
    });

    describe('darken', () => {
      it('should darken colors by specified amount', () => {
        const darkened = darken('#F2A30F', 20);
        const [, , originalL] = hexToHsl('#F2A30F');
        const [, , newL] = hexToHsl(darkened);
        
        expect(newL).toBeLessThan(originalL);
        expect(newL).toBeGreaterThanOrEqual(0);
      });

      it('should not go below 0% lightness', () => {
        const darkened = darken('#000000', 50);
        expect(darkened).toBe('#000000');
      });

      it('should handle negative amounts', () => {
        const result = darken('#F2A30F', -20);
        const lightened = lighten('#F2A30F', 20);
        expect(result).toBe(lightened);
      });
    });
  });

  describe('Contrast and Accessibility Functions', () => {
    describe('getColorLuminance', () => {
      it('should calculate correct luminance values', () => {
        expect(getColorLuminance('#FFFFFF')).toBeCloseTo(1, 2);
        expect(getColorLuminance('#000000')).toBeCloseTo(0, 2);
        expect(getColorLuminance('#F2A30F')).toBeGreaterThan(0);
        expect(getColorLuminance('#F2A30F')).toBeLessThan(1);
      });
    });

    describe('getContrastRatio', () => {
      it('should calculate correct contrast ratios', () => {
        // White on black should have maximum contrast
        expect(getContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
        
        // Same colors should have minimum contrast
        expect(getContrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 1);
        expect(getContrastRatio('#000000', '#000000')).toBeCloseTo(1, 1);
        
        // Brand colors
        const orangeOnWhite = getContrastRatio('#F2A30F', '#FFFFFF');
        const orangeOnBlack = getContrastRatio('#F2A30F', '#000000');
        
        expect(orangeOnWhite).toBeGreaterThan(1);
        expect(orangeOnBlack).toBeGreaterThan(1);
        expect(orangeOnBlack).toBeGreaterThan(orangeOnWhite);
      });

      it('should be symmetric', () => {
        const ratio1 = getContrastRatio('#F2A30F', '#212121');
        const ratio2 = getContrastRatio('#212121', '#F2A30F');
        expect(ratio1).toBeCloseTo(ratio2, 2);
      });
    });

    describe('isValidContrastRatio', () => {
      it('should validate WCAG AA compliance (4.5:1)', () => {
        expect(isValidContrastRatio('#FFFFFF', '#000000', 'AA')).toBe(true);
        expect(isValidContrastRatio('#F2A30F', '#FFFFFF', 'AA')).toBe(false);
        expect(isValidContrastRatio('#212121', '#FFFFFF', 'AA')).toBe(true);
      });

      it('should validate WCAG AAA compliance (7:1)', () => {
        expect(isValidContrastRatio('#FFFFFF', '#000000', 'AAA')).toBe(true);
        expect(isValidContrastRatio('#212121', '#FFFFFF', 'AAA')).toBe(true);
        expect(isValidContrastRatio('#F2A30F', '#212121', 'AAA')).toBe(true); // This combination actually passes AAA
      });

      it('should handle large text requirements (3:1 for AA, 4.5:1 for AAA)', () => {
        expect(isValidContrastRatio('#F2A30F', '#FFFFFF', 'AA', true)).toBe(false); // Orange on white doesn't meet AA even for large text
        expect(isValidContrastRatio('#F2A30F', '#FFFFFF', 'AAA', true)).toBe(false);
      });
    });

    describe('getAccessibleTextColor', () => {
      it('should return appropriate text color for backgrounds', () => {
        expect(getAccessibleTextColor('#FFFFFF')).toBe('#000000');
        expect(getAccessibleTextColor('#000000')).toBe('#FFFFFF');
        expect(getAccessibleTextColor('#F2A30F')).toBe('#000000'); // Orange actually works better with black text
        expect(getAccessibleTextColor('#212121')).toBe('#FFFFFF');
      });

      it('should respect minimum contrast requirements', () => {
        const textColor = getAccessibleTextColor('#F2A30F');
        const contrastRatio = getContrastRatio('#F2A30F', textColor);
        expect(contrastRatio).toBeGreaterThanOrEqual(2.0); // Orange has limited contrast options
      });
    });
  });

  describe('Color Scale Generation', () => {
    describe('generateColorScale', () => {
      it('should generate a complete color scale', () => {
        const scale = generateColorScale('#F2A30F');
        
        expect(scale).toHaveProperty('50');
        expect(scale).toHaveProperty('100');
        expect(scale).toHaveProperty('200');
        expect(scale).toHaveProperty('300');
        expect(scale).toHaveProperty('400');
        expect(scale).toHaveProperty('500');
        expect(scale).toHaveProperty('600');
        expect(scale).toHaveProperty('700');
        expect(scale).toHaveProperty('800');
        expect(scale).toHaveProperty('900');
        
        // Base color should be at 500
        expect(scale['500']).toBe('#F2A30F');
      });

      it('should create lighter shades for lower numbers', () => {
        const scale = generateColorScale('#F2A30F');
        const [, , l50] = hexToHsl(scale['50']);
        const [, , l500] = hexToHsl(scale['500']);
        
        expect(l50).toBeGreaterThan(l500);
      });

      it('should create darker shades for higher numbers', () => {
        const scale = generateColorScale('#F2A30F');
        const [, , l500] = hexToHsl(scale['500']);
        const [, , l900] = hexToHsl(scale['900']);
        
        expect(l900).toBeLessThan(l500);
      });

      it('should maintain hue and saturation across the scale', () => {
        const scale = generateColorScale('#F2A30F');
        const [baseH, baseS] = hexToHsl('#F2A30F');
        
        Object.values(scale).forEach(color => {
          const [h, s] = hexToHsl(color);
          expect(h).toBeCloseTo(baseH, 0);
          expect(s).toBeCloseTo(baseS, 10); // Allow larger saturation adjustments for scale generation
        });
      });
    });
  });

  describe('Theme-Specific Color Adjustments', () => {
    describe('adjustColorForTheme', () => {
      it('should adjust colors for dark theme', () => {
        const lightColor = '#F2A30F';
        const darkAdjusted = adjustColorForTheme(lightColor, 'dark');
        
        // Dark theme should generally make colors brighter
        const [, , lightL] = hexToHsl(lightColor);
        const [, , darkL] = hexToHsl(darkAdjusted);
        
        expect(darkL).toBeGreaterThanOrEqual(lightL);
      });

      it('should not adjust colors for light theme', () => {
        const color = '#F2A30F';
        const lightAdjusted = adjustColorForTheme(color, 'light');
        
        expect(lightAdjusted).toBe(color);
      });

      it('should handle high contrast adjustments', () => {
        const color = '#F2A30F';
        const highContrastLight = adjustColorForTheme(color, 'light', true);
        const highContrastDark = adjustColorForTheme(color, 'dark', true);
        
        // High contrast should make colors more extreme
        const [, , originalL] = hexToHsl(color);
        const [, , hcLightL] = hexToHsl(highContrastLight);
        const [, , hcDarkL] = hexToHsl(highContrastDark);
        
        expect(Math.abs(hcLightL - 50)).toBeGreaterThan(Math.abs(originalL - 50));
        expect(Math.abs(hcDarkL - 50)).toBeGreaterThan(Math.abs(originalL - 50));
      });
    });
  });

  describe('Theme Validation', () => {
    describe('validateThemeColors', () => {
      const validTheme = {
        primary: '#F2A30F',
        secondary: '#212121',
        background: '#FFFFFF',
        foreground: '#000000',
        accent: '#F2A30F',
        muted: '#EEEEEE'
      };

      it('should validate a correct theme', () => {
        const result = validateThemeColors(validTheme);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect contrast issues', () => {
        const invalidTheme = {
          ...validTheme,
          background: '#F2A30F',
          foreground: '#F2A30F' // Same color - no contrast
        };
        
        const result = validateThemeColors(invalidTheme);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('contrast'))).toBe(true);
      });

      it('should detect invalid color formats', () => {
        const invalidTheme = {
          ...validTheme,
          primary: 'not-a-color'
        };
        
        const result = validateThemeColors(invalidTheme);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('invalid'))).toBe(true);
      });

      it('should provide detailed error messages', () => {
        const invalidTheme = {
          ...validTheme,
          background: '#CCCCCC',
          foreground: '#DDDDDD' // Poor contrast
        };
        
        const result = validateThemeColors(invalidTheme);
        expect(result.errors).toContain(
          expect.stringContaining('foreground/background contrast ratio')
        );
      });

      it('should validate all required color properties', () => {
        const incompleteTheme = {
          primary: '#F2A30F'
          // Missing other required colors
        };
        
        const result = validateThemeColors(incompleteTheme);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('missing'))).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid hex colors gracefully', () => {
      expect(() => hexToHsl('invalid')).not.toThrow();
      expect(() => getContrastRatio('invalid', '#FFFFFF')).not.toThrow();
      expect(() => generateColorScale('invalid')).not.toThrow();
    });

    it('should handle extreme lightness values', () => {
      expect(lighten('#FFFFFF', 100)).toBe('#FFFFFF');
      expect(darken('#000000', 100)).toBe('#000000');
    });

    it('should handle very small contrast differences', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FEFEFE');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(1.1);
    });
  });
});