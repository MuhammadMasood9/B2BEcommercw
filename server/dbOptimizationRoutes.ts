import { Router } from 'express';
import { queryOptimizer, dbMaintenance, queryCache, optimizedQueries } from './db-optimization';
import { connectionPoolManager } from './connectionPool';
import { dbOptimizationScheduler } from './dbOptimizationScheduler';

const router = Router();

// Middleware to check admin permissions
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get database optimization status and metrics
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const [
      poolStats,
      cacheStats,
      schedulerStatus,
      connectionInfo
    ] = await Promise.all([
      connectionPoolManager.getPoolStats(),
      queryCache.getStats(),
      dbOptimizationScheduler.getStatus(),
      connectionPoolManager.getDetailedConnectionInfo()
    ]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      connectionPool: poolStats,
      queryCache: cacheStats,
      scheduler: schedulerStatus,
      connectionInfo,
      recommendations: generateOptimizationRecommendations(poolStats, cacheStats)
    });
  } catch (error) {
    console.error('Failed to get optimization status:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get optimization status',
      details: error.message
    });
  }
});

// Get database statistics and analysis
router.get('/database-stats', requireAdmin, async (req, res) => {
  try {
    const [
      dbStats,
      slowQueries,
      missingIndexes,
      tableBloat
    ] = await Promise.all([
      queryOptimizer.getDatabaseStats(),
      queryOptimizer.getSlowQueries(),
      queryOptimizer.findMissingIndexes(),
      queryOptimizer.getTableBloat()
    ]);

    res.json({
      status: 'success',
      databaseStats: dbStats,
      slowQueries,
      missingIndexes,
      tableBloat,
      analysis: {
        cacheHitRatio: dbStats.cacheHitRatio,
        slowQueryCount: slowQueries.length,
        tablesNeedingIndexes: missingIndexes.length,
        bloatedTablesCount: tableBloat.filter(t => t.bloat_percent > 20).length
      }
    });
  } catch (error) {
    console.error('Failed to get database stats:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get database statistics',
      details: error.message
    });
  }
});

// Run manual maintenance tasks
router.post('/maintenance/:taskType', requireAdmin, async (req, res) => {
  const { taskType } = req.params;
  const validTasks = ['daily', 'weekly', 'cache', 'stats', 'health'];

  if (!validTasks.includes(taskType)) {
    return res.status(400).json({
      status: 'error',
      error: 'Invalid task type',
      validTasks
    });
  }

  try {
    await dbOptimizationScheduler.runManualMaintenance(taskType as any);
    
    res.json({
      status: 'success',
      message: `${taskType} maintenance completed successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Manual ${taskType} maintenance failed:`, error);
    res.status(500).json({
      status: 'error',
      error: `${taskType} maintenance failed`,
      details: error.message
    });
  }
});

// Analyze specific query
router.post('/analyze-query', requireAdmin, async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      status: 'error',
      error: 'Query string is required'
    });
  }

  try {
    const analysis = await queryOptimizer.analyzeQuery(query);
    
    res.json({
      status: 'success',
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      analysis
    });
  } catch (error) {
    console.error('Query analysis failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Query analysis failed',
      details: error.message
    });
  }
});

// Update table statistics
router.post('/update-stats/:tableName?', requireAdmin, async (req, res) => {
  const { tableName } = req.params;

  try {
    await queryOptimizer.updateTableStats(tableName);
    
    res.json({
      status: 'success',
      message: tableName 
        ? `Statistics updated for table: ${tableName}`
        : 'Statistics updated for all tables',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats update failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to update statistics',
      details: error.message
    });
  }
});

// Cache management endpoints
router.get('/cache/stats', requireAdmin, (req, res) => {
  try {
    const stats = queryCache.getStats();
    const mostAccessed = queryCache.getMostAccessed(10);
    
    res.json({
      status: 'success',
      cacheStats: stats,
      mostAccessedKeys: mostAccessed
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to get cache stats',
      details: error.message
    });
  }
});

