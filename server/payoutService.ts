import { db } from "./db";
import { payouts, orders, supplierProfiles } from "../shared/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { commissionService } from "./commissionService";

export interface PayoutSchedule {
  supplierId: string;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  orderIds: string[];
  scheduledDate: Date;
}

export interface PayoutProcessingResult {
  success: boolean;
  payoutId?: string;
  transactionId?: string;
  error?: string;
}

export interface PayoutSummary {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalFailed: number;
  pendingAmount: number;
  completedAmount: number;
  failedAmount: number;
}

export class PayoutService {
  private static instance: PayoutService;
  
  // Configuration
  private readonly DEFAULT_PAYOUT_SCHEDULE = 'weekly'; // weekly, biweekly, monthly
  private readonly MINIMUM_PAYOUT_AMOUNT = 50; // Minimum amount for payout
  private readonly PAYOUT_PROCESSING_FEE = 2.5; // Processing fee percentage
  
  public static getInstance(): PayoutService {
    if (!PayoutService.instance) {
      PayoutService.instance = new PayoutService();
    }
    return PayoutService.instance;
  }

  /**
   * Calculate pending payouts for a supplier
   */
  async calculatePendingPayouts(supplierId: string): Promise<PayoutSchedule | null> {
    try {
      // Get all paid orders that haven't been paid out yet
      const pendingOrders = await db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          commissionAmount: orders.commissionAmount,
          supplierAmount: orders.supplierAmount,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          and(
            eq(orders.supplierId, supplierId),
            eq(orders.paymentStatus, "paid"),
            sql`${orders.id} NOT IN (SELECT order_id FROM payouts WHERE order_id IS NOT NULL AND status IN ('completed', 'processing'))`
          )
        )
        .orderBy(desc(orders.createdAt));

      if (pendingOrders.length === 0) {
        return null;
      }

      const totalAmount = pendingOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const totalCommission = pendingOrders.reduce((sum, order) => sum + Number(order.commissionAmount || 0), 0);
      const netAmount = pendingOrders.reduce((sum, order) => sum + Number(order.supplierAmount || 0), 0);

      // Check if meets minimum payout threshold
      if (netAmount < this.MINIMUM_PAYOUT_AMOUNT) {
        return null;
      }

      return {
        supplierId,
        amount: totalAmount,
        commissionAmount: totalCommission,
        netAmount,
        orderIds: pendingOrders.map(order => order.id),
        scheduledDate: this.getNextPayoutDate(),
      };
    } catch (error) {
      console.error("Error calculating pending payouts:", error);
      return null;
    }
  }

  /**
   * Get next payout date based on schedule
   */
  private getNextPayoutDate(): Date {
    const now = new Date();
    const nextPayout = new Date(now);
    
    // Set to next Friday (weekly schedule)
    const daysUntilFriday = (5 - now.getDay() + 7) % 7;
    nextPayout.setDate(now.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    nextPayout.setHours(10, 0, 0, 0); // 10 AM
    
    return nextPayout;
  }

  /**
   * Schedule payout for a supplier
   */
  async schedulePayout(
    supplierId: string,
    method: 'bank_transfer' | 'paypal' | 'stripe' = 'bank_transfer'
  ): Promise<string | null> {
    try {
      const payoutSchedule = await this.calculatePendingPayouts(supplierId);
      
      if (!payoutSchedule) {
        return null;
      }

      // Create payout record
      const payoutData = {
        supplierId: payoutSchedule.supplierId,
        amount: payoutSchedule.amount.toString(),
        commissionAmount: payoutSchedule.commissionAmount.toString(),
        netAmount: payoutSchedule.netAmount.toString(),
        method,
        status: 'pending' as const,
        scheduledDate: payoutSchedule.scheduledDate,
      };

      const result = await db.insert(payouts).values(payoutData).returning({ id: payouts.id });
      
      if (result.length > 0) {
        const payoutId = result[0].id;
        
        // Update orders to reference this payout (for tracking)
        // Note: We'll create individual payout records for each order for better tracking
        for (const orderId of payoutSchedule.orderIds) {
          const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
          if (order.length > 0) {
            const orderData = order[0];
            await db.insert(payouts).values({
              supplierId: payoutSchedule.supplierId,
              orderId: orderId,
              amount: orderData.totalAmount || "0",
              commissionAmount: orderData.commissionAmount || "0",
              netAmount: orderData.supplierAmount || "0",
              method,
              status: 'pending' as const,
              scheduledDate: payoutSchedule.scheduledDate,
            });
          }
        }
        
        return payoutId;
      }
      
      return null;
    } catch (error) {
      console.error("Error scheduling payout:", error);
      throw new Error("Failed to schedule payout");
    }
  }

  /**
   * Process a payout (simulate payment processing)
   */
  async processPayout(payoutId: string): Promise<PayoutProcessingResult> {
    try {
      // Get payout details
      const payoutResult = await db
        .select()
        .from(payouts)
        .where(eq(payouts.id, payoutId))
        .limit(1);

      if (payoutResult.length === 0) {
        return { success: false, error: "Payout not found" };
      }

      const payout = payoutResult[0];

      if (payout.status !== 'pending') {
        return { success: false, error: "Payout is not in pending status" };
      }

      // Get supplier payment details
      const supplierResult = await db
        .select({
          bankName: supplierProfiles.bankName,
          accountNumber: supplierProfiles.accountNumber,
          accountName: supplierProfiles.accountName,
          paypalEmail: supplierProfiles.paypalEmail,
        })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, payout.supplierId))
        .limit(1);

      if (supplierResult.length === 0) {
        return { success: false, error: "Supplier not found" };
      }

      const supplier = supplierResult[0];

      // Validate payment method details
      if (payout.method === 'bank_transfer' && (!supplier.bankName || !supplier.accountNumber)) {
        return { success: false, error: "Bank details not configured for supplier" };
      }

      if (payout.method === 'paypal' && !supplier.paypalEmail) {
        return { success: false, error: "PayPal email not configured for supplier" };
      }

      // Update payout status to processing
      await db
        .update(payouts)
        .set({
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(payouts.id, payoutId));

      // Simulate payment processing
      const processingResult = await this.simulatePaymentProcessing(payout, supplier);

      if (processingResult.success) {
        // Update payout as completed
        await db
          .update(payouts)
          .set({
            status: 'completed',
            processedDate: new Date(),
            transactionId: processingResult.transactionId,
            updatedAt: new Date(),
          })
          .where(eq(payouts.id, payoutId));

        return {
          success: true,
          payoutId,
          transactionId: processingResult.transactionId,
        };
      } else {
        // Update payout as failed
        await db
          .update(payouts)
          .set({
            status: 'failed',
            failureReason: processingResult.error,
            updatedAt: new Date(),
          })
          .where(eq(payouts.id, payoutId));

        return {
          success: false,
          error: processingResult.error,
        };
      }
    } catch (error) {
      console.error("Error processing payout:", error);
      
      // Update payout as failed
      try {
        await db
          .update(payouts)
          .set({
            status: 'failed',
            failureReason: 'Processing error: ' + (error as Error).message,
            updatedAt: new Date(),
          })
          .where(eq(payouts.id, payoutId));
      } catch (updateError) {
        console.error("Error updating failed payout:", updateError);
      }

      return {
        success: false,
        error: "Payment processing failed",
      };
    }
  }

  /**
   * Simulate payment processing (replace with actual payment gateway integration)
   */
  private async simulatePaymentProcessing(
    payout: any,
    supplier: any
  ): Promise<PayoutProcessingResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate 95% success rate
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      const errors = [
        "Insufficient funds in platform account",
        "Invalid bank account details",
        "Payment gateway timeout",
        "Account verification required",
      ];
      
      return {
        success: false,
        error: errors[Math.floor(Math.random() * errors.length)],
      };
    }
  }

  /**
   * Process all pending payouts
   */
  async processAllPendingPayouts(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: PayoutProcessingResult[];
  }> {
    try {
      // Get all pending payouts scheduled for today or earlier
      const pendingPayouts = await db
        .select()
        .from(payouts)
        .where(
          and(
            eq(payouts.status, 'pending'),
            lte(payouts.scheduledDate, new Date())
          )
        )
        .orderBy(payouts.scheduledDate);

      const results: PayoutProcessingResult[] = [];
      let successful = 0;
      let failed = 0;

      for (const payout of pendingPayouts) {
        const result = await this.processPayout(payout.id);
        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }

      return {
        processed: pendingPayouts.length,
        successful,
        failed,
        results,
      };
    } catch (error) {
      console.error("Error processing all pending payouts:", error);
      throw new Error("Failed to process pending payouts");
    }
  }

  /**
   * Get payout history for a supplier
   */
  async getSupplierPayoutHistory(
    supplierId: string,
    limit: number = 50,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      let query = db
        .select()
        .from(payouts)
        .where(eq(payouts.supplierId, supplierId))
        .orderBy(desc(payouts.createdAt))
        .limit(limit)
        .offset(offset);

      const conditions = [eq(payouts.supplierId, supplierId)];

      if (startDate && endDate) {
        conditions.push(gte(payouts.createdAt, startDate));
        conditions.push(lte(payouts.createdAt, endDate));
      }

      if (conditions.length > 1) {
        query = db
          .select()
          .from(payouts)
          .where(and(...conditions))
          .orderBy(desc(payouts.createdAt))
          .limit(limit)
          .offset(offset);
      }

      const result = await query;
      
      return result.map(payout => ({
        ...payout,
        amount: Number(payout.amount),
        commissionAmount: Number(payout.commissionAmount),
        netAmount: Number(payout.netAmount),
      }));
    } catch (error) {
      console.error("Error getting supplier payout history:", error);
      return [];
    }
  }

  /**
   * Get payout summary for admin dashboard
   */
  async getPayoutSummary(startDate?: Date, endDate?: Date): Promise<PayoutSummary> {
    try {
      let query = db
        .select({
          status: payouts.status,
          amount: payouts.amount,
          netAmount: payouts.netAmount,
        })
        .from(payouts);

      if (startDate && endDate) {
        query = query.where(
          and(
            gte(payouts.createdAt, startDate),
            lte(payouts.createdAt, endDate)
          )
        );
      }

      const result = await query;

      const summary = result.reduce(
        (acc, payout) => {
          const amount = Number(payout.amount);
          const netAmount = Number(payout.netAmount);

          switch (payout.status) {
            case 'pending':
              acc.totalPending++;
              acc.pendingAmount += netAmount;
              break;
            case 'processing':
              acc.totalProcessing++;
              break;
            case 'completed':
              acc.totalCompleted++;
              acc.completedAmount += netAmount;
              break;
            case 'failed':
              acc.totalFailed++;
              acc.failedAmount += netAmount;
              break;
          }

          return acc;
        },
        {
          totalPending: 0,
          totalProcessing: 0,
          totalCompleted: 0,
          totalFailed: 0,
          pendingAmount: 0,
          completedAmount: 0,
          failedAmount: 0,
        }
      );

      return summary;
    } catch (error) {
      console.error("Error getting payout summary:", error);
      return {
        totalPending: 0,
        totalProcessing: 0,
        totalCompleted: 0,
        totalFailed: 0,
        pendingAmount: 0,
        completedAmount: 0,
        failedAmount: 0,
      };
    }
  }

  /**
   * Retry failed payout
   */
  async retryFailedPayout(payoutId: string): Promise<PayoutProcessingResult> {
    try {
      // Reset payout status to pending
      await db
        .update(payouts)
        .set({
          status: 'pending',
          failureReason: null,
          updatedAt: new Date(),
        })
        .where(eq(payouts.id, payoutId));

      // Process the payout again
      return await this.processPayout(payoutId);
    } catch (error) {
      console.error("Error retrying failed payout:", error);
      return {
        success: false,
        error: "Failed to retry payout",
      };
    }
  }

  /**
   * Get supplier earnings summary
   */
  async getSupplierEarningsSummary(supplierId: string) {
    try {
      // Get total earnings from completed payouts
      const completedPayouts = await db
        .select({
          totalEarnings: sql<number>`sum(${payouts.netAmount})`,
          totalPayouts: sql<number>`count(*)`,
        })
        .from(payouts)
        .where(
          and(
            eq(payouts.supplierId, supplierId),
            eq(payouts.status, 'completed')
          )
        );

      // Get pending earnings
      const pendingPayouts = await db
        .select({
          pendingEarnings: sql<number>`sum(${payouts.netAmount})`,
          pendingPayouts: sql<number>`count(*)`,
        })
        .from(payouts)
        .where(
          and(
            eq(payouts.supplierId, supplierId),
            eq(payouts.status, 'pending')
          )
        );

      // Get commission summary
      const commissionSummary = await commissionService.getSupplierCommissionSummary(supplierId);

      return {
        totalEarnings: Number(completedPayouts[0]?.totalEarnings || 0),
        totalPayouts: Number(completedPayouts[0]?.totalPayouts || 0),
        pendingEarnings: Number(pendingPayouts[0]?.pendingEarnings || 0),
        pendingPayouts: Number(pendingPayouts[0]?.pendingPayouts || 0),
        ...commissionSummary,
      };
    } catch (error) {
      console.error("Error getting supplier earnings summary:", error);
      return {
        totalEarnings: 0,
        totalPayouts: 0,
        pendingEarnings: 0,
        pendingPayouts: 0,
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
        avgCommissionRate: 0,
      };
    }
  }
}

export const payoutService = PayoutService.getInstance();