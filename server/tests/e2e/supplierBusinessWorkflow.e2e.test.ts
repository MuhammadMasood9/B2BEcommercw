import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes';
import { db } from '../../db';

// Mock database for e2e tests
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}));

// Mock notification service
vi.mock('../../notificationService', () => ({
  notificationService: {
    createNotification: vi.fn(),
    sendRealTimeNotification: vi.fn(),
  }
}));

// Mock auth middleware for testing
const mockAuthMiddleware = (role: string, userId: string = 'test-user-id') => (req: any, _res: any, next: any) => {
  req.user = { id: userId, role, email: `${role}@test.com` };
  next();
};

describe('Supplier Business Workflow End-to-End Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      if (req.path.includes('/supplier/')) {
        return mockAuthMiddleware('supplier', 'supplier-user-123')(req, res, next);
      }
      if (req.path.includes('/buyer/')) {
        return mockAuthMiddleware('buyer', 'buyer-user-123')(req, res, next);
      }
      if (req.path.includes('/admin/')) {
        return mockAuthMiddleware('admin', 'admin-user-123')(req, res, next);
      }
      next();
    });

    // Register routes
    registerRoutes(app);
    
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete RFQ Response Workflow', () => {
    it('should complete full RFQ discovery to quotation creation workflow', async () => {
      // Mock supplier profile
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-123',
        companyName: 'Tech Supplier Inc',
        verificationStatus: 'verified',
      };

      // Mock available RFQs
      const mockRFQs = {
        rfqs: [
          {
            id: 'rfq-1',
            title: 'Electronic Components RFQ',
            description: 'Need 1000 units of electronic components',
            quantity: 1000,
            targetPrice: '15.00',
            status: 'open',
            hasQuoted: false,
            buyer: {
              id: 'buyer-123',
              companyName: 'Test Buyer Company',
            },
            category: {
              name: 'Electronics',
            },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      // Mock RFQ details
      const mockRFQDetails = {
        id: 'rfq-1',
        title: 'Electronic Components RFQ',
        description: 'Need 1000 units of electronic components',
        specifications: {
          voltage: '5V',
          current: '2A',
          material: 'Silicon',
        },
        quantity: 1000,
        targetPrice: '15.00',
        deliveryLocation: 'New York, USA',
        requiredDeliveryDate: '2024-12-31',
        buyer: {
          companyName: 'Test Buyer Company',
          industry: 'Technology',
        },
        hasQuoted: false,
        quotationCount: 2,
      };

      // Mock quotation creation
      const mockQuotation = {
        id: 'quotation-123',
        rfqId: 'rfq-1',
        supplierId: 'supplier-123',
        unitPrice: '14.50',
        totalPrice: '14500.00',
        moq: 100,
        leadTime: '15-20 days',
        paymentTerms: '30 days net',
        validityPeriod: 30,
        status: 'sent',
        createdAt: new Date().toISOString(),
      };

      // Setup database mocks
      (db.select as any)
        // Mock supplier profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock available RFQs
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue(mockRFQs.rfqs.map(rfq => ({
                          rfq,
                          buyer: rfq.buyer,
                          category: rfq.category,
                          hasQuoted: rfq.hasQuoted,
                        }))),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock RFQ count for pagination
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue([{ count: 1 }]),
                }),
              }),
            }),
          }),
        })
        // Mock RFQ details
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                innerJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                      rfq: mockRFQDetails,
                      category: { name: 'Electronics' },
                      buyer: mockRFQDetails.buyer,
                      user: { email: 'buyer@test.com' },
                    }]),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock existing quotation check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Mock quotation count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 2 }]),
          }),
        });

      // Mock quotation creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      });

      // Step 1: Get available RFQs
      const rfqsResponse = await request(app)
        .get('/api/supplier/rfqs')
        .query({
          category: 'Electronics',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(rfqsResponse.body.success).toBe(true);
      expect(rfqsResponse.body.rfqs).toHaveLength(1);
      expect(rfqsResponse.body.rfqs[0].title).toBe('Electronic Components RFQ');
      expect(rfqsResponse.body.rfqs[0].hasQuoted).toBe(false);

      // Step 2: Get detailed RFQ information
      const rfqDetailsResponse = await request(app)
        .get('/api/supplier/rfqs/rfq-1')
        .expect(200);

      expect(rfqDetailsResponse.body.success).toBe(true);
      expect(rfqDetailsResponse.body.rfq.title).toBe('Electronic Components RFQ');
      expect(rfqDetailsResponse.body.rfq.hasQuoted).toBe(false);
      expect(rfqDetailsResponse.body.rfq.quotationCount).toBe(2);

      // Step 3: Create quotation for RFQ
      const quotationData = {
        rfqId: 'rfq-1',
        unitPrice: '14.50',
        totalPrice: '14500.00',
        moq: 100,
        leadTime: '15-20 days',
        paymentTerms: '30 days net',
        validityPeriod: 30,
        termsConditions: 'Standard terms and conditions apply',
      };

      const createQuotationResponse = await request(app)
        .post('/api/supplier/quotations')
        .send(quotationData)
        .expect(201);

      expect(createQuotationResponse.body.success).toBe(true);
      expect(createQuotationResponse.body.quotation.unitPrice).toBe('14.50');
      expect(createQuotationResponse.body.quotation.status).toBe('sent');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(6);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Inquiry Management Workflow', () => {
    it('should complete full inquiry response to quotation creation workflow', async () => {
      // Mock supplier profile
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-123',
        companyName: 'Tech Supplier Inc',
      };

      // Mock received inquiries
      const mockInquiries = [
        {
          id: 'inquiry-1',
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
          productId: 'product-1',
          subject: 'Bulk Pricing Inquiry',
          message: 'What are your bulk pricing options for 5000+ units?',
          quantity: 5000,
          status: 'pending',
          buyer: {
            companyName: 'Test Buyer Company',
          },
          product: {
            name: 'Electronic Component A',
          },
          createdAt: new Date().toISOString(),
        },
      ];

      // Mock inquiry response
      const mockInquiryResponse = {
        id: 'response-123',
        inquiryId: 'inquiry-1',
        supplierId: 'supplier-123',
        message: 'For 5000+ units, we can offer $12.50 per unit with 10-day lead time.',
        attachments: [],
        createdAt: new Date().toISOString(),
      };

      // Mock quotation from inquiry
      const mockQuotation = {
        id: 'quotation-456',
        inquiryId: 'inquiry-1',
        supplierId: 'supplier-123',
        unitPrice: '12.50',
        totalPrice: '62500.00',
        moq: 1000,
        leadTime: '10 days',
        status: 'sent',
      };

      // Setup database mocks
      (db.select as any)
        // Mock supplier profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock inquiries retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(mockInquiries.map(inquiry => ({
                        inquiry,
                        buyer: inquiry.buyer,
                        product: inquiry.product,
                      }))),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock inquiry count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        })
        // Mock inquiry details
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    inquiry: mockInquiries[0],
                    buyer: mockInquiries[0].buyer,
                    product: mockInquiries[0].product,
                  }]),
                }),
              }),
            }),
          }),
        });

      // Mock inquiry response and quotation creation
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockInquiryResponse]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockQuotation]),
          }),
        });

      // Mock inquiry status update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockInquiries[0], status: 'responded' }]),
          }),
        }),
      });

      // Step 1: Get received inquiries
      const inquiriesResponse = await request(app)
        .get('/api/supplier/inquiries')
        .query({
          status: 'pending',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(inquiriesResponse.body.success).toBe(true);
      expect(inquiriesResponse.body.inquiries).toHaveLength(1);
      expect(inquiriesResponse.body.inquiries[0].subject).toBe('Bulk Pricing Inquiry');
      expect(inquiriesResponse.body.inquiries[0].status).toBe('pending');

      // Step 2: Get inquiry details
      const inquiryDetailsResponse = await request(app)
        .get('/api/supplier/inquiries/inquiry-1')
        .expect(200);

      expect(inquiryDetailsResponse.body.success).toBe(true);
      expect(inquiryDetailsResponse.body.inquiry.quantity).toBe(5000);

      // Step 3: Respond to inquiry
      const responseData = {
        message: 'For 5000+ units, we can offer $12.50 per unit with 10-day lead time.',
        attachments: [],
      };

      const respondToInquiryResponse = await request(app)
        .post('/api/supplier/inquiries/inquiry-1/respond')
        .send(responseData)
        .expect(201);

      expect(respondToInquiryResponse.body.success).toBe(true);
      expect(respondToInquiryResponse.body.response.message).toContain('$12.50 per unit');

      // Step 4: Create quotation from inquiry
      const quotationData = {
        inquiryId: 'inquiry-1',
        unitPrice: '12.50',
        totalPrice: '62500.00',
        moq: 1000,
        leadTime: '10 days',
        paymentTerms: '30 days net',
      };

      const createQuotationResponse = await request(app)
        .post('/api/supplier/quotations')
        .send(quotationData)
        .expect(201);

      expect(createQuotationResponse.body.success).toBe(true);
      expect(createQuotationResponse.body.quotation.unitPrice).toBe('12.50');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(4);
      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Order Management Workflow', () => {
    it('should complete full order processing and fulfillment workflow', async () => {
      // Mock supplier profile
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-123',
        companyName: 'Tech Supplier Inc',
      };

      // Mock received orders
      const mockOrders = [
        {
          id: 'order-1',
          buyerId: 'buyer-123',
          supplierId: 'supplier-123',
          quotationId: 'quotation-123',
          totalAmount: '14500.00',
          status: 'pending',
          paymentStatus: 'pending',
          buyer: {
            companyName: 'Test Buyer Company',
          },
          quotation: {
            unitPrice: '14.50',
            quantity: 1000,
          },
          createdAt: new Date().toISOString(),
        },
      ];

      // Mock order details
      const mockOrderDetails = {
        id: 'order-1',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        quotationId: 'quotation-123',
        totalAmount: '14500.00',
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: {
          street: '123 Business St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
        buyer: {
          companyName: 'Test Buyer Company',
          email: 'buyer@test.com',
        },
        quotation: {
          unitPrice: '14.50',
          quantity: 1000,
          leadTime: '15-20 days',
        },
      };

      // Setup database mocks
      (db.select as any)
        // Mock supplier profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock orders retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(mockOrders.map(order => ({
                        order,
                        buyer: order.buyer,
                        quotation: order.quotation,
                      }))),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock order count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 1 }]),
              }),
            }),
          }),
        })
        // Mock order details
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    order: mockOrderDetails,
                    buyer: mockOrderDetails.buyer,
                    quotation: mockOrderDetails.quotation,
                  }]),
                }),
              }),
            }),
          }),
        });

      // Mock order status update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockOrderDetails, status: 'confirmed' }]),
          }),
        }),
      });

      // Step 1: Get received orders
      const ordersResponse = await request(app)
        .get('/api/supplier/orders')
        .query({
          status: 'pending',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(ordersResponse.body.success).toBe(true);
      expect(ordersResponse.body.orders).toHaveLength(1);
      expect(ordersResponse.body.orders[0].status).toBe('pending');
      expect(ordersResponse.body.orders[0].totalAmount).toBe('14500.00');

      // Step 2: Get order details
      const orderDetailsResponse = await request(app)
        .get('/api/supplier/orders/order-1')
        .expect(200);

      expect(orderDetailsResponse.body.success).toBe(true);
      expect(orderDetailsResponse.body.order.buyer.companyName).toBe('Test Buyer Company');

      // Step 3: Confirm order
      const confirmOrderResponse = await request(app)
        .patch('/api/supplier/orders/order-1/confirm')
        .send({
          estimatedDeliveryDate: '2024-12-15',
          trackingNumber: 'TRK123456789',
        })
        .expect(200);

      expect(confirmOrderResponse.body.success).toBe(true);
      expect(confirmOrderResponse.body.order.status).toBe('confirmed');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(4);
      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Product Management Workflow', () => {
    it('should complete full product creation to analytics workflow', async () => {
      // Mock supplier profile
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-123',
        companyName: 'Tech Supplier Inc',
      };

      // Mock product creation
      const mockProduct = {
        id: 'product-123',
        supplierId: 'supplier-123',
        name: 'New Electronic Component',
        description: 'High-quality electronic component for industrial use',
        price: '25.00',
        moq: 50,
        categoryId: 'category-electronics',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      // Mock product analytics
      const mockAnalytics = {
        productId: 'product-123',
        views: 150,
        inquiries: 12,
        quotations: 5,
        orders: 2,
        revenue: '1250.00',
        conversionRate: 0.08,
      };

      // Setup database mocks
      (db.select as any)
        // Mock supplier profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock category validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'category-electronics', name: 'Electronics' }]),
            }),
          }),
        })
        // Mock product analytics
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    groupBy: vi.fn().mockResolvedValue([mockAnalytics]),
                  }),
                }),
              }),
            }),
          }),
        });

      // Mock product creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProduct]),
        }),
      });

      // Step 1: Create new product
      const productData = {
        name: 'New Electronic Component',
        description: 'High-quality electronic component for industrial use',
        price: '25.00',
        moq: 50,
        categoryId: 'category-electronics',
        specifications: {
          voltage: '12V',
          current: '3A',
          material: 'Copper',
        },
        images: ['image1.jpg', 'image2.jpg'],
      };

      const createProductResponse = await request(app)
        .post('/api/supplier/products')
        .send(productData)
        .expect(201);

      expect(createProductResponse.body.success).toBe(true);
      expect(createProductResponse.body.product.name).toBe('New Electronic Component');
      expect(createProductResponse.body.product.status).toBe('active');

      // Step 2: Get product analytics
      const analyticsResponse = await request(app)
        .get('/api/supplier/products/product-123/analytics')
        .query({
          period: '30d',
        })
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.analytics.views).toBe(150);
      expect(analyticsResponse.body.analytics.conversionRate).toBe(0.08);

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(3);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });
});