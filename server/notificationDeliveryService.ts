import { db } from './db';
import { 
  notificationQueue, 
  notificationPreferences, 
  unsubscribeRequests,
  notifications,
  users
} from '@shared/schema';
import { eq, and, or, lte, isNull, desc, asc } from 'drizzle-orm';
import { emailTemplateService, TemplateVariables } from './emailTemplateService';

// Notification delivery status
export type DeliveryStatus = 
  | 'pending'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'cancelled';

// Notification channel
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

// Notification priority
export type NotificationPriority = 1 | 2 | 3 | 4 | 5; // 1 = highest, 5 = lowest

// Queue notification options
export interface QueueNotificationOptions {
  userId: string;
  channel: NotificationChannel;
  notificationType: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  templateId?: string;
  communicationId?: string;
  metadata?: Record<string, any>;
}

// Notification preferences interface
export interface UserNotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  marketingEmails: boolean;
  systemNotifications: boolean;
  orderUpdates: boolean;
  inquiryNotifications: boolean;
  promotionalMessages: boolean;
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export class NotificationDeliveryService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000]; // 5min, 30min, 2hr
  private isProcessing = false;

  /**
   * Queue a notification for delivery
   */
  async queueNotification(options: QueueNotificationOptions): Promise<string> {
    try {
      // Check if user has unsubscribed
      const isUnsubscribed = await this.isUserUnsubscribed(options.userId, options.channel);
      
      if (isUnsubscribed) {
        console.log(`User ${options.userId} has unsubscribed from ${options.channel} notifications`);
        throw new Error('User has unsubscribed from this notification channel');
      }
      
      // Check user preferences
      const preferences = await this.getUserPreferences(options.userId);
      
      if (!this.isChannelEnabled(preferences, options.channel, options.notificationType)) {
        console.log(`Channel ${options.channel} is disabled for user ${options.userId}`);
        throw new Error('Notification channel is disabled for this user');
      }
      
      // Get user contact information if not provided
      if (!options.recipientEmail && !options.recipientPhone) {
        const [user] = await db.select()
          .from(users)
          .where(eq(users.id, options.userId));
        
        if (!user) {
          throw new Error('User not found');
        }
        
        options.recipientEmail = user.email;
        options.recipientPhone = user.phone || undefined;
      }
      
      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // Schedule for after quiet hours
        const scheduledAt = this.getNextAvailableTime(preferences);
        options.scheduledAt = scheduledAt;
      }
      
      // Insert into queue
      const [queued] = await db.insert(notificationQueue).values({
        userId: options.userId,
        channel: options.channel,
        notificationType: options.notificationType,
        subject: options.subject,
        content: options.content,
        htmlContent: options.htmlContent,
        recipientEmail: options.recipientEmail,
        recipientPhone: options.recipientPhone,
        priority: options.priority || 5,
        status: 'queued',
        scheduledAt: options.scheduledAt || new Date(),
        templateId: options.templateId,
        communicationId: options.communicationId,
        attempts: 0,
        maxAttempts: this.MAX_RETRIES
      }).returning();
      
      console.log(`Notification queued: ${queued.id} for user ${options.userId}`);
      
      // Trigger processing if not already running
      if (!this.isProcessing) {
        this.processQueue().catch(console.error);
      }
      
      return queued.id;
    } catch (error) {
      console.error('Error queueing notification:', error);
      throw error;
    }
  }

  /**
   * Process notification queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      console.log('Processing notification queue...');
      
      // Get pending notifications that are due
      const pendingNotifications = await db.select()
        .from(notificationQueue)
        .where(
          and(
            or(
              eq(notificationQueue.status, 'queued'),
              eq(notificationQueue.status, 'failed')
            ),
            lte(notificationQueue.scheduledAt, new Date()),
            or(
              isNull(notificationQueue.nextRetryAt),
              lte(notificationQueue.nextRetryAt, new Date())
            )
          )
        )
        .orderBy(
          asc(notificationQueue.priority),
          asc(notificationQueue.scheduledAt)
        )
        .limit(50);
      
      console.log(`Found ${pendingNotifications.length} notifications to process`);
      
      // Process each notification
      for (const notification of pendingNotifications) {
        try {
          await this.processNotification(notification);
        } catch (error) {
          console.error(`Error processing notification ${notification.id}:`, error);
        }
      }
      
      console.log('Queue processing complete');
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single notification
   */
  private async processNotification(notification: any): Promise<void> {
    try {
      console.log(`Processing notification ${notification.id} via ${notification.channel}`);
      
      // Update status to processing
      await db.update(notificationQueue)
        .set({ status: 'processing' })
        .where(eq(notificationQueue.id, notification.id));
      
      // Deliver based on channel
      let delivered = false;
      
      switch (notification.channel) {
        case 'email':
          delivered = await this.deliverEmail(notification);
          break;
        case 'sms':
          delivered = await this.deliverSMS(notification);
          break;
        case 'push':
          delivered = await this.deliverPush(notification);
          break;
        case 'in_app':
          delivered = await this.deliverInApp(notification);
          break;
        default:
          console.error(`Unknown channel: ${notification.channel}`);
          delivered = false;
      }
      
      if (delivered) {
        // Mark as sent
        await db.update(notificationQueue)
          .set({
            status: 'sent',
            processedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(notificationQueue.id, notification.id));
        
        console.log(`✓ Notification ${notification.id} delivered successfully`);
      } else {
        // Handle failure
        await this.handleDeliveryFailure(notification);
      }
    } catch (error) {
      console.error(`Error processing notification ${notification.id}:`, error);
      await this.handleDeliveryFailure(notification, error);
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmail(notification: any): Promise<boolean> {
    try {
      if (!notification.recipientEmail) {
        throw new Error('Recipient email not provided');
      }
      
      // Mock email delivery for development
      console.log('=== EMAIL NOTIFICATION ===');
      console.log('To:', notification.recipientEmail);
      console.log('Subject:', notification.subject);
      console.log('Content:', notification.content.substring(0, 100) + '...');
      console.log('========================');
      
      // In production, integrate with email service:
      // - SendGrid
      // - Resend
      // - AWS SES
      // - Mailgun
      
      return true;
    } catch (error) {
      console.error('Error delivering email:', error);
      return false;
    }
  }

  /**
   * Deliver SMS notification
   */
  private async deliverSMS(notification: any): Promise<boolean> {
    try {
      if (!notification.recipientPhone) {
        throw new Error('Recipient phone not provided');
      }
      
      // Mock SMS delivery for development
      console.log('=== SMS NOTIFICATION ===');
      console.log('To:', notification.recipientPhone);
      console.log('Content:', notification.content);
      console.log('=======================');
      
      // In production, integrate with SMS service:
      // - Twilio
      // - AWS SNS
      // - Vonage (Nexmo)
      
      return true;
    } catch (error) {
      console.error('Error delivering SMS:', error);
      return false;
    }
  }

  /**
   * Deliver push notification
   */
  private async deliverPush(notification: any): Promise<boolean> {
    try {
      // Mock push notification delivery for development
      console.log('=== PUSH NOTIFICATION ===');
      console.log('User:', notification.userId);
      console.log('Title:', notification.subject);
      console.log('Content:', notification.content);
      console.log('========================');
      
      // In production, integrate with push service:
      // - Firebase Cloud Messaging (FCM)
      // - Apple Push Notification Service (APNS)
      // - OneSignal
      
      return true;
    } catch (error) {
      console.error('Error delivering push notification:', error);
      return false;
    }
  }

  /**
   * Deliver in-app notification
   */
  private async deliverInApp(notification: any): Promise<boolean> {
    try {
      // Create in-app notification
      await db.insert(notifications).values({
        userId: notification.userId,
        type: 'info',
        title: notification.subject || 'Notification',
        message: notification.content,
        relatedId: notification.metadata?.relatedId,
        relatedType: notification.metadata?.relatedType,
        read: false
      });
      
      console.log(`✓ In-app notification created for user ${notification.userId}`);
      
      return true;
    } catch (error) {
      console.error('Error delivering in-app notification:', error);
      return false;
    }
  }

  /**
   * Handle delivery failure
   */
  private async handleDeliveryFailure(notification: any, error?: any): Promise<void> {
    try {
      const attempts = notification.attempts + 1;
      
      if (attempts >= this.MAX_RETRIES) {
        // Max retries reached, mark as failed
        await db.update(notificationQueue)
          .set({
            status: 'failed',
            attempts,
            errorMessage: error?.message || 'Max retries exceeded',
            processedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(notificationQueue.id, notification.id));
        
        console.log(`✗ Notification ${notification.id} failed after ${attempts} attempts`);
      } else {
        // Schedule retry
        const retryDelay = this.RETRY_DELAYS[attempts - 1] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        const nextRetryAt = new Date(Date.now() + retryDelay);
        
        await db.update(notificationQueue)
          .set({
            status: 'failed',
            attempts,
            nextRetryAt,
            errorMessage: error?.message || 'Delivery failed',
            updatedAt: new Date()
          })
          .where(eq(notificationQueue.id, notification.id));
        
        console.log(`⟳ Notification ${notification.id} scheduled for retry ${attempts} at ${nextRetryAt}`);
      }
    } catch (error) {
      console.error('Error handling delivery failure:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    try {
      const [preferences] = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      // Return default preferences if none found
      if (!preferences) {
        return {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          inAppEnabled: true,
          marketingEmails: true,
          systemNotifications: true,
          orderUpdates: true,
          inquiryNotifications: true,
          promotionalMessages: false,
          digestFrequency: 'immediate' as const,
          quietHoursStart: undefined,
          quietHoursEnd: undefined,
          timezone: 'UTC'
        };
      }
      
      // Map database fields to interface
      return {
        userId: preferences.userId,
        emailEnabled: preferences.emailEnabled ?? true,
        smsEnabled: preferences.smsEnabled ?? false,
        pushEnabled: preferences.pushEnabled ?? true,
        inAppEnabled: preferences.inAppEnabled ?? true,
        marketingEmails: preferences.marketingEmails ?? true,
        systemNotifications: preferences.systemNotifications ?? true,
        orderUpdates: preferences.orderUpdates ?? true,
        inquiryNotifications: preferences.inquiryNotifications ?? true,
        promotionalMessages: preferences.promotionalMessages ?? false,
        digestFrequency: (preferences.digestFrequency as 'immediate' | 'hourly' | 'daily' | 'weekly') || 'immediate',
        quietHoursStart: preferences.quietHoursStart || undefined,
        quietHoursEnd: preferences.quietHoursEnd || undefined,
        timezone: preferences.timezone || 'UTC'
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      // Return default preferences on error
      return {
        userId,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
        marketingEmails: true,
        systemNotifications: true,
        orderUpdates: true,
        inquiryNotifications: true,
        promotionalMessages: false,
        digestFrequency: 'immediate' as const,
        quietHoursStart: undefined,
        quietHoursEnd: undefined,
        timezone: 'UTC'
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserNotificationPreferences>
  ): Promise<UserNotificationPreferences> {
    try {
      // Check if preferences exist
      const [existing] = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      if (existing) {
        // Update existing preferences
        const [updated] = await db.update(notificationPreferences)
          .set({
            ...preferences,
            updatedAt: new Date()
          })
          .where(eq(notificationPreferences.userId, userId))
          .returning();
        
        // Map to interface
        return {
          userId: updated.userId,
          emailEnabled: updated.emailEnabled ?? true,
          smsEnabled: updated.smsEnabled ?? false,
          pushEnabled: updated.pushEnabled ?? true,
          inAppEnabled: updated.inAppEnabled ?? true,
          marketingEmails: updated.marketingEmails ?? true,
          systemNotifications: updated.systemNotifications ?? true,
          orderUpdates: updated.orderUpdates ?? true,
          inquiryNotifications: updated.inquiryNotifications ?? true,
          promotionalMessages: updated.promotionalMessages ?? false,
          digestFrequency: (updated.digestFrequency as 'immediate' | 'hourly' | 'daily' | 'weekly') || 'immediate',
          quietHoursStart: updated.quietHoursStart || undefined,
          quietHoursEnd: updated.quietHoursEnd || undefined,
          timezone: updated.timezone || 'UTC'
        };
      } else {
        // Create new preferences
        const [created] = await db.insert(notificationPreferences)
          .values({
            userId,
            ...preferences
          })
          .returning();
        
        // Map to interface
        return {
          userId: created.userId,
          emailEnabled: created.emailEnabled ?? true,
          smsEnabled: created.smsEnabled ?? false,
          pushEnabled: created.pushEnabled ?? true,
          inAppEnabled: created.inAppEnabled ?? true,
          marketingEmails: created.marketingEmails ?? true,
          systemNotifications: created.systemNotifications ?? true,
          orderUpdates: created.orderUpdates ?? true,
          inquiryNotifications: created.inquiryNotifications ?? true,
          promotionalMessages: created.promotionalMessages ?? false,
          digestFrequency: (created.digestFrequency as 'immediate' | 'hourly' | 'daily' | 'weekly') || 'immediate',
          quietHoursStart: created.quietHoursStart || undefined,
          quietHoursEnd: created.quietHoursEnd || undefined,
          timezone: created.timezone || 'UTC'
        };
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Check if user has unsubscribed
   */
  private async isUserUnsubscribed(userId: string, channel: NotificationChannel): Promise<boolean> {
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

  /**
   * Check if channel is enabled for user
   */
  private isChannelEnabled(
    preferences: UserNotificationPreferences,
    channel: NotificationChannel,
    notificationType: string
  ): boolean {
    // Check channel-level preferences
    switch (channel) {
      case 'email':
        if (!preferences.emailEnabled) return false;
        break;
      case 'sms':
        if (!preferences.smsEnabled) return false;
        break;
      case 'push':
        if (!preferences.pushEnabled) return false;
        break;
      case 'in_app':
        if (!preferences.inAppEnabled) return false;
        break;
    }
    
    // Check notification type preferences
    if (notificationType.includes('marketing') && !preferences.marketingEmails) {
      return false;
    }
    
    if (notificationType.includes('promotional') && !preferences.promotionalMessages) {
      return false;
    }
    
    if (notificationType.includes('order') && !preferences.orderUpdates) {
      return false;
    }
    
    if (notificationType.includes('inquiry') && !preferences.inquiryNotifications) {
      return false;
    }
    
    // Quotations are part of order updates
    if (notificationType.includes('quotation') && !preferences.orderUpdates) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * Get next available time after quiet hours
   */
  private getNextAvailableTime(preferences: UserNotificationPreferences): Date {
    if (!preferences.quietHoursEnd) {
      return new Date();
    }
    
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    const nextAvailable = new Date();
    nextAvailable.setHours(endHour, endMin, 0, 0);
    
    // If end time is in the past today, schedule for tomorrow
    if (nextAvailable <= new Date()) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }
    
    return nextAvailable;
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(
    userId: string,
    options?: {
      channel?: NotificationChannel;
      status?: DeliveryStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    try {
      let conditions = [eq(notificationQueue.userId, userId)];
      
      if (options?.channel) {
        conditions.push(eq(notificationQueue.channel, options.channel));
      }
      
      if (options?.status) {
        conditions.push(eq(notificationQueue.status, options.status));
      }
      
      const whereClause = and(...conditions);
      
      const history = await db.select()
        .from(notificationQueue)
        .where(whereClause)
        .orderBy(desc(notificationQueue.createdAt))
        .limit(options?.limit || 50)
        .offset(options?.offset || 0);
      
      return history;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      const [notification] = await db.select()
        .from(notificationQueue)
        .where(eq(notificationQueue.id, notificationId));
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      if (notification.status === 'sent' || notification.status === 'delivered') {
        throw new Error('Cannot cancel already delivered notification');
      }
      
      await db.update(notificationQueue)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(notificationQueue.id, notificationId));
      
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }

  /**
   * Start queue processor (call this on server startup)
   */
  startQueueProcessor(intervalMs: number = 60000): void {
    console.log(`Starting notification queue processor (interval: ${intervalMs}ms)`);
    
    // Process immediately
    this.processQueue().catch(console.error);
    
    // Then process at regular intervals
    setInterval(() => {
      this.processQueue().catch(console.error);
    }, intervalMs);
  }
}

export const notificationDeliveryService = new NotificationDeliveryService();
