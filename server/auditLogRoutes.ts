import { Router } from 'express';
import { AuditLogService, AuditLogQuery } from './auditLogService';
import { requireRole } from './auth';

const router = Router();

// Get audit logs (admin only)
router.get('/logs', requireRole(['admin']), async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      action,
      ipAddress,
      success,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    const query: AuditLogQuery = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (userId) query.userId = userId as string;
    if (userEmail) query.userEmail = userEmail as string;
    if (action) query.action = action as string;
    if (ipAddress) query.ipAddress = ipAddress as string;
    if (success !== undefined) query.success = success === 'true';
    if (startDate) query.startDate = new Date(startDate as string);
    if (endDate) query.endDate = new Date(endDate as string);

    const logs = await AuditLogService.queryLogs(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: logs.length
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

// Get audit log statistics (admin only)
router.get('/stats', requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await AuditLogService.getStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log statistics'
    });
  }
});

// Get suspicious activity (admin only)
router.get('/suspicious', requireRole(['admin']), async (req, res) => {
  try {
    const { 
      timeWindowMinutes = 60, 
      minAttempts = 10 
    } = req.query;

    const suspiciousActivity = await AuditLogService.getSuspiciousActivity(
      parseInt(timeWindowMinutes as string),
      parseInt(minAttempts as string)
    );

    res.json({
      success: true,
      data: suspiciousActivity
    });
  } catch (error) {
    console.error('Error fetching suspicious activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suspicious activity'
    });
  }
});

// Get recent failed attempts for a user (admin only)
router.get('/failed-attempts/:email', requireRole(['admin']), async (req, res) => {
  try {
    const { email } = req.params;
    const { timeWindowMinutes = 15 } = req.query;

    const failedAttempts = await AuditLogService.getRecentFailedAttempts(
      email,
      parseInt(timeWindowMinutes as string)
    );

    res.json({
      success: true,
      data: failedAttempts
    });
  } catch (error) {
    console.error('Error fetching failed attempts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch failed attempts'
    });
  }
});

// Export audit logs (admin only)
router.get('/export', requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const exportData = await AuditLogService.exportLogs(
      new Date(startDate as string),
      new Date(endDate as string),
      format as 'json' | 'csv'
    );

    const filename = `audit_logs_${startDate}_${endDate}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
});

// Manual cleanup of old logs (admin only)
router.post('/cleanup', requireRole(['admin']), async (req, res) => {
  try {
    const { retentionDays = 90 } = req.body;

    const deletedCount = await AuditLogService.cleanupOldLogs(
      parseInt(retentionDays)
    );

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old audit log entries`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup audit logs'
    });
  }
});

export { router as auditLogRoutes };