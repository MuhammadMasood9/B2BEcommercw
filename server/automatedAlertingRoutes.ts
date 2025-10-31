import { Router } from 'express';
import { adminMiddleware } from './auth';
import { db } from './db';
import { 
  systemAlerts, 
  alertRules, 
  alertConfiguration, 
  alertHistory,
  alertMetrics,
  notificationDeliveryLog
} from '@shared/schema';
import { eq, and, gte, desc, count, sql, asc } from 'drizzle-orm';
import {
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  getAlertAnalytics,
  runAlertMonitoring,
} from './automatedAlertingService';
import { logAdminActivity } from './adminOversightService';

const router = Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// ==================== ALERT MANAGEMENT ====================

// GET /api/admin/monitoring/alerts/active - Get active alerts
router.get('/alerts/active', async (req, res) => {
  try {
    console.log('📊 Active alerts endpoint hit');
    
    const { 
      limit = 50, 
      severity, 
      type, 
      acknowledged = 'false',
      resolved = 'false' 
    } = req.query;
    
    let whereConditions = [];
    
    if (severity && severity !== 'all') {
      whereConditions.push(eq(systemAlerts.severity, severity as string));
    }
    
    if (type && type !== 'all') {
      whereConditions.push(eq(systemAlerts.type, type as string));
    }
    
    if (acknowledged === 'false') {
      whereConditions.push(eq(systemAlerts.acknowledged, false));
    }
    
    if (resolved === 'false') {
      whereConditions.push(eq(systemAlerts.resolved, false));
    }
    
    const alerts = await db
      .select()
      .from(systemAlerts)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(systemAlerts.createdAt))
      .limit(parseInt(limit as string));
    
    // Calculate summary
    const allAlerts = await db
      .select({
        severity: systemAlerts.severity,
        resolved: systemAlerts.resolved,
      })
      .from(systemAlerts)
      .where(eq(systemAlerts.resolved, false));
    
    const summary = {
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      high: allAlerts.filter(a => a.severity === 'high').length,
      medium: allAlerts.filter(a => a.severity === 'medium').length,
      low: allAlerts.filter(a => a.severity === 'low').length,
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
      alerts,
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
    
    await acknowledgeAlert(id, req.user!.id);
    
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
      message: 'Alert acknowledged successfully',
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
    
    await resolveAlert(id, req.user!.id, resolution);
    
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
      message: 'Alert resolved successfully',
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// GET /api/admin/monitoring/alerts/:id/history - Get alert history
router.get('/alerts/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Fetching alert history: ${id}`);
    
    const history = await db
      .select()
      .from(alertHistory)
      .where(eq(alertHistory.alertId, id))
      .orderBy(desc(alertHistory.createdAt));
    
    res.json({
      success: true,
      history,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ error: 'Failed to fetch alert history' });
  }
});

// ==================== ALERT RULES MANAGEMENT ====================

// GET /api/admin/monitoring/alerts/rules - Get alert rules
router.get('/alerts/rules', async (req, res) => {
  try {
    console.log('📊 Alert rules endpoint hit');
    
    const rules = await db
      .select()
      .from(alertRules)
      .orderBy(desc(alertRules.createdAt));
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Alert Rules',
      'Viewed alert rules configuration',
      'alert_configuration',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      rules,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching alert rules:', error);
    res.status(500).json({ error: 'Failed to fetch alert rules' });
  }
});

// POST /api/admin/monitoring/alerts/rules - Create alert rule
router.post('/alerts/rules', async (req, res) => {
  try {
    console.log('📊 Creating alert rule');
    
    const ruleData = {
      ...req.body,
      createdBy: req.user!.id,
    };
    
    const [newRule] = await db
      .insert(alertRules)
      .values(ruleData)
      .returning();
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Create Alert Rule',
      `Created alert rule: ${newRule.name}`,
      'alert_configuration',
      newRule.id,
      'alert_rule',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      rule: newRule,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

// PUT /api/admin/monitoring/alerts/rules/:id - Update alert rule
router.put('/alerts/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Updating alert rule: ${id}`);
    
    const [updatedRule] = await db
      .update(alertRules)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(alertRules.id, id))
      .returning();
    
    if (!updatedRule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Update Alert Rule',
      `Updated alert rule: ${updatedRule.name}`,
      'alert_configuration',
      id,
      'alert_rule',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      rule: updatedRule,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

// DELETE /api/admin/monitoring/alerts/rules/:id - Delete alert rule
router.delete('/alerts/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Deleting alert rule: ${id}`);
    
    const [deletedRule] = await db
      .delete(alertRules)
      .where(eq(alertRules.id, id))
      .returning();
    
    if (!deletedRule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Delete Alert Rule',
      `Deleted alert rule: ${deletedRule.name}`,
      'alert_configuration',
      id,
      'alert_rule',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      message: 'Alert rule deleted successfully',
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});

// POST /api/admin/monitoring/alerts/rules/:id/toggle - Toggle alert rule
router.post('/alerts/rules/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Toggling alert rule: ${id}`);
    
    // Get current rule
    const [currentRule] = await db
      .select()
      .from(alertRules)
      .where(eq(alertRules.id, id));
    
    if (!currentRule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    
    // Toggle enabled status
    const [updatedRule] = await db
      .update(alertRules)
      .set({
        enabled: !currentRule.enabled,
        updatedAt: new Date(),
      })
      .where(eq(alertRules.id, id))
      .returning();
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Toggle Alert Rule',
      `${updatedRule.enabled ? 'Enabled' : 'Disabled'} alert rule: ${updatedRule.name}`,
      'alert_configuration',
      id,
      'alert_rule',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      rule: updatedRule,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error toggling alert rule:', error);
    res.status(500).json({ error: 'Failed to toggle alert rule' });
  }
});

// ==================== ALERT CONFIGURATION ====================

// GET /api/admin/monitoring/alerts/configuration - Get alert configuration
router.get('/alerts/configuration', async (req, res) => {
  try {
    console.log('📊 Alert configuration endpoint hit');
    
    const [config] = await db
      .select()
      .from(alertConfiguration)
      .where(eq(alertConfiguration.id, 'global'));
    
    // Return default configuration if none exists
    const defaultConfig = {
      id: 'global',
      globalSettings: {
        enableNotifications: true,
        defaultSeverity: 'medium',
        retentionDays: 30,
        maxAlertsPerHour: 100,
        autoEscalationEnabled: true,
        escalationDelayMinutes: 30,
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
        slack: {
          enabled: false,
          webhookUrl: '',
          channel: '#alerts',
        },
      },
      escalationMatrix: [],
    };
    
    res.json({
      success: true,
      configuration: config || defaultConfig,
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
    
    // Upsert configuration
    const [updatedConfig] = await db
      .insert(alertConfiguration)
      .values({
        id: 'global',
        globalSettings: configuration.globalSettings,
        notificationChannels: configuration.notificationChannels,
        escalationMatrix: configuration.escalationMatrix,
        updatedAt: new Date(),
        updatedBy: req.user!.id,
      })
      .onConflictDoUpdate({
        target: alertConfiguration.id,
        set: {
          globalSettings: configuration.globalSettings,
          notificationChannels: configuration.notificationChannels,
          escalationMatrix: configuration.escalationMatrix,
          updatedAt: new Date(),
          updatedBy: req.user!.id,
        },
      })
      .returning();
    
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
      configuration: updatedConfig,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error updating alert configuration:', error);
    res.status(500).json({ error: 'Failed to update alert configuration' });
  }
});

// ==================== ALERT ANALYTICS ====================

// GET /api/admin/monitoring/alerts/analytics - Get alert analytics
router.get('/alerts/analytics', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    console.log(`📊 Alert analytics endpoint hit for ${timeRange}`);
    
    const analytics = await getAlertAnalytics(timeRange as string);
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Alert Analytics',
      `Viewed alert analytics for ${timeRange}`,
      'alert_monitoring',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      analytics,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching alert analytics:', error);
    res.status(500).json({ error: 'Failed to fetch alert analytics' });
  }
});

// GET /api/admin/monitoring/alerts/metrics - Get alert metrics
router.get('/alerts/metrics', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    console.log(`📊 Alert metrics endpoint hit for ${days} days`);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));
    
    const metrics = await db
      .select()
      .from(alertMetrics)
      .where(gte(alertMetrics.date, startDate))
      .orderBy(asc(alertMetrics.date), asc(alertMetrics.hour));
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching alert metrics:', error);
    res.status(500).json({ error: 'Failed to fetch alert metrics' });
  }
});

