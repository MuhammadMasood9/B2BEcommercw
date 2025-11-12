/**
 * Bundle Size Analyzer for Theme System
 * Analyzes and optimizes theme-related bundle size
 */

interface BundleAnalysis {
  totalSize: number;
  themeSize: number;
  cssSize: number;
  jsSize: number;
  fontSize: number;
  breakdown: {
    customProperties: number;
    themeComponents: number;
    animations: number;
    utilities: number;
  };
  recommendations: string[];
  optimizationPotential: number;
}

interface AssetInfo {
  url: string;
  size: number;
  type: 'css' | 'js' | 'font' | 'other';
  isThemeRelated: boolean;
  loadTime?: number;
}

class BundleSizeAnalyzer {
  private assets: AssetInfo[] = [];
  private themeKeywords = [
    'theme', 'dark', 'light', 'color', 'brand', 'orange', 'grey', 'gray',
    'contrast', 'accessibility', 'custom-properties', 'css-variables'
  ];

  /**
   * Analyze complete bundle size
   */
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    await this.collectAssets();
    
    const totalSize = this.assets.reduce((sum, asset) => sum + asset.size, 0);
    const themeAssets = this.assets.filter(asset => asset.isThemeRelated);
    const themeSize = themeAssets.reduce((sum, asset) => sum + asset.size, 0);
    
    const cssAssets = this.assets.filter(asset => asset.type === 'css');
    const jsAssets = this.assets.filter(asset => asset.type === 'js');
    const fontAssets = this.assets.filter(asset => asset.type === 'font');
    
    const cssSize = cssAssets.reduce((sum, asset) => sum + asset.size, 0);
    const jsSize = jsAssets.reduce((sum, asset) => sum + asset.size, 0);
    const fontSize = fontAssets.reduce((sum, asset) => sum + asset.size, 0);

    const breakdown = await this.analyzeThemeBreakdown();
    const recommendations = this.generateRecommendations(themeSize, breakdown);
    const optimizationPotential = this.calculateOptimizationPotential(breakdown);

