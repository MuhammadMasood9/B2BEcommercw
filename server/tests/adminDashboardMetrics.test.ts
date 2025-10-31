import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getPlatformAnalytics, 
  calculateTrendAnalysis, 
  calculatePeriodComparisons,
  getSystemHealthMetrics,
  getTopPerformingProducts,
  getTopPerformingCategories
} from '../adminOversightService';
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

describe('Admin Dashboard Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPlatformAnalytics', () => {
    it('should calculate platform analytics correctly', async () => {
      // Mock database responses
      const mockSupplierStats = [
        { status: 'approved', count: 50 },
        { status: 'pending', count: 10 },
        { status: 'suspended', count: 5 }
      ];

      const mockProductStats = [
        { status: 'approved', count: 200 },
        { status: 'pending_approval', count: 30 },
        { status: 'rejected', count: 15 }
      ];

      const mockOrderStats = [
        { totalOrders: 1000, totalRevenue: 500000, totalCommission: 25000 }
      ];

      const mockAvgMetrics = [
        { avgRating: 4.2, avgResponseRate: 85.5 }
      ];

      const mockTopSuppliers = [
        { id: '1', name: 'Supplier A', sales: 100000, orders: 200 },
        { id: '2', name: 'Supplier B', sales: 80000, orders: 150 }
      ];

      const mockRecentActivity = [
        { action: 'supplier_approved', description: 'Approved new supplier', createdAt: new Date() }
      ];

      // Setup mock chain
      const mockSelect = vi.fn();
      const mockFrom = vi.fn().mockReturnValue({ groupBy: vi.fn().mockReturnValue(mockSupplierStats) });
      const mockWhere = vi.fn().mockReturnValue({ groupBy: vi.fn().mockReturnValue(mockProductStats) });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue(mockTopSuppliers) });
      const mockLimit = vi.fn().mockReturnValue(mockRecentActivity);

      mockSelect
        .mockReturnValueOnce({ from: mockFrom })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockWhere }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(mockOrderStats) }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(mockAvgMetrics) }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: mockOrderBy }) }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ orderBy: vi.fn().mockReturnValue({ limit: mockLimit }) }) });

      (db.select as any).mockImplementation(mockSelect);

      const result = await getPlatformAnalytics();

      expect(result).toEqual({
        totalSuppliers: 65,
        activeSuppliers: 50,
        pendingSuppliers: 10,
        suspendedSuppliers: 5,
        totalProducts: 245,
        approvedProducts: 200,
        pendingProducts: 30,
        rejectedProducts: 15,
        totalOrders: 1000,
        totalRevenue: 500000,
        totalCommission: 25000,
        averageSupplierRating: 4.2,
        averageResponseRate: 85.5,
        topPerformingSuppliers: [
          { id: '1', name: 'Supplier A', sales: 100000, orders: 200 },
          { id: '2', name: 'Supplier B', sales: 80000, orders: 150 }
        ],
        recentActivity: [
          { type: 'supplier_approved', description: 'Approved new supplier', timestamp: expect.any(Date) }
        ]
      });
    });

    it('should handle empty database results gracefully', async () => {
      // Mock empty responses
      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockReturnValue([]),
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue([]),
            orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) })
          }),
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await getPlatformAnalytics();

      expect(result.totalSuppliers).toBe(0);
      expect(result.totalProducts).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.topPerformingSuppliers).toEqual([]);
    });
  });

  describe('calculateTrendAnalysis', () => {
    it('should generate trend data for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');

      const result = await calculateTrendAnalysis(startDate, endDate);

      expect(result).toHaveLength(3); // 3 days
      expect(result[0]).toHaveProperty('date', '2024-01-01');
      expect(result[0]).toHaveProperty('revenue');
      expect(result[0]).toHaveProperty('orders');
      expect(result[0]).toHaveProperty('suppliers');
      expect(result[0]).toHaveProperty('products');

      // Verify all values are numbers
      result.forEach(trend => {
        expect(typeof trend.revenue).toBe('number');
        expect(typeof trend.orders).toBe('number');
        expect(typeof trend.suppliers).toBe('number');
        expect(typeof trend.products).toBe('number');
      });
    });

    it('should handle single day range', async () => {
      const date = new Date('2024-01-01');
      const result = await calculateTrendAnalysis(date, date);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-01');
    });
  });

  describe('calculatePeriodComparisons', () => {
    it('should calculate period comparisons correctly', async () => {
      // Mock getPlatformAnalytics
      const mockAnalytics = {
        totalRevenue: 100000,
        totalOrders: 500,
        activeSuppliers: 25,
        approvedProducts: 150,
        totalSuppliers: 30,
        pendingSuppliers: 5,
        suspendedSuppliers: 0,
        totalProducts: 180,
        pendingProducts: 20,
        rejectedProducts: 10,
        totalCommission: 5000,
        averageSupplierRating: 4.0,
        averageResponseRate: 80,
        topPerformingSuppliers: [],
        recentActivity: []
      };

      // Mock the select chain for getPlatformAnalytics
      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockReturnValue([
            { status: 'approved', count: 25 },
            { status: 'pending', count: 5 }
          ]),
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue([
              { status: 'approved', count: 150 },
              { status: 'pending_approval', count: 20 },
              { status: 'rejected', count: 10 }
            ]),
            orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) })
          }),
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue([]) })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await calculatePeriodComparisons(startDate, endDate);

      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('suppliers');
      expect(result).toHaveProperty('products');

      // Verify structure of comparison objects
      expect(result.revenue).toHaveProperty('current');
      expect(result.revenue).toHaveProperty('previous');
      expect(result.revenue).toHaveProperty('change');
      expect(result.revenue).toHaveProperty('changePercent');

      // Verify calculations
      expect(result.revenue.current).toBe(mockAnalytics.totalRevenue);
      expect(result.revenue.change).toBe(result.revenue.current - result.revenue.previous);
      
      if (result.revenue.previous > 0) {
        const expectedPercent = ((result.revenue.current - result.revenue.previous) / result.revenue.previous) * 100;
        expect(result.revenue.changePercent).toBeCloseTo(expectedPercent, 2);
      }
    });
  });

  describe('getSystemHealthMetrics', () => {
    it('should calculate system health metrics', async () => {
      // Mock database responses
      const mockActiveSuppliers = [{ count: 45 }];
      const mockActiveOrders = [{ count: 120 }];

      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockActiveSuppliers)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockActiveOrders)
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const result = await getSystemHealthMetrics();

      expect(result).toHaveProperty('onlineSuppliers', 45);
      expect(result).toHaveProperty('activeOrders', 120);
      expect(result).toHaveProperty('systemLoad');
      expect(result).toHaveProperty('errorRate');
      expect(result).toHaveProperty('avgResponseTime');
      expect(result).toHaveProperty('overallStatus');
      expect(result).toHaveProperty('uptime');

      expect(['healthy', 'warning', 'critical']).toContain(result.overallStatus);
      expect(result.systemLoad).toBeGreaterThanOrEqual(0);
      expect(result.systemLoad).toBeLessThanOrEqual(100);
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should determine correct system status based on metrics', async () => {
      // Mock high load scenario
      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue([{ count: 10 }])
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      // Mock Math.random to return high values
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.98); // High system load

      const result = await getSystemHealthMetrics();

      expect(result.overallStatus).toBe('critical');

      Math.random = originalRandom;
    });
  });

  describe('getTopPerformingProducts', () => {
    it('should return top performing products with metrics', async () => {
      const mockProducts = [
        { id: '1', name: 'Product A', views: 1000, inquiries: 50 },
        { id: '2', name: 'Product B', views: 800, inquiries: 30 }
      ];

      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockProducts)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await getTopPerformingProducts(2);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', '1');
      expect(result[0]).toHaveProperty('name', 'Product A');
      expect(result[0]).toHaveProperty('views', 1000);
      expect(result[0]).toHaveProperty('conversionRate');
      expect(result[0]).toHaveProperty('revenue');
      expect(result[0]).toHaveProperty('orders');

      // Verify conversion rate calculation
      expect(result[0].conversionRate).toBe(5); // 50/1000 * 100
      expect(result[1].conversionRate).toBe(3.75); // 30/800 * 100
    });

    it('should handle products with zero views', async () => {
      const mockProducts = [
        { id: '1', name: 'Product A', views: 0, inquiries: 0 }
      ];

      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockProducts)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await getTopPerformingProducts(1);

      expect(result[0].conversionRate).toBe(0);
    });
  });

  describe('getTopPerformingCategories', () => {
    it('should return top performing categories', async () => {
      const mockCategories = [
        { category: 'electronics', count: 50 },
        { category: 'clothing', count: 30 }
      ];

      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue(mockCategories)
              })
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await getTopPerformingCategories(2);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'electronics');
      expect(result[0]).toHaveProperty('productCount', 50);
      expect(result[0]).toHaveProperty('revenue');
      expect(result[0]).toHaveProperty('orders');
      expect(result[1]).toHaveProperty('name', 'clothing');
      expect(result[1]).toHaveProperty('productCount', 30);
    });

    it('should handle null category names', async () => {
      const mockCategories = [
        { category: null, count: 25 }
      ];

      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue(mockCategories)
              })
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const result = await getTopPerformingCategories(1);

      expect(result[0].name).toBe('Uncategorized');
    });
  });
});