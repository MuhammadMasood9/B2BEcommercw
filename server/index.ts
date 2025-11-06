import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { passport } from "./auth";
import { notificationService } from './notificationService';
import './alertScheduler'; // Initialize alert scheduler
import './securityScheduler'; // Initialize security monitoring scheduler
import './notificationProcessor'; // Initialize notification processor
import './dbOptimizationScheduler'; // Initialize database optimization scheduler
import { AuthRateLimiter } from './authRateLimiter';
import { AuthSecurityMonitor } from './authSecurityMonitor';
import { queryOptimizationMiddleware, cacheWarmupMiddleware, databaseHealthMiddleware } from './queryOptimizationMiddleware';
import dbOptimizationRoutes from './dbOptimizationRoutes';
import { requestIdMiddleware, globalErrorHandler } from './errorHandler';
import { 
  healthCheck, 
  requestTimeout, 
  RateLimiter, 
  MemoryManager, 
  GracefulShutdown 
} from './gracefulRecovery';
import { errorMonitoringMiddleware } from './errorMonitoring';
import errorManagementRoutes from './errorManagementRoutes';

const app = express();

// Increase timeout for large uploads
app.use((req, res, next) => {
  req.setTimeout(30 * 60 * 1000); // 30 minutes
  res.setTimeout(30 * 60 * 1000); // 30 minutes
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Session configuration
const PgSession = ConnectPgSimple(session);
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: false, limit: '1gb' }));

// Add request ID middleware for error tracking
app.use(requestIdMiddleware);

// Add health check endpoint
app.use(healthCheck());

// Add request timeout middleware
app.use(requestTimeout(30000)); // 30 second timeout

// Add rate limiting
app.use('/api', RateLimiter.middleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // per IP
  skipSuccessfulRequests: true
}));

// Add error monitoring middleware
app.use(errorMonitoringMiddleware());

// Add database optimization middleware
app.use(queryOptimizationMiddleware({
  enableCaching: true,
  cacheTTL: 300000, // 5 minutes
  enableMetrics: true,
  slowQueryThreshold: 1000, // 1 second
  enableQueryAnalysis: process.env.NODE_ENV === 'development'
}));

// Add cache warmup and health check middleware
app.use(cacheWarmupMiddleware());
app.use(databaseHealthMiddleware());

// Add database optimization API routes
app.use('/api/db-optimization', dbOptimizationRoutes);

// Add error management API routes
app.use('/api/errors', errorManagementRoutes);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Setup WebSocket server for real-time notifications on a specific path
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/notifications'
  });
  
  wss.on('connection', (ws, req) => {
    log('WebSocket connection established');
    
    // Extract user ID from query parameters or headers
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    let userId = url.searchParams.get('userId');
    const token = url.searchParams.get('token');
    
    log(`WebSocket connection attempt - URL: ${req.url}, userId: ${userId}, token: ${token ? 'present' : 'none'}`);
    
    // If no userId but token is present, try to extract userId from JWT token
    if (!userId && token && token.includes('.')) { // JWT tokens contain dots
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        userId = decoded.userId || decoded.id;
        log(`Extracted userId from token: ${userId}`);
      } catch (error) {
        log(`Invalid JWT token provided: ${(error as Error).message}`);
      }
    }
    
    if (userId && userId !== 'undefined' && userId !== 'null') {
      notificationService.addConnection(userId, ws);
      log(`User ${userId} connected to WebSocket`);
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        data: { status: 'connected', userId }
      }));
    } else {
      log(`WebSocket connection without valid userId, closing. Received userId: ${userId}, token: ${token ? 'present' : 'none'}`);
      ws.close(1008, 'User ID required');
    }
    
    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
            
          case 'typing':
            if (userId && message.conversationId) {
              notificationService.sendTypingIndicator(
                message.conversationId,
                userId,
                message.isTyping
              );
            }
            break;
            
          case 'user_status':
            if (userId) {
              notificationService.sendUserStatusUpdate(
                userId,
                message.isOnline,
                message.lastSeen ? new Date(message.lastSeen) : undefined
              );
            }
            break;
            
          default:
            log(`Unknown WebSocket message type: ${message.type}`);
        }
      } catch (error) {
        log(`Error parsing WebSocket message: ${error}`);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        log(`User ${userId} disconnected from WebSocket`);
      }
    });
    
    ws.on('error', (error) => {
      log(`WebSocket error: ${error}`);
    });
  });

  // Use the comprehensive global error handler
  app.use(globalErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.platform === 'win32' ? 'localhost' : '0.0.0.0';
  
  // Initialize graceful shutdown handling
  GracefulShutdown.init(server);
  
  // Start memory monitoring
  MemoryManager.monitorMemoryUsage();
  
  // Start rate limiter cleanup
  RateLimiter.cleanup();
  
  // Initialize authentication security systems
  AuthRateLimiter.initialize();
  AuthSecurityMonitor.initialize();
  
  // Initialize enhanced security monitoring
  const { enhancedSecurityMonitoringService } = await import('./enhancedSecurityMonitoringService');
  await enhancedSecurityMonitoringService.initialize();
  
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
})();
