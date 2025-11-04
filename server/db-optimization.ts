import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { db, pool } from './db';
import * as schema from '@shared/schema';

// Enhanced database connection pool configuration
const connectionConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'marketplace',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  
  // Optimized connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '25'), // Increased max connections
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30'), // Idle timeout in seconds
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10'), // Connection timeout in seconds
  
  // Performance optimizations
  prepare: true, // Use prepared statements for better performance
  transform: {
    undefined: null, // Transform undefined to null
  },
  
  // Connection lifecycle settings
  max_lifetime: parseInt(process.env.DB_MAX_LIFETIME || '3600'), // Max connection lifetime in seconds
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  
  // Additional performance settings
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30 seconds
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '25000'), // 25 seconds
  application_name: 'b2b_marketplace',
};

// Create optimized database connection with pooling
export const createOptimizedConnection = () => {
  const client = postgres(connectionConfig);
  return drizzle(client, { schema });
};

// Enhanced query optimization utilities
export class QueryOptimizer {
  private db: ReturnType<typeof createOptimizedConnection>;
  
  constructor(db: ReturnType<typeof createOptimizedConnection>) {
    this.db = db;
  }

  // Analyze query performance with detailed metrics
  async analyzeQuery(query: string): Promise<any[]> {
    try {
      const result = await this.db.execute(sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql.raw(query)}`);
      return result;
    } catch (error) {
      console.error('Query analysis failed:', error);
      return [];
    }
  }

  // Get comprehensive database statistics
  async getDatabaseStats(): Promise<any> {
    try {
      const [tableStats, indexStats, connectionStats] = await Promise.all([
        // Table statistics
        this.db.execute(sql`
          SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation,
            most_common_vals,
            histogram_bounds
          FROM pg_stats 
          WHERE schemaname = 'public'
          ORDER BY tablename, attname;
        `),
        
        // Index usage statistics
        this.db.execute(sql`
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_tup_read,
            idx_tup_fetch,
            idx_scan
          FROM pg_stat_user_indexes
          WHERE schemaname = 'public'
          ORDER BY idx_scan DESC;
        `),
        
        // Connection and activity statistics
        this.db.execute(sql`
          SELECT 
            datname,
            numbackends,
            xact_commit,
            xact_rollback,
            blks_read,
            blks_hit,
            tup_returned,
            tup_fetched,
            tup_inserted,
            tup_updated,
            tup_deleted
          FROM pg_stat_database
          WHERE datname = current_database();
        `)
      ]);
      
      return {
        tableStats,
        indexStats,
        connectionStats: connectionStats[0],
        cacheHitRatio: connectionStats[0] ? 
          (connectionStats[0].blks_hit / (connectionStats[0].blks_hit + connectionStats[0].blks_read) * 100) : 0
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return { tableStats: [], indexStats: [], connectionStats: null, cacheHitRatio: 0 };
    }
  }

  // Update table statistics for better query planning
  async updateTableStats(tableName?: string): Promise<void> {
    try {
      if (tableName) {
        await this.db.execute(sql`ANALYZE ${sql.identifier(tableName)}`);
        console.log(`Updated statistics for table: ${tableName}`);
      } else {
        await this.db.execute(sql`ANALYZE`);
        console.log('Updated statistics for all tables');
      }
    } catch (error) {
      console.error('Failed to update table statistics:', error);
    }
  }

  // Find missing indexes based on query patterns
  async findMissingIndexes(): Promise<any[]> {
    try {
      const result = await this.db.execute(sql`
        WITH table_scans AS (
          SELECT 
            schemaname,
            tablename,
            seq_scan,
            seq_tup_read,
            idx_scan,
            n_tup_ins + n_tup_upd + n_tup_del as write_activity
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
        ),
        missing_indexes AS (
          SELECT 
            schemaname,
            tablename,
            seq_scan,
            seq_tup_read,
            idx_scan,
            seq_tup_read / GREATEST(seq_scan, 1) as avg_seq_read,
            write_activity
          FROM table_scans
          WHERE seq_scan > idx_scan * 2  -- More sequential scans than index scans
            AND seq_tup_read > 10000     -- Significant number of rows read
            AND write_activity < seq_tup_read * 0.1  -- Not heavily written table
        )
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          idx_scan,
          seq_tup_read,
          avg_seq_read,
          'Consider adding indexes' as recommendation
        FROM missing_indexes
        ORDER BY seq_tup_read DESC;
      `);
      
      return result;
    } catch (error) {
      console.error('Failed to find missing indexes:', error);
      return [];
    }
  }

  // Get slow queries with enhanced metrics
  async getSlowQueries(): Promise<any[]> {
    try {
      // First try pg_stat_statements
      const result = await this.db.execute(sql`
        SELECT 
          query,
          calls,
          total_exec_time as total_time,
          mean_exec_time as mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent,
          stddev_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 100  -- Queries taking more than 100ms on average
        ORDER BY mean_exec_time DESC
        LIMIT 20;
      `);
      
      return result;
    } catch (error) {
      // Fallback to pg_stat_activity for currently running queries
      try {
        const fallbackResult = await this.db.execute(sql`
          SELECT 
            query,
            state,
            query_start,
            now() - query_start as duration,
            wait_event_type,
            wait_event
          FROM pg_stat_activity
          WHERE state = 'active'
            AND query NOT LIKE '%pg_stat_activity%'
            AND now() - query_start > interval '1 second'
          ORDER BY query_start;
        `);
        
        return fallbackResult;
      } catch (fallbackError) {
        console.error('Failed to get slow queries:', error);
        return [];
      }
    }
  }

  // Get table bloat information
  async getTableBloat(): Promise<any[]> {
    try {
      const result = await this.db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          n_dead_tup,
          n_live_tup,
          CASE 
            WHEN n_live_tup > 0 
            THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
            ELSE 0 
          END as bloat_percent,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND n_dead_tup > 1000  -- Only show tables with significant dead tuples
        ORDER BY n_dead_tup DESC;
      `);
      
      return result;
    } catch (error) {
      console.error('Failed to get table bloat information:', error);
      return [];
    }
  }

  // Optimize specific query patterns found in the codebase
  async optimizeCommonQueries(): Promise<void> {
    try {
      console.log('Optimizing common query patterns...');
      
      // Update statistics for frequently queried tables
      const frequentTables = [
        'products', 'orders', 'users', 'supplier_profiles', 
        'rfqs', 'quotations', 'inquiries', 'conversations', 'messages'
      ];
      
      for (const table of frequentTables) {
        await this.updateTableStats(table);
      }
      
      // Set optimal work_mem for complex queries
      await this.db.execute(sql`SET work_mem = '256MB'`);
      
      // Enable parallel query execution for large datasets
      await this.db.execute(sql`SET max_parallel_workers_per_gather = 4`);
      
      console.log('Common query optimization completed');
    } catch (error) {
      console.error('Failed to optimize common queries:', error);
    }
  }
}

