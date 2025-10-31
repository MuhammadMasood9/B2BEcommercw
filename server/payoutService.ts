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

export interface PayoutBatch {
  id: string;
  batchNumber: string;
  totalAmount: number;
  totalPayouts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payouts: string[];
  scheduledDate: Date;
  processedDate?: Date;
  completedDate?: Date;
  processedBy?: string;
  approvedBy?: string;
  failureReason?: string;
  retryCount: number;
}

export interface PaymentMethodConfig {
  type: 'bank_transfer' | 'paypal' | 'crypto' | 'stripe';
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  processingTime: string;
  requirements: string[];
}

export interface AutomatedPayoutConfig {
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  minAmount: number;
  maxBatchSize: number;
  requireApproval: boolean;
  approvalThreshold: number;
  retryAttempts: number;
  retryDelay: number; // hours
}

export class PayoutService {
  private static instance: PayoutService;
  
  // Configuration
  private readonly DEFAULT_PAYOUT_SCHEDULE = 'weekly'; // weekly, biweekly, monthly
  private readonly MINIMUM_PAYOUT_AMOUNT = 50; // Minimum amount for payout
  private readonly PAYOUT_PROCESSING_FEE = 2.5; // Processing fee percentage
  
  // Advanced configuration
  private readonly PAYMENT_METHODS: PaymentMethodConfig[] = [
    {
      type: 'bank_transfer',
      enabled: true,
      minAmount: 50,
      maxAmount: 50000,
      processingFee: 2.5,
      processingTime: '1-3 business days',
      requirements: ['Bank name', 'Account number', 'Account holder name', 'Routing number'],
    },
    {
      type: 'paypal',
      enabled: true,
      minAmount: 10,
      maxAmount: 10000,
      processingFee: 3.5,
      processingTime: 'Instant',
      requirements: ['PayPal email address'],
    },
    {
      type: 'crypto',
      enabled: false,
      minAmount: 100,
      maxAmount: 25000,
      processingFee: 1.0,
      processingTime: '10-30 minutes',
      requirements: ['Crypto wallet address', 'Wallet type'],
    },
    {
      type: 'stripe',
      enabled: true,
      minAmount: 25,
      maxAmount: 15000,
      processingFee: 2.9,
      processingTime: '1-2 business days',
      requirements: ['Bank account details'],
    },
  ];

  private readonly AUTOMATED_CONFIG: AutomatedPayoutConfig = {
    enabled: true,
    schedule: 'weekly',
    minAmount: 50,
    maxBatchSize: 100,
    requireApproval: true,
    approvalThreshold: 10000,
    retryAttempts: 3,
    retryDelay: 24, // hours
  };
  
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

  /**
   * Create automated payout batch
   */
  async createPayoutBatch(
    supplierIds?: string[],
    approvedBy?: string
  ): Promise<PayoutBatch | null> {
    try {
      // Get all suppliers eligible for payout
      let eligibleSuppliers: string[] = [];
      
      if (supplierIds && supplierIds.length > 0) {
        eligibleSuppliers = supplierIds;
      } else {
        // Get all suppliers with pending payouts above minimum threshold
        const suppliersWithPending = await db
          .select({ supplierId: orders.supplierId })
          .from(orders)
          .where(
            and(
              eq(orders.paymentStatus, "paid"),
              sql`${orders.id} NOT IN (SELECT order_id FROM payouts WHERE order_id IS NOT NULL AND status IN ('completed', 'processing'))`
            )
          )
          .groupBy(orders.supplierId);

        for (const supplier of suppliersWithPending) {
          const pendingPayout = await this.calculatePendingPayouts(supplier.supplierId);
          if (pendingPayout && pendingPayout.netAmount >= this.AUTOMATED_CONFIG.minAmount) {
            eligibleSuppliers.push(supplier.supplierId);
          }
        }
      }

      if (eligibleSuppliers.length === 0) {
        return null;
      }

      // Limit batch size
      const batchSuppliers = eligibleSuppliers.slice(0, this.AUTOMATED_CONFIG.maxBatchSize);
      
      // Create payouts for each supplier
      const payoutIds: string[] = [];
      let totalBatchAmount = 0;

      for (const supplierId of batchSuppliers) {
        const payoutId = await this.schedulePayout(supplierId);
        if (payoutId) {
          payoutIds.push(payoutId);
          const pendingPayout = await this.calculatePendingPayouts(supplierId);
          if (pendingPayout) {
            totalBatchAmount += pendingPayout.netAmount;
          }
        }
      }

      if (payoutIds.length === 0) {
        return null;
      }

      // Create batch record
      const batchNumber = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const batch: PayoutBatch = {
        id: `batch_${Date.now()}`,
        batchNumber,
        totalAmount: totalBatchAmount,
        totalPayouts: payoutIds.length,
        status: this.AUTOMATED_CONFIG.requireApproval && totalBatchAmount > this.AUTOMATED_CONFIG.approvalThreshold 
          ? 'pending' 
          : 'processing',
        payouts: payoutIds,
        scheduledDate: new Date(),
        approvedBy,
        retryCount: 0,
      };

      return batch;
    } catch (error) {
      console.error("Error creating payout batch:", error);
      return null;
    }
  }

  /**
   * Process automated payout batch
   */
  async processPayoutBatch(batchId: string): Promise<{
    success: boolean;
    processed: number;
    successful: number;
    failed: number;
    results: PayoutProcessingResult[];
  }> {
    try {
      // This would retrieve batch from database in real implementation
      // For now, we'll process all pending payouts as a batch
      return await this.processAllPendingPayouts();
    } catch (error) {
      console.error("Error processing payout batch:", error);
      throw new Error("Failed to process payout batch");
    }
  }

