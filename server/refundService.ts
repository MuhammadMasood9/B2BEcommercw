import { eq, and, or, desc, asc, count, sum } from "drizzle-orm";
import { db } from "./db";
import { 
  refunds,
  orders,
  disputes,
  buyers,
  supplierProfiles,
  users,
  InsertRefund
} from "@shared/schema";

export interface RefundRequest {
  orderId: string;
  disputeId?: string;
  buyerId: string;
  supplierId: string;
  adminId: string;
  refundAmount: string;
  originalAmount: string;
  refundType: 'full' | 'partial' | 'shipping_only';
  reason: string;
  paymentMethod?: string;
}

export interface RefundProcessingResult {
  refundId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  message: string;
}

export class RefundService {
  /**
   * Process a refund request
   */
  async processRefund(refundRequest: RefundRequest): Promise<RefundProcessingResult> {
    try {
      // Validate refund request
      await this.validateRefundRequest(refundRequest);

      // Calculate commission adjustments
      const commissionAdjustment = await this.calculateCommissionAdjustment(
        refundRequest.orderId,
        parseFloat(refundRequest.refundAmount)
      );

      // Create refund record
      const refundData: InsertRefund = {
        orderId: refundRequest.orderId,
        disputeId: refundRequest.disputeId,
        buyerId: refundRequest.buyerId,
        supplierId: refundRequest.supplierId,
        adminId: refundRequest.adminId,
        refundAmount: refundRequest.refundAmount,
        originalAmount: refundRequest.originalAmount,
        refundType: refundRequest.refundType,
        reason: refundRequest.reason,
        commissionAdjustment: commissionAdjustment.toString(),
        supplierDeduction: this.calculateSupplierDeduction(
          parseFloat(refundRequest.refundAmount),
          commissionAdjustment
        ).toString(),
        status: 'pending',
        paymentMethod: refundRequest.paymentMethod || 'original_method',
        adminNotes: `Refund processed by admin. Type: ${refundRequest.refundType}`
      };

      const [newRefund] = await db.insert(refunds).values(refundData).returning();

      // Process the actual refund
      const processingResult = await this.executeRefund(newRefund);

      // Update refund status
      await this.updateRefundStatus(newRefund.id, processingResult.status, processingResult.transactionId);

      // Send notifications
      await this.sendRefundNotifications(newRefund.id);

      return {
        refundId: newRefund.id,
        status: processingResult.status,
        transactionId: processingResult.transactionId,
        message: processingResult.message
      };
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  }

  /**
   * Validate refund request
   */
  private async validateRefundRequest(refundRequest: RefundRequest): Promise<void> {
    // Check if order exists
    const order = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus
      })
      .from(orders)
      .where(eq(orders.id, refundRequest.orderId))
      .limit(1);

    if (order.length === 0) {
      throw new Error("Order not found");
    }

    const orderData = order[0];

    // Check if order is paid
    if (orderData.paymentStatus !== 'paid') {
      throw new Error("Cannot refund unpaid order");
    }

    // Check refund amount
    const refundAmount = parseFloat(refundRequest.refundAmount);
    const originalAmount = parseFloat(refundRequest.originalAmount);

    if (refundAmount <= 0) {
      throw new Error("Refund amount must be greater than 0");
    }

    if (refundAmount > originalAmount) {
      throw new Error("Refund amount cannot exceed original order amount");
    }

    // Check for existing refunds
    const existingRefunds = await db
      .select({
        refundAmount: refunds.refundAmount,
        status: refunds.status
      })
      .from(refunds)
      .where(and(
        eq(refunds.orderId, refundRequest.orderId),
        or(
          eq(refunds.status, 'pending'),
          eq(refunds.status, 'processing'),
          eq(refunds.status, 'completed')
        )
      ));

    const totalExistingRefunds = existingRefunds.reduce((sum, refund) => {
      return sum + parseFloat(refund.refundAmount);
    }, 0);