// Enhanced cache configuration for query results with LRU eviction
export class QueryCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number; accessCount: number; lastAccessed: number }>;
  private defaultTTL: number;
  private maxSize: number;
  private hitCount: number = 0;
  private missCount: number = 0;

  constructor(defaultTTL: number = 300000, maxSize: number = 1000) { // 5 minutes default, 1000 entries max
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  // Get cached result with access tracking
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      this.missCount++;
      return null;
    }

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    cached.accessCount++;
    cached.lastAccessed = Date.now();
    this.hitCount++;

    return cached.data;
  }

  // Set cache result with LRU eviction
  set(key: string, data: any, ttl?: number): void {
    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 1,
      lastAccessed: Date.now(),
    });
  }

  // Evict least recently used entries
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get comprehensive cache statistics
  getStats(): { 
    size: number; 
    maxSize: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    keys: string[];
    memoryUsage: number;
  } {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      keys: Array.from(this.cache.keys()),
      memoryUsage,
    };
  }

  // Get cache entries by access pattern
  getMostAccessed(limit: number = 10): Array<{ key: string; accessCount: number; lastAccessed: Date }> {
    return Array.from(this.cache.entries())
      .map(([key, value]) => ({
        key,
        accessCount: value.accessCount,
        lastAccessed: new Date(value.lastAccessed),
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  // Warm up cache with frequently accessed data
  async warmUp(queries: Array<{ key: string; queryFn: () => Promise<any>; ttl?: number }>): Promise<void> {
    console.log(`Warming up cache with ${queries.length} queries...`);
    
    const promises = queries.map(async ({ key, queryFn, ttl }) => {
      try {
        const data = await queryFn();
        this.set(key, data, ttl);
      } catch (error) {
        console.error(`Failed to warm up cache for key ${key}:`, error);
      }
    });

    await Promise.all(promises);
    console.log('Cache warm-up completed');
  }
}

// Optimized query builders for common operations
export class OptimizedQueries {
  private db: ReturnType<typeof createOptimizedConnection>;
  private cache: QueryCache;

  constructor(db: ReturnType<typeof createOptimizedConnection>, cache: QueryCache) {
    this.db = db;
    this.cache = cache;
  }

  // Optimized product search with caching
  async searchProducts(filters: {
    categoryId?: string;
    supplierId?: string;
    minPrice?: number;
    maxPrice?: number;
    minOrderQuantity?: number;
    isPublished?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Build optimized query with proper indexes
      let query = sql`
        SELECT 
          p.id,
          p.name,
          p.slug,
          p.short_description,
          p.images,
          p.min_order_quantity,
          p.price_ranges,
          p.supplier_id,
          sp.business_name as supplier_name,
          sp.verification_level,
          c.name as category_name
        FROM products p
        LEFT JOIN supplier_profiles sp ON p.supplier_id = sp.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_published = true
      `;

      const conditions = [];
      const params = [];

      if (filters.categoryId) {
        conditions.push(`p.category_id = $${params.length + 1}`);
        params.push(filters.categoryId);
      }

      if (filters.supplierId) {
        conditions.push(`p.supplier_id = $${params.length + 1}`);
        params.push(filters.supplierId);
      }

      if (filters.minOrderQuantity) {
        conditions.push(`p.min_order_quantity <= $${params.length + 1}`);
        params.push(filters.minOrderQuantity);
      }

      if (conditions.length > 0) {
        query = sql`${query} AND ${sql.raw(conditions.join(' AND '))}`;
      }

      query = sql`${query} ORDER BY p.created_at DESC`;

      if (filters.limit) {
        query = sql`${query} LIMIT ${sql.raw(filters.limit.toString())}`;
      }

      if (filters.offset) {
        query = sql`${query} OFFSET ${sql.raw(filters.offset.toString())}`;
      }

      const result = await this.db.execute(query);
      
      // Cache for 5 minutes
      this.cache.set(cacheKey, result, 300000);
      
      return result;
    } catch (error) {
      console.error('Optimized product search failed:', error);
      return [];
    }
  }

  // Enhanced supplier dashboard data with comprehensive metrics
  async getSupplierDashboardData(supplierId: string): Promise<any> {
    const cacheKey = `supplier_dashboard:${supplierId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Single optimized query with CTEs for better performance
      const result = await this.db.execute(sql`
        WITH supplier_metrics AS (
          SELECT 
            COUNT(DISTINCT p.id) as total_products,
            COUNT(DISTINCT CASE WHEN p.is_published AND p.is_approved THEN p.id END) as active_products,
            COUNT(DISTINCT i.id) as total_inquiries,
            COUNT(DISTINCT CASE WHEN i.status = 'pending' THEN i.id END) as pending_inquiries,
            COUNT(DISTINCT q.id) as total_quotations,
            COUNT(DISTINCT CASE WHEN q.status = 'accepted' THEN q.id END) as accepted_quotations,
            COUNT(DISTINCT o.id) as total_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
            COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) as total_revenue,
            COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) as avg_order_value,
            SUM(p.views) as total_product_views,
            SUM(p.inquiries) as total_product_inquiries
          FROM supplier_profiles sp
          LEFT JOIN products p ON sp.id = p.supplier_id
          LEFT JOIN inquiries i ON sp.id = i.supplier_id AND i.created_at >= NOW() - INTERVAL '30 days'
          LEFT JOIN quotations q ON sp.id = q.supplier_id AND q.created_at >= NOW() - INTERVAL '30 days'
          LEFT JOIN orders o ON sp.id = o.supplier_id
          WHERE sp.id = ${supplierId}
        ),
        recent_activity AS (
          SELECT 
            activity_type,
            created_at,
            description,
            entity_id
          FROM (
            SELECT 
              'inquiry' as activity_type,
              i.created_at,
              CONCAT('New inquiry: ', LEFT(i.message, 50), '...') as description,
              i.id as entity_id
            FROM inquiries i
            WHERE i.supplier_id = ${supplierId}
            
            UNION ALL
            
            SELECT 
              'order' as activity_type,
              o.created_at,
              CONCAT('Order #', o.order_number, ' - ', o.status) as description,
              o.id as entity_id
            FROM orders o
            WHERE o.supplier_id = ${supplierId}
            
            UNION ALL
            
            SELECT 
              'quotation' as activity_type,
              q.created_at,
              CONCAT('Quotation sent - $', q.total_price) as description,
              q.id as entity_id
            FROM quotations q
            WHERE q.supplier_id = ${supplierId}
          ) activities
          ORDER BY created_at DESC
          LIMIT 10
        ),
        top_products AS (
          SELECT 
            p.id,
            p.name,
            p.views,
            p.inquiries,
            (p.views + p.inquiries * 2) as engagement_score
          FROM products p
          WHERE p.supplier_id = ${supplierId}
            AND p.is_published = true
          ORDER BY engagement_score DESC
          LIMIT 5
        )
        SELECT 
          (SELECT row_to_json(supplier_metrics) FROM supplier_metrics) as metrics,
          (SELECT json_agg(recent_activity ORDER BY created_at DESC) FROM recent_activity) as recent_activity,
          (SELECT json_agg(top_products ORDER BY engagement_score DESC) FROM top_products) as top_products;
      `);

      const dashboardData = result[0];
      
      // Cache for 2 minutes
      this.cache.set(cacheKey, dashboardData, 120000);
      
      return dashboardData;
    } catch (error) {
      console.error('Supplier dashboard query failed:', error);
      return { metrics: {}, recent_activity: [], top_products: [] };
    }
  }

  // Optimized buyer analytics query
  async getBuyerAnalytics(buyerId: string): Promise<any> {
    const cacheKey = `buyer_analytics:${buyerId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db.execute(sql`
        WITH buyer_metrics AS (
          SELECT 
            COUNT(DISTINCT r.id) as total_rfqs,
            COUNT(DISTINCT CASE WHEN r.status = 'open' THEN r.id END) as active_rfqs,
            COUNT(DISTINCT i.id) as total_inquiries,
            COUNT(DISTINCT o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent,
            COALESCE(AVG(o.total_amount), 0) as avg_order_value,
            COUNT(DISTINCT o.supplier_id) as unique_suppliers
          FROM buyers b
          LEFT JOIN rfqs r ON b.id = r.buyer_id
          LEFT JOIN inquiries i ON b.id = i.buyer_id
          LEFT JOIN orders o ON b.id = o.buyer_id AND o.status = 'completed'
          WHERE b.id = ${buyerId}
        ),
        top_suppliers AS (
          SELECT 
            sp.id,
            sp.business_name,
            COUNT(o.id) as order_count,
            SUM(o.total_amount) as total_spent
          FROM orders o
          INNER JOIN supplier_profiles sp ON o.supplier_id = sp.id
          WHERE o.buyer_id = ${buyerId} AND o.status = 'completed'
          GROUP BY sp.id, sp.business_name
          ORDER BY total_spent DESC
          LIMIT 5
        ),
        category_preferences AS (
          SELECT 
            c.name as category_name,
            COUNT(o.id) as order_count,
            SUM(o.total_amount) as total_spent
          FROM orders o
          INNER JOIN products p ON o.product_id = p.id
          INNER JOIN categories c ON p.category_id = c.id
          WHERE o.buyer_id = ${buyerId} AND o.status = 'completed'
          GROUP BY c.id, c.name
          ORDER BY total_spent DESC
          LIMIT 5
        )
        SELECT 
          (SELECT row_to_json(buyer_metrics) FROM buyer_metrics) as metrics,
          (SELECT json_agg(top_suppliers ORDER BY total_spent DESC) FROM top_suppliers) as top_suppliers,
          (SELECT json_agg(category_preferences ORDER BY total_spent DESC) FROM category_preferences) as category_preferences;
      `);

      const analyticsData = result[0];
      
      // Cache for 5 minutes
      this.cache.set(cacheKey, analyticsData, 300000);
      
      return analyticsData;
    } catch (error) {
      console.error('Buyer analytics query failed:', error);
      return { metrics: {}, top_suppliers: [], category_preferences: [] };
    }
  }

  // Optimized RFQ matching for suppliers
  async getMatchingRFQs(supplierId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `matching_rfqs:${supplierId}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.db.execute(sql`
        WITH supplier_categories AS (
          SELECT DISTINCT p.category_id
          FROM products p
          WHERE p.supplier_id = ${supplierId}
            AND p.is_published = true
            AND p.category_id IS NOT NULL
        ),
        matching_rfqs AS (
          SELECT 
            r.*,
            c.name as category_name,
            b.company_name as buyer_company,
            u.name as buyer_name,
            (
              CASE 
                WHEN r.category_id IN (SELECT category_id FROM supplier_categories) THEN 3
                ELSE 1
              END +
              CASE 
                WHEN r.expires_at > NOW() + INTERVAL '7 days' THEN 2
                WHEN r.expires_at > NOW() + INTERVAL '3 days' THEN 1
                ELSE 0
              END
            ) as match_score
          FROM rfqs r
          INNER JOIN buyers b ON r.buyer_id = b.id
          INNER JOIN users u ON b.user_id = u.id
          LEFT JOIN categories c ON r.category_id = c.id
          WHERE r.status = 'open'
            AND r.expires_at > NOW()
            AND r.id NOT IN (
              SELECT q.rfq_id 
              FROM quotations q 
              WHERE q.supplier_id = ${supplierId} AND q.rfq_id IS NOT NULL
            )
        )
        SELECT *
        FROM matching_rfqs
        ORDER BY match_score DESC, created_at DESC
        LIMIT ${limit};
      `);
      
      // Cache for 10 minutes
      this.cache.set(cacheKey, result, 600000);
      
      return result;
    } catch (error) {
      console.error('RFQ matching query failed:', error);
      return [];
    }
  }

  // Optimized conversation list with unread counts
  async getConversationList(userId: string, userType: 'buyer' | 'supplier' | 'admin'): Promise<any[]> {
    const cacheKey = `conversations:${userId}:${userType}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      let whereClause;
      switch (userType) {
        case 'buyer':
          whereClause = sql`c.buyer_id = ${userId}`;
          break;
        case 'supplier':
          whereClause = sql`c.supplier_id = ${userId}`;
          break;
        case 'admin':
          whereClause = sql`c.admin_id = ${userId}`;
          break;
        default:
          throw new Error('Invalid user type');
      }

      const result = await this.db.execute(sql`
        SELECT 
          c.*,
          COALESCE(bu.name, '') as buyer_name,
          COALESCE(bc.company_name, '') as buyer_company,
          COALESCE(sp.business_name, '') as supplier_name,
          COALESCE(au.name, '') as admin_name,
          COUNT(CASE WHEN m.is_read = false AND m.sender_id != ${userId} THEN 1 END) as unread_count,
          m_last.message as last_message,
          m_last.created_at as last_message_at
        FROM conversations c
        LEFT JOIN buyers b ON c.buyer_id = b.id
        LEFT JOIN users bu ON b.user_id = bu.id
        LEFT JOIN buyers bc ON c.buyer_id = bc.id
        LEFT JOIN supplier_profiles sp ON c.supplier_id = sp.id
        LEFT JOIN users au ON c.admin_id = au.id
        LEFT JOIN messages m ON c.id = m.conversation_id
        LEFT JOIN LATERAL (
          SELECT message, created_at
          FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC
          LIMIT 1
        ) m_last ON true
        WHERE ${whereClause}
          AND c.status = 'active'
        GROUP BY c.id, bu.name, bc.company_name, sp.business_name, au.name, m_last.message, m_last.created_at
        ORDER BY COALESCE(m_last.created_at, c.created_at) DESC;
      `);
      
      // Cache for 1 minute (conversations change frequently)
      this.cache.set(cacheKey, result, 60000);
      
      return result;
    } catch (error) {
      console.error('Conversation list query failed:', error);
      return [];
    }
  }
}

