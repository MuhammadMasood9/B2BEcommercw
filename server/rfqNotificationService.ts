import { db } from "./db";
import { 
  rfqs, 
  quotations, 
  notifications, 
  users, 
  buyers, 
  supplierProfiles,
  Rfq,
  Quotation
} from "@shared/schema";
import { eq, and, or, lte, gte, isNull, sql } from "drizzle-orm";
import { rfqMatchingService } from "./rfqMatchingService";

interface NotificationData {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}

class RFQNotificationService {
  /**
   * Send notification when new RFQ is created
   */
  async notifyRFQCreated(rfqId: string): Promise<void> {
    try {
      // Get RFQ details
      const rfqResult = await db
        .select({
          rfq: rfqs,
          buyer: buyers,
          user: users
        })
        .from(rfqs)
        .innerJoin(buyers, eq(rfqs.buyerId, buyers.id))
        .innerJoin(users, eq(buyers.userId, users.id))
        .where(eq(rfqs.id, rfqId))
        .limit(1);

      if (rfqResult.length === 0) {
        throw new Error('RFQ not found');
      }

      const { rfq, buyer, user } = rfqResult[0];

      // Notify buyer about successful creation
      await this.createNotification({
        userId: user.id,
        type: 'success',
        title: 'RFQ Created Successfully',
        message: `Your RFQ "${rfq.title}" has been published and is now visible to suppliers.`,
        relatedId: rfqId,
        relatedType: 'rfq'
      });

      // Notify relevant suppliers (async)
      this.notifyRelevantSuppliersAsync(rfqId);

    } catch (error) {
      console.error('Error notifying RFQ created:', error);
    }
  }

  /**
   * Send notification when new quotation is received
   */
  async notifyQuotationReceived(quotationId: string): Promise<void> {
    try {
      // Get quotation and RFQ details
      const result = await db
        .select({
          quotation: quotations,
          rfq: rfqs,
          buyer: buyers,
          buyerUser: users,
          supplier: supplierProfiles
        })
        .from(quotations)
        .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
        .innerJoin(buyers, eq(rfqs.buyerId, buyers.id))
        .innerJoin(users, eq(buyers.userId, users.id))
        .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
        .where(eq(quotations.id, quotationId))
        .limit(1);

      if (result.length === 0) {
        throw new Error('Quotation not found');
      }

      const { quotation, rfq, buyerUser, supplier } = result[0];

      // Notify buyer about new quotation
      await this.createNotification({
        userId: buyerUser.id,
        type: 'info',
        title: 'New Quotation Received',
        message: `You received a new quotation for "${rfq.title}" from ${supplier?.businessName || 'a supplier'}.`,
        relatedId: quotationId,
        relatedType: 'quotation'
      });

      // Check if this is the first quotation for this RFQ
      const quotationCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(quotations)
        .where(eq(quotations.rfqId, rfq.id));

      if (quotationCount[0]?.count === 1) {
        await this.createNotification({
          userId: buyerUser.id,
          type: 'success',
          title: 'First Quotation Received!',
          message: `Congratulations! You received your first quotation for "${rfq.title}". More suppliers may submit quotes before the deadline.`,
          relatedId: rfq.id,
          relatedType: 'rfq'
        });
      }

    } catch (error) {
      console.error('Error notifying quotation received:', error);
    }
  }

  /**
   * Send notification when quotation is accepted
   */
  async notifyQuotationAccepted(quotationId: string): Promise<void> {
    try {
      // Get quotation details
      const result = await db
        .select({
          quotation: quotations,
          rfq: rfqs,
          supplier: supplierProfiles,
          supplierUser: users
        })
        .from(quotations)
        .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
        .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
        .leftJoin(users, eq(supplierProfiles.userId, users.id))
        .where(eq(quotations.id, quotationId))
        .limit(1);

      if (result.length === 0) {
        throw new Error('Quotation not found');
      }

      const { quotation, rfq, supplierUser } = result[0];

      // Notify supplier about acceptance
      if (supplierUser) {
        await this.createNotification({
          userId: supplierUser.id,
          type: 'success',
          title: 'Quotation Accepted!',
          message: `Congratulations! Your quotation for "${rfq.title}" has been accepted. An order will be created shortly.`,
          relatedId: quotationId,
          relatedType: 'quotation'
        });
      }

      // Notify other suppliers about RFQ closure
      await this.notifyRFQClosed(rfq.id, quotationId);

    } catch (error) {
      console.error('Error notifying quotation accepted:', error);
    }
  }

