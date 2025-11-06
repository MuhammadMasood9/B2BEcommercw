import { db } from './db';
import { 
  users, 
  staffMembers, 
  supplierProfiles, 
  authenticationAuditLogs,
  InsertStaffMember, 
  InsertUser,
  InsertAuthenticationAuditLog
} from '@shared/schema';
import { eq, and, desc, gte, sql, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Enhanced staff role definitions with granular permissions
export const ENHANCED_STAFF_ROLES = {
  owner: {
    name: 'Owner',
    description: 'Full access to all supplier functions',
    permissions: {
      products: ['create', 'read', 'update', 'delete', 'publish', 'unpublish'],
      orders: ['read', 'update', 'fulfill', 'cancel', 'refund'],
      inquiries: ['read', 'respond', 'assign', 'close'],
      quotations: ['create', 'read', 'update', 'send', 'withdraw'],
      analytics: ['read', 'export', 'configure'],
      store: ['read', 'update', 'configure', 'customize'],
      staff: ['create', 'read', 'update', 'delete', 'assign_roles'],
      financial: ['read', 'export', 'configure_payouts'],
      settings: ['read', 'update', 'configure'],
      communications: ['read', 'send', 'manage_templates']
    }
  },
  manager: {
    name: 'Manager',
    description: 'Management access with oversight capabilities',
    permissions: {
      products: ['create', 'read', 'update', 'delete', 'publish'],
      orders: ['read', 'update', 'fulfill'],
      inquiries: ['read', 'respond', 'assign'],
      quotations: ['create', 'read', 'update', 'send'],
      analytics: ['read', 'export'],
      store: ['read', 'update'],
      staff: ['read', 'update'],
      financial: ['read'],
      settings: ['read'],
      communications: ['read', 'send']
    }
  },
  product_manager: {
    name: 'Product Manager',
    description: 'Product catalog and inventory management',
    permissions: {
      products: ['create', 'read', 'update', 'delete', 'publish'],
      orders: ['read'],
      inquiries: ['read', 'respond'],
      quotations: ['create', 'read', 'update', 'send'],
      analytics: ['read'],
      store: ['read'],
      staff: [],
      financial: [],
      settings: [],
      communications: ['read']
    }
  },
  customer_service: {
    name: 'Customer Service',
    description: 'Customer communication and order support',
    permissions: {
      products: ['read'],
      orders: ['read', 'update'],
      inquiries: ['read', 'respond'],
      quotations: ['read'],
      analytics: [],
      store: ['read'],
      staff: [],
      financial: [],
      settings: [],
      communications: ['read', 'send']
    }
  },
  accountant: {
    name: 'Accountant',
    description: 'Financial data and reporting access',
    permissions: {
      products: ['read'],
      orders: ['read'],
      inquiries: ['read'],
      quotations: ['read'],
      analytics: ['read', 'export'],
      store: ['read'],
      staff: [],
      financial: ['read', 'export'],
      settings: [],
      communications: ['read']
    }
  },
  sales_representative: {
    name: 'Sales Representative',
    description: 'Customer engagement and quotation management',
    permissions: {
      products: ['read'],
      orders: ['read'],
      inquiries: ['read', 'respond'],
      quotations: ['create', 'read', 'update', 'send'],
      analytics: ['read'],
      store: ['read'],
      staff: [],
      financial: [],
      settings: [],
      communications: ['read', 'send']
    }
  }
} as const;

export type StaffRoleType = keyof typeof ENHANCED_STAFF_ROLES;

// Validation schemas
export const createStaffMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['manager', 'product_manager', 'customer_service', 'accountant', 'sales_representative'] as const, {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  customPermissions: z.record(z.array(z.string())).optional(),
  sendWelcomeEmail: z.boolean().default(true),
  temporaryPassword: z.string().optional()
});

export const updateStaffMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  role: z.enum(['manager', 'product_manager', 'customer_service', 'accountant', 'sales_representative'] as const, {
    errorMap: () => ({ message: 'Invalid role' })
  }).optional(),
  customPermissions: z.record(z.array(z.string())).optional(),
  isActive: z.boolean().optional(),
  resetPassword: z.boolean().optional()
});

