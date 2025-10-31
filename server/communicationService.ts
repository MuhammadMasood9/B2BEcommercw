import { db } from './db';
import { 
  communicationTemplates, 
  bulkCommunications, 
  communicationRecipients,
  notificationPreferences,
  communicationAnalytics,
  automatedNotificationRules,
  notificationQueue,
  unsubscribeRequests,
  users,
  supplierProfiles,
  notifications
} from '@shared/schema';
import { eq, and, or, desc, asc, count, sql, inArray, gte, lte } from 'drizzle-orm';

export interface CommunicationTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: string[];
  defaultValues: Record<string, any>;
  targetAudience: string;
  audienceCriteria: Record<string, any>;
  isActive: boolean;
  isSystemTemplate: boolean;
  requiresApproval: boolean;
  isAbTest: boolean;
  abTestConfig: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface BulkCommunication {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  targetType: string;
  targetCriteria: Record<string, any>;
  estimatedRecipients: number;
  actualRecipients: number;
  deliveryMethod: string;
  scheduledAt?: Date;
  deliveryTimezone: string;
  channels: string[];
  channelSettings: Record<string, any>;
  personalizationData: Record<string, any>;
  useDynamicContent: boolean;
  status: string;
  approvalStatus: string;
  approvedBy?: string;
  approvedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  cancelledAt?: Date;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  failedCount: number;
  retryCount: number;
  maxRetries: number;
  errorDetails: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface NotificationDeliveryOptions {
  userId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  subject?: string;
  content: string;
  htmlContent?: string;
  priority?: number;
  scheduledAt?: Date;
  templateId?: string;
  communicationId?: string;
  personalizationData?: Record<string, any>;
}

export class CommunicationService {
  
  // ==================== TEMPLATE MANAGEMENT ====================
  
  async createTemplate(templateData: Partial<CommunicationTemplate>, createdBy: string): Promise<CommunicationTemplate> {
    try {
      const [template] = await db.insert(communicationTemplates).values({
        ...templateData,
        createdBy,
      }).returning();
      
      return template as CommunicationTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create communication template');
    }
  }
  
  async updateTemplate(templateId: string, updates: Partial<CommunicationTemplate>, updatedBy: string): Promise<CommunicationTemplate> {
    try {
      const [template] = await db.update(communicationTemplates)
        .set({
          ...updates,
          updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(communicationTemplates.id, templateId))
        .returning();
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      return template as CommunicationTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update communication template');
    }
  }
  
  async getTemplate(templateId: string): Promise<CommunicationTemplate | null> {
    try {
      const [template] = await db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.id, templateId));
      
      return template as CommunicationTemplate || null;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw new Error('Failed to fetch communication template');
    }
  }
  
  async getTemplates(filters: {
    category?: string;
    type?: string;
    isActive?: boolean;
    targetAudience?: string;
  } = {}): Promise<CommunicationTemplate[]> {
    try {
      let whereConditions = [];
      
      if (filters.category) {
        whereConditions.push(eq(communicationTemplates.category, filters.category));
      }
      
      if (filters.type) {
        whereConditions.push(eq(communicationTemplates.type, filters.type));
      }
      
      if (filters.isActive !== undefined) {
        whereConditions.push(eq(communicationTemplates.isActive, filters.isActive));
      }
      
      if (filters.targetAudience) {
        whereConditions.push(eq(communicationTemplates.targetAudience, filters.targetAudience));
      }
      
      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
      
      const templates = await db.select()
        .from(communicationTemplates)
        .where(whereClause)
        .orderBy(asc(communicationTemplates.name));
      
      return templates as CommunicationTemplate[];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Failed to fetch communication templates');
    }
  }
  
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      // Check if template is system template
      const [template] = await db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.id, templateId));
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      if (template.isSystemTemplate) {
        throw new Error('Cannot delete system template');
      }
      
      await db.delete(communicationTemplates)
        .where(eq(communicationTemplates.id, templateId));
      
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete communication template');
    }
  }
  
  // ==================== BULK COMMUNICATION MANAGEMENT ====================
  
  async createBulkCommunication(communicationData: Partial<BulkCommunication>, createdBy: string): Promise<BulkCommunication> {
    try {
      // Estimate recipients
      const estimatedRecipients = await this.estimateRecipients(
        communicationData.targetCriteria || {},
        communicationData.targetType || 'all'
      );
      
      const [communication] = await db.insert(bulkCommunications).values({
        ...communicationData,
        estimatedRecipients,
        createdBy,
      }).returning();
      
      return communication as BulkCommunication;
    } catch (error) {
      console.error('Error creating bulk communication:', error);
      throw new Error('Failed to create bulk communication');
    }
  }
  
  async getBulkCommunication(communicationId: string): Promise<BulkCommunication | null> {
    try {
      const [communication] = await db.select()
        .from(bulkCommunications)
        .where(eq(bulkCommunications.id, communicationId));
      
      return communication as BulkCommunication || null;
    } catch (error) {
      console.error('Error fetching bulk communication:', error);
      throw new Error('Failed to fetch bulk communication');
    }
  }
  
  async getBulkCommunications(filters: {
    status?: string;
    targetType?: string;
    deliveryMethod?: string;
    createdBy?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ communications: BulkCommunication[]; total: number }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      let whereConditions = [];
      
      if (filters.status) {
        whereConditions.push(eq(bulkCommunications.status, filters.status));
      }
      
      if (filters.targetType) {
        whereConditions.push(eq(bulkCommunications.targetType, filters.targetType));
      }
      
      if (filters.deliveryMethod) {
        whereConditions.push(eq(bulkCommunications.deliveryMethod, filters.deliveryMethod));
      }
      
      if (filters.createdBy) {
        whereConditions.push(eq(bulkCommunications.createdBy, filters.createdBy));
      }
      
      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
      
      const [communications, totalCount] = await Promise.all([
        db.select()
          .from(bulkCommunications)
          .where(whereClause)
          .orderBy(desc(bulkCommunications.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() })
          .from(bulkCommunications)
          .where(whereClause)
      ]);
      
      return {
        communications: communications as BulkCommunication[],
        total: totalCount[0].count,
      };
    } catch (error) {
      console.error('Error fetching bulk communications:', error);
      throw new Error('Failed to fetch bulk communications');
    }
  }
  
  async updateBulkCommunicationStatus(
    communicationId: string, 
    status: string, 
    additionalData: Record<string, any> = {}
  ): Promise<BulkCommunication> {
    try {
      const updateData = {
        status,
        updatedAt: new Date(),
        ...additionalData,
      };
      
      const [communication] = await db.update(bulkCommunications)
        .set(updateData)
        .where(eq(bulkCommunications.id, communicationId))
        .returning();
      
      if (!communication) {
        throw new Error('Communication not found');
      }
      
      return communication as BulkCommunication;
    } catch (error) {
      console.error('Error updating bulk communication status:', error);
      throw new Error('Failed to update bulk communication status');
    }
  }
  
  // ==================== RECIPIENT MANAGEMENT ====================
  
  async estimateRecipients(targetCriteria: Record<string, any>, targetType: string): Promise<number> {
    try {
      if (targetType === 'all') {
        const [result] = await db.select({ count: count() })
          .from(users)
          .where(eq(users.isActive, true));
        return result.count;
      }
      
      let whereConditions = [eq(users.isActive, true)];
      
      // Apply user type filters
      if (targetCriteria.userTypes && targetCriteria.userTypes.length > 0) {
        whereConditions.push(inArray(users.role, targetCriteria.userTypes));
      }
      
      // Apply registration date filters
      if (targetCriteria.registrationDateFrom) {
        whereConditions.push(gte(users.createdAt, new Date(targetCriteria.registrationDateFrom)));
      }
      
      if (targetCriteria.registrationDateTo) {
        whereConditions.push(lte(users.createdAt, new Date(targetCriteria.registrationDateTo)));
      }
      
      // Apply last login filters
      if (targetCriteria.lastLoginFrom) {
        whereConditions.push(gte(users.lastSeen, new Date(targetCriteria.lastLoginFrom)));
      }
      
      if (targetCriteria.lastLoginTo) {
        whereConditions.push(lte(users.lastSeen, new Date(targetCriteria.lastLoginTo)));
      }
      
      const [result] = await db.select({ count: count() })
        .from(users)
        .where(and(...whereConditions));
      
      return result.count;
    } catch (error) {
      console.error('Error estimating recipients:', error);
      return 0;
    }
  }
  
  async getTargetRecipients(targetCriteria: Record<string, any>, targetType: string): Promise<any[]> {
    try {
      if (targetType === 'all') {
        return await db.select()
          .from(users)
          .where(eq(users.isActive, true));
      }
      
      let whereConditions = [eq(users.isActive, true)];
      
      // Apply targeting criteria (similar to estimateRecipients)
      if (targetCriteria.userTypes && targetCriteria.userTypes.length > 0) {
        whereConditions.push(inArray(users.role, targetCriteria.userTypes));
      }
      
      if (targetCriteria.registrationDateFrom) {
        whereConditions.push(gte(users.createdAt, new Date(targetCriteria.registrationDateFrom)));
      }
      
      if (targetCriteria.registrationDateTo) {
        whereConditions.push(lte(users.createdAt, new Date(targetCriteria.registrationDateTo)));
      }
      
      if (targetCriteria.lastLoginFrom) {
        whereConditions.push(gte(users.lastSeen, new Date(targetCriteria.lastLoginFrom)));
      }
      
      if (targetCriteria.lastLoginTo) {
        whereConditions.push(lte(users.lastSeen, new Date(targetCriteria.lastLoginTo)));
      }
      
      return await db.select()
        .from(users)
        .where(and(...whereConditions));
    } catch (error) {
      console.error('Error getting target recipients:', error);
      return [];
    }
  }
  
  // ==================== NOTIFICATION DELIVERY ====================
  
  async queueNotification(options: NotificationDeliveryOptions): Promise<void> {
    try {
      // Check user notification preferences
      const preferences = await this.getUserNotificationPreferences(options.userId);
      
      // Check if user has unsubscribed
      const isUnsubscribed = await this.isUserUnsubscribed(options.userId, options.channel);
      
      if (isUnsubscribed) {
        console.log(`User ${options.userId} has unsubscribed from ${options.channel} notifications`);
        return;
      }
      
      // Check channel preferences
      if (!this.isChannelEnabled(preferences, options.channel)) {
        console.log(`Channel ${options.channel} is disabled for user ${options.userId}`);
        return;
      }
      
      // Get user contact information
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, options.userId));
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Personalize content
      const personalizedContent = this.personalizeContent(options.content, {
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        ...options.personalizationData,
      });
      
      const personalizedHtmlContent = options.htmlContent 
        ? this.personalizeContent(options.htmlContent, {
            firstName: user.firstName,
            lastName: user.lastName,
            companyName: user.companyName,
            ...options.personalizationData,
          })
        : null;
      
      // Queue notification
      await db.insert(notificationQueue).values({
        userId: options.userId,
        channel: options.channel,
        notificationType: 'bulk',
        subject: options.subject,
        content: personalizedContent,
        htmlContent: personalizedHtmlContent,
        recipientEmail: user.email,
        recipientPhone: user.phone,
        priority: options.priority || 5,
        scheduledAt: options.scheduledAt || new Date(),
        communicationId: options.communicationId,
        templateId: options.templateId,
      });
      
    } catch (error) {
      console.error('Error queueing notification:', error);
      throw new Error('Failed to queue notification');
    }
  }
  
  async getUserNotificationPreferences(userId: string): Promise<any> {
    try {
      const [preferences] = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      // Return default preferences if none found
      return preferences || {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
        marketingEmails: true,
        systemNotifications: true,
        orderUpdates: true,
        inquiryNotifications: true,
        promotionalMessages: false,
      };
    } catch (error) {
      console.error('Error fetching user notification preferences:', error);
      return {};
    }
  }
  
  async isUserUnsubscribed(userId: string, channel: string): Promise<boolean> {
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
  
  private isChannelEnabled(preferences: any, channel: string): boolean {
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
  }
  
  private personalizeContent(content: string, personalizationData: Record<string, any>): string {
    let personalizedContent = content;
    
    // Replace common variables
    Object.entries(personalizationData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      personalizedContent = personalizedContent.replace(regex, String(value || ''));
    });
    
    return personalizedContent;
  }
  
  // ==================== ANALYTICS ====================
  
  async getCommunicationAnalytics(communicationId: string): Promise<any> {
    try {
      const analytics = await db.select()
        .from(communicationAnalytics)
        .where(eq(communicationAnalytics.communicationId, communicationId))
        .orderBy(desc(communicationAnalytics.date));
      
      return analytics;
    } catch (error) {
      console.error('Error fetching communication analytics:', error);
      throw new Error('Failed to fetch communication analytics');
    }
  }
  
  async updateCommunicationMetrics(communicationId: string): Promise<void> {
    try {
      // Get recipient statistics
      const recipients = await db.select()
        .from(communicationRecipients)
        .where(eq(communicationRecipients.communicationId, communicationId));
      
      const metrics = {
        sentCount: recipients.filter(r => r.emailStatus !== 'pending').length,
        deliveredCount: recipients.filter(r => r.emailStatus === 'delivered').length,
        openedCount: recipients.filter(r => r.emailOpenedAt).length,
        clickedCount: recipients.filter(r => r.emailClickedAt).length,
        bouncedCount: recipients.filter(r => r.emailStatus === 'bounced').length,
        failedCount: recipients.filter(r => r.emailStatus === 'failed').length,
      };
      
      // Update bulk communication metrics
      await db.update(bulkCommunications)
        .set(metrics)
        .where(eq(bulkCommunications.id, communicationId));
      
    } catch (error) {
      console.error('Error updating communication metrics:', error);
      throw new Error('Failed to update communication metrics');
    }
  }
}

export const communicationService = new CommunicationService();