    return {
      totalSize,
      themeSize,
      cssSize,
      jsSize,
      fontSize,
      breakdown,
      recommendations,
      optimizationPotential,
    };
  }

  /**
   * Collect all assets from the page
   */
  private async collectAssets(): Promise<void> {
    this.assets = [];

    // Collect stylesheets
    const stylesheets = Array.from(document.styleSheets);
    for (const stylesheet of stylesheets) {
      if (stylesheet.href) {
        try {
          const size = await this.getAssetSize(stylesheet.href);
          const isThemeRelated = await this.isThemeRelatedAsset(stylesheet.href, 'css');
          
          this.assets.push({
            url: stylesheet.href,
            size,
            type: 'css',
            isThemeRelated,
          });
        } catch (error) {
          console.debug('Could not analyze stylesheet:', stylesheet.href);
        }
      }
    }

    // Collect scripts
    const scripts = Array.from(document.scripts);
    for (const script of scripts) {
      if (script.src) {
        try {
          const size = await this.getAssetSize(script.src);
          const isThemeRelated = await this.isThemeRelatedAsset(script.src, 'js');
          
          this.assets.push({
            url: script.src,
            size,
            type: 'js',
            isThemeRelated,
          });
        } catch (error) {
          console.debug('Could not analyze script:', script.src);
        }
      }
    }

    // Collect fonts
    if ('fonts' in document) {
      const fontFaces = Array.from(document.fonts);
      for (const fontFace of fontFaces) {
        if (fontFace.status === 'loaded') {
          try {
            // Estimate font size (this is approximate)
            const estimatedSize = this.estimateFontSize(fontFace.family, fontFace.weight);
            const isThemeRelated = this.isThemeRelatedFont(fontFace.family);
            
            this.assets.push({
              url: `font:${fontFace.family}`,
              size: estimatedSize,
              type: 'font',
              isThemeRelated,
            });
          } catch (error) {
            console.debug('Could not analyze font:', fontFace.family);
          }
        }
      }
    }

    // Collect images (theme-related icons, etc.)
    const images = Array.from(document.images);
    for (const img of images) {
      if (img.src && this.isThemeRelatedImage(img.src)) {
        try {
          const size = await this.getAssetSize(img.src);
          
          this.assets.push({
            url: img.src,
            size,
            type: 'other',
            isThemeRelated: true,
          });
        } catch (error) {
          console.debug('Could not analyze image:', img.src);
        }
      }
    }
  }

  /**
   * Get asset size via fetch
   */
  private async getAssetSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
      
      // Fallback: fetch the content and measure
      const fullResponse = await fetch(url);
      const content = await fullResponse.text();
      return new Blob([content]).size;
    } catch (error) {
      // Estimate based on URL or return 0
      return 0;
    }
  }

  /**
   * Check if asset is theme-related
   */
  private async isThemeRelatedAsset(url: string, type: 'css' | 'js'): Promise<boolean> {
    // Check URL for theme keywords
    const urlCheck = this.themeKeywords.some(keyword => 
      url.toLowerCase().includes(keyword)
    );
    
    if (urlCheck) return true;

    try {
      // Check content for theme keywords
      const response = await fetch(url);
      const content = await response.text();
      
      const contentCheck = this.themeKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );
      
      // For CSS, also check for custom properties
      if (type === 'css') {
        const hasCustomProperties = content.includes('--') || content.includes('var(');
        return contentCheck || hasCustomProperties;
      }
      
      return contentCheck;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if font is theme-related
   */
  private isThemeRelatedFont(fontFamily: string): boolean {
    const themeFonts = ['base neue', 'inter', 'system-ui'];
    return themeFonts.some(font => 
      fontFamily.toLowerCase().includes(font.toLowerCase())
    );
  }

  /**
   * Check if image is theme-related
   */
  private isThemeRelatedImage(src: string): boolean {
    const themeImageKeywords = ['icon', 'logo', 'theme', 'dark', 'light'];
    return themeImageKeywords.some(keyword => 
      src.toLowerCase().includes(keyword)
    );
  }

  /**
   * Estimate font file size
   */
  private estimateFontSize(family: string, weight: string): number {
    // Rough estimates based on typical font file sizes
    const baseSize = 50000; // 50KB base
    const weightMultiplier = weight === 'bold' || weight === '700' ? 1.2 : 1;
    const familyMultiplier = family.toLowerCase().includes('mono') ? 1.1 : 1;
    
    return Math.round(baseSize * weightMultiplier * familyMultiplier);
  }

  /**
   * Analyze theme-specific breakdown
   */
  private async analyzeThemeBreakdown(): Promise<BundleAnalysis['breakdown']> {
    let customProperties = 0;
    let themeComponents = 0;
    let animations = 0;
    let utilities = 0;

    const cssAssets = this.assets.filter(asset => asset.type === 'css');
    
    for (const asset of cssAssets) {
      try {
        const response = await fetch(asset.url);
        const content = await response.text();
        
        // Count custom properties
        const customPropMatches = content.match(/--[\w-]+\s*:/g);
        if (customPropMatches) {
          customProperties += customPropMatches.length * 20; // Estimate 20 bytes per property
        }
        
        // Count theme components
        const componentMatches = content.match(/\.(theme|dark|light|brand)[\w-]*\s*{/g);
        if (componentMatches) {
          themeComponents += componentMatches.length * 100; // Estimate 100 bytes per component
        }
        
        // Count animations
        const animationMatches = content.match(/@keyframes|animation:|transition:/g);
        if (animationMatches) {
          animations += animationMatches.length * 50; // Estimate 50 bytes per animation
        }
        
        // Count utilities
        const utilityMatches = content.match(/\.(bg|text|border)-(orange|grey|gray)[\w-]*/g);
        if (utilityMatches) {
          utilities += utilityMatches.length * 30; // Estimate 30 bytes per utility
        }
      } catch (error) {
        console.debug('Could not analyze CSS content:', asset.url);
      }
    }

    return {
      customProperties,
      themeComponents,
      animations,
      utilities,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(themeSize: number, breakdown: BundleAnalysis['breakdown']): string[] {
    const recommendations: string[] = [];
    
    // Size-based recommendations
    if (themeSize > 100000) { // 100KB
      recommendations.push('Theme bundle is large (>100KB). Consider code splitting.');
    }
    
    if (themeSize > 200000) { // 200KB
      recommendations.push('Theme bundle is very large (>200KB). Implement lazy loading for theme assets.');
    }

    // Component-based recommendations
    if (breakdown.customProperties > 5000) { // Estimated 250+ properties
      recommendations.push('High number of custom properties detected. Consider consolidation.');
    }
    
    if (breakdown.themeComponents > 10000) { // Estimated 100+ components
      recommendations.push('Many theme components detected. Consider component optimization.');
    }
    
    if (breakdown.animations > 2000) { // Estimated 40+ animations
      recommendations.push('Multiple animations detected. Consider reducing or optimizing animations.');
    }
    
    if (breakdown.utilities > 3000) { // Estimated 100+ utilities
      recommendations.push('Many theme utilities detected. Consider purging unused utilities.');
    }

    // Font recommendations
    const fontAssets = this.assets.filter(asset => asset.type === 'font' && asset.isThemeRelated);
    const totalFontSize = fontAssets.reduce((sum, asset) => sum + asset.size, 0);
    
    if (totalFontSize > 200000) { // 200KB
      recommendations.push('Font files are large. Consider font subsetting or variable fonts.');
    }
    
    if (fontAssets.length > 4) {
      recommendations.push('Multiple font files detected. Consider reducing font variants.');
    }

    // Performance recommendations
    const cssAssets = this.assets.filter(asset => asset.type === 'css');
    if (cssAssets.length > 3) {
      recommendations.push('Multiple CSS files detected. Consider bundling for better performance.');
    }

    // Caching recommendations
    recommendations.push('Ensure theme assets have proper cache headers for better performance.');
    
    // Tree shaking recommendations
    recommendations.push('Implement tree shaking to remove unused theme code.');

    return recommendations;
  }

  /**
   * Calculate optimization potential
   */
  private calculateOptimizationPotential(breakdown: BundleAnalysis['breakdown']): number {
    let potential = 0;
    
    // Estimate savings from various optimizations
    potential += breakdown.customProperties * 0.2; // 20% reduction from consolidation
    potential += breakdown.themeComponents * 0.15; // 15% reduction from optimization
    potential += breakdown.animations * 0.3; // 30% reduction from simplification
    potential += breakdown.utilities * 0.4; // 40% reduction from purging
    
    return Math.round(potential);
  }

  /**
   * Get detailed asset report
   */
  getAssetReport(): {
    byType: Record<string, { count: number; size: number }>;
    byThemeRelevance: { themeRelated: number; other: number };
    largestAssets: AssetInfo[];
    recommendations: string[];
  } {
    const byType: Record<string, { count: number; size: number }> = {};
    let themeRelated = 0;
    let other = 0;

    this.assets.forEach(asset => {
      if (!byType[asset.type]) {
        byType[asset.type] = { count: 0, size: 0 };
      }
      byType[asset.type].count++;
      byType[asset.type].size += asset.size;

      if (asset.isThemeRelated) {
        themeRelated += asset.size;
      } else {
        other += asset.size;
      }
    });

    const largestAssets = [...this.assets]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    const recommendations = [
      'Compress and minify all theme assets',
      'Use modern image formats (WebP, AVIF) for theme images',
      'Implement resource hints (preload, prefetch) for critical theme assets',
      'Consider using CSS-in-JS for dynamic theme properties',
      'Implement progressive loading for non-critical theme features',
    ];

    return {
      byType,
      byThemeRelevance: { themeRelated, other },
      largestAssets,
      recommendations,
    };
  }

  /**
   * Export analysis results
   */
  exportAnalysis(analysis: BundleAnalysis): string {
    return JSON.stringify({
      ...analysis,
      assetReport: this.getAssetReport(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }, null, 2);
  }

  /**
   * Clear cached data
   */
  clear(): void {
    this.assets = [];
  }
}

// Global instance
export const bundleSizeAnalyzer = new BundleSizeAnalyzer();

// Convenience functions
export const analyzeBundleSize = () => bundleSizeAnalyzer.analyzeBundleSize();
export const getAssetReport = () => bundleSizeAnalyzer.getAssetReport();

export default bundleSizeAnalyzer;