import { Router } from 'express';
import { hybridAuthMiddleware } from './authMiddleware';
import {
  requireEnhancedAuth,
  requireEnhancedRole,
  requireSupplierStatus,
  requireStaffPermission,
  requireSupplierOwnership,
  requireBuyerOwnership,
  requireResourceOwnership,
  getIdFromParams,
  getSupplierIdFromParams,
  getBuyerIdFromParams,
  getProductIdFromParams,
  getOrderIdFromParams,
  AuthorizationErrorCodes
} from './enhancedAuthGuards';
import { 
  enhancedStaffManagementService,
  createStaffMemberSchema,
  updateStaffMemberSchema,
  staffActivityFilterSchema
} from './enhancedStaffManagementService';
import { 
  enhancedAdminUserManagementService,
  userFilterSchema,
  supplierApprovalSchema,
  userSuspensionSchema,
  passwordResetSchema
} from './enhancedAdminUserManagementService';
import { z } from 'zod';

const router = Router();

// ==================== STAFF MANAGEMENT ROUTES ====================

/**
 * GET /api/auth/staff - Get all staff members for supplier
 */
router.get('/staff', 
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['supplier']),
  async (req, res) => {
    try {
      const supplierId = req.user?.supplierId;
      
      if (!supplierId) {
        return res.status(400).json({
          error: 'Supplier ID not found',
          code: AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED
        });
      }
      
      const { includeInactive = 'false' } = req.query;
      
      const staffMembers = await enhancedStaffManagementService.getStaffMembers(
        supplierId,
        includeInactive === 'true'
      );
      
      res.json({
        success: true,
        staff: staffMembers,
        total: staffMembers.length
      });
    } catch (error: any) {
      console.error('Get staff members error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get staff members',
        code: 'STAFF_FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/staff/:id - Get specific staff member
 */
router.get('/staff/:id',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['supplier']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const supplierId = req.user?.supplierId;
      
      if (!supplierId) {
        return res.status(400).json({
          error: 'Supplier ID not found',
          code: AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED
        });
      }
      
      const staffMember = await enhancedStaffManagementService.getStaffMember(id, supplierId);
      
      if (!staffMember) {
        return res.status(404).json({
          error: 'Staff member not found',
          code: AuthorizationErrorCodes.RESOURCE_NOT_FOUND
        });
      }
      
      res.json({
        success: true,
        staffMember
      });
    } catch (error: any) {
      console.error('Get staff member error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get staff member',
        code: 'STAFF_FETCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/auth/staff - Create new staff member
 */
router.post('/staff',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['supplier']),
  requireSupplierStatus(['approved'], { allowStaffAccess: false }), // Only supplier owners can create staff
  async (req, res) => {
    try {
      const supplierId = req.user?.supplierId;
      const userId = req.user?.id;
      
      if (!supplierId || !userId) {
        return res.status(400).json({
          error: 'Supplier information not found',
          code: AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED
        });
      }
      
      // Validate request body
      const validationResult = createStaffMemberSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        });
      }
      
      const result = await enhancedStaffManagementService.createStaffMember(
        supplierId,
        validationResult.data,
        userId,
        req.ip
      );
      
      res.status(201).json({
        success: true,
        message: 'Staff member created successfully',
        staffMember: result.staffMember,
        temporaryPassword: result.temporaryPassword
      });
    } catch (error: any) {
      console.error('Create staff member error:', error);
      res.status(500).json({
        error: error.message || 'Failed to create staff member',
        code: 'STAFF_CREATE_ERROR'
      });
    }
  }
);

/**
 * PATCH /api/auth/staff/:id - Update staff member
 */
router.patch('/staff/:id',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['supplier']),
  requireStaffPermission('staff', 'update', { allowOwnerAccess: true }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const supplierId = req.user?.supplierId;
      const userId = req.user?.id;
      
      if (!supplierId || !userId) {
        return res.status(400).json({
          error: 'Supplier information not found',
          code: AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED
        });
      }
      
      // Validate request body
      const validationResult = updateStaffMemberSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        });
      }
      
      const updatedStaffMember = await enhancedStaffManagementService.updateStaffMember(
        id,
        supplierId,
        validationResult.data,
        userId,
        req.ip
      );
      
      res.json({
        success: true,
        message: 'Staff member updated successfully',
        staffMember: updatedStaffMember
      });
    } catch (error: any) {
      console.error('Update staff member error:', error);
      res.status(500).json({
        error: error.message || 'Failed to update staff member',
        code: 'STAFF_UPDATE_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/auth/staff/:id - Deactivate staff member
 */
router.delete('/staff/:id',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['supplier']),
  requireStaffPermission('staff', 'delete', { allowOwnerAccess: true }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const supplierId = req.user?.supplierId;
      const userId = req.user?.id;
      
      if (!supplierId || !userId) {
        return res.status(400).json({
          error: 'Supplier information not found',
          code: AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED
        });
      }
      
      await enhancedStaffManagementService.deactivateStaffMember(
        id,
        supplierId,
        userId,
        reason,
        req.ip
      );
      
      res.json({
        success: true,
        message: 'Staff member deactivated successfully'
      });
    } catch (error: any) {
      console.error('Deactivate staff member error:', error);
      res.status(500).json({
        error: error.message || 'Failed to deactivate staff member',
        code: 'STAFF_DELETE_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/staff/activities - Get staff activities
 */
router.get('/staff/activities',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['supplier']),
  async (req, res) => {
    try {
      const supplierId = req.user?.supplierId;
      
      if (!supplierId) {
        return res.status(400).json({
          error: 'Supplier ID not found',
          code: AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED
        });
      }
      
      // Validate query parameters
      const validationResult = staffActivityFilterSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        });
      }
      
      const result = await enhancedStaffManagementService.getStaffActivities(
        supplierId,
        validationResult.data
      );
      
      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Get staff activities error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get staff activities',
        code: 'STAFF_ACTIVITIES_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/staff/performance - Get staff performance metrics
 */
router.get('/staff/performance',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['supplier']),
  requireStaffPermission('analytics', 'read', { allowOwnerAccess: true }),
  async (req, res) => {
    try {
      const supplierId = req.user?.supplierId;
      const { period = '30d' } = req.query;
      
      if (!supplierId) {
        return res.status(400).json({
          error: 'Supplier ID not found',
          code: AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED
        });
      }
      
      const performanceMetrics = await enhancedStaffManagementService.getStaffPerformanceMetrics(
        supplierId,
        period as '7d' | '30d' | '90d'
      );
      
      res.json({
        success: true,
        performanceMetrics
      });
    } catch (error: any) {
      console.error('Get staff performance error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get staff performance metrics',
        code: 'STAFF_PERFORMANCE_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/staff/roles - Get available roles and permissions
 */
router.get('/staff/roles',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['supplier']),
  async (req, res) => {
    try {
      const rolesAndPermissions = enhancedStaffManagementService.getRolesAndPermissions();
      
      res.json({
        success: true,
        roles: rolesAndPermissions
      });
    } catch (error: any) {
      console.error('Get staff roles error:', error);
      res.status(500).json({
        error: 'Failed to get staff roles',
        code: 'STAFF_ROLES_ERROR'
      });
    }
  }
);

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

/**
 * GET /api/auth/admin/users - Get users with filtering and pagination
 */
router.get('/admin/users',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['admin']),
  async (req, res) => {
    try {
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(400).json({
          error: 'Admin ID not found',
          code: AuthorizationErrorCodes.ADMIN_ACCESS_REQUIRED
        });
      }
      
      // Validate query parameters
      const validationResult = userFilterSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        });
      }
      
      const result = await enhancedAdminUserManagementService.getUsers(
        validationResult.data,
        adminId
      );
      
      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get users',
        code: 'ADMIN_USERS_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/admin/users/:id - Get specific user details
 */
router.get('/admin/users/:id',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(400).json({
          error: 'Admin ID not found',
          code: AuthorizationErrorCodes.ADMIN_ACCESS_REQUIRED
        });
      }
      
      const user = await enhancedAdminUserManagementService.getUser(id, adminId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: AuthorizationErrorCodes.RESOURCE_NOT_FOUND
        });
      }
      
      res.json({
        success: true,
        user
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get user',
        code: 'ADMIN_USER_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/admin/suppliers/pending - Get supplier approval queue
 */
router.get('/admin/suppliers/pending',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['admin']),
  async (req, res) => {
    try {
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(400).json({
          error: 'Admin ID not found',
          code: AuthorizationErrorCodes.ADMIN_ACCESS_REQUIRED
        });
      }
      
      const approvalQueue = await enhancedAdminUserManagementService.getSupplierApprovalQueue(adminId);
      
      res.json({
        success: true,
        suppliers: approvalQueue,
        total: approvalQueue.length
      });
    } catch (error: any) {
      console.error('Get supplier approval queue error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get supplier approval queue',
        code: 'ADMIN_APPROVAL_QUEUE_ERROR'
      });
    }
  }
);

/**
 * POST /api/auth/admin/suppliers/:id/approval - Process supplier approval
 */
router.post('/admin/suppliers/:id/approval',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(400).json({
          error: 'Admin ID not found',
          code: AuthorizationErrorCodes.ADMIN_ACCESS_REQUIRED
        });
      }
      
      // Validate request body
      const validationResult = supplierApprovalSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        });
      }
      
      await enhancedAdminUserManagementService.processSupplierApproval(
        id,
        validationResult.data,
        adminId,
        req.ip
      );
      
      res.json({
        success: true,
        message: `Supplier ${validationResult.data.action}d successfully`
      });
    } catch (error: any) {
      console.error('Process supplier approval error:', error);
      res.status(500).json({
        error: error.message || 'Failed to process supplier approval',
        code: 'ADMIN_APPROVAL_ERROR'
      });
    }
  }
);

