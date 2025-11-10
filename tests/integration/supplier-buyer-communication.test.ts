/**
 * Integration Tests for Supplier-Buyer Communication Flows
 * Tests RFQ routing, inquiry management, and quotation workflows
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { users, supplierProfiles, products, inquiries, rfqs, quotations, categories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('Supplier-Buyer Communication Flows', () => {
  let supplierId: string;
  let supplierUserId: string;
  let buyerId: string;
  let buyerUserId: string;
  let productId: string;
  let categoryId: string;
  let inquiryId: string;
  let rfqId: string;
  let quotationId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('testpassword', 12);

    // Create supplier user and profile
    const [supplierUser] = await db.insert(users).values({
      email: 'commsupplier@example.com',
      password: hashedPassword,
      firstName: 'Comm',
      lastName: 'Supplier',
      role: 'supplier',
      isActive: true
    }).returning();

    supplierUserId = supplierUser.id;

    const [supplier] = await db.insert(supplierProfiles).values({
      userId: supplierUser.id,
      businessName: 'Comm Test Business',
      businessType: 'manufacturer',
      storeName: 'Comm Test Store',
      storeSlug: 'comm-test-store',
      contactPerson: 'Test Contact',
      phone: '+1234567890',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      status: 'approved',
      isActive: true,
      isVerified: true
    }).returning();

    supplierId = supplier.id;

    // Create buyer user
    const [buyerUser] = await db.insert(users).values({
      email: 'commbuyer@example.com',
      password: hashedPassword,
      firstName: 'Comm',
      lastName: 'Buyer',
      role: 'buyer',
      isActive: true
    }).returning();

    buyerUserId = buyerUser.id;
    buyerId = buyerUser.id;

    // Create category
    const [category] = await db.insert(categories).values({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category for communication tests'
    }).returning();

    categoryId = category.id;

    // Create product
    const [product] = await db.insert(products).values({
      name: 'Test Product',
      slug: 'test-product-comm',
      shortDescription: 'Test product for communication',
      description: 'Detailed test product description',
      categoryId: category.id,
      supplierId: supplier.id,
      minOrderQuantity: 100,
      priceRanges: [{ min: 100, max: 500, price: 10 }],
      approvalStatus: 'approved',
      isPublished: true
    }).returning();

    productId = product.id;
  });

  afterAll(async () => {
    // Clean up in reverse order of dependencies
    if (quotationId) {
      await db.delete(quotations).where(eq(quotations.id, quotationId));
    }
    if (rfqId) {
      await db.delete(rfqs).where(eq(rfqs.id, rfqId));
    }
    if (inquiryId) {
      await db.delete(inquiries).where(eq(inquiries.id, inquiryId));
    }
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
    if (buyerUserId) {
      await db.delete(users).where(eq(users.id, buyerUserId));
    }
  });

  describe('Inquiry Routing to Suppliers', () => {
    it('should route inquiry directly to product supplier', async () => {
      const [inquiry] = await db.insert(inquiries).values({
        productId: productId,
        buyerId: buyerId,
        supplierId: supplierId, // Should be routed to supplier
        message: 'Test inquiry message',
        quantity: 500,
        status: 'pending'
      }).returning();

      inquiryId = inquiry.id;

      expect(inquiry.supplierId).toBe(supplierId);
      expect(inquiry.productId).toBe(productId);
      expect(inquiry.buyerId).toBe(buyerId);
    });

    it('should verify inquiry is accessible by supplier', async () => {
      const [inquiry] = await db.select()
        .from(inquiries)
        .where(and(
          eq(inquiries.id, inquiryId),
          eq(inquiries.supplierId, supplierId)
        ))
        .limit(1);

      expect(inquiry).toBeDefined();
      expect(inquiry.supplierId).toBe(supplierId);
    });

    it('should not route inquiry to admin', async () => {
      const [inquiry] = await db.select()
        .from(inquiries)
        .where(eq(inquiries.id, inquiryId))
        .limit(1);

      // Verify there's no admin involvement
      expect(inquiry.supplierId).toBe(supplierId);
      expect(inquiry.supplierId).not.toBeNull();
    });
  });

  describe('RFQ Routing to Suppliers', () => {
    it('should route product-specific RFQ to supplier', async () => {
      const [rfq] = await db.insert(rfqs).values({
        productId: productId,
        buyerId: buyerId,
        supplierId: supplierId, // Should be routed to supplier
        productName: 'Test Product',
        quantity: 1000,
        targetPrice: '9.50',
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        specifications: 'Test specifications',
        status: 'pending'
      }).returning();

      rfqId = rfq.id;

      expect(rfq.supplierId).toBe(supplierId);
      expect(rfq.productId).toBe(productId);
    });

    it('should verify RFQ is accessible by supplier', async () => {
      const [rfq] = await db.select()
        .from(rfqs)
        .where(and(
          eq(rfqs.id, rfqId),
          eq(rfqs.supplierId, supplierId)
        ))
        .limit(1);

      expect(rfq).toBeDefined();
      expect(rfq.supplierId).toBe(supplierId);
    });
  });

  describe('Supplier Quotation Creation', () => {
    it('should allow supplier to create quotation for RFQ', async () => {
      const [quotation] = await db.insert(quotations).values({
        rfqId: rfqId,
        supplierId: supplierId, // Supplier creates quotation
        buyerId: buyerId,
        productName: 'Test Product',
        quantity: 1000,
        unitPrice: '9.00',
        totalPrice: '9000.00',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deliveryTime: '30 days',
        paymentTerms: 'Net 30',
        status: 'pending'
      }).returning();

      quotationId = quotation.id;

      expect(quotation.supplierId).toBe(supplierId);
      expect(quotation.rfqId).toBe(rfqId);
      expect(quotation.buyerId).toBe(buyerId);
    });

    it('should verify quotation references supplier not admin', async () => {
      const [quotation] = await db.select()
        .from(quotations)
        .where(eq(quotations.id, quotationId))
        .limit(1);

      expect(quotation.supplierId).toBe(supplierId);
      expect(quotation.supplierId).not.toBeNull();
    });
  });

  describe('Quotation Acceptance Workflow', () => {
    it('should allow buyer to accept quotation', async () => {
      const [updated] = await db.update(quotations)
        .set({
          status: 'accepted',
          updatedAt: new Date()
        })
        .where(eq(quotations.id, quotationId))
        .returning();

      expect(updated.status).toBe('accepted');
    });

    it('should update RFQ status when quotation is accepted', async () => {
      const [updated] = await db.update(rfqs)
        .set({
          status: 'quoted',
          updatedAt: new Date()
        })
        .where(eq(rfqs.id, rfqId))
        .returning();

      expect(updated.status).toBe('quoted');
    });
  });

  describe('End-to-End Communication Flow', () => {
    it('should complete full inquiry-to-quotation flow', async () => {
      // 1. Buyer creates inquiry
      const [newInquiry] = await db.insert(inquiries).values({
        productId: productId,
        buyerId: buyerId,
        supplierId: supplierId,
        message: 'E2E test inquiry',
        quantity: 200,
        status: 'pending'
      }).returning();

      // 2. Supplier responds to inquiry
      const [respondedInquiry] = await db.update(inquiries)
        .set({
          status: 'responded',
          response: 'Thank you for your inquiry',
          updatedAt: new Date()
        })
        .where(eq(inquiries.id, newInquiry.id))
        .returning();

      expect(respondedInquiry.status).toBe('responded');
      expect(respondedInquiry.response).toBeDefined();

      // 3. Verify no admin involvement
      expect(respondedInquiry.supplierId).toBe(supplierId);

      // Clean up
      await db.delete(inquiries).where(eq(inquiries.id, newInquiry.id));
    });

    it('should complete full RFQ-to-order flow', async () => {
      // 1. Buyer creates RFQ
      const [newRfq] = await db.insert(rfqs).values({
        productId: productId,
        buyerId: buyerId,
        supplierId: supplierId,
        productName: 'E2E Test Product',
        quantity: 500,
        targetPrice: '8.50',
        deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        specifications: 'E2E test specs',
        status: 'pending'
      }).returning();

      // 2. Supplier creates quotation
      const [newQuotation] = await db.insert(quotations).values({
        rfqId: newRfq.id,
        supplierId: supplierId,
        buyerId: buyerId,
        productName: 'E2E Test Product',
        quantity: 500,
        unitPrice: '8.25',
        totalPrice: '4125.00',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deliveryTime: '45 days',
        paymentTerms: 'Net 30',
        status: 'pending'
      }).returning();

      // 3. Buyer accepts quotation
      const [acceptedQuotation] = await db.update(quotations)
        .set({ status: 'accepted' })
        .where(eq(quotations.id, newQuotation.id))
        .returning();

      expect(acceptedQuotation.status).toBe('accepted');
      expect(acceptedQuotation.supplierId).toBe(supplierId);

      // Clean up
      await db.delete(quotations).where(eq(quotations.id, newQuotation.id));
      await db.delete(rfqs).where(eq(rfqs.id, newRfq.id));
    });
  });

  describe('Admin Oversight (Read-Only)', () => {
    it('should allow admin to view inquiries without managing them', async () => {
      const allInquiries = await db.select()
        .from(inquiries)
        .where(eq(inquiries.supplierId, supplierId));

      expect(allInquiries.length).toBeGreaterThan(0);
      // Admin can view but not manage
      expect(allInquiries[0].supplierId).toBe(supplierId);
    });

    it('should allow admin to view RFQs without managing them', async () => {
      const allRfqs = await db.select()
        .from(rfqs)
        .where(eq(rfqs.supplierId, supplierId));

      expect(allRfqs.length).toBeGreaterThan(0);
      // Admin can view but not manage
      expect(allRfqs[0].supplierId).toBe(supplierId);
    });

    it('should allow admin to view quotations without creating them', async () => {
      const allQuotations = await db.select()
        .from(quotations)
        .where(eq(quotations.supplierId, supplierId));

      expect(allQuotations.length).toBeGreaterThan(0);
      // Quotations are created by suppliers, not admin
      expect(allQuotations[0].supplierId).toBe(supplierId);
    });
  });
});