    if (totalExistingRefunds + refundAmount > originalAmount) {
      throw new Error("Total refund amount would exceed original order amount");
    }
  }

  /**
   * Calculate commission adjustment for refund
   */
  private async calculateCommissionAdjustment(orderId: string, refundAmount: number): Promise<number> {
    try {
      const order = await db
        .select({
          commissionAmount: orders.commissionAmount,
          totalAmount: orders.totalAmount
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (order.length === 0 || !order[0].commissionAmount) {
        return 0;
      }

      const commissionAmount = parseFloat(order[0].commissionAmount);
      const totalAmount = parseFloat(order[0].totalAmount);

      // Calculate proportional commission adjustment
      const commissionAdjustment = (refundAmount / totalAmount) * commissionAmount;

      return Math.round(commissionAdjustment * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error("Error calculating commission adjustment:", error);
      return 0;
    }
  }

  /**
   * Calculate supplier deduction amount
   */
  private calculateSupplierDeduction(refundAmount: number, commissionAdjustment: number): number {
    // Supplier pays the refund minus the commission adjustment
    return Math.max(0, refundAmount - commissionAdjustment);
  }

  /**
   * Execute the actual refund processing
   */
  private async executeRefund(refund: any): Promise<{
    status: 'processing' | 'completed' | 'failed';
    transactionId?: string;
    message: string;
  }> {
    try {
      // In a real implementation, this would integrate with payment processors
      // For now, we'll simulate the refund processing

      const refundAmount = parseFloat(refund.refundAmount);

      // Simulate processing time and success/failure
      const isSuccessful = Math.random() > 0.05; // 95% success rate

      if (isSuccessful) {
        // Generate mock transaction ID
        const transactionId = `refund_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        return {
          status: 'completed',
          transactionId,
          message: `Refund of $${refundAmount} processed successfully`
        };
      } else {
        return {
          status: 'failed',
          message: 'Refund processing failed. Please try again or contact payment processor.'
        };
      }
    } catch (error) {
      console.error("Error executing refund:", error);
      return {
        status: 'failed',
        message: 'Technical error during refund processing'
      };
    }
  }

  /**
   * Update refund status
   */
  private async updateRefundStatus(
    refundId: string,
    status: string,
    transactionId?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'processing') {
        updateData.processedAt = new Date();
      } else if (status === 'completed') {
        updateData.completedAt = new Date();
        updateData.processedAt = updateData.processedAt || new Date();
      }

      if (transactionId) {
        updateData.transactionId = transactionId;
      }

      await db
        .update(refunds)
        .set(updateData)
        .where(eq(refunds.id, refundId));
    } catch (error) {
      console.error("Error updating refund status:", error);
      throw error;
    }
  }

  /**
   * Send refund notifications
   */
  private async sendRefundNotifications(refundId: string): Promise<void> {
    try {
      // Get refund details
      const refund = await db
        .select({
          refund: refunds,
          buyer: buyers,
          supplier: supplierProfiles
        })
        .from(refunds)
        .leftJoin(buyers, eq(refunds.buyerId, buyers.id))
        .leftJoin(supplierProfiles, eq(refunds.supplierId, supplierProfiles.id))
        .where(eq(refunds.id, refundId))
        .limit(1);

      if (refund.length === 0) {
        throw new Error("Refund not found");
      }

      // In a real implementation, this would send actual notifications
      console.log(`Refund notifications sent for refund ${refundId}:`, {
        buyerNotification: `Refund of $${refund[0].refund.refundAmount} has been processed`,
        supplierNotification: `Refund deduction of $${refund[0].refund.supplierDeduction} applied to your account`
      });

      // Update notification flags
      await db
        .update(refunds)
        .set({
          buyerNotificationSent: true,
          supplierNotificationSent: true
        })
        .where(eq(refunds.id, refundId));
    } catch (error) {
      console.error("Error sending refund notifications:", error);
      // Don't throw error as this is not critical for refund processing
    }
  }

  /**
   * Get refund by ID
   */
  async getRefundById(refundId: string): Promise<any> {
    try {
      const result = await db
        .select({
          refund: refunds,
          order: {
            id: orders.id,
            orderNumber: orders.orderNumber,
            totalAmount: orders.totalAmount
          },
          dispute: {
            id: disputes.id,
            title: disputes.title,
            type: disputes.type
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
          admin: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName
          }
        })
        .from(refunds)
        .leftJoin(orders, eq(refunds.orderId, orders.id))
        .leftJoin(disputes, eq(refunds.disputeId, disputes.id))
        .leftJoin(buyers, eq(refunds.buyerId, buyers.id))
        .leftJoin(supplierProfiles, eq(refunds.supplierId, supplierProfiles.id))
        .leftJoin(users, eq(refunds.adminId, users.id))
        .where(eq(refunds.id, refundId))
        .limit(1);

      if (result.length === 0) {
        throw new Error("Refund not found");
      }

      return {
        ...result[0].refund,
        order: result[0].order,
        dispute: result[0].dispute,
        buyer: result[0].buyer,
        supplier: result[0].supplier,
        admin: result[0].admin
      };
    } catch (error) {
      console.error("Error fetching refund:", error);
      throw error;
    }
  }

  /**
   * Get refunds with filtering and pagination
   */
  async getRefunds(filters: {
    status?: string;
    refundType?: string;
    buyerId?: string;
    supplierId?: string;
    adminId?: string;
    orderId?: string;
    disputeId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ refunds: any[]; total: number }> {
    try {
      const {
        status,
        refundType,
        buyerId,
        supplierId,
        adminId,
        orderId,
        disputeId,
        sortBy = 'requestedAt',
        sortOrder = 'desc',
        limit = 20,
        offset = 0
      } = filters;

      let query = db
        .select({
          refund: refunds,
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
          }
        })
        .from(refunds)
        .leftJoin(orders, eq(refunds.orderId, orders.id))
        .leftJoin(buyers, eq(refunds.buyerId, buyers.id))
        .leftJoin(supplierProfiles, eq(refunds.supplierId, supplierProfiles.id));

      const conditions = [];

      // Apply filters
      if (status) conditions.push(eq(refunds.status, status));
      if (refundType) conditions.push(eq(refunds.refundType, refundType));
      if (buyerId) conditions.push(eq(refunds.buyerId, buyerId));
      if (supplierId) conditions.push(eq(refunds.supplierId, supplierId));
      if (adminId) conditions.push(eq(refunds.adminId, adminId));
      if (orderId) conditions.push(eq(refunds.orderId, orderId));
      if (disputeId) conditions.push(eq(refunds.disputeId, disputeId));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      // Apply sorting
      const sortColumn = sortBy === 'refundAmount' ? refunds.refundAmount :
                        sortBy === 'status' ? refunds.status :
                        sortBy === 'completedAt' ? refunds.completedAt :
                        refunds.requestedAt;

      if (sortOrder === 'asc') {
        query = query.orderBy(asc(sortColumn)) as any;
      } else {
        query = query.orderBy(desc(sortColumn)) as any;
      }

      query = query.limit(limit).offset(offset) as any;

      const result = await query;

      // Get total count
      let countQuery = db.select({ count: count() })
        .from(refunds);

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as any;
      }

      const [{ count: totalCount }] = await countQuery;

      const formattedRefunds = result.map(row => ({
        ...row.refund,
        order: row.order,
        buyer: row.buyer,
        supplier: row.supplier
      }));

      return {
        refunds: formattedRefunds,
        total: totalCount
      };
    } catch (error) {
      console.error("Error fetching refunds:", error);
      throw error;
    }
  }

  /**
   * Retry failed refund
   */
  async retryRefund(refundId: string): Promise<RefundProcessingResult> {
    try {
      // Get refund details
      const refund = await db
        .select()
        .from(refunds)
        .where(eq(refunds.id, refundId))
        .limit(1);

      if (refund.length === 0) {
        throw new Error("Refund not found");
      }

      const refundData = refund[0];

      if (refundData.status !== 'failed') {
        throw new Error("Only failed refunds can be retried");
      }

      // Update status to processing
      await this.updateRefundStatus(refundId, 'processing');

      // Retry the refund processing
      const processingResult = await this.executeRefund(refundData);

      // Update final status
      await this.updateRefundStatus(refundId, processingResult.status, processingResult.transactionId);

      return {
        refundId,
        status: processingResult.status,
        transactionId: processingResult.transactionId,
        message: processingResult.message
      };
    } catch (error) {
      console.error("Error retrying refund:", error);
      throw error;
    }
  }

  /**
   * Get refund statistics
   */
  async getRefundStatistics(): Promise<{
    totalRefunds: number;
    totalRefundAmount: number;
    refundsByStatus: { [key: string]: number };
    refundsByType: { [key: string]: number };
    averageRefundAmount: number;
    refundRate: number;
  }> {
    try {
      // Get refund statistics
      const refundStats = await db
        .select({
          status: refunds.status,
          refundType: refunds.refundType,
          refundAmount: refunds.refundAmount
        })
        .from(refunds);

      // Get total orders for refund rate calculation
      const [{ count: totalOrders }] = await db
        .select({ count: count() })
        .from(orders);

      const totalRefunds = refundStats.length;
      let totalRefundAmount = 0;
      const refundsByStatus: { [key: string]: number } = {};
      const refundsByType: { [key: string]: number } = {};

      refundStats.forEach(refund => {
        totalRefundAmount += parseFloat(refund.refundAmount);
        
        const status = refund.status || 'unknown';
        const refundType = refund.refundType || 'unknown';
        
        refundsByStatus[status] = (refundsByStatus[status] || 0) + 1;
        refundsByType[refundType] = (refundsByType[refundType] || 0) + 1;
      });

      const averageRefundAmount = totalRefunds > 0 ? totalRefundAmount / totalRefunds : 0;
      const refundRate = totalOrders > 0 ? (totalRefunds / totalOrders) * 100 : 0;

      return {
        totalRefunds,
        totalRefundAmount,
        refundsByStatus,
        refundsByType,
        averageRefundAmount,
        refundRate
      };
    } catch (error) {
      console.error("Error getting refund statistics:", error);
      throw error;
    }
  }

  /**
   * Cancel pending refund
   */
  async cancelRefund(refundId: string, reason: string, cancelledBy: string): Promise<void> {
    try {
      // Verify refund is pending
      const refund = await db
        .select({ status: refunds.status })
        .from(refunds)
        .where(eq(refunds.id, refundId))
        .limit(1);

      if (refund.length === 0) {
        throw new Error("Refund not found");
      }

      if (refund[0].status !== 'pending') {
        throw new Error("Only pending refunds can be cancelled");
      }

      // Update refund status
      await db
        .update(refunds)
        .set({
          status: 'failed',
          adminNotes: `Refund cancelled by ${cancelledBy}. Reason: ${reason}`
        })
        .where(eq(refunds.id, refundId));
    } catch (error) {
      console.error("Error cancelling refund:", error);
      throw error;
    }
  }
}

export const refundService = new RefundService();