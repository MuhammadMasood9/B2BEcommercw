#!/usr/bin/env node

/**
 * Font Optimization Build Script
 * 
 * This script optimizes font loading for production builds by:
 * 1. Generating font preload hints
 * 2. Creating optimized font CSS
 * 3. Validating font file existence
 * 4. Generating font performance reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FontOptimizer {
  constructor() {
    this.fontDir = path.join(__dirname, '../public/fonts');
    this.outputDir = path.join(__dirname, '../dist/fonts');
    this.reportPath = path.join(__dirname, '../font-optimization-report.json');
    
    this.fontConfig = {
      'Base Neue': {
        weights: [400, 500, 600, 700],
        formats: ['woff2', 'woff'],
        critical: [400, 500, 600], // Critical weights to preload
        display: 'swap',
      },
      'Base Neue Mono': {
        weights: [400],
        formats: ['woff2', 'woff'],
        critical: [], // Not critical for initial render
        display: 'swap',
      }
    };
  }

  /**
   * Run the complete font optimization process
   */
  async optimize() {
    console.log('🔤 Starting font optimization...');
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        fontFiles: await this.validateFontFiles(),
        preloadHints: this.generatePreloadHints(),
        optimizedCSS: this.generateOptimizedCSS(),
        performanceMetrics: this.calculatePerformanceMetrics(),
        recommendations: this.generateRecommendations(),
      };

      await this.writeReport(report);
      await this.generateOptimizedFiles();
      
      console.log('✅ Font optimization completed successfully!');
      console.log(`📊 Report saved to: ${this.reportPath}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Font optimization failed:', error);
      throw error;
    }
  }

  /**
   * Validate that all expected font files exist
   */
  async validateFontFiles() {
    const fontFiles = {
      existing: [],
      missing: [],
      totalSize: 0,
    };

    for (const [family, config] of Object.entries(this.fontConfig)) {
      for (const weight of config.weights) {
        for (const format of config.formats) {
          const filename = this.getFontFilename(family, weight, format);
          const filepath = path.join(this.fontDir, filename);
          
          try {
            const stats = await fs.promises.stat(filepath);
            fontFiles.existing.push({
              family,
              weight,
              format,
              filename,
              size: stats.size,
              critical: config.critical.includes(weight),
            });
            fontFiles.totalSize += stats.size;
          } catch (error) {
            fontFiles.missing.push({
              family,
              weight,
              format,
              filename,
              critical: config.critical.includes(weight),
            });
          }
        }
      }
    }

    console.log(`📁 Found ${fontFiles.existing.length} font files`);
    console.log(`❌ Missing ${fontFiles.missing.length} font files`);
    console.log(`📦 Total font size: ${(fontFiles.totalSize / 1024).toFixed(2)} KB`);

    return fontFiles;
  }

  /**
   * Generate HTML preload hints for critical fonts
   */
  generatePreloadHints() {
    const preloadHints = [];

    for (const [family, config] of Object.entries(this.fontConfig)) {
      for (const weight of config.critical) {
        // Prioritize WOFF2 format
        const filename = this.getFontFilename(family, weight, 'woff2');
        
        preloadHints.push({
          href: `/fonts/${filename}`,
          as: 'font',
          type: 'font/woff2',
          crossorigin: 'anonymous',
          family,
          weight,
          html: `<link rel="preload" href="/fonts/${filename}" as="font" type="font/woff2" crossorigin>`,
        });
      }
    }

    console.log(`🚀 Generated ${preloadHints.length} preload hints`);
    return preloadHints;
  }

  /**
   * Generate optimized CSS for font loading
   */
  generateOptimizedCSS() {
    let css = '/* Optimized Font Loading CSS */\n\n';

    for (const [family, config] of Object.entries(this.fontConfig)) {
      for (const weight of config.weights) {
        const woff2File = this.getFontFilename(family, weight, 'woff2');
        const woffFile = this.getFontFilename(family, weight, 'woff');
        
        css += `@font-face {\n`;
        css += `  font-family: '${family}';\n`;
        css += `  src: url('/fonts/${woff2File}') format('woff2'),\n`;
        css += `       url('/fonts/${woffFile}') format('woff');\n`;
        css += `  font-weight: ${weight};\n`;
        css += `  font-style: normal;\n`;
        css += `  font-display: ${config.display};\n`;
        
        // Add font-feature-settings for better rendering
        if (family.includes('Mono')) {
          css += `  font-feature-settings: 'liga' 0, 'calt' 0;\n`;
        } else {
          css += `  font-feature-settings: 'kern' 1, 'liga' 1;\n`;
        }
        
        css += `}\n\n`;
      }
    }

    // Add font loading optimization utilities
    css += `/* Font Loading Optimization */\n`;
    css += `.font-loading {\n`;
    css += `  font-display: swap;\n`;
    css += `  font-variation-settings: normal;\n`;
    css += `}\n\n`;

    css += `.font-loaded {\n`;
    css += `  font-display: auto;\n`;
    css += `}\n\n`;

    // Add fallback font metrics matching
    css += `/* Fallback Font Metrics Matching */\n`;
    css += `@font-face {\n`;
    css += `  font-family: 'Base Neue Fallback';\n`;
    css += `  src: local('Inter'), local('system-ui');\n`;
    css += `  ascent-override: 90%;\n`;
    css += `  descent-override: 22%;\n`;
    css += `  line-gap-override: 0%;\n`;
    css += `  size-adjust: 107%;\n`;
    css += `}\n\n`;

    console.log(`🎨 Generated optimized CSS (${css.length} characters)`);
    return css;
  }

  /**
   * Calculate performance metrics and estimates
   */
  calculatePerformanceMetrics() {
    const metrics = {
      criticalFontSize: 0,
      totalFontSize: 0,
      estimatedLoadTime: {
        fast3G: 0,
        slow3G: 0,
        broadband: 0,
      },
      layoutShiftRisk: 'low',
      performanceScore: 0,
    };

    // Calculate font sizes (simulated if files don't exist)
    for (const [family, config] of Object.entries(this.fontConfig)) {
      for (const weight of config.weights) {
        const estimatedSize = this.estimateFontSize(family, weight);
        metrics.totalFontSize += estimatedSize;
        
        if (config.critical.includes(weight)) {
          metrics.criticalFontSize += estimatedSize;
        }
      }
    }

    // Estimate load times based on network speeds (bytes per second)
    const networkSpeeds = {
      slow3G: 50 * 1024,    // 50 KB/s
      fast3G: 200 * 1024,   // 200 KB/s
      broadband: 1.5 * 1024 * 1024, // 1.5 MB/s
    };

    for (const [network, speed] of Object.entries(networkSpeeds)) {
      metrics.estimatedLoadTime[network] = (metrics.criticalFontSize / speed) * 1000; // ms
    }

    // Calculate performance score
    metrics.performanceScore = this.calculatePerformanceScore(metrics);

    // Assess layout shift risk
    metrics.layoutShiftRisk = this.assessLayoutShiftRisk();

    console.log(`📊 Critical font size: ${(metrics.criticalFontSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Performance score: ${metrics.performanceScore}/100`);

    return metrics;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Check critical font size
    const criticalSize = this.estimateCriticalFontSize();
    if (criticalSize > 100 * 1024) { // 100KB threshold
      recommendations.push({
        type: 'warning',
        message: 'Critical font size exceeds 100KB. Consider reducing the number of critical font weights.',
        impact: 'high',
      });
    }

    // Check font format support
    recommendations.push({
      type: 'info',
      message: 'Using WOFF2 format for optimal compression and performance.',
      impact: 'medium',
    });

    // Check font-display strategy
    recommendations.push({
      type: 'success',
      message: 'Using font-display: swap for optimal loading performance.',
      impact: 'high',
    });

    // Check preloading strategy
    const criticalFonts = this.getCriticalFontCount();
    if (criticalFonts > 3) {
      recommendations.push({
        type: 'warning',
        message: `Preloading ${criticalFonts} fonts may impact performance. Consider reducing to 2-3 critical fonts.`,
        impact: 'medium',
      });
    }

    console.log(`💡 Generated ${recommendations.length} recommendations`);
    return recommendations;
  }

  /**
   * Generate optimized font files and configurations
   */
  async generateOptimizedFiles() {
    // Create optimized CSS file
    const optimizedCSS = this.generateOptimizedCSS();
    const cssPath = path.join(__dirname, '../public/fonts/optimized-fonts.css');
    
    try {
      await fs.promises.writeFile(cssPath, optimizedCSS, 'utf8');
      console.log(`✅ Generated optimized CSS: ${cssPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not write CSS file: ${error.message}`);
    }

    // Generate preload hints HTML
    const preloadHints = this.generatePreloadHints();
    const preloadHTML = preloadHints.map(hint => hint.html).join('\n');
    const htmlPath = path.join(__dirname, '../public/fonts/preload-hints.html');
    
    try {
      await fs.promises.writeFile(htmlPath, preloadHTML, 'utf8');
      console.log(`✅ Generated preload hints: ${htmlPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not write HTML file: ${error.message}`);
    }
  }

  /**
   * Write optimization report
   */
  async writeReport(report) {
    try {
      await fs.promises.writeFile(
        this.reportPath, 
        JSON.stringify(report, null, 2), 
        'utf8'
      );
    } catch (error) {
      console.warn(`⚠️ Could not write report: ${error.message}`);
    }
  }

  // Helper methods

  getFontFilename(family, weight, format) {
    const familySlug = family.toLowerCase().replace(/\s+/g, '-');
    const weightName = this.getWeightName(weight);
    return `${familySlug}-${weightName}.${format}`;
  }

  getWeightName(weight) {
    const weightNames = {
      400: 'regular',
      500: 'medium',
      600: 'semibold',
      700: 'bold',
    };
    return weightNames[weight] || weight.toString();
  }

  estimateFontSize(family, weight) {
    // Rough estimates based on typical font sizes
    const baseSizes = {
      'Base Neue': {
        400: 45 * 1024,  // 45KB
        500: 47 * 1024,  // 47KB
        600: 49 * 1024,  // 49KB
        700: 52 * 1024,  // 52KB
      },
      'Base Neue Mono': {
        400: 38 * 1024,  // 38KB
      },
    };

    return baseSizes[family]?.[weight] || 50 * 1024; // Default 50KB
  }

  estimateCriticalFontSize() {
    let size = 0;
    for (const [family, config] of Object.entries(this.fontConfig)) {
      for (const weight of config.critical) {
        size += this.estimateFontSize(family, weight);
      }
    }
    return size;
  }

  getCriticalFontCount() {
    let count = 0;
    for (const config of Object.values(this.fontConfig)) {
      count += config.critical.length;
    }
    return count;
  }

  calculatePerformanceScore(metrics) {
    let score = 100;

    // Deduct points for large critical font size
    if (metrics.criticalFontSize > 150 * 1024) score -= 30; // 150KB+
    else if (metrics.criticalFontSize > 100 * 1024) score -= 20; // 100KB+
    else if (metrics.criticalFontSize > 75 * 1024) score -= 10; // 75KB+

    // Deduct points for slow load times
    if (metrics.estimatedLoadTime.fast3G > 1000) score -= 20; // 1s+
    else if (metrics.estimatedLoadTime.fast3G > 500) score -= 10; // 500ms+

    return Math.max(0, score);
  }

  assessLayoutShiftRisk() {
    const criticalCount = this.getCriticalFontCount();
    
    if (criticalCount > 4) return 'high';
    if (criticalCount > 2) return 'medium';
    return 'low';
  }
}

// Run optimization if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('optimize-fonts.js');

if (isMainModule) {
  const optimizer = new FontOptimizer();
  optimizer.optimize()
    .then(report => {
      console.log('\n📊 Optimization Summary:');
      console.log(`   Critical fonts: ${(report.performanceMetrics.criticalFontSize / 1024).toFixed(2)} KB`);
      console.log(`   Performance score: ${report.performanceMetrics.performanceScore}/100`);
      console.log(`   Layout shift risk: ${report.performanceMetrics.layoutShiftRisk}`);
      console.log(`   Recommendations: ${report.recommendations.length}`);
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Font optimization failed:', error);
      process.exit(1);
    });
}

export default FontOptimizer;