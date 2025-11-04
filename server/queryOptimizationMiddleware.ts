import { Request, Response, NextFunction } from 'express';
import { queryCache, queryOptimizer } from './db-optimization';
import { connectionPoolManager } from './connectionPool';

// Query optimization middleware for Express routes
export interface OptimizationOptions {
  enableCaching?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  enableMetrics?: boolean;
  slowQueryThreshold?: number;
  enableQueryAnalysis?: boolean;
}

// Middleware to optimize database queries
export const queryOptimizationMiddleware = (options: OptimizationOptions = {}) => {
  const {
    enableCaching = true,
    cacheTTL = 300000, // 5 minutes default
    enableMetrics = true,
    slowQueryThreshold = 1000, // 1 second
    enableQueryAnalysis = false
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Add optimization utilities to request object
    req.queryOptimization = {
      cache: queryCache,
      getCachedResult: (key: string) => {
        if (!enableCaching) return null;
        return queryCache.get(key);
      },
      setCachedResult: (key: string, data: any, ttl?: number) => {
        if (!enableCaching) return;
        queryCache.set(key, data, ttl || cacheTTL);
      },
      generateCacheKey: (baseKey: string, params?: any) => {
        const paramString = params ? JSON.stringify(params) : '';
        return `${baseKey}:${Buffer.from(paramString).toString('base64')}`;
      },
      executeOptimizedQuery: async <T = any>(query: string, params?: any[], cacheKey?: string) => {
        // Check cache first if caching is enabled and cache key is provided
        if (enableCaching && cacheKey) {
          const cached = queryCache.get(cacheKey);
          if (cached) {
            return cached as T[];
          }
        }

        const queryStartTime = Date.now();
        
        try {
          const result = await connectionPoolManager.executeQuery<T>(query, params);
          
          const queryTime = Date.now() - queryStartTime;
          
          // Log slow queries
          if (enableMetrics && queryTime > slowQueryThreshold) {
            console.warn(`Slow query detected (${queryTime}ms):`, {
              query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
              params: params?.length ? `${params.length} parameters` : 'no parameters',
              executionTime: queryTime,
              route: req.path,
              method: req.method
            });

            // Analyze slow query if enabled
            if (enableQueryAnalysis) {
              try {
                const analysis = await queryOptimizer.analyzeQuery(query);
                console.log('Query analysis:', analysis);
              } catch (error) {
                console.error('Query analysis failed:', error);
              }
            }
          }

          // Cache result if caching is enabled and cache key is provided
          if (enableCaching && cacheKey && result) {
            queryCache.set(cacheKey, result, cacheTTL);
          }

          return result;
        } catch (error) {
          console.error('Optimized query execution failed:', {
            error: error.message,
            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
            route: req.path,
            method: req.method
          });
          throw error;
        }
      }
    };

    // Continue to next middleware
    next();

    // Log request metrics after response
    if (enableMetrics) {
      const originalSend = res.send;
      res.send = function(data) {
        const totalTime = Date.now() - startTime;
        
        if (totalTime > slowQueryThreshold) {
          console.warn(`Slow request detected (${totalTime}ms):`, {
            method: req.method,
            path: req.path,
            query: req.query,
            executionTime: totalTime,
            statusCode: res.statusCode
          });
        }

        return originalSend.call(this, data);
      };
    }
  };
};

// Middleware to warm up cache with frequently accessed data
export const cacheWarmupMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only warm up cache on application startup or specific routes
    if (req.path === '/api/warmup-cache' && req.method === 'POST') {
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
        
        res.json({ 
          success: true, 
          message: 'Cache warmed up successfully',
          cacheStats: queryCache.getStats()
        });
        return;
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: 'Cache warmup failed',
          details: error.message 
        });
        return;
      }
    }

    next();
  };
};

// Middleware to provide database health information
export const databaseHealthMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/database-health' && req.method === 'GET') {
      try {
        const [
          poolStats,
          cacheStats,
          connectionInfo,
          isConnected
        ] = await Promise.all([
          connectionPoolManager.getPoolStats(),
          queryCache.getStats(),
          connectionPoolManager.getDetailedConnectionInfo(),
          connectionPoolManager.testConnectivity()
        ]);

        res.json({
          status: isConnected ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          connectionPool: poolStats,
          queryCache: cacheStats,
          connectionInfo,
          recommendations: generateHealthRecommendations(poolStats, cacheStats)
        });
        return;
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: 'Failed to get database health information',
          details: error.message
        });
        return;
      }
    }

    next();
  };
};

// Generate health recommendations based on metrics
function generateHealthRecommendations(poolStats: any, cacheStats: any): string[] {
  const recommendations = [];

  // Pool recommendations
  if (poolStats.healthStatus === 'critical') {
    recommendations.push('Database connection pool is in critical state - investigate immediately');
  }

  if (poolStats.connectionMetrics.averageQueryTime > 1000) {
    recommendations.push('High average query time detected - consider query optimization');
  }

  if (poolStats.currentState.waitingCount > 0) {
    recommendations.push('Clients are waiting for connections - consider increasing pool size');
  }

  // Cache recommendations
  if (cacheStats.hitRate < 50) {
    recommendations.push('Low cache hit rate - review caching strategy');
  }

  if (cacheStats.size > cacheStats.maxSize * 0.9) {
    recommendations.push('Cache is near capacity - consider increasing cache size or reducing TTL');
  }

  return recommendations;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      queryOptimization?: {
        cache: typeof queryCache;
        getCachedResult: (key: string) => any | null;
        setCachedResult: (key: string, data: any, ttl?: number) => void;
        generateCacheKey: (baseKey: string, params?: any) => string;
        executeOptimizedQuery: <T = any>(query: string, params?: any[], cacheKey?: string) => Promise<T[]>;
      };
    }
  }
}

export default {
  queryOptimizationMiddleware,
  cacheWarmupMiddleware,
  databaseHealthMiddleware
};