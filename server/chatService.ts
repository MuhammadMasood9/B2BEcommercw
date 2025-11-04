import { conversationService } from './conversationService';
import { messageService } from './messageService';
import { fileService } from './fileService';
import { notificationService } from './notificationService';
import type { ConversationFilters, ConversationWithDetails } from './conversationService';
import type { MessageFilters, MessageWithSender } from './messageService';
import type { FileUploadResult } from './fileService';

export interface ChatServiceOptions {
  userId: string;
  userRole: 'buyer' | 'supplier' | 'admin';
}

export interface CreateConversationData {
  type: 'buyer_supplier' | 'buyer_admin' | 'supplier_admin';
  participantId: string; // ID of the other participant
  subject?: string;
  productId?: string;
  initialMessage?: string;
}

export interface SendMessageData {
  conversationId: string;
  message: string;
  attachments?: FileUploadResult[];
  productReferences?: string[];
}

export interface ChatAnalytics {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  unreadMessages: number;
  avgResponseTime: number;
  conversationsByType: Record<string, number>;
  messagesByType: Record<string, number>;
}

/**
 * Unified Chat Service that orchestrates conversation, message, file, and notification services
 */
class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(
    data: CreateConversationData,
    options: ChatServiceOptions
  ): Promise<ConversationWithDetails> {
    const { userId, userRole } = options;

    // Determine participants based on conversation type
    const participants: any = {};
    
    switch (data.type) {
      case 'buyer_supplier':
        if (userRole === 'buyer') {
          participants.buyerId = userId;
          participants.supplierId = data.participantId;
        } else if (userRole === 'supplier') {
          participants.supplierId = userId;
          participants.buyerId = data.participantId;
        } else {
          throw new Error('Admins cannot create buyer-supplier conversations');
        }
        break;
        
      case 'buyer_admin':
        if (userRole === 'buyer') {
          participants.buyerId = userId;
          participants.adminId = data.participantId;
        } else if (userRole === 'admin') {
          participants.adminId = userId;
          participants.buyerId = data.participantId;
        } else {
          throw new Error('Suppliers cannot create buyer-admin conversations');
        }
        break;
        
      case 'supplier_admin':
        if (userRole === 'supplier') {
          participants.supplierId = userId;
          participants.adminId = data.participantId;
        } else if (userRole === 'admin') {
          participants.adminId = userId;
          participants.supplierId = data.participantId;
        } else {
          throw new Error('Buyers cannot create supplier-admin conversations');
        }
        break;
        
      default:
        throw new Error('Invalid conversation type');
    }

    // Create the conversation
    const conversation = await conversationService.createConversation({
      type: data.type,
      participants,
      subject: data.subject,
      productId: data.productId
    });

    // Send initial message if provided
    if (data.initialMessage) {
      await this.sendMessage({
        conversationId: conversation.id,
        message: data.initialMessage
      }, options);
    }

    // Get conversation with details
    return await conversationService.getConversationById(conversation.id, userId, userRole) as ConversationWithDetails;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    data: SendMessageData,
    options: ChatServiceOptions
  ): Promise<MessageWithSender> {
    const { userId, userRole } = options;

    // Create the message
    const message = await messageService.createMessage({
      conversationId: data.conversationId,
      senderId: userId,
      senderType: userRole,
      message: data.message,
      attachments: data.attachments?.map(file => file.url) || [],
      productReferences: data.productReferences || []
    });

    // Get message with sender details
    const messageWithSender = await messageService.getMessageById(message.id, userId, userRole);
    
    if (!messageWithSender) {
      throw new Error('Failed to retrieve sent message');
    }

    // Send real-time notifications
    await notificationService.notifyNewChatMessage({
      conversationId: data.conversationId,
      senderId: userId,
      senderName: messageWithSender.senderName || 'Unknown User',
      senderRole: userRole,
      messageContent: data.message,
      messageType: data.attachments && data.attachments.length > 0 ? 'file' : 'text',
      attachmentCount: data.attachments?.length || 0
    });

    return messageWithSender;
  }

  /**
   * Get conversations for a user
   */
  async getConversations(
    filters?: ConversationFilters,
    options?: ChatServiceOptions
  ): Promise<ConversationWithDetails[]> {
    if (!options) {
      throw new Error('User options required');
    }

    return await conversationService.getUserConversations(
      options.userId,
      options.userRole,
      filters
    );
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    messageOptions?: {
      limit?: number;
      offset?: number;
      filters?: MessageFilters;
    },
    options?: ChatServiceOptions
  ): Promise<MessageWithSender[]> {
    if (!options) {
      throw new Error('User options required');
    }

    return await messageService.getConversationMessages(
      conversationId,
      options.userId,
      options.userRole,
      messageOptions
    );
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    messageIds?: string[],
    options?: ChatServiceOptions
  ): Promise<number> {
    if (!options) {
      throw new Error('User options required');
    }

    return await messageService.markMessagesAsRead(
      conversationId,
      options.userId,
      options.userRole,
      messageIds
    );
  }

  /**
   * Upload files for chat
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<FileUploadResult[]> {
    return await fileService.processUploadedFiles(files);
  }

  /**
   * Upload file from base64
   */
  async uploadFromBase64(
    base64Data: string,
    originalName: string,
    mimeType: string
  ): Promise<FileUploadResult> {
    return await fileService.uploadFromBase64(base64Data, originalName, mimeType);
  }

  /**
   * Search conversations
   */
  async searchConversations(
    query: string,
    filters?: ConversationFilters,
    options?: ChatServiceOptions
  ): Promise<ConversationWithDetails[]> {
    if (!options) {
      throw new Error('User options required');
    }

    return await conversationService.searchConversations(
      query,
      options.userId,
      options.userRole,
      filters
    );
  }

  /**
   * Search messages
   */
  async searchMessages(
    query: string,
    searchOptions?: {
      limit?: number;
      conversationId?: string;
      filters?: MessageFilters;
    },
    options?: ChatServiceOptions
  ): Promise<any[]> {
    if (!options) {
      throw new Error('User options required');
    }

    return await messageService.searchMessages(
      query,
      options.userId,
      options.userRole,
      searchOptions
    );
  }

  /**
   * Get chat analytics
   */
  async getChatAnalytics(
    timeRange?: 'day' | 'week' | 'month',
    options?: ChatServiceOptions
  ): Promise<ChatAnalytics> {
    if (!options) {
      throw new Error('User options required');
    }

    const [conversationStats, messageStats, unreadCount] = await Promise.all([
      conversationService.getConversationStats(timeRange),
      messageService.getMessageStats(options.userId, options.userRole, timeRange),
      messageService.getUnreadMessageCount(options.userId, options.userRole)
    ]);

    return {
      totalConversations: conversationStats.total,
      activeConversations: conversationStats.active,
      totalMessages: messageStats.totalMessages,
      unreadMessages: unreadCount,
      avgResponseTime: conversationStats.avgResponseTime,
      conversationsByType: conversationStats.byType,
      messagesByType: messageStats.messagesByType
    };
  }

  /**
   * Get unread counts
   */
  async getUnreadCounts(options: ChatServiceOptions): Promise<{
    conversations: number;
    messages: number;
  }> {
    const [conversationCount, messageCount] = await Promise.all([
      conversationService.getUnreadConversationCount(options.userId, options.userRole),
      messageService.getUnreadMessageCount(options.userId, options.userRole)
    ]);

    return {
      conversations: conversationCount,
      messages: messageCount
    };
  }

  /**
   * Archive conversation
   */
  async archiveConversation(
    conversationId: string,
    options: ChatServiceOptions
  ): Promise<void> {
    await conversationService.archiveConversation(
      conversationId,
      options.userId,
      options.userRole
    );

    // Notify participants
    await notificationService.notifyConversationStatusChange(
      conversationId,
      'archived',
      { archivedBy: options.userId }
    );
  }

  /**
   * Close conversation (admin only)
   */
  async closeConversation(
    conversationId: string,
    options: ChatServiceOptions
  ): Promise<void> {
    if (options.userRole !== 'admin') {
      throw new Error('Only admins can close conversations');
    }

    await conversationService.closeConversation(conversationId, options.userId);

    // Notify participants
    await notificationService.notifyConversationStatusChange(
      conversationId,
      'closed',
      { closedBy: options.userId }
    );
  }

  /**
   * Assign conversation to admin
   */
  async assignConversation(
    conversationId: string,
    adminId: string,
    options: ChatServiceOptions
  ): Promise<void> {
    if (options.userRole !== 'admin') {
      throw new Error('Only admins can assign conversations');
    }

    await conversationService.assignConversation(
      conversationId,
      adminId,
      options.userId
    );

    // Notify the assigned admin
    await notificationService.createNotification({
      userId: adminId,
      type: 'info',
      title: 'Conversation Assigned',
      message: 'You have been assigned to a support conversation',
      relatedId: conversationId,
      relatedType: 'chat'
    });

    // Notify participants
    await notificationService.notifyConversationStatusChange(
      conversationId,
      'assigned',
      { assignedTo: adminId, assignedBy: options.userId }
    );
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(
    conversationId: string,
    isTyping: boolean,
    options: ChatServiceOptions
  ): void {
    notificationService.sendTypingIndicator({
      conversationId,
      userId: options.userId,
      userName: 'User', // TODO: Get actual user name
      isTyping
    });
  }

  /**
   * Update user online status
   */
  updateUserStatus(isOnline: boolean, options: ChatServiceOptions): void {
    notificationService.broadcastUserStatus({
      userId: options.userId,
      isOnline,
      lastSeen: isOnline ? undefined : new Date()
    });
  }

  /**
   * Get recent messages for dashboard
   */
  async getRecentMessages(
    limit: number = 10,
    options?: ChatServiceOptions
  ): Promise<MessageWithSender[]> {
    if (!options) {
      throw new Error('User options required');
    }

    return await messageService.getRecentMessages(
      options.userId,
      options.userRole,
      limit
    );
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    messageId: string,
    options: ChatServiceOptions
  ): Promise<boolean> {
    return await messageService.deleteMessage(
      messageId,
      options.userId,
      options.userRole
    );
  }

  /**
   * Get file information
   */
  async getFileInfo(filename: string): Promise<FileUploadResult | null> {
    return await fileService.getFileInfo(filename);
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filename: string): Promise<boolean> {
    return await fileService.deleteFile(filename);
  }

  /**
   * Validate file before upload
   */
  validateFile(file: { size: number; mimetype: string; originalname: string }): {
    valid: boolean;
    error?: string;
  } {
    return fileService.validateFile(file);
  }
}

export const chatService = new ChatService();