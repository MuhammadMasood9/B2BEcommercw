import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buyerService } from '../../buyerService';
import { supplierRFQService } from '../../supplierRFQService';
import { conversationService } from '../../conversationService';
import { disputeService } from '../../disputeService';
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
  }
}));

describe('Buyer-Supplier Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete RFQ Workflow', () => {
    it('should handle complete RFQ creation to quotation acceptance workflow', async () => {
      // Mock buyer creation
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
      };

      // Mock RFQ creation
      const mockRFQ = {
        id: 'rfq-123',
        buyerId: 'buyer-123',
        title: 'Test RFQ',
        status: 'open',
      };

      // Mock quotation creation
      const mockQuotation = {
        id: 'quotation-123',
        rfqId: 'rfq-123',
        supplierId: 'supplier-123',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        status: 'sent',
      };

      // Setup mocks for buyer profile creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBuyer]),
        }),
      });

      // Setup mocks for RFQ details
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
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        });

      // Mock quotation creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      });

      // Step 1: Create buyer profile
      const buyer = await buyerService.createBuyerProfile('user-123', {
        companyName: 'Test Company',
        industry: 'Technology',
      });

      expect(buyer).toEqual(mockBuyer);

      // Step 2: Get RFQ details for supplier
      const rfqDetails = await supplierRFQService.getRFQDetails('rfq-123', 'supplier-123');

      expect(rfqDetails).toMatchObject({
        id: 'rfq-123',
        buyer: mockBuyer,
        hasQuoted: false,
        quotationCount: 1,
      });

      // Step 3: Supplier creates quotation
      const quotation = await supplierRFQService.createQuotation('supplier-123', {
        rfqId: 'rfq-123',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        moq: 100,
        leadTime: '15-20 days',
      });

      expect(quotation).toEqual(mockQuotation);
    });
  });

  describe('Buyer-Supplier Communication Workflow', () => {
    it('should handle conversation creation and messaging workflow', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        subject: 'Product Inquiry',
        status: 'active',
      };

      // Mock conversation creation
      (db.insert as any).mockReturnValue({
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

      // Mock access validation
      vi.spyOn(conversationService as any, 'validateConversationAccess').mockReturnValue(true);

      // Step 1: Create conversation
      const conversation = await conversationService.createConversation({
        type: 'buyer_supplier',
        participants: {
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
        },
        subject: 'Product Inquiry',
      });

      expect(conversation).toEqual(mockConversation);

      // Step 2: Retrieve conversation
      const retrievedConversation = await conversationService.getConversationById(
        'conv-123',
        'buyer-123',
        'buyer'
      );

      expect(retrievedConversation).toEqual(mockConversation);
    });
  });

  describe('Dispute Resolution Workflow', () => {
    it('should handle dispute creation and resolution workflow', async () => {
      const mockOrderResult = [{
        order: {
          id: 'order-123',
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
        },
        buyer: { id: 'buyer-123' },
        supplier: { id: 'supplier-123' },
      }];

      const mockDispute = {
        id: 'dispute-123',
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        status: 'open',
      };

      // Mock order validation
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(mockOrderResult),
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

      // Create dispute
      const dispute = await disputeService.createDispute({
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
      });

      expect(dispute).toEqual(mockDispute);
      expect(dispute.status).toBe('open');
    });
  });
});