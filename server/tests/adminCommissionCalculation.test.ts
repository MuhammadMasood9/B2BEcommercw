import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommissionService } from '../commissionService';
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

describe('Commission Calculation Tests', () => {
  let commissionService: CommissionService;

  beforeEach(() => {
    vi.clearAllMocks();
    commissionService = CommissionService.getInstance();
    // Clear cache for each test
    (commissionService as any).cachedRates = null;
    (commissionService as any).cacheExpiry = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateCommissionRate', () => {
    it('should return default rate when no commission settings exist', async () => {
      // Mock empty commission settings
      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue([]) // Empty settings
        })
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      const rate = await commissionService.calculateCommissionRate('supplier-1');
      
      expect(rate).toBe(5.0); // Default rate
    });

    it('should return vendor override rate when available', async () => {
      // Mock commission settings with vendor override
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: { 'supplier-1': 2.5 }
      }];

      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue(mockSettings)
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const rate = await commissionService.calculateCommissionRate('supplier-1');
      
      expect(rate).toBe(2.5);
    });

    it('should return tier-based rate for different membership tiers', async () => {
      // Mock commission settings
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      // Mock supplier profile
      const mockSupplier = [{
        membershipTier: 'gold',
        customCommissionRate: null
      }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier)
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const rate = await commissionService.calculateCommissionRate('supplier-1');
      
      expect(rate).toBe(2.0); // Gold tier rate
    });

    it('should return custom commission rate when set for supplier', async () => {
      // Mock commission settings
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      // Mock supplier profile with custom rate
      const mockSupplier = [{
        membershipTier: 'silver',
        customCommissionRate: '4.5'
      }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier)
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const rate = await commissionService.calculateCommissionRate('supplier-1');
      
      expect(rate).toBe(4.5); // Custom rate
    });

    it('should return category-specific rate when available', async () => {
      // Mock commission settings with category rates
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: { 'electronics': 1.8 },
        vendorOverrides: {}
      }];

      // Mock supplier profile without custom rate
      const mockSupplier = [{
        membershipTier: 'silver',
        customCommissionRate: null
      }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier)
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const rate = await commissionService.calculateCommissionRate('supplier-1', 'electronics');
      
      expect(rate).toBe(1.8); // Category-specific rate
    });
  });

  describe('calculateOrderCommission', () => {
    it('should calculate commission correctly', async () => {
      // Mock commission rate calculation
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      const mockSupplier = [{
        membershipTier: 'silver',
        customCommissionRate: null
      }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier)
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const calculation = await commissionService.calculateOrderCommission(
        'order-1',
        'supplier-1',
        1000
      );

      expect(calculation.orderId).toBe('order-1');
      expect(calculation.supplierId).toBe('supplier-1');
      expect(calculation.orderAmount).toBe(1000);
      expect(calculation.commissionRate).toBe(3.0);
      expect(calculation.commissionAmount).toBe(30); // 1000 * 3% = 30
      expect(calculation.supplierAmount).toBe(970); // 1000 - 30 = 970
      expect(calculation.calculatedAt).toBeInstanceOf(Date);
    });

    it('should round commission amounts to 2 decimal places', async () => {
      // Mock commission rate calculation
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      const mockSupplier = [{
        membershipTier: 'platinum',
        customCommissionRate: null
      }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier)
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const calculation = await commissionService.calculateOrderCommission(
        'order-1',
        'supplier-1',
        333.33 // Amount that will create decimal commission
      );

      expect(calculation.commissionRate).toBe(1.5);
      expect(calculation.commissionAmount).toBe(5.00); // 333.33 * 1.5% = 4.99995, rounded to 5.00
      expect(calculation.supplierAmount).toBe(328.33); // 333.33 - 5.00 = 328.33
    });
  });

  describe('applyCommissionToOrder', () => {
    it('should update order with commission information', async () => {
      // Mock commission calculation
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      const mockSupplier = [{
        membershipTier: 'gold',
        customCommissionRate: null
      }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier)
            })
          })
        });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.resolve())
        })
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.update as any).mockImplementation(mockUpdate);

      const calculation = await commissionService.applyCommissionToOrder(
        'order-1',
        'supplier-1',
        500
      );

      expect(calculation.commissionRate).toBe(2.0);
      expect(calculation.commissionAmount).toBe(10); // 500 * 2% = 10
      expect(calculation.supplierAmount).toBe(490); // 500 - 10 = 490

      // Verify database update was called
      expect(db.update).toHaveBeenCalled();
    });

    it('should handle database update errors', async () => {
      // Mock commission calculation
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      const mockSupplier = [{
        membershipTier: 'free',
        customCommissionRate: null
      }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier)
            })
          })
        });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.reject(new Error('Database error')))
        })
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.update as any).mockImplementation(mockUpdate);

      await expect(
        commissionService.applyCommissionToOrder('order-1', 'supplier-1', 500)
      ).rejects.toThrow('Failed to apply commission to order');
    });
  });

  describe('analyzeCommissionImpact', () => {
    it('should analyze impact of commission rate changes', async () => {
      // Mock current commission settings
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      // Mock supplier profiles
      const mockSuppliers = [
        { id: 'supplier-1', membershipTier: 'silver', customCommissionRate: null },
        { id: 'supplier-2', membershipTier: 'gold', customCommissionRate: null },
        { id: 'supplier-3', membershipTier: 'platinum', customCommissionRate: '2.0' }
      ];

      // Mock recent orders
      const mockOrders = [
        { supplierId: 'supplier-1', totalAmount: '1000', commissionAmount: '30' },
        { supplierId: 'supplier-2', totalAmount: '2000', commissionAmount: '40' },
        { supplierId: 'supplier-3', totalAmount: '1500', commissionAmount: '30' }
      ];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockSuppliers)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockOrders)
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const rateChanges = {
        silverRate: 2.5, // Decrease from 3.0 to 2.5
        goldRate: 2.5    // Increase from 2.0 to 2.5
      };

      const impact = await commissionService.analyzeCommissionImpact(rateChanges);

      expect(impact).toHaveProperty('affectedSuppliers');
      expect(impact).toHaveProperty('estimatedRevenueChange');
      expect(impact).toHaveProperty('estimatedSupplierImpact');
      expect(impact).toHaveProperty('projectedMonthlyChange');
      expect(impact).toHaveProperty('riskLevel');
      expect(impact).toHaveProperty('recommendations');

      expect(impact.affectedSuppliers).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(impact.riskLevel);
      expect(Array.isArray(impact.recommendations)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock database error
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue(Promise.reject(new Error('Database error')))
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const impact = await commissionService.analyzeCommissionImpact({ silverRate: 2.5 });

      expect(impact.affectedSuppliers).toBe(0);
      expect(impact.estimatedRevenueChange).toBe(0);
      expect(impact.riskLevel).toBe('low');
      expect(impact.recommendations).toContain('Unable to calculate impact - proceed with caution');
    });
  });

  describe('simulateCommissionChanges', () => {
    it('should simulate commission changes on historical data', async () => {
      // Mock current commission settings
      const mockSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      // Mock historical orders
      const mockOrders = [
        { 
          id: 'order-1', 
          supplierId: 'supplier-1', 
          totalAmount: '1000', 
          commissionAmount: '30',
          supplierName: 'Supplier A'
        },
        { 
          id: 'order-2', 
          supplierId: 'supplier-2', 
          totalAmount: '2000', 
          commissionAmount: '40',
          supplierName: 'Supplier B'
        }
      ];

      // Mock supplier profiles for rate calculation
      const mockSupplier1 = [{ membershipTier: 'silver', customCommissionRate: null }];
      const mockSupplier2 = [{ membershipTier: 'gold', customCommissionRate: null }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue(mockOrders)
            })
          })
        })
        // Mock supplier lookups for rate calculation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier1)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockSupplier2)
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const rateChanges = {
        silverRate: 2.5, // Decrease from 3.0 to 2.5
        goldRate: 2.5    // Increase from 2.0 to 2.5
      };

      const simulation = await commissionService.simulateCommissionChanges(rateChanges);

      expect(simulation).toHaveProperty('currentRevenue');
      expect(simulation).toHaveProperty('projectedRevenue');
      expect(simulation).toHaveProperty('revenueChange');
      expect(simulation).toHaveProperty('revenueChangePercent');
      expect(simulation).toHaveProperty('affectedOrders');
      expect(simulation).toHaveProperty('supplierImpact');

      expect(simulation.currentRevenue).toBe(70); // 30 + 40
      expect(simulation.affectedOrders).toBe(2);
      expect(Array.isArray(simulation.supplierImpact)).toBe(true);
    });
  });

  describe('getSupplierCommissionSummary', () => {
    it('should calculate supplier commission summary correctly', async () => {
      const mockSummary = [{
        totalOrders: 10,
        totalSales: 5000,
        totalCommission: 150,
        totalEarnings: 4850,
        avgCommissionRate: 3.0
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(mockSummary)
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const summary = await commissionService.getSupplierCommissionSummary('supplier-1');

      expect(summary.totalOrders).toBe(10);
      expect(summary.totalSales).toBe(5000);
      expect(summary.totalCommission).toBe(150);
      expect(summary.totalEarnings).toBe(4850);
      expect(summary.avgCommissionRate).toBe(3.0);
    });

    it('should handle empty results gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue([])
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const summary = await commissionService.getSupplierCommissionSummary('supplier-1');

      expect(summary.totalOrders).toBe(0);
      expect(summary.totalSales).toBe(0);
      expect(summary.totalCommission).toBe(0);
      expect(summary.totalEarnings).toBe(0);
      expect(summary.avgCommissionRate).toBe(0);
    });
  });

  describe('getPlatformCommissionSummary', () => {
    it('should calculate platform commission summary correctly', async () => {
      const mockSummary = [{
        totalOrders: 100,
        totalSales: 50000,
        totalCommission: 1250,
        totalPaidToSuppliers: 48750,
        avgCommissionRate: 2.5
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(mockSummary)
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const summary = await commissionService.getPlatformCommissionSummary();

      expect(summary.totalOrders).toBe(100);
      expect(summary.totalSales).toBe(50000);
      expect(summary.totalCommission).toBe(1250);
      expect(summary.totalPaidToSuppliers).toBe(48750);
      expect(summary.avgCommissionRate).toBe(2.5);
    });
  });

  describe('updateCommissionSettings', () => {
    it('should update existing commission settings', async () => {
      const mockExistingSettings = [{
        id: 'settings-1',
        defaultRate: '5.0'
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue(mockExistingSettings)
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.resolve())
        })
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.update as any).mockImplementation(mockUpdate);

      const newRates = { silverRate: 2.8 };
      
      await commissionService.updateCommissionSettings(newRates, 'admin-1');

      expect(db.update).toHaveBeenCalled();
    });

    it('should create new settings if none exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue([]) // No existing settings
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockImplementation(mockInsert);

      const newRates = { defaultRate: 4.5 };
      
      await commissionService.updateCommissionSettings(newRates, 'admin-1');

      expect(db.insert).toHaveBeenCalled();
    });
  });
});