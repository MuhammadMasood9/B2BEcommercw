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

describe('Buyer Journey End-to-End Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      if (req.path.includes('/buyer/')) {
        return mockAuthMiddleware('buyer', 'buyer-user-123')(req, res, next);
      }
      if (req.path.includes('/supplier/')) {
        return mockAuthMiddleware('supplier', 'supplier-user-123')(req, res, next);
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

  describe('Complete Buyer Product Discovery Journey', () => {
    it('should complete full product discovery workflow', async () => {
      // Mock buyer profile
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'buyer-user-123',
        companyName: 'Test Buyer Company',
        industry: 'Technology',
      };

      // Mock product search results
      const mockProducts = {
        products: [
          {
            id: 'product-1',
            name: 'Electronic Component A',
            price: '15.50',
            moq: 100,
            category: 'Electronics',
            supplier: {
              id: 'supplier-1',
              companyName: 'Tech Supplier Inc',
              verificationStatus: 'verified',
            },
          },
          {
            id: 'product-2',
            name: 'Electronic Component B',
            price: '22.75',
            moq: 50,
            category: 'Electronics',
            supplier: {
              id: 'supplier-2',
              companyName: 'Components Ltd',
              verificationStatus: 'verified',
            },
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      // Mock product details
      const mockProductDetails = {
        id: 'product-1',
        name: 'Electronic Component A',
        description: 'High-quality electronic component',
        price: '15.50',
        moq: 100,
        specifications: {
          voltage: '5V',
          current: '2A',
          material: 'Silicon',
        },
        images: ['image1.jpg', 'image2.jpg'],
        supplier: {
          id: 'supplier-1',
          companyName: 'Tech Supplier Inc',
          verificationStatus: 'verified',
          location: 'California, USA',
        },
      };

      // Setup database mocks
      (db.select as any)
        // Mock buyer profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBuyer]),
            }),
          }),
        })
        // Mock product search
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(mockProducts.products),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock product count for pagination
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 2 }]),
              }),
            }),
          }),
        })
        // Mock product details
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    product: mockProductDetails,
                    supplier: mockProductDetails.supplier,
                    category: { name: 'Electronics' },
                  }]),
                }),
              }),
            }),
          }),
        });

      // Step 1: Search for products with filters
      const searchResponse = await request(app)
        .get('/api/buyer/products')
        .query({
          category: 'Electronics',
          minPrice: '10.00',
          maxPrice: '30.00',
          location: 'US',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.products).toHaveLength(2);
      expect(searchResponse.body.products[0].name).toBe('Electronic Component A');
      expect(searchResponse.body.total).toBe(2);

      // Step 2: Get detailed product information
      const productDetailsResponse = await request(app)
        .get('/api/buyer/products/product-1')
        .expect(200);

      expect(productDetailsResponse.body.success).toBe(true);
      expect(productDetailsResponse.body.product.name).toBe('Electronic Component A');
      expect(productDetailsResponse.body.product.specifications).toBeDefined();
      expect(productDetailsResponse.body.product.supplier.verificationStatus).toBe('verified');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(4);
    });
  });

  describe('Complete RFQ Creation and Management Journey', () => {
    it('should complete full RFQ creation to quotation comparison workflow', async () => {
      // Mock buyer profile
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'buyer-user-123',
        companyName: 'Test Buyer Company',
      };

      // Mock RFQ creation
      const mockRFQ = {
        id: 'rfq-123',
        buyerId: 'buyer-123',
        title: 'Electronic Components RFQ',
        description: 'Need 1000 units of electronic components',
        quantity: 1000,
        targetPrice: '15.00',
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      // Mock quotations received
      const mockQuotations = [
        {
          id: 'quotation-1',
          rfqId: 'rfq-123',
          supplierId: 'supplier-1',
          unitPrice: '14.50',
          totalPrice: '14500.00',
          moq: 100,
          leadTime: '15-20 days',
          status: 'sent',
          supplier: {
            id: 'supplier-1',
            companyName: 'Tech Supplier Inc',
            verificationStatus: 'verified',
          },
        },
        {
          id: 'quotation-2',
          rfqId: 'rfq-123',
          supplierId: 'supplier-2',
          unitPrice: '16.25',
          totalPrice: '16250.00',
          moq: 50,
          leadTime: '10-15 days',
          status: 'sent',
          supplier: {
            id: 'supplier-2',
            companyName: 'Components Ltd',
            verificationStatus: 'verified',
          },
        },
      ];

      // Setup database mocks
      (db.select as any)
        // Mock buyer profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBuyer]),
            }),
          }),
        })
        // Mock RFQ retrieval for quotation comparison
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    rfq: mockRFQ,
                    buyer: mockBuyer,
                    category: { name: 'Electronics' },
                  }]),
                }),
              }),
            }),
          }),
        })
        // Mock quotations for comparison
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockQuotations.map(q => ({
                  quotation: q,
                  supplier: q.supplier,
                }))),
              }),
            }),
          }),
        });

      // Mock RFQ creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockRFQ]),
        }),
      });

      // Step 1: Create RFQ
      const rfqData = {
        title: 'Electronic Components RFQ',
        description: 'Need 1000 units of electronic components',
        categoryId: 'category-electronics',
        quantity: 1000,
        targetPrice: '15.00',
        deliveryLocation: 'New York, USA',
        requiredDeliveryDate: '2024-12-31',
      };

      const createRFQResponse = await request(app)
        .post('/api/buyer/rfqs')
        .send(rfqData)
        .expect(201);

      expect(createRFQResponse.body.success).toBe(true);
      expect(createRFQResponse.body.rfq.title).toBe('Electronic Components RFQ');
      expect(createRFQResponse.body.rfq.status).toBe('open');

      // Step 2: Get RFQ details
      const rfqDetailsResponse = await request(app)
        .get('/api/buyer/rfqs/rfq-123')
        .expect(200);

      expect(rfqDetailsResponse.body.success).toBe(true);
      expect(rfqDetailsResponse.body.rfq.title).toBe('Electronic Components RFQ');

      // Step 3: Compare quotations received
      const quotationComparisonResponse = await request(app)
        .get('/api/buyer/rfqs/rfq-123/quotations')
        .expect(200);

      expect(quotationComparisonResponse.body.success).toBe(true);
      expect(quotationComparisonResponse.body.quotations).toHaveLength(2);
      expect(quotationComparisonResponse.body.quotations[0].unitPrice).toBe('14.50');
      expect(quotationComparisonResponse.body.quotations[1].unitPrice).toBe('16.25');

      // Verify the complete workflow executed successfully
      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(db.select).toHaveBeenCalledTimes(3);
    });
  });

  describe('Complete Inquiry and Communication Journey', () => {
    it('should complete full inquiry creation to supplier response workflow', async () => {
      // Mock buyer profile
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'buyer-user-123',
        companyName: 'Test Buyer Company',
      };

      // Mock product for inquiry
      const mockProduct = {
        id: 'product-1',
        name: 'Electronic Component A',
        supplierId: 'supplier-1',
      };

      // Mock inquiry creation
      const mockInquiry = {
        id: 'inquiry-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-1',
        productId: 'product-1',
        subject: 'Bulk Pricing Inquiry',
        message: 'What are your bulk pricing options for 5000+ units?',
        quantity: 5000,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Mock conversation creation
      const mockConversation = {
        id: 'conv-123',
        type: 'buyer_supplier',
        buyerId: 'buyer-123',
        supplierId: 'supplier-1',
        subject: 'Product Inquiry Discussion',
        status: 'active',
      };

      // Setup database mocks
      (db.select as any)
        // Mock buyer profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBuyer]),
            }),
          }),
        })
        // Mock product retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockProduct]),
            }),
          }),
        })
        // Mock existing conversation check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      // Mock inquiry and conversation creation
      (db.insert as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockInquiry]),
          }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockConversation]),
          }),
        });

      // Step 1: Send product inquiry
      const inquiryData = {
        productId: 'product-1',
        subject: 'Bulk Pricing Inquiry',
        message: 'What are your bulk pricing options for 5000+ units?',
        quantity: 5000,
      };

      const createInquiryResponse = await request(app)
        .post('/api/buyer/inquiries')
        .send(inquiryData)
        .expect(201);

      expect(createInquiryResponse.body.success).toBe(true);
      expect(createInquiryResponse.body.inquiry.subject).toBe('Bulk Pricing Inquiry');
      expect(createInquiryResponse.body.inquiry.status).toBe('pending');

      // Step 2: Start conversation with supplier
      const conversationData = {
        type: 'buyer_supplier',
        participants: {
          supplierId: 'supplier-1',
        },
        subject: 'Product Inquiry Discussion',
      };

      const createConversationResponse = await request(app)
        .post('/api/chat/conversations')
        .send(conversationData)
        .expect(201);

      expect(createConversationResponse.body.success).toBe(true);
      expect(createConversationResponse.body.conversation.type).toBe('buyer_supplier');
      expect(createConversationResponse.body.conversation.status).toBe('active');

      // Verify the complete workflow executed successfully
      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(db.select).toHaveBeenCalledTimes(3);
    });
  });

  describe('Complete Order Placement and Tracking Journey', () => {
    it('should complete full order placement to tracking workflow', async () => {
      // Mock buyer profile
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'buyer-user-123',
        companyName: 'Test Buyer Company',
      };

      // Mock quotation for order
      const mockQuotation = {
        id: 'quotation-1',
        rfqId: 'rfq-123',
        supplierId: 'supplier-1',
        unitPrice: '14.50',
        totalPrice: '14500.00',
        moq: 100,
        status: 'sent',
      };

      // Mock order creation
      const mockOrder = {
        id: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-1',
        quotationId: 'quotation-1',
        totalAmount: '14500.00',
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Setup database mocks
      (db.select as any)
        // Mock buyer profile retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockBuyer]),
            }),
          }),
        })
        // Mock quotation retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockQuotation]),
            }),
          }),
        })
        // Mock order tracking
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    order: mockOrder,
                    supplier: { companyName: 'Tech Supplier Inc' },
                    quotation: mockQuotation,
                  }]),
                }),
              }),
            }),
          }),
        });

      // Mock order creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockOrder]),
        }),
      });

      // Step 1: Accept quotation and create order
      const orderData = {
        quotationId: 'quotation-1',
        shippingAddress: {
          street: '123 Business St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        paymentMethod: 'bank_transfer',
      };

      const createOrderResponse = await request(app)
        .post('/api/buyer/orders')
        .send(orderData)
        .expect(201);

      expect(createOrderResponse.body.success).toBe(true);
      expect(createOrderResponse.body.order.status).toBe('pending');
      expect(createOrderResponse.body.order.totalAmount).toBe('14500.00');

      // Step 2: Track order status
      const orderTrackingResponse = await request(app)
        .get('/api/buyer/orders/order-123')
        .expect(200);

      expect(orderTrackingResponse.body.success).toBe(true);
      expect(orderTrackingResponse.body.order.status).toBe('pending');
      expect(orderTrackingResponse.body.order.supplier.companyName).toBe('Tech Supplier Inc');

      // Verify the complete workflow executed successfully
      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(db.select).toHaveBeenCalledTimes(3);
    });
  });
});