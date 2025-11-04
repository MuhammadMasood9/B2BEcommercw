import { db } from './db';
import { messages, conversations, users } from '../shared/schema';
import { eq, and, desc, sql, ne, count, or } from 'drizzle-orm';
import type { InsertMessage, Message } from '../shared/schema';
import { conversationService } from './conversationService';

export interface MessageWithSender extends Message {
  senderName?: string;
  senderEmail?: string;
  senderCompany?: string;
}

export interface MessageFilters {
  isRead?: boolean;
  senderType?: 'buyer' | 'supplier' | 'admin';
  hasAttachments?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MessageSearchResult {
  message: MessageWithSender;
  conversationId: string;
  conversationSubject?: string;
}

class MessageService {
  /**
   * Create a new message in a conversation
   */
  async createMessage(data: {
    conversationId: string;
    senderId: string;
    senderType: 'buyer' | 'supplier' | 'admin';
    message: string;
    attachments?: string[];
    productReferences?: string[];
  }): Promise<Message> {
    // Validate conversation exists and user has access
    const conversation = await conversationService.getConversationById(
      data.conversationId, 
      data.senderId, 
      data.senderType
    );
    
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const messageData: InsertMessage = {
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderType: data.senderType,
      message: data.message,
      attachments: data.attachments || [],
      productReferences: data.productReferences || [],
      isRead: false
    };

    const [createdMessage] = await db.insert(messages)
      .values(messageData)
      .returning();

    // Update conversation last message time
    await conversationService.updateLastMessageTime(data.conversationId);

    return createdMessage;
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin',
    options?: {
      limit?: number;
      offset?: number;
      filters?: MessageFilters;
    }
  ): Promise<MessageWithSender[]> {
    // Validate access to conversation
    const conversation = await conversationService.getConversationById(
      conversationId, 
      userId, 
      userRole
    );
    
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    let whereCondition = eq(messages.conversationId, conversationId);

    const query = db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderType: messages.senderType,
      message: messages.message,
      attachments: messages.attachments,
      productReferences: messages.productReferences,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      // Sender details
      senderName: sql`COALESCE(${users.firstName}, ${users.email})`.as('senderName'),
      senderEmail: users.email,
      senderCompany: users.companyName
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(whereCondition)
    .orderBy(desc(messages.createdAt));

    if (options?.limit) {
      query.limit(options.limit);
    }
    
    if (options?.offset) {
      query.offset(options.offset);
    }

    const results = await query;
    return results as MessageWithSender[];
  }

  /**
   * Get a specific message by ID
   */
  async getMessageById(
    messageId: string,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin'
  ): Promise<MessageWithSender | null> {
    const [message] = await db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderType: messages.senderType,
      message: messages.message,
      attachments: messages.attachments,
      productReferences: messages.productReferences,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      senderName: sql`COALESCE(${users.firstName}, ${users.email})`.as('senderName'),
      senderEmail: users.email,
      senderCompany: users.companyName
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.id, messageId))
    .limit(1);

    if (!message) {
      return null;
    }

    // Validate access to the conversation
    const conversation = await conversationService.getConversationById(
      message.conversationId, 
      userId, 
      userRole
    );
    
    if (!conversation) {
      throw new Error('Access denied to this message');
    }

