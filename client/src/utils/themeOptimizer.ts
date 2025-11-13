/**
 * Theme System Optimizer
 * Comprehensive optimization and performance enhancement for the theme system
 */

import { themePerformanceMonitor } from './themePerformanceMonitor';
import { cssOptimizer } from './cssOptimizer';
import { accessibilityAuditor } from './accessibilityAuditor';
import { bundleSizeAnalyzer } from './bundleSizeAnalyzer';

interface OptimizationResult {
  performance: {
    score: number;
    improvements: string[];
    metrics: any;
  };
  accessibility: {
    score: number;
    issues: number;
    compliance: boolean;
  };
  bundleSize: {
    totalSize: number;
    themeSize: number;
    optimizationPotential: number;
    recommendations: string[];
  };
  css: {
    propertiesCount: number;
    unusedCount: number;
    duplicatesCount: number;
    optimizations: string[];
  };
  overall: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
    criticalIssues: string[];
    recommendations: string[];
  };
}

class ThemeOptimizer {
  /**
   * Run comprehensive theme optimization analysis
   */
  async optimize(): Promise<OptimizationResult> {
    console.log('🚀 Starting comprehensive theme optimization...');
    
    // Run all analyses in parallel for better performance
    const [
      performanceMetrics,
      accessibilityReport,
      bundleAnalysis,
      cssAnalysis,
    ] = await Promise.all([
      this.analyzePerformance(),
      this.analyzeAccessibility(),
      this.analyzeBundleSize(),
      this.analyzeCSS(),
    ]);

    // Calculate overall score and grade
    const overall = this.calculateOverallScore({
      performance: performanceMetrics,
      accessibility: accessibilityReport,
      bundleSize: bundleAnalysis,
      css: cssAnalysis,
    });

    const result: OptimizationResult = {
      performance: performanceMetrics,
      accessibility: accessibilityReport,
      bundleSize: bundleAnalysis,
      css: cssAnalysis,
      overall,
    };

    console.log('✅ Theme optimization analysis complete');
    return result;
  }

  /**
   * Analyze performance metrics
   */
  private async analyzePerformance(): Promise<OptimizationResult['performance']> {
    const metrics = themePerformanceMonitor.getPerformanceSummary();
    const improvements: string[] = [];
    let score = 100;

    // Analyze theme switch performance
    if (metrics.themeSwitches.average > 300) {
      score -= 20;
      improvements.push('Optimize theme switching speed (currently ' + metrics.themeSwitches.average.toFixed(1) + 'ms)');
    } else if (metrics.themeSwitches.average > 200) {
      score -= 10;
      improvements.push('Consider further theme switching optimization');
    }

    // Analyze CSS update performance
    if (metrics.cssUpdates.average > 100) {
      score -= 15;
      improvements.push('Optimize CSS custom property updates');
    }

    // Analyze font loading
    if (metrics.fontLoading.successRate < 0.95) {
      score -= 15;
      improvements.push('Improve font loading reliability');
    }

    if (metrics.fontLoading.average > 3000) {
      score -= 10;
      improvements.push('Optimize font loading speed');
    }

    // Add general performance improvements
    if (score === 100) {
      improvements.push('Performance is excellent! Consider monitoring for regressions.');
    } else if (score >= 80) {
      improvements.push('Good performance with room for minor improvements');
    } else if (score >= 60) {
      improvements.push('Moderate performance issues detected');
    } else {
      improvements.push('Significant performance issues require attention');
    }

    return {
      score: Math.max(0, score),
      improvements,
      metrics,
    };
  }

  /**
   * Analyze accessibility compliance
   */
  private async analyzeAccessibility(): Promise<OptimizationResult['accessibility']> {
    const report = await accessibilityAuditor.runFullAudit();
    
    const compliance = report.score >= 90 && 
                      report.summary.errors === 0 && 
                      report.themeCompliance.lightMode;

    return {
      score: report.score,
      issues: report.summary.errors + report.summary.warnings,
      compliance,
    };
  }

