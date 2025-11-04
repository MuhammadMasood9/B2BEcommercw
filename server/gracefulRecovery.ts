import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorType, ErrorFactory } from './errorHandler';

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly resetTimeout: number = 30000 // 30 seconds
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw ErrorFactory.externalService('circuit_breaker', 'service_unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  getFailures(): number {
    return this.failures;
  }
}

// Retry mechanism with exponential backoff
export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      retryCondition?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryCondition = (error) => this.isRetryableError(error)
    } = options;
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }
        
        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  private static isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return true;
    }
    
    if (error instanceof AppError) {
      return error.type === ErrorType.EXTERNAL_SERVICE || 
             error.type === ErrorType.DATABASE ||
             (error.type === ErrorType.SYSTEM && error.statusCode >= 500);
    }
    
    return false;
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Graceful degradation middleware
export function gracefulDegradation(
  fallbackHandler: (req: Request, res: Response) => void | Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      next();
    } catch (error) {
      console.warn('Graceful degradation triggered:', error);
      
      try {
        await fallbackHandler(req, res);
      } catch (fallbackError) {
        console.error('Fallback handler failed:', fallbackError);
        next(error); // Pass original error to global handler
      }
    }
  };
}

// Health check middleware
export function healthCheck() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || req.path === '/api/health') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      });
      return;
    }
    next();
  };
}

// Database connection recovery
export class DatabaseRecovery {
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 5000;
  
  static async handleDatabaseError(error: any): Promise<void> {
    if (this.isDatabaseConnectionError(error)) {
      await this.attemptReconnection();
    }
  }
  
  private static isDatabaseConnectionError(error: any): boolean {
    return error.code === 'ECONNREFUSED' || 
           error.code === 'ENOTFOUND' ||
           error.message?.includes('connection') ||
           error.message?.includes('timeout');
  }
  
  private static async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw ErrorFactory.database('connection_failed');
    }
    
    this.reconnectAttempts++;
    console.log(`Attempting database reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    await RetryManager.withRetry(
      async () => {
        // Attempt to reconnect to database
        const { db } = await import('./db');
        await db.select().from('users').limit(1); // Test query
        this.reconnectAttempts = 0; // Reset on success
      },
      {
        maxRetries: 2,
        baseDelay: this.reconnectDelay,
        retryCondition: () => true
      }
    );
  }
}

// Memory management and cleanup
export class MemoryManager {
  private static memoryThreshold = 0.9; // 90% of available memory
  
  static monitorMemoryUsage(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal;
      const usedMemory = usage.heapUsed;
      const memoryUsageRatio = usedMemory / totalMemory;
      
      if (memoryUsageRatio > this.memoryThreshold) {
        console.warn('High memory usage detected:', {
          used: Math.round(usedMemory / 1024 / 1024) + 'MB',
          total: Math.round(totalMemory / 1024 / 1024) + 'MB',
          ratio: Math.round(memoryUsageRatio * 100) + '%'
        });
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
    }, 30000); // Check every 30 seconds
  }
  
  static cleanup(): void {
    // Cleanup operations before shutdown
    console.log('Performing cleanup operations...');
    
    // Clear intervals, close connections, etc.
    if (global.gc) {
      global.gc();
    }
  }
}

// Graceful shutdown handler
export class GracefulShutdown {
  private static isShuttingDown = false;
  private static connections: Set<any> = new Set();
  
  static init(server: any): void {
    // Track connections
    server.on('connection', (connection: any) => {
      this.connections.add(connection);
      connection.on('close', () => {
        this.connections.delete(connection);
      });
    });
    
    // Handle shutdown signals
    process.on('SIGTERM', () => this.shutdown(server, 'SIGTERM'));
    process.on('SIGINT', () => this.shutdown(server, 'SIGINT'));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown(server, 'uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown(server, 'unhandledRejection');
    });
  }
  
  private static async shutdown(server: any, signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });
    
    // Close existing connections
    for (const connection of this.connections) {
      connection.destroy();
    }
    
    // Cleanup resources
    MemoryManager.cleanup();
    
    // Give time for cleanup
    setTimeout(() => {
      console.log('Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  }
}

// Request timeout middleware
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout',
            type: ErrorType.SYSTEM,
            timestamp: new Date().toISOString(),
            path: req.path
          }
        });
      }
    }, timeoutMs);
    
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
}

// Rate limiting with graceful degradation
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  
  static middleware(options: {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
  } = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      keyGenerator = (req) => req.ip,
      skipSuccessfulRequests = false
    } = options;
    
    return (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Get or create request history for this key
      let requests = this.requests.get(key) || [];
      
      // Remove old requests outside the window
      requests = requests.filter(timestamp => timestamp > windowStart);
      
      // Check if limit exceeded
      if (requests.length >= maxRequests) {
        const resetTime = new Date(requests[0] + windowMs);
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toISOString()
        });
        
        throw ErrorFactory.rateLimit('api_calls');
      }
      
      // Add current request
      requests.push(now);
      this.requests.set(key, requests);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - requests.length).toString(),
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
      });
      
      // If we should skip successful requests, remove this request on success
      if (skipSuccessfulRequests) {
        res.on('finish', () => {
          if (res.statusCode < 400) {
            const currentRequests = this.requests.get(key) || [];
            const index = currentRequests.lastIndexOf(now);
            if (index > -1) {
              currentRequests.splice(index, 1);
              this.requests.set(key, currentRequests);
            }
          }
        });
      }
      
      next();
    };
  }
  
  static cleanup(): void {
    // Periodically clean up old entries
    setInterval(() => {
      const now = Date.now();
      const windowMs = 15 * 60 * 1000;
      
      for (const [key, requests] of this.requests.entries()) {
        const validRequests = requests.filter(timestamp => timestamp > now - windowMs);
        if (validRequests.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, validRequests);
        }
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }
}

// Export circuit breaker instances for common services
export const circuitBreakers = {
  database: new CircuitBreaker(5, 60000, 30000),
  emailService: new CircuitBreaker(3, 120000, 60000),
  paymentService: new CircuitBreaker(3, 180000, 90000),
  fileStorage: new CircuitBreaker(5, 60000, 30000)
};