/**
 * POST /api/auth/admin/users/:id/suspension - Suspend or reactivate user
 */
router.post('/admin/users/:id/suspension',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(400).json({
          error: 'Admin ID not found',
          code: AuthorizationErrorCodes.ADMIN_ACCESS_REQUIRED
        });
      }
      
      // Validate request body
      const validationResult = userSuspensionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        });
      }
      
      await enhancedAdminUserManagementService.processUserSuspension(
        id,
        validationResult.data,
        adminId,
        req.ip
      );
      
      res.json({
        success: true,
        message: `User ${validationResult.data.action}d successfully`
      });
    } catch (error: any) {
      console.error('Process user suspension error:', error);
      res.status(500).json({
        error: error.message || 'Failed to process user suspension',
        code: 'ADMIN_SUSPENSION_ERROR'
      });
    }
  }
);

/**
 * POST /api/auth/admin/users/:id/password-reset - Reset user password
 */
router.post('/admin/users/:id/password-reset',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(400).json({
          error: 'Admin ID not found',
          code: AuthorizationErrorCodes.ADMIN_ACCESS_REQUIRED
        });
      }
      
      // Validate request body
      const validationResult = passwordResetSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors
        });
      }
      
      const result = await enhancedAdminUserManagementService.resetUserPassword(
        id,
        validationResult.data,
        adminId,
        req.ip
      );
      
      res.json({
        success: true,
        message: 'Password reset successfully',
        temporaryPassword: result.temporaryPassword
      });
    } catch (error: any) {
      console.error('Reset user password error:', error);
      res.status(500).json({
        error: error.message || 'Failed to reset user password',
        code: 'ADMIN_PASSWORD_RESET_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/admin/users/:id/activity - Get user activity summary
 */
router.get('/admin/users/:id/activity',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(400).json({
          error: 'Admin ID not found',
          code: AuthorizationErrorCodes.ADMIN_ACCESS_REQUIRED
        });
      }
      
      const activitySummary = await enhancedAdminUserManagementService.getUserActivitySummary(id, adminId);
      
      res.json({
        success: true,
        activitySummary
      });
    } catch (error: any) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get user activity',
        code: 'ADMIN_ACTIVITY_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/admin/statistics - Get platform user statistics
 */
router.get('/admin/statistics',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  requireEnhancedRole(['admin']),
  async (req, res) => {
    try {
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(400).json({
          error: 'Admin ID not found',
          code: AuthorizationErrorCodes.ADMIN_ACCESS_REQUIRED
        });
      }
      
      const statistics = await enhancedAdminUserManagementService.getUserStatistics(adminId);
      
      res.json({
        success: true,
        statistics
      });
    } catch (error: any) {
      console.error('Get user statistics error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get user statistics',
        code: 'ADMIN_STATISTICS_ERROR'
      });
    }
  }
);

