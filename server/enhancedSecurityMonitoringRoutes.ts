import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminMiddleware, authMiddleware } from './auth';
import { enhancedSecurityMonitoringService } from './enhancedSecurityMonitoringService';
import { requirePermission } from './permissionMiddleware';
import { AuditLogService } from './auditLogService';

const router = Router();

// ==================== VALIDATION SCHEMAS ====================

const alertActionSchema = z.object({
  alertId: z.string().uuid(),
  notes: z.string().optional(),
});

const alertResolutionSchema = z.object({
  alertId: z.string().uuid(),
  resolutionNotes: z.string().min(10, 'Resolution notes must be at least 10 characters'),
});

const alertQuerySchema = z.object({
  status: z.enum(['active', 'investigating', 'resolved', 'false_positive']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.string().optional(),
  ipAddress: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// ==================== REAL-TIME MONITORING ROUTES ====================

// GET /api/admin/security/monitoring/dashboard - Get real-time security dashboard
router.get('/dashboard', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const metrics = await enhancedSecurityMonitoringService.getSecurityDashboardMetrics();
    
    res.json({
      success: true,
      dashboard: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get security dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/security/monitoring/alerts - Get security alerts with filtering
router.get('/alerts', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const validationResult = alertQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: validationResult.error.errors 
      });
    }

    const { status, severity, type, ipAddress, limit, offset } = validationResult.data;
    
    // For now, get active alerts (would implement full filtering in production)
    const alerts = await enhancedSecurityMonitoringService.getActiveAlerts(limit);
    
    // Apply client-side filtering (would be done in database query in production)
    let filteredAlerts = alerts;
    
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    if (ipAddress) {
      filteredAlerts = filteredAlerts.filter(alert => alert.ipAddress.includes(ipAddress));
    }
    
    // Apply pagination
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);
    
    res.json({
      success: true,
      alerts: paginatedAlerts,
      pagination: {
        total: filteredAlerts.length,
        limit,
        offset,
        hasMore: offset + limit < filteredAlerts.length,
      },
      summary: {
        total: filteredAlerts.length,
        critical: filteredAlerts.filter(a => a.severity === 'critical').length,
        high: filteredAlerts.filter(a => a.severity === 'high').length,
        medium: filteredAlerts.filter(a => a.severity === 'medium').length,
        low: filteredAlerts.filter(a => a.severity === 'low').length,
      },
    });
  } catch (error) {
    console.error('Get security alerts error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/security/monitoring/alerts/:alertId/acknowledge - Acknowledge an alert
router.post('/alerts/:alertId/acknowledge', authMiddleware, adminMiddleware, requirePermission('security', 'write'), async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;
    
    if (!alertId) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    const adminUser = (req as any).user;
    await enhancedSecurityMonitoringService.acknowledgeAlert(alertId, adminUser.id, notes);
    
    // Log the acknowledgment
    await AuditLogService.logEvent(
      'security_alert_acknowledged',
      req.ip,
      req.get('User-Agent'),
      adminUser.id,
      adminUser.email,
      adminUser.role,
      true,
      undefined,
      undefined,
      undefined,
      { alertId, notes }
    );
    
    res.json({
      success: true,
      message: 'Security alert acknowledged successfully',
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ 
      error: 'Failed to acknowledge security alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/security/monitoring/alerts/:alertId/resolve - Resolve an alert
router.post('/alerts/:alertId/resolve', authMiddleware, adminMiddleware, requirePermission('security', 'write'), async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const validationResult = alertResolutionSchema.safeParse({ alertId, ...req.body });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid resolution data', 
        details: validationResult.error.errors 
      });
    }

    const { resolutionNotes } = validationResult.data;
    const adminUser = (req as any).user;
    
    await enhancedSecurityMonitoringService.resolveAlert(alertId, adminUser.id, resolutionNotes);
    
    // Log the resolution
    await AuditLogService.logEvent(
      'security_alert_resolved',
      req.ip,
      req.get('User-Agent'),
      adminUser.id,
      adminUser.email,
      adminUser.role,
      true,
      undefined,
      undefined,
      undefined,
      { alertId, resolutionNotes }
    );
    
    res.json({
      success: true,
      message: 'Security alert resolved successfully',
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ 
      error: 'Failed to resolve security alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== SECURITY RECOMMENDATIONS ROUTES ====================

// GET /api/admin/security/monitoring/recommendations - Get security recommendations
router.get('/recommendations', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const recommendations = await enhancedSecurityMonitoringService.getSecurityRecommendations();
    
    res.json({
      success: true,
      recommendations,
      summary: {
        total: recommendations.length,
        immediate: recommendations.filter(r => r.type === 'immediate').length,
        shortTerm: recommendations.filter(r => r.type === 'short_term').length,
        longTerm: recommendations.filter(r => r.type === 'long_term').length,
        critical: recommendations.filter(r => r.priority === 'critical').length,
        high: recommendations.filter(r => r.priority === 'high').length,
      },
    });
  } catch (error) {
    console.error('Get security recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== THREAT INTELLIGENCE ROUTES ====================

// GET /api/admin/security/monitoring/threat-intelligence - Get threat intelligence data
router.get('/threat-intelligence', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { ipAddress } = req.query;
    
    // Mock threat intelligence data (would integrate with real threat intelligence feeds)
    const threatIntelligence = {
      ipAddress: ipAddress || 'N/A',
      threatScore: Math.floor(Math.random() * 100),
      threatTypes: ['brute_force', 'suspicious_activity'],
      firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastSeen: new Date(),
      alertCount: Math.floor(Math.random() * 20),
      isBlocked: false,
      geolocation: {
        country: 'Unknown',
        city: 'Unknown',
        coordinates: { lat: 0, lng: 0 },
      },
      userAgents: ['Mozilla/5.0...'],
      targetedUsers: ['user@example.com'],
    };
    
    res.json({
      success: true,
      threatIntelligence,
      disclaimer: 'This is mock data. In production, this would integrate with real threat intelligence feeds.',
    });
  } catch (error) {
    console.error('Get threat intelligence error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch threat intelligence',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== REAL-TIME MONITORING CONTROL ROUTES ====================

// POST /api/admin/security/monitoring/start - Start enhanced monitoring
router.post('/start', authMiddleware, adminMiddleware, requirePermission('security', 'write'), async (req: Request, res: Response) => {
  try {
    await enhancedSecurityMonitoringService.initialize();
    
    const adminUser = (req as any).user;
    await AuditLogService.logEvent(
      'security_monitoring_started',
      req.ip,
      req.get('User-Agent'),
      adminUser.id,
      adminUser.email,
      adminUser.role,
      true,
      undefined,
      undefined,
      undefined,
      { action: 'start_enhanced_monitoring' }
    );
    
    res.json({
      success: true,
      message: 'Enhanced security monitoring started successfully',
    });
  } catch (error) {
    console.error('Start monitoring error:', error);
    res.status(500).json({ 
      error: 'Failed to start enhanced security monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/security/monitoring/stop - Stop enhanced monitoring
router.post('/stop', authMiddleware, adminMiddleware, requirePermission('security', 'write'), async (req: Request, res: Response) => {
  try {
    enhancedSecurityMonitoringService.shutdown();
    
    const adminUser = (req as any).user;
    await AuditLogService.logEvent(
      'security_monitoring_stopped',
      req.ip,
      req.get('User-Agent'),
      adminUser.id,
      adminUser.email,
      adminUser.role,
      true,
      undefined,
      undefined,
      undefined,
      { action: 'stop_enhanced_monitoring' }
    );
    
    res.json({
      success: true,
      message: 'Enhanced security monitoring stopped successfully',
    });
  } catch (error) {
    console.error('Stop monitoring error:', error);
    res.status(500).json({ 
      error: 'Failed to stop enhanced security monitoring',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== SECURITY METRICS AND ANALYTICS ROUTES ====================

// GET /api/admin/security/monitoring/metrics/summary - Get security metrics summary
router.get('/metrics/summary', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const metrics = await enhancedSecurityMonitoringService.getSecurityDashboardMetrics();
    
    // Calculate additional metrics based on time range
    const summary = {
      securityScore: metrics.systemHealth.securityScore,
      riskLevel: metrics.systemHealth.riskLevel,
      activeThreats: metrics.realTimeThreats.total,
      criticalAlerts: metrics.realTimeThreats.critical,
      alertTrends: metrics.alertTrends,
      topThreatTypes: metrics.topThreats.slice(0, 5),
      suspiciousIPCount: metrics.suspiciousIPs.length,
      timeRange,
      lastUpdated: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Get security metrics summary error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security metrics summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/security/monitoring/metrics/trends - Get security trend data
router.get('/metrics/trends', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { period = '7d', metric = 'alerts' } = req.query;
    
    // Mock trend data (would implement actual trend calculation in production)
    const trends = {
      period,
      metric,
      dataPoints: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        value: Math.floor(Math.random() * 10),
      })),
      summary: {
        total: Math.floor(Math.random() * 100),
        average: Math.floor(Math.random() * 10),
        peak: Math.floor(Math.random() * 20),
        trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      },
    };
    
    res.json({
      success: true,
      trends,
    });
  } catch (error) {
    console.error('Get security trends error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security trends',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== INCIDENT RESPONSE ROUTES ====================

// POST /api/admin/security/monitoring/incident/create - Create security incident
router.post('/incident/create', authMiddleware, adminMiddleware, requirePermission('security', 'write'), async (req: Request, res: Response) => {
  try {
    const { title, description, severity, alertIds } = req.body;
    
    if (!title || !description || !severity) {
      return res.status(400).json({ error: 'Title, description, and severity are required' });
    }
    
    const adminUser = (req as any).user;
    const incidentId = `incident_${Date.now()}`;
    
    // Log incident creation
    await AuditLogService.logEvent(
      'security_incident_created',
      req.ip,
      req.get('User-Agent'),
      adminUser.id,
      adminUser.email,
      adminUser.role,
      true,
      undefined,
      undefined,
      undefined,
      {
        incidentId,
        title,
        description,
        severity,
        alertIds: alertIds || [],
      }
    );
    
    res.json({
      success: true,
      incident: {
        id: incidentId,
        title,
        description,
        severity,
        status: 'open',
        createdBy: adminUser.id,
        createdAt: new Date().toISOString(),
        alertIds: alertIds || [],
      },
      message: 'Security incident created successfully',
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ 
      error: 'Failed to create security incident',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== EXPORT AND REPORTING ROUTES ====================

// GET /api/admin/security/monitoring/export/alerts - Export security alerts
router.get('/export/alerts', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const alerts = await enhancedSecurityMonitoringService.getActiveAlerts(1000); // Get more for export
    
    if (format === 'csv') {
      const csvHeaders = ['ID', 'Type', 'Severity', 'Description', 'IP Address', 'User Email', 'Status', 'Created At'];
      const csvRows = alerts.map(alert => [
        alert.id,
        alert.type,
        alert.severity,
        alert.description.replace(/"/g, '""'),
        alert.ipAddress,
        alert.userEmail || '',
        alert.status,
        alert.createdAt.toISOString(),
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="security_alerts.csv"');
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        alerts,
        exportInfo: {
          format,
          exportedAt: new Date().toISOString(),
          totalRecords: alerts.length,
        },
      });
    }
  } catch (error) {
    console.error('Export alerts error:', error);
    res.status(500).json({ 
      error: 'Failed to export security alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;