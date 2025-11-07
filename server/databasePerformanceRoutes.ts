import { Router } from 'express';
import { hybridAuthMiddleware } from './authMiddleware';
import { requireRoles } from './authGuards';
import * as performanceMonitor from './queryPerformanceMonitor';

const router = Router();

/**
 * Get comprehensive performance report
 * Admin only
 */
router.get('/api/admin/database/performance', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const report = await performanceMonitor.getPerformanceReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Failed to get performance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance report',
      message: error.message
    });
  }
});

/**
 * Get slow queries
 * Admin only
 */
router.get('/api/admin/database/slow-queries', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const slowQueries = await performanceMonitor.getSlowQueries(limit);
    res.json({
      success: true,
      data: slowQueries
    });
  } catch (error: any) {
    console.error('Failed to get slow queries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve slow queries',
      message: error.message
    });
  }
});

/**
 * Get index usage statistics
 * Admin only
 */
router.get('/api/admin/database/index-usage', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const indexStats = await performanceMonitor.getIndexUsageStats();
    res.json({
      success: true,
      data: indexStats
    });
  } catch (error: any) {
    console.error('Failed to get index usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve index usage statistics',
      message: error.message
    });
  }
});

/**
 * Get unused indexes
 * Admin only
 */
router.get('/api/admin/database/unused-indexes', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const unusedIndexes = await performanceMonitor.getUnusedIndexes();
    res.json({
      success: true,
      data: unusedIndexes
    });
  } catch (error: any) {
    console.error('Failed to get unused indexes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve unused indexes',
      message: error.message
    });
  }
});

/**
 * Get table statistics
 * Admin only
 */
router.get('/api/admin/database/table-stats', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const tableStats = await performanceMonitor.getTableStats();
    res.json({
      success: true,
      data: tableStats
    });
  } catch (error: any) {
    console.error('Failed to get table stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve table statistics',
      message: error.message
    });
  }
});

/**
 * Get cache hit ratio
 * Admin only
 */
router.get('/api/admin/database/cache-hit-ratio', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const cacheHitRatio = await performanceMonitor.getCacheHitRatio();
    res.json({
      success: true,
      data: cacheHitRatio
    });
  } catch (error: any) {
    console.error('Failed to get cache hit ratio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache hit ratio',
      message: error.message
    });
  }
});

/**
 * Get active connections
 * Admin only
 */
router.get('/api/admin/database/connections', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const connections = await performanceMonitor.getActiveConnections();
    res.json({
      success: true,
      data: connections
    });
  } catch (error: any) {
    console.error('Failed to get active connections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve active connections',
      message: error.message
    });
  }
});

/**
 * Get long-running queries
 * Admin only
 */
router.get('/api/admin/database/long-queries', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 30;
    const longQueries = await performanceMonitor.getLongRunningQueries(threshold);
    res.json({
      success: true,
      data: longQueries
    });
  } catch (error: any) {
    console.error('Failed to get long-running queries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve long-running queries',
      message: error.message
    });
  }
});

/**
 * Get table bloat
 * Admin only
 */
router.get('/api/admin/database/table-bloat', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const tableBloat = await performanceMonitor.getTableBloat();
    res.json({
      success: true,
      data: tableBloat
    });
  } catch (error: any) {
    console.error('Failed to get table bloat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve table bloat information',
      message: error.message
    });
  }
});

/**
 * Get database size
 * Admin only
 */
router.get('/api/admin/database/size', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const dbSize = await performanceMonitor.getDatabaseSize();
    res.json({
      success: true,
      data: dbSize
    });
  } catch (error: any) {
    console.error('Failed to get database size:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve database size',
      message: error.message
    });
  }
});

/**
 * Analyze a specific table
 * Admin only
 */
router.post('/api/admin/database/analyze/:tableName', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const { tableName } = req.params;
    await performanceMonitor.analyzeTable(tableName);
    res.json({
      success: true,
      message: `Table ${tableName} analyzed successfully`
    });
  } catch (error: any) {
    console.error('Failed to analyze table:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze table',
      message: error.message
    });
  }
});

/**
 * Vacuum a specific table
 * Admin only
 */
router.post('/api/admin/database/vacuum/:tableName', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const { tableName } = req.params;
    const full = req.body.full === true;
    await performanceMonitor.vacuumTable(tableName, full);
    res.json({
      success: true,
      message: `Table ${tableName} vacuumed successfully`
    });
  } catch (error: any) {
    console.error('Failed to vacuum table:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to vacuum table',
      message: error.message
    });
  }
});

/**
 * Explain query execution plan
 * Admin only
 */
router.post('/api/admin/database/explain', hybridAuthMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const { query, analyze } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const plan = await performanceMonitor.explainQuery(query, analyze);
    res.json({
      success: true,
      data: plan
    });
  } catch (error: any) {
    console.error('Failed to explain query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to explain query',
      message: error.message
    });
  }
});

export default router;
