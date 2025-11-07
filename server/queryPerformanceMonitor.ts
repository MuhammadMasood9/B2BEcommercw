import { pool } from './db';

/**
 * Query Performance Monitor
 * Provides utilities for monitoring and optimizing database query performance
 */

export interface QueryStats {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  minTime: number;
  maxTime: number;
}

export interface IndexUsageStats {
  schemaName: string;
  tableName: string;
  indexName: string;
  indexScans: number;
  tuplesRead: number;
  tuplesFetched: number;
}

export interface TableStats {
  schemaName: string;
  tableName: string;
  rowCount: number;
  totalSize: string;
  indexSize: string;
  tableSize: string;
}

/**
 * Get slow query statistics from pg_stat_statements
 * Requires pg_stat_statements extension to be enabled
 */
export async function getSlowQueries(limit: number = 10): Promise<QueryStats[]> {
  try {
    const result = await pool.query(`
      SELECT 
        query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        min_exec_time as min_time,
        max_exec_time as max_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  } catch (error) {
    console.warn('pg_stat_statements extension not available:', error);
    return [];
  }
}

/**
 * Get index usage statistics
 */
export async function getIndexUsageStats(): Promise<IndexUsageStats[]> {
  const result = await pool.query(`
    SELECT 
      schemaname as schema_name,
      tablename as table_name,
      indexname as index_name,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC
  `);
  
  return result.rows;
}

/**
 * Get unused indexes (indexes with zero scans)
 */
export async function getUnusedIndexes(): Promise<IndexUsageStats[]> {
  const result = await pool.query(`
    SELECT 
      schemaname as schema_name,
      tablename as table_name,
      indexname as index_name,
      idx_scan as index_scans,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
      AND indexrelname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(indexrelid) DESC
  `);
  
  return result.rows;
}

/**
 * Get table statistics including size and row count
 */
export async function getTableStats(): Promise<TableStats[]> {
  const result = await pool.query(`
    SELECT 
      schemaname as schema_name,
      tablename as table_name,
      n_live_tup as row_count,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
      pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  `);
  
  return result.rows;
}

/**
 * Get cache hit ratio for tables
 */
export async function getCacheHitRatio(): Promise<{ tableName: string; cacheHitRatio: number }[]> {
  const result = await pool.query(`
    SELECT 
      relname as table_name,
      CASE 
        WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
        ELSE ROUND(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
      END as cache_hit_ratio
    FROM pg_statio_user_tables
    ORDER BY cache_hit_ratio ASC
  `);
  
  return result.rows;
}

/**
 * Get active connections and their states
 */
export async function getActiveConnections(): Promise<any[]> {
  const result = await pool.query(`
    SELECT 
      pid,
      usename as username,
      application_name,
      client_addr,
      state,
      query,
      state_change,
      NOW() - state_change as duration
    FROM pg_stat_activity
    WHERE state != 'idle'
      AND pid != pg_backend_pid()
    ORDER BY state_change ASC
  `);
  
  return result.rows;
}

/**
 * Get long-running queries
 */
export async function getLongRunningQueries(thresholdSeconds: number = 30): Promise<any[]> {
  const result = await pool.query(`
    SELECT 
      pid,
      usename as username,
      application_name,
      client_addr,
      state,
      query,
      NOW() - query_start as duration
    FROM pg_stat_activity
    WHERE state != 'idle'
      AND pid != pg_backend_pid()
      AND NOW() - query_start > INTERVAL '${thresholdSeconds} seconds'
    ORDER BY query_start ASC
  `);
  
  return result.rows;
}

/**
 * Get table bloat estimation
 */
export async function getTableBloat(): Promise<any[]> {
  const result = await pool.query(`
    SELECT 
      schemaname as schema_name,
      tablename as table_name,
      n_dead_tup as dead_tuples,
      n_live_tup as live_tuples,
      CASE 
        WHEN n_live_tup = 0 THEN 0
        ELSE ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
      END as bloat_ratio,
      last_vacuum,
      last_autovacuum
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 1000
    ORDER BY n_dead_tup DESC
  `);
  
  return result.rows;
}

/**
 * Analyze a specific table to update statistics
 */
export async function analyzeTable(tableName: string): Promise<void> {
  await pool.query(`ANALYZE ${tableName}`);
}

/**
 * Vacuum a specific table
 */
export async function vacuumTable(tableName: string, full: boolean = false): Promise<void> {
  const vacuumType = full ? 'VACUUM FULL' : 'VACUUM';
  await pool.query(`${vacuumType} ${tableName}`);
}

/**
 * Get database size
 */
export async function getDatabaseSize(): Promise<{ size: string; connections: number }> {
  const sizeResult = await pool.query(`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size
  `);
  
  const connResult = await pool.query(`
    SELECT count(*) as connections
    FROM pg_stat_activity
    WHERE datname = current_database()
  `);
  
  return {
    size: sizeResult.rows[0].size,
    connections: parseInt(connResult.rows[0].connections)
  };
}

/**
 * Get query execution plan
 */
export async function explainQuery(query: string, analyze: boolean = false): Promise<any[]> {
  const explainType = analyze ? 'EXPLAIN ANALYZE' : 'EXPLAIN';
  const result = await pool.query(`${explainType} ${query}`);
  return result.rows;
}

/**
 * Reset query statistics (requires superuser)
 */
export async function resetQueryStats(): Promise<void> {
  try {
    await pool.query('SELECT pg_stat_statements_reset()');
  } catch (error) {
    console.warn('Failed to reset query statistics:', error);
  }
}

/**
 * Get comprehensive performance report
 */
export async function getPerformanceReport(): Promise<{
  databaseSize: { size: string; connections: number };
  slowQueries: QueryStats[];
  unusedIndexes: IndexUsageStats[];
  cacheHitRatio: { tableName: string; cacheHitRatio: number }[];
  tableBloat: any[];
  longRunningQueries: any[];
}> {
  const [
    databaseSize,
    slowQueries,
    unusedIndexes,
    cacheHitRatio,
    tableBloat,
    longRunningQueries
  ] = await Promise.all([
    getDatabaseSize(),
    getSlowQueries(10),
    getUnusedIndexes(),
    getCacheHitRatio(),
    getTableBloat(),
    getLongRunningQueries(30)
  ]);
  
  return {
    databaseSize,
    slowQueries,
    unusedIndexes,
    cacheHitRatio,
    tableBloat,
    longRunningQueries
  };
}

/**
 * Schedule automatic maintenance tasks
 */
export function scheduleMaintenanceTasks() {
  // Run ANALYZE on key tables every hour
  setInterval(async () => {
    try {
      console.log('Running scheduled ANALYZE on key tables...');
      const keyTables = [
        'users',
        'authentication_audit_logs',
        'supplier_profiles',
        'products',
        'orders',
        'inquiries',
        'conversations',
        'messages'
      ];
      
      for (const table of keyTables) {
        await analyzeTable(table);
      }
      
      console.log('Scheduled ANALYZE completed');
    } catch (error) {
      console.error('Scheduled ANALYZE failed:', error);
    }
  }, 60 * 60 * 1000); // Every hour
  
  // Check for long-running queries every 5 minutes
  setInterval(async () => {
    try {
      const longQueries = await getLongRunningQueries(60);
      if (longQueries.length > 0) {
        console.warn(`Found ${longQueries.length} long-running queries (>60s)`);
        longQueries.forEach(q => {
          console.warn(`  PID ${q.pid}: ${q.query.substring(0, 100)}... (${q.duration})`);
        });
      }
    } catch (error) {
      console.error('Long-running query check failed:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}
