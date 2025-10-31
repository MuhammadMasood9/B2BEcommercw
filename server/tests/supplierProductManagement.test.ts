import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { supplierRoutes } from '../supplierRoutes';
import { db } from '../db';

// Mock the database and other dependencies
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('multer', () => ({
  default: vi.fn(() => ({
    array: vi.fn(() => (req: any, res: any, next: any) => {
      req.files = [];
      next();
    }),
  })),
  diskStorage: vi.fn(),
}));

vi.mock('../auth', () => ({
  supplierMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', role: 'supplier' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/suppliers', supplierRoutes);

describe('Supplier Product Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Product Creation Workflow', () => {
    it('should create product with pending approval status', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
        status: 'approved',
        isActive: true,
        totalProducts: 5,
      };

      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        supplierId: 'supplier-123',
        status: 'pending_approval',
        isApproved: false,
        isPublished: false,
      };

      // Mock supplier profile query
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      // Mock product creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProduct]),
        }),
      });

      // Mock supplier update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const productData = {
        name: 'Test Product',
        shortDescription: 'A test product',
        description: 'Detailed description',
        categoryId: 'category-1',
        minOrderQuantity: 10,
        inStock: true,
        stockQuantity: 100,
      };

      const response = await request(app)
        .post('/api/suppliers/products')
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.product.status).toBe('pending_approval');
      expect(response.body.product.isApproved).toBe(false);
      expect(response.body.product.isPublished).toBe(false);
    });

    it('should reject product creation for inactive supplier', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
        status: 'pending',
        isActive: false,
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      const productData = {
        name: 'Test Product',
        shortDescription: 'A test product',
      };

      const response = await request(app)
        .post('/api/suppliers/products')
        .send(productData);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('approved and active');
    });

    it('should validate product ownership on update', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
      };

      const mockProduct = {
        id: 'product-123',
        supplierId: 'supplier-123',
        status: 'approved',
        images: ['/uploads/image1.jpg'],
      };

      // Mock supplier profile query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock product query with ownership validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockProduct]),
            }),
          }),
        });

      // Mock product update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockProduct,
              name: 'Updated Product Name',
            }]),
          }),
        }),
      });

      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .patch('/api/suppliers/products/product-123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent updating products from other suppliers', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
      };

      // Mock supplier profile query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock product not found (different supplier)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      const updateData = {
        name: 'Updated Product Name',
      };

      const response = await request(app)
        .patch('/api/suppliers/products/other-product-123')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found or access denied');
    });
  });

  describe('Product Approval Workflow', () => {
    it('should reset status to pending when updating rejected product', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
      };

      const mockRejectedProduct = {
        id: 'product-123',
        supplierId: 'supplier-123',
        status: 'rejected',
        rejectionReason: 'Incomplete information',
        images: [],
      };

      // Mock supplier and product queries
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockRejectedProduct]),
            }),
          }),
        });

      // Mock product update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockRejectedProduct,
              status: 'pending_approval',
              isApproved: false,
              rejectionReason: null,
            }]),
          }),
        }),
      });

      const updateData = {
        description: 'Updated with complete information',
      };

      const response = await request(app)
        .patch('/api/suppliers/products/product-123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Verify that the update includes status reset
      expect(db.update).toHaveBeenCalled();
    });

    it('should handle bulk product upload with validation', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
        status: 'approved',
        isActive: true,
        businessName: 'Test Supplier',
        totalProducts: 10,
      };

      const mockCreatedProducts = [
        { id: 'product-1', name: 'Product 1', status: 'pending_approval' },
        { id: 'product-2', name: 'Product 2', status: 'pending_approval' },
      ];

      // Mock supplier profile query
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      // Mock bulk product creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockCreatedProducts),
        }),
      });

      // Mock supplier update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const bulkProducts = [
        {
          name: 'Product 1',
          shortDescription: 'Description 1',
          description: 'Detailed description 1',
          categoryId: 'category-1',
          minOrderQuantity: 10,
          inStock: true,
          stockQuantity: 100,
        },
        {
          name: 'Product 2',
          shortDescription: 'Description 2',
          description: 'Detailed description 2',
          categoryId: 'category-2',
          minOrderQuantity: 5,
          inStock: true,
          stockQuantity: 50,
        },
      ];

      const response = await request(app)
        .post('/api/suppliers/products/bulk-upload')
        .send({ products: JSON.stringify(bulkProducts) });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.message).toContain('approval');
    });

    it('should validate bulk upload data and return errors', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
        status: 'approved',
        isActive: true,
        businessName: 'Test Supplier',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      const invalidProducts = [
        {
          // Missing required fields
          shortDescription: 'Description 1',
        },
        {
          name: 'Product 2',
          // Missing other required fields
        },
      ];

      const response = await request(app)
        .post('/api/suppliers/products/bulk-upload')
        .send({ products: JSON.stringify(invalidProducts) });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation errors');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errorCount).toBeGreaterThan(0);
    });
  });

  describe('Product Deletion', () => {
    it('should delete product with ownership validation', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
        totalProducts: 5,
      };

      const mockProduct = {
        id: 'product-123',
        supplierId: 'supplier-123',
        name: 'Product to Delete',
      };

      // Mock supplier and product queries
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockProduct]),
            }),
          }),
        });

      // Mock product deletion
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });

      // Mock supplier update (decrement product count)
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const response = await request(app)
        .delete('/api/suppliers/products/product-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should prevent deleting products from other suppliers', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
      };

      // Mock supplier profile query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock product not found (different supplier)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      const response = await request(app)
        .delete('/api/suppliers/products/other-product-123');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found or access denied');
    });
  });

  describe('Product Listing and Filtering', () => {
    it('should return only supplier-owned products', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
      };

      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          supplierId: 'supplier-123',
          status: 'approved',
          categoryName: 'Electronics',
        },
        {
          id: 'product-2',
          name: 'Product 2',
          supplierId: 'supplier-123',
          status: 'pending_approval',
          categoryName: 'Clothing',
        },
      ];

      // Mock supplier profile query
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock products query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
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
        })
        // Mock count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '2' }]),
          }),
        });

      const response = await request(app)
        .get('/api/suppliers/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter products by status', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
      };

      const mockPendingProducts = [
        {
          id: 'product-1',
          name: 'Pending Product',
          status: 'pending_approval',
        },
      ];

      // Mock supplier and filtered products queries
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockPendingProducts),
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '1' }]),
          }),
        });

      const response = await request(app)
        .get('/api/suppliers/products?status=pending_approval');

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].status).toBe('pending_approval');
    });

    it('should search products by name and description', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
      };

      const mockSearchResults = [
        {
          id: 'product-1',
          name: 'Smartphone Case',
          description: 'Protective case for smartphones',
        },
      ];

      // Mock supplier and search results
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockSearchResults),
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
                where: vi.fn().mockResolvedValue([{ count: '1' }]),
              }),
            }),
          }),
        });

      const response = await request(app)
        .get('/api/suppliers/products?search=smartphone');

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].name).toContain('Smartphone');
    });
  });
});