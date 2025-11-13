/**
 * Accessibility Auditor for Theme System
 * Comprehensive accessibility testing and compliance checking
 */

interface AccessibilityIssue {
  type: 'contrast' | 'focus' | 'aria' | 'keyboard' | 'color-only' | 'motion';
  severity: 'error' | 'warning' | 'info';
  element: string;
  description: string;
  recommendation: string;
  wcagCriterion: string;
  currentValue?: string;
  expectedValue?: string;
}

interface ContrastTestResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  level: 'fail' | 'aa' | 'aaa';
  foreground: string;
  background: string;
}

interface AccessibilityAuditResult {
  score: number; // 0-100
  issues: AccessibilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
    totalElements: number;
    testedElements: number;
  };
  themeCompliance: {
    lightMode: boolean;
  };
}

class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];
  private testedElements = 0;
  private totalElements = 0;

  /**
   * Run comprehensive accessibility audit
   */
  async runFullAudit(): Promise<AccessibilityAuditResult> {
    this.reset();
    
    // Count total elements
    this.totalElements = document.querySelectorAll('*').length;
    
    // Run all audit checks
    await this.auditColorContrast();
    await this.auditFocusIndicators();
    await this.auditAriaLabels();
    await this.auditKeyboardNavigation();
    await this.auditColorOnlyInformation();
    await this.auditMotionPreferences();
    await this.auditThemeCompliance();

    return this.generateReport();
  }

  /**
   * Audit color contrast ratios
   */
  private async auditColorContrast(): Promise<void> {
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, input, textarea, label, li, td, th');
    
    for (const element of textElements) {
      this.testedElements++;
      
      const styles = getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = this.getEffectiveBackgroundColor(element);
      
      if (color && backgroundColor) {
        const result = this.testColorContrast(color, backgroundColor);
        
        if (!result.wcagAA) {
          this.addIssue({
            type: 'contrast',
            severity: 'error',
            element: this.getElementSelector(element),
            description: `Text has insufficient color contrast ratio of ${result.ratio}:1`,
            recommendation: `Increase contrast to at least 4.5:1 for normal text or 3:1 for large text`,
            wcagCriterion: 'WCAG 2.1 AA - 1.4.3 Contrast (Minimum)',
            currentValue: `${result.ratio}:1`,
            expectedValue: '4.5:1 minimum',
          });
        } else if (!result.wcagAAA) {
          this.addIssue({
            type: 'contrast',
            severity: 'warning',
            element: this.getElementSelector(element),
            description: `Text contrast could be improved for AAA compliance (current: ${result.ratio}:1)`,
            recommendation: `Increase contrast to at least 7:1 for AAA compliance`,
            wcagCriterion: 'WCAG 2.1 AAA - 1.4.6 Contrast (Enhanced)',
            currentValue: `${result.ratio}:1`,
            expectedValue: '7:1 for AAA',
          });
        }
      }
    }
  }

  /**
   * Audit focus indicators
   */
  private async auditFocusIndicators(): Promise<void> {
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
    );

    for (const element of focusableElements) {
      this.testedElements++;
      
      // Simulate focus to test focus indicators
      (element as HTMLElement).focus();
      const focusedStyles = getComputedStyle(element);
      
      const hasOutline = focusedStyles.outline !== 'none' && focusedStyles.outline !== '0px';
      const hasBoxShadow = focusedStyles.boxShadow !== 'none';
      const hasBorder = focusedStyles.borderWidth !== '0px';
      
      if (!hasOutline && !hasBoxShadow && !hasBorder) {
        this.addIssue({
          type: 'focus',
          severity: 'error',
          element: this.getElementSelector(element),
          description: 'Focusable element lacks visible focus indicator',
          recommendation: 'Add visible focus indicator using outline, box-shadow, or border',
          wcagCriterion: 'WCAG 2.1 AA - 2.4.7 Focus Visible',
        });
      }
      
      // Test focus indicator contrast
      if (hasOutline || hasBoxShadow) {
        const focusColor = this.extractFocusColor(focusedStyles);
        const backgroundColor = this.getEffectiveBackgroundColor(element);
        
        if (focusColor && backgroundColor) {
          const contrastResult = this.testColorContrast(focusColor, backgroundColor);
          if (contrastResult.ratio < 3) {
            this.addIssue({
              type: 'focus',
              severity: 'warning',
              element: this.getElementSelector(element),
              description: `Focus indicator has low contrast ratio of ${contrastResult.ratio}:1`,
              recommendation: 'Ensure focus indicator has at least 3:1 contrast ratio',
              wcagCriterion: 'WCAG 2.1 AA - 1.4.11 Non-text Contrast',
              currentValue: `${contrastResult.ratio}:1`,
              expectedValue: '3:1 minimum',
            });
          }
        }
      }
      
      (element as HTMLElement).blur();
    }
  }

  /**
   * Audit ARIA labels and attributes
   */
  private async auditAriaLabels(): Promise<void> {
    // Check for missing aria-labels on interactive elements
    const interactiveElements = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
    
    for (const element of interactiveElements) {
      this.testedElements++;
      
      const hasAriaLabel = element.hasAttribute('aria-label');
      const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
      const hasTextContent = element.textContent?.trim();
      const hasTitle = element.hasAttribute('title');
      
      if (!hasAriaLabel && !hasAriaLabelledBy && !hasTextContent && !hasTitle) {
        this.addIssue({
          type: 'aria',
          severity: 'error',
          element: this.getElementSelector(element),
          description: 'Interactive element lacks accessible name',
          recommendation: 'Add aria-label, aria-labelledby, text content, or title attribute',
          wcagCriterion: 'WCAG 2.1 A - 4.1.2 Name, Role, Value',
        });
      }
    }

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    for (const heading of headings) {
      this.testedElements++;
      
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      if (currentLevel > previousLevel + 1) {
        this.addIssue({
          type: 'aria',
          severity: 'warning',
          element: this.getElementSelector(heading),
          description: `Heading level skips from h${previousLevel} to h${currentLevel}`,
          recommendation: 'Use sequential heading levels for proper document structure',
          wcagCriterion: 'WCAG 2.1 AA - 1.3.1 Info and Relationships',
        });
      }
      
      previousLevel = currentLevel;
    }

    // Check for images without alt text
    const images = document.querySelectorAll('img');
    for (const img of images) {
      this.testedElements++;
      
      if (!img.hasAttribute('alt')) {
        this.addIssue({
          type: 'aria',
          severity: 'error',
          element: this.getElementSelector(img),
          description: 'Image lacks alt attribute',
          recommendation: 'Add descriptive alt text or empty alt="" for decorative images',
          wcagCriterion: 'WCAG 2.1 A - 1.1.1 Non-text Content',
        });
      }
    }
  }

  /**
   * Audit keyboard navigation
   */
  private async auditKeyboardNavigation(): Promise<void> {
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    // Check for keyboard traps
    let tabIndex = 0;
    for (const element of focusableElements) {
      this.testedElements++;
      
      const computedTabIndex = (element as HTMLElement).tabIndex;
      
      if (computedTabIndex > 0) {
        this.addIssue({
          type: 'keyboard',
          severity: 'warning',
          element: this.getElementSelector(element),
          description: 'Element uses positive tabindex, which can disrupt natural tab order',
          recommendation: 'Use tabindex="0" or rely on natural DOM order',
          wcagCriterion: 'WCAG 2.1 A - 2.4.3 Focus Order',
          currentValue: `tabindex="${computedTabIndex}"`,
          expectedValue: 'tabindex="0" or no tabindex',
        });
      }
      
      // Check if element is reachable by keyboard
      if (element.tagName === 'DIV' && element.hasAttribute('onclick') && !element.hasAttribute('tabindex')) {
        this.addIssue({
          type: 'keyboard',
          severity: 'error',
          element: this.getElementSelector(element),
          description: 'Clickable element is not keyboard accessible',
          recommendation: 'Add tabindex="0" and keyboard event handlers, or use a button element',
          wcagCriterion: 'WCAG 2.1 A - 2.1.1 Keyboard',
        });
      }
    }

    // Check for skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    let hasSkipToMain = false;
    
    for (const link of skipLinks) {
      const href = link.getAttribute('href');
      if (href === '#main' || href === '#content' || link.textContent?.toLowerCase().includes('skip')) {
        hasSkipToMain = true;
        break;
      }
    }
    
    if (!hasSkipToMain && focusableElements.length > 10) {
      this.addIssue({
        type: 'keyboard',
        severity: 'warning',
        element: 'body',
        description: 'Page lacks skip navigation link',
        recommendation: 'Add a "Skip to main content" link at the beginning of the page',
        wcagCriterion: 'WCAG 2.1 A - 2.4.1 Bypass Blocks',
      });
    }
  }

  /**
   * Audit for color-only information
   */
  private async auditColorOnlyInformation(): Promise<void> {
    // Check for elements that might rely on color alone
    const colorIndicators = document.querySelectorAll('.text-red-500, .text-green-500, .bg-red-500, .bg-green-500, [style*="color: red"], [style*="color: green"]');
    
    for (const element of colorIndicators) {
      this.testedElements++;
      
      const hasIcon = element.querySelector('svg, i, .icon');
      const hasText = element.textContent?.trim();
      const hasAriaLabel = element.hasAttribute('aria-label');
      
      if (!hasIcon && !hasText && !hasAriaLabel) {
        this.addIssue({
          type: 'color-only',
          severity: 'warning',
          element: this.getElementSelector(element),
          description: 'Element may rely on color alone to convey information',
          recommendation: 'Add icons, text, or other visual indicators in addition to color',
          wcagCriterion: 'WCAG 2.1 A - 1.4.1 Use of Color',
        });
      }
    }
  }

  /**
   * Audit motion and animation preferences
   */
  private async auditMotionPreferences(): Promise<void> {
    // Check if animations respect prefers-reduced-motion
    const animatedElements = document.querySelectorAll('[style*="animation"], [style*="transition"], .animate-');
    
    for (const element of animatedElements) {
      this.testedElements++;
      
      const styles = getComputedStyle(element);
      const hasAnimation = styles.animationName !== 'none';
      const hasTransition = styles.transitionDuration !== '0s';
      
      if (hasAnimation || hasTransition) {
        // Check if element respects reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
          this.addIssue({
            type: 'motion',
            severity: 'info',
            element: this.getElementSelector(element),
            description: 'Element has animations that should respect reduced motion preference',
            recommendation: 'Use @media (prefers-reduced-motion: reduce) to disable animations',
            wcagCriterion: 'WCAG 2.1 AAA - 2.3.3 Animation from Interactions',
          });
        }
      }
    }
  }

  /**
   * Audit theme-specific compliance
   */
  private async auditThemeCompliance(): Promise<void> {
    const root = document.documentElement;
    const isLightTheme = root.classList.contains('light');

    if (!isLightTheme) {
      this.addIssue({
        type: 'theme',
        severity: 'warning',
        element: 'html',
        description: 'Expected document root to use light theme classes',
        recommendation: 'Ensure the document root includes the `light` class for consistent styling',
        wcagCriterion: 'WCAG 2.1 A - 1.4.3 Contrast (Minimum)',
      });
    }
  }

  /**
   * Test color contrast between two colors
   */
  private testColorContrast(foreground: string, background: string): ContrastTestResult {
    const fg = this.parseColor(foreground);
    const bg = this.parseColor(background);
    
    if (!fg || !bg) {
      return {
        ratio: 0,
        wcagAA: false,
        wcagAAA: false,
        level: 'fail',
        foreground,
        background,
      };
    }
    
    const ratio = this.calculateContrastRatio(fg, bg);
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
      level: ratio >= 7 ? 'aaa' : ratio >= 4.5 ? 'aa' : 'fail',
      foreground,
      background,
    };
  }

  /**
   * Parse CSS color to RGB values
   */
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    // Create a temporary element to get computed color
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    
    const computed = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    
    // Parse rgb() or rgba() format
    const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    }
    
    return null;
  }

  /**
   * Calculate contrast ratio between two RGB colors
   */
  private calculateContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   */
  private getLuminance(color: { r: number; g: number; b: number }): number {
    const { r, g, b } = color;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Get effective background color of an element
   */
  private getEffectiveBackgroundColor(element: Element): string | null {
    let current = element as HTMLElement;
    
    while (current && current !== document.body) {
      const styles = getComputedStyle(current);
      const bgColor = styles.backgroundColor;
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return bgColor;
      }
      
      current = current.parentElement!;
    }
    
    // Default to white if no background found
    return 'rgb(255, 255, 255)';
  }

  /**
   * Extract focus color from computed styles
   */
  private extractFocusColor(styles: CSSStyleDeclaration): string | null {
    if (styles.outlineColor && styles.outlineColor !== 'transparent') {
      return styles.outlineColor;
    }
    
    if (styles.boxShadow && styles.boxShadow !== 'none') {
      // Extract color from box-shadow (simplified)
      const match = styles.boxShadow.match(/rgba?\([^)]+\)/);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  /**
   * Get CSS selector for an element
   */
  private getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  /**
   * Add an accessibility issue
   */
  private addIssue(issue: AccessibilityIssue): void {
    this.issues.push(issue);
  }

  /**
   * Generate accessibility audit report
   */
  private generateReport(): AccessibilityAuditResult {
    const errors = this.issues.filter(i => i.severity === 'error').length;
    const warnings = this.issues.filter(i => i.severity === 'warning').length;
    const info = this.issues.filter(i => i.severity === 'info').length;
    
    // Calculate score (100 - penalty for issues)
    const errorPenalty = errors * 10;
    const warningPenalty = warnings * 5;
    const infoPenalty = info * 1;
    const score = Math.max(0, 100 - errorPenalty - warningPenalty - infoPenalty);
    
    // Determine theme compliance
    const contrastIssues = this.issues.filter(i => i.type === 'contrast' && i.severity === 'error');
    
    return {
      score,
      issues: this.issues,
      summary: {
        errors,
        warnings,
        info,
        totalElements: this.totalElements,
        testedElements: this.testedElements,
      },
      themeCompliance: {
        lightMode: contrastIssues.length === 0,
      },
    };
  }

  /**
   * Reset audit state
   */
  private reset(): void {
    this.issues = [];
    this.testedElements = 0;
    this.totalElements = 0;
  }

  /**
   * Export audit results
   */
  exportResults(result: AccessibilityAuditResult): string {
    return JSON.stringify({
      ...result,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }, null, 2);
  }
}

// Global instance
export const accessibilityAuditor = new AccessibilityAuditor();

// Convenience functions
export const runAccessibilityAudit = () => accessibilityAuditor.runFullAudit();

export default accessibilityAuditor;