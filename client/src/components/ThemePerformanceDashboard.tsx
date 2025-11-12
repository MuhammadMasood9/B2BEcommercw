/**
 * Theme Performance Dashboard
 * Real-time monitoring and optimization dashboard for theme system performance
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  themePerformanceMonitor, 
  getPerformanceSummary, 
  analyzeBundleSize 
} from '../utils/themePerformanceMonitor';
import { 
  cssOptimizer, 
  analyzeCSSProperties, 
  generateOptimizationReport 
} from '../utils/cssOptimizer';
import { 
  accessibilityAuditor, 
  runAccessibilityAudit 
} from '../utils/accessibilityAuditor';
import { useTheme } from '../hooks/useTheme';

interface PerformanceMetrics {
  themeSwitches: { average: number; count: number; slowest: number };
  cssUpdates: { average: number; count: number };
  fontLoading: { average: number; successRate: number };
  bundleSize: { current: number; trend: string };
}

interface OptimizationReport {
  analysis: {
    total: number;
    themeRelated: number;
    unused: number;
    duplicates: number;
    performance: 'good' | 'warning' | 'poor';
  };
  recommendations: string[];
  potentialSavings: number;
}

interface AccessibilityReport {
  score: number;
  issues: Array<{
    type: string;
    severity: string;
    element: string;
    description: string;
    recommendation: string;
  }>;
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  themeCompliance: {
    lightMode: boolean;
    darkMode: boolean;
    highContrast: boolean;
  };
}

export const ThemePerformanceDashboard: React.FC = () => {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [optimizationReport, setOptimizationReport] = useState<OptimizationReport | null>(null);
  const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Update metrics periodically
  const updateMetrics = useCallback(async () => {
    try {
      const summary = getPerformanceSummary();
      setMetrics(summary);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
    }
  }, []);

  // Run optimization analysis
  const runOptimizationAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      const report = await generateOptimizationReport();
      setOptimizationReport(report);
    } catch (error) {
      console.error('Failed to run optimization analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run accessibility audit
  const runAccessibilityAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      const report = await runAccessibilityAudit();
      setAccessibilityReport(report);
    } catch (error) {
      console.error('Failed to run accessibility audit:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Test theme switching performance
  const testThemeSwitching = useCallback(() => {
    const iterations = 5;
    let completed = 0;
    
    const performTest = () => {
      toggleTheme();
      completed++;
      
      if (completed < iterations) {
        setTimeout(performTest, 500); // Wait for transition to complete
      } else {
        setTimeout(updateMetrics, 1000); // Update metrics after all tests
      }
    };
    
    performTest();
  }, [toggleTheme, updateMetrics]);

  // Initialize dashboard
  useEffect(() => {
    updateMetrics();
    
    // Set up periodic updates
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Get performance status
  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'bg-green-500' };
    if (value <= thresholds.warning) return { status: 'warning', color: 'bg-yellow-500' };
    return { status: 'poor', color: 'bg-red-500' };
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (ms: number) => {
    return `${ms.toFixed(1)}ms`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and optimize theme system performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={updateMetrics} variant="outline">
            Refresh Metrics
          </Button>
          <Button onClick={testThemeSwitching} variant="outline">
            Test Theme Switching
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Theme Switch Speed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatDuration(metrics.themeSwitches.average) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? `${metrics.themeSwitches.count} switches` : 'No data'}
            </p>
            {metrics && (
              <div className="mt-2">
                <Badge 
                  variant={getPerformanceStatus(metrics.themeSwitches.average, { good: 200, warning: 300 }).status === 'good' ? 'default' : 'destructive'}
                >
                  {getPerformanceStatus(metrics.themeSwitches.average, { good: 200, warning: 300 }).status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CSS Updates</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatDuration(metrics.cssUpdates.average) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? `${metrics.cssUpdates.count} updates` : 'No data'}
            </p>
            {metrics && (
              <div className="mt-2">
                <Badge 
                  variant={getPerformanceStatus(metrics.cssUpdates.average, { good: 50, warning: 100 }).status === 'good' ? 'default' : 'destructive'}
                >
                  {getPerformanceStatus(metrics.cssUpdates.average, { good: 50, warning: 100 }).status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Font Loading</CardTitle>
            <div className="h-4 w-4 rounded-full bg-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${(metrics.fontLoading.successRate * 100).toFixed(0)}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? formatDuration(metrics.fontLoading.average) : 'No data'}
            </p>
            {metrics && (
              <div className="mt-2">
                <Badge 
                  variant={metrics.fontLoading.successRate >= 0.95 ? 'default' : 'destructive'}
                >
                  {metrics.fontLoading.successRate >= 0.95 ? 'good' : 'poor'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
            <div className="h-4 w-4 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatFileSize(metrics.bundleSize.current) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? `Trend: ${metrics.bundleSize.trend}` : 'No data'}
            </p>
            {metrics && (
              <div className="mt-2">
                <Badge 
                  variant={metrics.bundleSize.current < 51200 ? 'default' : 'destructive'}
                >
                  {metrics.bundleSize.current < 51200 ? 'good' : 'large'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optimization Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>CSS Optimization</CardTitle>
          <CardDescription>
            Analyze and optimize CSS custom properties for better performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={runOptimizationAnalysis} 
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>

          {optimizationReport && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{optimizationReport.analysis.total}</div>
                  <div className="text-sm text-muted-foreground">Total Properties</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{optimizationReport.analysis.unused}</div>
                  <div className="text-sm text-muted-foreground">Unused</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatFileSize(optimizationReport.potentialSavings)}</div>
                  <div className="text-sm text-muted-foreground">Potential Savings</div>
                </div>
              </div>

              <div>
                <Badge 
                  variant={optimizationReport.analysis.performance === 'good' ? 'default' : 'destructive'}
                >
                  Performance: {optimizationReport.analysis.performance}
                </Badge>
              </div>

              {optimizationReport.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {optimizationReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accessibility Audit */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Audit</CardTitle>
          <CardDescription>
            Comprehensive accessibility testing for theme system compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={runAccessibilityAnalysis} 
              disabled={isLoading}
            >
              {isLoading ? 'Auditing...' : 'Run Audit'}
            </Button>
          </div>

          {accessibilityReport && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{accessibilityReport.score}</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{accessibilityReport.summary.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{accessibilityReport.summary.warnings}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{accessibilityReport.summary.info}</div>
                  <div className="text-sm text-muted-foreground">Info</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Theme Compliance:</h4>
                <div className="flex gap-2">
                  <Badge variant={accessibilityReport.themeCompliance.lightMode ? 'default' : 'destructive'}>
                    Light Mode: {accessibilityReport.themeCompliance.lightMode ? 'Pass' : 'Fail'}
                  </Badge>
                  <Badge variant={accessibilityReport.themeCompliance.darkMode ? 'default' : 'destructive'}>
                    Dark Mode: {accessibilityReport.themeCompliance.darkMode ? 'Pass' : 'Fail'}
                  </Badge>
                  <Badge variant={accessibilityReport.themeCompliance.highContrast ? 'default' : 'destructive'}>
                    High Contrast: {accessibilityReport.themeCompliance.highContrast ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
              </div>

              {accessibilityReport.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Top Issues:</h4>
                  <div className="space-y-2">
                    {accessibilityReport.issues.slice(0, 5).map((issue, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={issue.severity === 'error' ? 'destructive' : issue.severity === 'warning' ? 'secondary' : 'outline'}
                          >
                            {issue.severity}
                          </Badge>
                          <span className="text-sm font-medium">{issue.type}</span>
                        </div>
                        <p className="text-sm">{issue.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{issue.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Theme Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Theme Status</CardTitle>
          <CardDescription>
            Active theme configuration and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium">Theme Preference</div>
              <div className="text-lg">{theme}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Resolved Theme</div>
              <div className="text-lg">{resolvedTheme}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Performance Monitor</div>
              <div className="text-lg">
                {themePerformanceMonitor.isActive() ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemePerformanceDashboard;