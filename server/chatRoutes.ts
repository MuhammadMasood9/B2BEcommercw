import { Router } from 'express';
import { storage } from './storage';
import { authMiddleware } from './auth';
import { checkSupplierRestriction } from './middleware/restrictionMiddleware';
import { db } from './db';
import { notifications, users, conversations, messages } from '../shared/schema';
import { eq, and, ne, sql, inArray } from 'drizzle-orm';

const router = Router();

// Helper function to create notification
async function createNotification(data: {
  userId: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}) {
  try {
    await db.insert(notifications).values(data);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Get all conversations for a user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let conversations;
    if (userRole === 'admin') {
      conversations = await storage.getAdminConversations(userId);
    } else if (userRole === 'supplier') {
      conversations = await storage.getSupplierConversations(userId);
    } else {
      conversations = await storage.getBuyerConversations(userId);
    }

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversations for a specific buyer (used by client-side components)
router.get('/conversations/buyer/:buyerId', authMiddleware, async (req, res) => {
  try {
    const { buyerId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Allow both the buyer themselves and admins to fetch buyer conversations
    if (userRole === 'buyer' && userId !== buyerId) {
      return res.status(403).json({ error: 'You can only view your own conversations' });
    }

    const conversations = await storage.getBuyerConversations(buyerId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching buyer conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get all conversations for admin management
router.get('/conversations/admin/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can access all conversations
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access all conversations' });
    }

    // For FloatingChat, we want to show ALL conversations, not just those assigned to this specific admin
    const conversations = await storage.getAllConversationsForAdmin(); // Call without adminId to get all conversations
    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching all conversations for admin:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const messages = await storage.getConversationMessages(conversationId, userId, userRole);
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new conversation
router.post('/conversations', authMiddleware, checkSupplierRestriction, async (req, res) => {
  try {
    const { buyerId, adminId, supplierId, productId, type } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Allow buyers, admins, and suppliers to create conversations
    if (!['buyer', 'admin', 'supplier'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Only buyers, admins, and suppliers can create conversations' });
    }

    // Determine conversation participants based on user role
    let actualBuyerId: string;
    let actualAdminId: string | undefined = undefined;
    let actualSupplierId: string | undefined = undefined;
    let conversationType: string;
    
    if (userRole === 'buyer') {
      actualBuyerId = userId;
      actualSupplierId = supplierId || undefined;
      actualAdminId = adminId || undefined;

      // If no supplier specified, fallback to admin support
      if (!actualSupplierId && !actualAdminId) {
        const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
        actualAdminId = adminUsers[0]?.id || undefined;
      }

      if (!actualSupplierId && !actualAdminId) {
        return res.status(400).json({ error: 'No supplier or admin available to start a conversation' });
      }

      // Determine conversation type based on participants
      if (actualSupplierId && actualAdminId) {
        conversationType = type || 'support'; // Multi-party conversation
      } else if (actualSupplierId) {
        conversationType = type || 'buyer_supplier';
      } else {
        conversationType = type || 'buyer_admin';
      }
    } else if (userRole === 'supplier') {
      actualSupplierId = userId;
      actualBuyerId = buyerId;
      actualAdminId = adminId || undefined;

      if (!actualBuyerId) {
        return res.status(400).json({ error: 'Buyer ID is required when suppliers initiate conversations' });
      }

      // Determine conversation type
      if (actualAdminId) {
        conversationType = type || 'support'; // Multi-party conversation
      } else {
        conversationType = type || 'buyer_supplier';
      }
    } else if (userRole === 'admin') {
      actualAdminId = userId;
      actualBuyerId = buyerId;
      actualSupplierId = supplierId || undefined;

      if (!actualBuyerId) {
        return res.status(400).json({ error: 'Buyer ID is required to start a conversation' });
      }

      // Determine conversation type
      if (actualSupplierId) {
        conversationType = type || 'support'; // Multi-party conversation
      } else {
        conversationType = type || 'buyer_admin';
      }
    } else {
      return res.status(403).json({ error: 'Invalid user role for conversation creation' });
    }
    
    // Validate conversation type
    const validTypes = ['buyer_supplier', 'buyer_admin', 'support'];
    if (!validTypes.includes(conversationType)) {
      return res.status(400).json({ error: 'Invalid conversation type. Must be one of: buyer_supplier, buyer_admin, support' });
    }

    // Resolve supplier user ID if needed
    if (actualSupplierId) {
      const resolved = await storage.resolveSupplierUserId(actualSupplierId);
      actualSupplierId = resolved || actualSupplierId;
    }

    // Validate that all participant IDs exist and are active users
    const participantIds = [actualBuyerId, actualSupplierId, actualAdminId].filter(Boolean) as string[];
    const participantUsers = await db.select({ id: users.id, role: users.role, isActive: users.isActive })
      .from(users)
      .where(inArray(users.id, participantIds));

    if (participantUsers.length !== participantIds.length) {
      return res.status(400).json({ error: 'One or more participants not found' });
    }

    const inactiveUsers = participantUsers.filter(user => !user.isActive);
    if (inactiveUsers.length > 0) {
      return res.status(400).json({ error: 'One or more participants are inactive' });
    }

    // Validate participant roles match expected types
    const buyerUser = participantUsers.find(u => u.id === actualBuyerId);
    const supplierUser = actualSupplierId ? participantUsers.find(u => u.id === actualSupplierId) : null;
    const adminUser = actualAdminId ? participantUsers.find(u => u.id === actualAdminId) : null;

    if (buyerUser && buyerUser.role !== 'buyer') {
      return res.status(400).json({ error: 'Specified buyer ID does not belong to a buyer user' });
    }
    if (supplierUser && supplierUser.role !== 'supplier') {
      return res.status(400).json({ error: 'Specified supplier ID does not belong to a supplier user' });
    }
    if (adminUser && adminUser.role !== 'admin') {
      return res.status(400).json({ error: 'Specified admin ID does not belong to an admin user' });
    }

    const conversation = await storage.createConversation({
      buyerId: actualBuyerId,
      adminId: actualAdminId,
      supplierId: actualSupplierId,
      productId,
      type: conversationType
    });

    res.status(201).json({
      id: conversation.id,
      type: conversation.type,
      participants: {
        buyer: { id: actualBuyerId },
        supplier: actualSupplierId ? { id: actualSupplierId } : undefined,
        admin: actualAdminId ? { id: actualAdminId } : undefined
      },
      product: productId ? { id: productId } : undefined,
      createdAt: conversation.createdAt
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('SASL')) {
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: 'Unable to connect to database. Please try again later.'
      });
    }
    
    // Check if it's a database table error
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Database table not found',
        message: 'Required database tables are missing. Please contact support.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', authMiddleware, checkSupplierRestriction, async (req, res) => {

  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate message content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.length > 10000) {
      return res.status(400).json({ error: 'Message content exceeds maximum length of 10000 characters' });
    }

    // Validate attachments if provided
    if (attachments && Array.isArray(attachments)) {
      if (attachments.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 attachments allowed per message' });
      }
      
      for (const attachment of attachments) {
        if (typeof attachment !== 'string' || attachment.trim().length === 0) {
          return res.status(400).json({ error: 'Invalid attachment format' });
        }
      }
    }

    // Get conversation to verify access and determine participants
    const conversation = await storage.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Resolve supplier user ID if needed
    let normalizedSupplierId = conversation.supplierId;
    if (conversation.supplierId) {
      normalizedSupplierId = await storage.resolveSupplierUserId(conversation.supplierId);
    }

    // Verify user is a participant in this conversation
    const isBuyer = conversation.buyerId === userId;
    const isSupplier = normalizedSupplierId && normalizedSupplierId === userId;
    const isAdmin = conversation.adminId && conversation.adminId === userId;

    if (!isBuyer && !isSupplier && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to send messages in this conversation' });
    }

    // Determine sender type for proper unread count handling
    let senderType: string;
    if (isBuyer) {
      senderType = 'buyer';
    } else if (isSupplier) {
      senderType = 'supplier';
    } else if (isAdmin) {
      senderType = 'admin';
    } else {
      return res.status(400).json({ error: 'Unable to determine sender type' });
    }

    // Determine receiver ID based on sender and conversation participants
    let receiverId: string | null = null;
    if (isBuyer) {
      // Buyer sending message - send to supplier or admin (prefer supplier if both exist)
      receiverId = normalizedSupplierId || conversation.adminId || null;
    } else if (isSupplier) {
      // Supplier sending message - send to buyer
      receiverId = conversation.buyerId;
    } else if (isAdmin) {
      // Admin sending message - send to buyer (primary recipient)
      receiverId = conversation.buyerId;
    }

    if (!receiverId) {
      return res.status(400).json({ error: 'Unable to determine message recipient for this conversation' });
    }

    // Create the message (this will automatically update unread counts based on sender type)
    const message = await storage.createMessage({
      conversationId,
      senderId: userId,
      receiverId,
      senderType,
      message: content,
      attachments: attachments || []
    });

    // Create notifications for all recipients (except sender)
    const recipients = [];
    if (conversation.buyerId !== userId) recipients.push(conversation.buyerId);
    if (normalizedSupplierId && normalizedSupplierId !== userId) recipients.push(normalizedSupplierId);
    if (conversation.adminId && conversation.adminId !== userId) recipients.push(conversation.adminId);

    // Create notifications and send WebSocket events
    const { websocketService } = await import('./websocket');
    const sender = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const senderName = sender[0] ? `${sender[0].firstName || ''} ${sender[0].lastName || ''}`.trim() : 'Unknown';

    for (const recipientId of recipients) {
      // Create notification
      await createNotification({
        userId: recipientId,
        type: 'info',
        title: 'New Message',
        message: `You have a new message from ${senderName}`,
        relatedId: conversationId,
        relatedType: 'chat'
      });

      // Send real-time WebSocket notification
      websocketService.sendToUser(recipientId, {
        type: 'message',
        payload: {
          conversationId,
          message: {
            id: message.id,
            senderId: userId,
            senderName,
            senderType,
            message: content,
            attachments: attachments || [],
            createdAt: message.createdAt
          }
        }
      });
    }

    res.status(201).json({ 
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        senderType: message.senderType,
        message: message.message,
        attachments: message.attachments,
        isRead: message.isRead,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.patch('/conversations/:conversationId/read', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get conversation to verify access and determine user role in conversation
    const conversation = await storage.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Resolve supplier user ID if needed
    let normalizedSupplierId = conversation.supplierId;
    if (conversation.supplierId) {
      normalizedSupplierId = await storage.resolveSupplierUserId(conversation.supplierId);
    }

    // Verify user is a participant in this conversation and determine their role
    const isBuyer = conversation.buyerId === userId;
    const isSupplier = normalizedSupplierId && normalizedSupplierId === userId;
    const isAdmin = conversation.adminId && conversation.adminId === userId;

    if (!isBuyer && !isSupplier && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to access this conversation' });
    }

    // Determine user's role in this conversation for proper unread count reset
    let conversationRole: string;
    if (isBuyer) {
      conversationRole = 'buyer';
    } else if (isSupplier) {
      conversationRole = 'supplier';
    } else if (isAdmin) {
      conversationRole = 'admin';
    } else {
      return res.status(400).json({ error: 'Unable to determine user role in conversation' });
    }

    // Mark messages as read in the messages table (only messages not sent by this user)
    const updatedMessages = await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId), // Only mark messages not sent by this user
          eq(messages.isRead, false) // Only update unread messages
        )
      )
      .returning({ id: messages.id });

    // Reset the appropriate unread count based on user role in the conversation
    const updateData: any = {};
    
    if (conversationRole === 'buyer') {
      updateData.unreadCountBuyer = 0;
    } else if (conversationRole === 'supplier') {
      updateData.unreadCountSupplier = 0;
    } else if (conversationRole === 'admin') {
      updateData.unreadCountAdmin = 0;
    }

    // Update conversation unread count
    await db.update(conversations)
      .set(updateData)
      .where(eq(conversations.id, conversationId));

    // Get the updated unread count for this user across all conversations
    const updatedUnreadCount = await storage.getUnreadMessageCount(userId);

    // Send WebSocket notification about read status update
    try {
      const { websocketService } = await import('./websocket');
      
      // Notify other participants that messages were read
      const otherParticipants = [];
      if (conversation.buyerId !== userId) otherParticipants.push(conversation.buyerId);
      if (normalizedSupplierId && normalizedSupplierId !== userId) otherParticipants.push(normalizedSupplierId);
      if (conversation.adminId && conversation.adminId !== userId) otherParticipants.push(conversation.adminId);

      for (const participantId of otherParticipants) {
        websocketService.sendToUser(participantId, {
          type: 'read',
          payload: {
            conversationId,
            userId,
            userRole: conversationRole,
            readAt: new Date().toISOString(),
            messagesRead: updatedMessages.length
          }
        });
      }
    } catch (wsError) {
      console.error('Error sending WebSocket read notification:', wsError);
      // Don't fail the request if WebSocket fails
    }

    res.json({ 
      success: true, 
      unreadCount: updatedUnreadCount,
      messagesMarkedAsRead: updatedMessages.length
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await storage.getUnreadMessageCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Get unread message count for specific user ID (admin only)
router.get('/unread-count/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.role;
    
    if (!requestingUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow users to get their own unread count, or admins to get any user's count
    if (requestingUserRole !== 'admin' && requestingUserId !== userId) {
      return res.status(403).json({ error: 'You can only access your own unread count' });
    }

    const count = await storage.getUnreadMessageCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Get available admins for buyers to start conversations
router.get('/admins', authMiddleware, async (req, res) => {
  try {
    const admins = await storage.getAvailableAdmins();
    res.json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Update user online status
router.post('/user/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { isOnline } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await storage.updateUserOnlineStatus(userId, isOnline);
    res.json({ success: true, isOnline });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get user online status
router.get('/user/:userId/status', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const status = await storage.getUserOnlineStatus(userId);
    
    if (!status) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching user status:', error);
    res.status(500).json({ error: 'Failed to fetch user status' });
  }
});

export default router;
