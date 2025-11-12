/**
 * Accessibility utilities for contrast testing and validation
 */

export interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  level: 'fail' | 'aa' | 'aaa';
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): ColorRGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 */
export function getLuminance(color: ColorRGB): number {
  const { r, g, b } = color;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: ColorRGB, color2: ColorRGB): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Test contrast ratio and return WCAG compliance
 */
export function testContrast(foreground: string, background: string): ContrastResult {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) {
    return {
      ratio: 0,
      wcagAA: false,
      wcagAAA: false,
      level: 'fail'
    };
  }
  
  const ratio = getContrastRatio(fg, bg);
  const wcagAA = ratio >= 4.5;
  const wcagAAA = ratio >= 7;
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA,
    wcagAAA,
    level: wcagAAA ? 'aaa' : wcagAA ? 'aa' : 'fail'
  };
}

/**
 * Brand colors for testing
 */
export const BRAND_COLORS = {
  primary: '#FF9900',
  primaryDark: '#CC7700', // Darker orange for better contrast
  primaryAccessible: '#A85C00', // WCAG AA compliant orange (5.0:1 on white)
  darkGrey: '#1A1A1A',
  lightGrey: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000'
};

/**
 * Test all brand color combinations
 */
export function testBrandColorContrast(): Record<string, ContrastResult> {
  const combinations = [
    { name: 'primary-accessible-on-white', fg: BRAND_COLORS.primaryAccessible, bg: BRAND_COLORS.white },
    { name: 'white-on-primary-accessible', fg: BRAND_COLORS.white, bg: BRAND_COLORS.primaryAccessible },
    { name: 'darkgrey-on-white', fg: BRAND_COLORS.darkGrey, bg: BRAND_COLORS.white },
    { name: 'white-on-darkgrey', fg: BRAND_COLORS.white, bg: BRAND_COLORS.darkGrey },
    { name: 'primary-accessible-on-darkgrey', fg: BRAND_COLORS.primaryAccessible, bg: BRAND_COLORS.darkGrey },
    { name: 'darkgrey-on-lightgrey', fg: BRAND_COLORS.darkGrey, bg: BRAND_COLORS.lightGrey },
    { name: 'primary-accessible-on-lightgrey', fg: BRAND_COLORS.primaryAccessible, bg: BRAND_COLORS.lightGrey }
  ];
  
  const results: Record<string, ContrastResult> = {};
  
  combinations.forEach(({ name, fg, bg }) => {
    results[name] = testContrast(fg, bg);
  });
  
  return results;
}

/**
 * Get accessible color variant if contrast is insufficient
 */
export function getAccessibleColor(foreground: string, background: string, targetRatio: number = 4.5): string {
  const result = testContrast(foreground, background);
  
  if (result.ratio >= targetRatio) {
    return foreground;
  }
  
  // If primary orange doesn't meet contrast, return accessible variant
  if (foreground === BRAND_COLORS.primary) {
    const accessibleResult = testContrast(BRAND_COLORS.primaryAccessible, background);
    if (accessibleResult.ratio >= targetRatio) {
      return BRAND_COLORS.primaryAccessible;
    }
    return BRAND_COLORS.primaryDark;
  }
  
  return foreground;
}

/**
 * Get the best accessible orange color for the given background
 */
export function getAccessibleOrange(backgroundColor: string = '#FFFFFF'): string {
  // Always use accessible orange for text/links on light backgrounds
  if (backgroundColor === BRAND_COLORS.white || backgroundColor === BRAND_COLORS.lightGrey) {
    return BRAND_COLORS.primaryAccessible;
  }
  
  // Test accessible orange first
  const accessibleResult = testContrast(BRAND_COLORS.primaryAccessible, backgroundColor);
  if (accessibleResult.wcagAA) {
    return BRAND_COLORS.primaryAccessible;
  }
  
  // Test primary orange
  const primaryResult = testContrast(BRAND_COLORS.primary, backgroundColor);
  if (primaryResult.wcagAA) {
    return BRAND_COLORS.primary;
  }
  
  // Fallback to dark orange
  return BRAND_COLORS.primaryDark;
}