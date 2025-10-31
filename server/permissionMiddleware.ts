import { Request, Response, NextFunction } from 'express';
import { adminAccessControlService } from './adminAccessControlService';
import { db } from './db';
import { adminUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request type to include admin user data
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        roleId: string;
        permissions: Record<string, any>;
        resourcePermissions: Record<string, string[]>;
      };
    }
  }
}

/**
 * Middleware to load admin user data and attach to request
 */
export const loadAdminUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id || req.user.role !== 'admin') {
      return next();
    }

    // Get admin user data
    const adminUserData = await db.select({
      id: adminUsers.id,
      roleId: adminUsers.roleId,
      additionalPermissions: adminUsers.additionalPermissions,
    })
    .from(adminUsers)
    .where(eq(adminUsers.userId, req.user.id))
    .limit(1);

    if (adminUserData.length > 0) {
      const adminUser = adminUserData[0];
      
      // Get role permissions
      const role = await adminAccessControlService.getRoleById(adminUser.roleId);
      
      if (role) {
        req.adminUser = {
          id: adminUser.id,
          roleId: adminUser.roleId,
          permissions: { ...role.permissions, ...adminUser.additionalPermissions },
          resourcePermissions: role.resourcePermissions as Record<string, string[]>,
        };
      }
    }

    next();
  } catch (error) {
    console.error('Load admin user middleware error:', error);
    next();
  }
};

/**
 * Permission validation middleware factory
 * @param resource - The resource being accessed (e.g., 'suppliers', 'orders')
 * @param action - The action being performed (e.g., 'read', 'write', 'approve')
 * @param options - Additional options for permission checking
 */
export const requirePermission = (
  resource: string, 
  action: string, 
  options: {
    allowSuperAdmin?: boolean;
    logAccess?: boolean;
    customValidator?: (req: Request) => Promise<boolean>;
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Load admin user data if not already loaded
      if (!req.adminUser) {
        await loadAdminUserMiddleware(req, res, () => {});
      }

      if (!req.adminUser) {
        return res.status(403).json({ error: 'Admin user data not found' });
      }

      // Check for super admin bypass
      if (options.allowSuperAdmin !== false && req.adminUser.permissions?.all === true) {
        if (options.logAccess) {
          await adminAccessControlService.logAdminActivity({
            adminUserId: req.adminUser.id,
            action: 'access_granted',
            description: `Super admin access granted for ${action} on ${resource}`,
            category: 'authorization',
            entityType: 'permission',
            riskLevel: 'low',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            requestMethod: req.method,
            requestPath: req.path,
          });
        }
        return next();
      }

      // Custom validation
      if (options.customValidator) {
        const customResult = await options.customValidator(req);
        if (!customResult) {
          return res.status(403).json({ 
            error: 'Custom permission validation failed',
            required: { resource, action }
          });
        }
      }

      // Standard permission validation
      const hasPermission = await adminAccessControlService.validatePermission({
        adminUserId: req.adminUser.id,
        resource,
        action,
        context: { 
          ip: req.ip, 
          userAgent: req.get('User-Agent'),
          method: req.method,
          path: req.path,
        },
      });

      if (!hasPermission) {
        // Log permission denial
        await adminAccessControlService.logAdminActivity({
          adminUserId: req.adminUser.id,
          action: 'permission_denied',
          description: `Access denied for ${action} on ${resource}`,
          category: 'authorization',
          entityType: 'permission',
          riskLevel: 'medium',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestMethod: req.method,
          requestPath: req.path,
        });

        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: { resource, action }
        });
      }

      // Log successful access if requested
      if (options.logAccess) {
        await adminAccessControlService.logAdminActivity({
          adminUserId: req.adminUser.id,
          action: 'access_granted',
          description: `Access granted for ${action} on ${resource}`,
          category: 'authorization',
          entityType: 'permission',
          riskLevel: 'low',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestMethod: req.method,
          requestPath: req.path,
        });
      }

      next();
    } catch (error) {
      console.error('Permission validation error:', error);
      
      // Log security event for permission validation failure
      if (req.adminUser?.id) {
        await adminAccessControlService.logAdminActivity({
          adminUserId: req.adminUser.id,
          action: 'permission_validation_error',
          description: `Permission validation failed due to system error: ${error.message}`,
          category: 'security',
          entityType: 'system',
          riskLevel: 'high',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestMethod: req.method,
          requestPath: req.path,
        });
      }

      res.status(500).json({ error: 'Permission validation failed' });
    }
  };
};

