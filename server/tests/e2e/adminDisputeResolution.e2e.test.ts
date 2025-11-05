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

describe('Admin Dispute Resolution End-to-End Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      if (req.path.includes('/admin/')) {
        return mockAuthMiddleware('admin', 'admin-user-123')(req, res, next);
      }
      if (req.path.includes('/buyer/')) {
        return mockAuthMiddleware('buyer', 'buyer-user-123')(req, res, next);
      }
      if (req.path.includes('/supplier/')) {
        return mockAuthMiddleware('supplier', 'supplier-user-123')(req, res, next);
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

  describe('Complete Dispute Creation to Resolution Workflow', () => {
    it('should complete full dispute lifecycle from creation to resolution', async () => {
      // Mock order for dispute
      const mockOrder = {
        id: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        totalAmount: '1500.00',
        status: 'delivered',
        paymentStatus: 'paid',
      };

      // Mock dispute creation
      const mockDispute = {
        id: 'dispute-123',
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'quality',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      // Mock dispute with full details
      const mockDisputeDetails = {
        id: 'dispute-123',
        orderId: 'order-123',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        adminId: null,
        type: 'quality',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
        buyerEvidence: ['evidence1.jpg', 'evidence2.pdf'],
        supplierEvidence: [],
        adminNotes: null,
        status: 'open',
        resolution: null,
        refundAmount: null,
        order: mockOrder,
        buyer: {
          id: 'buyer-123',
          companyName: 'Test Buyer Company',
          email: 'buyer@test.com',
        },
        supplier: {
          id: 'supplier-123',
          companyName: 'Tech Supplier Inc',
          email: 'supplier@test.com',
        },
        createdAt: new Date().toISOString(),
      };

      // Setup database mocks for dispute creation
      (db.select as any)
        // Mock order validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    order: mockOrder,
                    buyer: { id: 'buyer-123' },
                    supplier: { id: 'supplier-123' },
                  }]),
                }),
              }),
            }),
          }),
        })
        // Mock existing dispute check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Mock pending disputes for admin queue
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue([{
                          dispute: mockDispute,
                          order: mockOrder,
                          buyer: mockDisputeDetails.buyer,
                          supplier: mockDisputeDetails.supplier,
                        }]),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Mock dispute count
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
        // Mock dispute details for admin
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                      dispute: mockDisputeDetails,
                      order: mockDisputeDetails.order,
                      buyer: mockDisputeDetails.buyer,
                      supplier: mockDisputeDetails.supplier,
                    }]),
                  }),
                }),
              }),
            }),
          }),
        });

      // Mock dispute creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockDispute]),
        }),
      });

      // Mock dispute updates
      (db.update as any)
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                ...mockDisputeDetails,
                adminId: 'admin-user-123',
                status: 'investigating',
              }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                ...mockDisputeDetails,
                status: 'resolved',
                resolution: 'Partial refund approved due to quality issues',
                refundAmount: '750.00',
                resolvedAt: new Date().toISOString(),
              }]),
            }),
          }),
        });

      // Step 1: Buyer creates dispute
      const disputeData = {
        orderId: 'order-123',
        type: 'quality',
        title: 'Product Quality Issue',
        description: 'Product does not match specifications',
        evidence: ['evidence1.jpg', 'evidence2.pdf'],
      };

      const createDisputeResponse = await request(app)
        .post('/api/disputes')
        .send(disputeData)
        .expect(201);

      expect(createDisputeResponse.body.success).toBe(true);
      expect(createDisputeResponse.body.dispute.type).toBe('quality');
      expect(createDisputeResponse.body.dispute.status).toBe('open');

      // Step 2: Admin views dispute queue
      const disputeQueueResponse = await request(app)
        .get('/api/admin/disputes')
        .query({
          status: 'open',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(disputeQueueResponse.body.success).toBe(true);
      expect(disputeQueueResponse.body.disputes).toHaveLength(1);
      expect(disputeQueueResponse.body.disputes[0].type).toBe('quality');

      // Step 3: Admin gets dispute details
      const disputeDetailsResponse = await request(app)
        .get('/api/admin/disputes/dispute-123')
        .expect(200);

      expect(disputeDetailsResponse.body.success).toBe(true);
      expect(disputeDetailsResponse.body.dispute.buyerEvidence).toHaveLength(2);
      expect(disputeDetailsResponse.body.dispute.buyer.companyName).toBe('Test Buyer Company');

      // Step 4: Admin assigns dispute to themselves
      const assignDisputeResponse = await request(app)
        .patch('/api/admin/disputes/dispute-123/assign')
        .send({
          adminId: 'admin-user-123',
        })
        .expect(200);

      expect(assignDisputeResponse.body.success).toBe(true);
      expect(assignDisputeResponse.body.dispute.status).toBe('investigating');
      expect(assignDisputeResponse.body.dispute.adminId).toBe('admin-user-123');

      // Step 5: Admin resolves dispute with partial refund
      const resolveDisputeResponse = await request(app)
        .patch('/api/admin/disputes/dispute-123/resolve')
        .send({
          resolution: 'Partial refund approved due to quality issues',
          refundAmount: '750.00',
          adminNotes: 'Evidence shows quality issues. Partial refund justified.',
        })
        .expect(200);

      expect(resolveDisputeResponse.body.success).toBe(true);
      expect(resolveDisputeResponse.body.dispute.status).toBe('resolved');
      expect(resolveDisputeResponse.body.dispute.refundAmount).toBe('750.00');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(5);
      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(db.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complete Evidence Management Workflow', () => {
    it('should handle evidence upload and review workflow', async () => {
      // Mock dispute with evidence
      const mockDispute = {
        id: 'dispute-456',
        orderId: 'order-456',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        type: 'delivery',
        status: 'investigating',
        buyerEvidence: ['buyer_evidence1.jpg'],
        supplierEvidence: [],
      };

      // Mock evidence upload
      const mockEvidence = {
        id: 'evidence-123',
        disputeId: 'dispute-456',
        uploadedBy: 'supplier-123',
        userType: 'supplier',
        fileName: 'delivery_proof.pdf',
        fileUrl: '/uploads/evidence/delivery_proof.pdf',
        description: 'Proof of delivery with signature',
        uploadedAt: new Date().toISOString(),
      };

      // Setup database mocks
      (db.select as any)
        // Mock dispute validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockDispute]),
            }),
          }),
        })
        // Mock evidence retrieval
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([mockEvidence]),
            }),
          }),
        });

      // Mock evidence upload
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockEvidence]),
        }),
      });

      // Mock dispute update with new evidence
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockDispute,
              supplierEvidence: ['delivery_proof.pdf'],
            }]),
          }),
        }),
      });

      // Step 1: Supplier uploads evidence
      const evidenceData = {
        disputeId: 'dispute-456',
        fileName: 'delivery_proof.pdf',
        fileUrl: '/uploads/evidence/delivery_proof.pdf',
        description: 'Proof of delivery with signature',
      };

      const uploadEvidenceResponse = await request(app)
        .post('/api/disputes/dispute-456/evidence')
        .send(evidenceData)
        .expect(201);

      expect(uploadEvidenceResponse.body.success).toBe(true);
      expect(uploadEvidenceResponse.body.evidence.fileName).toBe('delivery_proof.pdf');
      expect(uploadEvidenceResponse.body.evidence.userType).toBe('supplier');

      // Step 2: Admin reviews all evidence
      const evidenceReviewResponse = await request(app)
        .get('/api/admin/disputes/dispute-456/evidence')
        .expect(200);

      expect(evidenceReviewResponse.body.success).toBe(true);
      expect(evidenceReviewResponse.body.evidence).toHaveLength(1);
      expect(evidenceReviewResponse.body.evidence[0].description).toBe('Proof of delivery with signature');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Commission Adjustment Workflow', () => {
    it('should handle commission adjustments during dispute resolution', async () => {
      // Mock resolved dispute with refund
      const mockDispute = {
        id: 'dispute-789',
        orderId: 'order-789',
        buyerId: 'buyer-123',
        supplierId: 'supplier-123',
        status: 'resolved',
        refundAmount: '500.00',
        order: {
          totalAmount: '1000.00',
          commissionAmount: '100.00',
        },
      };

      // Mock commission adjustment
      const mockCommissionAdjustment = {
        id: 'adjustment-123',
        disputeId: 'dispute-789',
        orderId: 'order-789',
        originalCommission: '100.00',
        adjustedCommission: '50.00',
        adjustmentReason: 'Partial refund due to dispute resolution',
        adjustmentAmount: '-50.00',
        createdAt: new Date().toISOString(),
      };

      // Setup database mocks
      (db.select as any)
        // Mock dispute details
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{
                  dispute: mockDispute,
                  order: mockDispute.order,
                }]),
              }),
            }),
          }),
        })
        // Mock existing adjustment check
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      // Mock commission adjustment creation
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCommissionAdjustment]),
        }),
      });

      // Mock order commission update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockDispute.order,
              commissionAmount: '50.00',
            }]),
          }),
        }),
      });

      // Step 1: Admin processes commission adjustment
      const adjustmentData = {
        disputeId: 'dispute-789',
        adjustmentReason: 'Partial refund due to dispute resolution',
        adjustmentPercentage: 50, // 50% reduction due to refund
      };

      const commissionAdjustmentResponse = await request(app)
        .post('/api/admin/disputes/dispute-789/commission-adjustment')
        .send(adjustmentData)
        .expect(201);

      expect(commissionAdjustmentResponse.body.success).toBe(true);
      expect(commissionAdjustmentResponse.body.adjustment.adjustedCommission).toBe('50.00');
      expect(commissionAdjustmentResponse.body.adjustment.adjustmentAmount).toBe('-50.00');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Dispute Analytics and Reporting Workflow', () => {
    it('should provide comprehensive dispute analytics for admin oversight', async () => {
      // Mock dispute analytics data (used for reference in analytics endpoint)
      const _mockDisputeAnalytics = {
        totalDisputes: 25,
        openDisputes: 5,
        investigatingDisputes: 8,
        resolvedDisputes: 12,
        averageResolutionTime: 4.5, // days
        totalRefundsProcessed: '12500.00',
        disputesByType: {
          quality: 10,
          delivery: 8,
          payment: 4,
          other: 3,
        },
        resolutionOutcomes: {
          buyerFavor: 8,
          supplierFavor: 3,
          partialRefund: 6,
          noAction: 8,
        },
        monthlyTrends: [
          { month: '2024-01', disputes: 3, resolved: 2 },
          { month: '2024-02', disputes: 5, resolved: 4 },
          { month: '2024-03', disputes: 7, resolved: 6 },
        ],
      };

      // Mock recent disputes
      const mockRecentDisputes = [
        {
          id: 'dispute-1',
          type: 'quality',
          status: 'open',
          createdAt: new Date().toISOString(),
          buyer: { companyName: 'Company A' },
          supplier: { companyName: 'Supplier A' },
        },
        {
          id: 'dispute-2',
          type: 'delivery',
          status: 'investigating',
          createdAt: new Date().toISOString(),
          buyer: { companyName: 'Company B' },
          supplier: { companyName: 'Supplier B' },
        },
      ];

      // Setup database mocks
      (db.select as any)
        // Mock dispute statistics
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { status: 'open', count: 5 },
              { status: 'investigating', count: 8 },
              { status: 'resolved', count: 12 },
            ]),
          }),
        })
        // Mock dispute types
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { type: 'quality', count: 10 },
              { type: 'delivery', count: 8 },
              { type: 'payment', count: 4 },
              { type: 'other', count: 3 },
            ]),
          }),
        })
        // Mock resolution outcomes
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { outcome: 'buyer_favor', count: 8 },
              { outcome: 'supplier_favor', count: 3 },
              { outcome: 'partial_refund', count: 6 },
              { outcome: 'no_action', count: 8 },
            ]),
          }),
        })
        // Mock recent disputes
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(mockRecentDisputes.map(dispute => ({
                    dispute,
                    buyer: dispute.buyer,
                    supplier: dispute.supplier,
                  }))),
                }),
              }),
            }),
          }),
        });

      // Step 1: Get dispute analytics overview
      const analyticsResponse = await request(app)
        .get('/api/admin/disputes/analytics')
        .query({
          period: '3m', // Last 3 months
        })
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.analytics.totalDisputes).toBe(25);
      expect(analyticsResponse.body.analytics.disputesByType.quality).toBe(10);

      // Step 2: Get recent disputes for dashboard
      const recentDisputesResponse = await request(app)
        .get('/api/admin/disputes/recent')
        .query({
          limit: 10,
        })
        .expect(200);

      expect(recentDisputesResponse.body.success).toBe(true);
      expect(recentDisputesResponse.body.disputes).toHaveLength(2);
      expect(recentDisputesResponse.body.disputes[0].type).toBe('quality');

      // Verify the complete workflow executed successfully
      expect(db.select).toHaveBeenCalledTimes(4);
    });
  });
});