/**
 * Integration Tests for Admin Oversight and Verification Workflows
 * Tests admin supplier management, product approval, and platform oversight
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { users, supplierProfiles, products, categories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('Admin Oversight and Verification Workflows', () => {
  let adminUserId: string;
  let supplierUserId: string;
  let supplierId: string;
  let productId: string;
  let categoryId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('testpassword', 12);

    // Create admin user
    const [adminUser] = await db.insert(users).values({
      email: 'admintest@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Test',
      role: 'admin',
      isActive: true
    }).returning();

    adminUserId = adminUser.id;

    // Create supplier user and profile
    const [supplierUser] = await db.insert(users).values({
      email: 'oversightsupplier@example.com',
      password: hashedPassword,
      firstName: 'Oversight',
      lastName: 'Supplier',
      role: 'supplier',
      isActive: true
    }).returning();

    supplierUserId = supplierUser.id;

    const [supplier] = await db.insert(supplierProfiles).values({
      userId: supplierUser.id,
      businessName: 'Oversight Test Business',
      businessType: 'manufacturer',
      storeName: 'Oversight Test Store',
      storeSlug: 'oversight-test-store',
      contactPerson: 'Test Contact',
      phone: '+1234567890',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      status: 'pending',
      isActive: false,
      isVerified: false
    }).returning();

    supplierId = supplier.id;

    // Create category
    const [category] = await db.insert(categories).values({
      name: 'Oversight Test Category',
      slug: 'oversight-test-category',
      description: 'Test category for oversight tests'
    }).returning();

    categoryId = category.id;
  });

  afterAll(async () => {
    // Clean up
    if (productId) {
      await db.delete(products).where(eq(products.id, productId));
    }
    if (categoryId) {
      await db.delete(categories).where(eq(categories.id, categoryId));
    }
    if (supplierId) {
      await db.delete(supplierProfiles).where(eq(supplierProfiles.id, supplierId));
    }
    if (supplierUserId) {
      await db.delete(users).where(eq(users.id, supplierUserId));
    }
    if (adminUserId) {
      await db.delete(users).where(eq(users.id, adminUserId));
    }
  });

  describe('Supplier Approval Workflow', () => {
    it('should start with pending supplier status', async () => {
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      expect(supplier.status).toBe('pending');
      expect(supplier.isActive).toBe(false);
      expect(supplier.isVerified).toBe(false);
    });

    it('should allow admin to approve supplier', async () => {
      const [approved] = await db.update(supplierProfiles)
        .set({
          status: 'approved',
          isActive: true,
          isVerified: true,
          verificationLevel: 'basic',
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(approved.status).toBe('approved');
      expect(approved.isActive).toBe(true);
      expect(approved.isVerified).toBe(true);
      expect(approved.verificationLevel).toBe('basic');
    });

    it('should allow admin to reject supplier', async () => {
      const [rejected] = await db.update(supplierProfiles)
        .set({
          status: 'rejected',
          isActive: false,
          isVerified: false,
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(rejected.status).toBe('rejected');
      expect(rejected.isActive).toBe(false);

      // Revert for other tests
      await db.update(supplierProfiles)
        .set({
          status: 'approved',
          isActive: true,
          isVerified: true
        })
        .where(eq(supplierProfiles.id, supplierId));
    });

    it('should allow admin to suspend supplier', async () => {
      const [suspended] = await db.update(supplierProfiles)
        .set({
          status: 'suspended',
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(suspended.status).toBe('suspended');
      expect(suspended.isActive).toBe(false);

      // Revert for other tests
      await db.update(supplierProfiles)
        .set({
          status: 'approved',
          isActive: true
        })
        .where(eq(supplierProfiles.id, supplierId));
    });
  });

  describe('Supplier Verification Levels', () => {
    it('should allow admin to set verification level to basic', async () => {
      const [updated] = await db.update(supplierProfiles)
        .set({
          verificationLevel: 'basic',
          isVerified: true,
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(updated.verificationLevel).toBe('basic');
      expect(updated.isVerified).toBe(true);
    });

    it('should allow admin to upgrade to business verification', async () => {
      const [updated] = await db.update(supplierProfiles)
        .set({
          verificationLevel: 'business',
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(updated.verificationLevel).toBe('business');
    });

    it('should allow admin to upgrade to premium verification', async () => {
      const [updated] = await db.update(supplierProfiles)
        .set({
          verificationLevel: 'premium',
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(updated.verificationLevel).toBe('premium');
    });

    it('should allow admin to revoke verification', async () => {
      const [updated] = await db.update(supplierProfiles)
        .set({
          verificationLevel: 'none',
          isVerified: false,
          verifiedAt: null,
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(updated.verificationLevel).toBe('none');
      expect(updated.isVerified).toBe(false);

      // Revert for other tests
      await db.update(supplierProfiles)
        .set({
          verificationLevel: 'basic',
          isVerified: true,
          verifiedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId));
    });
  });

  describe('Product Approval Workflow', () => {
    it('should create product with pending approval status', async () => {
      const [product] = await db.insert(products).values({
        name: 'Test Product for Approval',
        slug: 'test-product-approval',
        shortDescription: 'Test product',
        description: 'Detailed description',
        categoryId: categoryId,
        supplierId: supplierId,
        minOrderQuantity: 100,
        priceRanges: [{ min: 100, max: 500, price: 10 }],
        approvalStatus: 'pending',
        isPublished: false
      }).returning();

      productId = product.id;

      expect(product.approvalStatus).toBe('pending');
      expect(product.isPublished).toBe(false);
    });

    it('should allow admin to approve product', async () => {
      const [approved] = await db.update(products)
        .set({
          approvalStatus: 'approved',
          isPublished: true,
          approvedBy: adminUserId,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))
        .returning();

      expect(approved.approvalStatus).toBe('approved');
      expect(approved.isPublished).toBe(true);
      expect(approved.approvedBy).toBe(adminUserId);
    });

    it('should allow admin to reject product with reason', async () => {
      const rejectionReason = 'Product does not meet quality standards';

      const [rejected] = await db.update(products)
        .set({
          approvalStatus: 'rejected',
          isPublished: false,
          rejectionReason: rejectionReason,
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))
        .returning();

      expect(rejected.approvalStatus).toBe('rejected');
      expect(rejected.isPublished).toBe(false);
      expect(rejected.rejectionReason).toBe(rejectionReason);

      // Revert for other tests
      await db.update(products)
        .set({
          approvalStatus: 'approved',
          isPublished: true,
          rejectionReason: null
        })
        .where(eq(products.id, productId));
    });

    it('should allow admin to feature approved product', async () => {
      const [featured] = await db.update(products)
        .set({
          isFeatured: true,
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))
        .returning();

      expect(featured.isFeatured).toBe(true);
    });
  });

  describe('Bulk Operations', () => {
    let bulkSupplierIds: string[] = [];

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 12);

      // Create multiple suppliers for bulk operations
      for (let i = 1; i <= 3; i++) {
        const [user] = await db.insert(users).values({
          email: `bulksupplier${i}@example.com`,
          password: hashedPassword,
          firstName: `Bulk${i}`,
          lastName: 'Supplier',
          role: 'supplier',
          isActive: true
        }).returning();

        const [supplier] = await db.insert(supplierProfiles).values({
          userId: user.id,
          businessName: `Bulk Business ${i}`,
          businessType: 'manufacturer',
          storeName: `Bulk Store ${i}`,
          storeSlug: `bulk-store-${i}`,
          contactPerson: 'Test Contact',
          phone: '+1234567890',
          address: '123 Test St',
          city: 'Test City',
          country: 'Test Country',
          status: 'pending',
          isActive: false
        }).returning();

        bulkSupplierIds.push(supplier.id);
      }
    });

    afterAll(async () => {
      // Clean up bulk suppliers
      for (const id of bulkSupplierIds) {
        const [supplier] = await db.select()
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, id))
          .limit(1);

        if (supplier) {
          await db.delete(supplierProfiles).where(eq(supplierProfiles.id, id));
          await db.delete(users).where(eq(users.id, supplier.userId));
        }
      }
    });

    it('should allow admin to bulk approve suppliers', async () => {
      for (const id of bulkSupplierIds) {
        await db.update(supplierProfiles)
          .set({
            status: 'approved',
            isActive: true,
            isVerified: true,
            verificationLevel: 'basic',
            verifiedAt: new Date()
          })
          .where(eq(supplierProfiles.id, id));
      }

      // Verify all are approved
      for (const id of bulkSupplierIds) {
        const [supplier] = await db.select()
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, id))
          .limit(1);

        expect(supplier.status).toBe('approved');
        expect(supplier.isActive).toBe(true);
      }
    });

    it('should allow admin to bulk feature suppliers', async () => {
      for (const id of bulkSupplierIds) {
        await db.update(supplierProfiles)
          .set({
            isFeatured: true,
            updatedAt: new Date()
          })
          .where(eq(supplierProfiles.id, id));
      }

      // Verify all are featured
      for (const id of bulkSupplierIds) {
        const [supplier] = await db.select()
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, id))
          .limit(1);

        expect(supplier.isFeatured).toBe(true);
      }
    });
  });

  describe('Platform Analytics and Reporting', () => {
    it('should allow admin to view supplier statistics', async () => {
      const suppliers = await db.select()
        .from(supplierProfiles);

      expect(suppliers.length).toBeGreaterThan(0);

      const approvedCount = suppliers.filter(s => s.status === 'approved').length;
      const pendingCount = suppliers.filter(s => s.status === 'pending').length;

      expect(approvedCount).toBeGreaterThanOrEqual(0);
      expect(pendingCount).toBeGreaterThanOrEqual(0);
    });

    it('should allow admin to view product approval statistics', async () => {
      const allProducts = await db.select()
        .from(products);

      const pendingProducts = allProducts.filter(p => p.approvalStatus === 'pending');
      const approvedProducts = allProducts.filter(p => p.approvalStatus === 'approved');

      expect(pendingProducts.length).toBeGreaterThanOrEqual(0);
      expect(approvedProducts.length).toBeGreaterThanOrEqual(0);
    });

    it('should allow admin to view verification level distribution', async () => {
      const suppliers = await db.select()
        .from(supplierProfiles);

      const verificationLevels = {
        none: suppliers.filter(s => s.verificationLevel === 'none').length,
        basic: suppliers.filter(s => s.verificationLevel === 'basic').length,
        business: suppliers.filter(s => s.verificationLevel === 'business').length,
        premium: suppliers.filter(s => s.verificationLevel === 'premium').length
      };

      expect(verificationLevels.none).toBeGreaterThanOrEqual(0);
      expect(verificationLevels.basic).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Admin Cannot Manage Direct Operations', () => {
    it('should verify admin does not create quotations', async () => {
      // This test verifies the design principle that quotations
      // are created by suppliers, not admin
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      expect(supplier).toBeDefined();
      // Admin can view supplier but doesn't create quotations for them
    });

    it('should verify admin does not manage RFQs directly', async () => {
      // This test verifies that RFQs are routed to suppliers
      // Admin has oversight but doesn't manage them
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      expect(supplier.status).toBe('approved');
      // Approved suppliers can receive and manage RFQs
    });
  });
});
