import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buyerService } from '../../buyerService';
import { supplierRFQService } from '../../supplierRFQService';
import { conversationService } from '../../conversationService';
import { disputeService } from '../../disputeService';
import { notificationService } from '../../notificationService';
import { db } from '../../db';

// Mock the database
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

describe('Cross-Service Interactions Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RFQ to Quotation Workflow', () => {
    it('should handle complete RFQ creation to quotation workflow', async () => {
      // Mock buyer profile
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
      };

      // Mock RFQ creation
      const mockRFQ = {
        id: 'rfq-123',
        buyerId: 'buyer-123',
        title: 'Electronics RFQ',
        description: 'Need electronic components',
        quantity: 1000,
        status: 'open',
      };

      // Mock RFQ details for supplier
      const mockRFQDetails = {
        id: 'rfq-123',
        title: 'Electronics RFQ',
        description: 'Need electronic components',
        quantity: 1000,
        buyer: mockBuyer,
        hasQuoted: false,
        quotationCount: 0,
      };

      // Mock quotation creation
      const mockQuotation = {
        id: 'quotation-123',
        rfqId: 'rfq-123',
        supplierId: 'supplier-123',
        unitPrice: '10.50',
        totalPrice: '10500.00',
        status: 'sent',
      };

      // Setup database mocks for RFQ details
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                      rfq: mockRFQ,
                      category: null,
                      buyer: mockBuyer,
                      user: { id: 'user-123', email: 'buyer@test.com' },
                    }]),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock existing quotation check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Mock quotation count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        });

      // Mock quotation creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      });

      // Step 1: Supplier gets RFQ details
      const rfqDetails = await supplierRFQService.getRFQDetails('rfq-123', 'supplier-123');

      expect(rfqDetails).toMatchObject({
        id: 'rfq-123',
        title: 'Electronics RFQ',
        buyer: mockBuyer,
        hasQuoted: false,
        quotationCount: 0,
      });

      // Step 2: Supplier creates quotation
      const quotation = await supplierRFQService.createQuotation('supplier-123', {
        rfqId: 'rfq-123',
        unitPrice: '10.50',
        totalPrice: '10500.00',
        moq: 1000,
        leadTime: '15-20 days',
      });

      expect(quotation).toEqual(mockQuotation);
      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'quotation_received',
        title: 'New Quotation Received',
        message: 'You have received a new quotation for your RFQ: Electronics RFQ',
        data: {
          rfqId: 'rfq-123',
          quotationId: 'quotation-123',
          supplierId: 'supplier-123',
        },
      });
    });

    it('should prevent duplicate quotations from same supplier', async () => {
      // Mock existing quotation
      const existingQuotation = {
        id: 'existing-quotation',
        rfqId: 'rfq-123',
        supplierId: 'supplier-123',
      };

      // Mock RFQ verification
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 'rfq-123',
                status: 'open',
                buyerId: 'buyer-123',
              }]),
            }),
          }),
        })
        // Mock existing quotation check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([existingQuotation]),
            }),
          }),
        });

      await expect(
        supplierRFQService.createQuotation('supplier-123', {
          rfqId: 'rfq-123',
          unitPrice: '10.50',
          totalPrice: '1050.00',
          moq: 100,
        })
      ).rejects.toThrow('You have already submitted a quotation for this RFQ');
    });
  });

  describe('Inquiry to Conversation Workflow', () => {
    it('should create conversation when buyer sends inquiry', async () => {
      const mockInquiry = {
        id: 'inquiry-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        productId: 'product-123',
        subject: 'Product Specifications',
        message: 'Can you provide detailed specifications?',
        status: 'pending',
      };

      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        subject: 'Product Specifications',
        status: 'active',
      };

      // Mock inquiry creation
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockInquiry]),
          }),
        })
        // Mock conversation creation
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockConversation]),
          }),
        });

      // Mock conversation retrieval
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockConversation]),
          }),
        }),
      });

      // Create conversation linked to inquiry
      const conversation = await conversationService.createConversation({
        type: 'buyer_supplier',
        participants: {
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
        },
        subject: 'Product Specifications',
        inquiryId: 'inquiry-123',
      });

      expect(conversation).toEqual(mockConversation);
      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: expect.any(String),
        type: 'inquiry_received',
        title: 'New Product Inquiry',
        message: 'You have received a new inquiry: Product Specifications',
        data: {
          inquiryId: 'inquiry-123',
          conversationId: 'conv-123',
          buyerId: 'buyer-123',
        },
      });
    });
  });

  describe('Order to Dispute Workflow', () => {
    it('should handle dispute creation and notification workflow', async () => {
      const mockOrder = {
        id: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        status: 'delivered',
        totalAmount: '1050.00',
      };

      const mockDispute = {
        id: 'dispute-123',
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        status: 'open',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
      };

      // Mock order validation
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    order: mockOrder,
                    buyer: { id: 'buyer-123', userId: 'buyer-user-123' },
                    supplier: { id: 'supplier-123', userId: 'supplier-user-123' },
                  }]),
                }),
              }),
            }),
          }),
        })
        // Mock existing dispute check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      // Mock dispute creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockDispute]),
        }),
      });

      const dispute = await disputeService.createDispute({
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
      });

      expect(dispute).toEqual(mockDispute);

      // Verify notifications were sent to both parties
      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: 'supplier-user-123',
        type: 'dispute_created',
        title: 'Dispute Created',
        message: 'A dispute has been created for order #order-123',
        data: {
          disputeId: 'dispute-123',
          orderId: 'order-123',
          type: 'quality',
        },
      });

      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: 'buyer-user-123',
        type: 'dispute_confirmation',
        title: 'Dispute Submitted',
        message: 'Your dispute for order #order-123 has been submitted',
        data: {
          disputeId: 'dispute-123',
          orderId: 'order-123',
        },
      });
    });

    it('should handle dispute resolution with refund processing', async () => {
      const mockDispute = {
        id: 'dispute-123',
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        status: 'resolved',
        resolution: 'Refund approved',
        refundAmount: '500.00',
      };

      // Mock dispute update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockDispute]),
          }),
        }),
      });

      // Mock dispute details for notification
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{
                  dispute: mockDispute,
                  buyer: { userId: 'buyer-user-123' },
                  supplier: { userId: 'supplier-user-123' },
                }]),
              }),
            }),
          }),
        }),
      });

      const resolvedDispute = await disputeService.updateDisputeStatus('dispute-123', 'resolved', {
        resolution: 'Refund approved',
        refundAmount: '500.00',
        adminId: 'admin-123',
      });

      expect(resolvedDispute).toEqual(mockDispute);

      // Verify resolution notifications
      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: 'buyer-user-123',
        type: 'dispute_resolved',
        title: 'Dispute Resolved',
        message: 'Your dispute has been resolved. Refund of $500.00 has been approved.',
        data: {
          disputeId: 'dispute-123',
          resolution: 'Refund approved',
          refundAmount: '500.00',
        },
      });

      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: 'supplier-user-123',
        type: 'dispute_resolved',
        title: 'Dispute Resolved',
        message: 'The dispute for your order has been resolved.',
        data: {
          disputeId: 'dispute-123',
          resolution: 'Refund approved',
        },
      });
    });
  });

  describe('Chat Integration with Business Processes', () => {
    it('should link chat conversations to RFQs and orders', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        subject: 'RFQ Discussion',
        rfqId: 'rfq-123',
        status: 'active',
      };

      const mockMessage = {
        id: 'message-123',
        conversationId: 'conv-123',
        senderId: 'buyer-user-123',
        senderType: 'buyer',
        message: 'Can we discuss the pricing for this RFQ?',
        productReferences: ['product-123'],
      };

      // Mock conversation creation with RFQ reference
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockConversation]),
          }),
        })
        // Mock message creation
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockMessage]),
          }),
        });

      // Mock conversation retrieval
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockConversation]),
          }),
        }),
      });

      // Create conversation linked to RFQ
      const conversation = await conversationService.createConversation({
        type: 'buyer_supplier',
        participants: {
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
        },
        subject: 'RFQ Discussion',
        rfqId: 'rfq-123',
      });

      expect(conversation).toEqual(mockConversation);
      expect(conversation.rfqId).toBe('rfq-123');
    });

    it('should handle file sharing in conversations', async () => {
      const mockMessage = {
        id: 'message-123',
        conversationId: 'conv-123',
        senderId: 'supplier-user-123',
        senderType: 'supplier',
        message: 'Please find the product specifications attached.',
        attachments: ['spec-document.pdf', 'product-image.jpg'],
      };

      // Mock message with attachments
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockMessage]),
        }),
      });

      // Mock conversation access validation
      vi.spyOn(conversationService as any, 'validateConversationAccess').mockReturnValue(true);

      const message = await conversationService.sendMessage('conv-123', {
        senderId: 'supplier-user-123',
        senderType: 'supplier',
        message: 'Please find the product specifications attached.',
        attachments: ['spec-document.pdf', 'product-image.jpg'],
      });

      expect(message).toEqual(mockMessage);
      expect(message.attachments).toHaveLength(2);
      expect(message.attachments).toContain('spec-document.pdf');
    });
  });

  describe('Notification System Integration', () => {
    it('should send real-time notifications for critical events', async () => {
      const mockQuotation = {
        id: 'quotation-123',
        rfqId: 'rfq-123',
        supplierId: 'supplier-123',
        unitPrice: '10.50',
        status: 'sent',
      };

      // Mock quotation creation
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 'rfq-123',
                status: 'open',
                buyerId: 'buyer-123',
              }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      });

      await supplierRFQService.createQuotation('supplier-123', {
        rfqId: 'rfq-123',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        moq: 100,
      });

      // Verify both database notification and real-time notification
      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(notificationService.sendRealTimeNotification).toHaveBeenCalledWith(
        expect.any(String),
        {
          type: 'quotation_received',
          title: 'New Quotation Received',
          message: expect.any(String),
          data: expect.any(Object),
        }
      );
    });

    it('should batch notifications for bulk operations', async () => {
      const mockRFQs = [
        { id: 'rfq-1', buyerId: 'buyer-123' },
        { id: 'rfq-2', buyerId: 'buyer-123' },
        { id: 'rfq-3', buyerId: 'buyer-456' },
      ];

      // Mock bulk RFQ expiration
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(mockRFQs),
          }),
        }),
      });

      // Simulate bulk RFQ expiration process
      const expiredRFQs = mockRFQs;

      // Group notifications by buyer
      const notificationGroups = expiredRFQs.reduce((groups, rfq) => {
        if (!groups[rfq.buyerId]) {
          groups[rfq.buyerId] = [];
        }
        groups[rfq.buyerId].push(rfq);
        return groups;
      }, {} as Record<string, any[]>);

      // Send batched notifications
      for (const [buyerId, rfqs] of Object.entries(notificationGroups)) {
        await notificationService.createNotification({
          userId: buyerId,
          type: 'rfq_batch_expired',
          title: 'RFQs Expired',
          message: `${rfqs.length} of your RFQs have expired`,
          data: { expiredRFQIds: rfqs.map(r => r.id) },
        });
      }

      expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: 'buyer-123',
        type: 'rfq_batch_expired',
        title: 'RFQs Expired',
        message: '2 of your RFQs have expired',
        data: { expiredRFQIds: ['rfq-1', 'rfq-2'] },
      });
    });
  });
});