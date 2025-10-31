import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminMiddleware, authMiddleware } from './auth';
import { adminAccessControlService, RoleManagementRequest } from './adminAccessControlService';

const router = Router();

// ==================== VALIDATION SCHEMAS ====================

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').regex(/^[a-z_]+$/, 'Role name must be lowercase with underscores'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  level: z.number().min(0).max(100).default(0),
  parentRoleId: z.string().optional(),
  permissions: z.record(z.any()).default({}),
  resourcePermissions: z.record(z.array(z.string())).default({}),
});

const updateRoleSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  description: z.string().optional(),
  level: z.number().min(0).max(100).optional(),
  parentRoleId: z.string().optional(),
  permissions: z.record(z.any()).optional(),
  resourcePermissions: z.record(z.array(z.string())).optional(),
});

const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().min(1, 'Role is required'),
  requireMfa: z.boolean().default(false),
  sessionTimeoutMinutes: z.number().min(30).max(1440).default(480),
});

const assignRoleSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
});

const validatePermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  context: z.record(z.any()).optional(),
});

// ==================== MIDDLEWARE ====================

// Permission validation middleware
const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: any) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get admin user ID from session
      const adminUserId = req.user.id; // This should be mapped to admin_users table

      const hasPermission = await adminAccessControlService.validatePermission({
        adminUserId,
        resource,
        action,
        context: { ip: req.ip, userAgent: req.get('User-Agent') },
      });

      if (!hasPermission) {
        // Log permission denial
        await adminAccessControlService.logAdminActivity({
          adminUserId,
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

      next();
    } catch (error) {
      console.error('Permission validation error:', error);
      res.status(500).json({ error: 'Permission validation failed' });
    }
  };
};

// ==================== ROLE MANAGEMENT ROUTES ====================

// POST /api/admin/access/role-management - Main role management endpoint
router.post('/role-management', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { action, roleData, userId, roleId, adminUserId } = req.body as RoleManagementRequest;
    
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const currentAdminId = req.user!.id;

    switch (action) {
      case 'create':
        if (!roleData) {
          return res.status(400).json({ error: 'Role data is required for create action' });
        }
        
        const validationResult = createRoleSchema.safeParse(roleData);
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: 'Invalid role data', 
            details: validationResult.error.errors 
          });
        }

        const newRole = await adminAccessControlService.createRole(validationResult.data, currentAdminId);
        
        res.json({
          success: true,
          message: 'Role created successfully',
          role: newRole,
        });
        break;

      case 'update':
        if (!roleId || !roleData) {
          return res.status(400).json({ error: 'Role ID and role data are required for update action' });
        }
        
        const updateValidation = updateRoleSchema.safeParse(roleData);
        if (!updateValidation.success) {
          return res.status(400).json({ 
            error: 'Invalid role data', 
            details: updateValidation.error.errors 
          });
        }

        const updatedRole = await adminAccessControlService.updateRole(roleId, updateValidation.data, currentAdminId);
        
        res.json({
          success: true,
          message: 'Role updated successfully',
          role: updatedRole,
        });
        break;

      case 'delete':
        if (!roleId) {
          return res.status(400).json({ error: 'Role ID is required for delete action' });
        }

        await adminAccessControlService.deleteRole(roleId, currentAdminId);
        
        res.json({
          success: true,
          message: 'Role deleted successfully',
        });
        break;

      case 'assign':
        if (!adminUserId || !roleId) {
          return res.status(400).json({ error: 'Admin user ID and role ID are required for assign action' });
        }

        const assignedUser = await adminAccessControlService.assignRole(adminUserId, roleId, currentAdminId);
        
        res.json({
          success: true,
          message: 'Role assigned successfully',
          adminUser: assignedUser,
        });
        break;

      default:
        res.status(400).json({ error: 'Invalid action specified' });
    }
  } catch (error) {
    console.error('Role management error:', error);
    res.status(500).json({ 
      error: 'Role management operation failed',
      message: error.message 
    });
  }
});

