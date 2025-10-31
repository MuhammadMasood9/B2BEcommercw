import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { adminSupplierRoutes } from '../../adminSupplierRoutes';
import { commissionService } from '../../commissionService';
import { payoutService } from '../../payoutService';

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
  adminMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-user-id', role: 'admin' };
    next();
  },
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-user-id', role: 'admin' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/admin/suppliers', adminSupplierRoutes);

describe('Admin Oversight and Management Integration Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = (await import('../../db')).db;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Supplier Approval and Management Workflow', () => {
    it('should handle complete supplier approval process with verification', async () => {
      const mockPendingSuppliers = [
        {
          id: 'supplier-1',
          userId: 'user-1',
          businessName: 'Tech Solutions Inc',
          businessType: 'manufacturer',
          storeName: 'Tech Store',
          contactPerson: 'John Smith',
          phone: '+1234567890',
          email: 'john@techsolutions.com',
          address: '123 Tech Street',
          city: 'Tech City',
          country: 'USA',
          verificationDocs: {
            businessLicense: '/uploads/business-license-1.pdf',
            taxRegistration: '/uploads/tax-reg-1.pdf',
            identityDocument: '/uploads/id-1.pdf',
          },
          status: 'pending',
          membershipTier: 'free',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          id: 'supplier-2',
          userId: 'user-2',
          businessName: 'Fashion Forward LLC',
          businessType: 'wholesaler',
          storeName: 'Fashion Hub',
          contactPerson: 'Jane Doe',
          phone: '+1987654321',
          email: 'jane@fashionforward.com',
          address: '456 Fashion Ave',
          city: 'Style City',
          country: 'USA',
          verificationDocs: {
            businessLicense: '/uploads/business-license-2.pdf',
            taxRegistration: '/uploads/tax-reg-2.pdf',
          },
          status: 'pending',
          membershipTier: 'silver',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      ];

      // Mock pending suppliers query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockPendingSuppliers),
                }),
              }),
            }),
          }),
        }),
      });

      const pendingSuppliersResponse = await request(app)
        .get('/api/admin/suppliers/pending');

      expect(pendingSuppliersResponse.status).toBe(200);
      expect(pendingSuppliersResponse.body.suppliers).toHaveLength(2);
      expect(pendingSuppliersResponse.body.suppliers[0].status).toBe('pending');

      // Admin reviews and approves first supplier
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPendingSuppliers[0]]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockPendingSuppliers[0],
              status: 'approved',
              isActive: true,
              approvedAt: new Date(),
              approvedBy: 'admin-user-id',
            }]),
          }),
        }),
      });

      // Mock notification creation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue([{
          id: 'notification-1',
          userId: 'user-1',
          type: 'success',
          title: 'Supplier Application Approved',
          message: 'Your supplier application has been approved. You can now start listing products.',
        }]),
      });

      const approvalResponse = await request(app)
        .post('/api/admin/suppliers/supplier-1/approve')
        .send({
          approvalNotes: 'All documents verified. Business license and tax registration are valid.',
          verificationLevel: 'business',
        });

      expect(approvalResponse.status).toBe(200);
      expect(approvalResponse.body.success).toBe(true);
      expect(approvalResponse.body.message).toContain('approved');

      // Admin rejects second supplier due to incomplete documentation
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPendingSuppliers[1]]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockPendingSuppliers[1],
              status: 'rejected',
              rejectionReason: 'Incomplete documentation',
              rejectedAt: new Date(),
              rejectedBy: 'admin-user-id',
            }]),
          }),
        }),
      });

      const rejectionResponse = await request(app)
        .post('/api/admin/suppliers/supplier-2/reject')
        .send({
          rejectionReason: 'Incomplete documentation',
          feedback: 'Please provide identity document and complete business registration details.',
        });

      expect(rejectionResponse.status).toBe(200);
      expect(rejectionResponse.body.success).toBe(true);
      expect(rejectionResponse.body.message).toContain('rejected');
    });

    it('should handle supplier suspension and reactivation workflow', async () => {
      const mockActiveSupplier = {
        id: 'supplier-123',
        userId: 'user-123',
        businessName: 'Problem Supplier Inc',
        status: 'approved',
        isActive: true,
        totalOrders: 50,
        totalComplaints: 8,
        rating: 2.1,
      };

      // Mock supplier selection
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockActiveSupplier]),
          }),
        }),
      });

      // Mock suspension update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockActiveSupplier,
              status: 'suspended',
              isActive: false,
              suspensionReason: 'Multiple customer complaints and poor rating',
              suspendedAt: new Date(),
              suspendedBy: 'admin-user-id',
            }]),
          }),
        }),
      });

      const suspensionResponse = await request(app)
        .post('/api/admin/suppliers/supplier-123/suspend')
        .send({
          reason: 'Multiple customer complaints and poor rating',
          notes: 'Supplier has received 8 complaints in the last month with an average rating of 2.1/5. Immediate action required.',
          duration: '30 days',
        });

      expect(suspensionResponse.status).toBe(200);
      expect(suspensionResponse.body.success).toBe(true);
      expect(suspensionResponse.body.message).toContain('suspended');

      // Later, admin reactivates supplier after improvements
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              ...mockActiveSupplier,
              status: 'suspended',
              isActive: false,
            }]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockActiveSupplier,
              status: 'approved',
              isActive: true,
              suspensionReason: null,
              reactivatedAt: new Date(),
              reactivatedBy: 'admin-user-id',
            }]),
          }),
        }),
      });

      const reactivationResponse = await request(app)
        .post('/api/admin/suppliers/supplier-123/reactivate')
        .send({
          notes: 'Supplier has addressed quality issues and improved customer service processes.',
        });

      expect(reactivationResponse.status).toBe(200);
      expect(reactivationResponse.body.success).toBe(true);
      expect(reactivationResponse.body.message).toContain('reactivated');
    });
  });

  describe('Product Approval and Quality Control', () => {
    it('should handle bulk product approval and rejection workflow', async () => {
      const mockPendingProducts = [
        {
          id: 'product-1',
          name: 'High Quality Headphones',
          supplierId: 'supplier-123',
          supplierName: 'Electronics Corp',
          categoryId: 'electronics',
          status: 'pending_approval',
          images: ['/uploads/headphones1.jpg', '/uploads/headphones2.jpg'],
          description: 'Premium wireless headphones with noise cancellation',
          priceRanges: [{ min: 1, max: 10, price: 99.99 }],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'product-2',
          name: 'Cheap Knockoff Watch',
          supplierId: 'supplier-456',
          supplierName: 'Questionable Goods LLC',
          categoryId: 'accessories',
          status: 'pending_approval',
          images: ['/uploads/watch1.jpg'],
          description: 'Luxury watch replica',
          priceRanges: [{ min: 1, max: 10, price: 29.99 }],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      // Mock pending products query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockPendingProducts),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const pendingProductsResponse = await request(app)
        .get('/api/admin/products/pending');

      expect(pendingProductsResponse.status).toBe(200);
      expect(pendingProductsResponse.body.products).toHaveLength(2);

      // Approve first product
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPendingProducts[0]]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockPendingProducts[0],
              status: 'approved',
              isApproved: true,
              isPublished: true,
              approvedAt: new Date(),
              approvedBy: 'admin-user-id',
            }]),
          }),
        }),
      });

      const approveProductResponse = await request(app)
        .post('/api/admin/products/product-1/approve')
        .send({
          approvalNotes: 'Product meets quality standards and has proper documentation.',
          isFeatured: false,
        });

      expect(approveProductResponse.status).toBe(200);
      expect(approveProductResponse.body.success).toBe(true);

      // Reject second product for policy violation
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockPendingProducts[1]]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockPendingProducts[1],
              status: 'rejected',
              isApproved: false,
              rejectionReason: 'Counterfeit/replica products not allowed',
              rejectedAt: new Date(),
              rejectedBy: 'admin-user-id',
            }]),
          }),
        }),
      });

      const rejectProductResponse = await request(app)
        .post('/api/admin/products/product-2/reject')
        .send({
          rejectionReason: 'Counterfeit/replica products not allowed',
          feedback: 'Our platform does not allow replica or counterfeit products. Please list only authentic items.',
        });

      expect(rejectProductResponse.status).toBe(200);
      expect(rejectProductResponse.body.success).toBe(true);
    });
  });

  describe('Commission and Financial Management', () => {
    it('should handle commission settings management and reporting', async () => {
      // Test commission settings update
      vi.spyOn(commissionService, 'updateCommissionSettings').mockResolvedValue();

      const newCommissionRates = {
        defaultRate: 4.5,
        freeRate: 5.0,
        silverRate: 3.5,
        goldRate: 2.5,
        platinumRate: 1.8,
        categoryRates: {
          'electronics': 3.0,
          'clothing': 4.0,
        },
      };

      const updateCommissionResponse = await request(app)
        .patch('/api/admin/commission/settings')
        .send(newCommissionRates);

      expect(updateCommissionResponse.status).toBe(200);
      expect(commissionService.updateCommissionSettings).toHaveBeenCalledWith(
        newCommissionRates,
        'admin-user-id'
      );

      // Test commission reporting
      vi.spyOn(commissionService, 'getPlatformCommissionSummary').mockResolvedValue({
        totalOrders: 1250,
        totalSales: 125000,
        totalCommission: 3750,
        totalPaidToSuppliers: 121250,
        avgCommissionRate: 3.0,
      });

      const commissionReportResponse = await request(app)
        .get('/api/admin/commission/reports')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });

      expect(commissionReportResponse.status).toBe(200);
      expect(commissionReportResponse.body.summary.totalOrders).toBe(1250);
      expect(commissionReportResponse.body.summary.totalCommission).toBe(3750);
    });

    it('should handle payout queue management and processing', async () => {
      const mockPayoutQueue = [
        {
          id: 'payout-1',
          supplierId: 'supplier-1',
          supplierName: 'Electronics Corp',
          amount: 5000,
          netAmount: 4850,
          commissionAmount: 150,
          scheduledDate: new Date(),
          status: 'pending',
          method: 'bank_transfer',
        },
        {
          id: 'payout-2',
          supplierId: 'supplier-2',
          supplierName: 'Fashion House',
          amount: 2500,
          netAmount: 2425,
          commissionAmount: 75,
          scheduledDate: new Date(),
          status: 'pending',
          method: 'paypal',
        },
      ];

      // Mock payout queue query
      vi.spyOn(payoutService, 'getPayoutSummary').mockResolvedValue({
        totalPending: 2,
        totalProcessing: 0,
        totalCompleted: 45,
        totalFailed: 1,
        pendingAmount: 7275,
        completedAmount: 125000,
        failedAmount: 500,
      });

      const payoutSummaryResponse = await request(app)
        .get('/api/admin/payouts/summary');

      expect(payoutSummaryResponse.status).toBe(200);
      expect(payoutSummaryResponse.body.summary.totalPending).toBe(2);
      expect(payoutSummaryResponse.body.summary.pendingAmount).toBe(7275);

      // Process all pending payouts
      vi.spyOn(payoutService, 'processAllPendingPayouts').mockResolvedValue({
        processed: 2,
        successful: 2,
        failed: 0,
        results: [
          { success: true, payoutId: 'payout-1', transactionId: 'TXN_001' },
          { success: true, payoutId: 'payout-2', transactionId: 'TXN_002' },
        ],
      });

      const processPayoutsResponse = await request(app)
        .post('/api/admin/payouts/process-all');

      expect(processPayoutsResponse.status).toBe(200);
      expect(processPayoutsResponse.body.result.processed).toBe(2);
      expect(processPayoutsResponse.body.result.successful).toBe(2);
    });
  });

  describe('Platform Analytics and Monitoring', () => {
    it('should provide comprehensive platform analytics', async () => {
      const mockPlatformAnalytics = {
        suppliers: {
          total: 150,
          active: 142,
          pending: 5,
          suspended: 3,
          newThisMonth: 12,
        },
        products: {
          total: 5420,
          approved: 5180,
          pending: 180,
          rejected: 60,
          newThisMonth: 245,
        },
        orders: {
          total: 1250,
          thisMonth: 95,
          totalValue: 125000,
          avgOrderValue: 100,
        },
        revenue: {
          totalCommission: 3750,
          thisMonth: 285,
          topCategories: [
            { category: 'Electronics', commission: 1200 },
            { category: 'Clothing', commission: 950 },
            { category: 'Home & Garden', commission: 680 },
          ],
        },
        performance: {
          avgResponseTime: '3.2 hours',
          supplierSatisfaction: 4.2,
          buyerSatisfaction: 4.5,
          disputeRate: 0.8,
        },
      };

      // Mock analytics queries
      mockDb.select
        // Suppliers count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '150' }]),
          }),
        })
        // Active suppliers
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '142' }]),
          }),
        })
        // Products count
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: '5420' }]),
          }),
        })
        // Orders summary
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{
              totalOrders: '1250',
              totalValue: '125000',
              avgValue: '100',
            }]),
          }),
        });

      const analyticsResponse = await request(app)
        .get('/api/admin/analytics/platform')
        .query({ timeRange: '30d' });

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.analytics).toBeDefined();
    });

    it('should handle real-time alerts and monitoring', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'warning',
          title: 'High Dispute Rate',
          message: 'Supplier "Problem Corp" has a dispute rate of 15% this month',
          severity: 'medium',
          supplierId: 'supplier-problematic',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isRead: false,
        },
        {
          id: 'alert-2',
          type: 'error',
          title: 'Payout Failure',
          message: 'Payout to "Fashion House" failed due to invalid bank details',
          severity: 'high',
          supplierId: 'supplier-fashion',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isRead: false,
        },
        {
          id: 'alert-3',
          type: 'info',
          title: 'New Supplier Registration',
          message: '5 new suppliers registered today',
          severity: 'low',
          createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          isRead: false,
        },
      ];

      // Mock alerts query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockAlerts),
            }),
          }),
        }),
      });

      const alertsResponse = await request(app)
        .get('/api/admin/alerts')
        .query({ unreadOnly: true });

      expect(alertsResponse.status).toBe(200);
      expect(alertsResponse.body.alerts).toHaveLength(3);
      expect(alertsResponse.body.alerts[0].severity).toBe('high'); // Should be sorted by severity
    });
  });

  describe('Dispute Resolution and Quality Control', () => {
    it('should handle dispute resolution workflow', async () => {
      const mockDispute = {
        id: 'dispute-123',
        orderId: 'order-456',
        buyerId: 'buyer-123',
        supplierId: 'supplier-789',
        type: 'quality_issue',
        description: 'Product received does not match description',
        status: 'open',
        priority: 'medium',
        evidence: ['/uploads/dispute-photo1.jpg', '/uploads/dispute-photo2.jpg'],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };

      // Mock dispute query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    ...mockDispute,
                    buyerName: 'John Smith',
                    buyerCompany: 'Tech Corp',
                    supplierName: 'Electronics Supplier',
                    orderNumber: 'ORD-2024-456',
                  }]),
                }),
              }),
            }),
          }),
        }),
      });

      const disputeResponse = await request(app)
        .get('/api/admin/disputes/dispute-123');

      expect(disputeResponse.status).toBe(200);
      expect(disputeResponse.body.dispute.type).toBe('quality_issue');

      // Admin resolves dispute
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockDispute,
              status: 'resolved',
              resolution: 'Partial refund issued to buyer, supplier warned about quality control',
              resolvedAt: new Date(),
              resolvedBy: 'admin-user-id',
            }]),
          }),
        }),
      });

      const resolutionResponse = await request(app)
        .post('/api/admin/disputes/dispute-123/resolve')
        .send({
          resolution: 'Partial refund issued to buyer, supplier warned about quality control',
          action: 'partial_refund',
          refundAmount: 50.00,
          supplierPenalty: 25.00,
          notes: 'Supplier needs to improve quality control processes',
        });

      expect(resolutionResponse.status).toBe(200);
      expect(resolutionResponse.body.success).toBe(true);
    });
  });
});