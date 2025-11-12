/**
 * Optimized Font Loading Strategy for Base Neue
 * 
 * This utility implements an efficient font loading strategy that:
 * 1. Preloads critical font weights
 * 2. Uses font-display: swap for performance
 * 3. Provides fallback font handling
 * 4. Monitors Core Web Vitals impact
 * 5. Handles font loading errors gracefully
 */

interface FontLoadingMetrics {
  fontLoadStart: number;
  fontLoadEnd: number;
  fontLoadDuration: number;
  fontsLoaded: string[];
  fontsFailed: string[];
  cumulativeLayoutShift: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

class FontLoader {
  private metrics: FontLoadingMetrics = {
    fontLoadStart: 0,
    fontLoadEnd: 0,
    fontLoadDuration: 0,
    fontsLoaded: [],
    fontsFailed: [],
    cumulativeLayoutShift: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
  };

  private fontFaces: FontFace[] = [];
  private loadingPromises: Promise<void>[] = [];

  /**
   * Critical font weights that should be loaded immediately
   * Using system fonts as Base Neue fonts are not available
   */
  private criticalFonts = [
    {
      family: 'Inter',
      weight: '400',
      style: 'normal',
      url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      fallback: 'system-ui, -apple-system, sans-serif',
    },
    {
      family: 'Base Neue',
      weight: '500',
      style: 'normal',
      url: '/fonts/base-neue-medium.woff2',
      fallback: '/fonts/base-neue-medium.woff',
    },
    {
      family: 'Base Neue',
      weight: '600',
      style: 'normal',
      url: '/fonts/base-neue-semibold.woff2',
      fallback: '/fonts/base-neue-semibold.woff',
    },
  ];

  /**
   * Non-critical font weights that can be loaded later
   */
  private nonCriticalFonts = [
    {
      family: 'Base Neue',
      weight: '700',
      style: 'normal',
      url: '/fonts/base-neue-bold.woff2',
      fallback: '/fonts/base-neue-bold.woff',
    },
    {
      family: 'Base Neue Mono',
      weight: '400',
      style: 'normal',
      url: '/fonts/base-neue-mono-regular.woff2',
      fallback: '/fonts/base-neue-mono-regular.woff',
    },
  ];

  /**
   * Initialize font loading with performance monitoring
   */
  async initialize(): Promise<void> {
    this.metrics.fontLoadStart = performance.now();

    try {
      // Check if FontFace API is supported
      if (!('FontFace' in window)) {
        console.warn('FontFace API not supported, falling back to CSS font loading');
        this.handleFallbackFontLoading();
        return;
      }

      // Load critical fonts first
      await this.loadCriticalFonts();

      // Load non-critical fonts after critical ones are loaded
      this.loadNonCriticalFonts();

      // Monitor Core Web Vitals
      this.monitorWebVitals();

    } catch (error) {
      console.error('Font loading failed:', error);
      this.handleFontLoadingError(error);
    }
  }

  /**
   * Load critical fonts with high priority
   */
  private async loadCriticalFonts(): Promise<void> {
    const loadPromises = this.criticalFonts.map(font => this.loadFont(font, true));

    try {
      await Promise.allSettled(loadPromises);
      this.metrics.fontLoadEnd = performance.now();
      this.metrics.fontLoadDuration = this.metrics.fontLoadEnd - this.metrics.fontLoadStart;

      console.log(`Critical fonts loaded in ${this.metrics.fontLoadDuration.toFixed(2)}ms`);
    } catch (error) {
      console.error('Critical font loading failed:', error);
    }
  }