/**
 * Middleware to require specific role level
 * @param minLevel - Minimum role level required
 */
export const requireRoleLevel = (minLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.adminUser) {
        await loadAdminUserMiddleware(req, res, () => {});
      }

      if (!req.adminUser) {
        return res.status(403).json({ error: 'Admin user data not found' });
      }

      const role = await adminAccessControlService.getRoleById(req.adminUser.roleId);
      
      if (!role || role.level < minLevel) {
        await adminAccessControlService.logAdminActivity({
          adminUserId: req.adminUser.id,
          action: 'role_level_denied',
          description: `Access denied - insufficient role level (required: ${minLevel}, actual: ${role?.level || 0})`,
          category: 'authorization',
          entityType: 'role',
          riskLevel: 'medium',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestMethod: req.method,
          requestPath: req.path,
        });

        return res.status(403).json({ 
          error: 'Insufficient role level',
          required: minLevel,
          actual: role?.level || 0
        });
      }

      next();
    } catch (error) {
      console.error('Role level validation error:', error);
      res.status(500).json({ error: 'Role level validation failed' });
    }
  };
};

/**
 * Middleware to check if user can perform action on specific entity
 * @param entityType - Type of entity (e.g., 'supplier', 'order')
 * @param action - Action to perform
 * @param getEntityId - Function to extract entity ID from request
 */
export const requireEntityPermission = (
  entityType: string,
  action: string,
  getEntityId: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityId = getEntityId(req);
      
      if (!req.adminUser) {
        await loadAdminUserMiddleware(req, res, () => {});
      }

      if (!req.adminUser) {
        return res.status(403).json({ error: 'Admin user data not found' });
      }

      // Check base permission first
      const hasBasePermission = await adminAccessControlService.validatePermission({
        adminUserId: req.adminUser.id,
        resource: entityType,
        action,
      });

      if (!hasBasePermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions for entity type',
          required: { resource: entityType, action }
        });
      }

      // Log entity access
      await adminAccessControlService.logAdminActivity({
        adminUserId: req.adminUser.id,
        action: `${action}_${entityType}`,
        description: `${action} access granted for ${entityType} ${entityId}`,
        category: 'data_modification',
        entityType,
        entityId,
        riskLevel: action === 'read' ? 'low' : 'medium',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.path,
      });

      next();
    } catch (error) {
      console.error('Entity permission validation error:', error);
      res.status(500).json({ error: 'Entity permission validation failed' });
    }
  };
};

/**
 * Security monitoring middleware - logs all admin actions
 */
export const securityMonitoringMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role === 'admin' && req.adminUser?.id) {
      // Log all admin API calls for security monitoring
      await adminAccessControlService.logAdminActivity({
        adminUserId: req.adminUser.id,
        action: 'api_call',
        description: `Admin API call: ${req.method} ${req.path}`,
        category: 'system_access',
        entityType: 'api',
        riskLevel: 'low',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.path,
        requestParams: { 
          query: req.query, 
          params: req.params,
          // Don't log sensitive data like passwords
          body: req.body?.password ? { ...req.body, password: '[REDACTED]' } : req.body
        },
      });
    }
    next();
  } catch (error) {
    console.error('Security monitoring error:', error);
    next(); // Don't block request on monitoring failure
  }
};