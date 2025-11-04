import { Router } from 'express';
import { storage } from './storage';
import { authMiddleware } from './auth';
import { db } from './db';
import { notifications, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { notificationService } from './notificationService';

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
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    console.log('Creating conversation with data:', req.body);
    const { buyerId, adminId, supplierId, subject, productId, type = 'buyer_admin' } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      console.log('No user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Allow buyers, suppliers, and admins to create conversations
    if (!['buyer', 'supplier', 'admin'].includes(userRole)) {
      console.log('Invalid user role:', userRole);
      return res.status(403).json({ error: 'Invalid user role for conversation creation' });
    }

    console.log('Creating conversation for user:', userId, 'type:', type);
    
    let conversationData: any = {
      subject: subject || 'New conversation',
      productId
    };

    // Determine conversation participants based on type and user role
    if (type === 'buyer_supplier') {
      if (userRole === 'buyer') {
        conversationData.buyerId = userId;
        conversationData.supplierId = supplierId;
      } else if (userRole === 'supplier') {
        conversationData.buyerId = buyerId;
        conversationData.supplierId = userId;
      } else {
        return res.status(403).json({ error: 'Admins cannot create buyer-supplier conversations' });
      }
    } else if (type === 'buyer_admin') {
      if (userRole === 'buyer') {
        conversationData.buyerId = userId;
        // Get the first admin user ID from the database
        const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
        conversationData.adminId = adminUsers[0]?.id || userId;
      } else if (userRole === 'admin') {
        conversationData.buyerId = buyerId || userId;
        conversationData.adminId = userId;
      }
    } else if (type === 'supplier_admin') {
      if (userRole === 'supplier') {
        conversationData.supplierId = userId;
        // Get the first admin user ID from the database
        const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
        conversationData.adminId = adminUsers[0]?.id || userId;
      } else if (userRole === 'admin') {
        conversationData.supplierId = supplierId || userId;
        conversationData.adminId = userId;
      }
    }
    
    const conversation = await storage.createConversation(conversationData);

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
    const { content, messageType = 'text', attachments, productReferences } = req.body;
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
      senderType: userRole as 'buyer' | 'supplier' | 'admin',
      message: content,
      attachments: attachments ? JSON.stringify(attachments) : undefined,
      productReferences: productReferences || []
    });

    // Update conversation last message time
    await storage.updateConversationLastMessage(conversationId);

    // Send real-time notification for new message
    if (receiverId) {
      await notificationService.notifyNewMessage(conversationId, userId, receiverId, content);
    }

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

// Get suppliers for buyer-supplier chat
router.get('/suppliers', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only buyers can get supplier list for chat
    if (userRole !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can access supplier list' });
    }

    const suppliers = await storage.getActiveSuppliers();
    res.json({ suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get products for product reference in chat
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let products;
    if (userRole === 'buyer') {
      // Buyers can see all approved products
      products = await storage.getApprovedProducts();
    } else if (userRole === 'supplier') {
      // Suppliers can see their own products
      products = await storage.getSupplierProducts(userId);
    } else {
      // Admins can see all products
      products = await storage.getAllProducts();
    }

    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
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

// Assign conversation to admin
router.patch('/conversations/:conversationId/assign', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { adminId, priority } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can assign conversations
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can assign conversations' });
    }

    await storage.assignConversation(conversationId, adminId, priority);
    
    // Create notification for assignment
    await notificationService.createNotification({
      userId: adminId,
      type: 'info',
      title: 'Conversation Assigned',
      message: `You have been assigned to a support conversation`,
      relatedId: conversationId,
      relatedType: 'chat'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error assigning conversation:', error);
    res.status(500).json({ error: 'Failed to assign conversation' });
  }
});

// Update conversation priority
router.patch('/conversations/:conversationId/priority', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { priority } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can update priority
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update priority' });
    }

    await storage.updateConversationPriority(conversationId, priority);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ error: 'Failed to update priority' });
  }
});

// Close/resolve conversation
router.patch('/conversations/:conversationId/close', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can close conversations
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can close conversations' });
    }

    await storage.closeConversation(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({ error: 'Failed to close conversation' });
  }
});

// Escalate conversation
router.patch('/conversations/:conversationId/escalate', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { reason, escalateTo } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can escalate conversations
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can escalate conversations' });
    }

    await storage.escalateConversation(conversationId, userId, escalateTo, reason);
    
    // Create notification for escalation
    if (escalateTo) {
      await notificationService.createNotification({
        userId: escalateTo,
        type: 'warning',
        title: 'Conversation Escalated',
        message: `A conversation has been escalated to you: ${reason}`,
        relatedId: conversationId,
        relatedType: 'chat'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error escalating conversation:', error);
    res.status(500).json({ error: 'Failed to escalate conversation' });
  }
});

// ==================== CHAT TEMPLATES ROUTES ====================

// Get chat templates
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const templates = await storage.getChatTemplates(userId, userRole);
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create chat template
router.post('/templates', authMiddleware, async (req, res) => {
  try {
    const { name, content, category, tags } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const template = await storage.createChatTemplate({
      name,
      content,
      category,
      tags,
      createdBy: userId
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update chat template
router.put('/templates/:templateId', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, content, category, tags } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const template = await storage.updateChatTemplate(templateId, {
      name,
      content,
      category,
      tags
    });

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete chat template
router.delete('/templates/:templateId', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await storage.deleteChatTemplate(templateId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Use template (increment usage count)
router.post('/templates/:templateId/use', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    
    await storage.incrementTemplateUsage(templateId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating template usage:', error);
    res.status(500).json({ error: 'Failed to update template usage' });
  }
});

// ==================== QUICK RESPONSES ROUTES ====================

// Get quick responses
router.get('/quick-responses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const quickResponses = await storage.getQuickResponses(userId, userRole);
    res.json({ quickResponses });
  } catch (error) {
    console.error('Error fetching quick responses:', error);
    res.status(500).json({ error: 'Failed to fetch quick responses' });
  }
});

// Create quick response
router.post('/quick-responses', authMiddleware, async (req, res) => {
  try {
    const { text, category, shortcut } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const quickResponse = await storage.createQuickResponse({
      text,
      category,
      shortcut,
      createdBy: userId
    });

    res.status(201).json(quickResponse);
  } catch (error) {
    console.error('Error creating quick response:', error);
    res.status(500).json({ error: 'Failed to create quick response' });
  }
});

// ==================== CHAT ANALYTICS ROUTES ====================

// Get chat analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { timeRange = '7d', type = 'all' } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins and suppliers can access analytics
    if (!['admin', 'supplier'].includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analytics = await storage.getChatAnalytics(userId, userRole, timeRange as string, type as string);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