  /**
   * Analyze bundle size
   */
  private async analyzeBundleSize(): Promise<OptimizationResult['bundleSize']> {
    const analysis = await bundleSizeAnalyzer.analyzeBundleSize();
    
    return {
      totalSize: analysis.totalSize,
      themeSize: analysis.themeSize,
      optimizationPotential: analysis.optimizationPotential,
      recommendations: analysis.recommendations,
    };
  }

  /**
   * Analyze CSS optimization opportunities
   */
  private async analyzeCSS(): Promise<OptimizationResult['css']> {
    const analysis = await cssOptimizer.analyzeCSSProperties();
    const optimizationResult = await cssOptimizer.optimizeCSS();
    
    return {
      propertiesCount: analysis.total,
      unusedCount: analysis.unused,
      duplicatesCount: analysis.duplicates,
      optimizations: optimizationResult.optimizations,
    };
  }

  /**
   * Calculate overall optimization score and grade
   */
  private calculateOverallScore(results: {
    performance: OptimizationResult['performance'];
    accessibility: OptimizationResult['accessibility'];
    bundleSize: OptimizationResult['bundleSize'];
    css: OptimizationResult['css'];
  }): OptimizationResult['overall'] {
    // Weighted scoring
    const performanceWeight = 0.3;
    const accessibilityWeight = 0.3;
    const bundleSizeWeight = 0.2;
    const cssWeight = 0.2;

    // Calculate bundle size score
    const bundleSizeScore = results.bundleSize.themeSize < 50000 ? 100 : 
                           results.bundleSize.themeSize < 100000 ? 80 :
                           results.bundleSize.themeSize < 200000 ? 60 : 40;

    // Calculate CSS score
    const cssScore = results.css.unusedCount === 0 && results.css.duplicatesCount === 0 ? 100 :
                    results.css.unusedCount < 10 && results.css.duplicatesCount < 5 ? 80 :
                    results.css.unusedCount < 20 && results.css.duplicatesCount < 10 ? 60 : 40;

    // Calculate weighted overall score
    const overallScore = Math.round(
      results.performance.score * performanceWeight +
      results.accessibility.score * accessibilityWeight +
      bundleSizeScore * bundleSizeWeight +
      cssScore * cssWeight
    );

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    else grade = 'F';

    // Generate summary
    const summary = this.generateSummary(overallScore, grade, results);

    // Identify critical issues
    const criticalIssues = this.identifyCriticalIssues(results);

    // Generate top recommendations
    const recommendations = this.generateTopRecommendations(results);

    return {
      score: overallScore,
      grade,
      summary,
      criticalIssues,
      recommendations,
    };
  }

  /**
   * Generate optimization summary
   */
  private generateSummary(score: number, grade: string, results: any): string {
    if (grade === 'A') {
      return 'Excellent theme system optimization! Your theme performs well across all metrics.';
    } else if (grade === 'B') {
      return 'Good theme optimization with minor areas for improvement.';
    } else if (grade === 'C') {
      return 'Moderate theme optimization. Several areas need attention for better performance.';
    } else if (grade === 'D') {
      return 'Poor theme optimization. Significant improvements needed for acceptable performance.';
    } else {
      return 'Critical theme optimization issues. Immediate attention required.';
    }
  }

  /**
   * Identify critical issues that need immediate attention
   */
  private identifyCriticalIssues(results: {
    performance: OptimizationResult['performance'];
    accessibility: OptimizationResult['accessibility'];
    bundleSize: OptimizationResult['bundleSize'];
    css: OptimizationResult['css'];
  }): string[] {
    const critical: string[] = [];

    // Performance critical issues
    if (results.performance.score < 60) {
      critical.push('Theme switching performance is critically slow');
    }

    // Accessibility critical issues
    if (!results.accessibility.compliance) {
      critical.push('Theme system fails accessibility compliance');
    }

    // Bundle size critical issues
    if (results.bundleSize.themeSize > 200000) {
      critical.push('Theme bundle size is critically large (>200KB)');
    }

    // CSS critical issues
    if (results.css.unusedCount > 50) {
      critical.push('Excessive unused CSS properties detected');
    }

    return critical;
  }