// ==================== PERMISSION VALIDATION ROUTES ====================

/**
 * GET /api/auth/permissions/validate - Validate user permissions
 */
router.get('/permissions/validate',
  hybridAuthMiddleware,
  requireEnhancedAuth,
  async (req, res) => {
    try {
      const { resource, action } = req.query;
      
      if (!resource || !action) {
        return res.status(400).json({
          error: 'Resource and action parameters are required',
          code: 'VALIDATION_ERROR'
        });
      }
      
      let hasPermission = false;
      
      // Admin has access to everything
      if (req.user?.role === 'admin') {
        hasPermission = true;
      } else if (req.user?.role === 'supplier' && req.user.isStaffMember && req.user.staffPermissions) {
        // Check staff permissions
        hasPermission = enhancedStaffManagementService.validateStaffPermission(
          req.user.staffPermissions,
          resource as string,
          action as string
        );
      } else if (req.user?.role === 'supplier' && !req.user.isStaffMember) {
        // Supplier owners have full access to their resources
        hasPermission = true;
      }
      
      res.json({
        success: true,
        hasPermission,
        user: {
          id: req.user?.id,
          role: req.user?.role,
          isStaffMember: req.user?.isStaffMember,
          staffRole: req.user?.staffRole
        }
      });
    } catch (error: any) {
      console.error('Permission validation error:', error);
      res.status(500).json({
        error: 'Failed to validate permissions',
        code: 'PERMISSION_VALIDATION_ERROR'
      });
    }
  }
);

export { router as enhancedAuthorizationRoutes };