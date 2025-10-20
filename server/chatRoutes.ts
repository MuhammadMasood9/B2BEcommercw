import { Router } from 'express';
import { storage } from './storage';
import { authMiddleware } from './auth';

const router = Router();

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

    const conversations = await storage.getAllConversationsForAdmin();
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
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    console.log('Creating conversation with data:', req.body);
    const { buyerId, adminId, subject, productId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      console.log('No user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Allow both buyers and admins to create conversations
    if (req.user?.role !== 'buyer' && req.user?.role !== 'admin') {
      console.log('User role is not buyer or admin:', req.user?.role);
      return res.status(403).json({ error: 'Only buyers and admins can create conversations' });
    }

    console.log('Creating conversation for user:', userId, 'admin:', adminId);
    
    // Determine buyer and admin IDs based on user role
    let actualBuyerId, actualAdminId;
    if (req.user?.role === 'buyer') {
      actualBuyerId = userId;
      actualAdminId = adminId || 'admin';
    } else if (req.user?.role === 'admin') {
      // If admin is creating conversation, they become the admin and buyerId comes from request
      actualBuyerId = buyerId || userId; // Use provided buyerId or fallback to current user
      actualAdminId = userId; // Current admin user becomes the admin
    } else {
      return res.status(403).json({ error: 'Invalid user role for conversation creation' });
    }
    
    const conversation = await storage.createConversation({
      buyerId: actualBuyerId,
      adminId: actualAdminId,
      subject: subject || `Inquiry about Product ${productId || ''}`,
      productId
    });

    console.log('Conversation created successfully:', conversation);
    res.status(201).json(conversation);
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
router.post('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', attachments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get conversation to determine receiver
    const conversation = await storage.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const receiverId = conversation.buyerId === userId ? conversation.unreadCountAdmin : conversation.buyerId;

    const message = await storage.createMessage({
      conversationId,
      senderId: userId,
      receiverId,
      message: content,
      attachments
    });

    // Update conversation last message time
    await storage.updateConversationLastMessage(conversationId);

    res.status(201).json({ message });
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
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await storage.markMessagesAsRead(conversationId, userId);
    res.json({ success: true });
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

// Get unread message count for specific user ID
router.get('/unread-count/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
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