    return message as MessageWithSender;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin',
    messageIds?: string[]
  ): Promise<number> {
    // Validate access to conversation
    const conversation = await conversationService.getConversationById(
      conversationId, 
      userId, 
      userRole
    );
    
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    let whereCondition = and(
      eq(messages.conversationId, conversationId),
      ne(messages.senderId, userId), // Don't mark own messages as read
      eq(messages.isRead, false)
    );

    // If specific message IDs provided, only mark those
    if (messageIds && messageIds.length > 0) {
      const newCondition = and(
        whereCondition,
        sql`${messages.id} = ANY(${messageIds})`
      );
      if (newCondition) whereCondition = newCondition;
    }

    const result = await db.update(messages)
      .set({ isRead: true })
      .where(whereCondition)
      .returning({ id: messages.id });

    return result.length;
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadMessageCount(
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin',
    conversationId?: string
  ): Promise<number> {
    let whereCondition = and(
      ne(messages.senderId, userId),
      eq(messages.isRead, false)
    );

    // Add conversation filter if specified
    if (conversationId) {
      const newCondition = and(whereCondition, eq(messages.conversationId, conversationId));
      if (newCondition) whereCondition = newCondition;
    } else {
      // Filter by user's conversations based on role
      let conversationFilter;
      switch (userRole) {
        case 'buyer':
          conversationFilter = eq(conversations.buyerId, userId);
          break;
        case 'supplier':
          conversationFilter = eq(conversations.supplierId, userId);
          break;
        case 'admin':
          conversationFilter = or(
            eq(conversations.adminId, userId),
            eq(conversations.type, 'buyer_admin'),
            eq(conversations.type, 'supplier_admin')
          );
          break;
        default:
          return 0;
      }
      
      const newCondition = and(whereCondition, conversationFilter);
      if (newCondition) whereCondition = newCondition;
    }

    const [result] = await db.select({ count: count() })
      .from(messages)
      .leftJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(whereCondition);

    return result.count;
  }

  /**
   * Search messages across conversations
   */
  async searchMessages(
    query: string,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin',
    options?: {
      limit?: number;
      conversationId?: string;
      filters?: MessageFilters;
    }
  ): Promise<MessageSearchResult[]> {
    let whereCondition = sql`${messages.message} ILIKE ${`%${query}%`}`;

    // Filter by user's conversations based on role
    let conversationFilter;
    switch (userRole) {
      case 'buyer':
        conversationFilter = eq(conversations.buyerId, userId);
        break;
      case 'supplier':
        conversationFilter = eq(conversations.supplierId, userId);
        break;
      case 'admin':
        conversationFilter = or(
          eq(conversations.adminId, userId),
          eq(conversations.type, 'buyer_admin'),
          eq(conversations.type, 'supplier_admin')
        );
        break;
      default:
        return [];
    }

    const newCondition = and(whereCondition, conversationFilter);
    if (newCondition) whereCondition = newCondition;

    // Add specific conversation filter if provided
    if (options?.conversationId) {
      const convCondition = and(whereCondition, eq(messages.conversationId, options.conversationId));
      if (convCondition) whereCondition = convCondition;
    }

    const queryBuilder = db.select({
      // Message details
      messageId: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderType: messages.senderType,
      message: messages.message,
      attachments: messages.attachments,
      productReferences: messages.productReferences,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      // Sender details
      senderName: sql`COALESCE(${users.firstName}, ${users.email})`.as('senderName'),
      senderEmail: users.email,
      senderCompany: users.companyName,
      // Conversation details
      conversationSubject: conversations.subject
    })
    .from(messages)
    .leftJoin(conversations, eq(messages.conversationId, conversations.id))
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(whereCondition)
    .orderBy(desc(messages.createdAt));

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    const results = await queryBuilder;

    return results.map(result => ({
      message: {
        id: result.messageId,
        conversationId: result.conversationId,
        senderId: result.senderId,
        senderType: result.senderType,
        message: result.message,
        attachments: result.attachments,
        productReferences: result.productReferences,
        isRead: result.isRead,
        createdAt: result.createdAt,
        senderName: result.senderName,
        senderEmail: result.senderEmail,
        senderCompany: result.senderCompany
      } as MessageWithSender,
      conversationId: result.conversationId,
      conversationSubject: result.conversationSubject || undefined
    }));
  }

  /**
   * Delete a message (soft delete by marking as deleted)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin'
  ): Promise<boolean> {
    const message = await this.getMessageById(messageId, userId, userRole);
    
    if (!message) {
      throw new Error('Message not found or access denied');
    }

    // Only allow sender or admin to delete messages
    if (message.senderId !== userId && userRole !== 'admin') {
      throw new Error('Only the sender or admin can delete this message');
    }

    // Soft delete by updating message content
    const [updated] = await db.update(messages)
      .set({ 
        message: '[Message deleted]',
        attachments: []
      })
      .where(eq(messages.id, messageId))
      .returning({ id: messages.id });

    return !!updated;
  }

  /**
   * Get message statistics for analytics
   */
  async getMessageStats(
    userId?: string,
    userRole?: 'buyer' | 'supplier' | 'admin',
    timeRange?: 'day' | 'week' | 'month'
  ): Promise<{
    totalMessages: number;
    messagesByType: Record<string, number>;
    avgMessagesPerConversation: number;
    responseTime: number;
  }> {
    let dateFilter = sql`1=1`;
    let userFilter = sql`1=1`;
    
    if (timeRange) {
      const intervals = {
        day: '1 day',
        week: '7 days',
        month: '30 days'
      };
      dateFilter = sql`${messages.createdAt} >= NOW() - INTERVAL '${sql.raw(intervals[timeRange])}'`;
    }

    if (userId && userRole) {
      switch (userRole) {
        case 'buyer':
          userFilter = eq(conversations.buyerId, userId);
          break;
        case 'supplier':
          userFilter = eq(conversations.supplierId, userId);
          break;
        case 'admin':
          userFilter = or(
            eq(conversations.adminId, userId),
            eq(conversations.type, 'buyer_admin'),
            eq(conversations.type, 'supplier_admin')
          ) || sql`1=1`;
          break;
      }
    }

    const [totalResult] = await db.select({ count: count() })
      .from(messages)
      .leftJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(dateFilter, userFilter || sql`1=1`));

    const typeResults = await db.select({
      senderType: messages.senderType,
      count: count()
    })
    .from(messages)
    .leftJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(dateFilter, userFilter || sql`1=1`))
    .groupBy(messages.senderType);

    const messagesByType = typeResults.reduce((acc, result) => {
      acc[result.senderType || 'unknown'] = result.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMessages: totalResult.count,
      messagesByType,
      avgMessagesPerConversation: 0, // TODO: Calculate based on conversation count
      responseTime: 0 // TODO: Calculate based on message timestamps
    };
  }

  /**
   * Get recent messages for a user (for notifications/dashboard)
   */
  async getRecentMessages(
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin',
    limit: number = 10
  ): Promise<MessageWithSender[]> {
    let conversationFilter;
    switch (userRole) {
      case 'buyer':
        conversationFilter = eq(conversations.buyerId, userId);
        break;
      case 'supplier':
        conversationFilter = eq(conversations.supplierId, userId);
        break;
      case 'admin':
        conversationFilter = or(
          eq(conversations.adminId, userId),
          eq(conversations.type, 'buyer_admin'),
          eq(conversations.type, 'supplier_admin')
        );
        break;
      default:
        return [];
    }

    const results = await db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderType: messages.senderType,
      message: messages.message,
      attachments: messages.attachments,
      productReferences: messages.productReferences,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      senderName: sql`COALESCE(${users.firstName}, ${users.email})`.as('senderName'),
      senderEmail: users.email,
      senderCompany: users.companyName
    })
    .from(messages)
    .leftJoin(conversations, eq(messages.conversationId, conversations.id))
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(and(
      conversationFilter || sql`1=1`,
      ne(messages.senderId, userId) // Don't include own messages
    ))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

    return results as MessageWithSender[];
  }
}

export const messageService = new MessageService();