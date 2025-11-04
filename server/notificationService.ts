import { EventEmitter } from 'events';
import { db } from './db';
import { notifications, users, conversations, messages } from '../shared/schema';
import { eq, and, desc, count } from 'drizzle-orm';

interface NotificationData {
  userId: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}

interface RealTimeNotification extends NotificationData {
  id: string;
  read: boolean;
  createdAt: Date;
}

interface ChatNotificationData {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'supplier' | 'admin';
  messageContent: string;
  messageType?: 'text' | 'image' | 'file';
  attachmentCount?: number;
}

interface TypingIndicatorData {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface UserStatusData {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

class NotificationService extends EventEmitter {
  private connectedUsers: Map<string, Set<any>> = new Map(); // userId -> Set of WebSocket connections

  constructor() {
    super();
  }

  // Add a WebSocket connection for a user
  addConnection(userId: string, ws: any) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(ws);

    // Remove connection when it closes
    ws.on('close', () => {
      this.removeConnection(userId, ws);
    });

    ws.on('error', () => {
      this.removeConnection(userId, ws);
    });
  }

  // Remove a WebSocket connection for a user
  removeConnection(userId: string, ws: any) {
    const userConnections = this.connectedUsers.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  // Create and send a notification
  async createNotification(data: NotificationData): Promise<RealTimeNotification | null> {
    try {
      // Save to database
      const [notification] = await db.insert(notifications).values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        read: false
      }).returning();

      if (!notification) {
        console.error('Failed to create notification in database');
        return null;
      }

      const realTimeNotification: RealTimeNotification = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as 'info' | 'success' | 'error' | 'warning',
        title: notification.title,
        message: notification.message,
        relatedId: notification.relatedId || undefined,
        relatedType: notification.relatedType || undefined,
        read: notification.read,
        createdAt: notification.createdAt
      };

      // Send real-time notification to connected clients
      this.sendRealTimeNotification(data.userId, realTimeNotification);

      // Emit event for other services to listen to
      this.emit('notification', realTimeNotification);

      return realTimeNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Send real-time notification to user's connected clients
  private sendRealTimeNotification(userId: string, notification: RealTimeNotification) {
    const userConnections = this.connectedUsers.get(userId);
    if (userConnections && userConnections.size > 0) {
      const message = JSON.stringify({
        type: 'notification',
        data: notification
      });

      userConnections.forEach(ws => {
        try {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(message);
          }
        } catch (error) {
          console.error('Error sending real-time notification:', error);
          this.removeConnection(userId, ws);
        }
      });
    }
  }

  // Send real-time message notification
  async notifyNewMessage(conversationId: string, senderId: string, receiverId: string, messageContent: string) {
    try {
      // Get sender information
      const [sender] = await db.select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role
      }).from(users).where(eq(users.id, senderId)).limit(1);

      if (!sender) {
        console.error('Sender not found for message notification');
        return;
      }

      const senderName = sender.firstName ? `${sender.firstName} ${sender.lastName || ''}`.trim() : sender.email;
      const senderRole = sender.role;

      // Create notification for receiver
      await this.createNotification({
        userId: receiverId,
        type: 'info',
        title: `New message from ${senderName}`,
        message: messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent,
        relatedId: conversationId,
        relatedType: 'chat'
      });

