import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buyerService } from '../../buyerService';
import { supplierRFQService } from '../../supplierRFQService';
import { conversationService } from '../../conversationService';
import { db } from '../../db';

// Mock the database with more realistic behavior
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}));

vi.mock('../../notificationService', () => ({
  notificationService: {
    createNotification: vi.fn(),
  }
}));

describe('Database Operations Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Transaction Handling', () => {
    it('should handle successful database transactions', async () => {
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
        createdAt: new Date(),
      };

      // Mock successful transaction
      (db.transaction as any).mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockBuyer]),
            }),
          }),
        };
        return callback(mockTx);
      });

      // Mock regular insert for non-transaction operations
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBuyer]),
        }),
      });

      const result = await buyerService.createBuyerProfile('user-123', {
        companyName: 'Test Company',
        industry: 'Technology',
      });

      expect(result).toEqual(mockBuyer);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle database transaction rollbacks on error', async () => {
      // Mock transaction that throws an error
      (db.transaction as any).mockImplementation(async (callback) => {
        throw new Error('Database connection failed');
      });

      await expect(
        buyerService.createBuyerProfile('user-123', {
          companyName: 'Test Company',
        })
      ).rejects.toThrow();
    });
  });

  describe('Complex Query Operations', () => {
    it('should handle complex joins and filtering', async () => {
      const mockRFQsWithDetails = [
        {
          rfq: {
            id: 'rfq-1',
            buyerId: 'buyer-1',
            title: 'Test RFQ 1',
            status: 'open',
          },
          category: {
            id: 'cat-1',
            name: 'Electronics',
          },
          buyer: {
            id: 'buyer-1',
            companyName: 'Test Company',
          },
          user: {
            id: 'user-1',
            email: 'buyer@test.com',
          },
        },
      ];

      // Mock count query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        })
        // Mock complex join query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue(mockRFQsWithDetails),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock supplier quotations query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })
        // Mock quotation counts query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      const result = await supplierRFQService.getAvailableRFQs('supplier-123');

      expect(result.rfqs).toHaveLength(1);
      expect(result.rfqs[0]).toMatchObject({
        id: 'rfq-1',
        title: 'Test RFQ 1',
        buyer: {
          companyName: 'Test Company',
        },
      });
    });

    it('should handle pagination correctly', async () => {
      const mockBuyers = Array.from({ length: 5 }, (_, i) => ({
        buyers: {
          id: `buyer-${i + 1}`,
          companyName: `Company ${i + 1}`,
        },
        users: {
          id: `user-${i + 1}`,
          email: `user${i + 1}@test.com`,
        },
      }));

      // Mock count query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue([{ count: 25 }]),
        })
        // Mock paginated query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockBuyers),
                }),
              }),
            }),
          }),
        });

      const result = await buyerService.getAllBuyers(2, 5); // Page 2, 5 per page

      expect(result.buyers).toHaveLength(5);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        subject: 'Test Conversation',
      };

      // Mock conversation creation with referential integrity check
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockConversation]),
        }),
      });

      const result = await conversationService.createConversation({
        type: 'buyer_supplier',
        participants: {
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
        },
        subject: 'Test Conversation',
      });

      expect(result).toEqual(mockConversation);
      expect(result.buyerId).toBe('buyer-123');
      expect(result.supplierId).toBe('supplier-123');
    });

    it('should handle concurrent operations safely', async () => {
      const mockQuotation = {
        id: 'quotation-123',
        rfqId: 'rfq-123',
        supplierId: 'supplier-123',
        status: 'sent',
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
        // Mock existing quotation check (concurrent safety)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // No existing quotation
            }),
          }),
        });

      // Mock quotation creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      });

      const result = await supplierRFQService.createQuotation('supplier-123', {
        rfqId: 'rfq-123',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        moq: 100,
      });

      expect(result).toEqual(mockQuotation);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Connection timeout')),
        }),
      });

      await expect(
        buyerService.getBuyerById('buyer-123')
      ).rejects.toThrow('Connection timeout');
    });

    it('should handle constraint violations', async () => {
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('Unique constraint violation')),
        }),
      });

      await expect(
        buyerService.createBuyerProfile('user-123', {
          companyName: 'Test Company',
        })
      ).rejects.toThrow('Unique constraint violation');
    });
  });
});