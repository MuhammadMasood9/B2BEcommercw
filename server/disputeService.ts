import { eq, and, or, desc, asc, ilike, count, isNull, ne } from "drizzle-orm";
import { db } from "./db";
import { 
  disputes,
  disputeMessages,
  orders,
  buyers,
  supplierProfiles,
  users,
  InsertDispute,
  InsertDisputeMessage,
  Dispute
} from "@shared/schema";

export class DisputeService {
  /**
   * Create a new dispute
   */
  async createDispute(disputeData: InsertDispute): Promise<Dispute> {
    try {
      // Validate that the order exists and user is involved
      const orderResult = await db
        .select({
          order: orders,
          buyer: buyers,
          supplier: supplierProfiles
        })
        .from(orders)
        .leftJoin(buyers, eq(orders.buyerId, buyers.id))
        .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
        .where(eq(orders.id, disputeData.orderId))
        .limit(1);

      if (orderResult.length === 0) {
        throw new Error("Order not found");
      }

      // Check if dispute already exists for this order
      const existingDispute = await db
        .select({ id: disputes.id })
        .from(disputes)
        .where(and(
          eq(disputes.orderId, disputeData.orderId),
          or(
            eq(disputes.status, 'open'),
            eq(disputes.status, 'under_review'),
            eq(disputes.status, 'mediation')
          )
        ))
        .limit(1);

      if (existingDispute.length > 0) {
        throw new Error("An active dispute already exists for this order");
      }

      const [newDispute] = await db.insert(disputes).values({
        ...disputeData,
        status: 'open',
        priority: disputeData.priority || 'medium',
        escalationLevel: 0
      }).returning();

      return newDispute;
    } catch (error) {
      console.error("Error creating dispute:", error);
      throw error;
    }
  }

  /**
   * Get dispute by ID with related data
   */
  async getDisputeById(disputeId: string): Promise<any> {
    try {
      const result = await db
        .select({
          dispute: disputes,
          order: orders,
          buyer: {
            id: buyers.id,
            companyName: buyers.companyName,
            industry: buyers.industry,
            businessType: buyers.businessType
          },
          supplier: {
            id: supplierProfiles.id,
            businessName: supplierProfiles.businessName,
            storeName: supplierProfiles.storeName,
            contactPerson: supplierProfiles.contactPerson,
            phone: supplierProfiles.phone
          },
          mediator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(disputes)
        .leftJoin(orders, eq(disputes.orderId, orders.id))
        .leftJoin(buyers, eq(disputes.buyerId, buyers.id))
        .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.id))
        .leftJoin(users, eq(disputes.assignedMediator, users.id))
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (result.length === 0) {
        throw new Error("Dispute not found");
      }

      return {
        ...result[0].dispute,
        order: result[0].order,
        buyer: result[0].buyer,
        supplier: result[0].supplier,
        mediator: result[0].mediator
      };
    } catch (error) {
      console.error("Error fetching dispute:", error);
      throw error;
    }
  }

  /**
   * Get disputes with filtering and pagination
   */
  async getDisputes(filters: {
    status?: string;
    type?: string;
    priority?: string;
    buyerId?: string;
    supplierId?: string;
    assignedMediator?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ disputes: any[]; total: number }> {
    try {
      const {
        status,
        type,
        priority,
        buyerId,
        supplierId,
        assignedMediator,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        limit = 20,
        offset = 0
      } = filters;

      let query = db
        .select({
          dispute: disputes,
          order: {
            id: orders.id,
            orderNumber: orders.orderNumber,
            totalAmount: orders.totalAmount
          },
          buyer: {
            id: buyers.id,
            companyName: buyers.companyName
          },
          supplier: {
            id: supplierProfiles.id,
            businessName: supplierProfiles.businessName,
            storeName: supplierProfiles.storeName
          },
          mediator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName
          }
        })
        .from(disputes)
        .leftJoin(orders, eq(disputes.orderId, orders.id))
        .leftJoin(buyers, eq(disputes.buyerId, buyers.id))
        .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.id))
        .leftJoin(users, eq(disputes.assignedMediator, users.id));

      const conditions = [];

      // Apply filters
      if (status) conditions.push(eq(disputes.status, status));
      if (type) conditions.push(eq(disputes.type, type));
      if (priority) conditions.push(eq(disputes.priority, priority));
      if (buyerId) conditions.push(eq(disputes.buyerId, buyerId));
      if (supplierId) conditions.push(eq(disputes.supplierId, supplierId));
      if (assignedMediator) conditions.push(eq(disputes.assignedMediator, assignedMediator));

