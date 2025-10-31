import { Router } from 'express';
import { z } from 'zod';
import { db } from './db';
import { 
  communicationTemplates, 
  bulkCommunications, 
  communicationRecipients,
  notificationPreferences,
  communicationAnalytics,
  automatedNotificationRules,
  notificationQueue,
  users,
  supplierProfiles
} from '@shared/schema';
import { eq, and, or, desc, asc, count, sql, inArray } from 'drizzle-orm';

const router = Router();

// ==================== BULK COMMUNICATION API ENDPOINTS ====================

// Create bulk communication schema
const createBulkCommunicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  htmlContent: z.string().optional(),
  targetType: z.enum(['all', 'segment', 'individual', 'custom_query']),
  targetCriteria: z.object({
    userTypes: z.array(z.enum(['supplier', 'buyer', 'admin'])).optional(),
    membershipTiers: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    verificationLevels: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    registrationDateFrom: z.string().optional(),
    registrationDateTo: z.string().optional(),
    lastLoginFrom: z.string().optional(),
    lastLoginTo: z.string().optional(),
    customQuery: z.string().optional(),
  }),
  deliveryMethod: z.enum(['immediate', 'scheduled', 'drip']),
  scheduledAt: z.string().optional(),
  deliveryTimezone: z.string().default('UTC'),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])),
  channelSettings: z.object({
    email: z.object({
      fromName: z.string().optional(),
      fromEmail: z.string().optional(),
      replyTo: z.string().optional(),
    }).optional(),
    sms: z.object({
      fromNumber: z.string().optional(),
    }).optional(),
  }).optional(),
  personalizationData: z.record(z.any()).optional(),
  useDynamicContent: z.boolean().default(false),
});

// POST /api/admin/communications/bulk-messaging
router.post('/bulk-messaging', async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = createBulkCommunicationSchema.parse(req.body);

    // Estimate recipients based on targeting criteria
    const estimatedRecipients = await estimateRecipients(validatedData.targetCriteria, validatedData.targetType);

    // Create bulk communication record
    const [communication] = await db.insert(bulkCommunications).values({
      name: validatedData.name,
      description: validatedData.description,
      templateId: validatedData.templateId,
      subject: validatedData.subject,
      content: validatedData.content,
      htmlContent: validatedData.htmlContent,
      targetType: validatedData.targetType,
      targetCriteria: validatedData.targetCriteria,
      estimatedRecipients,
      deliveryMethod: validatedData.deliveryMethod,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
      deliveryTimezone: validatedData.deliveryTimezone,
      channels: validatedData.channels,
      channelSettings: validatedData.channelSettings || {},
      personalizationData: validatedData.personalizationData || {},
      useDynamicContent: validatedData.useDynamicContent,
      createdBy: adminId,
    }).returning();

    // If immediate delivery, start processing
    if (validatedData.deliveryMethod === 'immediate') {
      await processImmediateCommunication(communication.id);
    }

    res.json({
      success: true,
      communication,
      estimatedRecipients,
    });
  } catch (error) {
    console.error('Error creating bulk communication:', error);
    res.status(500).json({ error: 'Failed to create bulk communication' });
  }
});