// GET /api/admin/monitoring/alerts/delivery-log - Get notification delivery log
router.get('/alerts/delivery-log', async (req, res) => {
  try {
    const { alertId, channel, limit = 100 } = req.query;
    console.log('📊 Notification delivery log endpoint hit');
    
    let whereConditions = [];
    
    if (alertId) {
      whereConditions.push(eq(notificationDeliveryLog.alertId, alertId as string));
    }
    
    if (channel) {
      whereConditions.push(eq(notificationDeliveryLog.channel, channel as string));
    }
    
    const deliveryLog = await db
      .select()
      .from(notificationDeliveryLog)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(notificationDeliveryLog.createdAt))
      .limit(parseInt(limit as string));
    
    res.json({
      success: true,
      deliveryLog,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching delivery log:', error);
    res.status(500).json({ error: 'Failed to fetch delivery log' });
  }
});

// ==================== MANUAL ALERT OPERATIONS ====================

// POST /api/admin/monitoring/alerts/create - Create manual alert
router.post('/alerts/create', async (req, res) => {
  try {
    console.log('📊 Creating manual alert');
    
    const alertData = req.body;
    const alertId = await createAlert({
      ...alertData,
      source: `manual_${req.user!.id}`,
    });
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Create Manual Alert',
      `Created manual alert: ${alertData.title}`,
      'alert_management',
      alertId,
      'alert',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      alertId,
      message: 'Alert created successfully',
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error creating manual alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// POST /api/admin/monitoring/alerts/test-notifications - Test notification channels
router.post('/alerts/test-notifications', async (req, res) => {
  try {
    const { channels } = req.body;
    console.log('📊 Testing notification channels:', channels);
    
    // Create a test alert
    const testAlertId = await createAlert({
      type: 'system',
      severity: 'low',
      title: 'Test Alert - Notification Channel Test',
      message: 'This is a test alert to verify notification channel configuration.',
      source: `test_${req.user!.id}`,
    });
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Test Notification Channels',
      `Tested notification channels: ${channels.join(', ')}`,
      'alert_configuration',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      testAlertId,
      message: 'Test notifications sent successfully',
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error testing notifications:', error);
    res.status(500).json({ error: 'Failed to test notifications' });
  }
});

// POST /api/admin/monitoring/alerts/run-monitoring - Manually trigger alert monitoring
router.post('/alerts/run-monitoring', async (req, res) => {
  try {
    console.log('📊 Manually triggering alert monitoring');
    
    // Run alert monitoring
    await runAlertMonitoring();
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Run Alert Monitoring',
      'Manually triggered alert monitoring cycle',
      'alert_monitoring',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      message: 'Alert monitoring completed successfully',
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error running alert monitoring:', error);
    res.status(500).json({ error: 'Failed to run alert monitoring' });
  }
});

export { router as automatedAlertingRoutes };