// Enhanced database maintenance utilities
export class DatabaseMaintenance {
  private db: ReturnType<typeof createOptimizedConnection>;

  constructor(db: ReturnType<typeof createOptimizedConnection>) {
    this.db = db;
  }

  // Comprehensive database maintenance with intelligent scheduling
  async performMaintenance(options: {
    vacuum?: boolean;
    analyze?: boolean;
    reindex?: boolean;
    updateStats?: boolean;
  } = {}): Promise<void> {
    const { vacuum = true, analyze = true, reindex = false, updateStats = true } = options;
    
    try {
      console.log('Starting comprehensive database maintenance...');
      
      // Get list of tables with their statistics
      const tables = await this.db.execute(sql`
        SELECT 
          t.tablename,
          s.n_live_tup,
          s.n_dead_tup,
          s.last_vacuum,
          s.last_autovacuum,
          s.last_analyze,
          s.last_autoanalyze,
          CASE 
            WHEN s.n_live_tup > 0 
            THEN round(100.0 * s.n_dead_tup / (s.n_live_tup + s.n_dead_tup), 2)
            ELSE 0 
          END as bloat_percent
        FROM pg_tables t
        LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
        WHERE t.schemaname = 'public'
        ORDER BY s.n_dead_tup DESC NULLS LAST;
      `);

      // Prioritize tables that need maintenance most
      const highPriorityTables = tables.filter(table => 
        table.bloat_percent > 20 || table.n_dead_tup > 10000
      );
      
      const regularTables = tables.filter(table => 
        !highPriorityTables.includes(table)
      );

      // Process high priority tables first
      for (const table of highPriorityTables) {
        const tableName = table.tablename;
        console.log(`High priority maintenance for table: ${tableName} (${table.bloat_percent}% bloat)`);
        
        if (vacuum) {
          await this.db.execute(sql`VACUUM ${sql.identifier(tableName)}`);
        }
        
        if (analyze) {
          await this.db.execute(sql`ANALYZE ${sql.identifier(tableName)}`);
        }
      }

      // Process regular tables
      for (const table of regularTables) {
        const tableName = table.tablename;
        console.log(`Regular maintenance for table: ${tableName}`);
        
        if (vacuum && analyze) {
          await this.db.execute(sql`VACUUM ANALYZE ${sql.identifier(tableName)}`);
        } else {
          if (vacuum) {
            await this.db.execute(sql`VACUUM ${sql.identifier(tableName)}`);
          }
          if (analyze) {
            await this.db.execute(sql`ANALYZE ${sql.identifier(tableName)}`);
          }
        }
      }

      // Update global statistics if requested
      if (updateStats) {
        await this.updateGlobalStatistics();
      }

      // Reindex if requested (should be done during low traffic periods)
      if (reindex) {
        await this.reindexTables();
      }

      console.log('Database maintenance completed successfully');
    } catch (error) {
      console.error('Database maintenance failed:', error);
      throw error;
    }
  }