// GET /api/admin/communications/bulk-messaging
router.get('/bulk-messaging', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      targetType,
      deliveryMethod,
      search 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(bulkCommunications.status, status as string));
    }
    
    if (targetType) {
      whereConditions.push(eq(bulkCommunications.targetType, targetType as string));
    }
    
    if (deliveryMethod) {
      whereConditions.push(eq(bulkCommunications.deliveryMethod, deliveryMethod as string));
    }
    
    if (search) {
      whereConditions.push(
        or(
          sql`${bulkCommunications.name} ILIKE ${`%${search}%`}`,
          sql`${bulkCommunications.description} ILIKE ${`%${search}%`}`
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [communications, totalCount] = await Promise.all([
      db.select()
        .from(bulkCommunications)
        .where(whereClause)
        .orderBy(desc(bulkCommunications.createdAt))
        .limit(Number(limit))
        .offset(offset),
      db.select({ count: count() })
        .from(bulkCommunications)
        .where(whereClause)
    ]);

    res.json({
      communications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching bulk communications:', error);
    res.status(500).json({ error: 'Failed to fetch bulk communications' });
  }
});

// GET /api/admin/communications/bulk-messaging/:id
router.get('/bulk-messaging/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [communication] = await db.select()
      .from(bulkCommunications)
      .where(eq(bulkCommunications.id, id));

    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    // Get recipients data
    const recipients = await db.select()
      .from(communicationRecipients)
      .where(eq(communicationRecipients.communicationId, id))
      .limit(100); // Limit for performance

    // Get analytics data
    const analytics = await db.select()
      .from(communicationAnalytics)
      .where(eq(communicationAnalytics.communicationId, id));

    res.json({
      communication,
      recipients,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching communication details:', error);
    res.status(500).json({ error: 'Failed to fetch communication details' });
  }
});

// POST /api/admin/communications/bulk-messaging/:id/send
router.post('/bulk-messaging/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const [communication] = await db.select()
      .from(bulkCommunications)
      .where(eq(bulkCommunications.id, id));

    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    if (communication.status !== 'draft') {
      return res.status(400).json({ error: 'Communication is not in draft status' });
    }

    // Update status to sending
    await db.update(bulkCommunications)
      .set({ 
        status: 'sending',
        startedAt: new Date(),
        approvedBy: adminId,
        approvedAt: new Date(),
      })
      .where(eq(bulkCommunications.id, id));

    // Start processing
    await processImmediateCommunication(id);

    res.json({ success: true, message: 'Communication sending started' });
  } catch (error) {
    console.error('Error sending communication:', error);
    res.status(500).json({ error: 'Failed to send communication' });
  }
});

// POST /api/admin/communications/bulk-messaging/:id/pause
router.post('/bulk-messaging/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;

    await db.update(bulkCommunications)
      .set({ 
        status: 'paused',
        pausedAt: new Date(),
      })
      .where(eq(bulkCommunications.id, id));

    res.json({ success: true, message: 'Communication paused' });
  } catch (error) {
    console.error('Error pausing communication:', error);
    res.status(500).json({ error: 'Failed to pause communication' });
  }
});

// POST /api/admin/communications/bulk-messaging/:id/cancel
router.post('/bulk-messaging/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    await db.update(bulkCommunications)
      .set({ 
        status: 'cancelled',
        cancelledAt: new Date(),
      })
      .where(eq(bulkCommunications.id, id));

    res.json({ success: true, message: 'Communication cancelled' });
  } catch (error) {
    console.error('Error cancelling communication:', error);
    res.status(500).json({ error: 'Failed to cancel communication' });
  }
});

// ==================== TEMPLATE MANAGEMENT API ====================

