import { Router } from 'express';
import { hybridAuthMiddleware } from './authMiddleware';
import { 
  requireAuth, 
  requireAdmin, 
  requireSupplier, 
  requireBuyer,
  requireRoles,
  requireEmailVerification,
  requireSupplierStatus,
  requireApprovedSupplier
} from './authGuards';
import RBACService from './rbacService';

/**
 * Route Protection Configuration
 * Defines authentication and authorization requirements for different route patterns
 */
export interface RouteProtectionConfig {
  path: string;
  methods?: string[];
  middleware: any[];
  description?: string;
}

/**
 * Centralized route protection configurations
 */
export const ROUTE_PROTECTIONS: RouteProtectionConfig[] = [
  // ==================== PUBLIC ROUTES (No Auth Required) ====================
  {
    path: '/api/auth/*',
    middleware: [],
    description: 'Authentication endpoints - public access'
  },
  {
    path: '/api/categories',
    methods: ['GET'],
    middleware: [],
    description: 'Category listing - public read access'
  },
  {
    path: '/api/products/search',
    methods: ['GET'],
    middleware: [],
    description: 'Product search - public read access'
  },

  // ==================== AUTHENTICATED ROUTES ====================
  {
    path: '/api/products',
    methods: ['GET'],
    middleware: [hybridAuthMiddleware, requireAuth],
    description: 'Product listing - requires authentication'
  },
  {
    path: '/api/upload/*',
    middleware: [hybridAuthMiddleware, requireAuth],
    description: 'File upload - requires authentication'
  },

  // ==================== BUYER ROUTES ====================
  {
    path: '/api/buyer/*',
    middleware: [hybridAuthMiddleware, requireBuyer],
    description: 'Buyer-specific endpoints'
  },
  {
    path: '/api/buyer/rfqs',
    middleware: [hybridAuthMiddleware, requireBuyer, requireEmailVerification],
    description: 'Buyer RFQ management - requires verified email'
  },
  {
    path: '/api/buyer/inquiries',
    middleware: [hybridAuthMiddleware, requireBuyer, requireEmailVerification],
    description: 'Buyer inquiry management - requires verified email'
  },

  // ==================== SUPPLIER ROUTES ====================
  {
    path: '/api/supplier/*',
    middleware: [hybridAuthMiddleware, requireSupplier],
    description: 'Supplier-specific endpoints'
  },
  {
    path: '/api/suppliers/products',
    middleware: [hybridAuthMiddleware, requireApprovedSupplier],
    description: 'Supplier product management - requires approved status'
  },
  {
    path: '/api/suppliers/orders',
    middleware: [hybridAuthMiddleware, requireApprovedSupplier],
    description: 'Supplier order management - requires approved status'
  },
  {
    path: '/api/suppliers/staff',
    middleware: [hybridAuthMiddleware, requireSupplier],
    description: 'Supplier staff management'
  },

  // ==================== ADMIN ROUTES ====================
  {
    path: '/api/admin/*',
    middleware: [hybridAuthMiddleware, requireAdmin],
    description: 'Admin-only endpoints'
  },
  {
    path: '/api/admin/suppliers',
    middleware: [
      hybridAuthMiddleware, 
      requireAdmin,
      RBACService.requirePermission('suppliers', 'read')
    ],
    description: 'Admin supplier management'
  },
  {
    path: '/api/admin/products',
    middleware: [
      hybridAuthMiddleware, 
      requireAdmin,
      RBACService.requirePermission('products', 'approve')
    ],
    description: 'Admin product approval'
  },
  {
    path: '/api/admin/orders',
    middleware: [
      hybridAuthMiddleware, 
      requireAdmin,
      RBACService.requirePermission('orders', 'read')
    ],
    description: 'Admin order management'
  },
  {
    path: '/api/admin/disputes',
    middleware: [
      hybridAuthMiddleware, 
      requireAdmin,
      RBACService.requirePermission('disputes', 'mediate')
    ],
    description: 'Admin dispute resolution'
  },

  // ==================== MULTI-ROLE ROUTES ====================
  {
    path: '/api/chat/*',
    middleware: [hybridAuthMiddleware, requireRoles(['buyer', 'supplier', 'admin'])],
    description: 'Chat system - all authenticated users'
  },
  {
    path: '/api/disputes',
    methods: ['POST'],
    middleware: [hybridAuthMiddleware, requireRoles(['buyer', 'supplier'])],
    description: 'Dispute creation - buyers and suppliers only'
  },
  {
    path: '/api/disputes',
    methods: ['GET'],
    middleware: [hybridAuthMiddleware, requireAuth],
    description: 'Dispute listing - all authenticated users'
  },

  // ==================== SPECIAL PROTECTION ROUTES ====================
  {
    path: '/api/quotations',
    methods: ['POST'],
    middleware: [
      hybridAuthMiddleware, 
      requireSupplier, 
      requireApprovedSupplier,
      RBACService.requirePermission('quotations', 'send')
    ],
    description: 'Quotation creation - approved suppliers only'
  },
  {
    path: '/api/orders',
    methods: ['POST'],
    middleware: [
      hybridAuthMiddleware, 
      requireBuyer, 
      requireEmailVerification,
      RBACService.requirePermission('orders', 'create')
    ],
    description: 'Order creation - verified buyers only'
  }
];

/**
 * Apply route protection to an Express router
 */
export const applyRouteProtection = (router: Router, protections: RouteProtectionConfig[]) => {
  protections.forEach(config => {
    if (config.methods) {
      config.methods.forEach(method => {
        const methodLower = method.toLowerCase() as keyof Router;
        if (typeof router[methodLower] === 'function') {
          (router as any)[methodLower](config.path, ...config.middleware);
        }
      });
    } else {
      router.use(config.path, ...config.middleware);
    }
  });
};

/**
 * Get protection config for a specific route
 */
export const getRouteProtection = (path: string, method: string = 'GET'): RouteProtectionConfig | null => {
  return ROUTE_PROTECTIONS.find(config => {
    const pathMatches = config.path === path || 
                       (config.path.endsWith('*') && path.startsWith(config.path.slice(0, -1)));
    const methodMatches = !config.methods || config.methods.includes(method.toUpperCase());
    return pathMatches && methodMatches;
  }) || null;
};

/**
 * Validate if a user can access a specific route
 */
export const canAccessRoute = async (
  userId: string, 
  userRole: string, 
  path: string, 
  method: string = 'GET'
): Promise<boolean> => {
  const protection = getRouteProtection(path, method);
  
  if (!protection) {
    return true; // No protection defined, allow access
  }
  
  // Check basic role requirements
  if (protection.middleware.includes(requireAdmin) && userRole !== 'admin') {
    return false;
  }
  
  if (protection.middleware.includes(requireSupplier) && userRole !== 'supplier') {
    return false;
  }
  
  if (protection.middleware.includes(requireBuyer) && userRole !== 'buyer') {
    return false;
  }
  
  // For more complex permission checks, you would need to run the actual middleware
  // This is a simplified version for basic route access validation
  
  return true;
};

/**
 * Middleware to log route access attempts
 */
export const routeAccessLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // Log to console in development, could be sent to logging service in production
    if (process.env.NODE_ENV === 'development') {
      console.log('Route Access:', JSON.stringify(logData, null, 2));
    }
  });
  
  next();
};

export default {
  ROUTE_PROTECTIONS,
  applyRouteProtection,
  getRouteProtection,
  canAccessRoute,
  routeAccessLogger
};