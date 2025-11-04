import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Optimized connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // Connection pool optimization
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum number of connections
  min: parseInt(process.env.DB_POOL_MIN || '5'), // Minimum number of connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // 10 seconds
  
  // Query optimization
  allowExitOnIdle: true, // Allow process to exit when all connections are idle
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Handle pool connection events
pool.on('connect', (client) => {
  console.log('New database connection established');
  
  // Set session-level optimizations for better performance
  client.query(`
    SET statement_timeout = '30s';
    SET lock_timeout = '10s';
    SET idle_in_transaction_session_timeout = '60s';
    SET work_mem = '32MB';
    SET random_page_cost = 1.1;
    SET effective_io_concurrency = 200;
    SET enable_hashjoin = on;
    SET enable_mergejoin = on;
    SET enable_nestloop = on;
    SET enable_seqscan = on;
    SET enable_indexscan = on;
    SET enable_bitmapscan = on;
  `).catch(err => console.warn('Failed to set session optimizations:', err));
});

export const db = drizzle(pool, { schema });

// Export pool for direct access if needed
export { pool };
