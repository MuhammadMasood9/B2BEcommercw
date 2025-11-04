import { db } from './db';
import { conversations, messages, users, products } from '../shared/schema';
import { eq, and, or, desc, sql, isNotNull, ne, count } from 'drizzle-orm';
import type { InsertConversation, Conversation } from '../shared/schema';

export interface ConversationParticipants {
  buyerId?: string;
  supplierId?: string;
  adminId?: string;
}

export interface ConversationFilters {
  status?: 'active' | 'archived' | 'closed';
  type?: 'buyer_supplier' | 'buyer_admin' | 'supplier_admin';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
}

export interface ConversationWithDetails extends Conversation {
  participantName?: string;
  participantEmail?: string;
  participantCompany?: string;
  productName?: string;
  productImages?: string[];
  unreadCount?: number;
  lastMessage?: string;
}

class ConversationService {
  /**
   * Create a new conversation between participants
   */
  async createConversation(data: {
    type: 'buyer_supplier' | 'buyer_admin' | 'supplier_admin';
    participants: ConversationParticipants;
    subject?: string;
    productId?: string;
  }): Promise<Conversation> {
    const conversationData: any = {
      type: data.type,
      subject: data.subject || 'New conversation',
      status: 'active',
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set participants based on conversation type
    if (data.participants.buyerId) {
      conversationData.buyerId = data.participants.buyerId;
    }
    if (data.participants.supplierId) {
      conversationData.supplierId = data.participants.supplierId;
    }
    if (data.participants.adminId) {
      conversationData.adminId = data.participants.adminId;
    }

    const [conversation] = await db.insert(conversations)
      .values(conversationData)
      .returning();

    return conversation;
  }

  /**
   * Get conversations for a specific user based on their role
   */
  async getUserConversations(
    userId: string, 
    userRole: 'buyer' | 'supplier' | 'admin',
    filters?: ConversationFilters
  ): Promise<ConversationWithDetails[]> {
    let whereCondition;

    // Build where condition based on user role
    switch (userRole) {
      case 'buyer':
        whereCondition = eq(conversations.buyerId, userId);
        break;
      case 'supplier':
        whereCondition = eq(conversations.supplierId, userId);
        break;
      case 'admin':
        whereCondition = or(
          eq(conversations.adminId, userId),
          and(
            eq(conversations.type, 'buyer_admin'),
            isNotNull(conversations.buyerId)
          ),
          and(
            eq(conversations.type, 'supplier_admin'),
            isNotNull(conversations.supplierId)
          )
        );
        break;
      default:
        throw new Error('Invalid user role');
    }

    // Apply additional filters
    if (filters?.status) {
      whereCondition = and(whereCondition, eq(conversations.status, filters.status));
    }
    if (filters?.type) {
      whereCondition = and(whereCondition, eq(conversations.type, filters.type));
    }

    const results = await db.select()
      .from(conversations)
      .where(whereCondition)
      .orderBy(desc(conversations.lastMessageAt));

    // Transform results to include participant details
    const conversationsWithDetails: ConversationWithDetails[] = [];
    
    for (const conv of results) {
      const convWithDetails: ConversationWithDetails = {
        ...conv,
        participantName: undefined,
        participantEmail: undefined,
        participantCompany: undefined,
        productName: undefined,
        productImages: undefined,
        unreadCount: 0,
        lastMessage: undefined
      };

      // Get participant details based on conversation type and current user
      let participantId: string | null = null;
      if (userRole === 'buyer' && conv.supplierId) {
        participantId = conv.supplierId;
      } else if (userRole === 'buyer' && conv.adminId) {
        participantId = conv.adminId;
      } else if (userRole === 'supplier' && conv.buyerId) {
        participantId = conv.buyerId;
      } else if (userRole === 'supplier' && conv.adminId) {
        participantId = conv.adminId;
      } else if (userRole === 'admin' && conv.buyerId) {
        participantId = conv.buyerId;
      } else if (userRole === 'admin' && conv.supplierId) {
        participantId = conv.supplierId;
      }

      if (participantId) {
        const [participant] = await db.select({
          firstName: users.firstName,
          email: users.email,
          companyName: users.companyName
        })
        .from(users)
        .where(eq(users.id, participantId))
        .limit(1);

        if (participant) {
          convWithDetails.participantName = participant.firstName || undefined;
          convWithDetails.participantEmail = participant.email || undefined;
          convWithDetails.participantCompany = participant.companyName || undefined;
        }
      }

      conversationsWithDetails.push(convWithDetails);
    }

    return conversationsWithDetails;
  }

  /**
   * Get a specific conversation by ID with participant validation
   */
  async getConversationById(
    conversationId: string, 
    userId: string, 
    userRole: 'buyer' | 'supplier' | 'admin'
  ): Promise<ConversationWithDetails | null> {
    const [conversation] = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return null;
    }

    // Validate user has access to this conversation
    const hasAccess = this.validateConversationAccess(conversation, userId, userRole);
    if (!hasAccess) {
      throw new Error('Access denied to this conversation');
    }

    return conversation as ConversationWithDetails;
  }

