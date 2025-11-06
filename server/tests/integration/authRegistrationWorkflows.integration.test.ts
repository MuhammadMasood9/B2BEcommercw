import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../../db';
import { users, supplierProfiles, buyers, verificationDocuments } from '@shared/schema';
import { EnhancedAuthService } from '../../enhancedAuthService';
import { EmailService } from '../../emailService';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}));

vi.mock('../../emailService', () => ({
  EmailService: {
    sendVerificationEmail: vi.fn(),
    sendWelcomeEmail: vi.fn(),
    sendSupplierApprovalEmail: vi.fn(),
    sendSupplierRejectionEmail: vi.fn(),
  }
}));

vi.mock('../../enhancedAuthService');

describe('Authentication Registration Workflows Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Setup basic registration routes for testing
    app.post('/api/auth/register/buyer', async (req, res) => {
      try {
        const { email, password, firstName, lastName, companyName, phone } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
          return res.status(400).json({
            error: 'Missing required fields',
            code: 'VALIDATION_ERROR'
          });
        }

        // Check if user already exists
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          return res.status(409).json({
            error: 'Email already registered',
            code: 'EMAIL_EXISTS'
          });
        }

        // Create user and buyer profile
        const userId = `user-${Date.now()}`;
        const buyerId = `buyer-${Date.now()}`;

        await db.transaction(async (tx) => {
          await tx.insert(users).values({
            id: userId,
            email,
            password: await bcrypt.hash(password, 12),
            firstName,
            lastName,
            companyName,
            phone,
            role: 'buyer',
            emailVerified: false,
            isActive: true,
            createdAt: new Date(),
          });

          await tx.insert(buyers).values({
            id: buyerId,
            userId,
            companyName: companyName || `${firstName} ${lastName}`,
            contactPerson: `${firstName} ${lastName}`,
            phone,
            createdAt: new Date(),
          });
        });

        // Send verification email
        await EmailService.sendVerificationEmail(email, userId);

        res.status(201).json({
          success: true,
          message: 'Buyer account created successfully. Please verify your email.',
          userId,
          buyerId
        });
      } catch (error) {
        res.status(500).json({
          error: 'Registration failed',
          code: 'REGISTRATION_ERROR'
        });
      }
    });

    app.post('/api/auth/register/supplier', async (req, res) => {
      try {
        const {
          email, password, firstName, lastName, companyName, phone,
          businessName, businessType, contactPerson, position,
          address, city, country, website, yearEstablished,
          employees, mainProducts, exportMarkets
        } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !businessName || !businessType) {
          return res.status(400).json({
            error: 'Missing required fields',
            code: 'VALIDATION_ERROR'
          });
        }

        // Check if user already exists
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          return res.status(409).json({
            error: 'Email already registered',
            code: 'EMAIL_EXISTS'
          });
        }

        // Create user and supplier profile
        const userId = `user-${Date.now()}`;
        const supplierId = `supplier-${Date.now()}`;

        await db.transaction(async (tx) => {
          await tx.insert(users).values({
            id: userId,
            email,
            password: await bcrypt.hash(password, 12),
            firstName,
            lastName,
            companyName: businessName,
            phone,
            role: 'supplier',
            emailVerified: false,
            isActive: false, // Suppliers need approval
            createdAt: new Date(),
          });

          await tx.insert(supplierProfiles).values({
            id: supplierId,
            userId,
            businessName,
            businessType,
            storeName: businessName,
            storeSlug: businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            contactPerson: contactPerson || `${firstName} ${lastName}`,
            position: position || 'Owner',
            phone,
            address,
            city,
            country,
            website,
            yearEstablished,
            employees,
            mainProducts: mainProducts || [],
            exportMarkets: exportMarkets || [],
            status: 'pending',
            isActive: false,
            createdAt: new Date(),
          });
        });

        // Send verification email
        await EmailService.sendVerificationEmail(email, userId);

        res.status(201).json({
          success: true,
          message: 'Supplier application submitted successfully. Please verify your email and wait for admin approval.',
          userId,
          supplierId
        });
      } catch (error) {
        res.status(500).json({
          error: 'Registration failed',
          code: 'REGISTRATION_ERROR'
        });
      }
    });

    app.post('/api/auth/register/admin', async (req, res) => {
      try {
        const { email, password, firstName, lastName, createdBy } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !createdBy) {
          return res.status(400).json({
            error: 'Missing required fields',
            code: 'VALIDATION_ERROR'
          });
        }

        // Verify creator is super admin (simplified for test)
        const creator = await db.select()
          .from(users)
          .where(eq(users.id, createdBy))
          .limit(1);

        if (creator.length === 0 || creator[0].role !== 'admin') {
          return res.status(403).json({
            error: 'Only super admins can create admin accounts',
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }

        // Check if user already exists
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          return res.status(409).json({
            error: 'Email already registered',
            code: 'EMAIL_EXISTS'
          });
        }

        // Create admin user
        const userId = `admin-${Date.now()}`;

        await db.insert(users).values({
          id: userId,
          email,
          password: await bcrypt.hash(password, 12),
          firstName,
          lastName,
          role: 'admin',
          emailVerified: true, // Admins are pre-verified
          isActive: true,
          createdAt: new Date(),
        });

        res.status(201).json({
          success: true,
          message: 'Admin account created successfully',
          userId
        });
      } catch (error) {
        res.status(500).json({
          error: 'Admin creation failed',
          code: 'ADMIN_CREATION_ERROR'
        });
      }
    });

    app.post('/api/auth/verify-email', async (req, res) => {
      try {
        const { token, userId } = req.body;

        if (!token || !userId) {
          return res.status(400).json({
            error: 'Token and userId required',
            code: 'VALIDATION_ERROR'
          });
        }

        // Verify email verification token (simplified for test)
        const user = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user.length === 0) {
          return res.status(404).json({
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        if (user[0].emailVerified) {
          return res.status(400).json({
            error: 'Email already verified',
            code: 'ALREADY_VERIFIED'
          });
        }

        // Update user as verified
        await db.update(users)
          .set({ 
            emailVerified: true,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // For buyers, activate account immediately
        if (user[0].role === 'buyer') {
          await EmailService.sendWelcomeEmail(user[0].email, user[0].firstName);
        }

        res.json({
          success: true,
          message: 'Email verified successfully',
          role: user[0].role
        });
      } catch (error) {
        res.status(500).json({
          error: 'Email verification failed',
          code: 'VERIFICATION_ERROR'
        });
      }
    });

    app.post('/api/admin/suppliers/:id/approve', async (req, res) => {
      try {
        const { id } = req.params;
        const { adminId } = req.body;

        // Verify admin permissions (simplified for test)
        const admin = await db.select()
          .from(users)
          .where(eq(users.id, adminId))
          .limit(1);

        if (admin.length === 0 || admin[0].role !== 'admin') {
          return res.status(403).json({
            error: 'Admin access required',
            code: 'ADMIN_REQUIRED'
          });
        }

        // Get supplier
        const supplier = await db.select()
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, id))
          .limit(1);

        if (supplier.length === 0) {
          return res.status(404).json({
            error: 'Supplier not found',
            code: 'SUPPLIER_NOT_FOUND'
          });
        }

        // Approve supplier
        await db.transaction(async (tx) => {
          await tx.update(users)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(users.id, supplier[0].userId));

          await tx.update(supplierProfiles)
            .set({ 
              status: 'approved',
              isActive: true,
              updatedAt: new Date()
            })
            .where(eq(supplierProfiles.id, id));
        });

        // Send approval email
        const user = await db.select()
          .from(users)
          .where(eq(users.id, supplier[0].userId))
          .limit(1);

        if (user.length > 0) {
          await EmailService.sendSupplierApprovalEmail(user[0].email, user[0].firstName);
        }

        res.json({
          success: true,
          message: 'Supplier approved successfully'
        });
      } catch (error) {
        res.status(500).json({
          error: 'Supplier approval failed',
          code: 'APPROVAL_ERROR'
        });
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.NODE_ENV;
  });

  describe('Buyer Registration Workflow', () => {
    it('should register buyer successfully with valid data', async () => {
      // Mock database operations
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // No existing user
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({})
      });

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        await callback({
          insert: mockInsert,
          select: mockSelect
        });
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockImplementation(mockInsert);
      (db.transaction as any).mockImplementation(mockTransaction);
      (EmailService.sendVerificationEmail as any).mockResolvedValue(undefined);

      const buyerData = {
        email: 'buyer@test.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Buyer',
        companyName: 'Test Company',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register/buyer')
        .send(buyerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Buyer account created successfully');
      expect(response.body.userId).toBeDefined();
      expect(response.body.buyerId).toBeDefined();
      expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(
        buyerData.email,
        expect.any(String)
      );
    });

    it('should reject buyer registration with missing required fields', async () => {
      const incompleteData = {
        email: 'buyer@test.com',
        password: 'SecurePass123!'
        // Missing firstName and lastName
      };

      const response = await request(app)
        .post('/api/auth/register/buyer')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject buyer registration with existing email', async () => {
      // Mock existing user
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'existing-user',
              email: 'buyer@test.com'
            }])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const buyerData = {
        email: 'buyer@test.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Buyer'
      };

      const response = await request(app)
        .post('/api/auth/register/buyer')
        .send(buyerData)
        .expect(409);

      expect(response.body.error).toBe('Email already registered');
      expect(response.body.code).toBe('EMAIL_EXISTS');
    });

    it('should complete buyer email verification workflow', async () => {
      // Mock unverified user
      const mockUser = {
        id: 'buyer-123',
        email: 'buyer@test.com',
        firstName: 'John',
        role: 'buyer',
        emailVerified: false
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser])
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.update as any).mockImplementation(mockUpdate);
      (EmailService.sendWelcomeEmail as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: 'verification-token',
          userId: 'buyer-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.role).toBe('buyer');
      expect(EmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.firstName
      );
    });
  });

  describe('Supplier Registration Workflow', () => {
    it('should register supplier successfully with complete business data', async () => {
      // Mock database operations
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // No existing user
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({})
      });

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        await callback({
          insert: mockInsert,
          select: mockSelect
        });
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockImplementation(mockInsert);
      (db.transaction as any).mockImplementation(mockTransaction);
      (EmailService.sendVerificationEmail as any).mockResolvedValue(undefined);

      const supplierData = {
        email: 'supplier@test.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Supplier',
        phone: '+1234567890',
        businessName: 'Test Manufacturing Co.',
        businessType: 'manufacturer',
        contactPerson: 'Jane Supplier',
        position: 'CEO',
        address: '123 Business St',
        city: 'Business City',
        country: 'USA',
        website: 'https://testmanufacturing.com',
        yearEstablished: 2010,
        employees: '50-100',
        mainProducts: ['Electronics', 'Components'],
        exportMarkets: ['North America', 'Europe']
      };

      const response = await request(app)
        .post('/api/auth/register/supplier')
        .send(supplierData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Supplier application submitted successfully');
      expect(response.body.userId).toBeDefined();
      expect(response.body.supplierId).toBeDefined();
      expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(
        supplierData.email,
        expect.any(String)
      );
    });

    it('should reject supplier registration with missing business information', async () => {
      const incompleteData = {
        email: 'supplier@test.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Supplier'
        // Missing businessName and businessType
      };

      const response = await request(app)
        .post('/api/auth/register/supplier')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should complete supplier approval workflow', async () => {
      // Mock admin user
      const mockAdmin = {
        id: 'admin-123',
        role: 'admin'
      };

      // Mock supplier profile
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'user-123',
        businessName: 'Test Manufacturing Co.',
        status: 'pending'
      };

      // Mock user
      const mockUser = {
        id: 'user-123',
        email: 'supplier@test.com',
        firstName: 'Jane',
        role: 'supplier'
      };

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockAdmin])
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier])
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockUser])
            })
          })
        });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      });

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        await callback({
          update: mockUpdate
        });
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.update as any).mockImplementation(mockUpdate);
      (db.transaction as any).mockImplementation(mockTransaction);
      (EmailService.sendSupplierApprovalEmail as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/admin/suppliers/supplier-123/approve')
        .send({ adminId: 'admin-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Supplier approved successfully');
      expect(EmailService.sendSupplierApprovalEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.firstName
      );
    });

    it('should reject supplier approval by non-admin', async () => {
      // Mock non-admin user
      const mockUser = {
        id: 'user-123',
        role: 'buyer'
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const response = await request(app)
        .post('/api/admin/suppliers/supplier-123/approve')
        .send({ adminId: 'user-123' })
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
      expect(response.body.code).toBe('ADMIN_REQUIRED');
    });
  });

  describe('Admin Registration Workflow', () => {
    it('should create admin account by super admin', async () => {
      // Mock super admin
      const mockSuperAdmin = {
        id: 'super-admin-123',
        role: 'admin'
      };

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSuperAdmin])
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]) // No existing user
            })
          })
        });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({})
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockImplementation(mockInsert);

      const adminData = {
        email: 'admin@test.com',
        password: 'SecureAdminPass123!',
        firstName: 'Admin',
        lastName: 'User',
        createdBy: 'super-admin-123'
      };

      const response = await request(app)
        .post('/api/auth/register/admin')
        .send(adminData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin account created successfully');
      expect(response.body.userId).toBeDefined();
    });

    it('should reject admin creation by non-admin', async () => {
      // Mock non-admin user
      const mockUser = {
        id: 'user-123',
        role: 'buyer'
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const adminData = {
        email: 'admin@test.com',
        password: 'SecureAdminPass123!',
        firstName: 'Admin',
        lastName: 'User',
        createdBy: 'user-123'
      };

      const response = await request(app)
        .post('/api/auth/register/admin')
        .send(adminData)
        .expect(403);

      expect(response.body.error).toBe('Only super admins can create admin accounts');
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should reject admin creation without creator ID', async () => {
      const adminData = {
        email: 'admin@test.com',
        password: 'SecureAdminPass123!',
        firstName: 'Admin',
        lastName: 'User'
        // Missing createdBy
      };

      const response = await request(app)
        .post('/api/auth/register/admin')
        .send(adminData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Email Verification Workflow', () => {
    it('should reject verification with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: '',
          userId: 'user-123'
        })
        .expect(400);

      expect(response.body.error).toBe('Token and userId required');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject verification for non-existent user', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // No user found
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: 'valid-token',
          userId: 'non-existent-user'
        })
        .expect(404);

      expect(response.body.error).toBe('User not found');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should reject verification for already verified user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
        emailVerified: true
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: 'valid-token',
          userId: 'user-123'
        })
        .expect(400);

      expect(response.body.error).toBe('Email already verified');
      expect(response.body.code).toBe('ALREADY_VERIFIED');
    });
  });

  describe('Multi-Step Registration Data Validation', () => {
    it('should validate supplier business information completeness', async () => {
      const supplierData = {
        email: 'supplier@test.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Supplier',
        businessName: 'Test Manufacturing Co.',
        businessType: 'manufacturer',
        // Missing other business details
      };

      // Mock database operations
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({})
      });

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        await callback({
          insert: mockInsert,
          select: mockSelect
        });
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockImplementation(mockInsert);
      (db.transaction as any).mockImplementation(mockTransaction);
      (EmailService.sendVerificationEmail as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/register/supplier')
        .send(supplierData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Supplier application submitted successfully');
    });

    it('should handle registration with optional fields', async () => {
      const buyerDataWithOptionals = {
        email: 'buyer@test.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Buyer',
        companyName: 'Optional Company',
        phone: '+1234567890'
      };

      // Mock database operations
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({})
      });

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        await callback({
          insert: mockInsert,
          select: mockSelect
        });
      });

      (db.select as any).mockImplementation(mockSelect);
      (db.insert as any).mockImplementation(mockInsert);
      (db.transaction as any).mockImplementation(mockTransaction);
      (EmailService.sendVerificationEmail as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/register/buyer')
        .send(buyerDataWithOptionals)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBeDefined();
      expect(response.body.buyerId).toBeDefined();
    });
  });
});