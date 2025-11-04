import { Request } from 'express';
import { AppError, ErrorType } from './errorHandler';

// Error metrics interface
export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsByStatusCode: Record<number, number>;
  errorsByEndpoint: Record<string, number>;
  errorsByUser: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
  lastUpdated: Date;
}

// Error log entry interface
export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  requestId: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    type: ErrorType;
    statusCode: number;
    isOperational: boolean;
    details?: any;
  };
  request: {
    method: string;
    url: string;
    path: string;
    query: any;
    params: any;
    headers: Record<string, string>;
    userAgent?: string;
    ip: string;
    userId?: string;
  };
  response: {
    statusCode: number;
    responseTime: number;
  };
  context?: any;
}

// Error monitoring service
export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private errorLogs: ErrorLogEntry[] = [];
  private metrics: ErrorMetrics;
  private maxLogEntries = 10000; // Keep last 10k errors in memory
  private metricsUpdateInterval = 60000; // Update metrics every minute
  
  private constructor() {
    this.metrics = this.initializeMetrics();
    this.startMetricsUpdater();
    this.startLogCleanup();
  }
  
  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }
  
  // Log an error
  public logError(
    error: Error | AppError,
    req: Request,
    responseTime: number,
    context?: any
  ): void {
    const logEntry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string || 'unknown',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error instanceof AppError ? error.type : ErrorType.SYSTEM,
        statusCode: error instanceof AppError ? error.statusCode : 500,
        isOperational: error instanceof AppError ? error.isOperational : false,
        details: error instanceof AppError ? error.details : undefined
      },
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        params: req.params,
        headers: this.sanitizeHeaders(req.headers as Record<string, string>),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.id
      },
      response: {
        statusCode: error instanceof AppError ? error.statusCode : 500,
        responseTime
      },
      context
    };
    
    this.errorLogs.push(logEntry);
    
    // Keep only the most recent errors
    if (this.errorLogs.length > this.maxLogEntries) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogEntries);
    }
    
    // Update metrics immediately for critical errors
    if (!logEntry.error.isOperational) {
      this.updateMetrics();
    }
    
    // Send to external monitoring services in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalServices(logEntry);
    }
  }
  
  // Get error metrics
  public getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }
  
  // Get error logs with filtering
  public getErrorLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    errorType?: ErrorType;
    statusCode?: number;
    userId?: string;
    endpoint?: string;
    limit?: number;
    offset?: number;
  } = {}): ErrorLogEntry[] {
    let filteredLogs = [...this.errorLogs];
    
    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }
    
    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }
    
    if (filters.errorType) {
      filteredLogs = filteredLogs.filter(log => log.error.type === filters.errorType);
    }
    
    if (filters.statusCode) {
      filteredLogs = filteredLogs.filter(log => log.error.statusCode === filters.statusCode);
    }
    
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.request.userId === filters.userId);
    }
    
    if (filters.endpoint) {
      filteredLogs = filteredLogs.filter(log => 
        log.request.path.includes(filters.endpoint!)
      );
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    
    return filteredLogs.slice(offset, offset + limit);
  }
  
  // Get error trends
  public getErrorTrends(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Array<{
    timestamp: Date;
    errorCount: number;
    errorRate: number;
  }> {
    const now = new Date();
    const intervals: Array<{ timestamp: Date; errorCount: number; errorRate: number }> = [];
    
    let intervalMs: number;
    let intervalCount: number;
    
    switch (timeframe) {
      case 'hour':
        intervalMs = 5 * 60 * 1000; // 5 minutes
        intervalCount = 12; // Last hour
        break;
      case 'day':
        intervalMs = 60 * 60 * 1000; // 1 hour
        intervalCount = 24; // Last day
        break;
      case 'week':
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        intervalCount = 7; // Last week
        break;
      case 'month':
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        intervalCount = 30; // Last month
        break;
    }
    
    for (let i = intervalCount - 1; i >= 0; i--) {
      const intervalStart = new Date(now.getTime() - (i + 1) * intervalMs);
      const intervalEnd = new Date(now.getTime() - i * intervalMs);
      
      const errorsInInterval = this.errorLogs.filter(log =>
        log.timestamp >= intervalStart && log.timestamp < intervalEnd
      );
      
      intervals.push({
        timestamp: intervalStart,
        errorCount: errorsInInterval.length,
        errorRate: errorsInInterval.length / (intervalMs / 1000) // errors per second
      });
    }
    
    return intervals;
  }
  
  // Get top error patterns
  public getTopErrorPatterns(limit: number = 10): Array<{
    pattern: string;
    count: number;
    lastOccurrence: Date;
    errorType: ErrorType;
  }> {
    const patterns = new Map<string, {
      count: number;
      lastOccurrence: Date;
      errorType: ErrorType;
    }>();
    
    this.errorLogs.forEach(log => {
      const pattern = `${log.error.type}:${log.error.statusCode}:${log.request.path}`;
      const existing = patterns.get(pattern);
      
      if (existing) {
        existing.count++;
        if (log.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = log.timestamp;
        }
      } else {
        patterns.set(pattern, {
          count: 1,
          lastOccurrence: log.timestamp,
          errorType: log.error.type
        });
      }
    });
    
    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  // Initialize metrics
  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByType: Object.values(ErrorType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<ErrorType, number>),
      errorsByStatusCode: {},
      errorsByEndpoint: {},
      errorsByUser: {},
      averageResponseTime: 0,
      errorRate: 0,
      lastUpdated: new Date()
    };
  }
  
  // Update metrics
  private updateMetrics(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = this.errorLogs.filter(log => log.timestamp >= oneHourAgo);
    
    this.metrics = {
      totalErrors: this.errorLogs.length,
      errorsByType: this.calculateErrorsByType(recentErrors),
      errorsByStatusCode: this.calculateErrorsByStatusCode(recentErrors),
      errorsByEndpoint: this.calculateErrorsByEndpoint(recentErrors),
      errorsByUser: this.calculateErrorsByUser(recentErrors),
      averageResponseTime: this.calculateAverageResponseTime(recentErrors),
      errorRate: recentErrors.length / 3600, // errors per second in last hour
      lastUpdated: now
    };
  }
  
  private calculateErrorsByType(errors: ErrorLogEntry[]): Record<ErrorType, number> {
    const result = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<ErrorType, number>);
    
    errors.forEach(error => {
      result[error.error.type]++;
    });
    
    return result;
  }
  
  private calculateErrorsByStatusCode(errors: ErrorLogEntry[]): Record<number, number> {
    const result: Record<number, number> = {};
    
    errors.forEach(error => {
      const code = error.error.statusCode;
      result[code] = (result[code] || 0) + 1;
    });
    
    return result;
  }
  
  private calculateErrorsByEndpoint(errors: ErrorLogEntry[]): Record<string, number> {
    const result: Record<string, number> = {};
    
    errors.forEach(error => {
      const endpoint = error.request.path;
      result[endpoint] = (result[endpoint] || 0) + 1;
    });
    
    return result;
  }
  
  private calculateErrorsByUser(errors: ErrorLogEntry[]): Record<string, number> {
    const result: Record<string, number> = {};
    
    errors.forEach(error => {
      if (error.request.userId) {
        const userId = error.request.userId;
        result[userId] = (result[userId] || 0) + 1;
      }
    });
    
    return result;
  }
  
  private calculateAverageResponseTime(errors: ErrorLogEntry[]): number {
    if (errors.length === 0) return 0;
    
    const totalTime = errors.reduce((sum, error) => sum + error.response.responseTime, 0);
    return totalTime / errors.length;
  }
  
  // Start metrics updater
  private startMetricsUpdater(): void {
    setInterval(() => {
      this.updateMetrics();
    }, this.metricsUpdateInterval);
  }
  
  // Start log cleanup
  private startLogCleanup(): void {
    // Clean up old logs every hour
    setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.errorLogs = this.errorLogs.filter(log => log.timestamp >= oneDayAgo);
    }, 60 * 60 * 1000);
  }
  
  // Generate unique ID
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Sanitize headers to remove sensitive information
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    delete sanitized['x-auth-token'];
    
    return sanitized;
  }
  
  // Send to external monitoring services
  private sendToExternalServices(logEntry: ErrorLogEntry): void {
    // Example integrations (implement based on your monitoring stack)
    
    // Sentry
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { extra: logEntry });
    }
    
    // DataDog
    if (process.env.DATADOG_API_KEY) {
      // Send to DataDog
    }
    
    // Custom webhook
    if (process.env.ERROR_WEBHOOK_URL) {
      fetch(process.env.ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      }).catch(err => {
        console.error('Failed to send error to webhook:', err);
      });
    }
  }
}

// Middleware to track response times and errors
export function errorMonitoringMiddleware() {
  const monitor = ErrorMonitoringService.getInstance();
  
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Override res.json to capture response time
    const originalJson = res.json;
    res.json = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      // If this is an error response, log it
      if (res.statusCode >= 400 && body?.error) {
        const error = new AppError(
          body.error.message,
          body.error.type || ErrorType.SYSTEM,
          res.statusCode,
          true,
          body.error.details
        );
        
        monitor.logError(error, req, responseTime);
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
}

// Export singleton instance
export const errorMonitoring = ErrorMonitoringService.getInstance();