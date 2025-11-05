import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes';
import { db } from '../../db';

// Mock database for e2e tests
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}));

// Mock notification service
vi.mock('../../notificationService', () => ({
  notificationService: {
    createNotification: vi.fn(),
    sendRealTimeNotification: vi.fn(),
  }
}));

// Mock WebSocket for real-time features
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1, // OPEN
};

vi.mock('ws', () => ({
  WebSocketServer: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    clients: new Set([mockWebSocket]),
  })),
}));

// Mock auth middleware for testing
const mockAuthMiddleware = (role: string, userId: string = 'test-user-id') => (req: any, _res: any, next: any) => {
  req.user = { id: userId, role, email: `${role}@test.com` };
  next();
};

describe('Chat System Functionality End-to-End Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, _res, next) => {
      if (req.path.includes('/buyer/')) {
        return mockAuthMiddleware('buyer', 'buyer-user-123')(req, _res, next);
      }
      if (req.path.includes('/supplier/')) {
        return mockAuthMiddleware('supplier', 'supplier-user-123')(req, _res, next);
      }
      if (req.path.includes('/admin/')) {
        return mockAuthMiddleware('admin', 'admin-user-123')(req, _res, next);
      }
      next();
    });

    // Register routes
    registerRoutes(app);
    
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Buyer-Supplier Chat Workflow', () => {
    it('should complete full buyer-supplier conversation workflow', async () => {
      // Mock buyer and supplier profiles
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'buyer-user-123',
        companyName: 'Test Buyer Company',
      };

      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-123',
        companyName: 'Tech Supplier Inc',
      };

      // Mock conversation creation
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        subject: 'Product Inquiry Discussion',
        status: 'active',
        lastMessageAt: null,
        createdAt: new Date().toISOString(),
      };

      // Mock messages
      const mockMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          senderId: 'buyer-user-123',
          senderType: 'buyer',
          message: 'Hello, I am interested in your electronic components.',
          attachments: [],
          productReferences: [],
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          conversationId: 'conv-123',
          senderId: 'supplier-user-123',
          senderType: 'supplier',
          message: 'Thank you for your interest! Which specific components are you looking for?',
          attachments: [],
          productReferences: [],
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      // Setup database mocks
      (db.select as any)
        // Mock buyer profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBuyer]),
            }),
          }),
        })
        // Mock supplier profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock existing conversation check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Mock conversation retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    conversation: mockConversation,
                    buyer: mockBuyer,
                    supplier: mockSupplier,
                  }]),
                }),
              }),
            }),
          }),
        })
        // Mock messages retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockMessages.map(msg => ({
                      message: msg,
                      sender: {
                        id: msg.senderId,
                        email: `${msg.senderType}@test.com`,
                      },
                    }))),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock message count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 2 }]),
          }),
        });

      // Mock conversation and message creation
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockConversation]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockMessages[0]]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockMessages[1]]),
          }),
        });

      // Mock conversation update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockConversation,
              lastMessageAt: new Date().toISOString(),
            }]),
          }),
        }),
      });

      // Step 1: Buyer initiates conversation with supplier
      const conversationData = {
        type: 'buyer_supplier',
        participants: {
          supplierId: 'supplier-123',
        },
        subject: 'Product Inquiry Discussion',
      };

      const createConversationResponse = await request(app)
        .post('/api/chat/conversations')
        .send(conversationData)
        .expect(201);

      expect(createConversationResponse.body.success).toBe(true);
      expect(createConversationResponse.body.conversation.type).toBe('buyer_supplier');
      expect(createConversationResponse.body.conversation.status).toBe('active');

      // Step 2: Buyer sends first message
      const firstMessageData = {
        conversationId: 'conv-123',
        message: 'Hello, I am interested in your electronic components.',
        attachments: [],
        productReferences: [],
      };

      const sendFirstMessageResponse = await request(app)
        .post('/api/chat/messages')
        .send(firstMessageData)
        .expect(201);

      expect(sendFirstMessageResponse.body.success).toBe(true);
      expect(sendFirstMessageResponse.body.message.senderType).toBe('buyer');
      expect(sendFirstMessageResponse.body.message.message).toContain('electronic components');

      // Step 3: Supplier responds to message
      const supplierResponseData = {
        conversationId: 'conv-123',
        message: 'Thank you for your interest! Which specific components are you looking for?',
        attachments: [],
        productReferences: [],
      };

      const supplierResponseResponse = await request(app)
        .post('/api/chat/messages')
        .send(supplierResponseData)
        .expect(201);

      expect(supplierResponseResponse.body.success).toBe(true);
      expect(supplierResponseResponse.body.message.senderType).toBe('supplier');

      // Step 4: Get conversation details with messages
      const conversationDetailsResponse = await request(app)
        .get('/api/chat/conversations/conv-123')
        .expect(200);

      expect(conversationDetailsResponse.body.success).toBe(true);
      expect(conversationDetailsResponse.body.conversation.buyer.companyName).toBe('Test Buyer Company');
      expect(conversationDetailsResponse.body.conversation.supplier.companyName).toBe('Tech Supplier Inc');

      // Step 5: Get conversation messages
      const messagesResponse = await request(app)
        .get('/api/chat/conversations/conv-123/messages')
        .query({
          page: 1,
          limit: 50,
        })
        .expect(200);

      expect(messagesResponse.body.success).toBe(true);
      expect(messagesResponse.body.messages).toHaveLength(2);
      expect(messagesResponse.body.messages[0].senderType).toBe('buyer');
      expect(messagesResponse.body.messages[1].senderType).toBe('supplier');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(6);
      expect(db.insert).toHaveBeenCalledTimes(3);
      expect(db.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complete Admin Support Chat Workflow', () => {
    it('should complete full admin support chat workflow', async () => {
      // Mock supplier requesting support
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-123',
        companyName: 'Tech Supplier Inc',
      };

      // Mock admin user
      const mockAdmin = {
        id: 'admin-user-123',
        role: 'admin',
        email: 'admin@test.com',
      };

      // Mock support conversation
      const mockSupportConversation = {
        id: 'support-conv-123',
        type: 'supplier_admin',
        supplierId: 'supplier-123',
        adminId: null,
        subject: 'Account Verification Issue',
        status: 'active',
        priority: 'medium',
        createdAt: new Date().toISOString(),
      };

      // Mock support messages
      const mockSupportMessages = [
        {
          id: 'support-msg-1',
          conversationId: 'support-conv-123',
          senderId: 'supplier-user-123',
          senderType: 'supplier',
          message: 'I am having trouble with my account verification. Can you help?',
          attachments: ['verification_docs.pdf'],
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'support-msg-2',
          conversationId: 'support-conv-123',
          senderId: 'admin-user-123',
          senderType: 'admin',
          message: 'I will review your verification documents and get back to you within 24 hours.',
          attachments: [],
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      // Setup database mocks
      (db.select as any)
        // Mock supplier profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock admin support queue
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue([{
                        conversation: mockSupportConversation,
                        supplier: mockSupplier,
                        buyer: null,
                      }]),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock support conversation count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 1 }]),
              }),
            }),
          }),
        })
        // Mock conversation assignment check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupportConversation]),
            }),
          }),
        })
        // Mock support messages
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(mockSupportMessages.map(msg => ({
                    message: msg,
                    sender: {
                      id: msg.senderId,
                      email: `${msg.senderType}@test.com`,
                    },
                  }))),
                }),
              }),
            }),
          }),
        });

      // Mock conversation and message creation
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockSupportConversation]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockSupportMessages[0]]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockSupportMessages[1]]),
          }),
        });

      // Mock conversation assignment
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockSupportConversation,
              adminId: 'admin-user-123',
            }]),
          }),
        }),
      });

      // Step 1: Supplier creates support ticket
      const supportTicketData = {
        type: 'supplier_admin',
        subject: 'Account Verification Issue',
        priority: 'medium',
        initialMessage: 'I am having trouble with my account verification. Can you help?',
        attachments: ['verification_docs.pdf'],
      };

      const createSupportTicketResponse = await request(app)
        .post('/api/chat/support')
        .send(supportTicketData)
        .expect(201);

      expect(createSupportTicketResponse.body.success).toBe(true);
      expect(createSupportTicketResponse.body.conversation.type).toBe('supplier_admin');
      expect(createSupportTicketResponse.body.conversation.subject).toBe('Account Verification Issue');

      // Step 2: Admin views support queue
      const supportQueueResponse = await request(app)
        .get('/api/admin/support/queue')
        .query({
          status: 'active',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(supportQueueResponse.body.success).toBe(true);
      expect(supportQueueResponse.body.conversations).toHaveLength(1);
      expect(supportQueueResponse.body.conversations[0].subject).toBe('Account Verification Issue');

      // Step 3: Admin assigns ticket to themselves
      const assignTicketResponse = await request(app)
        .patch('/api/admin/support/support-conv-123/assign')
        .send({
          adminId: 'admin-user-123',
        })
        .expect(200);

      expect(assignTicketResponse.body.success).toBe(true);
      expect(assignTicketResponse.body.conversation.adminId).toBe('admin-user-123');

      // Step 4: Admin responds to support ticket
      const adminResponseData = {
        conversationId: 'support-conv-123',
        message: 'I will review your verification documents and get back to you within 24 hours.',
        attachments: [],
      };

      const adminResponseResponse = await request(app)
        .post('/api/chat/messages')
        .send(adminResponseData)
        .expect(201);

      expect(adminResponseResponse.body.success).toBe(true);
      expect(adminResponseResponse.body.message.senderType).toBe('admin');

      // Step 5: Get support conversation messages
      const supportMessagesResponse = await request(app)
        .get('/api/chat/conversations/support-conv-123/messages')
        .expect(200);

      expect(supportMessagesResponse.body.success).toBe(true);
      expect(supportMessagesResponse.body.messages).toHaveLength(2);
      expect(supportMessagesResponse.body.messages[0].attachments).toContain('verification_docs.pdf');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(5);
      expect(db.insert).toHaveBeenCalledTimes(3);
      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete File Sharing and Product References Workflow', () => {
    it('should handle file sharing and product references in chat', async () => {
      // Mock existing conversation
      const mockConversation = {
        id: 'conv-456',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        status: 'active',
      };

      // Mock product for reference
      const mockProduct = {
        id: 'product-123',
        name: 'Electronic Component A',
        price: '15.50',
        supplierId: 'supplier-123',
      };

      // Mock message with file and product reference
      const mockMessageWithAttachments = {
        id: 'msg-with-files',
        conversationId: 'conv-456',
        senderId: 'buyer-user-123',
        senderType: 'buyer',
        message: 'Please see the attached specifications for the product we discussed.',
        attachments: ['specifications.pdf', 'requirements.docx'],
        productReferences: ['product-123'],
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Setup database mocks
      (db.select as any)
        // Mock conversation validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockConversation]),
            }),
          }),
        })
        // Mock product validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockProduct]),
            }),
          }),
        })
        // Mock message with attachments retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    message: mockMessageWithAttachments,
                    sender: { id: 'buyer-user-123', email: 'buyer@test.com' },
                    products: [mockProduct],
                  }]),
                }),
              }),
            }),
          }),
        });

      // Mock message creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockMessageWithAttachments]),
        }),
      });

      // Step 1: Send message with file attachments and product reference
      const messageWithFilesData = {
        conversationId: 'conv-456',
        message: 'Please see the attached specifications for the product we discussed.',
        attachments: ['specifications.pdf', 'requirements.docx'],
        productReferences: ['product-123'],
      };

      const sendMessageWithFilesResponse = await request(app)
        .post('/api/chat/messages')
        .send(messageWithFilesData)
        .expect(201);

      expect(sendMessageWithFilesResponse.body.success).toBe(true);
      expect(sendMessageWithFilesResponse.body.message.attachments).toHaveLength(2);
      expect(sendMessageWithFilesResponse.body.message.productReferences).toContain('product-123');

      // Step 2: Get message with expanded product references
      const messageDetailsResponse = await request(app)
        .get('/api/chat/messages/msg-with-files')
        .expect(200);

      expect(messageDetailsResponse.body.success).toBe(true);
      expect(messageDetailsResponse.body.message.products).toHaveLength(1);
      expect(messageDetailsResponse.body.message.products[0].name).toBe('Electronic Component A');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(3);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Group Conversation Workflow', () => {
    it('should handle group conversations for complex negotiations', async () => {
      // Mock participants
      const mockBuyer = { id: 'buyer-123', companyName: 'Test Buyer Company' };
      const mockSupplier1 = { id: 'supplier-123', companyName: 'Tech Supplier Inc' };
      const mockSupplier2 = { id: 'supplier-456', companyName: 'Components Ltd' };

      // Mock group conversation
      const mockGroupConversation = {
        id: 'group-conv-123',
        type: 'group_negotiation',
        buyerId: 'buyer-123',
        subject: 'Multi-Supplier RFQ Discussion',
        status: 'active',
        participants: ['buyer-123', 'supplier-123', 'supplier-456'],
        createdAt: new Date().toISOString(),
      };

      // Mock group messages
      const mockGroupMessages = [
        {
          id: 'group-msg-1',
          conversationId: 'group-conv-123',
          senderId: 'buyer-user-123',
          senderType: 'buyer',
          message: 'Thank you both for your quotations. I would like to discuss terms.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'group-msg-2',
          conversationId: 'group-conv-123',
          senderId: 'supplier-user-123',
          senderType: 'supplier',
          message: 'We can offer additional discounts for larger quantities.',
          createdAt: new Date().toISOString(),
        },
      ];

      // Setup database mocks
      (db.select as any)
        // Mock buyer validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBuyer]),
            }),
          }),
        })
        // Mock suppliers validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockSupplier1, mockSupplier2]),
          }),
        })
        // Mock group conversation retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{
                  conversation: mockGroupConversation,
                  buyer: mockBuyer,
                }]),
              }),
            }),
          }),
        })
        // Mock group messages
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(mockGroupMessages.map(msg => ({
                    message: msg,
                    sender: { id: msg.senderId, email: `${msg.senderType}@test.com` },
                  }))),
                }),
              }),
            }),
          }),
        });

      // Mock group conversation creation
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockGroupConversation]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockGroupMessages[0]]),
          }),
        });

      // Step 1: Create group conversation
      const groupConversationData = {
        type: 'group_negotiation',
        subject: 'Multi-Supplier RFQ Discussion',
        participants: {
          supplierIds: ['supplier-123', 'supplier-456'],
        },
        initialMessage: 'Thank you both for your quotations. I would like to discuss terms.',
      };

      const createGroupConversationResponse = await request(app)
        .post('/api/chat/conversations/group')
        .send(groupConversationData)
        .expect(201);

      expect(createGroupConversationResponse.body.success).toBe(true);
      expect(createGroupConversationResponse.body.conversation.type).toBe('group_negotiation');
      expect(createGroupConversationResponse.body.conversation.participants).toHaveLength(3);

      // Step 2: Get group conversation details
      const groupConversationDetailsResponse = await request(app)
        .get('/api/chat/conversations/group-conv-123')
        .expect(200);

      expect(groupConversationDetailsResponse.body.success).toBe(true);
      expect(groupConversationDetailsResponse.body.conversation.subject).toBe('Multi-Supplier RFQ Discussion');

      // Step 3: Get group messages
      const groupMessagesResponse = await request(app)
        .get('/api/chat/conversations/group-conv-123/messages')
        .expect(200);

      expect(groupMessagesResponse.body.success).toBe(true);
      expect(groupMessagesResponse.body.messages).toHaveLength(2);

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(4);
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complete Chat Analytics and Search Workflow', () => {
    it('should provide chat analytics and search functionality', async () => {
      // Mock chat analytics data
      const mockChatAnalytics = {
        totalConversations: 150,
        activeConversations: 25,
        averageResponseTime: 2.5, // hours
        messageVolume: {
          today: 45,
          thisWeek: 280,
          thisMonth: 1200,
        },
        conversationsByType: {
          buyer_supplier: 120,
          supplier_admin: 20,
          buyer_admin: 10,
        },
        topUsers: [
          { userId: 'buyer-123', messageCount: 85 },
          { userId: 'supplier-456', messageCount: 72 },
        ],
      };

      // Mock search results
      const mockSearchResults = [
        {
          messageId: 'msg-search-1',
          conversationId: 'conv-search-1',
          message: 'Looking for electronic components with 5V specification',
          senderType: 'buyer',
          createdAt: new Date().toISOString(),
          conversation: {
            subject: 'Component Inquiry',
            participants: ['buyer-123', 'supplier-789'],
          },
        },
        {
          messageId: 'msg-search-2',
          conversationId: 'conv-search-2',
          message: 'We have 5V components available in stock',
          senderType: 'supplier',
          createdAt: new Date().toISOString(),
          conversation: {
            subject: 'Stock Availability',
            participants: ['buyer-456', 'supplier-789'],
          },
        },
      ];

      // Setup database mocks
      (db.select as any)
        // Mock chat analytics
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { type: 'buyer_supplier', count: 120 },
              { type: 'supplier_admin', count: 20 },
              { type: 'buyer_admin', count: 10 },
            ]),
          }),
        })
        // Mock message volume
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { date: new Date().toISOString().split('T')[0], count: 45 },
            ]),
          }),
        })
        // Mock search results
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(mockSearchResults.map(result => ({
                      message: {
                        id: result.messageId,
                        conversationId: result.conversationId,
                        message: result.message,
                        senderType: result.senderType,
                        createdAt: result.createdAt,
                      },
                      conversation: result.conversation,
                    }))),
                  }),
                }),
              }),
            }),
          }),
        });

      // Step 1: Get chat analytics
      const analyticsResponse = await request(app)
        .get('/api/admin/chat/analytics')
        .query({
          period: '30d',
        })
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.analytics.conversationsByType.buyer_supplier).toBe(120);

      // Step 2: Search chat messages
      const searchResponse = await request(app)
        .get('/api/chat/search')
        .query({
          query: '5V components',
          type: 'all',
          limit: 10,
        })
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.results).toHaveLength(2);
      expect(searchResponse.body.results[0].message).toContain('5V specification');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(3);
    });
  });
});
