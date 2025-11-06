import { Router } from 'express';
import { adminMiddleware } from './auth';
import {
  getSupplierPerformanceMetrics,
  getComplianceViolations,
  trackComplianceViolation,
  getDisputes,
  createDispute,
  runQualityControlChecks,
  detectFraudulentActivity,
  getPlatformAnalytics,
  logAdminActivity,
  notifyAdminsOfSuspiciousActivity,
  calculateTrendAnalysis,
  calculatePeriodComparisons,
  getSystemHealthMetrics,
  getTopPerformingProducts,
  getTopPerformingCategories,
} from './adminOversightService';
import { z } from 'zod';

const router = Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Validation schemas
const complianceViolationSchema = z.object({
  supplierId: z.string(),
  violationType: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1),
});

const disputeSchema = z.object({
  orderId: z.string(),
  buyerId: z.string(),
  supplierId: z.string(),
  type: z.enum(['product_quality', 'shipping_delay', 'communication', 'refund', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().min(1),
  buyerEvidence: z.array(z.string()).optional(),
});

// ==================== SUPPLIER PERFORMANCE MONITORING ====================

// GET /api/admin/oversight/suppliers/performance - Get supplier performance metrics
router.get('/suppliers/performance', async (req, res) => {
  try {
    const { 
      supplierId, 
      limit = '50', 
      offset = '0',
      sortBy = 'totalSales',
      sortOrder = 'desc'
    } = req.query;

    const result = await getSupplierPerformanceMetrics(
      supplierId as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    // Sort results if needed
    if (sortBy && sortBy !== 'totalSales') {
      result.suppliers.sort((a, b) => {
        const aVal = (a as any)[sortBy as string];
        const bVal = (b as any)[sortBy as string];
        
        if (sortOrder === 'desc') {
          return bVal - aVal;
        } else {
          return aVal - bVal;
        }
      });
    }

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Performance Metrics',
      `Viewed supplier performance metrics${supplierId ? ` for supplier ${supplierId}` : ''}`,
      'supplier_monitoring',
      supplierId as string,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      ...result,
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
      limit: parseInt(limit as string),
    });

  } catch (error: any) {
    console.error('Error fetching supplier performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch supplier performance metrics' });
  }
});

// GET /api/admin/oversight/suppliers/:id/performance - Get individual supplier performance
router.get('/suppliers/:id/performance', async (req, res) => {
  try {
    const supplierId = req.params.id;

    const result = await getSupplierPerformanceMetrics(supplierId, 1, 0);

    if (result.suppliers.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Supplier Performance',
      `Viewed detailed performance metrics for supplier ${supplierId}`,
      'supplier_monitoring',
      supplierId,
      result.suppliers[0].businessName,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      supplier: result.suppliers[0],
    });

  } catch (error: any) {
    console.error('Error fetching supplier performance:', error);
    res.status(500).json({ error: 'Failed to fetch supplier performance' });
  }
});

// ==================== COMPLIANCE TRACKING ====================

// GET /api/admin/oversight/compliance/violations - Get compliance violations
router.get('/compliance/violations', async (req, res) => {
  try {
    const { 
      supplierId, 
      status, 
      limit = '50', 
      offset = '0' 
    } = req.query;

    const result = await getComplianceViolations(
      supplierId as string,
      status as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Compliance Violations',
      `Viewed compliance violations${supplierId ? ` for supplier ${supplierId}` : ''}`,
      'compliance_monitoring',
      supplierId as string,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      ...result,
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
      limit: parseInt(limit as string),
    });

  } catch (error: any) {
    console.error('Error fetching compliance violations:', error);
    res.status(500).json({ error: 'Failed to fetch compliance violations' });
  }
});

// POST /api/admin/oversight/compliance/violations - Create compliance violation
router.post('/compliance/violations', async (req, res) => {
  try {
    const validationResult = complianceViolationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const violationData = {
      ...validationResult.data,
      supplierName: 'Unknown', // TODO: Fetch supplier name from database
      reportedBy: req.user!.id,
      status: 'open' as const,
    };

    await trackComplianceViolation(violationData);

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Create Compliance Violation',
      `Created compliance violation: ${violationData.violationType} for supplier ${violationData.supplierId}`,
      'compliance_violation',
      violationData.supplierId,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Compliance violation recorded successfully',
    });

  } catch (error: any) {
    console.error('Error creating compliance violation:', error);
    res.status(500).json({ error: 'Failed to create compliance violation' });
  }
});

