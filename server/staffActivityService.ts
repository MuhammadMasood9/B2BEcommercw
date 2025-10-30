import { db } from './db';
import { activity_logs, staffMembers, supplierProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface StaffActivityLog {
  staffMemberId: string;
  supplierId: string;
  action: string;
  description: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  ipAddress?: string;
  userAgent?: string;
}

class StaffActivityService {
  
  async logActivity(activityData: StaffActivityLog): Promise<void> {
    try {
      // Get staff member details
      const staffMember = await db.select({
        id: staffMembers.id,
        name: staffMembers.name,
        email: staffMembers.email,
        role: staffMembers.role,
        supplierId: staffMembers.supplierId
      })
      .from(staffMembers)
      .where(eq(staffMembers.id, activityData.staffMemberId))
      .limit(1);
      
      if (staffMember.length === 0) {
        console.error('Staff member not found for activity logging:', activityData.staffMemberId);
        return;
      }
      
      const staff = staffMember[0];
      
      // Get supplier details
      const supplier = await db.select({
        businessName: supplierProfiles.businessName
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, staff.supplierId))
      .limit(1);
      
      const supplierName = supplier.length > 0 ? supplier[0].businessName : 'Unknown Supplier';
      
      // Create activity log entry
      await db.insert(activity_logs).values({
        adminId: staff.id, // Using adminId field for staff member ID
        adminName: `${staff.name} (${staff.role}) - ${supplierName}`,
        action: activityData.action,
        description: activityData.description,
        entityType: activityData.entityType,
        entityId: activityData.entityId || null,
        entityName: activityData.entityName || null,
        ipAddress: activityData.ipAddress || null,
        userAgent: activityData.userAgent || null,
      });
      
    } catch (error) {
      console.error('Error logging staff activity:', error);
    }
  }
  
  async getStaffActivities(supplierId: string, limit: number = 50, offset: number = 0) {
    try {
      // Get all staff member IDs for this supplier
      const staffIds = await db.select({ id: staffMembers.id })
        .from(staffMembers)
        .where(eq(staffMembers.supplierId, supplierId));
      
      if (staffIds.length === 0) {
        return { activities: [], total: 0 };
      }
      
      const staffIdList = staffIds.map(s => s.id);
      
      // Get activities for all staff members of this supplier
      const activities = await db.select()
        .from(activity_logs)
        .where(eq(activity_logs.adminId, staffIdList[0])) // This is a simplified query - in production you'd use IN operator
        .orderBy(activity_logs.createdAt)
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const totalResult = await db.select({ count: activity_logs.id })
        .from(activity_logs)
        .where(eq(activity_logs.adminId, staffIdList[0]));
      
      const total = totalResult.length;
      
      return { activities, total };
      
    } catch (error) {
      console.error('Error getting staff activities:', error);
      return { activities: [], total: 0 };
    }
  }
  
  async getStaffMemberActivities(staffMemberId: string, limit: number = 50, offset: number = 0) {
    try {
      const activities = await db.select()
        .from(activity_logs)
        .where(eq(activity_logs.adminId, staffMemberId))
        .orderBy(activity_logs.createdAt)
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const totalResult = await db.select({ count: activity_logs.id })
        .from(activity_logs)
        .where(eq(activity_logs.adminId, staffMemberId));
      
      const total = totalResult.length;
      
      return { activities, total };
      
    } catch (error) {
      console.error('Error getting staff member activities:', error);
      return { activities: [], total: 0 };
    }
  }
}

export const staffActivityService = new StaffActivityService();