// GET /api/admin/access/roles - Get all roles
router.get('/roles', authMiddleware, adminMiddleware, requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const roles = await adminAccessControlService.getAllRoles();
    
    res.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/admin/access/roles/:id - Get role by ID
router.get('/roles/:id', authMiddleware, adminMiddleware, requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await adminAccessControlService.getRoleById(id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({
      success: true,
      role,
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// GET /api/admin/access/role-hierarchy - Get role hierarchy
router.get('/role-hierarchy', authMiddleware, adminMiddleware, requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const hierarchy = await adminAccessControlService.getRoleHierarchy();
    
    res.json({
      success: true,
      hierarchy,
    });
  } catch (error) {
    console.error('Get role hierarchy error:', error);
    res.status(500).json({ error: 'Failed to fetch role hierarchy' });
  }
});

// ==================== USER MANAGEMENT ROUTES ====================

// POST /api/admin/access/users - Create admin user
router.post('/users', authMiddleware, adminMiddleware, requirePermission('users', 'create'), async (req: Request, res: Response) => {
  try {
    const validationResult = createAdminUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid user data', 
        details: validationResult.error.errors 
      });
    }

    const result = await adminAccessControlService.createAdminUser(validationResult.data, req.user!.id);
    
    res.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      adminUser: result.adminUser,
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({ 
      error: 'Failed to create admin user',
      message: error.message 
    });
  }
});

// GET /api/admin/access/users - Get all admin users
router.get('/users', authMiddleware, adminMiddleware, requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const users = await adminAccessControlService.getAllAdminUsers();
    
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// PUT /api/admin/access/users/:id/role - Assign role to user
router.put('/users/:id/role', authMiddleware, adminMiddleware, requirePermission('users', 'manage_roles'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validationResult = assignRoleSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid role assignment data', 
        details: validationResult.error.errors 
      });
    }

    const updatedUser = await adminAccessControlService.assignRole(id, validationResult.data.roleId, req.user!.id);
    
    res.json({
      success: true,
      message: 'Role assigned successfully',
      adminUser: updatedUser,
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ 
      error: 'Failed to assign role',
      message: error.message 
    });
  }
});

// ==================== PERMISSION VALIDATION ROUTES ====================

// POST /api/admin/access/validate-permission - Validate permission
router.post('/validate-permission', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const validationResult = validatePermissionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid permission validation data', 
        details: validationResult.error.errors 
      });
    }

    const hasPermission = await adminAccessControlService.validatePermission({
      adminUserId: req.user!.id,
      resource: validationResult.data.resource,
      action: validationResult.data.action,
      context: validationResult.data.context,
    });
    
    res.json({
      success: true,
      hasPermission,
      resource: validationResult.data.resource,
      action: validationResult.data.action,
    });
  } catch (error) {
    console.error('Permission validation error:', error);
    res.status(500).json({ error: 'Permission validation failed' });
  }
});

// GET /api/admin/access/permission-resources - Get all permission resources
router.get('/permission-resources', authMiddleware, adminMiddleware, requirePermission('users', 'read'), async (req: Request, res: Response) => {
  try {
    const resources = await adminAccessControlService.getAllPermissionResources();
    
    res.json({
      success: true,
      resources,
    });
  } catch (error) {
    console.error('Get permission resources error:', error);
    res.status(500).json({ error: 'Failed to fetch permission resources' });
  }
});

// ==================== ACTIVITY LOGGING ROUTES ====================

// GET /api/admin/access/activity-logs - Get admin activity logs
router.get('/activity-logs', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { adminUserId, limit = '100', offset = '0' } = req.query;
    
    const logs = await adminAccessControlService.getAdminActivityLogs(
      adminUserId as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({
      success: true,
      logs,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// GET /api/admin/access/security-audit - Get security audit events
router.get('/security-audit', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { adminUserId, eventType, severity, startDate, endDate, limit = '100', offset = '0' } = req.query;
    
    const events = await adminAccessControlService.getSecurityAuditEvents({
      adminUserId: adminUserId as string,
      eventType: eventType as string,
      severity: severity as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    
    res.json({
      success: true,
      events,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Get security audit events error:', error);
    res.status(500).json({ error: 'Failed to fetch security audit events' });
  }
});

export default router;