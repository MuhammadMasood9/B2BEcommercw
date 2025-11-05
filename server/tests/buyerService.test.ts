import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BuyerService, buyerService } from '../buyerService';
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

describe('BuyerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createBuyerProfile', () => {
    it('should create a new buyer profile successfully', async () => {
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
        industry: 'Technology',
        businessType: 'manufacturer',
        annualVolume: '1000000',
        preferredPaymentTerms: ['T/T', 'L/C'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBuyer]),
        }),
      });

      const profileData = {
        companyName: 'Test Company',
        industry: 'Technology',
        businessType: 'manufacturer',
        annualVolume: 1000000,
        preferredPaymentTerms: ['T/T', 'L/C'],
      };

      const result = await buyerService.createBuyerProfile('user-123', profileData);

      expect(result).toEqual(mockBuyer);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle creation with minimal data', async () => {
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
        industry: null,
        businessType: null,
        annualVolume: null,
        preferredPaymentTerms: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBuyer]),
        }),
      });

      const result = await buyerService.createBuyerProfile('user-123', {
        companyName: 'Test Company',
      });

      expect(result).toEqual(mockBuyer);
    });
  });

  describe('getBuyerByUserId', () => {
    it('should return buyer profile when found', async () => {
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
        industry: 'Technology',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockBuyer]),
          }),
        }),
      });

      const result = await buyerService.getBuyerByUserId('user-123');

      expect(result).toEqual(mockBuyer);
    });

    it('should return null when buyer not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await buyerService.getBuyerByUserId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getBuyerById', () => {
    it('should return buyer profile when found', async () => {
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockBuyer]),
          }),
        }),
      });

      const result = await buyerService.getBuyerById('buyer-123');

      expect(result).toEqual(mockBuyer);
    });

    it('should return null when buyer not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await buyerService.getBuyerById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateBuyerProfile', () => {
    it('should update buyer profile successfully', async () => {
      const updatedBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Updated Company',
        industry: 'Updated Industry',
        updatedAt: new Date(),
      };

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedBuyer]),
          }),
        }),
      });

      const updateData = {
        companyName: 'Updated Company',
        industry: 'Updated Industry',
      };

      const result = await buyerService.updateBuyerProfile('buyer-123', updateData);

      expect(result).toEqual(updatedBuyer);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('getBuyerWithUser', () => {
    it('should return buyer with user information when found', async () => {
      const mockResult = [{
        buyers: {
          id: 'buyer-123',
          userId: 'user-123',
          companyName: 'Test Company',
        },
        users: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      }];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockResult),
            }),
          }),
        }),
      });

      const result = await buyerService.getBuyerWithUser('buyer-123');

      expect(result).toEqual({
        ...mockResult[0].buyers,
        user: mockResult[0].users,
      });
    });

    it('should return null when buyer not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await buyerService.getBuyerWithUser('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllBuyers', () => {
    it('should return paginated buyers with user information', async () => {
      const mockCount = [{ count: 25 }];
      const mockBuyers = [
        {
          buyers: {
            id: 'buyer-1',
            userId: 'user-1',
            companyName: 'Company 1',
          },
          users: {
            id: 'user-1',
            email: 'user1@example.com',
            firstName: 'John',
          },
        },
        {
          buyers: {
            id: 'buyer-2',
            userId: 'user-2',
            companyName: 'Company 2',
          },
          users: {
            id: 'user-2',
            email: 'user2@example.com',
            firstName: 'Jane',
          },
        },
      ];

      // Mock count query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue(mockCount),
        })
        // Mock buyers query
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

      const result = await buyerService.getAllBuyers(1, 20);

      expect(result).toEqual({
        buyers: [
          { ...mockBuyers[0].buyers, user: mockBuyers[0].users },
          { ...mockBuyers[1].buyers, user: mockBuyers[1].users },
        ],
        total: 25,
        page: 1,
        totalPages: 2,
      });
    });

    it('should handle pagination correctly', async () => {
      const mockCount = [{ count: 50 }];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockResolvedValue(mockCount),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });

      const result = await buyerService.getAllBuyers(3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('searchBuyers', () => {
    it('should search buyers by company name and industry', async () => {
      const mockResults = [
        {
          buyers: {
            id: 'buyer-1',
            companyName: 'Tech Company',
            industry: 'Technology',
          },
          users: {
            id: 'user-1',
            email: 'tech@example.com',
          },
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockResults),
              }),
            }),
          }),
        }),
      });

      const result = await buyerService.searchBuyers('tech', 10);

      expect(result).toEqual([
        { ...mockResults[0].buyers, user: mockResults[0].users },
      ]);
    });

    it('should handle empty search results', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const result = await buyerService.searchBuyers('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('deleteBuyerProfile', () => {
    it('should delete buyer profile successfully', async () => {
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });

      await buyerService.deleteBuyerProfile('buyer-123');

      expect(db.delete).toHaveBeenCalled();
    });
  });
});