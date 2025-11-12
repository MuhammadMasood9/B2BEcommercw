/**
 * Theme Performance Tests
 * Comprehensive performance testing for the theme system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { themePerformanceMonitor } from '../../client/src/utils/themePerformanceMonitor';
import { cssOptimizer } from '../../client/src/utils/cssOptimizer';
import { accessibilityAuditor } from '../../client/src/utils/accessibilityAuditor';
import { themeOptimizer } from '../../client/src/utils/themeOptimizer';

// Mock DOM APIs
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
};

const mockDocument = {
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
    },
    style: {
      colorScheme: '',
    },
  },
  styleSheets: [],
  querySelectorAll: vi.fn(() => []),
  querySelector: vi.fn(() => null),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
};

const mockWindow = {
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  PerformanceObserver: vi.fn(),
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
};

// Setup global mocks
beforeEach(() => {
  global.performance = mockPerformance as any;
  global.document = mockDocument as any;
  global.window = mockWindow as any;
  
  // Reset all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup
  themePerformanceMonitor.cleanup();
});

describe('Theme Performance Monitor', () => {
  it('should initialize monitoring correctly', () => {
    expect(themePerformanceMonitor.isActive()).toBe(true);
  });

  it('should track theme switch performance', () => {
    const switchId = themePerformanceMonitor.startThemeSwitch('light', 'dark', 'manual');
    expect(switchId).toBeDefined();
    expect(mockPerformance.mark).toHaveBeenCalledWith(`${switchId}-start`);
    
    // Simulate theme switch completion
    themePerformanceMonitor.endThemeSwitch(switchId);
    expect(mockPerformance.mark).toHaveBeenCalledWith(`${switchId}-end`);
    expect(mockPerformance.measure).toHaveBeenCalled();
  });

  it('should monitor CSS property updates', () => {
    mockDocument.querySelectorAll.mockReturnValue([
      { style: { length: 2, 0: '--color-primary', 1: '--color-secondary' } }
    ] as any);
    
    expect(() => {
      themePerformanceMonitor.monitorCSSPropertyUpdates();
    }).not.toThrow();
  });

  it('should monitor font loading', async () => {
    const fontFamily = 'Base Neue';
    
    // Mock successful font loading
    global.document.fonts = {
      load: vi.fn().mockResolvedValue(undefined),
    } as any;
    
    await expect(
      themePerformanceMonitor.monitorFontLoading(fontFamily)
    ).resolves.toBeUndefined();
  });

  it('should provide performance summary', () => {
    const summary = themePerformanceMonitor.getPerformanceSummary();
    
    expect(summary).toHaveProperty('themeSwitches');
    expect(summary).toHaveProperty('cssUpdates');
    expect(summary).toHaveProperty('fontLoading');
    expect(summary).toHaveProperty('bundleSize');
    
    expect(summary.themeSwitches).toHaveProperty('average');
    expect(summary.themeSwitches).toHaveProperty('count');
    expect(summary.themeSwitches).toHaveProperty('slowest');
  });

  it('should handle performance thresholds', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock slow theme switch
    const switchId = themePerformanceMonitor.startThemeSwitch('light', 'dark', 'manual');
    
    // Simulate slow performance
    mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(500); // 500ms
    
    themePerformanceMonitor.endThemeSwitch(switchId);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Theme switch took')
    );
    
    consoleSpy.mockRestore();
  });

  it('should export metrics correctly', () => {
    const exported = themePerformanceMonitor.exportMetrics();
    const parsed = JSON.parse(exported);
    
    expect(parsed).toHaveProperty('metrics');
    expect(parsed).toHaveProperty('thresholds');
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('timestamp');
  });
});

describe('CSS Optimizer', () => {
  beforeEach(() => {
    // Mock CSS content
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(`
        :root {
          --color-primary: #F2A30F;
          --color-secondary: #212121;
          --unused-property: red;
        }
        .theme-button {
          background: var(--color-primary);
        }
      `),
    });
    
    mockDocument.styleSheets = [
      { href: 'theme.css', cssRules: [] }
    ] as any;
  });

  it('should analyze CSS properties', async () => {
    const analysis = await cssOptimizer.analyzeCSSProperties();
    
    expect(analysis).toHaveProperty('total');
    expect(analysis).toHaveProperty('themeRelated');
    expect(analysis).toHaveProperty('unused');
    expect(analysis).toHaveProperty('duplicates');
    expect(analysis).toHaveProperty('performance');
    
    expect(typeof analysis.total).toBe('number');
    expect(['good', 'warning', 'poor']).toContain(analysis.performance);
  });

  it('should generate optimization report', async () => {
    const report = await cssOptimizer.generateOptimizationReport();
    
    expect(report).toHaveProperty('analysis');
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('potentialSavings');
    
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(typeof report.potentialSavings).toBe('number');
  });

  it('should optimize CSS', async () => {
    const result = await cssOptimizer.optimizeCSS();
    
    expect(result).toHaveProperty('originalSize');
    expect(result).toHaveProperty('optimizedSize');
    expect(result).toHaveProperty('savings');
    expect(result).toHaveProperty('savingsPercentage');
    expect(result).toHaveProperty('optimizations');
    
    expect(Array.isArray(result.optimizations)).toBe(true);
  });
});

describe('Accessibility Auditor', () => {
  beforeEach(() => {
    // Mock DOM elements for accessibility testing
    mockDocument.querySelectorAll.mockImplementation((selector: string) => {
      if (selector.includes('p, h1')) {
        return [
          {
            textContent: 'Sample text',
            style: { color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(255, 255, 255)' },
          }
        ] as any;
      }
      if (selector.includes('button')) {
        return [
          {
            hasAttribute: vi.fn(() => true),
            getAttribute: vi.fn(() => 'Test Button'),
            textContent: 'Test Button',
          }
        ] as any;
      }
      return [] as any;
    });
    
    global.getComputedStyle = vi.fn(() => ({
      color: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
      outline: '2px solid blue',
      boxShadow: 'none',
      borderWidth: '0px',
    })) as any;
  });

  it('should run full accessibility audit', async () => {
    const result = await accessibilityAuditor.runFullAudit();
    
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('themeCompliance');
    
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    
    expect(Array.isArray(result.issues)).toBe(true);
    
    expect(result.summary).toHaveProperty('errors');
    expect(result.summary).toHaveProperty('warnings');
    expect(result.summary).toHaveProperty('info');
    
    expect(result.themeCompliance).toHaveProperty('lightMode');
    expect(result.themeCompliance).toHaveProperty('darkMode');
    expect(result.themeCompliance).toHaveProperty('highContrast');
  });

  it('should export audit results', async () => {
    const result = await accessibilityAuditor.runFullAudit();
    const exported = accessibilityAuditor.exportResults(result);
    const parsed = JSON.parse(exported);
    
    expect(parsed).toHaveProperty('score');
    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('userAgent');
    expect(parsed).toHaveProperty('url');
  });
});

describe('Theme Optimizer', () => {
  beforeEach(() => {
    // Mock all dependencies
    vi.spyOn(themePerformanceMonitor, 'getPerformanceSummary').mockReturnValue({
      themeSwitches: { average: 150, count: 5, slowest: 200 },
      cssUpdates: { average: 30, count: 10 },
      fontLoading: { average: 1000, successRate: 0.98 },
      bundleSize: { current: 45000, trend: 'stable' },
    });
    
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve('/* mock css */'),
      headers: {
        get: () => '1024',
      },
    });
  });

  it('should run comprehensive optimization', async () => {
    const result = await themeOptimizer.optimize();
    
    expect(result).toHaveProperty('performance');
    expect(result).toHaveProperty('accessibility');
    expect(result).toHaveProperty('bundleSize');
    expect(result).toHaveProperty('css');
    expect(result).toHaveProperty('overall');
    
    expect(result.overall).toHaveProperty('score');
    expect(result.overall).toHaveProperty('grade');
    expect(result.overall).toHaveProperty('summary');
    expect(result.overall).toHaveProperty('criticalIssues');
    expect(result.overall).toHaveProperty('recommendations');
    
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.overall.grade);
  });

  it('should apply automatic optimizations', async () => {
    const result = await themeOptimizer.applyAutomaticOptimizations();
    
    expect(result).toHaveProperty('applied');
    expect(result).toHaveProperty('skipped');
    expect(result).toHaveProperty('warnings');
    
    expect(Array.isArray(result.applied)).toBe(true);
    expect(Array.isArray(result.skipped)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('should generate optimization report', async () => {
    const optimizationResult = await themeOptimizer.optimize();
    const report = themeOptimizer.generateReport(optimizationResult);
    const parsed = JSON.parse(report);
    
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('performance');
    expect(parsed).toHaveProperty('accessibility');
    expect(parsed).toHaveProperty('bundleSize');
    expect(parsed).toHaveProperty('css');
    expect(parsed).toHaveProperty('criticalIssues');
    expect(parsed).toHaveProperty('recommendations');
    expect(parsed).toHaveProperty('timestamp');
  });
});

describe('Performance Thresholds', () => {
  it('should meet theme switching performance requirements', () => {
    const maxThemeSwitchTime = 300; // ms
    const summary = themePerformanceMonitor.getPerformanceSummary();
    
    // If we have data, check it meets requirements
    if (summary.themeSwitches.count > 0) {
      expect(summary.themeSwitches.average).toBeLessThanOrEqual(maxThemeSwitchTime);
    }
  });

  it('should meet CSS update performance requirements', () => {
    const maxCSSUpdateTime = 50; // ms
    const summary = themePerformanceMonitor.getPerformanceSummary();
    
    // If we have data, check it meets requirements
    if (summary.cssUpdates.count > 0) {
      expect(summary.cssUpdates.average).toBeLessThanOrEqual(maxCSSUpdateTime);
    }
  });

  it('should meet font loading performance requirements', () => {
    const minSuccessRate = 0.95;
    const maxLoadTime = 3000; // ms
    const summary = themePerformanceMonitor.getPerformanceSummary();
    
    expect(summary.fontLoading.successRate).toBeGreaterThanOrEqual(minSuccessRate);
    expect(summary.fontLoading.average).toBeLessThanOrEqual(maxLoadTime);
  });

  it('should meet bundle size requirements', () => {
    const maxBundleSize = 51200; // 50KB
    const summary = themePerformanceMonitor.getPerformanceSummary();
    
    expect(summary.bundleSize.current).toBeLessThanOrEqual(maxBundleSize);
  });
});

describe('Integration Tests', () => {
  it('should handle rapid theme switching gracefully', async () => {
    const switches = [];
    
    // Simulate rapid theme switching
    for (let i = 0; i < 5; i++) {
      const switchId = themePerformanceMonitor.startThemeSwitch(
        i % 2 === 0 ? 'light' : 'dark',
        i % 2 === 0 ? 'dark' : 'light',
        'manual'
      );
      switches.push(switchId);
    }
    
    // End all switches
    switches.forEach(switchId => {
      themePerformanceMonitor.endThemeSwitch(switchId);
    });
    
    const summary = themePerformanceMonitor.getPerformanceSummary();
    expect(summary.themeSwitches.count).toBeGreaterThanOrEqual(5);
  });

  it('should maintain performance under load', async () => {
    const startTime = performance.now();
    
    // Simulate heavy usage
    for (let i = 0; i < 10; i++) {
      await cssOptimizer.analyzeCSSProperties();
      themePerformanceMonitor.monitorCSSPropertyUpdates();
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should complete within reasonable time (5 seconds)
    expect(totalTime).toBeLessThan(5000);
  });
});