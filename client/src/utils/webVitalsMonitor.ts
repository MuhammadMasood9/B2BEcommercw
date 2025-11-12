/**
 * Core Web Vitals Monitoring for Font and CSS Performance
 * 
 * This utility monitors the impact of font loading and CSS optimizations
 * on Core Web Vitals metrics:
 * 1. Largest Contentful Paint (LCP)
 * 2. First Input Delay (FID)
 * 3. Cumulative Layout Shift (CLS)
 * 4. First Contentful Paint (FCP)
 * 5. Time to Interactive (TTI)
 */

interface WebVitalsMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Additional Performance Metrics
  fcp: number | null; // First Contentful Paint
  tti: number | null; // Time to Interactive
  tbt: number; // Total Blocking Time
  
  // Font-specific metrics
  fontLoadTime: number;
  fontLayoutShift: number;
  fontRenderTime: number;
  
  // CSS-specific metrics
  cssLoadTime: number;
  cssRenderTime: number;
  criticalCSSTime: number;
  
  // Overall scores
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
}

interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  tti: { good: number; needsImprovement: number };
}

class WebVitalsMonitor {
  private metrics: WebVitalsMetrics = {
    lcp: null,
    fid: null,
    cls: 0,
    fcp: null,
    tti: null,
    tbt: 0,
    fontLoadTime: 0,
    fontLayoutShift: 0,
    fontRenderTime: 0,
    cssLoadTime: 0,
    cssRenderTime: 0,
    criticalCSSTime: 0,
    performanceScore: 0,
    accessibilityScore: 0,
    bestPracticesScore: 0,
  };

  private thresholds: PerformanceThresholds = {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
    tti: { good: 3800, needsImprovement: 7300 },
  };

  private observers: PerformanceObserver[] = [];
  private startTime: number = performance.now();

  /**
   * Initialize Web Vitals monitoring
   */
  initialize(): void {
    console.log('🔍 Initializing Web Vitals monitoring...');
    
    try {
      this.monitorLCP();
      this.monitorFID();
      this.monitorCLS();
      this.monitorFCP();
      this.monitorTTI();
      this.monitorLongTasks();
      this.monitorFontPerformance();
      this.monitorCSSPerformance();
      
      // Generate report after page load
      window.addEventListener('load', () => {
        setTimeout(() => this.generateReport(), 5000);
      });
      
    } catch (error) {
      console.error('Web Vitals monitoring initialization failed:', error);
    }
  }

