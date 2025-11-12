/**
 * Performance Dashboard Component
 * 
 * This component provides a real-time dashboard for monitoring
 * font loading and CSS performance optimizations.
 */

import React, { useState, useEffect } from 'react';
import { systemFontLoader } from '../utils/systemFontLoader';
import { cssOptimizer } from '../utils/cssOptimizer';
import { webVitalsMonitor } from '../utils/webVitalsMonitor';

interface PerformanceData {
  fontMetrics: any;
  cssMetrics: any;
  webVitalsMetrics: any;
  lastUpdated: Date;
}

const PerformanceDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      setPerformanceData({
        fontMetrics: systemFontLoader.getMetrics(),
        cssMetrics: cssOptimizer.getMetrics(),
        webVitalsMetrics: webVitalsMonitor.getMetrics(),
        lastUpdated: new Date(),
      });
    };

    // Initial load
    updateMetrics();

    // Auto-refresh every 5 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(updateMetrics, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatTime = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  const formatBytes = (bytes: number): string => {
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricStatus = (value: number, good: number, needsImprovement: number): string => {
    if (value <= good) return '🟢';
    if (value <= needsImprovement) return '🟡';
    return '🔴';
  };

  if (!performanceData) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-gray-600">Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
        title="Performance Dashboard"
      >
        📊
      </button>

      {/* Dashboard Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-6 max-w-md w-full max-h-96 overflow-y-auto z-40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Dashboard</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-2 py-1 text-xs rounded ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {autoRefresh ? 'Auto' : 'Manual'}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Web Vitals Section */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">🚀 Core Web Vitals</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>LCP:</span>
                <span className="font-mono">
                  {performanceData.webVitalsMetrics.lcp 
                    ? `${getMetricStatus(performanceData.webVitalsMetrics.lcp, 2500, 4000)} ${formatTime(performanceData.webVitalsMetrics.lcp)}`
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>FID:</span>
                <span className="font-mono">
                  {performanceData.webVitalsMetrics.fid 
                    ? `${getMetricStatus(performanceData.webVitalsMetrics.fid, 100, 300)} ${formatTime(performanceData.webVitalsMetrics.fid)}`
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>CLS:</span>
                <span className="font-mono">
                  {getMetricStatus(performanceData.webVitalsMetrics.cls, 0.1, 0.25)} {performanceData.webVitalsMetrics.cls.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Performance Score:</span>
                <span className={`font-bold ${getScoreColor(performanceData.webVitalsMetrics.performanceScore)}`}>
                  {performanceData.webVitalsMetrics.performanceScore.toFixed(1)}/100
                </span>
              </div>
            </div>
          </div>

          {/* Font Performance Section */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">🔤 Font Performance</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Load Time:</span>
                <span className="font-mono">{formatTime(performanceData.fontMetrics.fontLoadDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fonts Loaded:</span>
                <span className="text-green-600">{performanceData.fontMetrics.fontsLoaded.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Fonts Failed:</span>
                <span className="text-red-600">{performanceData.fontMetrics.fontsFailed.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Layout Shift:</span>
                <span className="font-mono">{performanceData.webVitalsMetrics.fontLayoutShift.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* CSS Performance Section */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">🎨 CSS Performance</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Load Time:</span>
                <span className="font-mono">{formatTime(performanceData.cssMetrics.cssLoadTime)}</span>
              </div>
              <div className="flex justify-between">
                <span>Critical CSS:</span>
                <span className="font-mono">{formatBytes(performanceData.cssMetrics.criticalCSSSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total CSS:</span>
                <span className="font-mono">{formatBytes(performanceData.cssMetrics.totalCSSSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>FCP:</span>
                <span className="font-mono">
                  {performanceData.webVitalsMetrics.fcp 
                    ? formatTime(performanceData.webVitalsMetrics.fcp)
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const report = webVitalsMonitor.generateReport();
                console.log(report);
                alert('Performance report generated in console');
              }}
              className="flex-1 px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90"
            >
              Generate Report
            </button>
            <button
              onClick={() => {
                const metrics = webVitalsMonitor.exportMetrics();
                navigator.clipboard.writeText(metrics);
                alert('Metrics copied to clipboard');
              }}
              className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
            >
              Export Data
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            Last updated: {performanceData.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceDashboard;