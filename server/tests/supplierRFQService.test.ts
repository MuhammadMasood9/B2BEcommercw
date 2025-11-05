import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupplierRFQService, supplierRFQService } from '../supplierRFQService';
import { db } from '../db';
import { notificationService } from '../notificationService';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

// Mock notification service
vi.mock('../notificationService', () => ({
  notificationService: {
    createNotification: vi.fn(),
  }
}));

describe('SupplierRFQService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAvailableRFQs', () => {
    it('should return paginated RFQs with buyer information', async () => {
      const mockCount = [{ count: 15 }];
      const mockRFQs = [
        {
          rfq: {
            id: 'rfq-1',
            buyerId: 'buyer-1',
            title: 'Test RFQ 1',
            description: 'Test description',
            status: 'open',
            quantity: 100,
            targetPrice: '1000',
            createdAt: new Date(),
          },
          category: {
            id: 'cat-1',
            name: 'Electronics',
            slug: 'electronics',
          },
          buyer: {
            id: 'buyer-1',
            userId: 'user-1',
            companyName: 'Test Company',
          },
          user: {
            id: 'user-1',
            email: 'buyer@test.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      // Mock count query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCount),
          }),
        })
        // Mock RFQs query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue(mockRFQs),
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

      expect(result).toEqual({
        rfqs: [{
          ...mockRFQs[0].rfq,
          category: mockRFQs[0].category,
          buyer: {
            ...mockRFQs[0].buyer,
            user: mockRFQs[0].user,
          },
          hasQuoted: false,
          myQuotation: undefined,
          quotationCount: 0,
        }],
        total: 15,
        page: 1,
        totalPages: 1,
      });
    });

    it('should filter RFQs by status', async () => {
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
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
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        });

      const filters = { status: 'closed' as const };
      await supplierRFQService.getAvailableRFQs('supplier-123', filters);

      expect(db.select).toHaveBeenCalled();
    });

    it('should filter RFQs by category', async () => {
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
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
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        });

      const filters = { categoryId: 'electronics' };
      await supplierRFQService.getAvailableRFQs('supplier-123', filters);

      expect(db.select).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 50 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
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
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        });

      const result = await supplierRFQService.getAvailableRFQs('supplier-123', {}, 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('getRFQDetails', () => {
    it('should return RFQ details with buyer information', async () => {
      const mockRFQResult = {
        rfq: {
          id: 'rfq-1',
          buyerId: 'buyer-1',
          title: 'Test RFQ',
          description: 'Test description',
          status: 'open',
        },
        category: {
          id: 'cat-1',
          name: 'Electronics',
        },
        buyer: {
          id: 'buyer-1',
          userId: 'user-1',
          companyName: 'Test Company',
        },
        user: {
          id: 'user-1',
          email: 'buyer@test.com',
          firstName: 'John',
        },
      };

      const mockQuotation = {
        id: 'quotation-1',
        rfqId: 'rfq-1',
        supplierId: 'supplier-123',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        status: 'sent',
      };

      // Mock RFQ details query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([mockRFQResult]),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock supplier quotation query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockQuotation]),
            }),
          }),
        })
        // Mock quotation count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 3 }]),
          }),
        });

      const result = await supplierRFQService.getRFQDetails('rfq-1', 'supplier-123');

      expect(result).toEqual({
        ...mockRFQResult.rfq,
        category: mockRFQResult.category,
        buyer: {
          ...mockRFQResult.buyer,
          user: mockRFQResult.user,
        },
        hasQuoted: true,
        myQuotation: mockQuotation,
        quotationCount: 3,
      });
    });

    it('should return null when RFQ not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await supplierRFQService.getRFQDetails('non-existent', 'supplier-123');

      expect(result).toBeNull();
    });
  });

  describe('createQuotation', () => {
    it('should create quotation successfully', async () => {
      const mockRFQ = {
        id: 'rfq-1',
        buyerId: 'buyer-1',
        title: 'Test RFQ',
        status: 'open',
      };

      const mockQuotation = {
        id: 'quotation-1',
        rfqId: 'rfq-1',
        supplierId: 'supplier-123',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        moq: 100,
        status: 'sent',
      };

      // Mock RFQ verification
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockRFQ]),
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
        });

      // Mock quotation creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      });

      const quotationData = {
        rfqId: 'rfq-1',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        moq: 100,
        leadTime: '15-20 days',
        paymentTerms: 'T/T',
      };

      const result = await supplierRFQService.createQuotation('supplier-123', quotationData);

      expect(result).toEqual(mockQuotation);
      expect(db.insert).toHaveBeenCalled();
      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: 'buyer-1',
        type: 'info',
        title: 'New Quotation Received',
        message: 'You have received a new quotation for your RFQ: Test RFQ',
        relatedId: 'quotation-1',
        relatedType: 'quotation',
      });
    });

    it('should throw error when RFQ not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const quotationData = {
        rfqId: 'non-existent',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        moq: 100,
      };

      await expect(
        supplierRFQService.createQuotation('supplier-123', quotationData)
      ).rejects.toThrow('RFQ not found');
    });

    it('should throw error when RFQ is not open', async () => {
      const mockRFQ = {
        id: 'rfq-1',
        status: 'closed',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRFQ]),
          }),
        }),
      });

      const quotationData = {
        rfqId: 'rfq-1',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        moq: 100,
      };

      await expect(
        supplierRFQService.createQuotation('supplier-123', quotationData)
      ).rejects.toThrow('RFQ is no longer accepting quotations');
    });

    it('should throw error when supplier already quoted', async () => {
      const mockRFQ = {
        id: 'rfq-1',
        status: 'open',
      };

      const mockExistingQuotation = {
        id: 'existing-quotation',
        rfqId: 'rfq-1',
        supplierId: 'supplier-123',
      };

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockRFQ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockExistingQuotation]),
            }),
          }),
        });

      const quotationData = {
        rfqId: 'rfq-1',
        unitPrice: '10.50',
        totalPrice: '1050.00',
        moq: 100,
      };

      await expect(
        supplierRFQService.createQuotation('supplier-123', quotationData)
      ).rejects.toThrow('You have already submitted a quotation for this RFQ');
    });
  });

  describe('updateQuotation', () => {
    it('should update quotation successfully', async () => {
      const mockExistingQuotation = {
        id: 'quotation-1',
        rfqId: 'rfq-1',
        supplierId: 'supplier-123',
        status: 'sent',
        unitPrice: '10.50',
      };

      const mockUpdatedQuotation = {
        ...mockExistingQuotation,
        unitPrice: '12.00',
        updatedAt: new Date(),
      };

      // Mock existing quotation check
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExistingQuotation]),
          }),
        }),
      });

      // Mock update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedQuotation]),
          }),
        }),
      });

      const updateData = {
        unitPrice: '12.00',
        totalPrice: '1200.00',
      };

      const result = await supplierRFQService.updateQuotation('quotation-1', 'supplier-123', updateData);

      expect(result).toEqual(mockUpdatedQuotation);
      expect(db.update).toHaveBeenCalled();
    });

    it('should throw error when quotation not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        supplierRFQService.updateQuotation('non-existent', 'supplier-123', {})
      ).rejects.toThrow('Quotation not found or access denied');
    });

    it('should throw error when quotation is not editable', async () => {
      const mockExistingQuotation = {
        id: 'quotation-1',
        status: 'accepted',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExistingQuotation]),
          }),
        }),
      });

      await expect(
        supplierRFQService.updateQuotation('quotation-1', 'supplier-123', {})
      ).rejects.toThrow('Quotation cannot be modified after it has been accepted or rejected');
    });
  });
});