// GET /api/admin/communications/templates
router.get('/templates', async (req, res) => {
  try {
    const { category, type, isActive } = req.query;
    
    let whereConditions = [];
    
    if (category) {
      whereConditions.push(eq(communicationTemplates.category, category as string));
    }
    
    if (type) {
      whereConditions.push(eq(communicationTemplates.type, type as string));
    }
    
    if (isActive !== undefined) {
      whereConditions.push(eq(communicationTemplates.isActive, isActive === 'true'));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const templates = await db.select()
      .from(communicationTemplates)
      .where(whereClause)
      .orderBy(asc(communicationTemplates.name));

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/admin/communications/templates
router.post('/templates', async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const templateSchema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(['announcement', 'policy_update', 'promotional', 'system_notification', 'approval', 'rejection']),
      type: z.enum(['email', 'sms', 'push', 'in_app']),
      subject: z.string().optional(),
      content: z.string().min(1),
      htmlContent: z.string().optional(),
      variables: z.array(z.string()).default([]),
      defaultValues: z.record(z.any()).default({}),
      targetAudience: z.enum(['all', 'suppliers', 'buyers', 'admins', 'custom']),
      audienceCriteria: z.record(z.any()).default({}),
    });

    const validatedData = templateSchema.parse(req.body);

    const [template] = await db.insert(communicationTemplates).values({
      ...validatedData,
      createdBy: adminId,
    }).returning();

    res.json({ success: true, template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// ==================== SEGMENTATION AND TARGETING API ====================

// POST /api/admin/communications/estimate-recipients
router.post('/estimate-recipients', async (req, res) => {
  try {
    const { targetType, targetCriteria } = req.body;
    
    const estimatedCount = await estimateRecipients(targetCriteria, targetType);
    
    res.json({ estimatedRecipients: estimatedCount });
  } catch (error) {
    console.error('Error estimating recipients:', error);
    res.status(500).json({ error: 'Failed to estimate recipients' });
  }
});

// GET /api/admin/communications/audience-segments
router.get('/audience-segments', async (req, res) => {
  try {
    // Get predefined audience segments
    const segments = [
      {
        id: 'all_suppliers',
        name: 'All Suppliers',
        description: 'All registered suppliers',
        criteria: { userTypes: ['supplier'] },
      },
      {
        id: 'verified_suppliers',
        name: 'Verified Suppliers',
        description: 'Suppliers with verified status',
        criteria: { userTypes: ['supplier'], isVerified: true },
      },
      {
        id: 'premium_suppliers',
        name: 'Premium Suppliers',
        description: 'Gold and Platinum tier suppliers',
        criteria: { userTypes: ['supplier'], membershipTiers: ['gold', 'platinum'] },
      },
      {
        id: 'all_buyers',
        name: 'All Buyers',
        description: 'All registered buyers',
        criteria: { userTypes: ['buyer'] },
      },
      {
        id: 'active_buyers',
        name: 'Active Buyers',
        description: 'Buyers who logged in within last 30 days',
        criteria: { userTypes: ['buyer'], lastLoginFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      },
    ];

    // Calculate estimated counts for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment) => ({
        ...segment,
        estimatedCount: await estimateRecipients(segment.criteria, 'segment'),
      }))
    );

    res.json({ segments: segmentsWithCounts });
  } catch (error) {
    console.error('Error fetching audience segments:', error);
    res.status(500).json({ error: 'Failed to fetch audience segments' });
  }
});

// ==================== HELPER FUNCTIONS ====================

async function estimateRecipients(targetCriteria: any, targetType: string): Promise<number> {
  try {
    if (targetType === 'all') {
      const [result] = await db.select({ count: count() }).from(users);
      return result.count;
    }

    let query = db.select({ count: count() }).from(users);
    let whereConditions = [];

    // Apply user type filters
    if (targetCriteria.userTypes && targetCriteria.userTypes.length > 0) {
      whereConditions.push(inArray(users.role, targetCriteria.userTypes));
    }

    // Apply active status filter
    if (targetCriteria.isActive !== undefined) {
      whereConditions.push(eq(users.isActive, targetCriteria.isActive));
    }

    // Apply registration date filters
    if (targetCriteria.registrationDateFrom) {
      whereConditions.push(sql`${users.createdAt} >= ${new Date(targetCriteria.registrationDateFrom)}`);
    }

    if (targetCriteria.registrationDateTo) {
      whereConditions.push(sql`${users.createdAt} <= ${new Date(targetCriteria.registrationDateTo)}`);
    }

    // Apply last login filters
    if (targetCriteria.lastLoginFrom) {
      whereConditions.push(sql`${users.lastSeen} >= ${new Date(targetCriteria.lastLoginFrom)}`);
    }

    if (targetCriteria.lastLoginTo) {
      whereConditions.push(sql`${users.lastSeen} <= ${new Date(targetCriteria.lastLoginTo)}`);
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const [result] = await query;
    return result.count;
  } catch (error) {
    console.error('Error estimating recipients:', error);
    return 0;
  }
}

async function processImmediateCommunication(communicationId: string): Promise<void> {
  try {
    // Get communication details
    const [communication] = await db.select()
      .from(bulkCommunications)
      .where(eq(bulkCommunications.id, communicationId));

    if (!communication) {
      throw new Error('Communication not found');
    }

    // Get target recipients based on criteria
    const recipients = await getTargetRecipients(communication.targetCriteria, communication.targetType);

    // Create recipient records
    const recipientRecords = recipients.map(recipient => ({
      communicationId: communicationId,
      userId: recipient.id,
      userType: recipient.role,
      email: recipient.email,
      phone: recipient.phone,
      personalizationData: {
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        companyName: recipient.companyName,
      },
    }));

    if (recipientRecords.length > 0) {
      await db.insert(communicationRecipients).values(recipientRecords);
    }

    // Update actual recipients count
    await db.update(bulkCommunications)
      .set({ 
        actualRecipients: recipientRecords.length,
        status: recipientRecords.length > 0 ? 'sending' : 'completed',
      })
      .where(eq(bulkCommunications.id, communicationId));

    // Queue notifications for each channel
    for (const recipient of recipientRecords) {
      for (const channel of communication.channels) {
        await db.insert(notificationQueue).values({
          userId: recipient.userId,
          channel,
          notificationType: 'bulk',
          subject: communication.subject,
          content: personalizeContent(communication.content, recipient.personalizationData),
          htmlContent: communication.htmlContent ? personalizeContent(communication.htmlContent, recipient.personalizationData) : null,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          communicationId: communicationId,
          priority: 5,
        });
      }
    }

    console.log(`Queued ${recipientRecords.length * communication.channels.length} notifications for communication ${communicationId}`);
  } catch (error) {
    console.error('Error processing immediate communication:', error);
    
    // Update communication status to failed
    await db.update(bulkCommunications)
      .set({ 
        status: 'failed',
        errorDetails: { error: error.message },
      })
      .where(eq(bulkCommunications.id, communicationId));
  }
}

async function getTargetRecipients(targetCriteria: any, targetType: string): Promise<any[]> {
  try {
    if (targetType === 'all') {
      return await db.select().from(users).where(eq(users.isActive, true));
    }

    let query = db.select().from(users);
    let whereConditions = [eq(users.isActive, true)];

    // Apply targeting criteria (similar to estimateRecipients)
    if (targetCriteria.userTypes && targetCriteria.userTypes.length > 0) {
      whereConditions.push(inArray(users.role, targetCriteria.userTypes));
    }

    if (targetCriteria.registrationDateFrom) {
      whereConditions.push(sql`${users.createdAt} >= ${new Date(targetCriteria.registrationDateFrom)}`);
    }

    if (targetCriteria.registrationDateTo) {
      whereConditions.push(sql`${users.createdAt} <= ${new Date(targetCriteria.registrationDateTo)}`);
    }

    if (targetCriteria.lastLoginFrom) {
      whereConditions.push(sql`${users.lastSeen} >= ${new Date(targetCriteria.lastLoginFrom)}`);
    }

    if (targetCriteria.lastLoginTo) {
      whereConditions.push(sql`${users.lastSeen} <= ${new Date(targetCriteria.lastLoginTo)}`);
    }

    return await query.where(and(...whereConditions));
  } catch (error) {
    console.error('Error getting target recipients:', error);
    return [];
  }
}

function personalizeContent(content: string, personalizationData: any): string {
  let personalizedContent = content;
  
  // Replace common variables
  Object.entries(personalizationData).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    personalizedContent = personalizedContent.replace(regex, String(value || ''));
  });
  
  return personalizedContent;
}

export default router;
// 
==================== NOTIFICATION MANAGEMENT API ENDPOINTS ====================

// GET /api/admin/communications/notifications/preferences
router.get('/notifications/preferences', async (req, res) => {
  try {
    const { userId, userType } = req.query;
    
    let whereConditions = [];
    
    if (userId) {
      whereConditions.push(eq(notificationPreferences.userId, userId as string));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    const preferences = await db.select()
      .from(notificationPreferences)
      .where(whereClause)
      .limit(100);
    
    res.json({ preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// PUT /api/admin/communications/notifications/preferences/:userId
router.put('/notifications/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferencesData = req.body;
    
    // Upsert notification preferences
    const [preferences] = await db.insert(notificationPreferences)
      .values({
        userId,
        ...preferencesData,
      })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          ...preferencesData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// GET /api/admin/communications/notifications/queue
router.get('/notifications/queue', async (req, res) => {
  try {
    const { 
      status = 'queued', 
      channel, 
      priority,
      page = 1, 
      limit = 50 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(notificationQueue.status, status as string));
    }
    
    if (channel) {
      whereConditions.push(eq(notificationQueue.channel, channel as string));
    }
    
    if (priority) {
      whereConditions.push(eq(notificationQueue.priority, Number(priority)));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    const [queueItems, totalCount] = await Promise.all([
      db.select()
        .from(notificationQueue)
        .where(whereClause)
        .orderBy(desc(notificationQueue.priority), asc(notificationQueue.scheduledAt))
        .limit(Number(limit))
        .offset(offset),
      db.select({ count: count() })
        .from(notificationQueue)
        .where(whereClause)
    ]);
    
    res.json({
      queueItems,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching notification queue:', error);
    res.status(500).json({ error: 'Failed to fetch notification queue' });
  }
});

// POST /api/admin/communications/notifications/send
router.post('/notifications/send', async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notificationSchema = z.object({
      userId: z.string().min(1),
      channel: z.enum(['email', 'sms', 'push', 'in_app']),
      subject: z.string().optional(),
      content: z.string().min(1),
      htmlContent: z.string().optional(),
      priority: z.number().min(1).max(10).default(5),
      scheduledAt: z.string().optional(),
      templateId: z.string().optional(),
    });

    const validatedData = notificationSchema.parse(req.body);

    // Queue the notification
    const [queueItem] = await db.insert(notificationQueue).values({
      userId: validatedData.userId,
      channel: validatedData.channel,
      notificationType: 'manual',
      subject: validatedData.subject,
      content: validatedData.content,
      htmlContent: validatedData.htmlContent,
      priority: validatedData.priority,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : new Date(),
      templateId: validatedData.templateId,
    }).returning();

    res.json({ success: true, queueItem });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /api/admin/communications/notifications/bulk-send
router.post('/notifications/bulk-send', async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bulkNotificationSchema = z.object({
      userIds: z.array(z.string()).min(1),
      channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).min(1),
      subject: z.string().optional(),
      content: z.string().min(1),
      htmlContent: z.string().optional(),
      priority: z.number().min(1).max(10).default(5),
      scheduledAt: z.string().optional(),
      templateId: z.string().optional(),
    });

    const validatedData = bulkNotificationSchema.parse(req.body);

    const queueItems = [];
    
    // Create queue items for each user and channel combination
    for (const userId of validatedData.userIds) {
      for (const channel of validatedData.channels) {
        queueItems.push({
          userId,
          channel,
          notificationType: 'bulk_manual',
          subject: validatedData.subject,
          content: validatedData.content,
          htmlContent: validatedData.htmlContent,
          priority: validatedData.priority,
          scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : new Date(),
          templateId: validatedData.templateId,
        });
      }
    }

    // Insert all queue items
    const insertedItems = await db.insert(notificationQueue).values(queueItems).returning();

    res.json({ 
      success: true, 
      message: `Queued ${insertedItems.length} notifications`,
      queuedCount: insertedItems.length 
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({ error: 'Failed to send bulk notifications' });
  }
});

// DELETE /api/admin/communications/notifications/queue/:id
router.delete('/notifications/queue/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification is still queued
    const [queueItem] = await db.select()
      .from(notificationQueue)
      .where(eq(notificationQueue.id, id));

    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    if (queueItem.status !== 'queued') {
      return res.status(400).json({ error: 'Cannot cancel notification that is not queued' });
    }

    // Update status to cancelled
    await db.update(notificationQueue)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(notificationQueue.id, id));

    res.json({ success: true, message: 'Notification cancelled' });
  } catch (error) {
    console.error('Error cancelling notification:', error);
    res.status(500).json({ error: 'Failed to cancel notification' });
  }
});

// ==================== AUTOMATED NOTIFICATION RULES API ====================

// GET /api/admin/communications/automation/rules
router.get('/automation/rules', async (req, res) => {
  try {
    const { isActive, triggerEvent } = req.query;
    
    let whereConditions = [];
    
    if (isActive !== undefined) {
      whereConditions.push(eq(automatedNotificationRules.isActive, isActive === 'true'));
    }
    
    if (triggerEvent) {
      whereConditions.push(eq(automatedNotificationRules.triggerEvent, triggerEvent as string));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    const rules = await db.select()
      .from(automatedNotificationRules)
      .where(whereClause)
      .orderBy(desc(automatedNotificationRules.createdAt));
    
    res.json({ rules });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
});

// POST /api/admin/communications/automation/rules
router.post('/automation/rules', async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ruleSchema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      triggerEvent: z.string().min(1),
      triggerConditions: z.record(z.any()).default({}),
      templateId: z.string().optional(),
      customContent: z.record(z.any()).optional(),
      targetAudience: z.enum(['event_user', 'admins', 'suppliers', 'buyers', 'custom']),
      audienceFilter: z.record(z.any()).default({}),
      channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).min(1),
      deliveryDelay: z.number().min(0).default(0),
      maxFrequency: z.enum(['once', 'daily', 'weekly', 'unlimited']).default('unlimited'),
      respectQuietHours: z.boolean().default(true),
      optimizeSendTime: z.boolean().default(false),
      priority: z.number().min(1).max(10).default(5),
    });

    const validatedData = ruleSchema.parse(req.body);

    const [rule] = await db.insert(automatedNotificationRules).values({
      ...validatedData,
      createdBy: adminId,
    }).returning();

    res.json({ success: true, rule });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    res.status(500).json({ error: 'Failed to create automation rule' });
  }
});

// PUT /api/admin/communications/automation/rules/:id
router.put('/automation/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    
    const updateData = {
      ...req.body,
      updatedBy: adminId,
      updatedAt: new Date(),
    };
    
    const [rule] = await db.update(automatedNotificationRules)
      .set(updateData)
      .where(eq(automatedNotificationRules.id, id))
      .returning();
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json({ success: true, rule });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    res.status(500).json({ error: 'Failed to update automation rule' });
  }
});

// POST /api/admin/communications/automation/rules/:id/toggle
router.post('/automation/rules/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    
    // Get current rule
    const [currentRule] = await db.select()
      .from(automatedNotificationRules)
      .where(eq(automatedNotificationRules.id, id));
    
    if (!currentRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Toggle active status
    const [rule] = await db.update(automatedNotificationRules)
      .set({ 
        isActive: !currentRule.isActive,
        updatedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(automatedNotificationRules.id, id))
      .returning();
    
    res.json({ 
      success: true, 
      rule,
      message: `Rule ${rule.isActive ? 'activated' : 'deactivated'}` 
    });
  } catch (error) {
    console.error('Error toggling automation rule:', error);
    res.status(500).json({ error: 'Failed to toggle automation rule' });
  }
});

// DELETE /api/admin/communications/automation/rules/:id
router.delete('/automation/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(automatedNotificationRules)
      .where(eq(automatedNotificationRules.id, id));
    
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    res.status(500).json({ error: 'Failed to delete automation rule' });
  }
});

