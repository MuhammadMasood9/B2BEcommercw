import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductDiscoveryService, productDiscoveryService } from '../productDiscoveryService';
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

describe('ProductDiscoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchProducts', () => {
    it('should return products with default filters and sorting', async () => {
      const mockProducts = [
        {
          product: {
            id: 'product-1',
            name: 'Test Product 1',
            shortDescription: 'Test description',
            minOrderQuantity: 10,
            priceRanges: [{ minQty: 1, maxQty: 100, pricePerUnit: 10.50 }],
            isPublished: true,
            isApproved: true,
            inStock: true,
          },
          supplier: {
            id: 'supplier-1',
            businessName: 'Test Supplier',
            country: 'China',
            verificationLevel: 'verified',
          },
          category: {
            id: 'cat-1',
            name: 'Electronics',
            slug: 'electronics',
          },
        },
      ];

      const mockCount = [{ count: 1 }];
      const mockFilters = {
        categories: [],
        suppliers: [],
        priceRange: { min: 0, max: 1000 },
        moqRange: { min: 1, max: 1000 },
        certifications: [],
        colors: [],
        sizes: [],
      };

      // Mock count query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(mockCount),
              }),
            }),
          }),
        })
        // Mock products query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(mockProducts),
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

      // Mock filter aggregation queries
      vi.spyOn(productDiscoveryService as any, 'getFilterAggregations').mockResolvedValue(mockFilters);

      const result = await productDiscoveryService.searchProducts();

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });
});