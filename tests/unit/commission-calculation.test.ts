/**
 * Unit Tests for Commission Calculation System
 * Tests commission rates, calculations, and payout logic
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { supplierProfiles, commissions, payouts, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { calculateCommission } from '../../server/commissionRoutes';
import bcrypt from 'bcryptjs';

describe('Commission Calculation System', () => {
  let testSupplierId: string;
  let testUserId: string;
  let testCommissionId: string;

  beforeAll(async () => {
    // Create test user and supplier
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    
    const [user] = await db.insert(users).values({
      email: 'commissionsupplier@example.com',
      password: hashedPassword,
      firstName: 'Commission',
      lastName: 'Test',
      role: 'supplier',
      isActive: true
    }).returning();

    testUserId = user.id;

    const [supplier] = await db.insert(supplierProfiles).values({
      userId: user.id,
      businessName: 'Commission Test Business',
      businessType: 'manufacturer',
      storeName: 'Commission Test Store',
      storeSlug: 'commission-test-store',
      contactPerson: 'Test Contact',
      phone: '+1234567890',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      status: 'approved',
      isActive: true,
      commissionRate: '0.15' // 15% custom rate
    }).returning();

    testSupplierId = supplier.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testCommissionId) {
      await db.delete(commissions).where(eq(commissions.id, testCommissionId));
    }
    if (testSupplierId) {
      await db.delete(supplierProfiles).where(eq(supplierProfiles.id, testSupplierId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('Commission Rate Management', () => {
    it('should use custom commission rate when set', async () => {
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, testSupplierId))
        .limit(1);

      expect(supplier.commissionRate).toBe('0.15');
    });

    it('should calculate commission with custom rate', async () => {
      const orderAmount = 1000;
      const expectedCommission = orderAmount * 0.15; // 150
      const expectedSupplierAmount = orderAmount - expectedCommission; // 850

      const commission = await calculateCommission(
        'test-order-id',
        testSupplierId,
        orderAmount
      );

      testCommissionId = commission.id;

      expect(parseFloat(commission.commissionAmount)).toBe(expectedCommission);
      expect(parseFloat(commission.supplierAmount)).toBe(expectedSupplierAmount);
      expect(parseFloat(commission.commissionRate)).toBe(0.15);
    });
  });

  describe('Commission Calculations', () => {
    it('should calculate correct commission for various amounts', async () => {
      const testCases = [
        { amount: 100, rate: 0.15, expectedCommission: 15, expectedSupplier: 85 },
        { amount: 500, rate: 0.15, expectedCommission: 75, expectedSupplier: 425 },
        { amount: 1000, rate: 0.15, expectedCommission: 150, expectedSupplier: 850 },
        { amount: 5000, rate: 0.15, expectedCommission: 750, expectedSupplier: 4250 }
      ];

      for (const testCase of testCases) {
        const commission = await calculateCommission(
          `test-order-${testCase.amount}`,
          testSupplierId,
          testCase.amount
        );

        expect(parseFloat(commission.commissionAmount)).toBe(testCase.expectedCommission);
        expect(parseFloat(commission.supplierAmount)).toBe(testCase.expectedSupplier);

        // Clean up
        await db.delete(commissions).where(eq(commissions.id, commission.id));
      }
    });

    it('should handle decimal amounts correctly', async () => {
      const orderAmount = 123.45;
      const expectedCommission = 18.5175; // 123.45 * 0.15
      const expectedSupplierAmount = 104.9325; // 123.45 - 18.5175

      const commission = await calculateCommission(
        'test-decimal-order',
        testSupplierId,
        orderAmount
      );

      expect(parseFloat(commission.commissionAmount)).toBeCloseTo(expectedCommission, 2);
      expect(parseFloat(commission.supplierAmount)).toBeCloseTo(expectedSupplierAmount, 2);

      // Clean up
      await db.delete(commissions).where(eq(commissions.id, commission.id));
    });
  });

  describe('Commission Status Management', () => {
    it('should create commission with pending status', async () => {
      const commission = await calculateCommission(
        'test-status-order',
        testSupplierId,
        1000
      );

      expect(commission.status).toBe('pending');

      // Clean up
      await db.delete(commissions).where(eq(commissions.id, commission.id));
    });

    it('should update commission status to paid', async () => {
      const commission = await calculateCommission(
        'test-paid-order',
        testSupplierId,
        1000
      );

      const [updated] = await db.update(commissions)
        .set({ status: 'paid' })
        .where(eq(commissions.id, commission.id))
        .returning();

      expect(updated.status).toBe('paid');

      // Clean up
      await db.delete(commissions).where(eq(commissions.id, commission.id));
    });
  });

  describe('Payout Calculations', () => {
    it('should calculate correct payout amounts', async () => {
      // Create multiple paid commissions
      const commission1 = await calculateCommission('payout-order-1', testSupplierId, 1000);
      const commission2 = await calculateCommission('payout-order-2', testSupplierId, 500);

      await db.update(commissions)
        .set({ status: 'paid' })
        .where(eq(commissions.id, commission1.id));

      await db.update(commissions)
        .set({ status: 'paid' })
        .where(eq(commissions.id, commission2.id));

      // Calculate total supplier amount
      const totalSupplierAmount = 
        parseFloat(commission1.supplierAmount) + 
        parseFloat(commission2.supplierAmount);

      const totalCommissionAmount = 
        parseFloat(commission1.commissionAmount) + 
        parseFloat(commission2.commissionAmount);

      expect(totalSupplierAmount).toBe(1275); // (1000 - 150) + (500 - 75)
      expect(totalCommissionAmount).toBe(225); // 150 + 75

      // Clean up
      await db.delete(commissions).where(eq(commissions.id, commission1.id));
      await db.delete(commissions).where(eq(commissions.id, commission2.id));
    });
  });

  describe('Commission Rate Validation', () => {
    it('should handle zero commission rate', async () => {
      // Update supplier to have 0% commission
      await db.update(supplierProfiles)
        .set({ commissionRate: '0' })
        .where(eq(supplierProfiles.id, testSupplierId));

      const commission = await calculateCommission(
        'test-zero-commission',
        testSupplierId,
        1000
      );

      expect(parseFloat(commission.commissionAmount)).toBe(0);
      expect(parseFloat(commission.supplierAmount)).toBe(1000);

      // Clean up
      await db.delete(commissions).where(eq(commissions.id, commission.id));
      
      // Reset commission rate
      await db.update(supplierProfiles)
        .set({ commissionRate: '0.15' })
        .where(eq(supplierProfiles.id, testSupplierId));
    });

    it('should handle maximum commission rate', async () => {
      // Update supplier to have 50% commission
      await db.update(supplierProfiles)
        .set({ commissionRate: '0.5' })
        .where(eq(supplierProfiles.id, testSupplierId));

      const commission = await calculateCommission(
        'test-max-commission',
        testSupplierId,
        1000
      );

      expect(parseFloat(commission.commissionAmount)).toBe(500);
      expect(parseFloat(commission.supplierAmount)).toBe(500);

      // Clean up
      await db.delete(commissions).where(eq(commissions.id, commission.id));
      
      // Reset commission rate
      await db.update(supplierProfiles)
        .set({ commissionRate: '0.15' })
        .where(eq(supplierProfiles.id, testSupplierId));
    });
  });
});
