import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { supplierRoutes } from '../supplierRoutes';
import { db } from '../db';
import { users, supplierProfiles, products } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  }
}));

// Mock multer middleware
vi.mock('multer', () => ({
  default: vi.fn(() => ({
    fields: vi.fn(() => (req: any, res: any, next: any) => next()),
    single: vi.fn(() => (req: any, res: any, next: any) => next()),
    array: vi.fn(() => (req: any, res: any, next: any) => next()),
  })),
  diskStorage: vi.fn(),
}));

// Mock auth middleware
vi.mock('../auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', role: 'supplier' };
    next();
  },
  supplierMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', role: 'supplier' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/suppliers', supplierRoutes);

describe('Supplier Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/suppliers/register', () => {
    it('should register a new supplier successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@supplier.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'supplier',
      };

      const mockSupplierProfile = {
        id: 'supplier-123',
        userId: 'user-123',
        businessName: 'Test Business',
        storeName: 'Test Store',
        storeSlug: 'test-store',
        status: 'pending',
      };

      // Mock database queries
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No existing user
          }),
        }),
      });

      (db.transaction as any).mockImplementation(async (callback) => {
        return callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        });
      });

      (bcrypt.hash as any).mockResolvedValue('hashed-password');

      const registrationData = {
        email: 'test@supplier.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Test Business',
        businessType: 'manufacturer',
        storeName: 'Test Store',
        contactPerson: 'John Doe',
        position: 'CEO',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        membershipTier: 'free',
      };

      const response = await request(app)
        .post('/api/suppliers/register')
        .send(registrationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('pending approval');
    });

    it('should reject registration with duplicate email', async () => {
      // Mock existing user
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'existing-user' }]),
          }),
        }),
      });

      const registrationData = {
        email: 'existing@supplier.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Test Business',
        businessType: 'manufacturer',
        storeName: 'Test Store',
        contactPerson: 'John Doe',
        position: 'CEO',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
      };

      const response = await request(app)
        .post('/api/suppliers/register')
        .send(registrationData);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'test@supplier.com',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/suppliers/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/suppliers/profile', () => {
    it('should return supplier profile for authenticated user', async () => {
      const mockProfile = {
        id: 'supplier-123',
        userId: 'test-user-id',
        businessName: 'Test Business',
        storeName: 'Test Store',
        status: 'approved',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      });

      const response = await request(app)
        .get('/api/suppliers/profile');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile).toEqual(mockProfile);
    });

    it('should return 404 if supplier profile not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const response = await request(app)
        .get('/api/suppliers/profile');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/suppliers/products', () => {
    it('should return supplier products with ownership validation', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
        businessName: 'Test Business',
      };

      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product 1',
          supplierId: 'supplier-123',
          status: 'approved',
        },
        {
          id: 'product-2',
          name: 'Test Product 2',
          supplierId: 'supplier-123',
          status: 'pending_approval',
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
  });

  describe('POST /api/suppliers/products', () => {
    it('should create a new product for approved supplier', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
        status: 'approved',
        isActive: true,
        totalProducts: 5,
      };

      const mockProduct = {
        id: 'product-123',
        name: 'New Product',
        supplierId: 'supplier-123',
        status: 'pending_approval',
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
        name: 'New Product',
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
      expect(response.body.message).toContain('submitted for approval');
    });

    it('should reject product creation for unapproved supplier', async () => {
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
        name: 'New Product',
        shortDescription: 'A test product',
      };

      const response = await request(app)
        .post('/api/suppliers/products')
        .send(productData);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('approved and active');
    });
  });

  describe('GET /api/suppliers/inquiries', () => {
    it('should return supplier inquiries with buyer information', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
      };

      const mockInquiries = [
        {
          id: 'inquiry-1',
          productId: 'product-1',
          buyerId: 'buyer-1',
          quantity: 100,
          status: 'pending',
          productName: 'Test Product',
          buyerName: 'John',
          buyerCompany: 'Test Company',
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
        // Mock inquiries query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue(mockInquiries),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock quotations query for each inquiry
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Mock count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue([{ count: '1' }]),
                }),
              }),
            }),
          }),
        });

      const response = await request(app)
        .get('/api/suppliers/inquiries');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.inquiries).toHaveLength(1);
    });
  });

  describe('PATCH /api/suppliers/store/settings', () => {
    it('should update store settings for authenticated supplier', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'test-user-id',
        storeName: 'Old Store Name',
      };

      const updatedSupplier = {
        ...mockSupplier,
        storeName: 'New Store Name',
        storeDescription: 'Updated description',
      };

      // Mock supplier profile query
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      // Mock update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedSupplier]),
          }),
        }),
      });

      const updateData = {
        storeName: 'New Store Name',
        storeDescription: 'Updated description',
      };

      const response = await request(app)
        .patch('/api/suppliers/store/settings')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile.storeName).toBe('New Store Name');
    });
  });
});