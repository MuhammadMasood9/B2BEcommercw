import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { supplierRoutes } from '../../supplierRoutes';
import { adminSupplierRoutes } from '../../adminSupplierRoutes';

// Mock the database and dependencies for integration testing
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  }
}));

vi.mock('multer', () => ({
  default: vi.fn(() => ({
    fields: vi.fn(() => (req: any, res: any, next: any) => {
      req.files = {};
      next();
    }),
    single: vi.fn(() => (req: any, res: any, next: any) => next()),
    array: vi.fn(() => (req: any, res: any, next: any) => next()),
  })),
  diskStorage: vi.fn(),
}));

vi.mock('../../auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-user-id', role: 'admin' };
    next();
  },
  supplierMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'supplier-user-id', role: 'supplier' };
    next();
  },
  adminMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-user-id', role: 'admin' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/suppliers', supplierRoutes);
app.use('/api/admin/suppliers', adminSupplierRoutes);

describe('Supplier Onboarding Integration Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = (await import('../../db')).db;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Supplier Onboarding Process', () => {
    it('should complete full supplier registration and approval workflow', async () => {
      // Step 1: Supplier Registration
      const registrationData = {
        email: 'newvendor@example.com',
        password: 'securepassword123',
        firstName: 'John',
        lastName: 'Vendor',
        businessName: 'Vendor Corp',
        businessType: 'manufacturer',
        storeName: 'Vendor Store',
        contactPerson: 'John Vendor',
        position: 'CEO',
        phone: '+1234567890',
        address: '123 Business St',
        city: 'Business City',
        country: 'Business Country',
        membershipTier: 'free',
      };

      // Mock user doesn't exist
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No existing user
          }),
        }),
      });

      // Mock successful registration transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        return callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 'user-123',
                email: registrationData.email,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                role: 'supplier',
              }]),
            }),
          }),
        });
      });

      const registrationResponse = await request(app)
        .post('/api/suppliers/register')
        .send(registrationData);

      expect(registrationResponse.status).toBe(201);
      expect(registrationResponse.body.success).toBe(true);
      expect(registrationResponse.body.message).toContain('pending approval');

      // Step 2: Admin Reviews Application
      const mockPendingSupplier = {
        id: 'supplier-123',
        userId: 'user-123',
        businessName: registrationData.businessName,
        storeName: registrationData.storeName,
        status: 'pending',
        verificationDocs: {},
        createdAt: new Date(),
      };

      // Mock admin getting pending suppliers
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([mockPendingSupplier]),
            }),
          }),
        }),
      });

      const pendingSuppliersResponse = await request(app)
        .get('/api/admin/suppliers/pending');

      expect(pendingSuppliersResponse.status).toBe(200);
      expect(pendingSuppliersResponse.body.suppliers).toHaveLength(1);
      expect(pendingSuppliersResponse.body.suppliers[0].status).toBe('pending');

      // Step 3: Admin Approves Supplier
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockPendingSupplier,
              status: 'approved',
              isActive: true,
              approvedAt: new Date(),
            }]),
          }),
        }),
      });

      // Mock notification creation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      });

      const approvalResponse = await request(app)
        .post('/api/admin/suppliers/supplier-123/approve')
        .send({ approvalNotes: 'All documents verified' });

      expect(approvalResponse.status).toBe(200);
      expect(approvalResponse.body.success).toBe(true);
      expect(approvalResponse.body.message).toContain('approved');

      // Step 4: Supplier Can Now Access Full Features
      const mockApprovedSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        status: 'approved',
        isActive: true,
        businessName: registrationData.businessName,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockApprovedSupplier]),
          }),
        }),
      });

      const profileResponse = await request(app)
        .get('/api/suppliers/profile');

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.profile.status).toBe('approved');
      expect(profileResponse.body.profile.isActive).toBe(true);
    });

    it('should handle supplier rejection workflow', async () => {
      const mockPendingSupplier = {
        id: 'supplier-123',
        userId: 'user-123',
        businessName: 'Test Business',
        status: 'pending',
      };

      // Mock supplier selection
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPendingSupplier]),
          }),
        }),
      });

      // Mock rejection update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockPendingSupplier,
              status: 'rejected',
              rejectionReason: 'Incomplete documentation',
            }]),
          }),
        }),
      });

      // Mock notification creation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      });

      const rejectionResponse = await request(app)
        .post('/api/admin/suppliers/supplier-123/reject')
        .send({ 
          rejectionReason: 'Incomplete documentation',
          feedback: 'Please provide complete business license and tax documents'
        });

      expect(rejectionResponse.status).toBe(200);
      expect(rejectionResponse.body.success).toBe(true);
      expect(rejectionResponse.body.message).toContain('rejected');
    });
  });

  describe('Supplier Profile Management Integration', () => {
    it('should allow approved supplier to update store settings', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        status: 'approved',
        isActive: true,
        storeName: 'Original Store Name',
        storeSlug: 'original-store-name',
      };

      // Mock supplier profile query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      // Mock store settings update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockSupplier,
              storeName: 'Updated Store Name',
              storeDescription: 'New store description',
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const updateData = {
        storeName: 'Updated Store Name',
        storeDescription: 'New store description',
        contactPerson: 'Updated Contact',
        phone: '+1987654321',
      };

      const updateResponse = await request(app)
        .patch('/api/suppliers/store/settings')
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.profile.storeName).toBe('Updated Store Name');
    });
  });

  describe('Document Verification Integration', () => {
    it('should handle document upload and verification process', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        status: 'approved',
        verificationLevel: 'none',
      };

      // Mock supplier profile query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      // Mock verification document update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockSupplier,
              verificationDocs: {
                businessLicense: '/uploads/business-license.pdf',
                taxRegistration: '/uploads/tax-registration.pdf',
              },
              verificationLevel: 'business',
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      // Simulate document upload (mocked)
      const verificationResponse = await request(app)
        .patch('/api/suppliers/store/settings')
        .send({
          verificationDocuments: {
            businessLicense: '/uploads/business-license.pdf',
            taxRegistration: '/uploads/tax-registration.pdf',
          }
        });

      expect(verificationResponse.status).toBe(200);
      expect(verificationResponse.body.success).toBe(true);
    });
  });

  describe('Supplier Status Transitions', () => {
    it('should handle supplier suspension and reactivation', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'user-123',
        status: 'approved',
        isActive: true,
        businessName: 'Test Business',
      };

      // Mock supplier selection
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      // Mock suspension update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockSupplier,
              status: 'suspended',
              isActive: false,
              suspensionReason: 'Policy violation',
            }]),
          }),
        }),
      });

      const suspensionResponse = await request(app)
        .post('/api/admin/suppliers/supplier-123/suspend')
        .send({ 
          reason: 'Policy violation',
          notes: 'Multiple customer complaints'
        });

      expect(suspensionResponse.status).toBe(200);
      expect(suspensionResponse.body.success).toBe(true);
      expect(suspensionResponse.body.message).toContain('suspended');
    });
  });
});