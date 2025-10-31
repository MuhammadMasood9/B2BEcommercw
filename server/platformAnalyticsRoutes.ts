import { Router } from 'express';
import { platformAnalyticsService } from './platformAnalyticsService';

const router = Router();

// ==================== COMPREHENSIVE PLATFORM ANALYTICS ROUTES ====================

/**
 * GET /api/admin/analytics/platform/comprehensive
 * Get comprehensive platform analytics with all metrics
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const analytics = await platformAnalyticsService.getComprehensivePlatformAnalytics(start, end);
    
    res.json({
      success: true,
      data: analytics,
      metadata: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching comprehensive platform analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/analytics/platform/overview
 * Get platform overview metrics only
 */
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const analytics = await platformAnalyticsService.getComprehensivePlatformAnalytics(start, end);
    
    res.json({
      success: true,
      data: {
        overview: analytics.overview,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching platform overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform overview'
    });
  }
});

/**
 * GET /api/admin/analytics/platform/trends
 * Get trend analysis for specific metrics
 */
router.get('/trends', async (req, res) => {
  try {
    const { metric, startDate, endDate, granularity } = req.query;
    
    if (!metric) {
      return res.status(400).json({
        success: false,
        error: 'Metric parameter is required'
      });
    }
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const gran = (granularity as 'daily' | 'weekly' | 'monthly') || 'daily';
    
    const trends = await platformAnalyticsService.getTrendAnalysis(
      metric as string, 
      start, 
      end, 
      gran
    );
    
    res.json({
      success: true,
      data: {
        metric,
        granularity: gran,
        trends,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trend analysis'
    });
  }
});

/**
 * GET /api/admin/analytics/platform/predictions
 * Get predictive analytics and insights
 */
router.get('/predictions', async (req, res) => {
  try {
    const { metrics, timeHorizon } = req.query;
    
    const metricsArray = metrics 
      ? (metrics as string).split(',').map(m => m.trim())
      : ['revenue', 'orders', 'average_order_value'];
    
    const horizon = (timeHorizon as 'week' | 'month' | 'quarter' | 'year') || 'month';
    
    const predictions = await platformAnalyticsService.getPredictiveInsights(
      metricsArray,
      horizon
    );
    
    res.json({
      success: true,
      data: {
        predictions,
        timeHorizon: horizon,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching predictive insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predictive insights'
    });
  }
});

/**
 * GET /api/admin/analytics/platform/user-analytics
 * Get detailed user analytics
 */
router.get('/user-analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const analytics = await platformAnalyticsService.getComprehensivePlatformAnalytics(start, end);
    
    res.json({
      success: true,
      data: {
        userAnalytics: analytics.userAnalytics,
        engagementAnalytics: analytics.engagementAnalytics,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

/**
 * GET /api/admin/analytics/platform/supplier-analytics
 * Get detailed supplier analytics
 */
router.get('/supplier-analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const analytics = await platformAnalyticsService.getComprehensivePlatformAnalytics(start, end);
    
    res.json({
      success: true,
      data: {
        supplierAnalytics: analytics.supplierAnalytics,
        productAnalytics: analytics.productAnalytics,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching supplier analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier analytics'
    });
  }
});

/**
 * GET /api/admin/analytics/platform/financial-analytics
 * Get detailed financial analytics
 */
router.get('/financial-analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const analytics = await platformAnalyticsService.getComprehensivePlatformAnalytics(start, end);
    
    res.json({
      success: true,
      data: {
        revenueAnalytics: analytics.revenueAnalytics,
        orderAnalytics: analytics.orderAnalytics,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial analytics'
    });
  }
});

/**
 * GET /api/admin/analytics/platform/comparative
 * Get comparative analytics with benchmarks
 */
router.get('/comparative', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const analytics = await platformAnalyticsService.getComprehensivePlatformAnalytics(start, end);
    
    res.json({
      success: true,
      data: {
        comparativeAnalytics: analytics.comparativeAnalytics,
        predictiveAnalytics: analytics.predictiveAnalytics,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching comparative analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comparative analytics'
    });
  }
});

/**
 * POST /api/admin/analytics/platform/custom-report
 * Generate custom analytics report
 */
router.post('/custom-report', async (req, res) => {
  try {
    const { 
      metrics, 
      startDate, 
      endDate, 
      granularity, 
      includeComparative, 
      includePredictive,
      format 
    } = req.body;
    
    if (!metrics || !Array.isArray(metrics)) {
      return res.status(400).json({
        success: false,
        error: 'Metrics array is required'
      });
    }
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get comprehensive analytics
    const analytics = await platformAnalyticsService.getComprehensivePlatformAnalytics(start, end);
    
    // Get trend analysis for requested metrics
    const trends = await Promise.all(
      metrics.map(metric => 
        platformAnalyticsService.getTrendAnalysis(
          metric, 
          start, 
          end, 
          granularity || 'daily'
        )
      )
    );
    
    // Get predictive insights if requested
    let predictions = null;
    if (includePredictive) {
      predictions = await platformAnalyticsService.getPredictiveInsights(metrics);
    }
    
    const report = {
      reportId: `report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      },
      requestedMetrics: metrics,
      overview: analytics.overview,
      trends: trends.reduce((acc, trend, index) => {
        acc[metrics[index]] = trend;
        return acc;
      }, {} as Record<string, any>),
      ...(includeComparative && { 
        comparative: analytics.comparativeAnalytics 
      }),
      ...(includePredictive && { 
        predictions 
      }),
      summary: {
        totalDataPoints: trends.reduce((sum, trend) => sum + trend.length, 0),
        analysisDepth: 'comprehensive',
        confidenceLevel: predictions ? 
          predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length : 
          null
      }
    };
    
    // Handle different export formats
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = convertToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${Date.now()}.csv"`);
      return res.send(csvData);
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom report'
    });
  }
});

/**
 * GET /api/admin/analytics/platform/health-score
 * Get platform health score and recommendations
 */
router.get('/health-score', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const analytics = await platformAnalyticsService.getComprehensivePlatformAnalytics(start, end);
    
    // Calculate detailed health score
    const healthScore = {
      overall: analytics.overview.marketplaceHealth,
      scores: {
        userGrowth: Math.min(100, Math.max(0, analytics.userAnalytics.userEngagement)),
        supplierHealth: Math.min(100, analytics.supplierAnalytics.supplierRetention),
        financialHealth: Math.min(100, Math.max(0, 50 + analytics.revenueAnalytics.revenueGrowth)),
        operationalHealth: Math.min(100, analytics.orderAnalytics.orderFulfillmentRate)
      },
      recommendations: [
        ...(analytics.userAnalytics.userEngagement < 50 ? ['Improve user engagement strategies'] : []),
        ...(analytics.supplierAnalytics.supplierRetention < 70 ? ['Focus on supplier retention programs'] : []),
        ...(analytics.revenueAnalytics.revenueGrowth < 0 ? ['Review pricing and revenue strategies'] : []),
        ...(analytics.orderAnalytics.orderFulfillmentRate < 80 ? ['Optimize order fulfillment processes'] : [])
      ],
      alerts: [
        ...(analytics.predictiveAnalytics.churnPrediction.supplierChurnRisk > 20 ? 
          [{ type: 'warning', message: 'High supplier churn risk detected' }] : []),
        ...(analytics.overview.growthRate < -10 ? 
          [{ type: 'critical', message: 'Negative growth trend requires immediate attention' }] : [])
      ]
    };
    
    res.json({
      success: true,
      data: healthScore,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating health score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate platform health score'
    });
  }
});

// Helper function to convert report data to CSV
function convertToCSV(report: any): string {
  const headers = ['Metric', 'Value', 'Date', 'Change %'];
  const rows = [headers.join(',')];
  
  // Add overview metrics
  Object.entries(report.overview).forEach(([key, value]) => {
    rows.push(`${key},${value},${report.generatedAt},0`);
  });
  
  // Add trend data
  Object.entries(report.trends).forEach(([metric, trends]: [string, any]) => {
    trends.forEach((trend: any) => {
      rows.push(`${metric},${trend.value},${trend.date},${trend.changePercentage}`);
    });
  });
  
  return rows.join('\n');
}

export default router;