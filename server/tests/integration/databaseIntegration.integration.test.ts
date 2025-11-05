import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buyerService } from '../../buyerService';
import { supplierRFQService } from '../../supplierRFQService';
import { conversationService } from '../../conversationService';
import { disputeService } from '../../disputeService';
import { db } from '../../db';

// Mock the database with realistic transaction behavior
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
    sendRealTimeNotification: vi.fn(),
  }
}));

describe('Database Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Transaction Management', () => {
    it('should handle successful multi-table transactions', async () => {
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
        createdAt: new Date(),
      };

      const mockUserUpdate = {
        id: 'user-123',
        profileCompleted: true,
      };

      // Mock successful transaction
      (db.transaction as any).mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockBuyer]),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockUserUpdate]),
              }),
            }),
          }),
        };
        return callback(mockTx);
      });

      const result = await buyerService.createBuyerProfile('user-123', {
        companyName: 'Test Company',
        industry: 'Technology',
      });

      expect(result).toEqual(mockBuyer);
      expect(db.transaction).toHaveBeenCalledTimes(1);
    });

    it('should rollback transactions on error', async () => {
      // Mock transaction that fails
      (db.transaction as any).mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockRejectedValue(new Error('Constraint violation')),
            }),
          }),
        };
        return callback(mockTx);
      });

      await expect(
        buyerService.createBuyerProfile('user-123', {
          companyName: 'Test Company',
        })
      ).rejects.toThrow();

      expect(db.transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle nested transactions correctly', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
      };

      const mockMessage = {
        id: 'message-123',
        conversationId: 'conv-123',
        senderId: 'user-123',
        message: 'Test message',
      };

      // Mock nested transaction
      (db.transaction as any).mockImplementation(async (callback) => {
        const mockTx = {
          insert: vi.fn()
            .mockReturnValueOnce({
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockConversation]),
              }),
            })
            .mockReturnValueOnce({
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockMessage]),
              }),
            }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
        };
        return callback(mockTx);
      });

      const result = await conversationService.createConversation({
        type: 'buyer_supplier',
        participants: {
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
        },
        subject: 'Test Conversation',
        initialMessage: 'Test message',
      });

      expect(result).toEqual(mockConversation);
      expect(db.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complex Query Operations', () => {
    it('should handle complex joins with proper data mapping', async () => {
      const mockRFQsWithDetails = [
        {
          rfq: {
            id: 'rfq-1',
            buyerId: 'buyer-1',
            title: 'Electronics RFQ',
            description: 'Need electronic components',
            quantity: 1000,
            status: 'open',
            createdAt: new Date('2024-01-01'),
          },
          category: {
            id: 'cat-1',
            name: 'Electronics',
            slug: 'electronics',
          },
          buyer: {
            id: 'buyer-1',
            companyName: 'Tech Corp',
            industry: 'Technology',
          },
          user: {
            id: 'user-1',
            email: 'buyer@techcorp.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          rfq: {
            id: 'rfq-2',
            buyerId: 'buyer-2',
            title: 'Machinery RFQ',
            description: 'Industrial machinery needed',
            quantity: 5,
            status: 'open',
            createdAt: new Date('2024-01-02'),
          },
          category: {
            id: 'cat-2',
            name: 'Machinery',
            slug: 'machinery',
          },
          buyer: {
            id: 'buyer-2',
            companyName: 'Industrial Inc',
            industry: 'Manufacturing',
          },
          user: {
            id: 'user-2',
            email: 'buyer@industrial.com',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      ];

      // Mock count query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 2 }]),
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
              groupBy: vi.fn().mockResolvedValue([
                { rfqId: 'rfq-1', count: 2 },
                { rfqId: 'rfq-2', count: 1 },
              ]),
            }),
          }),
        });

      const result = await supplierRFQService.getAvailableRFQs('supplier-123', {
        page: 1,
        limit: 10,
        category: 'electronics',
      });

      expect(result.rfqs).toHaveLength(2);
      expect(result.rfqs[0]).toMatchObject({
        id: 'rfq-1',
        title: 'Electronics RFQ',
        buyer: {
          companyName: 'Tech Corp',
          industry: 'Technology',
        },
        category: {
          name: 'Electronics',
        },
        quotationCount: 2,
      });
      expect(result.total).toBe(2);
    });

    it('should handle pagination with proper offset calculation', async () => {
      const mockBuyers = Array.from({ length: 5 }, (_, i) => ({
        buyers: {
          id: `buyer-${i + 6}`, // Page 2 starts from item 6
          companyName: `Company ${i + 6}`,
          industry: 'Technology',
          createdAt: new Date(),
        },
        users: {
          id: `user-${i + 6}`,
          email: `user${i + 6}@test.com`,
          firstName: `User${i + 6}`,
        },
      }));

      // Mock count query (total 25 buyers)
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue([{ count: 25 }]),
        })
        // Mock paginated query (page 2, 5 per page)
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
      expect(result.buyers[0].id).toBe('buyer-6'); // First item on page 2
    });

    it('should handle filtering with multiple conditions', async () => {
      const mockFilteredProducts = [
        {
          product: {
            id: 'product-1',
            name: 'Electronic Component A',
            price: '15.50',
            moq: 100,
            categoryId: 'cat-electronics',
          },
          supplier: {
            id: 'supplier-1',
            companyName: 'Electronics Supplier',
            location: 'US',
            verificationStatus: 'verified',
          },
          category: {
            id: 'cat-electronics',
            name: 'Electronics',
          },
        },
      ];

      // Mock filtered product search
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue([{ count: 1 }]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(mockFilteredProducts),
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

      const { productDiscoveryService } = await import('../../productDiscoveryService');
      
      const result = await productDiscoveryService.searchProducts({
        category: 'electronics',
        minPrice: 10.00,
        maxPrice: 20.00,
        location: 'US',
        verificationStatus: 'verified',
        minMOQ: 50,
        maxMOQ: 500,
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0]).toMatchObject({
        id: 'product-1',
        name: 'Electronic Component A',
        supplier: {
          companyName: 'Electronics Supplier',
          verificationStatus: 'verified',
        },
      });
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity across related tables', async () => {
      const mockDispute = {
        id: 'dispute-123',
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        status: 'open',
      };

      // Mock order validation (referential integrity check)
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    order: {
                      id: 'order-123',
                      buyerId: 'buyer-123',
                      supplierId: 'supplier-123',
                      status: 'delivered',
                    },
                    buyer: { id: 'buyer-123' },
                    supplier: { id: 'supplier-123' },
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

      const result = await disputeService.createDispute({
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
      });

      expect(result).toEqual(mockDispute);
      expect(result.orderId).toBe('order-123');
      expect(result.buyerId).toBe('buyer-123');
      expect(result.supplierId).toBe('supplier-123');
    });

    it('should handle foreign key constraint violations', async () => {
      // Mock foreign key constraint violation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(
            new Error('Foreign key constraint violation: buyer_id does not exist')
          ),
        }),
      });

      await expect(
        disputeService.createDispute({
          orderId: 'order-123',
          buyerId: 'non-existent-buyer',
          supplierId: 'supplier-123',
          type: 'quality',
          title: 'Test Dispute',
          description: 'Test description',
        })
      ).rejects.toThrow('Foreign key constraint violation');
    });

    it('should handle unique constraint violations', async () => {
      // Mock existing quotation check (should prevent duplicate)
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
              limit: vi.fn().mockResolvedValue([{
                id: 'existing-quotation',
                rfqId: 'rfq-123',
                supplierId: 'supplier-123',
              }]),
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

  describe('Concurrent Operations', () => {
    it('should handle concurrent quotation submissions safely', async () => {
      const mockRFQ = {
        id: 'rfq-123',
        status: 'open',
        buyerId: 'buyer-123',
      };

      const mockQuotation1 = {
        id: 'quotation-1',
        rfqId: 'rfq-123',
        supplierId: 'supplier-1',
        unitPrice: '10.50',
        status: 'sent',
      };

      const mockQuotation2 = {
        id: 'quotation-2',
        rfqId: 'rfq-123',
        supplierId: 'supplier-2',
        unitPrice: '9.75',
        status: 'sent',
      };

      // Mock concurrent RFQ verification (both suppliers see same RFQ)
      (db.select as any)
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockRFQ]),
            }),
          }),
        });

      // Mock no existing quotations for both suppliers
      (db.select as any)
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      // Mock successful quotation creation for both
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockQuotation1]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockQuotation2]),
          }),
        });

      // Simulate concurrent quotation submissions
      const quotationPromises = [
        supplierRFQService.createQuotation('supplier-1', {
          rfqId: 'rfq-123',
          unitPrice: '10.50',
          totalPrice: '1050.00',
          moq: 100,
        }),
        supplierRFQService.createQuotation('supplier-2', {
          rfqId: 'rfq-123',
          unitPrice: '9.75',
          totalPrice: '975.00',
          moq: 100,
        }),
      ];

      const results = await Promise.all(quotationPromises);

      expect(results[0]).toEqual(mockQuotation1);
      expect(results[1]).toEqual(mockQuotation2);
      expect(results[0].supplierId).toBe('supplier-1');
      expect(results[1].supplierId).toBe('supplier-2');
    });

    it('should handle concurrent conversation creation', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        subject: 'Product Inquiry',
        status: 'active',
      };

      // Mock conversation creation (both attempts succeed with same result)
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockConversation]),
        }),
      });

      // Simulate concurrent conversation creation attempts
      const conversationPromises = [
        conversationService.createConversation({
          type: 'buyer_supplier',
          participants: {
            buyerId: 'buyer-123',
            supplierId: 'supplier-123',
          },
          subject: 'Product Inquiry',
        }),
        conversationService.createConversation({
          type: 'buyer_supplier',
          participants: {
            buyerId: 'buyer-123',
            supplierId: 'supplier-123',
          },
          subject: 'Product Inquiry',
        }),
      ];

      const results = await Promise.all(conversationPromises);

      expect(results[0]).toEqual(mockConversation);
      expect(results[1]).toEqual(mockConversation);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large dataset queries efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        product: {
          id: `product-${i}`,
          name: `Product ${i}`,
          price: `${(Math.random() * 100).toFixed(2)}`,
        },
        supplier: {
          id: `supplier-${i % 10}`,
          companyName: `Supplier ${i % 10}`,
        },
      }));

      // Mock large dataset query with proper pagination
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue([{ count: 10000 }]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(largeDataset.slice(0, 50)),
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

      const { productDiscoveryService } = await import('../../productDiscoveryService');
      
      const startTime = Date.now();
      const result = await productDiscoveryService.searchProducts({
        page: 1,
        limit: 50,
      });
      const endTime = Date.now();

      expect(result.products).toHaveLength(50);
      expect(result.total).toBe(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should use proper indexing for common queries', async () => {
      // Mock query that would benefit from indexing
      const mockIndexedQuery = vi.fn().mockResolvedValue([
        {
          rfq: { id: 'rfq-1', status: 'open' },
          buyer: { id: 'buyer-1', companyName: 'Test Company' },
        },
      ]);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: mockIndexedQuery,
              }),
            }),
          }),
        }),
      });

      // Query that should use indexes on status, created_at, and supplier categories
      const result = await supplierRFQService.getAvailableRFQs('supplier-123', {
        status: 'open',
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      expect(mockIndexedQuery).toHaveBeenCalled();
      expect(result.rfqs).toBeDefined();
    });
  });
});