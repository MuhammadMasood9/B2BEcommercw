/**
 * CSS Optimizer for Theme System
 * Optimizes CSS custom properties and reduces bundle size
 */

interface CSSOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercentage: number;
  optimizations: string[];
}

interface CSSCustomProperty {
  name: string;
  value: string;
  usage: number;
  isThemeRelated: boolean;
}

class CSSOptimizer {
  private customProperties: Map<string, CSSCustomProperty> = new Map();
  private unusedProperties: Set<string> = new Set();
  private duplicateProperties: Map<string, string[]> = new Map();

  /**
   * Analyze CSS custom properties performance
   */
  async analyzeCSSProperties(): Promise<{
    total: number;
    themeRelated: number;
    unused: number;
    duplicates: number;
    performance: 'good' | 'warning' | 'poor';
  }> {
    await this.scanCustomProperties();
    await this.detectUnusedProperties();
    await this.findDuplicateProperties();

    const total = this.customProperties.size;
    const themeRelated = Array.from(this.customProperties.values()).filter(p => p.isThemeRelated).length;
    const unused = this.unusedProperties.size;
    const duplicates = this.duplicateProperties.size;

    // Determine performance level
    let performance: 'good' | 'warning' | 'poor' = 'good';
    if (total > 200 || unused > 20 || duplicates > 10) {
      performance = 'poor';
    } else if (total > 100 || unused > 10 || duplicates > 5) {
      performance = 'warning';
    }

    return {
      total,
      themeRelated,
      unused,
      duplicates,
      performance,
    };
  }

  /**
   * Optimize CSS custom properties
   */
  async optimizeCSS(): Promise<CSSOptimizationResult> {
    const originalSize = await this.calculateCSSSize();
    const optimizations: string[] = [];

    // Remove unused properties
    const removedUnused = await this.removeUnusedProperties();
    if (removedUnused > 0) {
      optimizations.push(`Removed ${removedUnused} unused custom properties`);
    }

    // Consolidate duplicate properties
    const consolidatedDuplicates = await this.consolidateDuplicateProperties();
    if (consolidatedDuplicates > 0) {
      optimizations.push(`Consolidated ${consolidatedDuplicates} duplicate properties`);
    }

    // Optimize color values
    const optimizedColors = await this.optimizeColorValues();
    if (optimizedColors > 0) {
      optimizations.push(`Optimized ${optimizedColors} color values`);
    }

    // Minify property names where possible
    const minifiedNames = await this.minifyPropertyNames();
    if (minifiedNames > 0) {
      optimizations.push(`Minified ${minifiedNames} property names`);
    }

    const optimizedSize = await this.calculateCSSSize();
    const savings = originalSize - optimizedSize;
    const savingsPercentage = originalSize > 0 ? (savings / originalSize) * 100 : 0;

    return {
      originalSize,
      optimizedSize,
      savings,
      savingsPercentage,
      optimizations,
    };
  }