  /**
   * Update conversation details
   */
  async updateConversation(
    conversationId: string,
    updates: Partial<{
      subject: string;
      status: 'active' | 'archived' | 'closed';
      priority: 'low' | 'medium' | 'high' | 'urgent';
    }>,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin'
  ): Promise<Conversation> {
    // Validate access first
    const conversation = await this.getConversationById(conversationId, userId, userRole);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const [updated] = await db.update(conversations)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    return updated;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(
    conversationId: string,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin'
  ): Promise<void> {
    await this.updateConversation(conversationId, { status: 'archived' }, userId, userRole);
  }

  /**
   * Close a conversation (admin only)
   */
  async closeConversation(
    conversationId: string,
    adminId: string
  ): Promise<void> {
    await this.updateConversation(conversationId, { status: 'closed' }, adminId, 'admin');
  }

  /**
   * Assign conversation to admin (admin only)
   */
  async assignConversation(
    conversationId: string,
    adminId: string,
    assignedBy: string
  ): Promise<void> {
    const [updated] = await db.update(conversations)
      .set({
        adminId: adminId,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    if (!updated) {
      throw new Error('Failed to assign conversation');
    }
  }

  /**
   * Get conversation statistics for admin dashboard
   */
  async getConversationStats(timeRange?: 'day' | 'week' | 'month'): Promise<{
    total: number;
    active: number;
    closed: number;
    byType: Record<string, number>;
    avgResponseTime: number;
  }> {
    let dateFilter = sql`1=1`;
    
    if (timeRange) {
      const intervals = {
        day: '1 day',
        week: '7 days',
        month: '30 days'
      };
      dateFilter = sql`created_at >= NOW() - INTERVAL '${sql.raw(intervals[timeRange])}'`;
    }

    const [totalResult] = await db.select({ count: count() })
      .from(conversations)
      .where(dateFilter);

    const [activeResult] = await db.select({ count: count() })
      .from(conversations)
      .where(and(dateFilter, eq(conversations.status, 'active')));

    const [closedResult] = await db.select({ count: count() })
      .from(conversations)
      .where(and(dateFilter, eq(conversations.status, 'closed')));

    const typeResults = await db.select({
      type: conversations.type,
      count: count()
    })
    .from(conversations)
    .where(dateFilter)
    .groupBy(conversations.type);

    const byType = typeResults.reduce((acc, result) => {
      acc[result.type || 'unknown'] = result.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalResult.count,
      active: activeResult.count,
      closed: closedResult.count,
      byType,
      avgResponseTime: 0 // TODO: Calculate based on message timestamps
    };
  }

  /**
   * Search conversations by content or participants
   */
  async searchConversations(
    query: string,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin',
    filters?: ConversationFilters
  ): Promise<ConversationWithDetails[]> {
    // Get user's conversations first
    const userConversations = await this.getUserConversations(userId, userRole, filters);
    
    // Filter by search query (simple text search)
    const searchResults = userConversations.filter(conv => 
      conv.subject?.toLowerCase().includes(query.toLowerCase()) ||
      conv.participantName?.toLowerCase().includes(query.toLowerCase()) ||
      conv.participantEmail?.toLowerCase().includes(query.toLowerCase()) ||
      conv.productName?.toLowerCase().includes(query.toLowerCase())
    );

    return searchResults;
  }

  /**
   * Get unread conversation count for a user
   */
  async getUnreadConversationCount(userId: string, userRole: 'buyer' | 'supplier' | 'admin'): Promise<number> {
    let whereCondition;

    switch (userRole) {
      case 'buyer':
        whereCondition = and(
          eq(conversations.buyerId, userId),
          eq(conversations.status, 'active')
        );
        break;
      case 'supplier':
        whereCondition = and(
          eq(conversations.supplierId, userId),
          eq(conversations.status, 'active')
        );
        break;
      case 'admin':
        whereCondition = and(
          or(
            eq(conversations.adminId, userId),
            and(
              eq(conversations.type, 'buyer_admin'),
              isNotNull(conversations.buyerId)
            ),
            and(
              eq(conversations.type, 'supplier_admin'),
              isNotNull(conversations.supplierId)
            )
          ),
          eq(conversations.status, 'active')
        );
        break;
      default:
        return 0;
    }

    // Count conversations with unread messages
    const [result] = await db.select({ count: count() })
      .from(conversations)
      .innerJoin(messages, eq(conversations.id, messages.conversationId))
      .where(and(
        whereCondition,
        ne(messages.senderId, userId),
        eq(messages.isRead, false)
      ));

    return result.count;
  }

  /**
   * Validate if user has access to a conversation
   */
  private validateConversationAccess(
    conversation: any,
    userId: string,
    userRole: 'buyer' | 'supplier' | 'admin'
  ): boolean {
    switch (userRole) {
      case 'buyer':
        return conversation.buyerId === userId;
      case 'supplier':
        return conversation.supplierId === userId;
      case 'admin':
        return conversation.adminId === userId || 
               conversation.type === 'buyer_admin' || 
               conversation.type === 'supplier_admin';
      default:
        return false;
    }
  }

  /**
   * Update conversation last message timestamp
   */
  async updateLastMessageTime(conversationId: string): Promise<void> {
    await db.update(conversations)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }
}

export const conversationService = new ConversationService();