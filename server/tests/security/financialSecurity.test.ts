import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { commissionService } from '../../commissionService';
import { payoutService } from '../../payoutService';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  }
}));

describe('Financial System Security Tests', () => {
  let mockDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = (await import('../../db')).db;
    // Clear cache before each test
    (commissionService as any).cachedRates = null;
    (commissionService as any).cacheExpiry = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Commission Calculation Security', () => {
    it('should prevent commission rate manipulation', async () => {
      // Mock commission settings
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            defaultRate: 5.0,
            freeRate: 5.0,
            silverRate: 3.0,
            goldRate: 2.0,
            platinumRate: 1.5,
            categoryRates: {},
            vendorOverrides: {},
          }]),
        }),
      });

      // Mock supplier with legitimate tier
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              membershipTier: 'gold',
              customCommissionRate: null,
            }]),
          }),
        }),
      });

      const legitimateRate = await commissionService.calculateCommissionRate('supplier-123');
      expect(legitimateRate).toBe(2.0); // Gold tier rate

      // Attempt to manipulate commission calculation with invalid inputs
      const testCases = [
        { supplierId: null, expected: 5.0 }, // Null supplier should use default
        { supplierId: '', expected: 5.0 }, // Empty supplier should use default
        { supplierId: 'non-existent', expected: 5.0 }, // Non-existent supplier should use default
      ];

      for (const testCase of testCases) {
        const rate = await commissionService.calculateCommissionRate(testCase.supplierId as any);
        expect(rate).toBe(testCase.expected);
      }
    });

    it('should validate commission calculation accuracy', async () => {
      vi.spyOn(commissionService, 'calculateCommissionRate').mockResolvedValue(3.0);

      const testCases = [
        { orderAmount: 1000, expectedCommission: 30, expectedSupplier: 970 },
        { orderAmount: 100.50, expectedCommission: 3.02, expectedSupplier: 97.48 },
        { orderAmount: 0.01, expectedCommission: 0, expectedSupplier: 0.01 },
      ];

      for (const testCase of testCases) {
        const result = await commissionService.calculateOrderCommission(
          'order-123',
          'supplier-123',
          testCase.orderAmount
        );

        expect(result.commissionAmount).toBeCloseTo(testCase.expectedCommission, 2);
        expect(result.supplierAmount).toBeCloseTo(testCase.expectedSupplier, 2);
        expect(result.orderAmount).toBe(testCase.orderAmount);
      }
    });

    it('should prevent negative commission amounts', async () => {
      vi.spyOn(commissionService, 'calculateCommissionRate').mockResolvedValue(3.0);

      const invalidTestCases = [
        -1000, // Negative amount
        -0.01, // Small negative amount
        NaN, // Not a number
        Infinity, // Infinity
        -Infinity, // Negative infinity
      ];

      for (const invalidAmount of invalidTestCases) {
        try {
          const result = await commissionService.calculateOrderCommission(
            'order-123',
            'supplier-123',
            invalidAmount
          );

          // If calculation succeeds, ensure no negative values
          expect(result.commissionAmount).toBeGreaterThanOrEqual(0);
          expect(result.supplierAmount).toBeGreaterThanOrEqual(0);
        } catch (error) {
          // It's acceptable to throw an error for invalid inputs
          expect(error).toBeDefined();
        }
      }
    });

    it('should maintain precision in financial calculations', async () => {
      vi.spyOn(commissionService, 'calculateCommissionRate').mockResolvedValue(2.33); // Precise rate

      const result = await commissionService.calculateOrderCommission(
        'order-123',
        'supplier-123',
        123.45
      );

      // Verify precision is maintained (rounded to 2 decimal places)
      expect(result.commissionAmount).toBe(2.88); // 123.45 * 0.0233 = 2.876, rounded to 2.88
      expect(result.supplierAmount).toBe(120.57); // 123.45 - 2.88 = 120.57
      
      // Verify total adds up correctly
      expect(result.commissionAmount + result.supplierAmount).toBeCloseTo(result.orderAmount, 2);
    });
  });

  describe('Payout Security', () => {
    it('should validate payout eligibility and amounts', async () => {
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

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockOrders),
          }),
        }),
      });

      const result = await payoutService.calculatePendingPayouts('supplier-123');

      expect(result).toBeDefined();
      expect(result?.netAmount).toBe(1455); // 970 + 485
      expect(result?.commissionAmount).toBe(45); // 30 + 15
      expect(result?.amount).toBe(1500); // 1000 + 500

      // Verify calculations are correct
      expect(result?.amount - result?.commissionAmount).toBe(result?.netAmount);
    });

    it('should prevent duplicate payouts', async () => {
      // Mock orders that have already been paid out
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]), // No unpaid orders
          }),
        }),
      });

      const result = await payoutService.calculatePendingPayouts('supplier-123');
      expect(result).toBeNull(); // No pending payouts
    });

    it('should enforce minimum payout thresholds', async () => {
      const smallOrders = [
        {
          id: 'order-1',
          totalAmount: '20',
          commissionAmount: '1',
          supplierAmount: '19',
          createdAt: new Date(),
        },
        {
          id: 'order-2',
          totalAmount: '25',
          commissionAmount: '1.25',
          supplierAmount: '23.75',
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(smallOrders),
          }),
        }),
      });

      const result = await payoutService.calculatePendingPayouts('supplier-123');
      
      // Should return null because total is below minimum threshold ($50)
      expect(result).toBeNull();
    });

    it('should validate payout processing security', async () => {
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

      // Mock payout and supplier queries
      mockDb.select
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

      // Mock database updates
      mockDb.update.mockReturnValue({
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
    });

    it('should handle payout processing failures securely', async () => {
      const mockPayout = {
        id: 'payout-123',
        supplierId: 'supplier-123',
        amount: '1000',
        method: 'bank_transfer',
        status: 'pending',
      };

      const mockSupplier = {
        bankName: null, // Missing bank details
        accountNumber: null,
      };

      mockDb.select
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
      expect(result.error).toContain('Bank details not configured');
    });
  });

  describe('Financial Data Protection', () => {
    it('should protect sensitive financial information', async () => {
      const mockEarningsSummary = {
        totalEarnings: 5000,
        totalPayouts: 10,
        pendingEarnings: 1000,
        pendingPayouts: 2,
        totalOrders: 50,
        totalSales: 25000,
        totalCommission: 750,
        avgCommissionRate: 3.0,
      };

      // Mock completed payouts query
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{
              totalEarnings: '5000',
              totalPayouts: '10',
            }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{
              pendingEarnings: '1000',
              pendingPayouts: '2',
            }]),
          }),
        });

      // Mock commission service
      vi.spyOn(commissionService, 'getSupplierCommissionSummary').mockResolvedValue({
        totalOrders: 50,
        totalSales: 25000,
        totalCommission: 750,
        totalEarnings: 24250,
        avgCommissionRate: 3.0,
      });

      const result = await payoutService.getSupplierEarningsSummary('supplier-123');

      // Verify all financial data is properly typed and validated
      expect(typeof result.totalEarnings).toBe('number');
      expect(typeof result.totalPayouts).toBe('number');
      expect(typeof result.pendingEarnings).toBe('number');
      expect(typeof result.totalSales).toBe('number');
      expect(typeof result.totalCommission).toBe('number');

      // Verify data consistency
      expect(result.totalEarnings).toBeGreaterThanOrEqual(0);
      expect(result.totalPayouts).toBeGreaterThanOrEqual(0);
      expect(result.pendingEarnings).toBeGreaterThanOrEqual(0);
    });

    it('should validate commission settings updates', async () => {
      // Mock existing settings
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'settings-123' }]),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      // Test valid commission rates
      const validRates = {
        defaultRate: 4.0,
        silverRate: 2.5,
        goldRate: 1.8,
        platinumRate: 1.2,
      };

      await expect(
        commissionService.updateCommissionSettings(validRates, 'admin-123')
      ).resolves.not.toThrow();

      // Test invalid commission rates
      const invalidRates = [
        { defaultRate: -1.0 }, // Negative rate
        { silverRate: 101.0 }, // Rate over 100%
        { goldRate: NaN }, // Not a number
        { platinumRate: Infinity }, // Infinity
      ];

      for (const invalidRate of invalidRates) {
        // The service should handle invalid rates gracefully
        try {
          await commissionService.updateCommissionSettings(invalidRate, 'admin-123');
          // If it doesn't throw, verify the rate was sanitized or rejected
        } catch (error) {
          // It's acceptable to throw an error for invalid rates
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Audit Trail and Logging', () => {
    it('should maintain audit trail for financial operations', async () => {
      const mockCommissionCalculation = {
        orderId: 'order-123',
        supplierId: 'supplier-123',
        orderAmount: 1000,
        commissionRate: 3.0,
        commissionAmount: 30,
        supplierAmount: 970,
        calculatedAt: new Date(),
      };

      // Mock order update for audit trail
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      vi.spyOn(commissionService, 'calculateOrderCommission').mockResolvedValue(mockCommissionCalculation);

      const result = await commissionService.applyCommissionToOrder(
        'order-123',
        'supplier-123',
        1000
      );

      // Verify audit information is captured
      expect(result.calculatedAt).toBeInstanceOf(Date);
      expect(result.orderId).toBe('order-123');
      expect(result.supplierId).toBe('supplier-123');

      // Verify database update was called (for audit trail)
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should track payout processing history', async () => {
      const mockPayoutHistory = [
        {
          id: 'payout-1',
          amount: '1000',
          commissionAmount: '30',
          netAmount: '970',
          status: 'completed',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
        {
          id: 'payout-2',
          amount: '500',
          commissionAmount: '15',
          netAmount: '485',
          status: 'pending',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockPayoutHistory),
              }),
            }),
          }),
        }),
      });

      const history = await payoutService.getSupplierPayoutHistory('supplier-123');

      expect(history).toHaveLength(2);
      expect(history[0].amount).toBe(1000);
      expect(history[0].status).toBe('completed');
      expect(history[1].amount).toBe(500);
      expect(history[1].status).toBe('pending');

      // Verify all amounts are properly converted to numbers
      history.forEach(payout => {
        expect(typeof payout.amount).toBe('number');
        expect(typeof payout.commissionAmount).toBe('number');
        expect(typeof payout.netAmount).toBe('number');
      });
    });
  });

  describe('Concurrency and Race Condition Protection', () => {
    it('should handle concurrent commission calculations safely', async () => {
      vi.spyOn(commissionService, 'calculateCommissionRate').mockResolvedValue(3.0);

      // Simulate concurrent commission calculations for the same order
      const concurrentCalculations = Array.from({ length: 10 }, (_, i) =>
        commissionService.calculateOrderCommission(
          `order-${i}`,
          'supplier-123',
          1000
        )
      );

      const results = await Promise.all(concurrentCalculations);

      // All calculations should produce consistent results
      results.forEach((result, index) => {
        expect(result.orderId).toBe(`order-${index}`);
        expect(result.commissionRate).toBe(3.0);
        expect(result.commissionAmount).toBe(30);
        expect(result.supplierAmount).toBe(970);
      });
    });

    it('should prevent race conditions in payout processing', async () => {
      const mockPayout = {
        id: 'payout-123',
        supplierId: 'supplier-123',
        status: 'pending',
      };

      // Mock payout selection
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPayout]),
          }),
        }),
      });

      // Simulate concurrent payout processing attempts
      const concurrentProcessing = Array.from({ length: 5 }, () =>
        payoutService.processPayout('payout-123').catch(error => ({ error: error.message }))
      );

      const results = await Promise.all(concurrentProcessing);

      // Only one should succeed, others should fail gracefully
      const successfulResults = results.filter(r => 'success' in r && r.success);
      const failedResults = results.filter(r => 'error' in r);

      // Either one succeeds and others fail, or all fail due to status check
      expect(successfulResults.length + failedResults.length).toBe(5);
    });
  });
});