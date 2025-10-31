import { db } from './db';
import { 
  supplierProfiles, 
  products, 
  orders, 
  users,
  activity_logs
} from '@shared/schema';
import { eq, and, gte, desc, count, sql, avg, sum } from 'drizzle-orm';

// ==================== SYSTEM HEALTH MONITORING ====================

export interface SystemHealthMetrics {
  // Server Performance
  serverStatus: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastRestart: Date;
    version: string;
  };
  
  // Database Performance
  databasePerformance: {
    connectionCount: number;
    avgQueryTime: number;
    slowQueries: number;
    deadlocks: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  
  // API Performance
  apiMetrics: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  
  // System Resources
  systemResources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  
  // Application Metrics
  applicationMetrics: {
    activeUsers: number;
    activeSuppliers: number;
    activeOrders: number;
    queuedJobs: number;
    failedJobs: number;
  };
  
  // Overall Health
  overallHealth: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export async function getComprehensiveSystemHealth(): Promise<SystemHealthMetrics> {
  try {
    // Get database metrics
    const dbMetrics = await getDatabaseMetrics();
    
    // Get application metrics
    const appMetrics = await getApplicationMetrics();
    
    // Get API performance metrics
    const apiMetrics = await getAPIMetrics();
    
    // Mock system resource metrics (in production, these would come from system monitoring)
    const resourceMetrics = getSystemResourceMetrics();
    
    // Calculate overall health
    const overallHealth = calculateOverallHealth(dbMetrics, appMetrics, apiMetrics, resourceMetrics);
    
    return {
      serverStatus: {
        status: 'healthy',
        uptime: process.uptime(),
        lastRestart: new Date(Date.now() - process.uptime() * 1000),
        version: process.env.npm_package_version || '1.0.0',
      },
      databasePerformance: dbMetrics,
      apiMetrics: apiMetrics,
      systemResources: resourceMetrics,
      applicationMetrics: appMetrics,
      overallHealth: overallHealth,
    };
    
  } catch (error) {
    console.error('Error getting comprehensive system health:', error);
    throw error;
  }
}

async function getDatabaseMetrics() {
  try {
    const startTime = Date.now();
    
    // Test database connectivity and performance
    await db.select({ count: count() }).from(users).limit(1);
    
    const queryTime = Date.now() - startTime;
    
    // Get connection count (mock for now)
    const connectionCount = Math.floor(Math.random() * 20) + 5;
    
    // Calculate status based on performance
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (queryTime > 1000) status = 'warning';
    if (queryTime > 3000) status = 'critical';
    
    return {
      connectionCount,
      avgQueryTime: queryTime,
      slowQueries: Math.floor(Math.random() * 5),
      deadlocks: 0,
      status,
    };
  } catch (error) {
    return {
      connectionCount: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      deadlocks: 0,
      status: 'critical' as const,
    };
  }
}

async function getApplicationMetrics() {
  try {
    // Get active users (users active in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const activeUsers = await db
      .select({ count: count() })
      .from(activity_logs)
      .where(gte(activity_logs.createdAt, oneDayAgo));
    
    // Get active suppliers
    const activeSuppliers = await db
      .select({ count: count() })
      .from(supplierProfiles)
      .where(and(eq(supplierProfiles.isActive, true), eq(supplierProfiles.status, 'approved')));
    
    // Get active orders
    const activeOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(sql`${orders.status} IN ('pending', 'processing', 'shipped')`);
    
    return {
      activeUsers: Number(activeUsers[0]?.count || 0),
      activeSuppliers: Number(activeSuppliers[0]?.count || 0),
      activeOrders: Number(activeOrders[0]?.count || 0),
      queuedJobs: Math.floor(Math.random() * 10), // Mock data
      failedJobs: Math.floor(Math.random() * 3),
    };
  } catch (error) {
    return {
      activeUsers: 0,
      activeSuppliers: 0,
      activeOrders: 0,
      queuedJobs: 0,
      failedJobs: 0,
    };
  }
}

function getAPIMetrics() {
  // Mock API metrics (in production, these would come from monitoring middleware)
  const errorRate = Math.random() * 5;
  const avgResponseTime = 150 + Math.random() * 200;
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (errorRate > 2 || avgResponseTime > 500) status = 'warning';
  if (errorRate > 5 || avgResponseTime > 1000) status = 'critical';
  
  return {
    totalRequests: Math.floor(Math.random() * 10000) + 5000,
    avgResponseTime: Math.round(avgResponseTime),
    errorRate: Math.round(errorRate * 100) / 100,
    throughput: Math.floor(Math.random() * 100) + 50,
    status,
  };
}

function getSystemResourceMetrics() {
  // Mock system resource metrics (in production, these would come from system monitoring)
  const cpuUsage = Math.random() * 100;
  const memoryUsage = Math.random() * 100;
  const diskUsage = Math.random() * 100;
  const networkIO = Math.random() * 100;
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (cpuUsage > 70 || memoryUsage > 80 || diskUsage > 85) status = 'warning';
  if (cpuUsage > 90 || memoryUsage > 95 || diskUsage > 95) status = 'critical';
  
  return {
    cpuUsage: Math.round(cpuUsage * 100) / 100,
    memoryUsage: Math.round(memoryUsage * 100) / 100,
    diskUsage: Math.round(diskUsage * 100) / 100,
    networkIO: Math.round(networkIO * 100) / 100,
    status,
  };
}

function calculateOverallHealth(
  dbMetrics: any,
  appMetrics: any,
  apiMetrics: any,
  resourceMetrics: any
) {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  
  // Check database health
  if (dbMetrics.status === 'critical') {
    score -= 30;
    issues.push('Database performance is critical');
    recommendations.push('Check database connections and optimize slow queries');
  } else if (dbMetrics.status === 'warning') {
    score -= 15;
    issues.push('Database performance is degraded');
    recommendations.push('Monitor database performance and consider optimization');
  }
  
  // Check API health
  if (apiMetrics.status === 'critical') {
    score -= 25;
    issues.push('API performance is critical');
    recommendations.push('Scale API servers and optimize response times');
  } else if (apiMetrics.status === 'warning') {
    score -= 10;
    issues.push('API performance is degraded');
    recommendations.push('Monitor API performance and consider scaling');
  }
  
  // Check system resources
  if (resourceMetrics.status === 'critical') {
    score -= 20;
    issues.push('System resources are critically low');
    recommendations.push('Scale system resources immediately');
  } else if (resourceMetrics.status === 'warning') {
    score -= 10;
    issues.push('System resources are under pressure');
    recommendations.push('Monitor resource usage and plan for scaling');
  }
  
  // Check application metrics
  if (appMetrics.failedJobs > 5) {
    score -= 10;
    issues.push('High number of failed background jobs');
    recommendations.push('Investigate and fix failing background jobs');
  }
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (score < 80) status = 'warning';
  if (score < 60) status = 'critical';
  
  return {
    status,
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}

// ==================== PERFORMANCE METRICS ====================

export interface PerformanceMetrics {
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  errorRates: {
    total: number;
    rate4xx: number;
    rate5xx: number;
    rateTimeout: number;
  };
  capacity: {
    currentLoad: number;
    maxCapacity: number;
    utilizationPercent: number;
    recommendedScaling: string;
  };
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  // Mock performance metrics (in production, these would come from monitoring systems)
  return {
    responseTime: {
      avg: 250 + Math.random() * 100,
      p50: 200 + Math.random() * 50,
      p95: 500 + Math.random() * 200,
      p99: 800 + Math.random() * 400,
    },
    throughput: {
      requestsPerSecond: 50 + Math.random() * 30,
      requestsPerMinute: 3000 + Math.random() * 1000,
      requestsPerHour: 180000 + Math.random() * 60000,
    },
    errorRates: {
      total: Math.random() * 5,
      rate4xx: Math.random() * 3,
      rate5xx: Math.random() * 2,
      rateTimeout: Math.random() * 1,
    },
    capacity: {
      currentLoad: Math.random() * 100,
      maxCapacity: 1000,
      utilizationPercent: Math.random() * 80,
      recommendedScaling: Math.random() > 0.7 ? 'scale_up' : 'maintain',
    },
  };
}

// ==================== ERROR TRACKING ====================

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  recentErrors: Array<{
    id: string;
    type: string;
    message: string;
    endpoint: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
  }>;
  errorTrends: Array<{
    date: string;
    count: number;
    type: string;
  }>;
}

export async function getErrorMetrics(): Promise<ErrorMetrics> {
  // Mock error metrics (in production, these would come from error tracking systems)
  const errorTypes = ['ValidationError', 'DatabaseError', 'AuthenticationError', 'NetworkError', 'TimeoutError'];
  const endpoints = ['/api/products', '/api/suppliers', '/api/orders', '/api/auth', '/api/upload'];
  
  const errorsByType: Record<string, number> = {};
  const errorsByEndpoint: Record<string, number> = {};
  
  errorTypes.forEach(type => {
    errorsByType[type] = Math.floor(Math.random() * 20);
  });
  
  endpoints.forEach(endpoint => {
    errorsByEndpoint[endpoint] = Math.floor(Math.random() * 15);
  });
  
  const recentErrors = Array.from({ length: 10 }, (_, i) => ({
    id: `error_${Date.now()}_${i}`,
    type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
    message: `Sample error message ${i + 1}`,
    endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
    resolved: Math.random() > 0.3,
  }));
  
  const errorTrends = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 50),
    type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
  }));
  
  return {
    totalErrors: Object.values(errorsByType).reduce((sum, count) => sum + count, 0),
    errorsByType,
    errorsByEndpoint,
    recentErrors,
    errorTrends,
  };
}