  /**
   * Generate top optimization recommendations
   */
  private generateTopRecommendations(results: {
    performance: OptimizationResult['performance'];
    accessibility: OptimizationResult['accessibility'];
    bundleSize: OptimizationResult['bundleSize'];
    css: OptimizationResult['css'];
  }): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (results.performance.score < 80) {
      recommendations.push('Implement theme switching debouncing and optimization');
    }

    // Accessibility recommendations
    if (results.accessibility.score < 90) {
      recommendations.push('Address accessibility issues for WCAG compliance');
    }

    // Bundle size recommendations
    if (results.bundleSize.themeSize > 100000) {
      recommendations.push('Implement code splitting for theme assets');
    }

    // CSS recommendations
    if (results.css.unusedCount > 10) {
      recommendations.push('Remove unused CSS custom properties');
    }

    if (results.css.duplicatesCount > 5) {
      recommendations.push('Consolidate duplicate CSS properties');
    }

    // General recommendations
    recommendations.push('Implement performance monitoring in production');
    recommendations.push('Set up automated accessibility testing');
    recommendations.push('Configure bundle size budgets in CI/CD');

    return recommendations.slice(0, 8); // Return top 8 recommendations
  }

  /**
   * Apply automatic optimizations where safe
   */
  async applyAutomaticOptimizations(): Promise<{
    applied: string[];
    skipped: string[];
    warnings: string[];
  }> {
    const applied: string[] = [];
    const skipped: string[] = [];
    const warnings: string[] = [];

    try {
      // Apply CSS optimizations
      const cssResult = await cssOptimizer.optimizeCSS();
      if (cssResult.optimizations.length > 0) {
        applied.push(...cssResult.optimizations);
      }

      // Apply performance optimizations
      if (themePerformanceMonitor.isActive()) {
        applied.push('Performance monitoring is active');
      } else {
        warnings.push('Performance monitoring is not active');
      }

      // Note: We skip potentially breaking optimizations
      skipped.push('Bundle splitting (requires build configuration)');
      skipped.push('Font subsetting (requires font processing)');
      skipped.push('CSS purging (requires usage analysis)');

    } catch (error) {
      warnings.push(`Optimization error: ${error}`);
    }

    return { applied, skipped, warnings };
  }

  /**
   * Generate optimization report
   */
  generateReport(result: OptimizationResult): string {
    const report = {
      summary: {
        score: result.overall.score,
        grade: result.overall.grade,
        description: result.overall.summary,
      },
      performance: {
        score: result.performance.score,
        themeSwitchSpeed: result.performance.metrics.themeSwitches.average,
        cssUpdateSpeed: result.performance.metrics.cssUpdates.average,
        fontLoadingSuccess: result.performance.metrics.fontLoading.successRate,
      },
      accessibility: {
        score: result.accessibility.score,
        compliance: result.accessibility.compliance,
        issues: result.accessibility.issues,
      },
      bundleSize: {
        total: this.formatBytes(result.bundleSize.totalSize),
        theme: this.formatBytes(result.bundleSize.themeSize),
        optimizationPotential: this.formatBytes(result.bundleSize.optimizationPotential),
      },
      css: {
        totalProperties: result.css.propertiesCount,
        unusedProperties: result.css.unusedCount,
        duplicateProperties: result.css.duplicatesCount,
      },
      criticalIssues: result.overall.criticalIssues,
      recommendations: result.overall.recommendations,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Global instance
export const themeOptimizer = new ThemeOptimizer();

// Convenience functions
export const optimizeTheme = () => themeOptimizer.optimize();
export const applyAutomaticOptimizations = () => themeOptimizer.applyAutomaticOptimizations();
export const generateOptimizationReport = (result: OptimizationResult) => themeOptimizer.generateReport(result);

export default themeOptimizer;