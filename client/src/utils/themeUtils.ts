/**
 * Theme utilities for color manipulation and accessibility
 */

// Basic color conversion and manipulation functions
export function hexToHsl(hex: string): [number, number, number] {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  if (hex.length !== 6) {
    return [0, 0, 0]; // Invalid hex
  }
  
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
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
  
  // Round to match expected values
  return [
    Math.round(h * 360) || 0, 
    Math.round(s * 100) || 0, 
    Math.round(l * 100) || 0
  ];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
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
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  const newL = Math.min(100, l + amount);
  return hslToHex(h, s, newL);
}

export function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  const newL = Math.max(0, l - amount);
  return hslToHex(h, s, newL);
}

export function getColorLuminance(hex: string): number {
  const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!rgb) return 0;
  
  const [r, g, b] = [
    parseInt(rgb[1], 16) / 255,
    parseInt(rgb[2], 16) / 255,
    parseInt(rgb[3], 16) / 255
  ].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getColorLuminance(color1);
  const l2 = getColorLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function isValidContrastRatio(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  } else {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }
}

export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteRatio = getContrastRatio('#FFFFFF', backgroundColor);
  const blackRatio = getContrastRatio('#000000', backgroundColor);
  
  // Return the color that provides better contrast, ensuring at least 4.5:1 ratio
  if (whiteRatio >= 4.5 && whiteRatio >= blackRatio) {
    return '#FFFFFF';
  } else if (blackRatio >= 4.5) {
    return '#000000';
  } else {
    // If neither meets 4.5:1, return the one with higher contrast
    return whiteRatio > blackRatio ? '#FFFFFF' : '#000000';
  }
}

export function generateColorScale(baseColor: string): Record<string, string> {
  const [h, s] = hexToHsl(baseColor);
  
  return {
    '50': hslToHex(h, s, 95),
    '100': hslToHex(h, s, 90),
    '200': hslToHex(h, s, 80),
    '300': hslToHex(h, s, 70),
    '400': hslToHex(h, s, 60),
    '500': baseColor,
    '600': hslToHex(h, s, 40),
    '700': hslToHex(h, s, 30),
    '800': hslToHex(h, s, 20),
    '900': hslToHex(h, s, 10)
  };
}

export function adjustColorForTheme(
  color: string, 
  theme: 'light' | 'dark', 
  isHighContrast: boolean = false
): string {
  if (theme === 'light' && !isHighContrast) {
    return color;
  }
  
  const [h, s, l] = hexToHsl(color);
  
  if (theme === 'dark') {
    // Make colors brighter for dark theme
    const newL = Math.min(100, l + 10);
    return hslToHex(h, s, newL);
  }
  
  if (isHighContrast) {
    // Make colors more extreme for high contrast
    const newL = l > 50 ? Math.min(100, l + 20) : Math.max(0, l - 20);
    return hslToHex(h, s, newL);
  }
  
  return color;
}