// ==================== CAPACITY PLANNING ====================

export interface CapacityMetrics {
  current: {
    users: number;
    suppliers: number;
    products: number;
    orders: number;
    storage: number;
  };
  projected: {
    users: number;
    suppliers: number;
    products: number;
    orders: number;
    storage: number;
  };
  limits: {
    users: number;
    suppliers: number;
    products: number;
    orders: number;
    storage: number;
  };
  recommendations: Array<{
    resource: string;
    action: 'monitor' | 'scale_soon' | 'scale_now' | 'optimize';
    timeframe: string;
    description: string;
  }>;
}

export async function getCapacityMetrics(): Promise<CapacityMetrics> {
  try {
    // Get current counts
    const [userCount] = await db.select({ count: count() }).from(users);
    const [supplierCount] = await db.select({ count: count() }).from(supplierProfiles);
    const [productCount] = await db.select({ count: count() }).from(products);
    const [orderCount] = await db.select({ count: count() }).from(orders);
    
    const current = {
      users: Number(userCount?.count || 0),
      suppliers: Number(supplierCount?.count || 0),
      products: Number(productCount?.count || 0),
      orders: Number(orderCount?.count || 0),
      storage: Math.floor(Math.random() * 1000000), // Mock storage in MB
    };
    
    // Project growth (mock 20% growth)
    const projected = {
      users: Math.floor(current.users * 1.2),
      suppliers: Math.floor(current.suppliers * 1.2),
      products: Math.floor(current.products * 1.2),
      orders: Math.floor(current.orders * 1.2),
      storage: Math.floor(current.storage * 1.2),
    };
    
    // Set limits (mock limits)
    const limits = {
      users: 100000,
      suppliers: 10000,
      products: 1000000,
      orders: 500000,
      storage: 10000000, // 10GB in MB
    };
    
    // Generate recommendations
    const recommendations = [];
    
    Object.keys(current).forEach(resource => {
      const currentVal = (current as any)[resource];
      const projectedVal = (projected as any)[resource];
      const limitVal = (limits as any)[resource];
      
      const utilizationPercent = (currentVal / limitVal) * 100;
      const projectedUtilization = (projectedVal / limitVal) * 100;
      
      if (projectedUtilization > 90) {
        recommendations.push({
          resource,
          action: 'scale_now' as const,
          timeframe: 'immediate',
          description: `${resource} capacity will exceed 90% soon`,
        });
      } else if (projectedUtilization > 75) {
        recommendations.push({
          resource,
          action: 'scale_soon' as const,
          timeframe: '1-2 months',
          description: `${resource} capacity will exceed 75% in projected growth`,
        });
      } else if (utilizationPercent > 60) {
        recommendations.push({
          resource,
          action: 'monitor' as const,
          timeframe: '3-6 months',
          description: `Monitor ${resource} usage trends`,
        });
      }
    });
    
    return {
      current,
      projected,
      limits,
      recommendations,
    };
    
  } catch (error) {
    console.error('Error getting capacity metrics:', error);
    throw error;
  }
}