  /**
   * Get payment method configurations
   */
  getPaymentMethods(): PaymentMethodConfig[] {
    return this.PAYMENT_METHODS.filter(method => method.enabled);
  }

  /**
   * Validate payment method for supplier
   */
  async validatePaymentMethod(
    supplierId: string,
    method: 'bank_transfer' | 'paypal' | 'crypto' | 'stripe'
  ): Promise<{ valid: boolean; missingRequirements: string[] }> {
    try {
      const methodConfig = this.PAYMENT_METHODS.find(m => m.type === method);
      if (!methodConfig || !methodConfig.enabled) {
        return { valid: false, missingRequirements: ['Payment method not supported'] };
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
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      if (supplierResult.length === 0) {
        return { valid: false, missingRequirements: ['Supplier not found'] };
      }

      const supplier = supplierResult[0];
      const missingRequirements: string[] = [];

      switch (method) {
        case 'bank_transfer':
          if (!supplier.bankName) missingRequirements.push('Bank name');
          if (!supplier.accountNumber) missingRequirements.push('Account number');
          if (!supplier.accountName) missingRequirements.push('Account holder name');
          break;
        case 'paypal':
          if (!supplier.paypalEmail) missingRequirements.push('PayPal email address');
          break;
        case 'crypto':
          // Would check crypto wallet details
          missingRequirements.push('Crypto wallet configuration not implemented');
          break;
        case 'stripe':
          // Would check Stripe account details
          if (!supplier.bankName || !supplier.accountNumber) {
            missingRequirements.push('Bank account details for Stripe');
          }
          break;
      }

      return {
        valid: missingRequirements.length === 0,
        missingRequirements,
      };
    } catch (error) {
      console.error("Error validating payment method:", error);
      return { valid: false, missingRequirements: ['Validation error'] };
    }
  }

  /**
   * Get payout failure analysis
   */
  async getPayoutFailureAnalysis(startDate?: Date, endDate?: Date) {
    try {
      let query = db
        .select({
          failureReason: payouts.failureReason,
          method: payouts.method,
          count: sql<number>`count(*)`,
          totalAmount: sql<number>`sum(${payouts.netAmount})`,
        })
        .from(payouts)
        .where(eq(payouts.status, 'failed'))
        .groupBy(payouts.failureReason, payouts.method);

      if (startDate && endDate) {
        query = query.where(
          and(
            eq(payouts.status, 'failed'),
            gte(payouts.createdAt, startDate),
            lte(payouts.createdAt, endDate)
          )
        );
      }

      const result = await query;

      return result.map(row => ({
        failureReason: row.failureReason,
        method: row.method,
        count: Number(row.count),
        totalAmount: Number(row.totalAmount),
      }));
    } catch (error) {
      console.error("Error getting payout failure analysis:", error);
      return [];
    }
  }

  /**
   * Get automated payout configuration
   */
  getAutomatedPayoutConfig(): AutomatedPayoutConfig {
    return this.AUTOMATED_CONFIG;
  }

  /**
   * Update automated payout configuration
   */
  async updateAutomatedPayoutConfig(config: Partial<AutomatedPayoutConfig>): Promise<void> {
    // In a real implementation, this would update the configuration in the database
    // For now, we'll just log the update
    console.log("Automated payout configuration updated:", config);
  }

  /**
   * Get payout processing queue with priority
   */
  async getPayoutProcessingQueue(limit: number = 50) {
    try {
      const queue = await db
        .select({
          id: payouts.id,
          supplierId: payouts.supplierId,
          amount: payouts.amount,
          netAmount: payouts.netAmount,
          method: payouts.method,
          scheduledDate: payouts.scheduledDate,
          createdAt: payouts.createdAt,
          supplierName: supplierProfiles.businessName,
          membershipTier: supplierProfiles.membershipTier,
        })
        .from(payouts)
        .leftJoin(supplierProfiles, eq(payouts.supplierId, supplierProfiles.id))
        .where(eq(payouts.status, 'pending'))
        .orderBy(
          // Priority: higher tier suppliers first, then by amount, then by date
          sql`CASE ${supplierProfiles.membershipTier} 
            WHEN 'platinum' THEN 1 
            WHEN 'gold' THEN 2 
            WHEN 'silver' THEN 3 
            ELSE 4 END`,
          desc(payouts.netAmount),
          payouts.scheduledDate
        )
        .limit(limit);

      return queue.map(item => ({
        ...item,
        amount: Number(item.amount),
        netAmount: Number(item.netAmount),
      }));
    } catch (error) {
      console.error("Error getting payout processing queue:", error);
      return [];
    }
  }

  /**
   * Bulk approve payouts
   */
  async bulkApprovePayouts(payoutIds: string[], approvedBy: string): Promise<{
    approved: number;
    failed: number;
    errors: string[];
  }> {
    try {
      let approved = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const payoutId of payoutIds) {
        try {
          await db
            .update(payouts)
            .set({
              status: 'processing',
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(payouts.id, payoutId),
                eq(payouts.status, 'pending')
              )
            );
          approved++;
        } catch (error) {
          failed++;
          errors.push(`Failed to approve payout ${payoutId}: ${(error as Error).message}`);
        }
      }

      return { approved, failed, errors };
    } catch (error) {
      console.error("Error bulk approving payouts:", error);
      throw new Error("Failed to bulk approve payouts");
    }
  }
}

export const payoutService = PayoutService.getInstance();