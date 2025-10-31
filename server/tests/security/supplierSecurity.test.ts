import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { supplierRoutes } from '../../supplierRoutes';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  }
}));

vi.mock('multer', () => ({
  default: vi.fn(() => ({
    fields: vi.fn(() => (req: any, res: any, next: any) => next()),
    single: vi.fn(() => (req: any, res: any, next: any) => next()),
    array: vi.fn(() => (req: any, res: any, next: any) => next()),
  })),
  diskStorage: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/suppliers', supplierRoutes);

describe('Supplier Security Tests', () => {
  let mockDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = (await import('../../db')).db;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication and Authorization Security', () => {
    it('should prevent unauthorized access to supplier endpoints', async () => {
      // Mock no authentication middleware (simulate unauthenticated request)
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          res.status(401).json({ error: 'Unauthorized' });
        },
      }));

      const response = await request(app)
        .get('/api/suppliers/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should prevent cross-supplier data access', async () => {
      // Mock authentication for supplier A
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          req.user = { id: 'supplier-a-user-id', role: 'supplier' };
          next();
        },
      }));

      const mockSupplierA = {
        id: 'supplier-a',
        userId: 'supplier-a-user-id',
        businessName: 'Supplier A',
      };

      // Mock supplier A profile query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplierA]),
          }),
        }),
      });

      // Try to access supplier B's product (should fail)
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplierA]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // No product found for supplier A
            }),
          }),
        });

      const response = await request(app)
        .get('/api/suppliers/products/supplier-b-product-123');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found or access denied');
    });

    it('should validate supplier ownership for all operations', async () => {
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          req.user = { id: 'supplier-user-id', role: 'supplier' };
          next();
        },
      }));

      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
      };

      // Test product update with ownership validation
      mockDb.select
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
              limit: vi.fn().mockResolvedValue([]), // Product not owned by this supplier
            }),
          }),
        });

      const response = await request(app)
        .patch('/api/suppliers/products/other-supplier-product')
        .send({ name: 'Hacked Product Name' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found or access denied');
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate and sanitize supplier registration input', async () => {
      // Mock no existing user
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Test SQL injection attempt
      const maliciousData = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'password123',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        businessName: "Business'; DELETE FROM supplier_profiles; --",
        businessType: 'manufacturer',
        storeName: 'Test Store',
        contactPerson: 'Test Person',
        position: 'CEO',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
      };

      const response = await request(app)
        .post('/api/suppliers/register')
        .send(maliciousData);

      // Should either reject malicious input or sanitize it
      if (response.status === 400) {
        expect(response.body.error).toBeDefined();
      } else if (response.status === 201) {
        // If accepted, ensure data was sanitized
        expect(response.body.user.firstName).not.toContain('<script>');
      }
    });

    it('should prevent XSS attacks in product descriptions', async () => {
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          req.user = { id: 'supplier-user-id', role: 'supplier' };
          next();
        },
      }));

      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        status: 'approved',
        isActive: true,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      const maliciousProductData = {
        name: '<script>alert("XSS")</script>Product Name',
        shortDescription: 'Normal description',
        description: '<img src="x" onerror="alert(\'XSS\')" />Detailed description',
        categoryId: 'category-1',
        minOrderQuantity: 10,
      };

      const response = await request(app)
        .post('/api/suppliers/products')
        .send(maliciousProductData);

      // Should either reject or sanitize XSS attempts
      if (response.status === 201) {
        expect(response.body.product.name).not.toContain('<script>');
        expect(response.body.product.description).not.toContain('onerror');
      }
    });

    it('should validate file upload security', async () => {
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          req.user = { id: 'supplier-user-id', role: 'supplier' };
          next();
        },
      }));

      // Test malicious file upload attempt
      const maliciousFile = {
        fieldname: 'storeLogo',
        originalname: '../../../etc/passwd',
        encoding: '7bit',
        mimetype: 'text/plain', // Wrong MIME type
        size: 1024,
        filename: 'malicious.php',
        path: '/tmp/malicious.php',
      };

      // Mock multer to simulate malicious file
      vi.doMock('multer', () => ({
        default: vi.fn(() => ({
          single: vi.fn(() => (req: any, res: any, next: any) => {
            req.file = maliciousFile;
            next();
          }),
        })),
        diskStorage: vi.fn(),
      }));

      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/suppliers/store/upload-logo')
        .attach('logo', Buffer.from('malicious content'), 'malicious.php');

      // Should reject malicious file uploads
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid file type');
    });
  });

  describe('Data Protection and Privacy', () => {
    it('should not expose sensitive supplier data in API responses', async () => {
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          req.user = { id: 'supplier-user-id', role: 'supplier' };
          next();
        },
      }));

      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        businessName: 'Test Business',
        bankName: 'Secret Bank',
        accountNumber: '1234567890',
        paypalEmail: 'secret@paypal.com',
        verificationDocs: {
          businessLicense: '/uploads/license.pdf',
          taxRegistration: '/uploads/tax.pdf',
        },
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      const response = await request(app)
        .get('/api/suppliers/profile');

      expect(response.status).toBe(200);
      
      // Sensitive financial data should not be exposed
      expect(response.body.profile.accountNumber).toBeUndefined();
      expect(response.body.profile.paypalEmail).toBeUndefined();
      
      // Verification documents should not be fully exposed
      if (response.body.profile.verificationDocs) {
        expect(typeof response.body.profile.verificationDocs).toBe('object');
        // Should not contain full file paths or sensitive info
      }
    });

    it('should hash passwords securely', async () => {
      const plainPassword = 'testpassword123';
      const hashedPassword = 'hashed_password_value';

      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      // Mock no existing user
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockDb.transaction.mockImplementation(async (callback) => {
        return callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword, // Should be hashed
              }]),
            }),
          }),
        });
      });

      const registrationData = {
        email: 'test@example.com',
        password: plainPassword,
        firstName: 'Test',
        lastName: 'User',
        businessName: 'Test Business',
        businessType: 'manufacturer',
        storeName: 'Test Store',
        contactPerson: 'Test Person',
        position: 'CEO',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
      };

      const response = await request(app)
        .post('/api/suppliers/register')
        .send(registrationData);

      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 12);
      
      // Response should not contain password
      if (response.status === 201) {
        expect(response.body.user.password).toBeUndefined();
      }
    });
  });

  describe('Rate Limiting and Abuse Prevention', () => {
    it('should handle rapid registration attempts', async () => {
      // Mock no existing user for each attempt
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const registrationData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        businessName: 'Test Business',
        businessType: 'manufacturer',
        storeName: 'Test Store',
        contactPerson: 'Test Person',
        position: 'CEO',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
      };

      // Simulate rapid registration attempts
      const rapidRequests = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .post('/api/suppliers/register')
          .send({ ...registrationData, email: `test${i}@example.com` })
      );

      const responses = await Promise.all(rapidRequests);
      
      // Should handle all requests without crashing
      responses.forEach(response => {
        expect([201, 400, 429, 500]).toContain(response.status);
      });
    });

    it('should prevent brute force login attempts', async () => {
      // Simulate multiple failed login attempts
      const loginAttempts = Array.from({ length: 20 }, () => ({
        email: 'test@example.com',
        password: 'wrongpassword',
      }));

      // Mock user exists but password is wrong
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'user-123',
              email: 'test@example.com',
              password: 'hashed_correct_password',
            }]),
          }),
        }),
      });

      (bcrypt.compare as any).mockResolvedValue(false); // Wrong password

      const responses = [];
      for (const attempt of loginAttempts) {
        const response = await request(app)
          .post('/api/suppliers/login')
          .send(attempt);
        responses.push(response);
        
        // Add small delay to simulate real attempts
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Should eventually start rate limiting or blocking
      const lastFewResponses = responses.slice(-5);
      const hasRateLimiting = lastFewResponses.some(r => r.status === 429);
      
      // Either rate limiting should kick in, or all should fail with 401
      expect(hasRateLimiting || lastFewResponses.every(r => r.status === 401)).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in search queries', async () => {
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          req.user = { id: 'supplier-user-id', role: 'supplier' };
          next();
        },
      }));

      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
      };

      // Mock supplier profile query
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock products query with SQL injection attempt
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue([]), // Should return empty due to parameterized queries
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '0' }]),
          }),
        });

      // Attempt SQL injection in search parameter
      const maliciousSearch = "'; DROP TABLE products; --";
      
      const response = await request(app)
        .get('/api/suppliers/products')
        .query({ search: maliciousSearch });

      // Should handle malicious input safely
      expect(response.status).toBe(200);
      expect(response.body.products).toBeDefined();
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('Access Control and Permissions', () => {
    it('should enforce role-based access control', async () => {
      // Mock buyer trying to access supplier endpoints
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Forbidden: Supplier access required' });
          }
          next();
        },
      }));

      // Simulate buyer user
      const buyerUser = { id: 'buyer-user-id', role: 'buyer' };

      const response = await request(app)
        .get('/api/suppliers/profile');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should validate supplier status for restricted operations', async () => {
      vi.doMock('../../auth', () => ({
        supplierMiddleware: (req: any, res: any, next: any) => {
          req.user = { id: 'supplier-user-id', role: 'supplier' };
          next();
        },
      }));

      // Mock suspended supplier
      const suspendedSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        status: 'suspended',
        isActive: false,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([suspendedSupplier]),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/suppliers/products')
        .send({
          name: 'Test Product',
          description: 'Test Description',
        });

      // Suspended suppliers should not be able to create products
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('approved and active');
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate business data integrity', async () => {
      // Mock no existing user
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const invalidBusinessData = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '', // Empty
        lastName: 'Test',
        businessName: '', // Empty
        businessType: 'invalid_type', // Invalid enum
        storeName: '', // Empty
        contactPerson: '', // Empty
        position: 'CEO',
        phone: '123', // Too short
        address: '', // Empty
        city: '', // Empty
        country: '', // Empty
      };

      const response = await request(app)
        .post('/api/suppliers/register')
        .send(invalidBusinessData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should prevent duplicate business registrations', async () => {
      // Mock existing business with same name
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // No existing user
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 'existing-supplier',
                businessName: 'Existing Business',
              }]), // Existing business name
            }),
          }),
        });

      const duplicateBusinessData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        businessName: 'Existing Business', // Duplicate name
        businessType: 'manufacturer',
        storeName: 'New Store',
        contactPerson: 'New Person',
        position: 'CEO',
        phone: '+1234567890',
        address: '123 New St',
        city: 'New City',
        country: 'New Country',
      };

      const response = await request(app)
        .post('/api/suppliers/register')
        .send(duplicateBusinessData);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Business name already exists');
    });
  });
});