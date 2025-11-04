import { Router } from 'express';
import { adminMiddleware } from './auth';
import {
  getComprehensiveSystemHealth,
  getPerformanceMetrics,
  getErrorMetrics,
  getCapacityMetrics,
} from './systemMonitoringService';
import { logAdminActivity } from './adminOversightService';

const router = Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// ==================== SYSTEM HEALTH MONITORING ====================

// GET /api/admin/monitoring/system/comprehensive-health - Get comprehensive system health
router.get('/system/comprehensive-health', async (req, res) => {
  try {
    console.log('📊 System health monitoring endpoint hit');
    
    const healthMetrics = await getComprehensiveSystemHealth();
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View System Health',
      'Viewed comprehensive system health metrics',
      'system_monitoring',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      health: healthMetrics,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health metrics' });
  }
});

// GET /api/admin/monitoring/system/performance - Get performance metrics
router.get('/system/performance', async (req, res) => {
  try {
    console.log('📊 Performance metrics endpoint hit');
    
    const performanceMetrics = await getPerformanceMetrics();
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Performance Metrics',
      'Viewed system performance metrics',
      'performance_monitoring',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      performance: performanceMetrics,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// GET /api/admin/monitoring/system/errors - Get error tracking metrics
router.get('/system/errors', async (req, res) => {
  try {
    console.log('📊 Error metrics endpoint hit');
    
    const { timeRange = '24h', severity } = req.query;
    
    const errorMetrics = await getErrorMetrics();
    
    // Filter by severity if provided
    if (severity) {
      errorMetrics.recentErrors = errorMetrics.recentErrors.filter(
        error => error.severity === severity
      );
    }
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Error Metrics',
      `Viewed error metrics for ${timeRange}${severity ? ` with severity ${severity}` : ''}`,
      'error_monitoring',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      errors: errorMetrics,
      timeRange,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching error metrics:', error);
    res.status(500).json({ error: 'Failed to fetch error metrics' });
  }
});

// GET /api/admin/monitoring/system/capacity - Get capacity planning metrics
router.get('/system/capacity', async (req, res) => {
  try {
    console.log('📊 Capacity metrics endpoint hit');
    
    const capacityMetrics = await getCapacityMetrics();
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Capacity Metrics',
      'Viewed system capacity planning metrics',
      'capacity_monitoring',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      capacity: capacityMetrics,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching capacity metrics:', error);
    res.status(500).json({ error: 'Failed to fetch capacity metrics' });
  }
});

// GET /api/admin/monitoring/system/status - Get quick system status
router.get('/system/status', async (req, res) => {
  try {
    console.log('📊 System status endpoint hit');
    
    const healthMetrics = await getComprehensiveSystemHealth();
    
    // Return simplified status for quick checks
    const quickStatus = {
      overall: healthMetrics.overallHealth.status,
      score: healthMetrics.overallHealth.score,
      database: healthMetrics.databasePerformance.status,
      api: healthMetrics.apiMetrics.status,
      resources: healthMetrics.systemResources.status,
      uptime: healthMetrics.serverStatus.uptime,
      activeUsers: healthMetrics.applicationMetrics.activeUsers,
      activeSuppliers: healthMetrics.applicationMetrics.activeSuppliers,
      activeOrders: healthMetrics.applicationMetrics.activeOrders,
      criticalIssues: healthMetrics.overallHealth.issues.length,
    };
    
    res.json({
      success: true,
      status: quickStatus,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system status',
      status: {
        overall: 'critical',
        score: 0,
        database: 'critical',
        api: 'critical',
        resources: 'critical',
        uptime: 0,
        activeUsers: 0,
        activeSuppliers: 0,
        activeOrders: 0,
        criticalIssues: 1,
      }
    });
  }
});

// ==================== ALERT MANAGEMENT ROUTES ====================

// GET /api/admin/monitoring/alerts/active - Get active alerts
router.get('/alerts/active', async (req, res) => {
  try {
    console.log('📊 Active alerts endpoint hit');
    
    const { limit = 50, severity, type } = req.query;
    
    // TODO: Implement alerts table and fetch from monitoring system
    const alerts: any[] = [];
    
    // Filter alerts based on query parameters
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    // Limit results
    filteredAlerts = filteredAlerts.slice(0, parseInt(limit as string));
    
    // Calculate summary
    const summary = {
      critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
      high: alerts.filter(a => a.severity === 'high' && !a.resolved).length,
      warning: alerts.filter(a => a.severity === 'warning' && !a.resolved).length,
      info: alerts.filter(a => a.severity === 'info' && !a.resolved).length,
    };
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Active Alerts',
      `Viewed active alerts with filters: severity=${severity || 'all'}, type=${type || 'all'}`,
      'alert_monitoring',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      alerts: filteredAlerts,
      summary,
      total: alerts.length,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

// POST /api/admin/monitoring/alerts/:id/acknowledge - Acknowledge an alert
router.post('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Acknowledging alert: ${id}`);
    
    // In production, this would update the alert in the database
    const acknowledgedAlert = {
      id,
      acknowledged: true,
      acknowledgedBy: req.user!.id,
      acknowledgedAt: new Date(),
    };
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Acknowledge Alert',
      `Acknowledged alert: ${id}`,
      'alert_management',
      id,
      'alert',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      alert: acknowledgedAlert,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// POST /api/admin/monitoring/alerts/:id/resolve - Resolve an alert
router.post('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    console.log(`📊 Resolving alert: ${id}`);
    
    if (!resolution) {
      return res.status(400).json({ error: 'Resolution details are required' });
    }
    
    // In production, this would update the alert in the database
    const resolvedAlert = {
      id,
      resolved: true,
      resolvedBy: req.user!.id,
      resolvedAt: new Date(),
      resolution,
    };
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Resolve Alert',
      `Resolved alert: ${id} - ${resolution}`,
      'alert_management',
      id,
      'alert',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      alert: resolvedAlert,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// GET /api/admin/monitoring/alerts/configuration - Get alert configuration
router.get('/alerts/configuration', async (req, res) => {
  try {
    console.log('📊 Alert configuration endpoint hit');
    
    // Mock configuration (in production, this would come from database)
    const configuration = {
      globalSettings: {
        enableNotifications: true,
        defaultSeverity: 'medium',
        retentionDays: 30,
        maxAlertsPerHour: 100,
      },
      notificationChannels: {
        email: {
          enabled: true,
          recipients: ['admin@example.com'],
          template: 'default',
        },
        sms: {
          enabled: false,
          recipients: [],
        },
        webhook: {
          enabled: false,
          url: '',
          headers: {},
        },
        inApp: {
          enabled: true,
          showDesktop: true,
        },
      },
      escalationMatrix: [],
    };
    
    res.json({
      success: true,
      configuration,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching alert configuration:', error);
    res.status(500).json({ error: 'Failed to fetch alert configuration' });
  }
});

// PUT /api/admin/monitoring/alerts/configuration - Update alert configuration
router.put('/alerts/configuration', async (req, res) => {
  try {
    const configuration = req.body;
    console.log('📊 Updating alert configuration');
    
    // In production, this would save to database
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Update Alert Configuration',
      'Updated alert notification configuration',
      'alert_configuration',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      configuration,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error updating alert configuration:', error);
    res.status(500).json({ error: 'Failed to update alert configuration' });
  }
});

export { router as systemMonitoringRoutes };