import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { supplierRoutes } from '../../supplierRoutes';

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

vi.mock('../../auth', () => ({
  supplierMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'supplier-user-id', role: 'supplier' };
    next();
  },
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'buyer-user-id', role: 'buyer' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/suppliers', supplierRoutes);

describe('Supplier-Buyer Communication Integration Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = (await import('../../db')).db;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inquiry Management Workflow', () => {
    it('should handle complete inquiry lifecycle from creation to order', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        businessName: 'Electronics Supplier',
        responseRate: 95.5,
        responseTime: '2 hours',
      };

      const mockProduct = {
        id: 'product-123',
        name: 'Wireless Headphones',
        supplierId: 'supplier-123',
        minOrderQuantity: 50,
        priceRanges: [
          { min: 50, max: 99, price: 25.00 },
          { min: 100, max: 499, price: 22.50 },
          { min: 500, max: null, price: 20.00 },
        ],
      };

      const mockBuyer = {
        id: 'buyer-123',
        userId: 'buyer-user-id',
        companyName: 'Tech Retail Corp',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@techretail.com',
      };

      // Step 1: Buyer creates inquiry
      const inquiryData = {
        productId: 'product-123',
        supplierId: 'supplier-123',
        quantity: 200,
        targetPrice: 21.00,
        message: 'Interested in bulk purchase for Q1 inventory',
        requirements: 'Need custom packaging and branding options',
        urgency: 'medium',
        deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      };

      const mockInquiry = {
        id: 'inquiry-123',
        ...inquiryData,
        buyerId: 'buyer-123',
        status: 'pending',
        createdAt: new Date(),
      };

      // Step 2: Supplier receives and views inquiry
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue([{
                          ...mockInquiry,
                          productName: mockProduct.name,
                          productImages: ['/uploads/headphones1.jpg'],
                          buyerName: mockBuyer.firstName,
                          buyerLastName: mockBuyer.lastName,
                          buyerCompany: mockBuyer.companyName,
                          buyerEmail: mockBuyer.email,
                        }]),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock quotations query (empty initially)
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Mock count query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue([{ count: '1' }]),
                }),
              }),
            }),
          }),
        });

      const inquiriesResponse = await request(app)
        .get('/api/suppliers/inquiries');

      expect(inquiriesResponse.status).toBe(200);
      expect(inquiriesResponse.body.inquiries).toHaveLength(1);
      expect(inquiriesResponse.body.inquiries[0].quantity).toBe(200);
      expect(inquiriesResponse.body.inquiries[0].buyerCompany).toBe('Tech Retail Corp');

      // Step 3: Supplier responds with detailed quotation
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockInquiry]),
            }),
          }),
        });

      // Mock quotation creation
      const mockQuotation = {
        id: 'quotation-123',
        inquiryId: 'inquiry-123',
        pricePerUnit: '21.50',
        totalPrice: '4300.00',
        moq: 200,
        leadTime: '3-4 weeks',
        paymentTerms: '30% advance, 70% before shipment',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        message: 'We can meet your requirements with custom packaging. Price includes branding setup.',
        attachments: ['/uploads/quotation-details.pdf', '/uploads/packaging-samples.jpg'],
        status: 'pending',
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockQuotation]),
        }),
      });

      // Mock inquiry status update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const quotationResponse = await request(app)
        .post('/api/suppliers/inquiries/inquiry-123/respond')
        .send({
          pricePerUnit: 21.50,
          totalPrice: 4300.00,
          moq: 200,
          leadTime: '3-4 weeks',
          paymentTerms: '30% advance, 70% before shipment',
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          message: 'We can meet your requirements with custom packaging. Price includes branding setup.',
          attachments: ['/uploads/quotation-details.pdf', '/uploads/packaging-samples.jpg'],
        });

      expect(quotationResponse.status).toBe(201);
      expect(quotationResponse.body.success).toBe(true);
      expect(quotationResponse.body.quotation.pricePerUnit).toBe('21.50');
      expect(quotationResponse.body.quotation.totalPrice).toBe('4300.00');
    });

    it('should handle inquiry negotiation process', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
      };

      const mockInquiry = {
        id: 'inquiry-123',
        productId: 'product-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        quantity: 500,
        targetPrice: 18.00,
        status: 'negotiating',
      };

      // Mock multiple quotation rounds
      const quotationHistory = [
        {
          id: 'quotation-1',
          inquiryId: 'inquiry-123',
          pricePerUnit: '20.00',
          totalPrice: '10000.00',
          status: 'countered',
          message: 'Initial offer',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'quotation-2',
          inquiryId: 'inquiry-123',
          pricePerUnit: '19.00',
          totalPrice: '9500.00',
          status: 'countered',
          message: 'Revised offer after negotiation',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      // Mock supplier and inquiry queries
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                      ...mockInquiry,
                      productName: 'Wireless Headphones',
                      buyerName: 'John',
                      buyerCompany: 'Tech Corp',
                    }]),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock quotation history
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(quotationHistory),
            }),
          }),
        });

      const inquiryDetailResponse = await request(app)
        .get('/api/suppliers/inquiries/inquiry-123');

      expect(inquiryDetailResponse.status).toBe(200);
      expect(inquiryDetailResponse.body.inquiry.quotations).toHaveLength(2);
      expect(inquiryDetailResponse.body.inquiry.status).toBe('negotiating');

      // Submit final quotation
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockInquiry]),
            }),
          }),
        });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'quotation-3',
            inquiryId: 'inquiry-123',
            pricePerUnit: '18.50',
            totalPrice: '9250.00',
            moq: 500,
            status: 'pending',
            message: 'Final offer - best price we can provide for this volume',
          }]),
        }),
      });

      const finalQuotationResponse = await request(app)
        .post('/api/suppliers/inquiries/inquiry-123/respond')
        .send({
          pricePerUnit: 18.50,
          totalPrice: 9250.00,
          moq: 500,
          leadTime: '2-3 weeks',
          message: 'Final offer - best price we can provide for this volume',
        });

      expect(finalQuotationResponse.status).toBe(201);
      expect(finalQuotationResponse.body.quotation.pricePerUnit).toBe('18.50');
    });
  });

  describe('Order Communication Workflow', () => {
    it('should handle order status updates and buyer notifications', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        businessName: 'Electronics Supplier',
      };

      const mockOrder = {
        id: 'order-123',
        supplierId: 'supplier-123',
        buyerId: 'buyer-123',
        orderNumber: 'ORD-2024-001',
        status: 'confirmed',
        totalAmount: '5000.00',
        items: [
          {
            productId: 'product-123',
            productName: 'Wireless Headphones',
            quantity: 200,
            unitPrice: 25.00,
          },
        ],
      };

      // Step 1: Supplier updates order to processing
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockOrder,
              status: 'processing',
              processingStartedAt: new Date(),
              estimatedShipDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }]),
          }),
        }),
      });

      // Mock notification creation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue([{
          id: 'notification-123',
          userId: 'buyer-123',
          type: 'info',
          title: 'Order Status Update',
          message: 'Your order ORD-2024-001 is now being processed',
        }]),
      });

      const statusUpdateResponse = await request(app)
        .patch('/api/suppliers/orders/order-123/status')
        .send({
          status: 'processing',
          notes: 'Production started. Estimated ship date: 7 days',
          estimatedShipDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

      expect(statusUpdateResponse.status).toBe(200);
      expect(statusUpdateResponse.body.success).toBe(true);

      // Step 2: Supplier updates with shipping information
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                ...mockOrder,
                status: 'processing',
              }]),
            }),
          }),
        });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockOrder,
              status: 'shipped',
              shippedAt: new Date(),
              trackingNumber: 'TRK123456789',
              carrier: 'FedEx',
              estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            }]),
          }),
        }),
      });

      const shippingUpdateResponse = await request(app)
        .patch('/api/suppliers/orders/order-123/status')
        .send({
          status: 'shipped',
          trackingNumber: 'TRK123456789',
          carrier: 'FedEx',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          notes: 'Package shipped via FedEx. Tracking number provided.',
        });

      expect(shippingUpdateResponse.status).toBe(200);
      expect(shippingUpdateResponse.body.success).toBe(true);
    });
  });

  describe('Supplier Analytics and Communication Metrics', () => {
    it('should track supplier communication performance metrics', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        businessName: 'Electronics Supplier',
        responseRate: 95.5,
        responseTime: '2 hours',
        totalInquiries: 150,
      };

      // Mock inquiry statistics
      const inquiryStats = {
        pending: 5,
        replied: 120,
        negotiating: 15,
        closed: 10,
        total: 150,
      };

      const recentInquiries = [
        {
          id: 'inquiry-1',
          productName: 'Product A',
          buyerName: 'John',
          buyerCompany: 'Company A',
          quantity: 100,
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          id: 'inquiry-2',
          productName: 'Product B',
          buyerName: 'Jane',
          buyerCompany: 'Company B',
          quantity: 50,
          status: 'replied',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
      ];

      // Mock supplier profile query
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        // Mock inquiry counts by status
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '5' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '120' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '15' }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '10' }]),
          }),
        })
        // Mock recent inquiries
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue(recentInquiries),
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

      const statsResponse = await request(app)
        .get('/api/suppliers/inquiries/stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.stats.pending).toBe(5);
      expect(statsResponse.body.stats.replied).toBe(120);
      expect(statsResponse.body.recentInquiries).toHaveLength(2);
    });
  });

  describe('Multi-Language Communication Support', () => {
    it('should handle communication in different languages', async () => {
      const mockSupplier = {
        id: 'supplier-123',
        userId: 'supplier-user-id',
        businessName: 'Global Electronics',
        supportedLanguages: ['en', 'es', 'zh'],
        preferredLanguage: 'en',
      };

      const mockInquiry = {
        id: 'inquiry-123',
        productId: 'product-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        quantity: 100,
        message: 'Estoy interesado en una compra al por mayor', // Spanish
        language: 'es',
        status: 'pending',
      };

      // Mock supplier and inquiry queries
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSupplier]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockInquiry]),
            }),
          }),
        });

      // Mock quotation creation with Spanish response
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'quotation-123',
            inquiryId: 'inquiry-123',
            pricePerUnit: '25.00',
            totalPrice: '2500.00',
            moq: 100,
            message: 'Gracias por su interés. Podemos ofrecer un precio competitivo para pedidos al por mayor.',
            language: 'es',
            status: 'pending',
          }]),
        }),
      });

      const quotationResponse = await request(app)
        .post('/api/suppliers/inquiries/inquiry-123/respond')
        .send({
          pricePerUnit: 25.00,
          totalPrice: 2500.00,
          moq: 100,
          leadTime: '2-3 semanas',
          message: 'Gracias por su interés. Podemos ofrecer un precio competitivo para pedidos al por mayor.',
          language: 'es',
        });

      expect(quotationResponse.status).toBe(201);
      expect(quotationResponse.body.quotation.language).toBe('es');
    });
  });
});