router.post('/cache/clear', requireAdmin, (req, res) => {
  try {
    queryCache.clear();
    
    res.json({
      status: 'success',
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

router.post('/cache/cleanup', requireAdmin, (req, res) => {
  try {
    queryCache.clearExpired();
    const stats = queryCache.getStats();
    
    res.json({
      status: 'success',
      message: 'Expired cache entries cleared',
      cacheStats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to cleanup cache',
      details: error.message
    });
  }
});

// Warm up cache with common queries
router.post('/cache/warmup', requireAdmin, async (req, res) => {
  try {
    const warmupQueries = [
      {
        key: 'categories:active',
        queryFn: async () => {
          return await connectionPoolManager.executeQuery(`
            SELECT id, name, slug, parent_id, image_url 
            FROM categories 
            WHERE is_active = true 
            ORDER BY display_order, name
          `);
        },
        ttl: 600000 // 10 minutes
      },
      {
        key: 'featured_products',
        queryFn: async () => {
          return await connectionPoolManager.executeQuery(`
            SELECT p.*, sp.business_name as supplier_name
            FROM products p
            INNER JOIN supplier_profiles sp ON p.supplier_id = sp.id
            WHERE p.is_featured = true 
              AND p.is_published = true 
              AND p.is_approved = true
            ORDER BY p.created_at DESC
            LIMIT 20
          `);
        },
        ttl: 300000 // 5 minutes
      },
      {
        key: 'verified_suppliers',
        queryFn: async () => {
          return await connectionPoolManager.executeQuery(`
            SELECT id, business_name, country, verification_level, logo_url
            FROM supplier_profiles
            WHERE is_verified = true AND is_active = true
            ORDER BY verification_level DESC, business_name
            LIMIT 50
          `);
        },
        ttl: 600000 // 10 minutes
      }
    ];

    await queryCache.warmUp(warmupQueries);
    const stats = queryCache.getStats();
    
    res.json({
      status: 'success',
      message: 'Cache warmed up successfully',
      cacheStats: stats,
      warmedQueries: warmupQueries.length
    });
  } catch (error) {
    console.error('Cache warmup failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Cache warmup failed',
      details: error.message
    });
  }
});

// Connection pool management
router.get('/connection-pool/stats', requireAdmin, async (req, res) => {
  try {
    const stats = connectionPoolManager.getPoolStats();
    const detailedInfo = await connectionPoolManager.getDetailedConnectionInfo();
    
    res.json({
      status: 'success',
      poolStats: stats,
      detailedInfo
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to get connection pool stats',
      details: error.message
    });
  }
});

router.post('/connection-pool/optimize', requireAdmin, async (req, res) => {
  try {
    await connectionPoolManager.optimizePoolConfiguration();
    const stats = connectionPoolManager.getPoolStats();
    
    res.json({
      status: 'success',
      message: 'Connection pool optimization completed',
      poolStats: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to optimize connection pool',
      details: error.message
    });
  }
});

// Scheduler management
router.get('/scheduler/status', requireAdmin, (req, res) => {
  try {
    const status = dbOptimizationScheduler.getStatus();
    
    res.json({
      status: 'success',
      scheduler: status
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to get scheduler status',
      details: error.message
    });
  }
});

router.post('/scheduler/:action', requireAdmin, (req, res) => {
  const { action } = req.params;

  if (!['start', 'stop'].includes(action)) {
    return res.status(400).json({
      status: 'error',
      error: 'Invalid action. Use "start" or "stop"'
    });
  }

  try {
    if (action === 'start') {
      dbOptimizationScheduler.start();
    } else {
      dbOptimizationScheduler.stop();
    }
    
    const status = dbOptimizationScheduler.getStatus();
    
    res.json({
      status: 'success',
      message: `Scheduler ${action}ed successfully`,
      scheduler: status
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: `Failed to ${action} scheduler`,
      details: error.message
    });
  }
});

// Generate comprehensive maintenance report
router.get('/maintenance-report', requireAdmin, async (req, res) => {
  try {
    const report = await dbMaintenance.generateMaintenanceReport();
    
    res.json({
      status: 'success',
      report,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate maintenance report:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to generate maintenance report',
      details: error.message
    });
  }
});

// Test database connectivity
router.get('/test-connectivity', requireAdmin, async (req, res) => {
  try {
    const isConnected = await connectionPoolManager.testConnectivity();
    
    res.json({
      status: 'success',
      connected: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      connected: false,
      error: 'Connectivity test failed',
      details: error.message
    });
  }
});

// Helper function to generate optimization recommendations
function generateOptimizationRecommendations(poolStats: any, cacheStats: any): string[] {
  const recommendations = [];

  // Connection pool recommendations
  if (poolStats.healthStatus === 'critical') {
    recommendations.push('CRITICAL: Database connection pool requires immediate attention');
  }

  if (poolStats.connectionMetrics.averageQueryTime > 1000) {
    recommendations.push('High average query time detected - consider query optimization');
  }

  if (poolStats.currentState.waitingCount > 0) {
    recommendations.push('Clients waiting for connections - consider increasing pool size');
  }

  // Cache recommendations
  if (cacheStats.hitRate < 50 && cacheStats.hitCount + cacheStats.missCount > 100) {
    recommendations.push('Low cache hit rate - review caching strategy');
  }

  if (cacheStats.size > cacheStats.maxSize * 0.9) {
    recommendations.push('Cache near capacity - consider increasing size or reducing TTL');
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('System performance is optimal');
  }

  return recommendations;
}

export default router;