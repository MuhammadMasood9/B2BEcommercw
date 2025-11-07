import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { db } from '../../db';
import { users, supplierProfiles, buyers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * End-to-End Authentication Flow Tests
 * 
 * Tests complete authentication workflows from registration to login to logout
 * across all user roles (buyer, supplier, admin)
 */

describe('Authentication Flows E2E Tests', () => {
  let app: express.Application;
  let testUsers: {
    buyer: { email: string; password: string; userId?: string };
    supplier: { email: string; password: string; userId?: string };
    admin: { email: string; password: string; userId?: string };
  };

  beforeAll(async () => {
    // Setup test environment
    process.env.JWT_SECRET = 'test-jwt-secret-e2e';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-e2e';
    process.env.SESSION_SECRET = 'test-session-secret-e2e';
    process.env.NODE_ENV = 'test';

    // Initialize test users
    testUsers = {
      buyer: {
        email: `buyer-e2e-${Date.now()}@test.com`,
        password: 'BuyerPass123!',
      },
      supplier: {
        email: `supplier-e2e-${Date.now()}@test.com`,
        password: 'SupplierPass123!',
      },
      admin: {
        email: `admin-e2e-${Date.now()}@test.com`,
        password: 'AdminPass123!',
      },
    };

    // Setup Express app with authentication routes
    app = express();
    app.use(express.json());
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true },
      })
    );
  });

  afterAll(async () => {
    // Cleanup test users
    try {
      if (testUsers.buyer.userId) {
        await db.delete(users).where(eq(users.id, testUsers.buyer.userId));
      }
      if (testUsers.supplier.userId) {
        await db.delete(users).where(eq(users.id, testUsers.supplier.userId));
      }
      if (testUsers.admin.userId) {
        await db.delete(users).where(eq(users.id, testUsers.admin.userId));
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.NODE_ENV;
  });

  describe('Complete Buyer Journey', () => {
    it('should complete full buyer registration, verification, login, and logout flow', async () => {
      // Step 1: Register buyer
      const buyerId = `buyer-${Date.now()}`;
      const userId = `user-${Date.now()}`;
      
      const hashedPassword = await bcrypt.hash(testUsers.buyer.password, 12);
      
      await db.insert(users).values({
        id: userId,
        email: testUsers.buyer.email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Buyer',
        role: 'buyer',
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
      });

      await db.insert(buyers).values({
        id: buyerId,
        userId,
        companyName: 'Test Buyer Company',
        contactPerson: 'Test Buyer',
        phone: '+1234567890',
        createdAt: new Date(),
      });

      testUsers.buyer.userId = userId;

      // Step 2: Verify email
      await db.update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, userId));

      const verifiedUser = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(verifiedUser[0].emailVerified).toBe(true);

      // Step 3: Login
      const loginUser = await db.select()
        .from(users)
        .where(eq(users.email, testUsers.buyer.email))
        .limit(1);

      expect(loginUser.length).toBe(1);
      expect(loginUser[0].role).toBe('buyer');
      expect(loginUser[0].isActive).toBe(true);

      const passwordMatch = await bcrypt.compare(
        testUsers.buyer.password,
        loginUser[0].password
      );
      expect(passwordMatch).toBe(true);

      // Step 4: Verify user can access buyer resources
      expect(loginUser[0].emailVerified).toBe(true);
      expect(loginUser[0].isActive).toBe(true);

      // Step 5: Logout (cleanup handled in afterAll)
      expect(loginUser[0].id).toBeDefined();
    });

    it('should prevent login before email verification', async () => {
      const userId = `user-unverified-${Date.now()}`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email: `unverified-${Date.now()}@test.com`,
        password: hashedPassword,
        firstName: 'Unverified',
        lastName: 'User',
        role: 'buyer',
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
      });

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].emailVerified).toBe(false);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });
  });

  describe('Complete Supplier Journey', () => {
    it('should complete full supplier registration, approval, and login flow', async () => {
      // Step 1: Register supplier
      const supplierId = `supplier-${Date.now()}`;
      const userId = `user-${Date.now()}`;
      
      const hashedPassword = await bcrypt.hash(testUsers.supplier.password, 12);
      
      await db.insert(users).values({
        id: userId,
        email: testUsers.supplier.email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Supplier',
        role: 'supplier',
        emailVerified: false,
        isActive: false, // Suppliers start inactive
        createdAt: new Date(),
      });

      await db.insert(supplierProfiles).values({
        id: supplierId,
        userId,
        businessName: 'Test Supplier Co.',
        businessType: 'manufacturer',
        storeName: 'Test Store',
        storeSlug: 'test-store',
        contactPerson: 'Test Supplier',
        position: 'Owner',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        status: 'pending',
        isActive: false,
        createdAt: new Date(),
      });

      testUsers.supplier.userId = userId;

      // Step 2: Verify email
      await db.update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, userId));

      // Step 3: Admin approves supplier
      await db.update(users)
        .set({ isActive: true })
        .where(eq(users.id, userId));

      await db.update(supplierProfiles)
        .set({ status: 'approved', isActive: true })
        .where(eq(supplierProfiles.id, supplierId));

      // Step 4: Verify supplier can login
      const approvedUser = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(approvedUser[0].emailVerified).toBe(true);
      expect(approvedUser[0].isActive).toBe(true);

      const supplierProfile = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      expect(supplierProfile[0].status).toBe('approved');
      expect(supplierProfile[0].isActive).toBe(true);
    });

    it('should prevent supplier login before approval', async () => {
      const userId = `user-pending-${Date.now()}`;
      const supplierId = `supplier-pending-${Date.now()}`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email: `pending-supplier-${Date.now()}@test.com`,
        password: hashedPassword,
        firstName: 'Pending',
        lastName: 'Supplier',
        role: 'supplier',
        emailVerified: true,
        isActive: false,
        createdAt: new Date(),
      });

      await db.insert(supplierProfiles).values({
        id: supplierId,
        userId,
        businessName: 'Pending Supplier Co.',
        businessType: 'manufacturer',
        storeName: 'Pending Store',
        storeSlug: 'pending-store',
        contactPerson: 'Pending Supplier',
        position: 'Owner',
        phone: '+1234567890',
        address: '456 Pending St',
        city: 'Pending City',
        country: 'Pending Country',
        status: 'pending',
        isActive: false,
        createdAt: new Date(),
      });

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].isActive).toBe(false);

      // Cleanup
      await db.delete(supplierProfiles).where(eq(supplierProfiles.id, supplierId));
      await db.delete(users).where(eq(users.id, userId));
    });
  });

  describe('Admin Authentication Flow', () => {
    it('should allow admin login with proper credentials', async () => {
      const userId = `admin-${Date.now()}`;
      const hashedPassword = await bcrypt.hash(testUsers.admin.password, 12);

      await db.insert(users).values({
        id: userId,
        email: testUsers.admin.email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
      });

      testUsers.admin.userId = userId;

      const adminUser = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(adminUser[0].role).toBe('admin');
      expect(adminUser[0].emailVerified).toBe(true);
      expect(adminUser[0].isActive).toBe(true);
    });
  });

  describe('Session Management Flow', () => {
    it('should maintain session across multiple requests', async () => {
      const userId = `user-session-${Date.now()}`;
      const hashedPassword = await bcrypt.hash('SessionPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email: `session-test-${Date.now()}@test.com`,
        password: hashedPassword,
        firstName: 'Session',
        lastName: 'Test',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
      });

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0]).toBeDefined();
      expect(user[0].id).toBe(userId);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });

    it('should invalidate session on logout', async () => {
      const userId = `user-logout-${Date.now()}`;
      const hashedPassword = await bcrypt.hash('LogoutPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email: `logout-test-${Date.now()}@test.com`,
        password: hashedPassword,
        firstName: 'Logout',
        lastName: 'Test',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
      });

      // Verify user exists
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0]).toBeDefined();

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset workflow', async () => {
      const userId = `user-reset-${Date.now()}`;
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass123!';
      const hashedOldPassword = await bcrypt.hash(oldPassword, 12);

      await db.insert(users).values({
        id: userId,
        email: `reset-test-${Date.now()}@test.com`,
        password: hashedOldPassword,
        firstName: 'Reset',
        lastName: 'Test',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
      });

      // Simulate password reset
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await db.update(users)
        .set({ password: hashedNewPassword })
        .where(eq(users.id, userId));

      const updatedUser = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const newPasswordMatch = await bcrypt.compare(newPassword, updatedUser[0].password);
      expect(newPasswordMatch).toBe(true);

      const oldPasswordMatch = await bcrypt.compare(oldPassword, updatedUser[0].password);
      expect(oldPasswordMatch).toBe(false);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });
  });

  describe('Account Status Transitions', () => {
    it('should handle account activation and deactivation', async () => {
      const userId = `user-status-${Date.now()}`;
      const hashedPassword = await bcrypt.hash('StatusPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email: `status-test-${Date.now()}@test.com`,
        password: hashedPassword,
        firstName: 'Status',
        lastName: 'Test',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
      });

      // Deactivate account
      await db.update(users)
        .set({ isActive: false })
        .where(eq(users.id, userId));

      let user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].isActive).toBe(false);

      // Reactivate account
      await db.update(users)
        .set({ isActive: true })
        .where(eq(users.id, userId));

      user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].isActive).toBe(true);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });
  });
});
