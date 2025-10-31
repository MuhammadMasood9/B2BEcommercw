import { db } from './db';
import { 
  notificationQueue,
  communicationRecipients,
  bulkCommunications,
  communicationAnalytics,
  notificationPreferences,
  unsubscribeRequests,
  users
} from '@shared/schema';
import { eq, and, or, lte, inArray } from 'drizzle-orm';

export interface NotificationChannel {
  send(notification: QueuedNotification): Promise<DeliveryResult>;
}

export interface QueuedNotification {
  id: string;
  userId: string;
  channel: string;
  notificationType: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  priority: number;
  scheduledAt: Date;
  attempts: number;
  maxAttempts: number;
  communicationId?: string;
  templateId?: string;
  ruleId?: string;
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

// Mock email service - replace with actual email service (SendGrid, AWS SES, etc.)
class EmailChannel implements NotificationChannel {
  async send(notification: QueuedNotification): Promise<DeliveryResult> {
    try {
      // Simulate email sending
      console.log(`Sending email to ${notification.recipientEmail}:`);
      console.log(`Subject: ${notification.subject}`);
      console.log(`Content: ${notification.content.substring(0, 100)}...`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate 95% success rate
      const success = Math.random() > 0.05;
      
      if (success) {
        return {
          success: true,
          messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deliveredAt: new Date(),
        };
      } else {
        return {
          success: false,
          error: 'Email delivery failed - recipient mailbox full',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }
}

// Mock SMS service - replace with actual SMS service (Twilio, AWS SNS, etc.)
class SMSChannel implements NotificationChannel {
  async send(notification: QueuedNotification): Promise<DeliveryResult> {
    try {
      console.log(`Sending SMS to ${notification.recipientPhone}:`);
      console.log(`Content: ${notification.content.substring(0, 160)}...`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Simulate 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        return {
          success: true,
          messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deliveredAt: new Date(),
        };
      } else {
        return {
          success: false,
          error: 'SMS delivery failed - invalid phone number',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error',
      };
    }
  }
}

// Mock push notification service
class PushChannel implements NotificationChannel {
  async send(notification: QueuedNotification): Promise<DeliveryResult> {
    try {
      console.log(`Sending push notification to user ${notification.userId}:`);
      console.log(`Content: ${notification.content.substring(0, 100)}...`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simulate 85% success rate
      const success = Math.random() > 0.15;
      
      if (success) {
        return {
          success: true,
          messageId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deliveredAt: new Date(),
        };
      } else {
        return {
          success: false,
          error: 'Push notification failed - device not registered',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown push error',
      };
    }
  }
}

// In-app notification channel
class InAppChannel implements NotificationChannel {
  async send(notification: QueuedNotification): Promise<DeliveryResult> {
    try {
      // Create in-app notification record
      await db.insert(notifications).values({
        userId: notification.userId,
        type: 'info',
        title: notification.subject || 'Notification',
        message: notification.content,
        relatedId: notification.communicationId,
        relatedType: 'communication',
      });
      
      return {
        success: true,
        messageId: `inapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown in-app error',
      };
    }
  }
}

export class NotificationProcessor {
  private channels: Map<string, NotificationChannel>;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.channels = new Map([
      ['email', new EmailChannel()],
      ['sms', new SMSChannel()],
      ['push', new PushChannel()],
      ['in_app', new InAppChannel()],
    ]);
  }

  // Start the notification processor
  start(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      console.log('Notification processor is already running');
      return;
    }

    console.log(`Starting notification processor with ${intervalMs}ms interval`);
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    // Process immediately on start
    this.processQueue();
  }

  // Stop the notification processor
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Notification processor stopped');
    }
  }

  // Process the notification queue
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;

    try {
      // Get notifications ready to be sent
      const notifications = await db.select()
        .from(notificationQueue)
        .where(
          and(
            eq(notificationQueue.status, 'queued'),
            lte(notificationQueue.scheduledAt, new Date())
          )
        )
        .orderBy(notificationQueue.priority, notificationQueue.scheduledAt)
        .limit(50); // Process in batches

      if (notifications.length === 0) {
        return;
      }

      console.log(`Processing ${notifications.length} notifications`);

      // Process each notification
      for (const notification of notifications) {
        await this.processNotification(notification as QueuedNotification);
      }

    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process a single notification
  private async processNotification(notification: QueuedNotification): Promise<void> {
    try {
      // Update status to processing
      await db.update(notificationQueue)
        .set({ 
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(notificationQueue.id, notification.id));

      // Check if user has unsubscribed
      const isUnsubscribed = await this.checkUnsubscribeStatus(notification.userId, notification.channel);
      if (isUnsubscribed) {
        await this.markNotificationCancelled(notification.id, 'User has unsubscribed');
        return;
      }

      // Check user preferences
      const preferencesAllow = await this.checkUserPreferences(notification.userId, notification.channel);
      if (!preferencesAllow) {
        await this.markNotificationCancelled(notification.id, 'User preferences do not allow this channel');
        return;
      }

      // Get the appropriate channel
      const channel = this.channels.get(notification.channel);
      if (!channel) {
        await this.markNotificationFailed(notification.id, `Unsupported channel: ${notification.channel}`);
        return;
      }

      // Send the notification
      const result = await channel.send(notification);

      if (result.success) {
        await this.markNotificationSent(notification.id, result.messageId, result.deliveredAt);
        
        // Update communication recipient status if applicable
        if (notification.communicationId) {
          await this.updateRecipientStatus(notification.communicationId, notification.userId, notification.channel, 'sent');
        }
      } else {
        await this.handleNotificationFailure(notification, result.error || 'Unknown error');
      }

    } catch (error) {
      console.error(`Error processing notification ${notification.id}:`, error);
      await this.handleNotificationFailure(notification, error instanceof Error ? error.message : 'Processing error');
    }
  }

  // Check if user has unsubscribed
  private async checkUnsubscribeStatus(userId: string, channel: string): Promise<boolean> {
    try {
      const [unsubscribe] = await db.select()
        .from(unsubscribeRequests)
        .where(
          and(
            eq(unsubscribeRequests.userId, userId),
            eq(unsubscribeRequests.status, 'active'),
            or(
              eq(unsubscribeRequests.unsubscribeType, 'all'),
              eq(unsubscribeRequests.unsubscribeType, channel)
            )
          )
        );

      return !!unsubscribe;
    } catch (error) {
      console.error('Error checking unsubscribe status:', error);
      return false;
    }
  }

  // Check user notification preferences
  private async checkUserPreferences(userId: string, channel: string): Promise<boolean> {
    try {
      const [preferences] = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));

      if (!preferences) {
        return true; // Default to allowing if no preferences set
      }

      switch (channel) {
        case 'email':
          return preferences.emailEnabled !== false;
        case 'sms':
          return preferences.smsEnabled === true;
        case 'push':
          return preferences.pushEnabled !== false;
        case 'in_app':
          return preferences.inAppEnabled !== false;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking user preferences:', error);
      return true; // Default to allowing on error
    }
  }

  // Mark notification as sent
  private async markNotificationSent(notificationId: string, messageId?: string, deliveredAt?: Date): Promise<void> {
    await db.update(notificationQueue)
      .set({
        status: 'sent',
        processedAt: deliveredAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationQueue.id, notificationId));
  }

  // Mark notification as failed
  private async markNotificationFailed(notificationId: string, error: string): Promise<void> {
    await db.update(notificationQueue)
      .set({
        status: 'failed',
        errorMessage: error,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationQueue.id, notificationId));
  }

  // Mark notification as cancelled
  private async markNotificationCancelled(notificationId: string, reason: string): Promise<void> {
    await db.update(notificationQueue)
      .set({
        status: 'cancelled',
        errorMessage: reason,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationQueue.id, notificationId));
  }

  // Handle notification failure with retry logic
  private async handleNotificationFailure(notification: QueuedNotification, error: string): Promise<void> {
    const newAttempts = notification.attempts + 1;

    if (newAttempts >= notification.maxAttempts) {
      // Max attempts reached, mark as failed
      await this.markNotificationFailed(notification.id, `Max attempts reached. Last error: ${error}`);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(300000, Math.pow(2, newAttempts) * 1000); // Max 5 minutes
      const nextRetryAt = new Date(Date.now() + retryDelay);

      await db.update(notificationQueue)
        .set({
          status: 'queued',
          attempts: newAttempts,
          errorMessage: error,
          nextRetryAt,
          updatedAt: new Date(),
        })
        .where(eq(notificationQueue.id, notification.id));
    }
  }

  // Update communication recipient status
  private async updateRecipientStatus(
    communicationId: string, 
    userId: string, 
    channel: string, 
    status: string
  ): Promise<void> {
    try {
      const statusField = `${channel}Status` as keyof typeof communicationRecipients;
      const timestampField = `${channel}SentAt` as keyof typeof communicationRecipients;

      const updateData: any = {
        [statusField]: status,
        updatedAt: new Date(),
      };

      if (status === 'sent') {
        updateData[timestampField] = new Date();
      }

      await db.update(communicationRecipients)
        .set(updateData)
        .where(
          and(
            eq(communicationRecipients.communicationId, communicationId),
            eq(communicationRecipients.userId, userId)
          )
        );
    } catch (error) {
      console.error('Error updating recipient status:', error);
    }
  }

  // Get queue statistics
  async getQueueStats(): Promise<any> {
    try {
      const [stats] = await db.select({
        queued: sql<number>`COUNT(CASE WHEN status = 'queued' THEN 1 END)`,
        processing: sql<number>`COUNT(CASE WHEN status = 'processing' THEN 1 END)`,
        sent: sql<number>`COUNT(CASE WHEN status = 'sent' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN status = 'failed' THEN 1 END)`,
        cancelled: sql<number>`COUNT(CASE WHEN status = 'cancelled' THEN 1 END)`,
      }).from(notificationQueue);

      return stats;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {
        queued: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
      };
    }
  }
}

// Create and export singleton instance
export const notificationProcessor = new NotificationProcessor();

// Auto-start the processor
notificationProcessor.start();