  /**
   * Monitor Largest Contentful Paint (LCP)
   */
  private monitorLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.metrics.lcp = lastEntry.startTime;
        console.log(`📊 LCP: ${this.metrics.lcp.toFixed(2)}ms`);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP monitoring not supported:', error);
    }
  }

  /**
   * Monitor First Input Delay (FID)
   */
  private monitorFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.fid = (entry as any).processingStart - entry.startTime;
          console.log(`📊 FID: ${this.metrics.fid.toFixed(2)}ms`);
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID monitoring not supported:', error);
    }
  }

  /**
   * Monitor Cumulative Layout Shift (CLS)
   */
  private monitorCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          
          // Only count layout shifts without recent user input
          if (!layoutShift.hadRecentInput) {
            this.metrics.cls += layoutShift.value;
            
            // Track font-related layout shifts
            if (this.isFontRelatedLayoutShift(layoutShift)) {
              this.metrics.fontLayoutShift += layoutShift.value;
            }
          }
        }
        
        console.log(`📊 CLS: ${this.metrics.cls.toFixed(4)}`);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS monitoring not supported:', error);
    }
  }

  /**
   * Monitor First Contentful Paint (FCP)
   */
  private monitorFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            console.log(`📊 FCP: ${this.metrics.fcp.toFixed(2)}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP monitoring not supported:', error);
    }
  }

  /**
   * Monitor Time to Interactive (TTI)
   */
  private monitorTTI(): void {
    // TTI is complex to calculate, we'll use a simplified approach
    // based on when long tasks stop occurring
    
    let lastLongTaskEnd = 0;
    let interactiveTime = null;

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const task = entry as any;
            if (task.duration > 50) { // Long task threshold
              lastLongTaskEnd = task.startTime + task.duration;
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);

        // Check for TTI after FCP
        setTimeout(() => {
          if (this.metrics.fcp && !interactiveTime) {
            // TTI is approximately when long tasks stop after FCP
            interactiveTime = Math.max(this.metrics.fcp, lastLongTaskEnd);
            this.metrics.tti = interactiveTime;
            console.log(`📊 TTI: ${this.metrics.tti.toFixed(2)}ms`);
          }
        }, 5000);
        
      } catch (error) {
        console.warn('TTI monitoring not supported:', error);
      }
    }
  }

  /**
   * Monitor long tasks that block the main thread
   */
  private monitorLongTasks(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const task = entry as any;
          this.metrics.tbt += Math.max(0, task.duration - 50);
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task monitoring not supported:', error);
    }
  }

  /**
   * Monitor font-specific performance metrics
   */
  private monitorFontPerformance(): void {
    const fontLoadStart = performance.now();
    
    // Monitor font loading via document.fonts API
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        this.metrics.fontLoadTime = performance.now() - fontLoadStart;
        console.log(`🔤 Font load time: ${this.metrics.fontLoadTime.toFixed(2)}ms`);
      });

      // Monitor individual font loads
      document.fonts.addEventListener('loadingdone', (event) => {
        console.log(`✓ Font loaded: ${event.fontface?.family} ${event.fontface?.weight}`);
      });

      document.fonts.addEventListener('loadingerror', (event) => {
        console.error(`❌ Font failed to load: ${event.fontface?.family} ${event.fontface?.weight}`);
      });
    }

    // Monitor font render timing
    const checkFontRender = () => {
      const testElement = document.createElement('div');
      testElement.style.fontFamily = 'Base Neue, Inter, sans-serif';
      testElement.style.fontSize = '16px';
      testElement.textContent = 'Test';
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      
      document.body.appendChild(testElement);
      
      const renderStart = performance.now();
      const computedStyle = window.getComputedStyle(testElement);
      const fontFamily = computedStyle.fontFamily;
      
      this.metrics.fontRenderTime = performance.now() - renderStart;
      
      document.body.removeChild(testElement);
      
      console.log(`🎨 Font render time: ${this.metrics.fontRenderTime.toFixed(2)}ms`);
      console.log(`🔤 Active font family: ${fontFamily}`);
    };

    // Check font rendering after a short delay
    setTimeout(checkFontRender, 100);
  }

  /**
   * Monitor CSS-specific performance metrics
   */
  private monitorCSSPerformance(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          if (resource.name.includes('.css')) {
            this.metrics.cssLoadTime += resource.duration;
            
            // Track critical CSS (inline styles)
            if (resource.name.includes('critical') || resource.transferSize < 5000) {
              this.metrics.criticalCSSTime += resource.duration;
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CSS performance monitoring not supported:', error);
    }
  }

  /**
   * Check if a layout shift is font-related
   */
  private isFontRelatedLayoutShift(layoutShift: any): boolean {
    // This is a heuristic - layout shifts that occur during font loading
    // are likely font-related if they happen within the first few seconds
    const timeSinceStart = layoutShift.startTime;
    return timeSinceStart < 3000; // First 3 seconds
  }

  /**
   * Calculate performance scores based on thresholds
   */
  private calculateScores(): void {
    // Performance Score (based on Core Web Vitals)
    let performanceScore = 0;
    let scoreCount = 0;

    if (this.metrics.lcp !== null) {
      if (this.metrics.lcp <= this.thresholds.lcp.good) {
        performanceScore += 100;
      } else if (this.metrics.lcp <= this.thresholds.lcp.needsImprovement) {
        performanceScore += 75;
      } else {
        performanceScore += 50;
      }
      scoreCount++;
    }

    if (this.metrics.fid !== null) {
      if (this.metrics.fid <= this.thresholds.fid.good) {
        performanceScore += 100;
      } else if (this.metrics.fid <= this.thresholds.fid.needsImprovement) {
        performanceScore += 75;
      } else {
        performanceScore += 50;
      }
      scoreCount++;
    }

    if (this.metrics.cls <= this.thresholds.cls.good) {
      performanceScore += 100;
    } else if (this.metrics.cls <= this.thresholds.cls.needsImprovement) {
      performanceScore += 75;
    } else {
      performanceScore += 50;
    }
    scoreCount++;

    this.metrics.performanceScore = scoreCount > 0 ? performanceScore / scoreCount : 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): WebVitalsMetrics {
    this.calculateScores();
    return { ...this.metrics };
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): string {
    this.calculateScores();
    
    const formatMetric = (value: number | null, unit: string = 'ms'): string => {
      return value !== null ? `${value.toFixed(2)}${unit}` : 'N/A';
    };

    const getScoreEmoji = (value: number | null, thresholds: any): string => {
      if (value === null) return '❓';
      if (value <= thresholds.good) return '🟢';
      if (value <= thresholds.needsImprovement) return '🟡';
      return '🔴';
    };

    const report = `
🚀 Web Vitals Performance Report
================================

📊 Core Web Vitals:
${getScoreEmoji(this.metrics.lcp, this.thresholds.lcp)} LCP (Largest Contentful Paint): ${formatMetric(this.metrics.lcp)}
${getScoreEmoji(this.metrics.fid, this.thresholds.fid)} FID (First Input Delay): ${formatMetric(this.metrics.fid)}
${getScoreEmoji(this.metrics.cls, this.thresholds.cls)} CLS (Cumulative Layout Shift): ${formatMetric(this.metrics.cls, '')}

📈 Additional Metrics:
${getScoreEmoji(this.metrics.fcp, this.thresholds.fcp)} FCP (First Contentful Paint): ${formatMetric(this.metrics.fcp)}
${getScoreEmoji(this.metrics.tti, this.thresholds.tti)} TTI (Time to Interactive): ${formatMetric(this.metrics.tti)}
⏱️ TBT (Total Blocking Time): ${formatMetric(this.metrics.tbt)}

🔤 Font Performance:
⏱️ Font Load Time: ${formatMetric(this.metrics.fontLoadTime)}
📐 Font Layout Shift: ${formatMetric(this.metrics.fontLayoutShift, '')}
🎨 Font Render Time: ${formatMetric(this.metrics.fontRenderTime)}

🎨 CSS Performance:
⏱️ CSS Load Time: ${formatMetric(this.metrics.cssLoadTime)}
⚡ Critical CSS Time: ${formatMetric(this.metrics.criticalCSSTime)}

📊 Overall Scores:
🏆 Performance Score: ${this.metrics.performanceScore.toFixed(1)}/100

💡 Recommendations:
${this.generateRecommendations()}
    `;

    console.log(report);
    return report;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string {
    const recommendations: string[] = [];

    if (this.metrics.lcp && this.metrics.lcp > this.thresholds.lcp.good) {
      recommendations.push('• Optimize LCP by reducing image sizes and improving server response times');
    }

    if (this.metrics.fid && this.metrics.fid > this.thresholds.fid.good) {
      recommendations.push('• Reduce FID by minimizing JavaScript execution time');
    }

    if (this.metrics.cls > this.thresholds.cls.good) {
      recommendations.push('• Reduce CLS by setting dimensions for images and avoiding dynamic content insertion');
    }

    if (this.metrics.fontLoadTime > 1000) {
      recommendations.push('• Optimize font loading by preloading critical fonts and using font-display: swap');
    }

    if (this.metrics.fontLayoutShift > 0.05) {
      recommendations.push('• Reduce font-related layout shift by using fallback fonts with similar metrics');
    }

    if (this.metrics.cssLoadTime > 500) {
      recommendations.push('• Optimize CSS delivery by inlining critical CSS and lazy loading non-critical styles');
    }

    if (recommendations.length === 0) {
      recommendations.push('• Great job! All metrics are within acceptable ranges');
    }

    return recommendations.join('\n');
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => webVitalsMonitor.initialize());
  } else {
    webVitalsMonitor.initialize();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => webVitalsMonitor.cleanup());
}

export default webVitalsMonitor;