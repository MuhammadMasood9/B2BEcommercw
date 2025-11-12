/**
 * System Font Loader
 * Simple font loader that uses system fonts for better performance and reliability
 */

interface FontMetrics {
  loadStart: number;
  loadEnd: number;
  duration: number;
}

class SystemFontLoader {
  private metrics: FontMetrics = {
    loadStart: 0,
    loadEnd: 0,
    duration: 0,
  };

  /**
   * Initialize system fonts - no loading required
   */
  async initialize(): Promise<void> {
    this.metrics.loadStart = performance.now();
    
    try {
      // Apply system font stack to document
      this.applySystemFonts();
      
      this.metrics.loadEnd = performance.now();
      this.metrics.duration = this.metrics.loadEnd - this.metrics.loadStart;
      
      console.log(`System fonts applied in ${this.metrics.duration.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('System font initialization failed:', error);
    }
  }

  /**
   * Apply system font stack to document
   */
  private applySystemFonts(): void {
    const root = document.documentElement;
    
    // Set CSS custom properties for system fonts
    root.style.setProperty('--font-sans', 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
    root.style.setProperty('--font-serif', 'Georgia, "Times New Roman", serif');
    root.style.setProperty('--font-mono', 'Consolas, Monaco, "Courier New", monospace');
    
    // Apply to body as well for immediate effect
    document.body.style.fontFamily = 'var(--font-sans)';
  }

  /**
   * Get font loading metrics
   */
  getMetrics(): FontMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if fonts are ready (always true for system fonts)
   */
  isReady(): boolean {
    return true;
  }
}

// Create and export singleton instance
export const systemFontLoader = new SystemFontLoader();

// Initialize on module load
if (typeof window !== 'undefined') {
  systemFontLoader.initialize();
}

export default systemFontLoader;