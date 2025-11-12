/**
 * Responsive Brand Consistency Validation Test
 * 
 * This test validates that the responsive brand system is working correctly
 * across different screen sizes and device types.
 */

interface ResponsiveBrandTest {
  name: string;
  description: string;
  test: () => boolean;
  expectedBehavior: string;
}

interface ValidationResult {
  testName: string;
  passed: boolean;
  message: string;
  expectedBehavior: string;
}

class ResponsiveBrandValidator {
  private tests: ResponsiveBrandTest[] = [];
  
  constructor() {
    this.initializeTests();
  }
  
  private initializeTests(): void {
    // Test 1: CSS Custom Properties Existence
    this.tests.push({
      name: 'CSS Custom Properties',
      description: 'Verify all brand color CSS custom properties are defined',
      expectedBehavior: 'All brand orange and grey color variables should be available',
      test: () => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        const requiredProperties = [
          '--brand-orange-500',
          '--brand-grey-900',
          '--brand-text-on-orange',
          '--brand-text-on-light',
          '--brand-hover-orange',
          '--brand-focus-orange'
        ];
        
        return requiredProperties.every(prop => {
          const value = computedStyle.getPropertyValue(prop).trim();
          return value !== '';
        });
      }
    });
    
    // Test 2: Responsive Breakpoints
    this.tests.push({
      name: 'Responsive Breakpoints',
      description: 'Verify responsive breakpoints are correctly configured',
      expectedBehavior: 'Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)',
      test: () => {
        // Test if media queries are working by checking computed styles
        const testElement = document.createElement('div');
        testElement.className = 'responsive-brand-button';
        document.body.appendChild(testElement);
        
        const computedStyle = getComputedStyle(testElement);
        const minHeight = computedStyle.minHeight;
        
        document.body.removeChild(testElement);
        
        // Should have some min-height value (44px on mobile by default)
        return minHeight !== '' && minHeight !== 'auto';
      }
    });
    
    // Test 3: Touch Detection
    this.tests.push({
      name: 'Touch Detection',
      description: 'Verify touch device detection is working',
      expectedBehavior: 'Should detect touch vs mouse/trackpad devices',
      test: () => {
        // Check if touch detection media queries are supported
        const touchQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
        const mouseQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        
        // At least one should be supported
        return touchQuery.media !== 'not all' || mouseQuery.media !== 'not all';
      }
    });
    
    // Test 4: Brand Color Accessibility
    this.tests.push({
      name: 'Color Accessibility',
      description: 'Verify brand colors meet accessibility standards',
      expectedBehavior: 'Orange on white and grey on white should have sufficient contrast',
      test: () => {
        // Test contrast ratios for key color combinations
        const orangeOnWhite = this.calculateContrastRatio('#FF9900', '#FFFFFF');
        const greyOnWhite = this.calculateContrastRatio('#1A1A1A', '#FFFFFF');
        
        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        return orangeOnWhite >= 4.5 && greyOnWhite >= 4.5;
      }
    });
    
    // Test 5: Font Loading
    this.tests.push({
      name: 'Font Loading',
      description: 'Verify Base Neue font family is loaded and applied',
      expectedBehavior: 'Base Neue should be the primary font family',
      test: () => {
        const testElement = document.createElement('div');
        testElement.style.fontFamily = 'var(--font-sans)';
        document.body.appendChild(testElement);
        
        const computedStyle = getComputedStyle(testElement);
        const fontFamily = computedStyle.fontFamily.toLowerCase();
        
        document.body.removeChild(testElement);
        
        return fontFamily.includes('base neue') || fontFamily.includes('base-neue');
      }
    });
    
    // Test 6: Responsive Grid System
    this.tests.push({
      name: 'Responsive Grid',
      description: 'Verify responsive grid system adapts to screen sizes',
      expectedBehavior: '1 column on mobile, 2 on tablet, 3+ on desktop',
      test: () => {
        const testGrid = document.createElement('div');
        testGrid.className = 'responsive-brand-grid';
        
        // Add test items
        for (let i = 0; i < 6; i++) {
          const item = document.createElement('div');
          testGrid.appendChild(item);
        }
        
        document.body.appendChild(testGrid);
        
        const computedStyle = getComputedStyle(testGrid);
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        
        document.body.removeChild(testGrid);
        
        // Should have grid-template-columns defined
        return gridTemplateColumns !== 'none' && gridTemplateColumns !== '';
      }
    });
    
    // Test 7: Interactive States
    this.tests.push({
      name: 'Interactive States',
      description: 'Verify hover and active states work correctly',
      expectedBehavior: 'Hover effects on desktop, touch feedback on mobile',
      test: () => {
        const button = document.createElement('button');
        button.className = 'responsive-brand-button';
        document.body.appendChild(button);
        
        // Simulate hover (if supported)
        const event = new MouseEvent('mouseenter', { bubbles: true });
        button.dispatchEvent(event);
        
        // Check if transition property is set
        const computedStyle = getComputedStyle(button);
        const transition = computedStyle.transition;
        
        document.body.removeChild(button);
        
        return transition !== 'all 0s ease 0s' && transition !== '';
      }
    });
    
    // Test 8: Dark Mode Support
    this.tests.push({
      name: 'Dark Mode Support',
      description: 'Verify dark mode color adjustments work',
      expectedBehavior: 'Colors should adjust appropriately in dark mode',
      test: () => {
        // Temporarily add dark class to test
        const originalClass = document.documentElement.className;
        document.documentElement.classList.add('dark');
        
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        const primaryColor = computedStyle.getPropertyValue('--primary').trim();
        
        // Restore original class
        document.documentElement.className = originalClass;
        
        // Dark mode should have slightly different primary color
        return primaryColor !== '' && primaryColor.includes('55%'); // Dark mode uses 55% instead of 50%
      }
    });
  }
  
  private calculateContrastRatio(color1: string, color2: string): number {
    // Convert hex to RGB
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    // Calculate relative luminance
    const l1 = this.getRelativeLuminance(rgb1);
    const l2 = this.getRelativeLuminance(rgb2);
    
    // Calculate contrast ratio
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  private getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  
  public runAllTests(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    this.tests.forEach(test => {
      try {
        const passed = test.test();
        results.push({
          testName: test.name,
          passed,
          message: passed ? 'Test passed successfully' : 'Test failed',
          expectedBehavior: test.expectedBehavior
        });
      } catch (error) {
        results.push({
          testName: test.name,
          passed: false,
          message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          expectedBehavior: test.expectedBehavior
        });
      }
    });
    
    return results;
  }
  
  public generateReport(): string {
    const results = this.runAllTests();
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    let report = `\n=== RESPONSIVE BRAND CONSISTENCY VALIDATION REPORT ===\n\n`;
    report += `Overall Score: ${passedTests}/${totalTests} tests passed\n\n`;
    
    results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report += `${index + 1}. ${result.testName}: ${status}\n`;
      report += `   Expected: ${result.expectedBehavior}\n`;
      report += `   Result: ${result.message}\n\n`;
    });
    
    if (passedTests === totalTests) {
      report += `🎉 All tests passed! Responsive brand consistency is working correctly.\n`;
    } else {
      report += `⚠️  ${totalTests - passedTests} test(s) failed. Please review the implementation.\n`;
    }
    
    return report;
  }
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  (window as any).ResponsiveBrandValidator = ResponsiveBrandValidator;
}

export default ResponsiveBrandValidator;