/**
 * Theme Performance Monitor
 * Comprehensive performance monitoring and optimization for theme switching
 */

interface PerformanceMetrics {
  themeSwitch: {
    duration: number;
    timestamp: number;
    fromTheme: string;
    toTheme: string;
    transitionType: 'manual' | 'system' | 'initialization';
  };
  cssCustomProperties: {
    count: number;
    updateDuration: number;
    timestamp: number;
  };
  fontLoading: {
    duration: number;
    success: boolean;
    fontFamily: string;
    timestamp: number;
  };
  bundleSize: {
    themeCSS: number;
    totalCSS: number;
    timestamp: number;
  };
}

interface PerformanceThresholds {
  themeSwitchDuration: number; // Max 300ms
  cssUpdateDuration: number;   // Max 50ms
  fontLoadDuration: number;    // Max 3000ms
  bundleSizeLimit: number;     // Max 50KB for theme CSS
}

class ThemePerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = {
    themeSwitchDuration: 300,
    cssUpdateDuration: 50,
    fontLoadDuration: 3000,
    bundleSizeLimit: 51200, // 50KB
  };
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('Performance monitoring not available in this environment');
      return;
    }

    try {
      // Monitor paint timing for theme transitions
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint' || entry.name === 'largest-contentful-paint') {
            this.recordPaintMetric(entry);
          }
        });
      });

      paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      this.observers.push(paintObserver);

      // Monitor layout shifts during theme changes
      const layoutObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.hadRecentInput === false) {
            this.recordLayoutShift(entry as LayoutShift);
          }
        });
      });

      layoutObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutObserver);

      this.isMonitoring = true;
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  private activeSwitches = new Map<string, {
    id: string;
    fromTheme: string;
    toTheme: string;
    type: 'manual' | 'system' | 'initialization';
    startTime: number;
  }>();

  /**
   * Start monitoring a theme switch
   */
  startThemeSwitch(fromTheme: string, toTheme: string, type: 'manual' | 'system' | 'initialization' = 'manual'): string {
    const switchId = `theme-switch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (typeof performance !== 'undefined') {
      performance.mark(`${switchId}-start`);
    }

    // Store switch context for later measurement
    this.activeSwitches.set(switchId, {
      id: switchId,
      fromTheme,
      toTheme,
      type,
      startTime: performance.now(),
    });

    return switchId;
  }

  /**
   * End monitoring a theme switch
   */
  endThemeSwitch(switchId: string): void {
    const switchContext = this.activeSwitches.get(switchId);
    
    if (!switchContext) {
      // Silently ignore missing contexts to prevent console spam
      return;
    }

    const endTime = performance.now();
    const duration = endTime - switchContext.startTime;

    if (typeof performance !== 'undefined') {
      performance.mark(`${switchId}-end`);
      performance.measure(`${switchId}`, `${switchId}-start`, `${switchId}-end`);
    }

    // Record the metric
    this.recordThemeSwitchMetric({
      duration,
      timestamp: Date.now(),
      fromTheme: switchContext.fromTheme,
      toTheme: switchContext.toTheme,
      transitionType: switchContext.type,
    });

    // Check performance threshold
    if (duration > this.thresholds.themeSwitchDuration) {
      console.warn(`Theme switch took ${duration.toFixed(2)}ms, exceeding threshold of ${this.thresholds.themeSwitchDuration}ms`);
      this.reportPerformanceIssue('theme-switch-slow', { duration, threshold: this.thresholds.themeSwitchDuration });
    }

    // Clean up
    this.activeSwitches.delete(switchId);
  }

  /**
   * Monitor CSS custom property updates
   */
  monitorCSSPropertyUpdates(): void {
    // Temporarily disabled to prevent infinite loops
    return;
    
    const startTime = performance.now();
    
    // Count CSS custom properties
    const rootStyles = getComputedStyle(document.documentElement);
    let customPropertyCount = 0;
    
    // This is a simplified count - in practice, we'd need a more sophisticated method
    for (let i = 0; i < rootStyles.length; i++) {
      const property = rootStyles[i];
      if (property.startsWith('--')) {
        customPropertyCount++;
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.recordCSSPropertyMetric({
      count: customPropertyCount,
      updateDuration: duration,
      timestamp: Date.now(),
    });

    if (duration > this.thresholds.cssUpdateDuration) {
      console.warn(`CSS property update took ${duration.toFixed(2)}ms, exceeding threshold of ${this.thresholds.cssUpdateDuration}ms`);
    }
  }

  /**
   * Monitor font loading performance
   */
  monitorFontLoading(fontFamily: string): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      if ('fonts' in document) {
        document.fonts.load(`1em ${fontFamily}`).then(() => {
          const endTime = performance.now();
          const duration = endTime - startTime;

          this.recordFontLoadingMetric({
            duration,
            success: true,
            fontFamily,
            timestamp: Date.now(),
          });

          if (duration > this.thresholds.fontLoadDuration) {
            console.warn(`Font loading for ${fontFamily} took ${duration.toFixed(2)}ms, exceeding threshold of ${this.thresholds.fontLoadDuration}ms`);
          }

          resolve();
        }).catch(() => {
          const endTime = performance.now();
          const duration = endTime - startTime;

          this.recordFontLoadingMetric({
            duration,
            success: false,
            fontFamily,
            timestamp: Date.now(),
          });

          console.warn(`Font loading failed for ${fontFamily}`);
          resolve();
        });
      } else {
        // Fallback for browsers without Font Loading API
        setTimeout(() => {
          const endTime = performance.now();
          const duration = endTime - startTime;

          this.recordFontLoadingMetric({
            duration,
            success: true, // Assume success
            fontFamily,
            timestamp: Date.now(),
          });

          resolve();
        }, 100);
      }
    });
  }

  /**
   * Analyze bundle size impact
   */
  async analyzeBundleSize(): Promise<void> {
    try {
      // Get all stylesheets
      const stylesheets = Array.from(document.styleSheets);
      let totalCSS = 0;
      let themeCSS = 0;

      for (const stylesheet of stylesheets) {
        try {
          if (stylesheet.href) {
            const response = await fetch(stylesheet.href);
            const cssText = await response.text();
            const size = new Blob([cssText]).size;
            
            totalCSS += size;
            
            // Check if this is theme-related CSS
            if (cssText.includes('--brand-') || cssText.includes('theme') || cssText.includes('dark') || cssText.includes('light')) {
              themeCSS += size;
            }
          }
        } catch (error) {
          // Skip stylesheets we can't access (CORS, etc.)
          console.debug('Could not analyze stylesheet:', stylesheet.href);
        }
      }

      this.recordBundleSizeMetric({
        themeCSS,
        totalCSS,
        timestamp: Date.now(),
      });

      if (themeCSS > this.thresholds.bundleSizeLimit) {
        console.warn(`Theme CSS size (${(themeCSS / 1024).toFixed(2)}KB) exceeds threshold of ${(this.thresholds.bundleSizeLimit / 1024).toFixed(2)}KB`);
        this.reportPerformanceIssue('theme-bundle-large', { size: themeCSS, threshold: this.thresholds.bundleSizeLimit });
      }
    } catch (error) {
      console.warn('Failed to analyze bundle size:', error);
    }
  }

  /**
   * Record theme switch metric
   */
  private recordThemeSwitchMetric(metric: PerformanceMetrics['themeSwitch']): void {
    this.metrics.push({ themeSwitch: metric } as any);
    this.trimMetrics();
  }

  /**
   * Record CSS property metric
   */
  private recordCSSPropertyMetric(metric: PerformanceMetrics['cssCustomProperties']): void {
    this.metrics.push({ cssCustomProperties: metric } as any);
    this.trimMetrics();
  }

  /**
   * Record font loading metric
   */
  private recordFontLoadingMetric(metric: PerformanceMetrics['fontLoading']): void {
    this.metrics.push({ fontLoading: metric } as any);
    this.trimMetrics();
  }

  /**
   * Record bundle size metric
   */
  private recordBundleSizeMetric(metric: PerformanceMetrics['bundleSize']): void {
    this.metrics.push({ bundleSize: metric } as any);
    this.trimMetrics();
  }

  /**
   * Record paint metric
   */
  private recordPaintMetric(entry: PerformanceEntry): void {
    console.debug(`Paint metric: ${entry.name} at ${entry.startTime.toFixed(2)}ms`);
  }

  /**
   * Record layout shift
   */
  private recordLayoutShift(entry: LayoutShift): void {
    if (entry.value > 0.1) { // Significant layout shift
      console.warn(`Layout shift detected: ${entry.value.toFixed(4)} at ${entry.startTime.toFixed(2)}ms`);
      this.reportPerformanceIssue('layout-shift', { value: entry.value, time: entry.startTime });
    }
  }

  /**
   * Report performance issue
   */
  private reportPerformanceIssue(type: string, data: any): void {
    // In a real application, this would send data to analytics
    console.group(`🚨 Performance Issue: ${type}`);
    console.log('Data:', data);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  /**
   * Trim metrics to prevent memory leaks
   */
  private trimMetrics(): void {
    const maxMetrics = 100;
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    themeSwitches: { average: number; count: number; slowest: number };
    cssUpdates: { average: number; count: number };
    fontLoading: { average: number; successRate: number };
    bundleSize: { current: number; trend: string };
  } {
    const themeSwitchMetrics = this.metrics.filter(m => 'themeSwitch' in m).map(m => m.themeSwitch);
    const cssMetrics = this.metrics.filter(m => 'cssCustomProperties' in m).map(m => m.cssCustomProperties);
    const fontMetrics = this.metrics.filter(m => 'fontLoading' in m).map(m => m.fontLoading);
    const bundleMetrics = this.metrics.filter(m => 'bundleSize' in m).map(m => m.bundleSize);

    return {
      themeSwitches: {
        average: themeSwitchMetrics.length > 0 
          ? themeSwitchMetrics.reduce((sum, m) => sum + m.duration, 0) / themeSwitchMetrics.length 
          : 0,
        count: themeSwitchMetrics.length,
        slowest: themeSwitchMetrics.length > 0 
          ? Math.max(...themeSwitchMetrics.map(m => m.duration)) 
          : 0,
      },
      cssUpdates: {
        average: cssMetrics.length > 0 
          ? cssMetrics.reduce((sum, m) => sum + m.updateDuration, 0) / cssMetrics.length 
          : 0,
        count: cssMetrics.length,
      },
      fontLoading: {
        average: fontMetrics.length > 0 
          ? fontMetrics.reduce((sum, m) => sum + m.duration, 0) / fontMetrics.length 
          : 0,
        successRate: fontMetrics.length > 0 
          ? fontMetrics.filter(m => m.success).length / fontMetrics.length 
          : 0,
      },
      bundleSize: {
        current: bundleMetrics.length > 0 ? bundleMetrics[bundleMetrics.length - 1].themeCSS : 0,
        trend: bundleMetrics.length > 1 
          ? bundleMetrics[bundleMetrics.length - 1].themeCSS > bundleMetrics[bundleMetrics.length - 2].themeCSS 
            ? 'increasing' 
            : 'decreasing'
          : 'stable',
      },
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      thresholds: this.thresholds,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now(),
    }, null, 2);
  }

  /**
   * Cleanup monitoring
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.activeSwitches.clear();
    this.isMonitoring = false;
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Global instance
export const themePerformanceMonitor = new ThemePerformanceMonitor();

// Convenience functions
export const startThemeSwitch = (fromTheme: string, toTheme: string, type?: 'manual' | 'system' | 'initialization') => 
  themePerformanceMonitor.startThemeSwitch(fromTheme, toTheme, type);

export const endThemeSwitch = (switchId: string) => 
  themePerformanceMonitor.endThemeSwitch(switchId);

export const monitorCSSUpdates = () => 
  themePerformanceMonitor.monitorCSSPropertyUpdates();

export const monitorFontLoading = (fontFamily: string) => 
  themePerformanceMonitor.monitorFontLoading(fontFamily);

export const analyzeBundleSize = () => 
  themePerformanceMonitor.analyzeBundleSize();

export const getPerformanceSummary = () => 
  themePerformanceMonitor.getPerformanceSummary();

export default themePerformanceMonitor;