      // Send real-time chat update
      this.sendRealTimeUpdate(receiverId, {
        type: 'new_message',
        conversationId,
        senderId,
        senderName,
        senderRole,
        messageContent: messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent
      });

    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }

  // Enhanced chat notification methods
  async notifyNewChatMessage(data: ChatNotificationData): Promise<void> {
    try {
      // Get conversation participants
      const [conversation] = await db.select()
        .from(conversations)
        .where(eq(conversations.id, data.conversationId))
        .limit(1);

      if (!conversation) {
        console.error('Conversation not found for notification');
        return;
      }

      // Determine recipients based on conversation type and sender
      const recipients: string[] = [];
      
      if (conversation.buyerId && conversation.buyerId !== data.senderId) {
        recipients.push(conversation.buyerId);
      }
      if (conversation.supplierId && conversation.supplierId !== data.senderId) {
        recipients.push(conversation.supplierId);
      }
      if (conversation.adminId && conversation.adminId !== data.senderId) {
        recipients.push(conversation.adminId);
      }

      // Send notifications to all recipients
      for (const recipientId of recipients) {
        await this.createNotification({
          userId: recipientId,
          type: 'info',
          title: `New message from ${data.senderName}`,
          message: data.messageContent.length > 100 ? 
            data.messageContent.substring(0, 100) + '...' : 
            data.messageContent,
          relatedId: data.conversationId,
          relatedType: 'chat'
        });

        // Send real-time update
        this.sendChatUpdate(recipientId, {
          type: 'new_message',
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          messageContent: data.messageContent,
          messageType: data.messageType,
          attachmentCount: data.attachmentCount,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error sending chat message notification:', error);
    }
  }

  // Send typing indicator
  sendTypingIndicator(data: TypingIndicatorData): void {
    try {
      // Get conversation participants and notify them
      this.getConversationParticipants(data.conversationId).then(participants => {
        participants.forEach(participantId => {
          if (participantId !== data.userId) {
            this.sendRealTimeUpdate(participantId, {
              type: 'typing_indicator',
              conversationId: data.conversationId,
              userId: data.userId,
              userName: data.userName,
              isTyping: data.isTyping
            });
          }
        });
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  // Send user status update
  broadcastUserStatus(data: UserStatusData): void {
    try {
      // Broadcast to all connected users
      this.connectedUsers.forEach((connections, connectedUserId) => {
        if (connectedUserId !== data.userId) {
          this.sendRealTimeUpdate(connectedUserId, {
            type: 'user_status',
            userId: data.userId,
            isOnline: data.isOnline,
            lastSeen: data.lastSeen
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting user status:', error);
    }
  }

  // Send conversation status updates (assigned, closed, etc.)
  async notifyConversationStatusChange(
    conversationId: string,
    status: 'assigned' | 'closed' | 'escalated' | 'archived',
    details: any
  ): Promise<void> {
    try {
      const participants = await this.getConversationParticipants(conversationId);
      
      participants.forEach(participantId => {
        this.sendRealTimeUpdate(participantId, {
          type: 'conversation_status',
          conversationId,
          status,
          details,
          timestamp: new Date()
        });
      });
    } catch (error) {
      console.error('Error notifying conversation status change:', error);
    }
  }

  // Get unread message count for user
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const [result] = await db.select({ count: count() })
        .from(messages)
        .leftJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(and(
          eq(messages.isRead, false),
          eq(messages.senderId, userId) === false, // Not sent by user
          // User is participant in conversation
          eq(conversations.buyerId, userId) ||
          eq(conversations.supplierId, userId) ||
          eq(conversations.adminId, userId)
        ));

      return result.count;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  // Send chat-specific real-time update
  private sendChatUpdate(userId: string, update: any): void {
    const userConnections = this.connectedUsers.get(userId);
    if (userConnections && userConnections.size > 0) {
      const message = JSON.stringify({
        type: 'chat_update',
        data: update
      });

      userConnections.forEach(ws => {
        try {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(message);
          }
        } catch (error) {
          console.error('Error sending chat update:', error);
          this.removeConnection(userId, ws);
        }
      });
    }
  }

  // Get conversation participants
  private async getConversationParticipants(conversationId: string): Promise<string[]> {
    try {
      const [conversation] = await db.select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        return [];
      }

      const participants: string[] = [];
      if (conversation.buyerId) participants.push(conversation.buyerId);
      if (conversation.supplierId) participants.push(conversation.supplierId);
      if (conversation.adminId) participants.push(conversation.adminId);

      return participants;
    } catch (error) {
      console.error('Error getting conversation participants:', error);
      return [];
    }
  }

  // Send real-time update (not stored in database)
  private sendRealTimeUpdate(userId: string, update: any) {
    const userConnections = this.connectedUsers.get(userId);
    if (userConnections && userConnections.size > 0) {
      const message = JSON.stringify({
        type: 'update',
        data: update
      });

      userConnections.forEach(ws => {
        try {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(message);
          }
        } catch (error) {
          console.error('Error sending real-time update:', error);
          this.removeConnection(userId, ws);
        }
      });
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connections count for a specific user
  getUserConnectionsCount(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  // Broadcast to all connected users (admin feature)
  async broadcastToAll(notification: Omit<NotificationData, 'userId'>) {
    try {
      // Get all connected users
      const connectedUserIds = Array.from(this.connectedUsers.keys());
      
      // Send notification to each connected user
      for (const userId of connectedUserIds) {
        await this.createNotification({
          ...notification,
          userId
        });
      }
    } catch (error) {
      console.error('Error broadcasting to all users:', error);
    }
  }



  // Send user online status update
  sendUserStatusUpdate(userId: string, isOnline: boolean, lastSeen?: Date) {
    // Broadcast to all connected users
    this.connectedUsers.forEach((connections, connectedUserId) => {
      if (connectedUserId !== userId) { // Don't send to the user themselves
        this.sendRealTimeUpdate(connectedUserId, {
          type: 'user_status',
          userId,
          isOnline,
          lastSeen
        });
      }
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Helper function for backward compatibility
export async function createNotification(data: NotificationData) {
  return await notificationService.createNotification(data);
}