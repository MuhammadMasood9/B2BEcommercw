/**
 * Automated contrast ratio testing utilities for brand colors
 * Ensures WCAG AA compliance (4.5:1) and AAA compliance (7:1) for accessibility
 */

export interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  foreground: string;
  background: string;
}

export interface ColorPalette {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  background: string;
  foreground: string;
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors like #FF9900');
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Test contrast ratio and return compliance results
 */
export function testContrast(foreground: string, background: string): ContrastResult {
  const ratio = calculateContrastRatio(foreground, background);
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7,
    foreground,
    background
  };
}

/**
 * Brand color definitions for testing
 */
export const BRAND_COLORS: ColorPalette = {
  primary: '#FF9900',           // Orange
  primaryForeground: '#FFFFFF', // White
  secondary: '#1A1A1A',         // Dark grey
  secondaryForeground: '#FFFFFF', // White
  accent: '#CC7A00',            // Darker orange
  accentForeground: '#FFFFFF',  // White
  muted: '#FFF5E6',            // Very light orange
  mutedForeground: '#333333',   // Dark grey
  background: '#FFFFFF',        // White
  foreground: '#1A1A1A'         // Dark grey
};

/**
 * Test all brand color combinations for accessibility compliance
 */
export function testBrandColorContrast(): Record<string, ContrastResult> {
  const results: Record<string, ContrastResult> = {};
  
  // Test primary combinations
  results['primary-on-background'] = testContrast(BRAND_COLORS.primary, BRAND_COLORS.background);
  results['primary-foreground-on-primary'] = testContrast(BRAND_COLORS.primaryForeground, BRAND_COLORS.primary);
  
  // Test secondary combinations
  results['secondary-on-background'] = testContrast(BRAND_COLORS.secondary, BRAND_COLORS.background);
  results['secondary-foreground-on-secondary'] = testContrast(BRAND_COLORS.secondaryForeground, BRAND_COLORS.secondary);
  
  // Test accent combinations
  results['accent-on-background'] = testContrast(BRAND_COLORS.accent, BRAND_COLORS.background);
  results['accent-foreground-on-accent'] = testContrast(BRAND_COLORS.accentForeground, BRAND_COLORS.accent);
  
  // Test muted combinations
  results['muted-foreground-on-muted'] = testContrast(BRAND_COLORS.mutedForeground, BRAND_COLORS.muted);
  results['muted-on-background'] = testContrast(BRAND_COLORS.muted, BRAND_COLORS.background);
  
  // Test foreground on background
  results['foreground-on-background'] = testContrast(BRAND_COLORS.foreground, BRAND_COLORS.background);
  
  return results;
}

/**
 * Generate accessibility report for brand colors
 */
export function generateAccessibilityReport(): {
  passed: number;
  failed: number;
  total: number;
  results: Record<string, ContrastResult>;
  recommendations: string[];
} {
  const results = testBrandColorContrast();
  const recommendations: string[] = [];
  
  let passed = 0;
  let failed = 0;
  
  Object.entries(results).forEach(([key, result]) => {
    if (result.wcagAA) {
      passed++;
    } else {
      failed++;
      recommendations.push(
        `${key}: Contrast ratio ${result.ratio}:1 fails WCAG AA. Consider using a darker/lighter variant.`
      );
    }
  });
  
  return {
    passed,
    failed,
    total: passed + failed,
    results,
    recommendations
  };
}

/**
 * Validate if a color combination meets accessibility standards
 */
export function isAccessible(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const result = testContrast(foreground, background);
  return level === 'AA' ? result.wcagAA : result.wcagAAA;
}

/**
 * Automated contrast testing for all page elements
 */
export function runAutomatedContrastTests(): Promise<{
  passed: number;
  failed: number;
  total: number;
  failures: Array<{
    element: string;
    foreground: string;
    background: string;
    ratio: number;
    selector: string;
  }>;
}> {
  return new Promise((resolve) => {
    const failures: Array<{
      element: string;
      foreground: string;
      background: string;
      ratio: number;
      selector: string;
    }> = [];
    
    let passed = 0;
    let total = 0;
    
    // Get all text elements
    const textElements = document.querySelectorAll('*');
    
    textElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Skip elements without text content or transparent backgrounds
      if (!element.textContent?.trim() || backgroundColor === 'rgba(0, 0, 0, 0)') {
        return;
      }
      
      total++;
      
      try {
        // Convert RGB to hex for testing
        const fgHex = rgbToHex(color);
        const bgHex = rgbToHex(backgroundColor);
        
        if (fgHex && bgHex) {
          const result = testContrast(fgHex, bgHex);
          
          if (result.wcagAA) {
            passed++;
          } else {
            failures.push({
              element: element.tagName.toLowerCase(),
              foreground: fgHex,
              background: bgHex,
              ratio: result.ratio,
              selector: generateSelector(element, index)
            });
          }
        }
      } catch (error) {
        // Skip elements that can't be tested
        total--;
      }
    });
    
    resolve({
      passed,
      failed: failures.length,
      total,
      failures
    });
  });
}

