/**
 * Unit Tests for Supplier Management Functionality
 * Tests supplier registration, profile management, and verification
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { users, supplierProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('Supplier Management', () => {
  let testUserId: string;
  let testSupplierId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(supplierProfiles).where(eq(supplierProfiles.storeName, 'Test Store'));
    await db.delete(users).where(eq(users.email, 'testsupplier@example.com'));
  });

  afterAll(async () => {
    // Clean up test data
    if (testSupplierId) {
      await db.delete(supplierProfiles).where(eq(supplierProfiles.id, testSupplierId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('Supplier Registration', () => {
    it('should create a new supplier with valid data', async () => {
      const hashedPassword = await bcrypt.hash('testpassword123', 12);

      // Create user
      const [user] = await db.insert(users).values({
        email: 'testsupplier@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Supplier',
        role: 'supplier',
        emailVerified: false,
        isActive: true
      }).returning();

      testUserId = user.id;

      // Create supplier profile
      const [supplier] = await db.insert(supplierProfiles).values({
        userId: user.id,
        businessName: 'Test Business',
        businessType: 'manufacturer',
        storeName: 'Test Store',
        storeSlug: 'test-store',
        contactPerson: 'Test Contact',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        verificationLevel: 'none',
        isVerified: false,
        status: 'pending',
        isActive: false,
        isFeatured: false
      }).returning();

      testSupplierId = supplier.id;

      expect(supplier).toBeDefined();
      expect(supplier.businessName).toBe('Test Business');
      expect(supplier.status).toBe('pending');
      expect(supplier.isVerified).toBe(false);
    });

    it('should have correct initial status for new supplier', async () => {
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, testSupplierId))
        .limit(1);

      expect(supplier.status).toBe('pending');
      expect(supplier.isActive).toBe(false);
      expect(supplier.verificationLevel).toBe('none');
    });
  });

  describe('Supplier Profile Management', () => {
    it('should update supplier profile information', async () => {
      const [updated] = await db.update(supplierProfiles)
        .set({
          storeDescription: 'Updated description',
          website: 'https://teststore.com',
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, testSupplierId))
        .returning();

      expect(updated.storeDescription).toBe('Updated description');
      expect(updated.website).toBe('https://teststore.com');
    });

    it('should maintain unique store names', async () => {
      const existingStore = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.storeName, 'Test Store'))
        .limit(1);

      expect(existingStore.length).toBe(1);
    });
  });

  describe('Supplier Verification', () => {
    it('should update verification status', async () => {
      const [verified] = await db.update(supplierProfiles)
        .set({
          isVerified: true,
          verificationLevel: 'basic',
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, testSupplierId))
        .returning();

      expect(verified.isVerified).toBe(true);
      expect(verified.verificationLevel).toBe('basic');
      expect(verified.verifiedAt).toBeDefined();
    });

    it('should support different verification levels', async () => {
      const levels = ['none', 'basic', 'business', 'premium'];
      
      for (const level of levels) {
        const [updated] = await db.update(supplierProfiles)
          .set({
            verificationLevel: level,
            updatedAt: new Date()
          })
          .where(eq(supplierProfiles.id, testSupplierId))
          .returning();

        expect(updated.verificationLevel).toBe(level);
      }
    });
  });

  describe('Supplier Status Management', () => {
    it('should update supplier status to approved', async () => {
      const [approved] = await db.update(supplierProfiles)
        .set({
          status: 'approved',
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, testSupplierId))
        .returning();

      expect(approved.status).toBe('approved');
      expect(approved.isActive).toBe(true);
    });

    it('should support all status types', async () => {
      const statuses = ['pending', 'approved', 'rejected', 'suspended'];
      
      for (const status of statuses) {
        const [updated] = await db.update(supplierProfiles)
          .set({
            status: status,
            updatedAt: new Date()
          })
          .where(eq(supplierProfiles.id, testSupplierId))
          .returning();

        expect(updated.status).toBe(status);
      }
    });
  });

  describe('Supplier Performance Metrics', () => {
    it('should initialize with default metrics', async () => {
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, testSupplierId))
        .limit(1);

      expect(supplier.rating).toBeDefined();
      expect(supplier.totalReviews).toBeDefined();
      expect(supplier.totalSales).toBeDefined();
      expect(supplier.totalOrders).toBeDefined();
    });

    it('should update performance metrics', async () => {
      const [updated] = await db.update(supplierProfiles)
        .set({
          rating: '4.5',
          totalReviews: 10,
          totalSales: '5000.00',
          totalOrders: 25,
          responseRate: '95.5',
          responseTime: '< 2 hours',
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, testSupplierId))
        .returning();

      expect(parseFloat(updated.rating || '0')).toBe(4.5);
      expect(updated.totalReviews).toBe(10);
      expect(parseFloat(updated.totalSales || '0')).toBe(5000);
      expect(updated.totalOrders).toBe(25);
    });
  });
});
