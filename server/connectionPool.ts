import { Pool, PoolClient } from 'pg';
import { db, pool } from './db';

// Enhanced connection pool management
export class ConnectionPoolManager {
  private pool: Pool;
  private connectionMetrics: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    totalQueries: number;
    totalErrors: number;
    averageQueryTime: number;
    lastResetTime: Date;
  };

  constructor(pool: Pool) {
    this.pool = pool;
    this.connectionMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      totalErrors: 0,
      averageQueryTime: 0,
      lastResetTime: new Date(),
    };

    this.setupEventListeners();
    this.startMetricsCollection();
  }

  // Setup event listeners for connection pool monitoring
  private setupEventListeners(): void {
    this.pool.on('connect', (client: PoolClient) => {
      this.connectionMetrics.totalConnections++;
      console.log('New client connected. Total connections:', this.connectionMetrics.totalConnections);
    });

    this.pool.on('acquire', (client: PoolClient) => {
      this.connectionMetrics.activeConnections++;
    });

    this.pool.on('release', (client: PoolClient) => {
      this.connectionMetrics.activeConnections--;
    });

    this.pool.on('remove', (client: PoolClient) => {
      this.connectionMetrics.totalConnections--;
      console.log('Client removed. Total connections:', this.connectionMetrics.totalConnections);
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      this.connectionMetrics.totalErrors++;
      console.error('Database pool error:', err);
    });
  }

  // Start collecting metrics periodically
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Update every 30 seconds
  }

  // Update connection pool metrics
  private updateMetrics(): void {
    this.connectionMetrics.totalConnections = this.pool.totalCount;
    this.connectionMetrics.activeConnections = this.pool.totalCount - this.pool.idleCount;
    this.connectionMetrics.idleConnections = this.pool.idleCount;
    this.connectionMetrics.waitingClients = this.pool.waitingCount;
  }

  // Get current pool statistics
  getPoolStats(): any {
    this.updateMetrics();
    
    return {
      ...this.connectionMetrics,
      poolConfig: {
        max: this.pool.options.max,
        min: this.pool.options.min || 0,
        idleTimeoutMillis: this.pool.options.idleTimeoutMillis,
        connectionTimeoutMillis: this.pool.options.connectionTimeoutMillis,
      },
      currentState: {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      },
      healthStatus: this.getHealthStatus(),
    };
  }

  // Determine pool health status
  private getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const utilizationRate = this.connectionMetrics.activeConnections / (this.pool.options.max || 20);
    const errorRate = this.connectionMetrics.totalErrors / Math.max(this.connectionMetrics.totalQueries, 1);

    if (errorRate > 0.1 || utilizationRate > 0.9) {
      return 'critical';
    } else if (errorRate > 0.05 || utilizationRate > 0.7) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  // Execute query with timing and error tracking
  async executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
    const startTime = Date.now();
    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();
      this.connectionMetrics.totalQueries++;
      
      const result = await client.query(query, params);
      
      // Update average query time
      const queryTime = Date.now() - startTime;
      this.connectionMetrics.averageQueryTime = 
        (this.connectionMetrics.averageQueryTime * (this.connectionMetrics.totalQueries - 1) + queryTime) / 
        this.connectionMetrics.totalQueries;

      return result.rows;
    } catch (error) {
      this.connectionMetrics.totalErrors++;
      console.error('Query execution error:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Execute transaction with automatic rollback on error
  async executeTransaction<T>(
    queries: Array<{ query: string; params?: any[] }>,
    callback?: (client: PoolClient) => Promise<T>
  ): Promise<T | void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      if (callback) {
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } else {
        for (const { query, params } of queries) {
          await client.query(query, params);
        }
        await client.query('COMMIT');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      this.connectionMetrics.totalErrors++;
      throw error;
    } finally {
      client.release();
    }
  }

  // Optimize pool configuration based on current usage
  async optimizePoolConfiguration(): Promise<void> {
    const stats = this.getPoolStats();
    const recommendations = [];

    // Analyze connection usage patterns
    if (stats.currentState.waitingCount > 0) {
      recommendations.push('Consider increasing max connections');
    }

    if (stats.healthStatus === 'critical') {
      recommendations.push('Pool is in critical state - immediate attention required');
    }

    if (stats.connectionMetrics.averageQueryTime > 1000) {
      recommendations.push('High average query time detected - consider query optimization');
    }

    console.log('Pool optimization recommendations:', recommendations);
  }

  // Gracefully drain the pool
  async drainPool(): Promise<void> {
    console.log('Draining connection pool...');
    
    try {
      await this.pool.end();
      console.log('Connection pool drained successfully');
    } catch (error) {
      console.error('Error draining connection pool:', error);
      throw error;
    }
  }

  // Reset metrics
  resetMetrics(): void {
    this.connectionMetrics = {
      totalConnections: this.pool.totalCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      totalQueries: 0,
      totalErrors: 0,
      averageQueryTime: 0,
      lastResetTime: new Date(),
    };
  }

  // Test pool connectivity
  async testConnectivity(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Pool connectivity test failed:', error);
      return false;
    }
  }

  // Get detailed connection information
  async getDetailedConnectionInfo(): Promise<any> {
    try {
      const client = await this.pool.connect();
      
      const [
        activeConnections,
        databaseStats,
        lockInfo
      ] = await Promise.all([
        client.query(`
          SELECT 
            pid,
            usename,
            application_name,
            client_addr,
            state,
            query_start,
            state_change,
            query
          FROM pg_stat_activity 
          WHERE datname = current_database()
            AND state != 'idle'
          ORDER BY query_start DESC;
        `),
        
        client.query(`
          SELECT 
            numbackends,
            xact_commit,
            xact_rollback,
            blks_read,
            blks_hit,
            tup_returned,
            tup_fetched,
            tup_inserted,
            tup_updated,
            tup_deleted,
            conflicts,
            temp_files,
            temp_bytes,
            deadlocks
          FROM pg_stat_database 
          WHERE datname = current_database();
        `),
        
        client.query(`
          SELECT 
            locktype,
            mode,
            granted,
            pid,
            query
          FROM pg_locks l
          LEFT JOIN pg_stat_activity a ON l.pid = a.pid
          WHERE NOT granted
          ORDER BY locktype, mode;
        `)
      ]);

      client.release();

      return {
        activeConnections: activeConnections.rows,
        databaseStats: databaseStats.rows[0],
        lockInfo: lockInfo.rows,
        poolStats: this.getPoolStats(),
      };
    } catch (error) {
      console.error('Failed to get detailed connection info:', error);
      return { error: error.message };
    }
  }
}

// Create singleton instance
export const connectionPoolManager = new ConnectionPoolManager(pool);

// Export utility functions
export const getPoolStats = () => connectionPoolManager.getPoolStats();
export const executeOptimizedQuery = <T = any>(query: string, params?: any[]) => 
  connectionPoolManager.executeQuery<T>(query, params);
export const executeTransaction = <T>(
  queries: Array<{ query: string; params?: any[] }>,
  callback?: (client: PoolClient) => Promise<T>
) => connectionPoolManager.executeTransaction(queries, callback);

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, draining connection pool...');
  await connectionPoolManager.drainPool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, draining connection pool...');
  await connectionPoolManager.drainPool();
  process.exit(0);
});