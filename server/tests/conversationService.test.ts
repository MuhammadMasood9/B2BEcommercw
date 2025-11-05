import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversationService, conversationService } from '../conversationService';
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

describe('ConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createConversation', () => {
    it('should create buyer-supplier conversation successfully', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        subject: 'Product Inquiry',
        status: 'active',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockConversation]),
        }),
      });

      const data = {
        type: 'buyer_supplier' as const,
        participants: {
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
        },
        subject: 'Product Inquiry',
      };

      const result = await conversationService.createConversation(data);

      expect(result).toEqual(mockConversation);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should create buyer-admin conversation successfully', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_admin',
        buyerId: 'buyer-123',
        adminId: 'admin-123',
        subject: 'Support Request',
        status: 'active',
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockConversation]),
        }),
      });

      const data = {
        type: 'buyer_admin' as const,
        participants: {
          buyerId: 'buyer-123',
          adminId: 'admin-123',
        },
        subject: 'Support Request',
      };

      const result = await conversationService.createConversation(data);

      expect(result).toEqual(mockConversation);
    });

    it('should create supplier-admin conversation successfully', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'supplier_admin',
        supplierId: 'supplier-123',
        adminId: 'admin-123',
        subject: 'Account Issue',
        status: 'active',
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockConversation]),
        }),
      });

      const data = {
        type: 'supplier_admin' as const,
        participants: {
          supplierId: 'supplier-123',
          adminId: 'admin-123',
        },
        subject: 'Account Issue',
      };

      const result = await conversationService.createConversation(data);

      expect(result).toEqual(mockConversation);
    });

    it('should use default subject when not provided', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        subject: 'New conversation',
        status: 'active',
      };

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockConversation]),
        }),
      });

      const data = {
        type: 'buyer_supplier' as const,
        participants: {
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
        },
      };

      const result = await conversationService.createConversation(data);

      expect(result.subject).toBe('New conversation');
    });
  });

  describe('getUserConversations', () => {
    it('should return buyer conversations with participant details', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          type: 'buyer_supplier',
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
          subject: 'Product Inquiry',
          status: 'active',
          lastMessageAt: new Date(),
        },
        {
          id: 'conv-2',
          type: 'buyer_admin',
          buyerId: 'buyer-123',
          adminId: 'admin-123',
          subject: 'Support Request',
          status: 'active',
          lastMessageAt: new Date(),
        },
      ];

      const mockParticipant = {
        firstName: 'John',
        email: 'supplier@test.com',
        companyName: 'Test Supplier Co',
      };

      // Mock conversations query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockConversations),
            }),
          }),
        })
        // Mock participant details queries
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockParticipant]),
            }),
          }),
        });

      const result = await conversationService.getUserConversations('buyer-123', 'buyer');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'conv-1',
        participantName: 'John',
        participantEmail: 'supplier@test.com',
        participantCompany: 'Test Supplier Co',
      });
    });

    it('should return supplier conversations', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          type: 'buyer_supplier',
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
          subject: 'Product Inquiry',
          status: 'active',
        },
      ];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockConversations),
            }),
          }),
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                firstName: 'Jane',
                email: 'buyer@test.com',
                companyName: 'Test Buyer Co',
              }]),
            }),
          }),
        });

      const result = await conversationService.getUserConversations('supplier-123', 'supplier');

      expect(result).toHaveLength(1);
      expect(result[0].participantName).toBe('Jane');
    });

    it('should return admin conversations', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          type: 'buyer_admin',
          buyerId: 'buyer-123',
          adminId: 'admin-123',
          subject: 'Support Request',
          status: 'active',
        },
      ];

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockConversations),
            }),
          }),
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                firstName: 'Admin',
                email: 'admin@test.com',
                companyName: 'Platform Admin',
              }]),
            }),
          }),
        });

      const result = await conversationService.getUserConversations('admin-123', 'admin');

      expect(result).toHaveLength(1);
      expect(result[0].participantName).toBe('Admin');
    });

    it('should filter conversations by status', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const filters = { status: 'active' as const };
      await conversationService.getUserConversations('buyer-123', 'buyer', filters);

      expect(db.select).toHaveBeenCalled();
    });

    it('should filter conversations by type', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const filters = { type: 'buyer_supplier' as const };
      await conversationService.getUserConversations('buyer-123', 'buyer', filters);

      expect(db.select).toHaveBeenCalled();
    });

    it('should throw error for invalid user role', async () => {
      await expect(
        conversationService.getUserConversations('user-123', 'invalid' as any)
      ).rejects.toThrow('Invalid user role');
    });
  });

  describe('getConversationById', () => {
    it('should return conversation when user has access', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        subject: 'Product Inquiry',
        status: 'active',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockConversation]),
          }),
        }),
      });

      // Mock validateConversationAccess to return true
      vi.spyOn(conversationService as any, 'validateConversationAccess').mockReturnValue(true);

      const result = await conversationService.getConversationById('conv-123', 'buyer-123', 'buyer');

      expect(result).toEqual(mockConversation);
    });

    it('should return null when conversation not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await conversationService.getConversationById('non-existent', 'buyer-123', 'buyer');

      expect(result).toBeNull();
    });

    it('should throw error when user does not have access', async () => {
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'other-buyer',
        supplierId: 'supplier-123',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockConversation]),
          }),
        }),
      });

      // Mock validateConversationAccess to return false
      vi.spyOn(conversationService as any, 'validateConversationAccess').mockReturnValue(false);

      await expect(
        conversationService.getConversationById('conv-123', 'buyer-123', 'buyer')
      ).rejects.toThrow('Access denied to this conversation');
    });
  });
});