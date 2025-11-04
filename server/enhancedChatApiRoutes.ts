import { Router } from 'express';
import { authMiddleware } from './auth';
import { chatService } from './chatService';
import { fileService } from './fileService';
import { notificationService } from './notificationService';
import type { ChatServiceOptions, CreateConversationData, SendMessageData } from './chatService';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Helper function to get user options from request
function getUserOptions(req: any): ChatServiceOptions {
  if (!req.user) {
    throw new Error('Authentication required');
  }
  return {
    userId: req.user.id,
    userRole: req.user.role
  };
}

// ==================== CONVERSATION ROUTES ====================

/**
 * GET /api/chat/conversations
 * Get user's conversations with filtering and pagination
 */
router.get('/conversations', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { type, status, search, limit, offset } = req.query;

    const filters: any = {};
    if (type) filters.type = type as string;
    if (status) filters.status = status as string;

    let conversations = await chatService.getConversations(filters, options);

    // Apply search filter if provided
    if (search) {
      conversations = await chatService.searchConversations(search as string, filters, options);
    }

    // Apply pagination
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedConversations = conversations.slice(offsetNum, offsetNum + limitNum);

    res.json({
      conversations: paginatedConversations,
      total: conversations.length,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/chat/conversations
 * Create a new conversation
 */
router.post('/conversations', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { type, participantId, subject, productId, initialMessage } = req.body;

    if (!type || !participantId) {
      return res.status(400).json({ 
        error: 'Missing required fields: type and participantId' 
      });
    }

    const conversationData: CreateConversationData = {
      type,
      participantId,
      subject,
      productId,
      initialMessage
    };

    const conversation = await chatService.createConversation(conversationData, options);

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ 
      error: 'Failed to create conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chat/conversations/:id
 * Get a specific conversation
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { id } = req.params;

    const conversation = await chatService.getConversations(
      undefined, 
      options
    ).then(conversations => conversations.find(c => c.id === id));

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/chat/conversations/:id/archive
 * Archive a conversation
 */
router.patch('/conversations/:id/archive', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { id } = req.params;

    await chatService.archiveConversation(id, options);

    res.json({ success: true, message: 'Conversation archived' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ 
      error: 'Failed to archive conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/chat/conversations/:id/close
 * Close a conversation (admin only)
 */
router.patch('/conversations/:id/close', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { id } = req.params;

    await chatService.closeConversation(id, options);

    res.json({ success: true, message: 'Conversation closed' });
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({ 
      error: 'Failed to close conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/chat/conversations/:id/assign
 * Assign conversation to admin (admin only)
 */
router.patch('/conversations/:id/assign', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    await chatService.assignConversation(id, adminId, options);

    res.json({ success: true, message: 'Conversation assigned' });
  } catch (error) {
    console.error('Error assigning conversation:', error);
    res.status(500).json({ 
      error: 'Failed to assign conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== MESSAGE ROUTES ====================

/**
 * GET /api/chat/conversations/:id/messages
 * Get messages for a conversation
 */
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { id } = req.params;
    const { limit, offset, isRead, senderType, hasAttachments } = req.query;

    const messageOptions: any = {
      limit: Math.min(parseInt(limit as string) || 50, 100),
      offset: parseInt(offset as string) || 0
    };

    // Apply filters
    const filters: any = {};
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (senderType) filters.senderType = senderType as string;
    if (hasAttachments !== undefined) filters.hasAttachments = hasAttachments === 'true';

    if (Object.keys(filters).length > 0) {
      messageOptions.filters = filters;
    }

    const messages = await chatService.getMessages(id, messageOptions, options);

    res.json({ 
      messages,
      total: messages.length,
      limit: messageOptions.limit,
      offset: messageOptions.offset
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/chat/conversations/:id/messages
 * Send a message in a conversation
 */
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { id } = req.params;
    const { message, attachments, productReferences } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const messageData: SendMessageData = {
      conversationId: id,
      message: message.trim(),
      attachments,
      productReferences
    };

    const sentMessage = await chatService.sendMessage(messageData, options);

    res.status(201).json({ message: sentMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/chat/conversations/:id/messages/read
 * Mark messages as read
 */
router.patch('/conversations/:id/messages/read', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { id } = req.params;
    const { messageIds } = req.body;

    const markedCount = await chatService.markMessagesAsRead(id, messageIds, options);

    res.json({ 
      success: true, 
      markedCount,
      message: `${markedCount} messages marked as read`
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ 
      error: 'Failed to mark messages as read',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/chat/messages/:id
 * Delete a message
 */
router.delete('/messages/:id', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { id } = req.params;

    const deleted = await chatService.deleteMessage(id, options);

    if (!deleted) {
      return res.status(404).json({ error: 'Message not found or cannot be deleted' });
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      error: 'Failed to delete message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== FILE UPLOAD ROUTES ====================

/**
 * POST /api/chat/upload
 * Upload files for chat
 */
router.post('/upload', fileService.getMulterConfig().array('files', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadResults = await chatService.uploadFiles(files);

    res.json({ 
      success: true,
      files: uploadResults,
      count: uploadResults.length
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ 
      error: 'Failed to upload files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/chat/upload/base64
 * Upload file from base64 data
 */
router.post('/upload/base64', async (req, res) => {
  try {
    const { data, filename, mimeType } = req.body;

    if (!data || !filename || !mimeType) {
      return res.status(400).json({ 
        error: 'Missing required fields: data, filename, mimeType' 
      });
    }

    const uploadResult = await chatService.uploadFromBase64(data, filename, mimeType);

    res.json({ 
      success: true,
      file: uploadResult
    });
  } catch (error) {
    console.error('Error uploading base64 file:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chat/files/:filename
 * Get file information
 */
router.get('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    const fileInfo = await chatService.getFileInfo(filename);

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file: fileInfo });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ 
      error: 'Failed to get file info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/chat/files/:filename
 * Delete an uploaded file
 */
router.delete('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    const deleted = await chatService.deleteFile(filename);

    if (!deleted) {
      return res.status(404).json({ error: 'File not found or cannot be deleted' });
    }

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== SEARCH ROUTES ====================

/**
 * GET /api/chat/search/conversations
 * Search conversations
 */
router.get('/search/conversations', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { q, type, status, limit } = req.query;

    if (!q || (q as string).trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const filters: any = {};
    if (type) filters.type = type as string;
    if (status) filters.status = status as string;

    const conversations = await chatService.searchConversations(
      (q as string).trim(),
      filters,
      options
    );

    // Apply limit
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const limitedResults = conversations.slice(0, limitNum);

    res.json({ 
      conversations: limitedResults,
      total: conversations.length,
      query: q,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error searching conversations:', error);
    res.status(500).json({ 
      error: 'Failed to search conversations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chat/search/messages
 * Search messages
 */
router.get('/search/messages', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { q, conversationId, limit } = req.query;

    if (!q || (q as string).trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchOptions: any = {
      limit: Math.min(parseInt(limit as string) || 20, 100)
    };

    if (conversationId) {
      searchOptions.conversationId = conversationId as string;
    }

    const results = await chatService.searchMessages(
      (q as string).trim(),
      searchOptions,
      options
    );

    res.json({ 
      results,
      total: results.length,
      query: q,
      limit: searchOptions.limit
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ 
      error: 'Failed to search messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== ANALYTICS & STATS ROUTES ====================

/**
 * GET /api/chat/analytics
 * Get chat analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { timeRange } = req.query;

    const analytics = await chatService.getChatAnalytics(
      timeRange as 'day' | 'week' | 'month',
      options
    );

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching chat analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chat/unread-counts
 * Get unread message and conversation counts
 */
router.get('/unread-counts', async (req, res) => {
  try {
    const options = getUserOptions(req);

    const counts = await chatService.getUnreadCounts(options);

    res.json({ counts });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch unread counts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chat/recent-messages
 * Get recent messages for dashboard
 */
router.get('/recent-messages', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { limit } = req.query;

    const messages = await chatService.getRecentMessages(
      Math.min(parseInt(limit as string) || 10, 50),
      options
    );

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== REAL-TIME FEATURES ====================

/**
 * POST /api/chat/typing
 * Send typing indicator
 */
router.post('/typing', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { conversationId, isTyping } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    chatService.sendTypingIndicator(conversationId, isTyping === true, options);

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
    res.status(500).json({ 
      error: 'Failed to send typing indicator',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/chat/status
 * Update user online status
 */
router.post('/status', async (req, res) => {
  try {
    const options = getUserOptions(req);
    const { isOnline } = req.body;

    chatService.updateUserStatus(isOnline === true, options);

    res.json({ success: true, isOnline: isOnline === true });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      error: 'Failed to update status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;