export const staffActivityFilterSchema = z.object({
  staffMemberId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  dateRange: z.enum(['1d', '7d', '30d', '90d']).default('7d'),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export interface StaffMemberWithDetails {
  id: string;
  supplierId: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, string[]>;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
  // Additional computed fields
  roleDisplayName: string;
  roleDescription: string;
  permissionSummary: string[];
  loginStatus: 'never' | 'recent' | 'inactive';
}

export interface StaffActivityLog {
  id: string;
  staffMemberId: string;
  staffName: string;
  staffRole: string;
  action: string;
  description: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  timestamp: Date;
}

export interface StaffPerformanceMetrics {
  staffMemberId: string;
  staffName: string;
  role: string;
  totalActivities: number;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
  lastActivity?: Date;
  productivityScore: number;
  averageResponseTime?: number;
  tasksCompleted: number;
  customerSatisfactionScore?: number;
}

/**
 * Enhanced Staff Management Service
 */
export class EnhancedStaffManagementService {
  
  /**
   * Get all staff members for a supplier with enhanced details
   */
  async getStaffMembers(supplierId: string, includeInactive: boolean = false): Promise<StaffMemberWithDetails[]> {
    try {
      const whereConditions = includeInactive 
        ? eq(staffMembers.supplierId, supplierId)
        : and(eq(staffMembers.supplierId, supplierId), eq(staffMembers.isActive, true));
      
      const staffList = await db.select()
        .from(staffMembers)
        .where(whereConditions)
        .orderBy(desc(staffMembers.createdAt));
      
      return staffList.map(staff => this.enhanceStaffMemberDetails(staff));
    } catch (error) {
      console.error('Error getting staff members:', error);
      throw new Error('Failed to retrieve staff members');
    }
  }
  
  /**
   * Get specific staff member with enhanced details
   */
  async getStaffMember(staffId: string, supplierId: string): Promise<StaffMemberWithDetails | null> {
    try {
      const staffResult = await db.select()
        .from(staffMembers)
        .where(and(
          eq(staffMembers.id, staffId),
          eq(staffMembers.supplierId, supplierId)
        ))
        .limit(1);
      
      if (staffResult.length === 0) {
        return null;
      }
      
      return this.enhanceStaffMemberDetails(staffResult[0]);
    } catch (error) {
      console.error('Error getting staff member:', error);
      throw new Error('Failed to retrieve staff member');
    }
  }
  
  /**
   * Create new staff member with enhanced validation and setup
   */
  async createStaffMember(
    supplierId: string, 
    staffData: z.infer<typeof createStaffMemberSchema>,
    createdBy: string,
    ipAddress?: string
  ): Promise<{ staffMember: StaffMemberWithDetails; temporaryPassword: string }> {
    try {
      // Validate supplier exists and is approved
      const supplier = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);
      
      if (supplier.length === 0) {
        throw new Error('Supplier not found');
      }
      
      if (supplier[0].status !== 'approved' || !supplier[0].isActive) {
        throw new Error('Supplier must be approved and active to manage staff');
      }
      
      // Check if email already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, staffData.email))
        .limit(1);
      
      if (existingUser.length > 0) {
        throw new Error('User with this email already exists');
      }
      
      // Check if staff member already exists for this supplier
      const existingStaff = await db.select()
        .from(staffMembers)
        .where(and(
          eq(staffMembers.email, staffData.email),
          eq(staffMembers.supplierId, supplierId)
        ))
        .limit(1);
      
      if (existingStaff.length > 0) {
        throw new Error('Staff member with this email already exists');
      }
      
      // Generate permissions
      const permissions = this.generatePermissions(staffData.role, staffData.customPermissions);
      
      // Generate temporary password
      const temporaryPassword = staffData.temporaryPassword || this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
      
      // Create user and staff member in transaction
      const result = await db.transaction(async (tx) => {
        // Create user account
        const newUser = await tx.insert(users).values({
          email: staffData.email,
          password: hashedPassword,
          firstName: staffData.name.split(' ')[0] || staffData.name,
          lastName: staffData.name.split(' ').slice(1).join(' ') || '',
          role: 'supplier',
          emailVerified: false,
          isActive: true,
        }).returning();
        
        // Create staff member record
        const staffMemberData: InsertStaffMember = {
          supplierId,
          email: staffData.email,
          name: staffData.name,
          role: staffData.role,
          permissions,
          isActive: true
        };
        
        const newStaffMember = await tx.insert(staffMembers).values(staffMemberData).returning();
        
        // Log the creation activity
        await this.logStaffActivity(tx, {
          staffMemberId: createdBy,
          action: 'staff_member_created',
          description: `Created staff member: ${staffData.name} (${staffData.role})`,
          entityType: 'staff_member',
          entityId: newStaffMember[0].id,
          entityName: staffData.name,
          ipAddress,
          success: true
        });
        
        return { user: newUser[0], staffMember: newStaffMember[0] };
      });
      
      const enhancedStaffMember = this.enhanceStaffMemberDetails(result.staffMember);
      
      // TODO: Send welcome email if requested
      if (staffData.sendWelcomeEmail) {
        await this.sendWelcomeEmail(staffData.email, staffData.name, temporaryPassword);
      }
      
      return { staffMember: enhancedStaffMember, temporaryPassword };
    } catch (error) {
      console.error('Error creating staff member:', error);
      throw error;
    }
  }
  
  /**
   * Update staff member with enhanced validation
   */
  async updateStaffMember(
    staffId: string,
    supplierId: string,
    updateData: z.infer<typeof updateStaffMemberSchema>,
    updatedBy: string,
    ipAddress?: string
  ): Promise<StaffMemberWithDetails> {
    try {
      // Get existing staff member
      const existingStaff = await db.select()
        .from(staffMembers)
        .where(and(
          eq(staffMembers.id, staffId),
          eq(staffMembers.supplierId, supplierId)
        ))
        .limit(1);
      
      if (existingStaff.length === 0) {
        throw new Error('Staff member not found');
      }
      
      const staffMember = existingStaff[0];
      
      // Prepare update data
      const updateFields: any = {
        updatedAt: new Date()
      };
      
      if (updateData.name) {
        updateFields.name = updateData.name;
      }
      
      if (updateData.role) {
        const newPermissions = this.generatePermissions(updateData.role, updateData.customPermissions);
        updateFields.role = updateData.role;
        updateFields.permissions = newPermissions;
      } else if (updateData.customPermissions) {
        const currentPermissions = staffMember.permissions as Record<string, string[]>;
        updateFields.permissions = { ...currentPermissions, ...updateData.customPermissions };
      }
      
      if (updateData.isActive !== undefined) {
        updateFields.isActive = updateData.isActive;
      }
      
      let newTemporaryPassword: string | undefined;
      
      // Handle password reset
      if (updateData.resetPassword) {
        newTemporaryPassword = this.generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(newTemporaryPassword, 12);
        
        await db.update(users)
          .set({ 
            password: hashedPassword,
            updatedAt: new Date()
          })
          .where(eq(users.email, staffMember.email));
      }
      
      // Update staff member in transaction
      const result = await db.transaction(async (tx) => {
        const [updatedStaffMember] = await tx.update(staffMembers)
          .set(updateFields)
          .where(eq(staffMembers.id, staffId))
          .returning();
        
        // Update user account status if needed
        if (updateData.isActive !== undefined) {
          await tx.update(users)
            .set({ 
              isActive: updateData.isActive,
              updatedAt: new Date()
            })
            .where(eq(users.email, staffMember.email));
        }
        
        // Log the update activity
        const changes = Object.keys(updateData).join(', ');
        await this.logStaffActivity(tx, {
          staffMemberId: updatedBy,
          action: 'staff_member_updated',
          description: `Updated staff member: ${staffMember.name} (${changes})`,
          entityType: 'staff_member',
          entityId: staffId,
          entityName: staffMember.name,
          ipAddress,
          success: true
        });
        
        return updatedStaffMember;
      });
      
      // Send password reset email if password was reset
      if (newTemporaryPassword) {
        await this.sendPasswordResetEmail(staffMember.email, staffMember.name, newTemporaryPassword);
      }
      
      return this.enhanceStaffMemberDetails(result);
    } catch (error) {
      console.error('Error updating staff member:', error);
      throw error;
    }
  }
  
  /**
   * Deactivate staff member (soft delete)
   */
  async deactivateStaffMember(
    staffId: string,
    supplierId: string,
    deactivatedBy: string,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const existingStaff = await db.select()
        .from(staffMembers)
        .where(and(
          eq(staffMembers.id, staffId),
          eq(staffMembers.supplierId, supplierId)
        ))
        .limit(1);
      
      if (existingStaff.length === 0) {
        throw new Error('Staff member not found');
      }
      
      const staffMember = existingStaff[0];
      
      await db.transaction(async (tx) => {
        // Deactivate staff member
        await tx.update(staffMembers)
          .set({ 
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(staffMembers.id, staffId));
        
        // Deactivate user account
        await tx.update(users)
          .set({ 
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(users.email, staffMember.email));
        
        // Log the deactivation
        await this.logStaffActivity(tx, {
          staffMemberId: deactivatedBy,
          action: 'staff_member_deactivated',
          description: `Deactivated staff member: ${staffMember.name}${reason ? ` (Reason: ${reason})` : ''}`,
          entityType: 'staff_member',
          entityId: staffId,
          entityName: staffMember.name,
          ipAddress,
          success: true
        });
      });
    } catch (error) {
      console.error('Error deactivating staff member:', error);
      throw error;
    }
  }
  
  /**
   * Get staff activities with enhanced filtering
   */
  async getStaffActivities(
    supplierId: string,
    filters: z.infer<typeof staffActivityFilterSchema>
  ): Promise<{ activities: StaffActivityLog[]; total: number; page: number; limit: number }> {
    try {
      // Get all staff member IDs for this supplier
      const supplierStaff = await db.select({ id: staffMembers.id, name: staffMembers.name, role: staffMembers.role })
        .from(staffMembers)
        .where(eq(staffMembers.supplierId, supplierId));
      
      if (supplierStaff.length === 0) {
        return { activities: [], total: 0, page: filters.page, limit: filters.limit };
      }
      
      const staffMap = new Map(supplierStaff.map(s => [s.id, { name: s.name, role: s.role }]));
      const staffIds = supplierStaff.map(s => s.id);
      
      // Build date filter
      const startDate = this.getDateRangeStart(filters.dateRange);
      
      // Build query conditions
      let whereConditions = and(
        inArray(authenticationAuditLogs.userId, staffIds),
        gte(authenticationAuditLogs.createdAt, startDate)
      );
      
      if (filters.staffMemberId) {
        whereConditions = and(whereConditions, eq(authenticationAuditLogs.userId, filters.staffMemberId));
      }
      
      if (filters.action) {
        whereConditions = and(whereConditions, eq(authenticationAuditLogs.action, filters.action));
      }
      
      // Get activities
      const activities = await db.select()
        .from(authenticationAuditLogs)
        .where(whereConditions)
        .orderBy(desc(authenticationAuditLogs.createdAt))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit);
      
      // Get total count
      const totalResult = await db.select({ count: sql`count(*)` })
        .from(authenticationAuditLogs)
        .where(whereConditions);
      
      const total = parseInt(totalResult[0]?.count as string || '0');
      
      // Transform to StaffActivityLog format
      const staffActivities: StaffActivityLog[] = activities.map(activity => {
        const staffInfo = staffMap.get(activity.userId || '');
        return {
          id: activity.id,
          staffMemberId: activity.userId || '',
          staffName: staffInfo?.name || 'Unknown',
          staffRole: staffInfo?.role || 'Unknown',
          action: activity.action,
          description: activity.action, // Could be enhanced with more descriptive text
          entityType: 'authentication',
          entityId: activity.userId,
          entityName: staffInfo?.name,
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
          success: activity.success,
          timestamp: activity.createdAt
        };
      });
      
      return {
        activities: staffActivities,
        total,
        page: filters.page,
        limit: filters.limit
      };
    } catch (error) {
      console.error('Error getting staff activities:', error);
      throw new Error('Failed to retrieve staff activities');
    }
  }
  
  /**
   * Get staff performance metrics
   */
  async getStaffPerformanceMetrics(supplierId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<StaffPerformanceMetrics[]> {
    try {
      const supplierStaff = await db.select()
        .from(staffMembers)
        .where(eq(staffMembers.supplierId, supplierId));
      
      if (supplierStaff.length === 0) {
        return [];
      }
      
      const startDate = this.getDateRangeStart(period);
      const weekStart = this.getDateRangeStart('7d');
      
      // Get activity counts for each staff member
      const performanceMetrics: StaffPerformanceMetrics[] = [];
      
      for (const staff of supplierStaff) {
        // Get total activities
        const totalActivitiesResult = await db.select({ count: sql`count(*)` })
          .from(authenticationAuditLogs)
          .where(eq(authenticationAuditLogs.userId, staff.id));
        
        const totalActivities = parseInt(totalActivitiesResult[0]?.count as string || '0');
        
        // Get activities this week
        const weekActivitiesResult = await db.select({ count: sql`count(*)` })
          .from(authenticationAuditLogs)
          .where(and(
            eq(authenticationAuditLogs.userId, staff.id),
            gte(authenticationAuditLogs.createdAt, weekStart)
          ));
        
        const activitiesThisWeek = parseInt(weekActivitiesResult[0]?.count as string || '0');
        
        // Get activities this period
        const periodActivitiesResult = await db.select({ count: sql`count(*)` })
          .from(authenticationAuditLogs)
          .where(and(
            eq(authenticationAuditLogs.userId, staff.id),
            gte(authenticationAuditLogs.createdAt, startDate)
          ));
        
        const activitiesThisMonth = parseInt(periodActivitiesResult[0]?.count as string || '0');
        
        // Get last activity
        const lastActivityResult = await db.select({ createdAt: authenticationAuditLogs.createdAt })
          .from(authenticationAuditLogs)
          .where(eq(authenticationAuditLogs.userId, staff.id))
          .orderBy(desc(authenticationAuditLogs.createdAt))
          .limit(1);
        
        const lastActivity = lastActivityResult[0]?.createdAt;
        
        // Calculate productivity score (simple algorithm)
        const productivityScore = Math.min(100, (activitiesThisWeek * 10) + (activitiesThisMonth * 2));
        
        performanceMetrics.push({
          staffMemberId: staff.id,
          staffName: staff.name,
          role: staff.role,
          totalActivities,
          activitiesThisWeek,
          activitiesThisMonth,
          lastActivity,
          productivityScore,
          tasksCompleted: activitiesThisMonth, // Simplified - could be more sophisticated
        });
      }
      
      return performanceMetrics.sort((a, b) => b.productivityScore - a.productivityScore);
    } catch (error) {
      console.error('Error getting staff performance metrics:', error);
      throw new Error('Failed to retrieve staff performance metrics');
    }
  }
  
  /**
   * Get available roles and their permissions
   */
  getRolesAndPermissions(): typeof ENHANCED_STAFF_ROLES {
    return ENHANCED_STAFF_ROLES;
  }
  
  /**
   * Validate staff permission for a specific action
   */
  validateStaffPermission(
    staffPermissions: Record<string, string[]>,
    resource: string,
    action: string
  ): boolean {
    const resourcePermissions = staffPermissions[resource];
    return resourcePermissions && resourcePermissions.includes(action);
  }
  
  // Private helper methods
  
  private enhanceStaffMemberDetails(staffMember: any): StaffMemberWithDetails {
    const roleInfo = ENHANCED_STAFF_ROLES[staffMember.role as StaffRoleType];
    const permissions = staffMember.permissions as Record<string, string[]>;
    
    // Calculate login status
    let loginStatus: 'never' | 'recent' | 'inactive' = 'never';
    if (staffMember.lastLogin) {
      const daysSinceLogin = (Date.now() - new Date(staffMember.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
      loginStatus = daysSinceLogin <= 7 ? 'recent' : 'inactive';
    }
    
    // Generate permission summary
    const permissionSummary = Object.entries(permissions)
      .filter(([_, actions]) => actions.length > 0)
      .map(([resource, actions]) => `${resource}: ${actions.join(', ')}`);
    
    return {
      ...staffMember,
      roleDisplayName: roleInfo?.name || staffMember.role,
      roleDescription: roleInfo?.description || '',
      permissionSummary,
      loginStatus
    };
  }
  
  private generatePermissions(
    role: string,
    customPermissions?: Record<string, string[]>
  ): Record<string, string[]> {
    const roleInfo = ENHANCED_STAFF_ROLES[role as StaffRoleType];
    const defaultPermissions = roleInfo?.permissions || {};
    
    if (customPermissions) {
      return { ...defaultPermissions, ...customPermissions };
    }
    
    return defaultPermissions;
  }
  
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
  
  private getDateRangeStart(range: string): Date {
    const now = new Date();
    switch (range) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
  
  private async logStaffActivity(
    tx: any,
    activityData: {
      staffMemberId: string;
      action: string;
      description: string;
      entityType: string;
      entityId?: string;
      entityName?: string;
      ipAddress?: string;
      success: boolean;
    }
  ): Promise<void> {
    try {
      const auditLogData: InsertAuthenticationAuditLog = {
        userId: activityData.staffMemberId,
        action: activityData.action,
        ipAddress: activityData.ipAddress || 'unknown',
        success: activityData.success,
        metadata: {
          description: activityData.description,
          entityType: activityData.entityType,
          entityId: activityData.entityId,
          entityName: activityData.entityName
        }
      };
      
      await tx.insert(authenticationAuditLogs).values(auditLogData);
    } catch (error) {
      console.error('Error logging staff activity:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }
  
  private async sendWelcomeEmail(email: string, name: string, temporaryPassword: string): Promise<void> {
    // TODO: Implement email service integration
    console.log(`Welcome email for ${name} (${email}): Password: ${temporaryPassword}`);
  }
  
  private async sendPasswordResetEmail(email: string, name: string, newPassword: string): Promise<void> {
    // TODO: Implement email service integration
    console.log(`Password reset email for ${name} (${email}): New password: ${newPassword}`);
  }
}

export const enhancedStaffManagementService = new EnhancedStaffManagementService();