  // Intelligent reindexing based on index usage
  async reindexTables(): Promise<void> {
    try {
      console.log('Starting intelligent table reindexing...');
      
      // Get index usage statistics
      const indexStats = await this.db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan > 1000  -- Only reindex frequently used indexes
        ORDER BY idx_scan DESC;
      `);

      // Reindex frequently used indexes
      for (const index of indexStats) {
        console.log(`Reindexing: ${index.indexname} (${index.idx_scan} scans)`);
        await this.db.execute(sql`REINDEX INDEX ${sql.identifier(index.indexname)}`);
      }
      
      console.log('Table reindexing completed');
    } catch (error) {
      console.error('Table reindexing failed:', error);
      throw error;
    }
  }

  // Update global database statistics
  async updateGlobalStatistics(): Promise<void> {
    try {
      console.log('Updating global database statistics...');
      
      // Update table statistics
      await this.db.execute(sql`ANALYZE`);
      
      // Update extension statistics if available
      try {
        await this.db.execute(sql`SELECT pg_stat_reset()`);
      } catch (error) {
        console.warn('Could not reset pg_stat (may not have permissions)');
      }
      
      console.log('Global statistics updated');
    } catch (error) {
      console.error('Failed to update global statistics:', error);
    }
  }

  // Optimize database configuration for current workload
  async optimizeConfiguration(): Promise<void> {
    try {
      console.log('Optimizing database configuration...');
      
      // Set optimal configuration for B2B marketplace workload
      const optimizations = [
        // Memory settings
        sql`ALTER SYSTEM SET shared_buffers = '256MB'`,
        sql`ALTER SYSTEM SET effective_cache_size = '1GB'`,
        sql`ALTER SYSTEM SET work_mem = '16MB'`,
        sql`ALTER SYSTEM SET maintenance_work_mem = '256MB'`,
        
        // Connection settings
        sql`ALTER SYSTEM SET max_connections = 200`,
        sql`ALTER SYSTEM SET max_prepared_transactions = 100`,
        
        // Query optimization
        sql`ALTER SYSTEM SET random_page_cost = 1.1`,
        sql`ALTER SYSTEM SET effective_io_concurrency = 200`,
        sql`ALTER SYSTEM SET max_parallel_workers_per_gather = 4`,
        sql`ALTER SYSTEM SET max_parallel_workers = 8`,
        
        // Logging and monitoring
        sql`ALTER SYSTEM SET log_min_duration_statement = 1000`,
        sql`ALTER SYSTEM SET log_checkpoints = on`,
        sql`ALTER SYSTEM SET log_connections = on`,
        sql`ALTER SYSTEM SET log_disconnections = on`,
        
        // Checkpoint and WAL settings
        sql`ALTER SYSTEM SET checkpoint_completion_target = 0.9`,
        sql`ALTER SYSTEM SET wal_buffers = '16MB'`,
        sql`ALTER SYSTEM SET checkpoint_timeout = '15min'`,
      ];

      for (const optimization of optimizations) {
        try {
          await this.db.execute(optimization);
        } catch (error) {
          console.warn('Could not apply configuration (may require superuser privileges):', error.message);
        }
      }
      
      console.log('Database configuration optimization completed');
      console.log('Note: Configuration changes require a database restart to take effect');
    } catch (error) {
      console.error('Failed to optimize database configuration:', error);
    }
  }

  // Clean up old data and optimize storage
  async cleanupOldData(options: {
    daysToKeep?: number;
    cleanupLogs?: boolean;
    cleanupTempData?: boolean;
  } = {}): Promise<void> {
    const { daysToKeep = 90, cleanupLogs = true, cleanupTempData = true } = options;
    
    try {
      console.log(`Starting data cleanup (keeping ${daysToKeep} days of data)...`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Clean up old activity logs
      if (cleanupLogs) {
        const deletedLogs = await this.db.execute(sql`
          DELETE FROM activity_logs 
          WHERE created_at < ${cutoffDate.toISOString()}
        `);
        console.log(`Cleaned up old activity logs: ${deletedLogs.length} records`);
      }
      
      // Clean up old notifications
      const deletedNotifications = await this.db.execute(sql`
        DELETE FROM notifications 
        WHERE created_at < ${cutoffDate.toISOString()} AND read = true
      `);
      console.log(`Cleaned up old notifications: ${deletedNotifications.length} records`);
      
      // Clean up expired RFQs
      const expiredRFQs = await this.db.execute(sql`
        UPDATE rfqs 
        SET status = 'expired' 
        WHERE status = 'open' AND expires_at < NOW()
      `);
      console.log(`Marked expired RFQs: ${expiredRFQs.length} records`);
      
      // Clean up temporary data if requested
      if (cleanupTempData) {
        // Clean up old file uploads that are not referenced
        // This would need to be implemented based on your file storage system
        console.log('Temporary data cleanup completed');
      }
      
      console.log('Data cleanup completed');
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  // Generate maintenance report
  async generateMaintenanceReport(): Promise<any> {
    try {
      const [
        tableStats,
        indexStats,
        connectionStats,
        slowQueries
      ] = await Promise.all([
        // Table statistics
        this.db.execute(sql`
          SELECT 
            schemaname,
            tablename,
            n_live_tup,
            n_dead_tup,
            CASE 
              WHEN n_live_tup > 0 
              THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
              ELSE 0 
            END as bloat_percent,
            last_vacuum,
            last_analyze
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
          ORDER BY n_dead_tup DESC;
        `),
        
        // Index usage
        this.db.execute(sql`
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
          FROM pg_stat_user_indexes
          WHERE schemaname = 'public'
          ORDER BY idx_scan DESC
          LIMIT 20;
        `),
        
        // Database statistics
        this.db.execute(sql`
          SELECT 
            datname,
            numbackends,
            xact_commit,
            xact_rollback,
            blks_read,
            blks_hit,
            tup_returned,
            tup_fetched,
            tup_inserted,
            tup_updated,
            tup_deleted
          FROM pg_stat_database
          WHERE datname = current_database();
        `),
        
        // Slow queries (if pg_stat_statements is available)
        this.db.execute(sql`
          SELECT 
            query,
            calls,
            total_exec_time,
            mean_exec_time,
            rows
          FROM pg_stat_statements
          WHERE mean_exec_time > 100
          ORDER BY mean_exec_time DESC
          LIMIT 10;
        `).catch(() => []) // Ignore if pg_stat_statements is not available
      ]);

      const report = {
        timestamp: new Date().toISOString(),
        tableStats,
        indexStats,
        connectionStats: connectionStats[0],
        slowQueries,
        recommendations: this.generateRecommendations(tableStats, indexStats)
      };

      return report;
    } catch (error) {
      console.error('Failed to generate maintenance report:', error);
      return { error: error.message };
    }
  }

  // Generate maintenance recommendations
  private generateRecommendations(tableStats: any[], indexStats: any[]): string[] {
    const recommendations = [];

    // Check for tables with high bloat
    const bloatedTables = tableStats.filter(table => table.bloat_percent > 20);
    if (bloatedTables.length > 0) {
      recommendations.push(`Consider VACUUM FULL for tables with high bloat: ${bloatedTables.map(t => t.tablename).join(', ')}`);
    }

    // Check for unused indexes
    const unusedIndexes = indexStats.filter(index => index.idx_scan < 10);
    if (unusedIndexes.length > 0) {
      recommendations.push(`Consider dropping unused indexes: ${unusedIndexes.map(i => i.indexname).join(', ')}`);
    }

    // Check for tables that need analysis
    const staleStats = tableStats.filter(table => {
      const lastAnalyze = new Date(table.last_analyze);
      const daysSinceAnalyze = (Date.now() - lastAnalyze.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAnalyze > 7;
    });
    if (staleStats.length > 0) {
      recommendations.push(`Run ANALYZE on tables with stale statistics: ${staleStats.map(t => t.tablename).join(', ')}`);
    }

    return recommendations;
  }
}

// Export singleton instances
export const queryCache = new QueryCache();
export const optimizedDb = createOptimizedConnection();
export const queryOptimizer = new QueryOptimizer(optimizedDb);
export const optimizedQueries = new OptimizedQueries(optimizedDb, queryCache);
export const dbMaintenance = new DatabaseMaintenance(optimizedDb);

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  queryCache.clearExpired();
}, 300000);