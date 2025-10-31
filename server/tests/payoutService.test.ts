import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PayoutService, payoutService } from '../payoutService';
import { db } from '../db';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  }
}));

describe('PayoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculatePendingPayouts', () => {
    it('should calculate pending payouts for supplier', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          totalAmount: '1000',
          commissionAmount: '30',
          supplierAmount: '970',
          createdAt: new Date(),
        },
        {
          id: 'order-2',
          totalAmount: '500',
          commissionAmount: '15',
          supplierAmount: '485',
          createdAt: new Date(),
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockOrders),
          }),
        }),
      });

      const result = await payoutService.calculatePendingPayouts('supplier-123');

      expect(result).toEqual({
        supplierId: 'supplier-123',
        amount: 1500,
        commissionAmount: 45,
        netAmount: 1455,
        orderIds: ['order-1', 'order-2'],
        scheduledDate: expect.any(Date),
      });
    });

    it('should return null if no pending orders', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await payoutService.calculatePendingPayouts('supplier-123');

      expect(result).toBeNull();
    });

    it('should return null if amount below minimum threshold', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          totalAmount: '30',
          commissionAmount: '1',
          supplierAmount: '29',
          createdAt: new Date(),
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockOrders),
          }),
        }),
      });

      const result = await payoutService.calculatePendingPayouts('supplier-123');

      expect(result).toBeNull(); // Below $50 minimum
    });
  });

  describe('schedulePayout', () => {
    it('should schedule payout for supplier with pending orders', async () => {
      // Mock calculatePendingPayouts
      vi.spyOn(payoutService, 'calculatePendingPayouts').mockResolvedValue({
        supplierId: 'supplier-123',
        amount: 1000,
        commissionAmount: 30,
        netAmount: 970,
        orderIds: ['order-1', 'order-2'],
        scheduledDate: new Date(),
      });

      // Mock payout creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'payout-123' }]),
        }),
      });

      // Mock order selection for individual payout records
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              totalAmount: '500',
              commissionAmount: '15',
              supplierAmount: '485',
            }]),
          }),
        }),
      });

      const payoutId = await payoutService.schedulePayout('supplier-123', 'bank_transfer');

      expect(payoutId).toBe('payout-123');
      expect(db.insert).toHaveBeenCalled();
    });

    it('should return null if no pending payouts', async () => {
      vi.spyOn(payoutService, 'calculatePendingPayouts').mockResolvedValue(null);

      const payoutId = await payoutService.schedulePayout('supplier-123');

      expect(payoutId).toBeNull();
    });
  });

  describe('processPayout', () => {
    it('should process payout successfully', async () => {
      const mockPayout = {
        id: 'payout-123',
        supplierId: 'supplier-123',
        amount: '1000',
        netAmount: '970',
        method: 'bank_transfer',
        status: 'pending',
      };

      const mockSupplier = {
        bankName: 'Test Bank',
        accountNumber: '123456789',
        accountName: 'Test Supplier',
        paypalEmail: null,
      };

      // Mock payout selection
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockPayout]),
            }),
          }),
        })
        // Mock supplier selection
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        });

      // Mock database updates
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      // Mock successful payment processing
      vi.spyOn(payoutService as any, 'simulatePaymentProcessing').mockResolvedValue({
        success: true,
        transactionId: 'TXN_123456',
      });

      const result = await payoutService.processPayout('payout-123');

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('TXN_123456');
      expect(db.update).toHaveBeenCalledTimes(2); // Processing + Completed
    });

    it('should handle payout not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await payoutService.processPayout('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payout not found');
    });

    it('should handle invalid payout status', async () => {
      const mockPayout = {
        id: 'payout-123',
        status: 'completed',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPayout]),
          }),
        }),
      });

      const result = await payoutService.processPayout('payout-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payout is not in pending status');
    });

    it('should handle missing bank details for bank transfer', async () => {
      const mockPayout = {
        id: 'payout-123',
        supplierId: 'supplier-123',
        method: 'bank_transfer',
        status: 'pending',
      };

      const mockSupplier = {
        bankName: null,
        accountNumber: null,
        paypalEmail: null,
      };

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockPayout]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        });

      const result = await payoutService.processPayout('payout-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bank details not configured for supplier');
    });

    it('should handle payment processing failure', async () => {
      const mockPayout = {
        id: 'payout-123',
        supplierId: 'supplier-123',
        method: 'bank_transfer',
        status: 'pending',
      };

      const mockSupplier = {
        bankName: 'Test Bank',
        accountNumber: '123456789',
        accountName: 'Test Supplier',
      };

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockPayout]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        });

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      // Mock failed payment processing
      vi.spyOn(payoutService as any, 'simulatePaymentProcessing').mockResolvedValue({
        success: false,
        error: 'Insufficient funds',
      });

      const result = await payoutService.processPayout('payout-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
    });
  });

  describe('processAllPendingPayouts', () => {
    it('should process all pending payouts', async () => {
      const mockPendingPayouts = [
        { id: 'payout-1', scheduledDate: new Date() },
        { id: 'payout-2', scheduledDate: new Date() },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockPendingPayouts),
          }),
        }),
      });

      // Mock processPayout calls
      vi.spyOn(payoutService, 'processPayout')
        .mockResolvedValueOnce({ success: true, payoutId: 'payout-1' })
        .mockResolvedValueOnce({ success: false, error: 'Failed' });

      const result = await payoutService.processAllPendingPayouts();

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('getSupplierPayoutHistory', () => {
    it('should return payout history for supplier', async () => {
      const mockPayouts = [
        {
          id: 'payout-1',
          amount: '1000',
          commissionAmount: '30',
          netAmount: '970',
          status: 'completed',
          createdAt: new Date(),
        },
        {
          id: 'payout-2',
          amount: '500',
          commissionAmount: '15',
          netAmount: '485',
          status: 'pending',
          createdAt: new Date(),
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockPayouts),
              }),
            }),
          }),
        }),
      });

      const result = await payoutService.getSupplierPayoutHistory('supplier-123');

      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(1000);
      expect(result[0].netAmount).toBe(970);
    });

    it('should handle date range filtering', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      await payoutService.getSupplierPayoutHistory('supplier-123', 50, 0, startDate, endDate);

      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('getPayoutSummary', () => {
    it('should return payout summary', async () => {
      const mockPayouts = [
        { status: 'pending', amount: '1000', netAmount: '970' },
        { status: 'completed', amount: '500', netAmount: '485' },
        { status: 'failed', amount: '200', netAmount: '194' },
        { status: 'processing', amount: '300', netAmount: '291' },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockPayouts),
        }),
      });

      const result = await payoutService.getPayoutSummary();

      expect(result).toEqual({
        totalPending: 1,
        totalProcessing: 1,
        totalCompleted: 1,
        totalFailed: 1,
        pendingAmount: 970,
        completedAmount: 485,
        failedAmount: 194,
      });
    });
  });

  describe('retryFailedPayout', () => {
    it('should retry failed payout', async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      vi.spyOn(payoutService, 'processPayout').mockResolvedValue({
        success: true,
        payoutId: 'payout-123',
      });

      const result = await payoutService.retryFailedPayout('payout-123');

      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('getSupplierEarningsSummary', () => {
    it('should return earnings summary for supplier', async () => {
      const mockCompletedPayouts = {
        totalEarnings: 5000,
        totalPayouts: 10,
      };

      const mockPendingPayouts = {
        pendingEarnings: 1000,
        pendingPayouts: 2,
      };

      const mockCommissionSummary = {
        totalOrders: 50,
        totalSales: 25000,
        totalCommission: 750,
        avgCommissionRate: 3.0,
      };

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockCompletedPayouts]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockPendingPayouts]),
          }),
        });

      // Mock commission service
      const commissionService = await import('../commissionService');
      vi.spyOn(commissionService.commissionService, 'getSupplierCommissionSummary')
        .mockResolvedValue(mockCommissionSummary);

      const result = await payoutService.getSupplierEarningsSummary('supplier-123');

      expect(result).toEqual({
        totalEarnings: 5000,
        totalPayouts: 10,
        pendingEarnings: 1000,
        pendingPayouts: 2,
        totalOrders: 50,
        totalSales: 25000,
        totalCommission: 750,
        avgCommissionRate: 3.0,
      });
    });
  });
});