// ==================== DISPUTE RESOLUTION ====================

// GET /api/admin/oversight/disputes - Get disputes
router.get('/disputes', async (req, res) => {
  try {
    const { 
      supplierId, 
      status, 
      limit = '50', 
      offset = '0' 
    } = req.query;

    const result = await getDisputes(
      supplierId as string,
      status as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Disputes',
      `Viewed disputes${supplierId ? ` for supplier ${supplierId}` : ''}`,
      'dispute_monitoring',
      supplierId as string,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      ...result,
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
      limit: parseInt(limit as string),
    });

  } catch (error: any) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

// POST /api/admin/oversight/disputes - Create dispute
router.post('/disputes', async (req, res) => {
  try {
    const validationResult = disputeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const disputeData = {
      ...validationResult.data,
      status: 'open' as const,
      assignedTo: req.user!.id,
    };

    await createDispute(disputeData);

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Create Dispute',
      `Created dispute for order ${disputeData.orderId} between buyer and supplier ${disputeData.supplierId}`,
      'dispute',
      disputeData.orderId,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Dispute created successfully',
    });

  } catch (error: any) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

// ==================== QUALITY CONTROL ====================

// GET /api/admin/oversight/quality-control/checks - Run quality control checks
router.get('/quality-control/checks', async (req, res) => {
  try {
    const { supplierId } = req.query;

    const checks = await runQualityControlChecks(supplierId as string);

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Run Quality Control',
      `Ran quality control checks${supplierId ? ` for supplier ${supplierId}` : ' platform-wide'}`,
      'quality_control',
      supplierId as string,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      checks,
      summary: {
        total: checks.length,
        critical: checks.filter(c => c.severity === 'critical').length,
        errors: checks.filter(c => c.severity === 'error').length,
        warnings: checks.filter(c => c.severity === 'warning').length,
        info: checks.filter(c => c.severity === 'info').length,
      },
    });

  } catch (error: any) {
    console.error('Error running quality control checks:', error);
    res.status(500).json({ error: 'Failed to run quality control checks' });
  }
});

// ==================== FRAUD DETECTION ====================

// GET /api/admin/oversight/fraud-detection/scan - Run fraud detection scan
router.get('/fraud-detection/scan', async (req, res) => {
  try {
    const { supplierId } = req.query;

    const alerts = await detectFraudulentActivity(supplierId as string);

    // Notify admins of high-risk alerts
    const highRiskAlerts = alerts.filter(alert => alert.riskScore >= 80);
    for (const alert of highRiskAlerts) {
      await notifyAdminsOfSuspiciousActivity(alert);
    }

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Run Fraud Detection',
      `Ran fraud detection scan${supplierId ? ` for supplier ${supplierId}` : ' platform-wide'}, found ${alerts.length} alerts`,
      'fraud_detection',
      supplierId as string,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.riskScore >= 90).length,
        high: alerts.filter(a => a.riskScore >= 70 && a.riskScore < 90).length,
        medium: alerts.filter(a => a.riskScore >= 50 && a.riskScore < 70).length,
        low: alerts.filter(a => a.riskScore < 50).length,
      },
    });

  } catch (error: any) {
    console.error('Error running fraud detection:', error);
    res.status(500).json({ error: 'Failed to run fraud detection' });
  }
});

// ==================== PLATFORM ANALYTICS ====================

// GET /api/admin/oversight/analytics/platform - Get platform analytics
router.get('/analytics/platform', async (req, res) => {
  try {
    const analytics = await getPlatformAnalytics();

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Platform Analytics',
      'Viewed platform analytics dashboard',
      'platform_analytics',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      analytics,
    });

  } catch (error: any) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({ error: 'Failed to fetch platform analytics' });
  }
});

// ==================== COMPREHENSIVE DASHBOARD METRICS ====================

// GET /api/admin/dashboard/test - Test endpoint to verify routing
router.get('/dashboard/test', async (req, res) => {
  res.json({ success: true, message: 'Dashboard route is working', timestamp: new Date() });
});

