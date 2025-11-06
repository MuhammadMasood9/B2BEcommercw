import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Security configuration
const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "ws:", "wss:"],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true
  },
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Referrer Policy
  referrerPolicy: 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: []
  }
};

/**
 * Generate Content Security Policy header value
 */
function generateCSPHeader(nonce?: string): string {
  const csp = SECURITY_CONFIG.csp;
  const directives: string[] = [];

  // Add nonce to script-src if provided
  const scriptSrc = [...csp.scriptSrc];
  if (nonce) {
    scriptSrc.push(`'nonce-${nonce}'`);
  }

  directives.push(`default-src ${csp.defaultSrc.join(' ')}`);
  directives.push(`script-src ${scriptSrc.join(' ')}`);
  directives.push(`style-src ${csp.styleSrc.join(' ')}`);
  directives.push(`font-src ${csp.fontSrc.join(' ')}`);
  directives.push(`img-src ${csp.imgSrc.join(' ')}`);
  directives.push(`connect-src ${csp.connectSrc.join(' ')}`);
  directives.push(`media-src ${csp.mediaSrc.join(' ')}`);
  directives.push(`object-src ${csp.objectSrc.join(' ')}`);
  directives.push(`frame-src ${csp.frameSrc.join(' ')}`);
  directives.push(`base-uri ${csp.baseUri.join(' ')}`);
  directives.push(`form-action ${csp.formAction.join(' ')}`);
  directives.push(`frame-ancestors ${csp.frameAncestors.join(' ')}`);
  
  if (csp.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/**
 * Generate Permissions Policy header value
 */
function generatePermissionsPolicyHeader(): string {
  const policy = SECURITY_CONFIG.permissionsPolicy;
  const directives: string[] = [];

  for (const [feature, allowlist] of Object.entries(policy)) {
    if (allowlist.length === 0) {
      directives.push(`${feature}=()`);
    } else {
      directives.push(`${feature}=(${allowlist.join(' ')})`);
    }
  }

  return directives.join(', ');
}

/**
 * Security headers middleware
 */
export function securityHeaders(options: {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableNonce?: boolean;
  isDevelopment?: boolean;
} = {}) {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableNonce = false,
    isDevelopment = process.env.NODE_ENV === 'development'
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate nonce for CSP if enabled
    let nonce: string | undefined;
    if (enableNonce) {
      nonce = crypto.randomBytes(16).toString('base64');
      res.locals.nonce = nonce;
    }

    // X-Content-Type-Options: Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options: Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection: Enable XSS filtering (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy: Control referrer information
    res.setHeader('Referrer-Policy', SECURITY_CONFIG.referrerPolicy);

    // X-DNS-Prefetch-Control: Control DNS prefetching
    res.setHeader('X-DNS-Prefetch-Control', 'off');

    // X-Download-Options: Prevent file downloads from opening directly
    res.setHeader('X-Download-Options', 'noopen');

    // X-Permitted-Cross-Domain-Policies: Restrict cross-domain policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Cross-Origin-Embedder-Policy: Control embedding of cross-origin resources
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin-Opener-Policy: Control cross-origin window interactions
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin-Resource-Policy: Control cross-origin resource sharing
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Content Security Policy
    if (enableCSP) {
      const cspHeader = generateCSPHeader(nonce);
      res.setHeader('Content-Security-Policy', cspHeader);
    }

    // HTTP Strict Transport Security (only in production with HTTPS)
    if (enableHSTS && !isDevelopment && req.secure) {
      const hstsValue = `max-age=${SECURITY_CONFIG.hsts.maxAge}; includeSubDomains; preload`;
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // Permissions Policy
    const permissionsPolicyHeader = generatePermissionsPolicyHeader();
    res.setHeader('Permissions-Policy', permissionsPolicyHeader);

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  };
}

/**
 * CSRF protection middleware (simple token-based)
 */
export function csrfProtection(options: {
  ignoreMethods?: string[];
  tokenHeader?: string;
  cookieName?: string;
} = {}) {
  const {
    ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
    tokenHeader = 'x-csrf-token',
    cookieName = 'csrf-token'
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF protection for safe methods
    if (ignoreMethods.includes(req.method)) {
      return next();
    }

    // Skip for API endpoints with JWT authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Get CSRF token from header or body
    const token = req.headers[tokenHeader] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID'
      });
    }

    next();
  };
}

/**
 * Generate CSRF token for session
 */
export function generateCSRFToken(req: Request): string {
  const token = crypto.randomBytes(32).toString('hex');
  if (req.session) {
    req.session.csrfToken = token;
  }
  return token;
}

/**
 * Security monitoring middleware
 */
export function securityMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log suspicious patterns
    const suspiciousPatterns = [
      /\.\./,                    // Path traversal
      /<script/i,                // XSS attempts
      /union.*select/i,          // SQL injection
      /javascript:/i,            // JavaScript protocol
      /data:.*base64/i,          // Data URI with base64
      /eval\(/i,                 // Code injection
      /expression\(/i,           // CSS expression injection
      /vbscript:/i,              // VBScript protocol
      /onload=/i,                // Event handler injection
      /onerror=/i,               // Error handler injection
    ];

    const userAgent = req.headers['user-agent'] || '';
    const url = req.url;
    const body = JSON.stringify(req.body);

    // Check for suspicious patterns
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(url) || pattern.test(body) || pattern.test(userAgent)
    );

    if (isSuspicious) {
      console.warn('Suspicious request detected:', {
        ip: req.ip,
        userAgent,
        url,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      // You could integrate with your audit logging system here
      // AuditLogService.logSecurityEvent(...)
    }

    // Check for common attack vectors
    const isBot = /bot|crawler|spider|scraper/i.test(userAgent);
    const hasLongUrl = url.length > 2000;
    const hasLargeBody = JSON.stringify(req.body).length > 100000;

    if (isBot || hasLongUrl || hasLargeBody) {
      console.warn('Potentially malicious request:', {
        ip: req.ip,
        userAgent,
        url: url.substring(0, 100),
        isBot,
        hasLongUrl,
        hasLargeBody,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * Request size limiter
 */
export function requestSizeLimiter(maxSize: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE',
        maxSize
      });
    }

    next();
  };
}

/**
 * IP whitelist/blacklist middleware
 */
export function ipFilter(options: {
  whitelist?: string[];
  blacklist?: string[];
  trustProxy?: boolean;
} = {}) {
  const { whitelist, blacklist, trustProxy = true } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    let clientIP = req.ip;
    
    // Get real IP if behind proxy
    if (trustProxy) {
      const forwardedFor = req.headers['x-forwarded-for'];
      if (forwardedFor && typeof forwardedFor === 'string') {
        clientIP = forwardedFor.split(',')[0].trim();
      }
    }

    // Check blacklist first
    if (blacklist && blacklist.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'IP_BLOCKED'
      });
    }

    // Check whitelist if defined
    if (whitelist && whitelist.length > 0 && !whitelist.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'IP_NOT_WHITELISTED'
      });
    }

    next();
  };
}

export default {
  securityHeaders,
  csrfProtection,
  generateCSRFToken,
  securityMonitoring,
  requestSizeLimiter,
  ipFilter
};