import { db } from './db';
import { 
  adminRoles, 
  adminUsers, 
  adminSessions, 
  adminActivityLogs, 
  permissionResources, 
  securityAuditEvents,
  accessPatternAnalysis,
  users,
  InsertAdminRole,
  InsertAdminUser,
  InsertAdminActivityLog,
  InsertSecurityAuditEvent,
  AdminRole,
  AdminUser
} from '@shared/schema';
import { eq, and, desc, gte, sql, or, like, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface RoleManagementRequest {
  action: 'create' | 'update' | 'delete' | 'assign' | 'revoke';
  roleData?: {
    name?: string;
    displayName?: string;
    description?: string;
    level?: number;
    parentRoleId?: string;
    permissions?: Record<string, any>;
    resourcePermissions?: Record<string, string[]>;
  };
  userId?: string;
  roleId?: string;
  adminUserId?: string;
}

export interface PermissionValidationRequest {
  adminUserId: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface SecurityAuditRequest {
  adminUserId?: string;
  eventType?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AdminAccessControlService {
  
  // ==================== ROLE MANAGEMENT ====================
  
  async createRole(roleData: InsertAdminRole, createdBy: string): Promise<AdminRole> {
    try {
      // Validate role name uniqueness
      const existingRole = await db.select()
        .from(adminRoles)
        .where(eq(adminRoles.name, roleData.name))
        .limit(1);
      
      if (existingRole.length > 0) {
        throw new Error(`Role with name '${roleData.name}' already exists`);
      }
      
      // Create the role
      const [newRole] = await db.insert(adminRoles)
        .values({
          ...roleData,
          createdBy,
          updatedBy: createdBy,
        })
        .returning();
      
      // Log the action
      await this.logAdminActivity({
        adminUserId: createdBy,
        action: 'create_role',
        description: `Created new admin role: ${roleData.displayName}`,
        category: 'system_configuration',
        entityType: 'admin_role',
        entityId: newRole.id,
        entityName: roleData.displayName,
        newValue: roleData,
        riskLevel: 'medium',
      });
      
      return newRole;
    } catch (error) {
      throw new Error(`Failed to create role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async updateRole(roleId: string, updates: Partial<InsertAdminRole>, updatedBy: string): Promise<AdminRole> {
    try {
      // Get existing role
      const existingRole = await db.select()
        .from(adminRoles)
        .where(eq(adminRoles.id, roleId))
        .limit(1);
      
      if (existingRole.length === 0) {
        throw new Error('Role not found');
      }
      
      if (existingRole[0].isSystemRole && (updates.name || updates.level)) {
        throw new Error('Cannot modify name or level of system roles');
      }
      
      // Update the role
      const [updatedRole] = await db.update(adminRoles)
        .set({
          ...updates,
          updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(adminRoles.id, roleId))
        .returning();
      
      // Log the action
      await this.logAdminActivity({
        adminUserId: updatedBy,
        action: 'update_role',
        description: `Updated admin role: ${updatedRole.displayName}`,
        category: 'system_configuration',
        entityType: 'admin_role',
        entityId: roleId,
        entityName: updatedRole.displayName,
        previousValue: existingRole[0],
        newValue: updatedRole,
        riskLevel: 'medium',
      });
      
      return updatedRole;
    } catch (error) {
      throw new Error(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    try {
      // Get existing role
      const existingRole = await db.select()
        .from(adminRoles)
        .where(eq(adminRoles.id, roleId))
        .limit(1);
      
      if (existingRole.length === 0) {
        throw new Error('Role not found');
      }
      
      if (existingRole[0].isSystemRole) {
        throw new Error('Cannot delete system roles');
      }
      
      // Check if role is assigned to any users
      const assignedUsers = await db.select()
        .from(adminUsers)
        .where(eq(adminUsers.roleId, roleId))
        .limit(1);
      
      if (assignedUsers.length > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }
      
      // Delete the role
      await db.delete(adminRoles)
        .where(eq(adminRoles.id, roleId));
      
      // Log the action
      await this.logAdminActivity({
        adminUserId: deletedBy,
        action: 'delete_role',
        description: `Deleted admin role: ${existingRole[0].displayName}`,
        category: 'system_configuration',
        entityType: 'admin_role',
        entityId: roleId,
        entityName: existingRole[0].displayName,
        previousValue: existingRole[0],
        riskLevel: 'high',
      });
    } catch (error) {
      throw new Error(`Failed to delete role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getAllRoles(): Promise<AdminRole[]> {
    return await db.select()
      .from(adminRoles)
      .where(eq(adminRoles.isActive, true))
      .orderBy(desc(adminRoles.level), adminRoles.displayName);
  }
  
  async getRoleById(roleId: string): Promise<AdminRole | null> {
    const roles = await db.select()
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId))
      .limit(1);
    
    return roles.length > 0 ? roles[0] : null;
  }
  
  // ==================== USER MANAGEMENT ====================
  
  async createAdminUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    roleId: string;
    requireMfa?: boolean;
    sessionTimeoutMinutes?: number;
  }, createdBy: string): Promise<{ user: any; adminUser: AdminUser }> {
    try {
      return await db.transaction(async (tx) => {
        // Check if user already exists
        const existingUser = await tx.select()
          .from(users)
          .where(eq(users.email, userData.email))
          .limit(1);
        
        if (existingUser.length > 0) {
          throw new Error('User with this email already exists');
        }
        
        // Validate role exists
        const role = await tx.select()
          .from(adminRoles)
          .where(eq(adminRoles.id, userData.roleId))
          .limit(1);
        
        if (role.length === 0) {
          throw new Error('Invalid role specified');
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Create user
        const [newUser] = await tx.insert(users)
          .values({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
            role: 'admin',
            emailVerified: true,
            isActive: true,
          })
          .returning();
        
        // Create admin user record
        const [newAdminUser] = await tx.insert(adminUsers)
          .values({
            userId: newUser.id,
            roleId: userData.roleId,
            requireMfa: userData.requireMfa || false,
            sessionTimeoutMinutes: userData.sessionTimeoutMinutes || 480,
            createdBy,
            updatedBy: createdBy,
          })
          .returning();
        
        // Log the action
        await this.logAdminActivity({
          adminUserId: createdBy,
          action: 'create_admin_user',
          description: `Created new admin user: ${userData.email}`,
          category: 'system_configuration',
          entityType: 'admin_user',
          entityId: newAdminUser.id,
          entityName: userData.email,
          newValue: { email: userData.email, role: role[0].displayName },
          riskLevel: 'high',
        });
        
        return { user: newUser, adminUser: newAdminUser };
      });
    } catch (error) {
      throw new Error(`Failed to create admin user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async assignRole(adminUserId: string, roleId: string, assignedBy: string): Promise<AdminUser> {
    try {
      // Validate role exists
      const role = await db.select()
        .from(adminRoles)
        .where(eq(adminRoles.id, roleId))
        .limit(1);
      
      if (role.length === 0) {
        throw new Error('Invalid role specified');
      }
      
      // Get existing admin user
      const existingAdminUser = await db.select()
        .from(adminUsers)
        .where(eq(adminUsers.id, adminUserId))
        .limit(1);
      
      if (existingAdminUser.length === 0) {
        throw new Error('Admin user not found');
      }
      
      // Update role assignment
      const [updatedAdminUser] = await db.update(adminUsers)
        .set({
          roleId,
          updatedBy: assignedBy,
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.id, adminUserId))
        .returning();
      
      // Log the action
      await this.logAdminActivity({
        adminUserId: assignedBy,
        action: 'assign_role',
        description: `Assigned role ${role[0].displayName} to admin user`,
        category: 'system_configuration',
        entityType: 'admin_user',
        entityId: adminUserId,
        previousValue: { roleId: existingAdminUser[0].roleId },
        newValue: { roleId },
        riskLevel: 'medium',
      });
      
      return updatedAdminUser;
    } catch (error) {
      throw new Error(`Failed to assign role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getAllAdminUsers(): Promise<any[]> {
    return await db.select({
      id: adminUsers.id,
      userId: adminUsers.userId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      roleId: adminUsers.roleId,
      roleName: adminRoles.displayName,
      isActive: adminUsers.isActive,
      isLocked: adminUsers.isLocked,
      lastLogin: adminUsers.lastLogin,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .innerJoin(users, eq(adminUsers.userId, users.id))
    .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
    .orderBy(desc(adminUsers.createdAt));
  }
  
  // ==================== PERMISSION VALIDATION ====================
  
  async validatePermission(request: PermissionValidationRequest): Promise<boolean> {
    try {
      // Get admin user with role
      const adminUserData = await db.select({
        adminUser: adminUsers,
        role: adminRoles,
      })
      .from(adminUsers)
      .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
      .where(and(
        eq(adminUsers.id, request.adminUserId),
        eq(adminUsers.isActive, true),
        eq(adminUsers.isLocked, false)
      ))
      .limit(1);
      
      if (adminUserData.length === 0) {
        return false;
      }
      
      const { adminUser, role } = adminUserData[0];
      
      // Check if role has all permissions
      if (role.permissions && typeof role.permissions === 'object' && (role.permissions as any).all === true) {
        return true;
      }
      
      // Check resource-specific permissions
      const roleResourcePermissions = role.resourcePermissions as Record<string, string[]> || {};
      const resourcePermissions = roleResourcePermissions[request.resource] || [];
      const wildcardPermissions = roleResourcePermissions['*'] || [];
      
      // Check if action is allowed
      const hasPermission = resourcePermissions.includes(request.action) || 
                           wildcardPermissions.includes(request.action);
      
      // Check user-specific overrides
      if (!hasPermission && adminUser.additionalPermissions) {
        const userAdditionalPermissions = adminUser.additionalPermissions as Record<string, string[]> || {};
        const userResourcePermissions = userAdditionalPermissions[request.resource] || [];
        return userResourcePermissions.includes(request.action);
      }
      
      return hasPermission;
    } catch (error) {
      console.error('Permission validation error:', error);
      return false;
    }
  }
  
  // ==================== ACTIVITY LOGGING ====================
  
  async logAdminActivity(activityData: Partial<InsertAdminActivityLog>): Promise<void> {
    try {
      await db.insert(adminActivityLogs)
        .values({
          adminUserId: activityData.adminUserId!,
          sessionId: activityData.sessionId,
          action: activityData.action!,
          description: activityData.description!,
          category: activityData.category!,
          entityType: activityData.entityType,
          entityId: activityData.entityId,
          entityName: activityData.entityName,
          previousValue: activityData.previousValue,
          newValue: activityData.newValue,
          ipAddress: activityData.ipAddress,
          userAgent: activityData.userAgent,
          requestMethod: activityData.requestMethod,
          requestPath: activityData.requestPath,
          requestParams: activityData.requestParams,
          riskLevel: activityData.riskLevel || 'low',
          securityFlags: activityData.securityFlags || [],
        });
    } catch (error) {
      console.error('Failed to log admin activity:', error);
    }
  }
  
  async getAdminActivityLogs(adminUserId?: string, limit = 100, offset = 0): Promise<any[]> {
    const baseQuery = db.select({
      id: adminActivityLogs.id,
      adminUserId: adminActivityLogs.adminUserId,
      adminName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      adminEmail: users.email,
      action: adminActivityLogs.action,
      description: adminActivityLogs.description,
      category: adminActivityLogs.category,
      entityType: adminActivityLogs.entityType,
      entityId: adminActivityLogs.entityId,
      entityName: adminActivityLogs.entityName,
      riskLevel: adminActivityLogs.riskLevel,
      ipAddress: adminActivityLogs.ipAddress,
      createdAt: adminActivityLogs.createdAt,
    })
    .from(adminActivityLogs)
    .innerJoin(adminUsers, eq(adminActivityLogs.adminUserId, adminUsers.id))
    .innerJoin(users, eq(adminUsers.userId, users.id));
    
    if (adminUserId) {
      return await baseQuery
        .where(eq(adminActivityLogs.adminUserId, adminUserId))
        .orderBy(desc(adminActivityLogs.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await baseQuery
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  // ==================== SECURITY AUDIT ====================
  
  async createSecurityAuditEvent(eventData: InsertSecurityAuditEvent): Promise<void> {
    try {
      await db.insert(securityAuditEvents)
        .values(eventData);
    } catch (error) {
      console.error('Failed to create security audit event:', error);
    }
  }
  
  async getSecurityAuditEvents(request: SecurityAuditRequest): Promise<any[]> {
    const baseQuery = db.select()
      .from(securityAuditEvents);
    
    const conditions = [];
    
    if (request.adminUserId) {
      conditions.push(eq(securityAuditEvents.adminUserId, request.adminUserId));
    }
    
    if (request.eventType) {
      conditions.push(eq(securityAuditEvents.eventType, request.eventType));
    }
    
    if (request.severity) {
      conditions.push(eq(securityAuditEvents.severity, request.severity));
    }
    
    if (request.startDate) {
      conditions.push(gte(securityAuditEvents.createdAt, request.startDate));
    }
    
    if (conditions.length > 0) {
      return await baseQuery
        .where(and(...conditions))
        .orderBy(desc(securityAuditEvents.createdAt))
        .limit(request.limit || 100)
        .offset(request.offset || 0);
    }
    
    return await baseQuery
      .orderBy(desc(securityAuditEvents.createdAt))
      .limit(request.limit || 100)
      .offset(request.offset || 0);
  }
  
  // ==================== PERMISSION RESOURCES ====================
  
  async getAllPermissionResources(): Promise<any[]> {
    return await db.select()
      .from(permissionResources)
      .orderBy(permissionResources.resourcePath);
  }
  
  // ==================== ROLE HIERARCHY ====================
  
  async getRoleHierarchy(): Promise<any[]> {
    const roles = await db.select()
      .from(adminRoles)
      .where(eq(adminRoles.isActive, true))
      .orderBy(desc(adminRoles.level));
    
    // Build hierarchy tree
    const roleMap = new Map<string, any>();
    const rootRoles: any[] = [];
    
    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] });
    });
    
    roles.forEach(role => {
      if (role.parentRoleId && roleMap.has(role.parentRoleId)) {
        roleMap.get(role.parentRoleId).children.push(roleMap.get(role.id));
      } else {
        rootRoles.push(roleMap.get(role.id));
      }
    });
    
    return rootRoles;
  }
}

export const adminAccessControlService = new AdminAccessControlService();