/**
 * Convert RGB color to hex
 */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return null;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Generate a CSS selector for an element
 */
function generateSelector(element: Element, index: number): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }
  
  return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
}

/**
 * Test specific brand color combinations used in the application
 */
export function testApplicationColorCombinations(): Record<string, ContrastResult> {
  const combinations = [
    // Primary button combinations
    { name: 'primary-button', fg: BRAND_COLORS.primaryForeground, bg: BRAND_COLORS.primary },
    { name: 'primary-button-hover', fg: BRAND_COLORS.primaryForeground, bg: BRAND_COLORS.accent },
    
    // Secondary button combinations
    { name: 'secondary-button', fg: BRAND_COLORS.secondaryForeground, bg: BRAND_COLORS.secondary },
    
    // Text combinations
    { name: 'body-text', fg: BRAND_COLORS.foreground, bg: BRAND_COLORS.background },
    { name: 'muted-text', fg: BRAND_COLORS.mutedForeground, bg: BRAND_COLORS.muted },
    
    // Link combinations
    { name: 'link-text', fg: BRAND_COLORS.primary, bg: BRAND_COLORS.background },
    { name: 'link-hover', fg: BRAND_COLORS.accent, bg: BRAND_COLORS.background },
    
    // Navigation combinations
    { name: 'nav-text', fg: BRAND_COLORS.foreground, bg: BRAND_COLORS.background },
    { name: 'nav-active', fg: BRAND_COLORS.primaryForeground, bg: BRAND_COLORS.primary },
    
    // Form combinations
    { name: 'input-text', fg: BRAND_COLORS.foreground, bg: BRAND_COLORS.background },
    { name: 'input-focus', fg: BRAND_COLORS.foreground, bg: BRAND_COLORS.background },
    
    // Status combinations
    { name: 'success-text', fg: '#FFFFFF', bg: '#22C55E' },
    { name: 'warning-text', fg: BRAND_COLORS.primaryForeground, bg: BRAND_COLORS.primary },
    { name: 'error-text', fg: '#FFFFFF', bg: '#EF4444' },
    
    // High contrast mode combinations
    { name: 'high-contrast-primary', fg: '#FFFFFF', bg: '#A85C00' }, // Darker orange
    { name: 'high-contrast-secondary', fg: '#FFFFFF', bg: '#000000' }, // Pure black
    { name: 'high-contrast-text', fg: '#000000', bg: '#FFFFFF' }, // Pure black on white
  ];
  
  const results: Record<string, ContrastResult> = {};
  
  combinations.forEach(({ name, fg, bg }) => {
    results[name] = testContrast(fg, bg);
  });
  
  return results;
}

/**
 * Generate accessibility compliance report
 */
export function generateComplianceReport(): {
  summary: {
    totalTests: number;
    passedAA: number;
    passedAAA: number;
    failedAA: number;
    compliancePercentage: number;
  };
  results: Record<string, ContrastResult>;
  recommendations: string[];
  criticalIssues: string[];
} {
  const results = testApplicationColorCombinations();
  const recommendations: string[] = [];
  const criticalIssues: string[] = [];
  
  let passedAA = 0;
  let passedAAA = 0;
  let failedAA = 0;
  
  Object.entries(results).forEach(([name, result]) => {
    if (result.wcagAAA) {
      passedAAA++;
      passedAA++;
    } else if (result.wcagAA) {
      passedAA++;
    } else {
      failedAA++;
      
      // Critical issues for essential UI elements
      if (name.includes('button') || name.includes('body-text') || name.includes('nav')) {
        criticalIssues.push(
          `CRITICAL: ${name} has insufficient contrast (${result.ratio}:1). This affects core functionality.`
        );
      }
      
      recommendations.push(
        `${name}: Contrast ratio ${result.ratio}:1 fails WCAG AA (needs 4.5:1). Consider using darker/lighter colors.`
      );
    }
  });
  
  const totalTests = Object.keys(results).length;
  const compliancePercentage = Math.round((passedAA / totalTests) * 100);
  
  // Add general recommendations
  if (compliancePercentage < 100) {
    recommendations.push(
      'Consider implementing high contrast mode for users with visual impairments.',
      'Test with actual users who have visual impairments.',
      'Use automated testing tools in your CI/CD pipeline.'
    );
  }
  
  return {
    summary: {
      totalTests,
      passedAA,
      passedAAA,
      failedAA,
      compliancePercentage
    },
    results,
    recommendations,
    criticalIssues
  };
}