      // Search filter
      if (search) {
        conditions.push(
          or(
            ilike(disputes.title, `%${search}%`),
            ilike(disputes.description, `%${search}%`),
            ilike(orders.orderNumber, `%${search}%`),
            ilike(buyers.companyName, `%${search}%`),
            ilike(supplierProfiles.businessName, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      // Apply sorting
      const sortColumn = sortBy === 'type' ? disputes.type :
                        sortBy === 'status' ? disputes.status :
                        sortBy === 'priority' ? disputes.priority :
                        sortBy === 'resolvedAt' ? disputes.resolvedAt :
                        disputes.createdAt;

      if (sortOrder === 'asc') {
        query = query.orderBy(asc(sortColumn)) as any;
      } else {
        query = query.orderBy(desc(sortColumn)) as any;
      }

      query = query.limit(limit).offset(offset) as any;

      const result = await query;

      // Get total count
      let countQuery = db.select({ count: count() })
        .from(disputes)
        .leftJoin(orders, eq(disputes.orderId, orders.id))
        .leftJoin(buyers, eq(disputes.buyerId, buyers.id))
        .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.id));

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as any;
      }

      const [{ count: totalCount }] = await countQuery;

      const formattedDisputes = result.map(row => ({
        ...row.dispute,
        order: row.order,
        buyer: row.buyer,
        supplier: row.supplier,
        mediator: row.mediator
      }));

      return {
        disputes: formattedDisputes,
        total: totalCount
      };
    } catch (error) {
      console.error("Error fetching disputes:", error);
      throw error;
    }
  }

  /**
   * Update dispute status
   */
  async updateDisputeStatus(disputeId: string, status: string, mediatorId?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      } else if (status === 'closed') {
        updateData.closedAt = new Date();
      }

      if (mediatorId) {
        updateData.assignedMediator = mediatorId;
      }

      await db
        .update(disputes)
        .set(updateData)
        .where(eq(disputes.id, disputeId));
    } catch (error) {
      console.error("Error updating dispute status:", error);
      throw error;
    }
  }

  /**
   * Assign mediator to dispute
   */
  async assignMediator(disputeId: string, mediatorId: string): Promise<void> {
    try {
      await db
        .update(disputes)
        .set({
          assignedMediator: mediatorId,
          status: 'under_review',
          updatedAt: new Date()
        })
        .where(eq(disputes.id, disputeId));
    } catch (error) {
      console.error("Error assigning mediator:", error);
      throw error;
    }
  }

  /**
   * Escalate dispute
   */
  async escalateDispute(disputeId: string, reason: string, escalatedBy: string): Promise<void> {
    try {
      const dispute = await db
        .select({ escalationLevel: disputes.escalationLevel })
        .from(disputes)
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (dispute.length === 0) {
        throw new Error("Dispute not found");
      }

      const newEscalationLevel = (dispute[0].escalationLevel || 0) + 1;

      await db
        .update(disputes)
        .set({
          escalationLevel: newEscalationLevel,
          escalatedAt: new Date(),
          escalationReason: reason,
          status: 'mediation',
          updatedAt: new Date()
        })
        .where(eq(disputes.id, disputeId));
    } catch (error) {
      console.error("Error escalating dispute:", error);
      throw error;
    }
  }

  /**
   * Add message to dispute
   */
  async addDisputeMessage(messageData: InsertDisputeMessage): Promise<void> {
    try {
      await db.insert(disputeMessages).values(messageData);
    } catch (error) {
      console.error("Error adding dispute message:", error);
      throw error;
    }
  }

  /**
   * Get dispute messages
   */
  async getDisputeMessages(disputeId: string): Promise<any[]> {
    try {
      const result = await db
        .select({
          message: disputeMessages,
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(disputeMessages)
        .leftJoin(users, eq(disputeMessages.senderId, users.id))
        .where(eq(disputeMessages.disputeId, disputeId))
        .orderBy(asc(disputeMessages.createdAt));

      return result.map(row => ({
        ...row.message,
        sender: row.sender
      }));
    } catch (error) {
      console.error("Error fetching dispute messages:", error);
      throw error;
    }
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStatistics(): Promise<any> {
    try {
      const stats = await db
        .select({
          status: disputes.status,
          count: count()
        })
        .from(disputes)
        .groupBy(disputes.status);

      const typeStats = await db
        .select({
          type: disputes.type,
          count: count()
        })
        .from(disputes)
        .groupBy(disputes.type);

      const priorityStats = await db
        .select({
          priority: disputes.priority,
          count: count()
        })
        .from(disputes)
        .groupBy(disputes.priority);

      return {
        byStatus: stats,
        byType: typeStats,
        byPriority: priorityStats
      };
    } catch (error) {
      console.error("Error fetching dispute statistics:", error);
      throw error;
    }
  }
}

export const disputeService = new DisputeService();