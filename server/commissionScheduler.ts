import { db } from './db';
import { commissions, supplierProfiles, users } from '@shared/schema';
import { eq, and, lt, or, lte } from 'drizzle-orm';
import { notificationService } from './notificationService';

/**
 * Commission Scheduler Service
 * Implements Task 10: Overdue tracking and reminders
 * - Marks overdue commissions daily
 * - Sends automated email reminders (day 0, 7, 14)
 */

export class CommissionScheduler {
  private dailyJobInterval: NodeJS.Timeout | null = null;

  /**
   * Start the daily job scheduler
   * Runs every 24 hours to check for overdue commissions
   */
  start() {
    console.log('🕐 Commission Scheduler: Starting daily job...');
    
    // Run immediately on startup
    this.runDailyJob();
    
    // Schedule to run every 24 hours
    this.dailyJobInterval = setInterval(() => {
      this.runDailyJob();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    console.log('✅ Commission Scheduler: Daily job scheduled');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.dailyJobInterval) {
      clearInterval(this.dailyJobInterval);
      this.dailyJobInterval = null;
      console.log('⏹️ Commission Scheduler: Stopped');
    }
  }

  /**
   * Run the daily job to mark overdue commissions and send reminders
   */
  async runDailyJob() {
    try {
      console.log('=== COMMISSION DAILY JOB START ===');
      console.log('Timestamp:', new Date().toISOString());

      await this.markOverdueCommissions();
      await this.sendAutomatedReminders();

      console.log('=== COMMISSION DAILY JOB COMPLETE ===');
    } catch (error) {
      console.error('❌ Error in commission daily job:', error);
    }
  }

  /**
   * Mark commissions as overdue when due date has passed
   * Implements Requirement 10.1: Mark overdue commissions
   */
  async markOverdueCommissions() {
    try {
      console.log('--- Marking Overdue Commissions ---');
      
      const now = new Date();
      
      // Find all unpaid commissions with due date in the past
      const overdueCommissions = await db.select()
        .from(commissions)
        .where(and(
          eq(commissions.status, 'unpaid'),
          lt(commissions.dueDate, now)
        ));

      console.log(`Found ${overdueCommissions.length} commissions to mark as overdue`);

      if (overdueCommissions.length === 0) {
        console.log('✅ No commissions to mark as overdue');
        return;
      }

      // Update status to overdue
      for (const commission of overdueCommissions) {
        await db.update(commissions)
          .set({ status: 'overdue' })
          .where(eq(commissions.id, commission.id));

        console.log(`✅ Marked commission ${commission.id} as overdue`);
      }

      console.log(`✅ Marked ${overdueCommissions.length} commissions as overdue`);
    } catch (error) {
      console.error('❌ Error marking overdue commissions:', error);
      throw error;
    }
  }

  /**
   * Send automated reminders for overdue commissions
   * Implements Requirements 10.2, 10.3, 10.4:
   * - Day 0: Commission becomes overdue
   * - Day 7: First reminder
   * - Day 14: Final warning
   */
  async sendAutomatedReminders() {
    try {
      console.log('--- Sending Automated Reminders ---');
      
      const now = new Date();
      
      // Get all overdue commissions with supplier details
      const overdueCommissions = await db.select({
        commissionId: commissions.id,
        supplierId: commissions.supplierId,
        commissionAmount: commissions.commissionAmount,
        dueDate: commissions.dueDate,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        totalUnpaid: supplierProfiles.totalUnpaidCommission,
        paymentReminderSentAt: supplierProfiles.paymentReminderSentAt
      })
      .from(commissions)
      .leftJoin(supplierProfiles, eq(commissions.supplierId, supplierProfiles.id))
      .where(or(
        eq(commissions.status, 'overdue'),
        eq(commissions.status, 'payment_submitted')
      ));

      console.log(`Found ${overdueCommissions.length} overdue commissions to process`);

      // Group by supplier
      const supplierCommissions = new Map<string, typeof overdueCommissions>();
      
      for (const commission of overdueCommissions) {
        if (!commission.supplierId) continue;
        
        if (!supplierCommissions.has(commission.supplierId)) {
          supplierCommissions.set(commission.supplierId, []);
        }
        supplierCommissions.get(commission.supplierId)!.push(commission);
      }

      console.log(`Processing reminders for ${supplierCommissions.size} suppliers`);

      // Process each supplier
      for (const [supplierId, commissions] of Array.from(supplierCommissions.entries())) {
        await this.processSupplierReminders(supplierId, commissions);
      }

      console.log('✅ Automated reminders sent');
    } catch (error) {
      console.error('❌ Error sending automated reminders:', error);
      throw error;
    }
  }

  /**
   * Process reminders for a specific supplier
   */
  private async processSupplierReminders(
    supplierId: string,
    commissions: Array<{
      commissionId: string;
      supplierId: string;
      commissionAmount: string;
      dueDate: Date | null;
      userId: string | null;
      businessName: string | null;
      totalUnpaid: string | null;
      paymentReminderSentAt: Date | null;
    }>
  ) {
    try {
      if (commissions.length === 0 || !commissions[0].userId) {
        return;
      }

      const now = new Date();
      const userId = commissions[0].userId;
      const businessName = commissions[0].businessName;
      const totalUnpaid = parseFloat(commissions[0].totalUnpaid || '0');
      const lastReminderSent = commissions[0].paymentReminderSentAt;

      // Find the oldest overdue commission
      const oldestCommission = commissions.reduce((oldest, current) => {
        if (!current.dueDate) return oldest;
        if (!oldest.dueDate) return current;
        return current.dueDate < oldest.dueDate ? current : oldest;
      });

      if (!oldestCommission.dueDate) {
        return;
      }

      // Calculate days overdue
      const daysOverdue = Math.floor(
        (now.getTime() - oldestCommission.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log(`Supplier ${businessName}: ${daysOverdue} days overdue, ${commissions.length} commissions`);

      // Determine if we should send a reminder
      let shouldSendReminder = false;
      let reminderType: 'day0' | 'day7' | 'day14' | null = null;

      if (daysOverdue === 0 && !lastReminderSent) {
        // Day 0: Commission just became overdue
        shouldSendReminder = true;
        reminderType = 'day0';
      } else if (daysOverdue >= 7 && daysOverdue < 14) {
        // Day 7: First reminder (only if no reminder sent in last 7 days)
        if (!lastReminderSent || this.daysSince(lastReminderSent) >= 7) {
          shouldSendReminder = true;
          reminderType = 'day7';
        }
      } else if (daysOverdue >= 14) {
        // Day 14: Final warning (only if no reminder sent in last 7 days)
        if (!lastReminderSent || this.daysSince(lastReminderSent) >= 7) {
          shouldSendReminder = true;
          reminderType = 'day14';
        }
      }

      if (shouldSendReminder && reminderType) {
        await this.sendReminder(userId, supplierId, reminderType, {
          totalUnpaid,
          commissionCount: commissions.length,
          daysOverdue
        });
      }
    } catch (error) {
      console.error(`❌ Error processing reminders for supplier ${supplierId}:`, error);
    }
  }

  /**
   * Send a reminder notification to supplier
   */
  private async sendReminder(
    userId: string,
    supplierId: string,
    reminderType: 'day0' | 'day7' | 'day14',
    details: {
      totalUnpaid: number;
      commissionCount: number;
      daysOverdue: number;
    }
  ) {
    try {
      const { totalUnpaid, commissionCount, daysOverdue } = details;

      let title: string;
      let message: string;
      let type: 'warning' | 'error';

      switch (reminderType) {
        case 'day0':
          title = 'Commission Payment Overdue';
          message = `You have ${commissionCount} overdue commission(s) totaling ₹${totalUnpaid.toFixed(2)}. Please submit payment to avoid account restrictions.`;
          type = 'warning';
          break;
        
        case 'day7':
          title = 'Payment Reminder: 7 Days Overdue';
          message = `Your commission payment of ₹${totalUnpaid.toFixed(2)} is ${daysOverdue} days overdue. Please submit payment immediately to restore full account access.`;
          type = 'warning';
          break;
        
        case 'day14':
          title = 'Final Warning: 14 Days Overdue';
          message = `URGENT: Your commission payment of ₹${totalUnpaid.toFixed(2)} is ${daysOverdue} days overdue. Account restrictions may be applied. Please submit payment immediately.`;
          type = 'error';
          break;
      }

      // Send notification
      await notificationService.createNotification({
        userId,
        type,
        title,
        message,
        relatedType: 'commission'
      });

      // Update last reminder sent timestamp
      await db.update(supplierProfiles)
        .set({
          paymentReminderSentAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId));

      console.log(`✅ Sent ${reminderType} reminder to supplier ${supplierId}`);
    } catch (error) {
      console.error(`❌ Error sending reminder to supplier ${supplierId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate days since a date
   */
  private daysSince(date: Date): number {
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Manual reminder - can be triggered by admin
   * Implements Requirement 10.5: Manual payment reminders
   */
  async sendManualReminder(supplierId: string, adminId: string): Promise<void> {
    try {
      console.log('=== MANUAL PAYMENT REMINDER ===');
      console.log('Supplier ID:', supplierId);
      console.log('Admin ID:', adminId);

      // Get supplier details
      const supplier = await db.select({
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        totalUnpaid: supplierProfiles.totalUnpaidCommission
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

      if (supplier.length === 0) {
        throw new Error('Supplier not found');
      }

      const { userId, businessName, totalUnpaid } = supplier[0];
      const totalUnpaidAmount = parseFloat(totalUnpaid || '0');

      // Get overdue commissions count
      const overdueCommissions = await db.select()
        .from(commissions)
        .where(and(
          eq(commissions.supplierId, supplierId),
          or(
            eq(commissions.status, 'overdue'),
            eq(commissions.status, 'unpaid')
          )
        ));

      // Send notification
      await notificationService.createNotification({
        userId,
        type: 'warning',
        title: 'Payment Reminder from Admin',
        message: `You have ${overdueCommissions.length} unpaid commission(s) totaling ₹${totalUnpaidAmount.toFixed(2)}. Please submit payment at your earliest convenience.`,
        relatedType: 'commission'
      });

      // Update last reminder sent timestamp
      await db.update(supplierProfiles)
        .set({
          paymentReminderSentAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId));

      console.log(`✅ Manual reminder sent to ${businessName}`);
    } catch (error) {
      console.error('❌ Error sending manual reminder:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const commissionScheduler = new CommissionScheduler();