// GET /api/admin/dashboard/metrics-public - Public version for testing (REMOVE IN PRODUCTION)
router.get('/dashboard/metrics-public', async (req, res) => {
  try {
    console.log('📊 Public dashboard metrics endpoint hit');
    
    // Mock comprehensive metrics for testing
    const mockMetrics = {
      kpis: {
        totalRevenue: 125000,
        totalCommission: 6250,
        activeSuppliers: 45,
        totalSuppliers: 52,
        pendingApprovals: 7,
        totalProducts: 234,
        approvedProducts: 198,
        totalOrders: 89,
        averageSupplierRating: 4.2,
        averageResponseRate: 87.5,
      },
      realTimeMetrics: {
        onlineSuppliers: 23,
        activeOrders: 12,
        systemLoad: 45.2,
        errorRate: 0.8,
        responseTime: 180,
      },
      trends: [
        { date: '2024-01-01', revenue: 10000, orders: 8, suppliers: 2, products: 15 },
        { date: '2024-01-02', revenue: 12000, orders: 10, suppliers: 1, products: 18 },
        { date: '2024-01-03', revenue: 15000, orders: 12, suppliers: 3, products: 22 },
      ],
      comparisons: {
        revenue: { changePercent: 15.2 },
        orders: { changePercent: 8.7 },
        suppliers: { changePercent: 12.1 },
        products: { changePercent: 25.3 },
      },
      alerts: {
        critical: 2,
        warnings: 5,
        total: 7,
        recent: [
          {
            id: 'alert1',
            type: 'system',
            severity: 'critical',
            message: 'High system load detected',
            timestamp: new Date(),
          },
          {
            id: 'alert2',
            type: 'supplier',
            severity: 'warning',
            message: 'Supplier response rate below threshold',
            timestamp: new Date(),
          },
        ],
      },
      systemHealth: {
        status: 'healthy' as const,
        uptime: 99.8,
        lastUpdated: new Date(),
      },
    };

    res.json({
      success: true,
      metrics: mockMetrics,
      timeRange: '30d',
      generatedAt: new Date(),
    });

  } catch (error: any) {
    console.error('Error in public dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// GET /api/admin/dashboard/comprehensive-metrics - Get comprehensive dashboard metrics
router.get('/dashboard/comprehensive-metrics', async (req, res) => {
  try {
    console.log('📊 Dashboard metrics endpoint hit:', {
      user: req.user?.id,
      role: req.user?.role,
      query: req.query
    });
    
    const { timeRange = '30d', includeComparisons = 'true' } = req.query;

    // Get comprehensive platform analytics
    const analytics = await getPlatformAnalytics();

    // Calculate time-based metrics
    const now = new Date();
    const timeRangeMs = timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                       timeRange === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                       timeRange === '90d' ? 90 * 24 * 60 * 60 * 1000 :
                       30 * 24 * 60 * 60 * 1000; // default 30 days

    const startDate = new Date(now.getTime() - timeRangeMs);

    // Get trend data and comparisons
    const trends = await calculateTrendAnalysis(startDate, now);
    const comparisons = includeComparisons === 'true' ? await calculatePeriodComparisons(startDate, now) : null;

    // Get real-time system health
    const systemHealth = await getSystemHealthMetrics();

    // Get recent alerts
    const qualityChecks = await runQualityControlChecks();
    const fraudAlerts = await detectFraudulentActivity();
    
    const recentAlerts = [
      ...qualityChecks.filter(check => check.severity === 'critical' || check.severity === 'error').slice(0, 5),
      ...fraudAlerts.filter(alert => alert.riskScore >= 70).slice(0, 5)
    ];

    const comprehensiveMetrics = {
      // Core KPIs
      kpis: {
        totalRevenue: analytics.totalRevenue,
        totalCommission: analytics.totalCommission,
        activeSuppliers: analytics.activeSuppliers,
        totalSuppliers: analytics.totalSuppliers,
        pendingApprovals: analytics.pendingSuppliers,
        totalProducts: analytics.totalProducts,
        approvedProducts: analytics.approvedProducts,
        totalOrders: analytics.totalOrders,
        averageSupplierRating: analytics.averageSupplierRating,
        averageResponseRate: analytics.averageResponseRate,
        // Additional KPIs for enhanced admin dashboard
        pendingVerifications: 5, // Mock data - would be calculated from verification documents
        activeDisputes: 2, // Mock data - would be calculated from dispute system
        pendingPayouts: 8, // Mock data - would be calculated from payout system
        totalBuyers: analytics.totalBuyers || 0,
        activeBuyers: analytics.activeBuyers || 0,
        monthlyGrowthRate: analytics.monthlyGrowthRate || 0,
        systemUptime: systemHealth.uptime || 99.9,
      },

      // Real-time metrics
      realTimeMetrics: {
        onlineSuppliers: systemHealth.onlineSuppliers,
        activeOrders: systemHealth.activeOrders,
        systemLoad: systemHealth.systemLoad,
        errorRate: systemHealth.errorRate,
        responseTime: systemHealth.avgResponseTime,
      },

      // Trend analysis
      trends: trends,

      // Period comparisons (if requested)
      comparisons: comparisons,

      // Top performers
      topPerformers: {
        suppliers: analytics.topPerformingSuppliers,
        products: await getTopPerformingProducts(5),
        categories: await getTopPerformingCategories(5),
      },

      // Recent activity
      recentActivity: analytics.recentActivity.slice(0, 10),

      // System alerts
      alerts: {
        critical: recentAlerts.filter(alert => 
          (alert as any).severity === 'critical' || (alert as any).riskScore >= 90
        ).length,
        warnings: recentAlerts.filter(alert => 
          (alert as any).severity === 'warning' || 
          ((alert as any).riskScore >= 50 && (alert as any).riskScore < 90)
        ).length,
        total: recentAlerts.length,
        recent: recentAlerts.slice(0, 5).map(alert => ({
          id: (alert as any).id || `alert_${Date.now()}`,
          type: (alert as any).type || (alert as any).alertType || 'system',
          severity: (alert as any).severity || 
                   ((alert as any).riskScore >= 90 ? 'critical' : 
                    (alert as any).riskScore >= 70 ? 'error' : 'warning'),
          message: (alert as any).message || (alert as any).description,
          timestamp: (alert as any).createdAt || new Date(),
        })),
      },

      // System health summary
      systemHealth: {
        status: systemHealth.overallStatus,
        uptime: systemHealth.uptime,
        lastUpdated: new Date(),
      },
    };

    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Comprehensive Metrics',
      `Viewed comprehensive dashboard metrics for ${timeRange}`,
      'dashboard_metrics',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      metrics: comprehensiveMetrics,
      timeRange,
      generatedAt: new Date(),
    });

  } catch (error: any) {
    console.error('Error fetching comprehensive dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive dashboard metrics' });
  }
});

// ==================== REAL-TIME MONITORING ====================

// GET /api/admin/oversight/monitoring/alerts - Get real-time alerts
router.get('/monitoring/alerts', async (req, res) => {
  try {
    const { limit = '20', severity } = req.query;

    // Combine quality control and fraud detection alerts
    const qualityChecks = await runQualityControlChecks();
    const fraudAlerts = await detectFraudulentActivity();

    // Convert to unified alert format
    const alerts = [
      ...qualityChecks
        .filter(check => !severity || check.severity === severity)
        .map(check => ({
          id: `qc_${check.entityId}_${Date.now()}`,
          type: 'quality_control',
          severity: check.severity,
          title: `Quality Control: ${check.type}`,
          message: check.message,
          entityId: check.entityId,
          entityType: check.entityType,
          timestamp: new Date(),
          status: 'open',
        })),
      ...fraudAlerts
        .filter(alert => !severity || 
          (severity === 'critical' && alert.riskScore >= 90) ||
          (severity === 'error' && alert.riskScore >= 70 && alert.riskScore < 90) ||
          (severity === 'warning' && alert.riskScore >= 50 && alert.riskScore < 70) ||
          (severity === 'info' && alert.riskScore < 50)
        )
        .map(alert => ({
          id: alert.id,
          type: 'fraud_detection',
          severity: alert.riskScore >= 90 ? 'critical' : 
                   alert.riskScore >= 70 ? 'error' : 
                   alert.riskScore >= 50 ? 'warning' : 'info',
          title: `Fraud Alert: ${alert.alertType}`,
          message: alert.description,
          entityId: alert.supplierId,
          entityType: 'supplier',
          timestamp: alert.createdAt,
          status: alert.status,
        }))
    ];

    // Sort by timestamp and limit
    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const limitedAlerts = alerts.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      alerts: limitedAlerts,
      total: alerts.length,
      summary: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        error: alerts.filter(a => a.severity === 'error').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
      },
    });

  } catch (error: any) {
    console.error('Error fetching monitoring alerts:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring alerts' });
  }
});

export { router as adminOversightRoutes };