  /**
   * Load non-critical fonts with lower priority
   */
  private loadNonCriticalFonts(): void {
    // Use requestIdleCallback to load non-critical fonts when browser is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.nonCriticalFonts.forEach(font => this.loadFont(font, false));
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.nonCriticalFonts.forEach(font => this.loadFont(font, false));
      }, 100);
    }
  }

  /**
   * Load individual font with error handling and fallbacks
   */
  private async loadFont(fontConfig: any, isCritical: boolean): Promise<void> {
    try {
      // Try loading WOFF2 first (better compression)
      let fontFace = new FontFace(
        fontConfig.family,
        `url(${fontConfig.url}) format('woff2')`,
        {
          weight: fontConfig.weight,
          style: fontConfig.style,
          display: 'swap', // Use swap for better performance
        }
      );

      await fontFace.load();
      document.fonts.add(fontFace);
      this.fontFaces.push(fontFace);
      this.metrics.fontsLoaded.push(`${fontConfig.family} ${fontConfig.weight}`);

      console.log(`✓ Loaded: ${fontConfig.family} ${fontConfig.weight}`);

    } catch (error) {
      console.warn(`Failed to load ${fontConfig.family} ${fontConfig.weight} WOFF2, trying WOFF fallback`);

      try {
        // Fallback to WOFF format
        let fontFace = new FontFace(
          fontConfig.family,
          `url(${fontConfig.fallback}) format('woff')`,
          {
            weight: fontConfig.weight,
            style: fontConfig.style,
            display: 'swap',
          }
        );

        await fontFace.load();
        document.fonts.add(fontFace);
        this.fontFaces.push(fontFace);
        this.metrics.fontsLoaded.push(`${fontConfig.family} ${fontConfig.weight} (WOFF fallback)`);

        console.log(`✓ Loaded fallback: ${fontConfig.family} ${fontConfig.weight}`);

      } catch (fallbackError) {
        this.metrics.fontsFailed.push(`${fontConfig.family} ${fontConfig.weight}`);
        console.error(`Failed to load ${fontConfig.family} ${fontConfig.weight}:`, fallbackError);

        if (isCritical) {
          // For critical fonts, ensure fallback fonts are properly applied
          this.applyFallbackFont(fontConfig.family);
        }
      }
    }
  }

  /**
   * Apply fallback font when Base Neue fails to load
   */
  private applyFallbackFont(fontFamily: string): void {
    const fallbackFonts = fontFamily === 'Base Neue Mono'
      ? 'DM Sans, Consolas, Monaco, monospace'
      : 'Inter, system-ui, -apple-system, sans-serif';

    // Update CSS custom property for fallback
    document.documentElement.style.setProperty(
      '--font-sans',
      fallbackFonts
    );

    console.log(`Applied fallback fonts for ${fontFamily}: ${fallbackFonts}`);
  }

  /**
   * Handle font loading for browsers without FontFace API
   */
  private handleFallbackFontLoading(): void {
    // Create a style element with font-face declarations
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Base Neue';
        src: url('/fonts/base-neue-regular.woff2') format('woff2'),
             url('/fonts/base-neue-regular.woff') format('woff');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Base Neue';
        src: url('/fonts/base-neue-medium.woff2') format('woff2'),
             url('/fonts/base-neue-medium.woff') format('woff');
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Base Neue';
        src: url('/fonts/base-neue-semibold.woff2') format('woff2'),
             url('/fonts/base-neue-semibold.woff') format('woff');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Monitor Core Web Vitals impact of font loading
   */
  private monitorWebVitals(): void {
    // Monitor Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              this.metrics.cumulativeLayoutShift += (entry as any).value;
            }
          }
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Monitor paint metrics
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            } else if (entry.name === 'largest-contentful-paint') {
              this.metrics.largestContentfulPaint = entry.startTime;
            }
          }
        });

        paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }

  /**
   * Handle font loading errors gracefully
   */
  private handleFontLoadingError(error: any): void {
    console.error('Font loading system error:', error);

    // Ensure fallback fonts are applied
    document.documentElement.style.setProperty(
      '--font-sans',
      'Inter, system-ui, -apple-system, sans-serif'
    );

    // Add error class to body for CSS fallback handling
    document.body.classList.add('font-loading-error');
  }

  /**
   * Get font loading metrics for performance analysis
   */
  getMetrics(): FontLoadingMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if critical fonts are loaded
   */
  areCriticalFontsLoaded(): boolean {
    const criticalFontNames = this.criticalFonts.map(f => `${f.family} ${f.weight}`);
    return criticalFontNames.every(name =>
      this.metrics.fontsLoaded.some(loaded => loaded.includes(name))
    );
  }

  /**
   * Preload additional font weights on demand
   */
  async preloadFont(family: string, weight: string, url: string): Promise<void> {
    try {
      const fontFace = new FontFace(family, `url(${url})`, {
        weight,
        display: 'swap',
      });

      await fontFace.load();
      document.fonts.add(fontFace);

      console.log(`✓ Preloaded: ${family} ${weight}`);
    } catch (error) {
      console.error(`Failed to preload ${family} ${weight}:`, error);
    }
  }
}

// Create singleton instance
export const fontLoader = new FontLoader();

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => fontLoader.initialize());
  } else {
    fontLoader.initialize();
  }
}

export default fontLoader;