export function validateThemeColors(colors: Record<string, string>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const requiredColors = ['primary', 'secondary', 'background', 'foreground', 'accent', 'muted'];
  
  // Check for missing colors
  for (const required of requiredColors) {
    if (!colors[required]) {
      errors.push(`Missing required color: ${required}`);
    }
  }
  
  // Validate color formats
  for (const [name, color] of Object.entries(colors)) {
    if (color && !color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push(`Invalid color format for ${name}: ${color}`);
    }
  }
  
  // Check contrast ratios
  if (colors.foreground && colors.background) {
    const ratio = getContrastRatio(colors.foreground, colors.background);
    if (ratio < 4.5) {
      errors.push(`Insufficient foreground/background contrast ratio: ${ratio.toFixed(2)} (minimum 4.5:1)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

import type { ResolvedTheme } from '../contexts/ThemeContext';

// Color space conversion utilities
export interface ColorLAB {
  l: number;
  a: number;
  b: number;
}

export interface ColorXYZ {
  x: number;
  y: number;
  z: number;
}

/**
 * Advanced color manipulation utilities
 */
export class ColorManipulator {
  /**
   * Convert RGB to XYZ color space
   */
  static rgbToXyz(r: number, g: number, b: number): ColorXYZ {
    // Normalize RGB values
    r = r / 255;
    g = g / 255;
    b = b / 255;

    // Apply gamma correction
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // Convert to XYZ using sRGB matrix
    const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

    return { x: x * 100, y: y * 100, z: z * 100 };
  }

  /**
   * Convert XYZ to LAB color space
   */
  static xyzToLab(x: number, y: number, z: number): ColorLAB {
    // Reference white D65
    const xn = 95.047;
    const yn = 100.000;
    const zn = 108.883;

    x = x / xn;
    y = y / yn;
    z = z / zn;

    const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);

    return { l, a, b };
  }

  /**
   * Calculate Delta E (CIE76) color difference
   */
  static deltaE(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
    const xyz1 = this.rgbToXyz(color1.r, color1.g, color1.b);
    const xyz2 = this.rgbToXyz(color2.r, color2.g, color2.b);
    
    const lab1 = this.xyzToLab(xyz1.x, xyz1.y, xyz1.z);
    const lab2 = this.xyzToLab(xyz2.x, xyz2.y, xyz2.z);

    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;

    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  /**
   * Generate color palette from base color
   */
  static generatePalette(baseHex: string, steps: number = 9): string[] {
    const rgb = this.hexToRgb(baseHex);
    if (!rgb) return [baseHex];

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const palette: string[] = [];

    for (let i = 0; i < steps; i++) {
      const lightness = 95 - (i * (90 / (steps - 1)));
      const newHsl = { ...hsl, l: lightness };
      const newRgb = this.hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      palette.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }

    return palette;
  }

  /**
   * Find closest accessible color
   */
  static findAccessibleColor(
    targetHex: string,
    backgroundHex: string,
    targetRatio: number = 4.5,
    maxIterations: number = 50
  ): string {
    let currentColor = targetHex;
    let currentRatio = this.getContrastRatio(targetHex, backgroundHex);

    if (currentRatio >= targetRatio) {
      return currentColor;
    }

    const targetRgb = this.hexToRgb(targetHex);
    const backgroundRgb = this.hexToRgb(backgroundHex);
    
    if (!targetRgb || !backgroundRgb) return targetHex;

    const backgroundLuminance = this.getLuminance(backgroundRgb);
    const shouldDarken = backgroundLuminance > 0.5;

    for (let i = 1; i <= maxIterations; i++) {
      const adjustment = i * 2; // Adjust by 2% each iteration
      
      if (shouldDarken) {
        currentColor = this.darken(targetHex, adjustment);
      } else {
        currentColor = this.lighten(targetHex, adjustment);
      }

      currentRatio = this.getContrastRatio(currentColor, backgroundHex);
      
      if (currentRatio >= targetRatio) {
        return currentColor;
      }
    }

    return currentColor;
  }

  // Helper methods (simplified versions of the ones in useTheme)
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private static rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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
  }

  private static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
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
      r = g = b = l;
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
  }

  private static lighten(hex: string, percentage: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.min(100, hsl.l + percentage);
    
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  private static darken(hex: string, percentage: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.max(0, hsl.l - percentage);
    
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  private static getLuminance(color: { r: number; g: number; b: number }): number {
    const { r, g, b } = color;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  private static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1);
    const lum2 = this.getLuminance(rgb2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
}

/**
 * Theme-aware CSS class generator
 */
export class ThemeClassGenerator {
  /**
   * Generate responsive theme classes
   */
  static responsive(
    baseClasses: string,
    lightClasses: string = '',
    darkClasses: string = '',
    highContrastClasses: string = ''
  ): string {
    const classes = [baseClasses];
    
    if (lightClasses) {
      classes.push(`light:${lightClasses}`);
    }
    
    if (darkClasses) {
      classes.push(`dark:${darkClasses}`);
    }
    
    if (highContrastClasses) {
      classes.push(`high-contrast:${highContrastClasses}`);
    }
    
    return classes.join(' ');
  }

  /**
   * Generate button classes with theme variants
   */
  static button(
    variant: 'primary' | 'secondary' | 'outline' = 'primary',
    size: 'sm' | 'md' | 'lg' = 'md'
  ): string {
    const baseClasses = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const variantClasses = {
      primary: this.responsive(
        'bg-brand-orange-500 text-white focus:ring-brand-orange-500',
        'hover:bg-brand-orange-600 active:bg-brand-orange-700',
        'dark:bg-brand-orange-500 dark:hover:bg-brand-orange-400 dark:active:bg-brand-orange-600',
        'high-contrast:bg-orange-800 high-contrast:hover:bg-orange-900'
      ),
      secondary: this.responsive(
        'bg-brand-grey-900 text-white focus:ring-brand-grey-500',
        'hover:bg-brand-grey-800 active:bg-brand-grey-700',
        'dark:bg-brand-grey-700 dark:hover:bg-brand-grey-600 dark:active:bg-brand-grey-800',
        'high-contrast:bg-black high-contrast:hover:bg-grey-900'
      ),
      outline: this.responsive(
        'border-2 bg-transparent focus:ring-brand-orange-500',
        'border-brand-orange-500 text-brand-orange-500 hover:bg-brand-orange-500 hover:text-white',
        'dark:border-brand-orange-400 dark:text-brand-orange-400 dark:hover:bg-brand-orange-400 dark:hover:text-brand-grey-900',
        'high-contrast:border-orange-800 high-contrast:text-orange-800 high-contrast:hover:bg-orange-800 high-contrast:hover:text-white'
      ),
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
  }

  /**
   * Generate input classes with theme variants
   */
  static input(): string {
    return this.responsive(
      'w-full px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      'bg-white border-brand-grey-300 text-brand-grey-900 placeholder-brand-grey-500 focus:border-brand-orange-500 focus:ring-brand-orange-500',
      'dark:bg-brand-grey-800 dark:border-brand-grey-600 dark:text-brand-grey-100 dark:placeholder-brand-grey-400 dark:focus:border-brand-orange-400 dark:focus:ring-brand-orange-400',
      'high-contrast:bg-white high-contrast:border-black high-contrast:text-black high-contrast:focus:border-orange-800 high-contrast:focus:ring-orange-800'
    );
  }

  /**
   * Generate card classes with theme variants
   */
  static card(): string {
    return this.responsive(
      'rounded-lg border transition-colors duration-200',
      'bg-white border-brand-grey-200 shadow-sm',
      'dark:bg-brand-grey-800 dark:border-brand-grey-700 dark:shadow-lg',
      'high-contrast:bg-white high-contrast:border-black high-contrast:shadow-lg'
    );
  }
}

/**
 * Theme-aware animation utilities
 */
export class ThemeAnimations {
  /**
   * Create smooth theme transition CSS
   */
  static createTransitionCSS(): string {
    return `
      * {
        transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 200ms;
      }

      .theme-transitioning * {
        transition-duration: 0ms !important;
      }

      .theme-switching {
        pointer-events: none;
      }

      .theme-switching * {
        transition-duration: 250ms !important;
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          transition-duration: 0ms !important;
        }
      }
    `;
  }

  /**
   * Create loading animation for theme switches
   */
  static createLoadingAnimation(): string {
    return `
      @keyframes theme-loading {
        0% { opacity: 0.8; }
        50% { opacity: 0.4; }
        100% { opacity: 0.8; }
      }

      .theme-loading {
        animation: theme-loading 1s ease-in-out infinite;
      }
    `;
  }
}

/**
 * Accessibility enhancement utilities
 */
export class AccessibilityEnhancer {
  /**
   * Generate focus ring styles that work in all themes
   */
  static focusRing(color?: string): string {
    const focusColor = color || 'brand-orange-500';
    return `focus:outline-none focus:ring-2 focus:ring-${focusColor} focus:ring-offset-2 dark:focus:ring-offset-brand-grey-800 high-contrast:focus:ring-offset-4 high-contrast:focus:ring-orange-800`;
  }

  /**
   * Generate skip link styles
   */
  static skipLink(): string {
    return [
      'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 rounded-md font-medium',
      'bg-brand-orange-500 text-white',
      'dark:bg-brand-orange-400 dark:text-brand-grey-900',
      'high-contrast:bg-orange-800 high-contrast:text-white high-contrast:border-2 high-contrast:border-white'
    ].join(' ');
  }

  /**
   * Generate screen reader only text styles
   */
  static srOnly(): string {
    return 'absolute w-px h-px p-0 -m-px overflow-hidden clip-rect(0,0,0,0) whitespace-nowrap border-0';
  }

  /**
   * Generate high contrast mode detection
   */
  static detectHighContrast(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      return window.matchMedia('(prefers-contrast: high)').matches;
    } catch {
      return false;
    }
  }

  /**
   * Generate reduced motion detection
   */
  static detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }
}

/**
 * Theme performance utilities
 */
export class ThemePerformance {
  /**
   * Preload theme assets
   */
  static preloadThemeAssets(theme: ResolvedTheme): void {
    if (typeof document === 'undefined') return;

    // Preload theme-specific images or assets
    const themeAssets = {
      light: [
        // Add light theme specific assets
      ],
      dark: [
        // Add dark theme specific assets
      ],
    };

    themeAssets[theme].forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = asset;
      link.as = 'image';
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize CSS custom properties
   */
  static optimizeCustomProperties(): void {
    if (typeof document === 'undefined') return;

    // Remove unused CSS custom properties
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // This would need to be implemented based on actual usage analysis
    // For now, it's a placeholder for future optimization
  }

  /**
   * Measure theme switch performance
   */
  static measureThemeSwitchPerformance(callback: () => void): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      callback();
      
      // Use requestAnimationFrame to measure when the switch is complete
      requestAnimationFrame(() => {
        const endTime = performance.now();
        resolve(endTime - startTime);
      });
    });
  }
}

// Export utility functions for direct use
export const themeUtils = {
  ColorManipulator,
  ThemeClassGenerator,
  ThemeAnimations,
  AccessibilityEnhancer,
  ThemePerformance,
};

export default themeUtils;