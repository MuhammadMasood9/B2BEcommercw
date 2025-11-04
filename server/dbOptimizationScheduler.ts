import cron from 'node-cron';
import { queryOptimizer, dbMaintenance, queryCache } from './db-optimization';
import { connectionPoolManager } from './connectionPool';

// Database optimization scheduler for automated maintenance
export class DatabaseOptimizationScheduler {
  private isRunning: boolean = false;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.setupScheduledTasks();
  }

  // Setup all scheduled optimization tasks
  private setupScheduledTasks(): void {
    // Daily maintenance at 2 AM
    const dailyMaintenance = cron.schedule('0 2 * * *', async () => {
      await this.runDailyMaintenance();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    this.scheduledTasks.set('dailyMaintenance', dailyMaintenance);

    // Weekly deep maintenance on Sundays at 3 AM
    const weeklyMaintenance = cron.schedule('0 3 * * 0', async () => {
      await this.runWeeklyMaintenance();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    this.scheduledTasks.set('weeklyMaintenance', weeklyMaintenance);

    // Hourly cache cleanup
    const cacheCleanup = cron.schedule('0 * * * *', async () => {
      await this.runCacheCleanup();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    this.scheduledTasks.set('cacheCleanup', cacheCleanup);

    // Every 15 minutes: update table statistics for frequently accessed tables
    const statsUpdate = cron.schedule('*/15 * * * *', async () => {
      await this.runStatsUpdate();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    this.scheduledTasks.set('statsUpdate', statsUpdate);

    // Every 5 minutes: monitor slow queries and connection pool health
    const healthMonitoring = cron.schedule('*/5 * * * *', async () => {
      await this.runHealthMonitoring();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });
    this.scheduledTasks.set('healthMonitoring', healthMonitoring);

    console.log('Database optimization scheduler initialized with 5 scheduled tasks');
  }

  // Start all scheduled tasks
  start(): void {
    if (this.isRunning) {
      console.log('Database optimization scheduler is already running');
      return;
    }

    this.scheduledTasks.forEach((task, name) => {
      task.start();
      console.log(`Started scheduled task: ${name}`);
    });

    this.isRunning = true;
    console.log('Database optimization scheduler started');
  }

  // Stop all scheduled tasks
  stop(): void {
    if (!this.isRunning) {
      console.log('Database optimization scheduler is not running');
      return;
    }

    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped scheduled task: ${name}`);
    });

    this.isRunning = false;
    console.log('Database optimization scheduler stopped');
  }

  // Run daily maintenance tasks
  private async runDailyMaintenance(): Promise<void> {
    console.log('Starting daily database maintenance...');
    
    try {
      // Perform standard maintenance
      await dbMaintenance.performMaintenance({
        vacuum: true,
        analyze: true,
        reindex: false,
        updateStats: true
      });

      // Clean up old data (keep 90 days)
      await dbMaintenance.cleanupOldData({
        daysToKeep: 90,
        cleanupLogs: true,
        cleanupTempData: true
      });

      // Optimize common queries
      await queryOptimizer.optimizeCommonQueries();

      console.log('Daily database maintenance completed successfully');
    } catch (error) {
      console.error('Daily database maintenance failed:', error);
    }
  }

  // Run weekly deep maintenance tasks
  private async runWeeklyMaintenance(): Promise<void> {
    console.log('Starting weekly database maintenance...');
    
    try {
      // Perform comprehensive maintenance including reindexing
      await dbMaintenance.performMaintenance({
        vacuum: true,
        analyze: true,
        reindex: true,
        updateStats: true
      });

      // Generate and log maintenance report
      const report = await dbMaintenance.generateMaintenanceReport();
      console.log('Weekly maintenance report:', JSON.stringify(report, null, 2));

      // Optimize database configuration
      await dbMaintenance.optimizeConfiguration();

      // Reset connection pool metrics
      connectionPoolManager.resetMetrics();

      console.log('Weekly database maintenance completed successfully');
    } catch (error) {
      console.error('Weekly database maintenance failed:', error);
    }
  }

  // Run cache cleanup tasks
  private async runCacheCleanup(): Promise<void> {
    try {
      // Clear expired cache entries
      queryCache.clearExpired();

      // Log cache statistics
      const stats = queryCache.getStats();
      console.log('Cache cleanup completed. Stats:', {
        size: stats.size,
        hitRate: stats.hitRate,
        memoryUsage: `${Math.round(stats.memoryUsage / 1024)} KB`
      });

      // If cache hit rate is low, log warning
      if (stats.hitRate < 50 && stats.hitCount + stats.missCount > 100) {
        console.warn(`Low cache hit rate detected: ${stats.hitRate}%. Consider reviewing caching strategy.`);
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  // Update statistics for frequently accessed tables
  private async runStatsUpdate(): Promise<void> {
    try {
      const frequentTables = [
        'products',
        'orders', 
        'users',
        'supplier_profiles',
        'rfqs',
        'quotations',
        'inquiries',
        'conversations',
        'messages'
      ];

      for (const table of frequentTables) {
        await queryOptimizer.updateTableStats(table);
      }

      console.log('Statistics updated for frequently accessed tables');
    } catch (error) {
      console.error('Stats update failed:', error);
    }
  }

  // Monitor database and connection pool health
  private async runHealthMonitoring(): Promise<void> {
    try {
      // Check connection pool health
      const poolStats = connectionPoolManager.getPoolStats();
      
      if (poolStats.healthStatus === 'critical') {
        console.error('CRITICAL: Database connection pool is in critical state!', {
          activeConnections: poolStats.connectionMetrics.activeConnections,
          totalConnections: poolStats.connectionMetrics.totalConnections,
          waitingClients: poolStats.connectionMetrics.waitingClients,
          errorRate: poolStats.connectionMetrics.totalErrors / Math.max(poolStats.connectionMetrics.totalQueries, 1)
        });
      } else if (poolStats.healthStatus === 'warning') {
        console.warn('WARNING: Database connection pool needs attention', {
          healthStatus: poolStats.healthStatus,
          utilizationRate: poolStats.connectionMetrics.activeConnections / (poolStats.poolConfig.max || 20)
        });
      }

      // Check for slow queries
      const slowQueries = await queryOptimizer.getSlowQueries();
      if (slowQueries.length > 0) {
        console.warn(`Found ${slowQueries.length} slow queries:`, 
          slowQueries.slice(0, 3).map(q => ({
            query: q.query?.substring(0, 100) + '...',
            meanTime: q.mean_time || q.duration,
            calls: q.calls || 1
          }))
        );
      }

      // Check table bloat
      const bloatedTables = await queryOptimizer.getTableBloat();
      const highBloatTables = bloatedTables.filter(table => table.bloat_percent > 30);
      
      if (highBloatTables.length > 0) {
        console.warn(`Tables with high bloat detected:`, 
          highBloatTables.map(table => ({
            tablename: table.tablename,
            bloatPercent: table.bloat_percent,
            deadTuples: table.n_dead_tup
          }))
        );
      }

    } catch (error) {
      console.error('Health monitoring failed:', error);
    }
  }

  // Run maintenance task manually
  async runManualMaintenance(taskType: 'daily' | 'weekly' | 'cache' | 'stats' | 'health'): Promise<void> {
    console.log(`Running manual ${taskType} maintenance...`);
    
    try {
      switch (taskType) {
        case 'daily':
          await this.runDailyMaintenance();
          break;
        case 'weekly':
          await this.runWeeklyMaintenance();
          break;
        case 'cache':
          await this.runCacheCleanup();
          break;
        case 'stats':
          await this.runStatsUpdate();
          break;
        case 'health':
          await this.runHealthMonitoring();
          break;
        default:
          throw new Error(`Unknown maintenance task type: ${taskType}`);
      }
      
      console.log(`Manual ${taskType} maintenance completed successfully`);
    } catch (error) {
      console.error(`Manual ${taskType} maintenance failed:`, error);
      throw error;
    }
  }

  // Get scheduler status
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      scheduledTasks: Array.from(this.scheduledTasks.keys()).map(name => ({
        name,
        running: this.scheduledTasks.get(name)?.getStatus() === 'scheduled'
      })),
      nextRuns: this.getNextRunTimes()
    };
  }

  // Get next run times for all scheduled tasks
  private getNextRunTimes(): any {
    const nextRuns: any = {};
    
    this.scheduledTasks.forEach((task, name) => {
      try {
        // Note: node-cron doesn't provide a direct way to get next run time
        // This is a simplified representation
        nextRuns[name] = 'Scheduled (check cron expression for exact time)';
      } catch (error) {
        nextRuns[name] = 'Error getting next run time';
      }
    });

    return nextRuns;
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('Shutting down database optimization scheduler...');
    this.stop();
    console.log('Database optimization scheduler shutdown complete');
  }
}

// Create singleton instance
export const dbOptimizationScheduler = new DatabaseOptimizationScheduler();

// Auto-start scheduler if not in test environment
if (process.env.NODE_ENV !== 'test') {
  dbOptimizationScheduler.start();
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  await dbOptimizationScheduler.shutdown();
});

process.on('SIGINT', async () => {
  await dbOptimizationScheduler.shutdown();
});

export default dbOptimizationScheduler;