  /**
   * Send notification when quotation is rejected
   */
  async notifyQuotationRejected(quotationId: string, reason?: string): Promise<void> {
    try {
      // Get quotation details
      const result = await db
        .select({
          quotation: quotations,
          rfq: rfqs,
          supplier: supplierProfiles,
          supplierUser: users
        })
        .from(quotations)
        .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
        .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
        .leftJoin(users, eq(supplierProfiles.userId, users.id))
        .where(eq(quotations.id, quotationId))
        .limit(1);

      if (result.length === 0) {
        throw new Error('Quotation not found');
      }

      const { quotation, rfq, supplierUser } = result[0];

      // Notify supplier about rejection
      if (supplierUser) {
        const message = reason 
          ? `Your quotation for "${rfq.title}" was not selected. Reason: ${reason}`
          : `Your quotation for "${rfq.title}" was not selected. Thank you for your participation.`;

        await this.createNotification({
          userId: supplierUser.id,
          type: 'info',
          title: 'Quotation Not Selected',
          message,
          relatedId: quotationId,
          relatedType: 'quotation'
        });
      }

    } catch (error) {
      console.error('Error notifying quotation rejected:', error);
    }
  }

  /**
   * Send notification when RFQ is about to expire
   */
  async notifyRFQExpiringSoon(): Promise<void> {
    try {
      // Find RFQs expiring in the next 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const expiringRfqs = await db
        .select({
          rfq: rfqs,
          buyer: buyers,
          user: users,
          quotationCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${quotations} 
            WHERE ${quotations.rfqId} = ${rfqs.id}
          )`
        })
        .from(rfqs)
        .innerJoin(buyers, eq(rfqs.buyerId, buyers.id))
        .innerJoin(users, eq(buyers.userId, users.id))
        .where(and(
          eq(rfqs.status, 'open'),
          gte(rfqs.expiresAt, new Date()),
          lte(rfqs.expiresAt, tomorrow)
        ));

      for (const { rfq, user, quotationCount } of expiringRfqs) {
        const message = quotationCount > 0
          ? `Your RFQ "${rfq.title}" expires tomorrow. You have ${quotationCount} quotation${quotationCount !== 1 ? 's' : ''} to review.`
          : `Your RFQ "${rfq.title}" expires tomorrow. No quotations have been received yet.`;

        await this.createNotification({
          userId: user.id,
          type: 'warning',
          title: 'RFQ Expiring Soon',
          message,
          relatedId: rfq.id,
          relatedType: 'rfq'
        });
      }

    } catch (error) {
      console.error('Error notifying RFQ expiring soon:', error);
    }
  }

  /**
   * Send notification when RFQ expires
   */
  async notifyRFQExpired(): Promise<void> {
    try {
      // Find RFQs that have expired
      const expiredRfqs = await db
        .select({
          rfq: rfqs,
          buyer: buyers,
          user: users,
          quotationCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${quotations} 
            WHERE ${quotations.rfqId} = ${rfqs.id}
          )`
        })
        .from(rfqs)
        .innerJoin(buyers, eq(rfqs.buyerId, buyers.id))
        .innerJoin(users, eq(buyers.userId, users.id))
        .where(and(
          eq(rfqs.status, 'open'),
          lte(rfqs.expiresAt, new Date())
        ));

      for (const { rfq, user, quotationCount } of expiredRfqs) {
        // Update RFQ status to expired
        await db
          .update(rfqs)
          .set({ 
            status: 'expired',
            updatedAt: new Date()
          })
          .where(eq(rfqs.id, rfq.id));

        // Notify buyer
        const message = quotationCount > 0
          ? `Your RFQ "${rfq.title}" has expired. You received ${quotationCount} quotation${quotationCount !== 1 ? 's' : ''}. You can still review and accept them.`
          : `Your RFQ "${rfq.title}" has expired without receiving any quotations. Consider creating a new RFQ with adjusted requirements.`;

        await this.createNotification({
          userId: user.id,
          type: 'warning',
          title: 'RFQ Expired',
          message,
          relatedId: rfq.id,
          relatedType: 'rfq'
        });

        // Notify suppliers with pending quotations
        if (quotationCount > 0) {
          await this.notifySupplierRFQExpired(rfq.id);
        }
      }

    } catch (error) {
      console.error('Error notifying RFQ expired:', error);
    }
  }

  /**
   * Send weekly RFQ summary to buyers
   */
  async sendWeeklyRFQSummary(): Promise<void> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get buyers with RFQ activity in the past week
      const buyersWithActivity = await db
        .select({
          buyer: buyers,
          user: users,
          activeRfqs: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${rfqs} 
            WHERE ${rfqs.buyerId} = ${buyers.id} 
            AND ${rfqs.status} = 'open'
          )`,
          newQuotations: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${quotations} q
            INNER JOIN ${rfqs} r ON q.rfq_id = r.id
            WHERE r.buyer_id = ${buyers.id} 
            AND q.created_at >= ${oneWeekAgo}
          )`,
          expiringSoon: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${rfqs} 
            WHERE ${rfqs.buyerId} = ${buyers.id} 
            AND ${rfqs.status} = 'open'
            AND ${rfqs.expiresAt} <= ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
          )`
        })
        .from(buyers)
        .innerJoin(users, eq(buyers.userId, users.id))
        .where(
          or(
            sql`EXISTS (
              SELECT 1 FROM ${rfqs} 
              WHERE ${rfqs.buyerId} = ${buyers.id} 
              AND ${rfqs.status} = 'open'
            )`,
            sql`EXISTS (
              SELECT 1 FROM ${quotations} q
              INNER JOIN ${rfqs} r ON q.rfq_id = r.id
              WHERE r.buyer_id = ${buyers.id} 
              AND q.created_at >= ${oneWeekAgo}
            )`
          )
        );

      for (const { user, activeRfqs, newQuotations, expiringSoon } of buyersWithActivity) {
        if (activeRfqs > 0 || newQuotations > 0) {
          let message = 'Your weekly RFQ summary:\n';
          
          if (activeRfqs > 0) {
            message += `• ${activeRfqs} active RFQ${activeRfqs !== 1 ? 's' : ''}\n`;
          }
          
          if (newQuotations > 0) {
            message += `• ${newQuotations} new quotation${newQuotations !== 1 ? 's' : ''} received\n`;
          }
          
          if (expiringSoon > 0) {
            message += `• ${expiringSoon} RFQ${expiringSoon !== 1 ? 's' : ''} expiring soon\n`;
          }

          await this.createNotification({
            userId: user.id,
            type: 'info',
            title: 'Weekly RFQ Summary',
            message: message.trim(),
            relatedType: 'rfq_summary'
          });
        }
      }

    } catch (error) {
      console.error('Error sending weekly RFQ summary:', error);
    }
  }

  /**
   * Private helper methods
   */
  private async createNotification(data: NotificationData): Promise<void> {
    try {
      await db.insert(notifications).values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId || null,
        relatedType: data.relatedType || null,
        read: false
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  private async notifyRelevantSuppliersAsync(rfqId: string): Promise<void> {
    try {
      // Run in background without blocking
      setTimeout(async () => {
        await rfqMatchingService.notifyRelevantSuppliers(rfqId, 20);
      }, 1000);
    } catch (error) {
      console.error('Error in async supplier notification:', error);
    }
  }

  private async notifyRFQClosed(rfqId: string, acceptedQuotationId: string): Promise<void> {
    try {
      // Get all other quotations for this RFQ
      const otherQuotations = await db
        .select({
          quotation: quotations,
          supplier: supplierProfiles,
          user: users
        })
        .from(quotations)
        .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
        .leftJoin(users, eq(supplierProfiles.userId, users.id))
        .where(and(
          eq(quotations.rfqId, rfqId),
          sql`${quotations.id} != ${acceptedQuotationId}`,
          eq(quotations.status, 'sent')
        ));

      // Get RFQ title
      const rfqResult = await db
        .select({ title: rfqs.title })
        .from(rfqs)
        .where(eq(rfqs.id, rfqId))
        .limit(1);

      const rfqTitle = rfqResult[0]?.title || 'RFQ';

      // Notify suppliers that RFQ is closed
      for (const { user } of otherQuotations) {
        if (user) {
          await this.createNotification({
            userId: user.id,
            type: 'info',
            title: 'RFQ Closed',
            message: `The RFQ "${rfqTitle}" has been closed. Another supplier's quotation was selected.`,
            relatedId: rfqId,
            relatedType: 'rfq'
          });
        }
      }

      // Update other quotations status to rejected
      if (otherQuotations.length > 0) {
        await db
          .update(quotations)
          .set({ 
            status: 'rejected',
            updatedAt: new Date()
          })
          .where(and(
            eq(quotations.rfqId, rfqId),
            sql`${quotations.id} != ${acceptedQuotationId}`,
            eq(quotations.status, 'sent')
          ));
      }

    } catch (error) {
      console.error('Error notifying RFQ closed:', error);
    }
  }

  private async notifySupplierRFQExpired(rfqId: string): Promise<void> {
    try {
      // Get suppliers with pending quotations
      const suppliersWithQuotations = await db
        .select({
          quotation: quotations,
          supplier: supplierProfiles,
          user: users,
          rfq: rfqs
        })
        .from(quotations)
        .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
        .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
        .leftJoin(users, eq(supplierProfiles.userId, users.id))
        .where(and(
          eq(quotations.rfqId, rfqId),
          eq(quotations.status, 'sent')
        ));

      for (const { user, rfq } of suppliersWithQuotations) {
        if (user) {
          await this.createNotification({
            userId: user.id,
            type: 'warning',
            title: 'RFQ Expired',
            message: `The RFQ "${rfq.title}" has expired. Your quotation is still valid and may be reviewed by the buyer.`,
            relatedId: rfqId,
            relatedType: 'rfq'
          });
        }
      }

    } catch (error) {
      console.error('Error notifying supplier RFQ expired:', error);
    }
  }
}

export const rfqNotificationService = new RFQNotificationService();