// ==================== NOTIFICATION ANALYTICS API ====================

// GET /api/admin/communications/analytics/delivery
router.get('/analytics/delivery', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      channel, 
      communicationId,
      groupBy = 'day' 
    } = req.query;
    
    let whereConditions = [];
    
    if (startDate) {
      whereConditions.push(gte(communicationAnalytics.date, new Date(startDate as string)));
    }
    
    if (endDate) {
      whereConditions.push(sql`${communicationAnalytics.date} <= ${new Date(endDate as string)}`);
    }
    
    if (channel) {
      whereConditions.push(eq(communicationAnalytics.channel, channel as string));
    }
    
    if (communicationId) {
      whereConditions.push(eq(communicationAnalytics.communicationId, communicationId as string));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    const analytics = await db.select()
      .from(communicationAnalytics)
      .where(whereClause)
      .orderBy(desc(communicationAnalytics.date));
    
    // Calculate summary metrics
    const summary = analytics.reduce((acc, item) => ({
      totalSent: acc.totalSent + item.sentCount,
      totalDelivered: acc.totalDelivered + item.deliveredCount,
      totalOpened: acc.totalOpened + item.openedCount,
      totalClicked: acc.totalClicked + item.clickedCount,
      totalBounced: acc.totalBounced + item.bouncedCount,
      totalFailed: acc.totalFailed + item.failedCount,
    }), {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalFailed: 0,
    });
    
    // Calculate rates
    const rates = {
      deliveryRate: summary.totalSent > 0 ? (summary.totalDelivered / summary.totalSent) * 100 : 0,
      openRate: summary.totalDelivered > 0 ? (summary.totalOpened / summary.totalDelivered) * 100 : 0,
      clickRate: summary.totalDelivered > 0 ? (summary.totalClicked / summary.totalDelivered) * 100 : 0,
      bounceRate: summary.totalSent > 0 ? (summary.totalBounced / summary.totalSent) * 100 : 0,
    };
    
    res.json({
      analytics,
      summary: {
        ...summary,
        ...rates,
      },
    });
  } catch (error) {
    console.error('Error fetching delivery analytics:', error);
    res.status(500).json({ error: 'Failed to fetch delivery analytics' });
  }
});

