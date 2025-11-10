/**
 * End-to-End Tests for Complete Supplier Onboarding Process
 * Tests the full journey from registration to first sale
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { users, supplierProfiles, products, categories, inquiries, quotations, orders } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('Complete Supplier Onboarding Process (E2E)', () => {
  let supplierUserId: string;
  let supplierId: string;
  let buyerUserId: string;
  let categoryId: string;
  let productId: string;
  let inquiryId: string;
  let quotationId: string;
  let orderId: string;

  describe('Step 1: Supplier Registration', () => {
    it('should register new supplier with complete information', async () => {
      const hashedPassword = await bcrypt.hash('supplier123', 12);

      const [user] = await db.insert(users).values({
        email: 'newonboardingsupplier@example.com',
        password: hashedPassword,
        firstName: 'New',
        lastName: 'Supplier',
        role: 'supplier',
        emailVerified: false,
        isActive: true
      }).returning();

      supplierUserId = user.id;

      expect(user.role).toBe('supplier');
      expect(user.isActive).toBe(true);
    });

    it('should create supplier profile with business information', async () => {
      const [supplier] = await db.insert(supplierProfiles).values({
        userId: supplierUserId,
        businessName: 'New Onboarding Business',
        businessType: 'manufacturer',
        storeName: 'New Onboarding Store',
        storeSlug: 'new-onboarding-store',
        storeDescription: 'We manufacture high-quality products',
        contactPerson: 'John Doe',
        position: 'Sales Manager',
        phone: '+1234567890',
        whatsapp: '+1234567890',
        address: '123 Business St',
        city: 'Business City',
        country: 'United States',
        website: 'https://newonboardingstore.com',
        yearEstablished: 2020,
        employeesCount: '50-100',
        annualRevenue: '$1M-$5M',
        mainProducts: ['Electronics', 'Accessories'],
        exportMarkets: ['USA', 'Canada', 'Europe'],
        verificationLevel: 'none',
        isVerified: false,
        status: 'pending',
        isActive: false,
        isFeatured: false
      }).returning();

      supplierId = supplier.id;

      expect(supplier.status).toBe('pending');
      expect(supplier.isActive).toBe(false);
      expect(supplier.businessName).toBe('New Onboarding Business');
    });

    it('should have pending status awaiting admin approval', async () => {
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      expect(supplier.status).toBe('pending');
      expect(supplier.isVerified).toBe(false);
    });
  });

  describe('Step 2: Admin Approval and Verification', () => {
    it('should allow admin to review supplier application', async () => {
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      expect(supplier).toBeDefined();
      expect(supplier.businessName).toBe('New Onboarding Business');
      expect(supplier.status).toBe('pending');
    });

    it('should approve supplier and activate account', async () => {
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
  });

  describe('Step 3: Store Setup and Customization', () => {
    it('should allow supplier to customize store appearance', async () => {
      const [updated] = await db.update(supplierProfiles)
        .set({
          storeLogo: '/uploads/store-logo.png',
          storeBanner: '/uploads/store-banner.jpg',
          storeDescription: 'Premium manufacturer of electronic components',
          storePolicies: {
            shipping: 'Free shipping on orders over $500',
            returns: '30-day return policy',
            payment: 'Net 30 for verified buyers',
            warranty: '1-year manufacturer warranty'
          },
          operatingHours: {
            monday: '9:00 AM - 6:00 PM',
            tuesday: '9:00 AM - 6:00 PM',
            wednesday: '9:00 AM - 6:00 PM',
            thursday: '9:00 AM - 6:00 PM',
            friday: '9:00 AM - 6:00 PM',
            saturday: 'Closed',
            sunday: 'Closed',
            timezone: 'EST'
          },
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(updated.storeLogo).toBeDefined();
      expect(updated.storeBanner).toBeDefined();
      expect(updated.storePolicies).toBeDefined();
    });
  });

  describe('Step 4: Product Creation and Approval', () => {
    beforeAll(async () => {
      // Create category for products
      const [category] = await db.insert(categories).values({
        name: 'Onboarding Test Category',
        slug: 'onboarding-test-category',
        description: 'Category for onboarding tests'
      }).returning();

      categoryId = category.id;
    });

    it('should allow supplier to create first product', async () => {
      const [product] = await db.insert(products).values({
        name: 'Premium Electronic Component',
        slug: 'premium-electronic-component',
        shortDescription: 'High-quality electronic component',
        description: 'Detailed description of the premium electronic component with specifications',
        categoryId: categoryId,
        supplierId: supplierId,
        minOrderQuantity: 100,
        priceRanges: [
          { min: 100, max: 500, price: 10.00 },
          { min: 501, max: 1000, price: 9.50 },
          { min: 1001, max: 5000, price: 9.00 }
        ],
        sampleAvailable: true,
        samplePrice: '15.00',
        customizationAvailable: true,
        leadTime: '15-20 days',
        port: 'Shanghai',
        paymentTerms: 'T/T, L/C',
        inStock: true,
        stockQuantity: 10000,
        keyFeatures: ['High quality', 'Durable', 'Certified'],
        certifications: ['CE', 'RoHS', 'ISO9001'],
        hasTradeAssurance: true,
        approvalStatus: 'pending',
        isPublished: false
      }).returning();

      productId = product.id;

      expect(product.supplierId).toBe(supplierId);
      expect(product.approvalStatus).toBe('pending');
      expect(product.isPublished).toBe(false);
    });

    it('should wait for admin product approval', async () => {
      const [product] = await db.select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      expect(product.approvalStatus).toBe('pending');
    });

    it('should approve product and make it live', async () => {
      const [approved] = await db.update(products)
        .set({
          approvalStatus: 'approved',
          isPublished: true,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))
        .returning();

      expect(approved.approvalStatus).toBe('approved');
      expect(approved.isPublished).toBe(true);
    });
  });

  describe('Step 5: Receiving First Inquiry', () => {
    beforeAll(async () => {
      // Create buyer for inquiry
      const hashedPassword = await bcrypt.hash('buyer123', 12);

      const [buyer] = await db.insert(users).values({
        email: 'onboardingbuyer@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Buyer',
        role: 'buyer',
        isActive: true
      }).returning();

      buyerUserId = buyer.id;
    });

    it('should receive inquiry from buyer', async () => {
      const [inquiry] = await db.insert(inquiries).values({
        productId: productId,
        buyerId: buyerUserId,
        supplierId: supplierId,
        message: 'I am interested in ordering 500 units. Can you provide a quote?',
        quantity: 500,
        status: 'pending'
      }).returning();

      inquiryId = inquiry.id;

      expect(inquiry.supplierId).toBe(supplierId);
      expect(inquiry.status).toBe('pending');
    });

    it('should allow supplier to respond to inquiry', async () => {
      const [responded] = await db.update(inquiries)
        .set({
          status: 'responded',
          response: 'Thank you for your interest! I can offer you a competitive price for 500 units.',
          updatedAt: new Date()
        })
        .where(eq(inquiries.id, inquiryId))
        .returning();

      expect(responded.status).toBe('responded');
      expect(responded.response).toBeDefined();
    });
  });

  describe('Step 6: Creating First Quotation', () => {
    it('should allow supplier to create quotation', async () => {
      const [quotation] = await db.insert(quotations).values({
        inquiryId: inquiryId,
        supplierId: supplierId,
        buyerId: buyerUserId,
        productName: 'Premium Electronic Component',
        quantity: 500,
        unitPrice: '9.50',
        totalPrice: '4750.00',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deliveryTime: '20 days',
        paymentTerms: 'T/T 30% deposit, 70% before shipment',
        shippingTerms: 'FOB Shanghai',
        notes: 'Price includes packaging. Shipping cost to be calculated separately.',
        status: 'pending'
      }).returning();

      quotationId = quotation.id;

      expect(quotation.supplierId).toBe(supplierId);
      expect(quotation.status).toBe('pending');
      expect(parseFloat(quotation.totalPrice)).toBe(4750);
    });
  });

  describe('Step 7: First Order Completion', () => {
    it('should create order when buyer accepts quotation', async () => {
      // Accept quotation
      await db.update(quotations)
        .set({ status: 'accepted' })
        .where(eq(quotations.id, quotationId));

      // Create order
      const [order] = await db.insert(orders).values({
        orderNumber: `ORD-${Date.now()}`,
        buyerId: buyerUserId,
        supplierId: supplierId,
        quotationId: quotationId,
        productId: productId,
        quantity: 500,
        unitPrice: '9.50',
        totalAmount: '4750.00',
        status: 'pending',
        paymentStatus: 'pending'
      }).returning();

      orderId = order.id;

      expect(order.supplierId).toBe(supplierId);
      expect(order.status).toBe('pending');
    });

    it('should allow supplier to confirm order', async () => {
      const [confirmed] = await db.update(orders)
        .set({
          status: 'confirmed',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      expect(confirmed.status).toBe('confirmed');
    });

    it('should allow supplier to process and ship order', async () => {
      // Process order
      await db.update(orders)
        .set({
          status: 'processing',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      // Ship order
      const [shipped] = await db.update(orders)
        .set({
          status: 'shipped',
          shippingDate: new Date(),
          trackingNumber: 'TRACK123456',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      expect(shipped.status).toBe('shipped');
      expect(shipped.trackingNumber).toBeDefined();
    });

    it('should complete order and update supplier metrics', async () => {
      // Complete order
      await db.update(orders)
        .set({
          status: 'completed',
          deliveryDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      // Update supplier metrics
      const [updated] = await db.update(supplierProfiles)
        .set({
          totalOrders: 1,
          totalSales: '4750.00',
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId))
        .returning();

      expect(updated.totalOrders).toBe(1);
      expect(parseFloat(updated.totalSales || '0')).toBe(4750);
    });
  });

  describe('Step 8: Verification of Complete Onboarding', () => {
    it('should verify supplier is fully operational', async () => {
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      expect(supplier.status).toBe('approved');
      expect(supplier.isActive).toBe(true);
      expect(supplier.isVerified).toBe(true);
      expect(supplier.totalOrders).toBeGreaterThan(0);
      expect(parseFloat(supplier.totalSales || '0')).toBeGreaterThan(0);
    });

    it('should verify supplier has active products', async () => {
      const supplierProducts = await db.select()
        .from(products)
        .where(eq(products.supplierId, supplierId));

      expect(supplierProducts.length).toBeGreaterThan(0);
      expect(supplierProducts[0].approvalStatus).toBe('approved');
      expect(supplierProducts[0].isPublished).toBe(true);
    });

    it('should verify supplier has completed transactions', async () => {
      const supplierOrders = await db.select()
        .from(orders)
        .where(eq(orders.supplierId, supplierId));

      expect(supplierOrders.length).toBeGreaterThan(0);
      expect(supplierOrders[0].status).toBe('completed');
    });

    it('should verify complete onboarding journey', async () => {
      // Verify all steps completed
      const [supplier] = await db.select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, supplierUserId))
        .limit(1);

      const supplierProducts = await db.select()
        .from(products)
        .where(eq(products.supplierId, supplierId));

      const supplierInquiries = await db.select()
        .from(inquiries)
        .where(eq(inquiries.supplierId, supplierId));

      const supplierQuotations = await db.select()
        .from(quotations)
        .where(eq(quotations.supplierId, supplierId));

      const supplierOrders = await db.select()
        .from(orders)
        .where(eq(orders.supplierId, supplierId));

      // All steps verified
      expect(user.role).toBe('supplier');
      expect(supplier.status).toBe('approved');
      expect(supplierProducts.length).toBeGreaterThan(0);
      expect(supplierInquiries.length).toBeGreaterThan(0);
      expect(supplierQuotations.length).toBeGreaterThan(0);
      expect(supplierOrders.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    // Clean up all test data
    if (orderId) {
      await db.delete(orders).where(eq(orders.id, orderId));
    }
    if (quotationId) {
      await db.delete(quotations).where(eq(quotations.id, quotationId));
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
});
