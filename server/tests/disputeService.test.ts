import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DisputeService, disputeService } from '../disputeService';
import { db } from '../db';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('DisputeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDispute', () => {
    it('should create a new dispute successfully', async () => {
      const mockOrderResult = [{
        order: {
          id: 'order-123',
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
          orderNumber: 'ORD-001',
        },
        buyer: {
          id: 'buyer-123',
          companyName: 'Test Company',
        },
        supplier: {
          id: 'supplier-123',
          businessName: 'Test Supplier',
        },
      }];

      const mockDispute = {
        id: 'dispute-123',
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
        status: 'open',
        priority: 'medium',
        escalationLevel: 0,
        createdAt: new Date(),
      };

      // Mock order validation query
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

      const disputeData = {
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
      };

      const result = await disputeService.createDispute(disputeData);

      expect(result).toEqual(mockDispute);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should throw error when order not found', async () => {
      // Mock order not found
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const disputeData = {
        orderId: 'non-existent',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        title: 'Test Dispute',
        description: 'Test description',
      };

      await expect(disputeService.createDispute(disputeData)).rejects.toThrow('Order not found');
    });

    it('should throw error when active dispute already exists', async () => {
      const mockOrderResult = [{
        order: { id: 'order-123' },
        buyer: { id: 'buyer-123' },
        supplier: { id: 'supplier-123' },
      }];

      const mockExistingDispute = [{ id: 'existing-dispute' }];

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
              limit: vi.fn().mockResolvedValue(mockExistingDispute),
            }),
          }),
        });

      const disputeData = {
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        title: 'Test Dispute',
        description: 'Test description',
      };

      await expect(disputeService.createDispute(disputeData)).rejects.toThrow(
        'An active dispute already exists for this order'
      );
    });
  });

  describe('getDisputeById', () => {
    it('should return dispute with related data when found', async () => {
      const mockResult = [{
        dispute: {
          id: 'dispute-123',
          orderId: 'order-123',
          type: 'quality',
          title: 'Product Quality Issue',
          status: 'open',
        },
        order: {
          id: 'order-123',
          orderNumber: 'ORD-001',
          totalAmount: '1000.00',
        },
        buyer: {
          id: 'buyer-123',
          companyName: 'Test Company',
          industry: 'Technology',
        },
        supplier: {
          id: 'supplier-123',
          businessName: 'Test Supplier',
          storeName: 'Test Store',
        },
        mediator: {
          id: 'admin-123',
          firstName: 'John',
          lastName: 'Admin',
          email: 'admin@test.com',
        },
      }];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(mockResult),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await disputeService.getDisputeById('dispute-123');

      expect(result).toEqual({
        ...mockResult[0].dispute,
        order: mockResult[0].order,
        buyer: mockResult[0].buyer,
        supplier: mockResult[0].supplier,
        mediator: mockResult[0].mediator,
      });
    });

    it('should throw error when dispute not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([]),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      await expect(disputeService.getDisputeById('non-existent')).rejects.toThrow('Dispute not found');
    });
  });

  describe('getDisputes', () => {
    it('should return filtered and paginated disputes', async () => {
      const mockDisputes = [
        {
          dispute: {
            id: 'dispute-1',
            type: 'quality',
            title: 'Quality Issue 1',
            status: 'open',
            priority: 'high',
          },
          order: {
            id: 'order-1',
            orderNumber: 'ORD-001',
            totalAmount: '1000.00',
          },
          buyer: {
            id: 'buyer-1',
            companyName: 'Company 1',
          },
          supplier: {
            id: 'supplier-1',
            businessName: 'Supplier 1',
          },
          mediator: null,
        },
      ];

      const mockCount = [{ count: 1 }];

      // Mock disputes query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                          offset: vi.fn().mockResolvedValue(mockDisputes),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(mockCount),
                  }),
                }),
              }),
            }),
          }),
        });

      const filters = {
        status: 'open',
        type: 'quality',
        priority: 'high',
        limit: 10,
        offset: 0,
      };

      const result = await disputeService.getDisputes(filters);

      expect(result).toEqual({
        disputes: mockDisputes,
        total: 1,
      });
    });

    it('should handle search filtering', async () => {
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                          offset: vi.fn().mockResolvedValue([]),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ count: 0 }]),
                  }),
                }),
              }),
            }),
          }),
        });

      const filters = {
        search: 'quality issue',
        limit: 10,
        offset: 0,
      };

      const result = await disputeService.getDisputes(filters);

      expect(result.disputes).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle sorting options', async () => {
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                          offset: vi.fn().mockResolvedValue([]),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ count: 0 }]),
                  }),
                }),
              }),
            }),
          }),
        });

      const filters = {
        sortBy: 'priority',
        sortOrder: 'asc' as const,
        limit: 10,
        offset: 0,
      };

      await disputeService.getDisputes(filters);

      expect(db.select).toHaveBeenCalled();
    });
  });
});