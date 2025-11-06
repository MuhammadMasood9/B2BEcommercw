import { db } from './db';
import { 
  users, 
  supplierProfiles, 
  buyers,
  staffMembers,
  authenticationAuditLogs,
  InsertUser,
  InsertAuthenticationAuditLog
} from '@shared/schema';
import { eq, and, or, desc, gte, sql, like, inArray, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// User management schemas
export const userFilterSchema = z.object({
  role: z.enum(['buyer', 'supplier', 'admin', 'all']).default('all'),
  status: z.enum(['active', 'inactive', 'pending', 'suspended', 'all']).default('all'),
  emailVerified: z.enum(['verified', 'unverified', 'all']).default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'email', 'companyName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export const supplierApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  notes: z.string().optional(),
  notifyUser: z.boolean().default(true)
});

export const userSuspensionSchema = z.object({
  action: z.enum(['suspend', 'reactivate']),
  reason: z.string().min(1, 'Reason is required'),
  duration: z.enum(['temporary', 'permanent']).default('temporary'),
  suspensionDays: z.coerce.number().min(1).max(365).optional(),
  notifyUser: z.boolean().default(true)
});

export const passwordResetSchema = z.object({
  sendEmail: z.boolean().default(true),
  temporaryPassword: z.string().optional(),
  requirePasswordChange: z.boolean().default(true)
});

// Enhanced user interfaces
export interface EnhancedUserDetails {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  role: 'buyer' | 'admin' | 'supplier';
  emailVerified: boolean | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  loginAttempts: number;
  lockedUntil?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
  
  // Role-specific data
  supplierProfile?: {
    id: string;
    businessName: string;
    status: string;
    membershipTier: string;
    isVerified: boolean;
    totalProducts: number;
    totalOrders: number;
  };
  
  buyerProfile?: {
    id: string;
    companyName?: string;
    industry?: string;
    businessType?: string;
  };
  
  // Computed fields
  displayName: string;
  accountStatus: 'active' | 'inactive' | 'pending' | 'suspended' | 'locked';
  lastActivityDescription: string;
  riskLevel: 'low' | 'medium' | 'high';
  totalStaffMembers?: number;
}

export interface UserActivitySummary {
  userId: string;
  totalLogins: number;
  lastLogin?: Date;
  failedLoginAttempts: number;
  passwordChanges: number;
  accountLockouts: number;
  suspensions: number;
  riskScore: number;
}

export interface SupplierApprovalRequest {
  supplierId: string;
  supplierName: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  businessType: string;
  yearEstablished?: number;
  verificationDocs: any[];
  applicationDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
}

/**
 * Enhanced Admin User Management Service
 */
export class EnhancedAdminUserManagementService {
  
  /**
   * Get comprehensive user list with filtering and pagination
   */
  async getUsers(
    filters: z.infer<typeof userFilterSchema>,
    adminId: string
  ): Promise<{ users: EnhancedUserDetails[]; total: number; page: number; limit: number }> {
    try {
      // Build where conditions
      let whereConditions: any = sql`1=1`;
      
      // Role filter
      if (filters.role !== 'all') {
        whereConditions = and(whereConditions, eq(users.role, filters.role));
      }
      
      // Status filter
      if (filters.status !== 'all') {
        switch (filters.status) {
          case 'active':
            whereConditions = and(whereConditions, eq(users.isActive, true));
            break;
          case 'inactive':
            whereConditions = and(whereConditions, eq(users.isActive, false));
            break;
          case 'pending':
            // For suppliers, check if status is pending
            whereConditions = and(
              whereConditions,
              eq(users.role, 'supplier'),
              eq(users.isActive, true)
            );
            break;
          case 'suspended':
            whereConditions = and(whereConditions, eq(users.isActive, false));
            break;
        }
      }
      
      // Email verification filter
      if (filters.emailVerified !== 'all') {
        const isVerified = filters.emailVerified === 'verified';
        whereConditions = and(whereConditions, eq(users.emailVerified, isVerified));
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        whereConditions = and(
          whereConditions,
          or(
            like(users.email, searchTerm),
            like(users.firstName, searchTerm),
            like(users.lastName, searchTerm),
            like(users.companyName, searchTerm)
          )
        );
      }
      
      // Get users with pagination
      const usersList = await db.select()
        .from(users)
        .where(whereConditions)
        .orderBy(
          filters.sortOrder === 'desc' 
            ? desc(users[filters.sortBy as keyof typeof users])
            : users[filters.sortBy as keyof typeof users]
        )
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit);
      
      // Get total count
      const totalResult = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(whereConditions);
      
      const total = parseInt(totalResult[0]?.count as string || '0');
      
      // Enhance user details
      const enhancedUsers = await Promise.all(
        usersList.map(user => this.enhanceUserDetails(user))
      );
      
      // Log admin activity
      await this.logAdminActivity(adminId, 'users_viewed', `Viewed user list (${total} users)`, 'user_management');
      
      return {
        users: enhancedUsers,
        total,
        page: filters.page,
        limit: filters.limit
      };
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Failed to retrieve users');
    }
  }
  
  /**
   * Get specific user with comprehensive details
   */
  async getUser(userId: string, adminId: string): Promise<EnhancedUserDetails | null> {
    try {
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (userResult.length === 0) {
        return null;
      }
      
      const enhancedUser = await this.enhanceUserDetails(userResult[0]);
      
      // Log admin activity
      await this.logAdminActivity(adminId, 'user_viewed', `Viewed user details: ${enhancedUser.email}`, 'user_management', userId);
      
      return enhancedUser;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to retrieve user');
    }
  }
  
  /**
   * Get supplier approval queue
   */
  async getSupplierApprovalQueue(adminId: string): Promise<SupplierApprovalRequest[]> {
    try {
      const pendingSuppliers = await db.select({
        supplierId: supplierProfiles.id,
        supplierUserId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        contactPerson: supplierProfiles.contactPerson,
        status: supplierProfiles.status,
        createdAt: supplierProfiles.createdAt,
        // User details
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        // Additional supplier details
        businessType: supplierProfiles.businessType,
        yearEstablished: supplierProfiles.yearEstablished,
        country: supplierProfiles.country,
        verificationDocs: supplierProfiles.verificationDocs
      })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id))
      .where(eq(supplierProfiles.status, 'pending'))
      .orderBy(desc(supplierProfiles.createdAt));
      
      const approvalRequests: SupplierApprovalRequest[] = pendingSuppliers.map(supplier => ({
        supplierId: supplier.supplierId,
        supplierName: `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim(),
        businessName: supplier.businessName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone || '',
        country: supplier.country || '',
        businessType: supplier.businessType || '',
        yearEstablished: supplier.yearEstablished || undefined,
        verificationDocs: supplier.verificationDocs as any[] || [],
        applicationDate: supplier.createdAt || new Date(),
        status: supplier.status as 'pending',
        priority: this.calculateApprovalPriority(supplier)
      }));
      
      // Log admin activity
      await this.logAdminActivity(adminId, 'approval_queue_viewed', `Viewed supplier approval queue (${approvalRequests.length} pending)`, 'supplier_management');
      
      return approvalRequests;
    } catch (error) {
      console.error('Error getting supplier approval queue:', error);
      throw new Error('Failed to retrieve supplier approval queue');
    }
  }
  
  /**
   * Approve or reject supplier application
   */
  async processSupplierApproval(
    supplierId: string,
    approvalData: z.infer<typeof supplierApprovalSchema>,
    adminId: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Get supplier details
      const supplierResult = await db.select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        status: supplierProfiles.status,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id))
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);
      
      if (supplierResult.length === 0) {
        throw new Error('Supplier not found');
      }
      
      const supplier = supplierResult[0];
      
      if (supplier.status !== 'pending') {
        throw new Error('Supplier application has already been processed');
      }
      
      const newStatus = approvalData.action === 'approve' ? 'approved' : 'rejected';
      
      await db.transaction(async (tx) => {
        // Update supplier status
        await tx.update(supplierProfiles)
          .set({
            status: newStatus,
            updatedAt: new Date()
          })
          .where(eq(supplierProfiles.id, supplierId));
        
        // If approved, activate the user account
        if (approvalData.action === 'approve') {
          await tx.update(users)
            .set({
              isActive: true,
              updatedAt: new Date()
            })
            .where(eq(users.id, supplier.userId));
        }
        
        // Log the approval/rejection
        await this.logAdminActivity(
          adminId,
          `supplier_${approvalData.action}d`,
          `${approvalData.action === 'approve' ? 'Approved' : 'Rejected'} supplier: ${supplier.businessName}${approvalData.reason ? ` (${approvalData.reason})` : ''}`,
          'supplier_management',
          supplierId,
          ipAddress
        );
      });
      
      // Send notification email if requested
      if (approvalData.notifyUser) {
        await this.sendSupplierApprovalNotification(
          supplier.email,
          `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim(),
          supplier.businessName,
          approvalData.action,
          approvalData.reason
        );
      }
    } catch (error) {
      console.error('Error processing supplier approval:', error);
      throw error;
    }
  }
  
  /**
   * Suspend or reactivate user account
   */
  async processUserSuspension(
    userId: string,
    suspensionData: z.infer<typeof userSuspensionSchema>,
    adminId: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Get user details
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (userResult.length === 0) {
        throw new Error('User not found');
      }
      
      const user = userResult[0];
      
      const isActive = suspensionData.action === 'reactivate';
      let lockedUntil: Date | null = null;
      
      if (suspensionData.action === 'suspend' && suspensionData.duration === 'temporary' && suspensionData.suspensionDays) {
        lockedUntil = new Date();
        lockedUntil.setDate(lockedUntil.getDate() + suspensionData.suspensionDays);
      }
      
      await db.transaction(async (tx) => {
        // Update user status
        await tx.update(users)
          .set({
            isActive,
            lockedUntil,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
        
        // If suspending a supplier, also update supplier profile
        if (user.role === 'supplier' && suspensionData.action === 'suspend') {
          await tx.update(supplierProfiles)
            .set({
              isSuspended: true,
              suspensionReason: suspensionData.reason,
              updatedAt: new Date()
            })
            .where(eq(supplierProfiles.userId, userId));
        } else if (user.role === 'supplier' && suspensionData.action === 'reactivate') {
          await tx.update(supplierProfiles)
            .set({
              isSuspended: false,
              suspensionReason: null,
              updatedAt: new Date()
            })
            .where(eq(supplierProfiles.userId, userId));
        }
        
        // Log the suspension/reactivation
        await this.logAdminActivity(
          adminId,
          `user_${suspensionData.action}d`,
          `${suspensionData.action === 'suspend' ? 'Suspended' : 'Reactivated'} user: ${user.email} (${suspensionData.reason})`,
          'user_management',
          userId,
          ipAddress
        );
      });
      
      // Send notification email if requested
      if (suspensionData.notifyUser) {
        await this.sendUserSuspensionNotification(
          user.email,
          `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          suspensionData.action,
          suspensionData.reason,
          lockedUntil
        );
      }
    } catch (error) {
      console.error('Error processing user suspension:', error);
      throw error;
    }
  }
  
  /**
   * Reset user password (admin function)
   */
  async resetUserPassword(
    userId: string,
    resetData: z.infer<typeof passwordResetSchema>,
    adminId: string,
    ipAddress?: string
  ): Promise<{ temporaryPassword?: string }> {
    try {
      // Get user details
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (userResult.length === 0) {
        throw new Error('User not found');
      }
      
      const user = userResult[0];
      
      // Generate temporary password
      const temporaryPassword = resetData.temporaryPassword || this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
      
      await db.transaction(async (tx) => {
        // Update user password
        await tx.update(users)
          .set({
            password: hashedPassword,
            passwordChangedAt: new Date(),
            loginAttempts: 0, // Reset login attempts
            lockedUntil: null, // Remove any account locks
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
        
        // Log the password reset
        await this.logAdminActivity(
          adminId,
          'password_reset_admin',
          `Reset password for user: ${user.email}`,
          'user_management',
          userId,
          ipAddress
        );
      });
      
      // Send email with new password if requested
      if (resetData.sendEmail) {
        await this.sendPasswordResetNotification(
          user.email,
          `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          temporaryPassword,
          resetData.requirePasswordChange
        );
      }
      
      return { temporaryPassword: resetData.sendEmail ? undefined : temporaryPassword };
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  }
  
  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string, adminId: string): Promise<UserActivitySummary> {
    try {
      // Get authentication audit logs for the user
      const auditLogs = await db.select()
        .from(authenticationAuditLogs)
        .where(eq(authenticationAuditLogs.userId, userId))
        .orderBy(desc(authenticationAuditLogs.createdAt));
      
      // Calculate metrics
      const totalLogins = auditLogs.filter(log => log.action === 'login_success').length;
      const failedLoginAttempts = auditLogs.filter(log => log.action === 'login_failure').length;
      const passwordChanges = auditLogs.filter(log => log.action === 'password_change').length;
      const accountLockouts = auditLogs.filter(log => log.action === 'account_locked').length;
      const suspensions = auditLogs.filter(log => log.action.includes('suspend')).length;
      
      const lastLoginLog = auditLogs.find(log => log.action === 'login_success');
      const lastLogin = lastLoginLog?.createdAt;
      
      // Calculate risk score (simple algorithm)
      let riskScore = 0;
      riskScore += failedLoginAttempts * 2;
      riskScore += accountLockouts * 10;
      riskScore += suspensions * 20;
      
      // Reduce risk for successful activities
      riskScore -= Math.min(totalLogins * 0.5, 50);
      riskScore = Math.max(0, Math.min(100, riskScore));
      
      // Log admin activity
      await this.logAdminActivity(adminId, 'user_activity_viewed', `Viewed activity summary for user: ${userId}`, 'user_management', userId);
      
      return {
        userId,
        totalLogins,
        lastLogin,
        failedLoginAttempts,
        passwordChanges,
        accountLockouts,
        suspensions,
        riskScore
      };
    } catch (error) {
      console.error('Error getting user activity summary:', error);
      throw new Error('Failed to retrieve user activity summary');
    }
  }
  
  /**
   * Get platform user statistics
   */
  async getUserStatistics(adminId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
    pendingSuppliers: number;
    suspendedUsers: number;
    unverifiedEmails: number;
  }> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get total users
      const totalUsersResult = await db.select({ count: sql`count(*)` }).from(users);
      const totalUsers = parseInt(totalUsersResult[0]?.count as string || '0');
      
      // Get active users
      const activeUsersResult = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.isActive, true));
      const activeUsers = parseInt(activeUsersResult[0]?.count as string || '0');
      
      // Get new users this month
      const newUsersResult = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(gte(users.createdAt, monthStart));
      const newUsersThisMonth = parseInt(newUsersResult[0]?.count as string || '0');
      
      // Get users by role
      const usersByRoleResult = await db.select({
        role: users.role,
        count: sql`count(*)`
      })
      .from(users)
      .groupBy(users.role);
      
      const usersByRole: Record<string, number> = {};
      usersByRoleResult.forEach(row => {
        usersByRole[row.role] = parseInt(row.count as string || '0');
      });
      
      // Get pending suppliers
      const pendingSuppliersResult = await db.select({ count: sql`count(*)` })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.status, 'pending'));
      const pendingSuppliers = parseInt(pendingSuppliersResult[0]?.count as string || '0');
      
      // Get suspended users
      const suspendedUsersResult = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.isActive, false));
      const suspendedUsers = parseInt(suspendedUsersResult[0]?.count as string || '0');
      
      // Get unverified emails
      const unverifiedEmailsResult = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.emailVerified, false));
      const unverifiedEmails = parseInt(unverifiedEmailsResult[0]?.count as string || '0');
      
      // Log admin activity
      await this.logAdminActivity(adminId, 'statistics_viewed', 'Viewed user statistics', 'user_management');
      
      return {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        usersByRole,
        pendingSuppliers,
        suspendedUsers,
        unverifiedEmails
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw new Error('Failed to retrieve user statistics');
    }
  }
  
  // Private helper methods
  
  private async enhanceUserDetails(user: any): Promise<EnhancedUserDetails> {
    const enhancedUser: EnhancedUserDetails = {
      ...user,
      displayName: this.getDisplayName(user),
      accountStatus: this.getAccountStatus(user),
      lastActivityDescription: this.getLastActivityDescription(user),
      riskLevel: this.calculateRiskLevel(user)
    };
    
    // Load role-specific data
    if (user.role === 'supplier') {
      const supplierResult = await db.select({
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        status: supplierProfiles.status,
        membershipTier: supplierProfiles.membershipTier,
        isVerified: supplierProfiles.isVerified,
        totalProducts: supplierProfiles.totalProducts,
        totalOrders: supplierProfiles.totalOrders
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, user.id))
      .limit(1);
      
      if (supplierResult.length > 0) {
        const supplier = supplierResult[0];
        enhancedUser.supplierProfile = {
          id: supplier.id,
          businessName: supplier.businessName,
          status: supplier.status || 'pending',
          membershipTier: supplier.membershipTier || 'free',
          isVerified: supplier.isVerified || false,
          totalProducts: supplier.totalProducts || 0,
          totalOrders: supplier.totalOrders || 0
        };
      }
      
      // Get staff count
      const staffCountResult = await db.select({ count: sql`count(*)` })
        .from(staffMembers)
        .where(and(
          eq(staffMembers.supplierId, supplierResult[0]?.id || ''),
          eq(staffMembers.isActive, true)
        ));
      
      enhancedUser.totalStaffMembers = parseInt(staffCountResult[0]?.count as string || '0');
    } else if (user.role === 'buyer') {
      const buyerResult = await db.select()
        .from(buyers)
        .where(eq(buyers.userId, user.id))
        .limit(1);
      
      if (buyerResult.length > 0) {
        enhancedUser.buyerProfile = {
          id: buyerResult[0].id,
          companyName: buyerResult[0].companyName || undefined,
          industry: buyerResult[0].industry || undefined,
          businessType: buyerResult[0].businessType || undefined
        };
      }
    }
    
    return enhancedUser;
  }
  
  private getDisplayName(user: any): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.companyName) {
      return user.companyName;
    } else {
      return user.email;
    }
  }
  
  private getAccountStatus(user: any): 'active' | 'inactive' | 'pending' | 'suspended' | 'locked' {
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return 'locked';
    } else if (!user.isActive) {
      return 'suspended';
    } else if (user.role === 'supplier' && !user.emailVerified) {
      return 'pending';
    } else if (!user.isActive) {
      return 'inactive';
    } else {
      return 'active';
    }
  }
  
  private getLastActivityDescription(user: any): string {
    if (user.lastLoginAt) {
      const daysSince = Math.floor((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince === 0) {
        return 'Active today';
      } else if (daysSince === 1) {
        return 'Active yesterday';
      } else if (daysSince <= 7) {
        return `Active ${daysSince} days ago`;
      } else {
        return `Last seen ${daysSince} days ago`;
      }
    } else {
      return 'Never logged in';
    }
  }
  
  private calculateRiskLevel(user: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // High login attempts
    if (user.loginAttempts > 3) riskScore += 20;
    
    // Account locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) riskScore += 30;
    
    // Unverified email
    if (!user.emailVerified) riskScore += 10;
    
    // No recent activity
    if (!user.lastLoginAt) {
      riskScore += 15;
    } else {
      const daysSinceLogin = (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLogin > 90) riskScore += 10;
    }
    
    if (riskScore >= 40) return 'high';
    if (riskScore >= 20) return 'medium';
    return 'low';
  }
  
  private calculateApprovalPriority(supplier: any): 'low' | 'medium' | 'high' {
    let priorityScore = 0;
    
    // Business age
    if (supplier.yearEstablished) {
      const businessAge = new Date().getFullYear() - supplier.yearEstablished;
      if (businessAge >= 10) priorityScore += 10;
      else if (businessAge >= 5) priorityScore += 5;
    }
    
    // Has verification documents
    if (supplier.verificationDocs && supplier.verificationDocs.length > 0) {
      priorityScore += 15;
    }
    
    // Application age
    const applicationAge = (Date.now() - new Date(supplier.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (applicationAge > 7) priorityScore += 10;
    else if (applicationAge > 3) priorityScore += 5;
    
    if (priorityScore >= 25) return 'high';
    if (priorityScore >= 15) return 'medium';
    return 'low';
  }
  
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
  
  private async logAdminActivity(
    adminId: string,
    action: string,
    description: string,
    entityType: string,
    entityId?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const auditLogData: InsertAuthenticationAuditLog = {
        userId: adminId,
        userRole: 'admin',
        action,
        ipAddress: ipAddress || 'unknown',
        success: true,
        metadata: {
          description,
          entityType,
          entityId
        }
      };
      
      await db.insert(authenticationAuditLogs).values(auditLogData);
    } catch (error) {
      console.error('Error logging admin activity:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }
  
  // Email notification methods (to be implemented with actual email service)
  
  private async sendSupplierApprovalNotification(
    email: string,
    name: string,
    businessName: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<void> {
    // TODO: Implement email service integration
    console.log(`Supplier ${action} notification for ${name} (${email}): ${businessName}${reason ? ` - ${reason}` : ''}`);
  }
  
  private async sendUserSuspensionNotification(
    email: string,
    name: string,
    action: 'suspend' | 'reactivate',
    reason: string,
    suspensionEnd?: Date | null
  ): Promise<void> {
    // TODO: Implement email service integration
    console.log(`User ${action} notification for ${name} (${email}): ${reason}${suspensionEnd ? ` until ${suspensionEnd}` : ''}`);
  }
  
  private async sendPasswordResetNotification(
    email: string,
    name: string,
    temporaryPassword: string,
    requirePasswordChange: boolean
  ): Promise<void> {
    // TODO: Implement email service integration
    console.log(`Password reset notification for ${name} (${email}): ${temporaryPassword} (Change required: ${requirePasswordChange})`);
  }
}

export const enhancedAdminUserManagementService = new EnhancedAdminUserManagementService();