// GET /api/admin/communications/analytics/performance
router.get('/analytics/performance', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    // Get performance metrics
    const [
      totalCommunications,
      activeCommunications,
      queuedNotifications,
      deliveryMetrics
    ] = await Promise.all([
      db.select({ count: count() })
        .from(bulkCommunications)
        .where(gte(bulkCommunications.createdAt, startDate)),
      
      db.select({ count: count() })
        .from(bulkCommunications)
        .where(
          and(
            gte(bulkCommunications.createdAt, startDate),
            inArray(bulkCommunications.status, ['sending', 'scheduled'])
          )
        ),
      
      db.select({ count: count() })
        .from(notificationQueue)
        .where(eq(notificationQueue.status, 'queued')),
      
      db.select({
        totalSent: sql<number>`SUM(${communicationAnalytics.sentCount})`,
        totalDelivered: sql<number>`SUM(${communicationAnalytics.deliveredCount})`,
        totalOpened: sql<number>`SUM(${communicationAnalytics.openedCount})`,
        totalClicked: sql<number>`SUM(${communicationAnalytics.clickedCount})`,
      })
        .from(communicationAnalytics)
        .where(gte(communicationAnalytics.date, startDate))
    ]);
    
    const metrics = deliveryMetrics[0] || {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
    };
    
    res.json({
      period,
      totalCommunications: totalCommunications[0].count,
      activeCommunications: activeCommunications[0].count,
      queuedNotifications: queuedNotifications[0].count,
      deliveryMetrics: {
        ...metrics,
        deliveryRate: metrics.totalSent > 0 ? (metrics.totalDelivered / metrics.totalSent) * 100 : 0,
        openRate: metrics.totalDelivered > 0 ? (metrics.totalOpened / metrics.totalDelivered) * 100 : 0,
        clickRate: metrics.totalDelivered > 0 ? (metrics.totalClicked / metrics.totalDelivered) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

// ==================== UNSUBSCRIBE MANAGEMENT API ====================

// GET /api/admin/communications/unsubscribes
router.get('/unsubscribes', async (req, res) => {
  try {
    const { 
      status = 'active', 
      unsubscribeType,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(unsubscribeRequests.status, status as string));
    }
    
    if (unsubscribeType) {
      whereConditions.push(eq(unsubscribeRequests.unsubscribeType, unsubscribeType as string));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    const [unsubscribes, totalCount] = await Promise.all([
      db.select()
        .from(unsubscribeRequests)
        .where(whereClause)
        .orderBy(desc(unsubscribeRequests.createdAt))
        .limit(Number(limit))
        .offset(offset),
      db.select({ count: count() })
        .from(unsubscribeRequests)
        .where(whereClause)
    ]);
    
    res.json({
      unsubscribes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching unsubscribes:', error);
    res.status(500).json({ error: 'Failed to fetch unsubscribes' });
  }
});

// POST /api/admin/communications/unsubscribes/:id/resubscribe
router.post('/unsubscribes/:id/resubscribe', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [unsubscribe] = await db.update(unsubscribeRequests)
      .set({ 
        status: 'resubscribed',
        resubscribedAt: new Date(),
      })
      .where(eq(unsubscribeRequests.id, id))
      .returning();
    
    if (!unsubscribe) {
      return res.status(404).json({ error: 'Unsubscribe request not found' });
    }
    
    res.json({ success: true, unsubscribe });
  } catch (error) {
    console.error('Error resubscribing user:', error);
    res.status(500).json({ error: 'Failed to resubscribe user' });
  }
});

export default router;