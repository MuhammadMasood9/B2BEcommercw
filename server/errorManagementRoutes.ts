import express from 'express';
import { z } from 'zod';
import { errorMonitoring } from './errorMonitoring';
import { ErrorType } from './errorHandler';
import { requireAdmin } from './authMiddleware';

const router = express.Router();

// Validation schemas
const errorFiltersSchema = z.object({
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  errorType: z.nativeEnum(ErrorType).optional(),
  statusCode: z.coerce.number().optional(),
  userId: z.string().optional(),
  endpoint: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0)
});

const errorTrendsSchema = z.object({
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day')
});

// Get error metrics (admin only)
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const metrics = errorMonitoring.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      error: {
        code: 'METRICS_FETCH_ERROR',
        message: 'Failed to fetch error metrics',
        type: ErrorType.SYSTEM
      }
    });
  }
});

// Get error logs with filtering (admin only)
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const validation = errorFiltersSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filter parameters',
          type: ErrorType.VALIDATION,
          details: validation.error.errors
        }
      });
    }
    
    const filters = validation.data;
    const logs = errorMonitoring.getErrorLogs(filters);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          offset: filters.offset,
          limit: filters.limit,
          total: logs.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      error: {
        code: 'LOGS_FETCH_ERROR',
        message: 'Failed to fetch error logs',
        type: ErrorType.SYSTEM
      }
    });
  }
});

// Get error trends (admin only)
router.get('/trends', requireAdmin, async (req, res) => {
  try {
    const validation = errorTrendsSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid timeframe parameter',
          type: ErrorType.VALIDATION,
          details: validation.error.errors
        }
      });
    }
    
    const { timeframe } = validation.data;
    const trends = errorMonitoring.getErrorTrends(timeframe);
    
    res.json({
      success: true,
      data: {
        timeframe,
        trends
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      error: {
        code: 'TRENDS_FETCH_ERROR',
        message: 'Failed to fetch error trends',
        type: ErrorType.SYSTEM
      }
    });
  }
});

// Get top error patterns (admin only)
router.get('/patterns', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const patterns = errorMonitoring.getTopErrorPatterns(limit);
    
    res.json({
      success: true,
      data: {
        patterns,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({
      error: {
        code: 'PATTERNS_FETCH_ERROR',
        message: 'Failed to fetch error patterns',
        type: ErrorType.SYSTEM
      }
    });
  }
});

// Get error statistics summary (admin only)
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const metrics = errorMonitoring.getMetrics();
    const patterns = errorMonitoring.getTopErrorPatterns(5);
    const trends = errorMonitoring.getErrorTrends('day');
    
    // Calculate additional statistics
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = errorMonitoring.getErrorLogs({
      startDate: last24Hours,
      limit: 1000
    });
    
    const criticalErrors = recentLogs.filter(log => !log.error.isOperational).length;
    const mostAffectedEndpoints = Object.entries(metrics.errorsByEndpoint)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));
    
    const summary = {
      overview: {
        totalErrors: metrics.totalErrors,
        errorRate: metrics.errorRate,
        averageResponseTime: metrics.averageResponseTime,
        criticalErrors,
        lastUpdated: metrics.lastUpdated
      },
      distribution: {
        byType: metrics.errorsByType,
        byStatusCode: metrics.errorsByStatusCode,
        mostAffectedEndpoints
      },
      topPatterns: patterns,
      trends: trends.slice(-12) // Last 12 data points
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      error: {
        code: 'SUMMARY_FETCH_ERROR',
        message: 'Failed to fetch error summary',
        type: ErrorType.SYSTEM
      }
    });
  }
});

// Export error data (admin only)
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const validation = errorFiltersSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filter parameters',
          type: ErrorType.VALIDATION,
          details: validation.error.errors
        }
      });
    }
    
    const filters = validation.data;
    const logs = errorMonitoring.getErrorLogs({
      ...filters,
      limit: 10000 // Max export limit
    });
    
    const format = req.query.format as string || 'json';
    
    if (format === 'csv') {
      // Convert to CSV
      const csvHeaders = [
        'Timestamp',
        'Request ID',
        'Error Type',
        'Status Code',
        'Message',
        'Method',
        'Path',
        'User ID',
        'IP Address',
        'Response Time'
      ];
      
      const csvRows = logs.map(log => [
        log.timestamp.toISOString(),
        log.requestId,
        log.error.type,
        log.error.statusCode,
        `"${log.error.message.replace(/"/g, '""')}"`,
        log.request.method,
        log.request.path,
        log.request.userId || '',
        log.request.ip,
        log.response.responseTime
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="error-logs-${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="error-logs-${Date.now()}.json"`);
      res.json({
        exportDate: new Date().toISOString(),
        filters,
        totalRecords: logs.length,
        data: logs
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to export error data',
        type: ErrorType.SYSTEM
      }
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    const metrics = errorMonitoring.getMetrics();
    const isHealthy = metrics.errorRate < 10; // Less than 10 errors per second
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      metrics: {
        errorRate: metrics.errorRate,
        totalErrors: metrics.totalErrors,
        lastUpdated: metrics.lastUpdated
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

export default router;