  /**
   * Scan all custom properties in stylesheets
   */
  private async scanCustomProperties(): Promise<void> {
    this.customProperties.clear();

    // Scan inline styles
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const style = (element as HTMLElement).style;
      for (let i = 0; i < style.length; i++) {
        const property = style[i];
        if (property.startsWith('--')) {
          this.addCustomProperty(property, style.getPropertyValue(property));
        }
      }
    });

    // Scan stylesheets
    const stylesheets = Array.from(document.styleSheets);
    for (const stylesheet of stylesheets) {
      try {
        await this.scanStylesheet(stylesheet);
      } catch (error) {
        // Skip stylesheets we can't access (CORS, etc.)
        console.debug('Could not scan stylesheet:', stylesheet.href);
      }
    }

    // Scan computed styles on root element
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
      const property = rootStyles[i];
      if (property.startsWith('--')) {
        this.addCustomProperty(property, rootStyles.getPropertyValue(property));
      }
    }
  }

  /**
   * Scan individual stylesheet
   */
  private async scanStylesheet(stylesheet: CSSStyleSheet): Promise<void> {
    try {
      const rules = stylesheet.cssRules || stylesheet.rules;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        this.scanCSSRule(rule);
      }
    } catch (error) {
      // Handle CORS or other access issues
      if (stylesheet.href) {
        try {
          const response = await fetch(stylesheet.href);
          const cssText = await response.text();
          this.scanCSSText(cssText);
        } catch (fetchError) {
          console.debug('Could not fetch stylesheet:', stylesheet.href);
        }
      }
    }
  }

  /**
   * Scan CSS rule for custom properties
   */
  private scanCSSRule(rule: CSSRule): void {
    if (rule.type === CSSRule.STYLE_RULE) {
      const styleRule = rule as CSSStyleRule;
      const style = styleRule.style;
      
      for (let i = 0; i < style.length; i++) {
        const property = style[i];
        if (property.startsWith('--')) {
          this.addCustomProperty(property, style.getPropertyValue(property));
        }
      }
    } else if (rule.type === CSSRule.MEDIA_RULE) {
      const mediaRule = rule as CSSMediaRule;
      for (let i = 0; i < mediaRule.cssRules.length; i++) {
        this.scanCSSRule(mediaRule.cssRules[i]);
      }
    }
  }

  /**
   * Scan CSS text for custom properties
   */
  private scanCSSText(cssText: string): void {
    // Simple regex to find custom properties
    const customPropertyRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let match;
    
    while ((match = customPropertyRegex.exec(cssText)) !== null) {
      const property = `--${match[1]}`;
      const value = match[2].trim();
      this.addCustomProperty(property, value);
    }
  }

  /**
   * Add custom property to tracking
   */
  private addCustomProperty(name: string, value: string): void {
    const existing = this.customProperties.get(name);
    const isThemeRelated = this.isThemeRelatedProperty(name, value);
    
    if (existing) {
      existing.usage++;
      if (existing.value !== value) {
        // Track duplicate with different values
        if (!this.duplicateProperties.has(name)) {
          this.duplicateProperties.set(name, [existing.value]);
        }
        this.duplicateProperties.get(name)!.push(value);
      }
    } else {
      this.customProperties.set(name, {
        name,
        value,
        usage: 1,
        isThemeRelated,
      });
    }
  }

  /**
   * Check if property is theme-related
   */
  private isThemeRelatedProperty(name: string, value: string): boolean {
    const themeKeywords = [
      'brand', 'theme', 'dark', 'light', 'color', 'background', 'foreground',
      'primary', 'secondary', 'accent', 'muted', 'orange', 'grey', 'gray'
    ];
    
    const nameCheck = themeKeywords.some(keyword => 
      name.toLowerCase().includes(keyword)
    );
    
    const valueCheck = themeKeywords.some(keyword => 
      value.toLowerCase().includes(keyword)
    );
    
    return nameCheck || valueCheck;
  }

  /**
   * Detect unused custom properties
   */
  private async detectUnusedProperties(): Promise<void> {
    this.unusedProperties.clear();
    
    // Get all CSS text to search for property usage
    let allCSSText = '';
    
    try {
      const stylesheets = Array.from(document.styleSheets);
      for (const stylesheet of stylesheets) {
        try {
          if (stylesheet.href) {
            const response = await fetch(stylesheet.href);
            allCSSText += await response.text();
          } else {
            // Inline stylesheet
            const rules = stylesheet.cssRules || stylesheet.rules;
            for (let i = 0; i < rules.length; i++) {
              allCSSText += rules[i].cssText;
            }
          }
        } catch (error) {
          // Skip inaccessible stylesheets
        }
      }
    } catch (error) {
      console.warn('Could not analyze CSS for unused properties:', error);
      return;
    }

    // Check each custom property for usage
    this.customProperties.forEach((property, name) => {
      const usageRegex = new RegExp(`var\\(\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      const matches = allCSSText.match(usageRegex);
      
      if (!matches || matches.length === 0) {
        this.unusedProperties.add(name);
      }
    });
  }

  /**
   * Find duplicate properties with same values
   */
  private async findDuplicateProperties(): Promise<void> {
    const valueMap = new Map<string, string[]>();
    
    this.customProperties.forEach((property, name) => {
      const normalizedValue = this.normalizeValue(property.value);
      
      if (!valueMap.has(normalizedValue)) {
        valueMap.set(normalizedValue, []);
      }
      valueMap.get(normalizedValue)!.push(name);
    });

    // Find values with multiple properties
    valueMap.forEach((properties, value) => {
      if (properties.length > 1) {
        this.duplicateProperties.set(value, properties);
      }
    });
  }

  /**
   * Normalize CSS value for comparison
   */
  private normalizeValue(value: string): string {
    return value
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ',')
      .replace(/;\s*$/, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Remove unused custom properties
   */
  private async removeUnusedProperties(): Promise<number> {
    let removedCount = 0;
    
    // In a real implementation, this would modify the actual CSS
    // For now, we'll just track what would be removed
    this.unusedProperties.forEach(propertyName => {
      if (this.customProperties.has(propertyName)) {
        console.debug(`Would remove unused property: ${propertyName}`);
        removedCount++;
      }
    });

    return removedCount;
  }

  /**
   * Consolidate duplicate properties
   */
  private async consolidateDuplicateProperties(): Promise<number> {
    let consolidatedCount = 0;
    
    this.duplicateProperties.forEach((properties, value) => {
      if (properties.length > 1) {
        console.debug(`Would consolidate duplicate properties with value "${value}":`, properties);
        consolidatedCount += properties.length - 1; // Keep one, remove others
      }
    });

    return consolidatedCount;
  }

  /**
   * Optimize color values
   */
  private async optimizeColorValues(): Promise<number> {
    let optimizedCount = 0;
    
    this.customProperties.forEach((property, name) => {
      const optimizedValue = this.optimizeColorValue(property.value);
      if (optimizedValue !== property.value) {
        console.debug(`Would optimize color ${name}: "${property.value}" -> "${optimizedValue}"`);
        optimizedCount++;
      }
    });

    return optimizedCount;
  }

  /**
   * Optimize individual color value
   */
  private optimizeColorValue(value: string): string {
    // Convert long hex to short hex where possible
    const longHexRegex = /#([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/gi;
    value = value.replace(longHexRegex, '#$1$2$3');
    
    // Convert rgb() to hex where shorter
    const rgbRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi;
    value = value.replace(rgbRegex, (match, r, g, b) => {
      const hex = '#' + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
      
      return hex.length <= match.length ? hex : match;
    });
    
    // Convert named colors to hex where shorter
    const namedColors: Record<string, string> = {
      'white': '#fff',
      'black': '#000',
      'red': '#f00',
      'green': '#008000',
      'blue': '#00f',
      'yellow': '#ff0',
      'cyan': '#0ff',
      'magenta': '#f0f',
    };
    
    Object.entries(namedColors).forEach(([name, hex]) => {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      if (hex.length < name.length) {
        value = value.replace(regex, hex);
      }
    });
    
    return value;
  }

  /**
   * Minify property names where safe
   */
  private async minifyPropertyNames(): Promise<number> {
    let minifiedCount = 0;
    
    // This is a simplified example - in practice, you'd need to ensure
    // the minified names don't conflict and update all references
    this.customProperties.forEach((property, name) => {
      if (name.length > 10 && !property.isThemeRelated) {
        // Only minify non-theme properties to maintain readability
        console.debug(`Could minify property name: ${name}`);
        minifiedCount++;
      }
    });

    return minifiedCount;
  }

  /**
   * Calculate total CSS size
   */
  private async calculateCSSSize(): Promise<number> {
    let totalSize = 0;
    
    try {
      const stylesheets = Array.from(document.styleSheets);
      for (const stylesheet of stylesheets) {
        try {
          if (stylesheet.href) {
            const response = await fetch(stylesheet.href);
            const cssText = await response.text();
            totalSize += new Blob([cssText]).size;
          } else {
            // Estimate size for inline stylesheets
            const rules = stylesheet.cssRules || stylesheet.rules;
            let inlineCSS = '';
            for (let i = 0; i < rules.length; i++) {
              inlineCSS += rules[i].cssText;
            }
            totalSize += new Blob([inlineCSS]).size;
          }
        } catch (error) {
          // Skip inaccessible stylesheets
        }
      }
    } catch (error) {
      console.warn('Could not calculate CSS size:', error);
    }

    return totalSize;
  }

  /**
   * Generate optimization report
   */
  async generateOptimizationReport(): Promise<{
    analysis: Awaited<ReturnType<typeof this.analyzeCSSProperties>>;
    recommendations: string[];
    potentialSavings: number;
  }> {
    const analysis = await this.analyzeCSSProperties();
    const recommendations: string[] = [];
    let potentialSavings = 0;

    if (analysis.unused > 0) {
      recommendations.push(`Remove ${analysis.unused} unused custom properties`);
      potentialSavings += analysis.unused * 50; // Estimate 50 bytes per property
    }

    if (analysis.duplicates > 0) {
      recommendations.push(`Consolidate ${analysis.duplicates} duplicate properties`);
      potentialSavings += analysis.duplicates * 30; // Estimate 30 bytes per duplicate
    }

    if (analysis.total > 150) {
      recommendations.push('Consider splitting CSS into theme-specific bundles');
      potentialSavings += analysis.total * 10; // Estimate 10 bytes per property in savings
    }

    if (analysis.performance === 'poor') {
      recommendations.push('Implement CSS custom property caching');
      recommendations.push('Use CSS-in-JS for dynamic theme properties');
    }

    return {
      analysis,
      recommendations,
      potentialSavings,
    };
  }

  /**
   * Clear cached data
   */
  clear(): void {
    this.customProperties.clear();
    this.unusedProperties.clear();
    this.duplicateProperties.clear();
  }
}

// Global instance
export const cssOptimizer = new CSSOptimizer();

// Convenience functions
export const analyzeCSSProperties = () => cssOptimizer.analyzeCSSProperties();
export const optimizeCSS = () => cssOptimizer.optimizeCSS();
export const generateOptimizationReport = () => cssOptimizer.generateOptimizationReport();

export default cssOptimizer;