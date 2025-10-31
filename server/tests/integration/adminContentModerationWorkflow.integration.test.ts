import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../../db';
import { ContentModerationService } from '../../contentModerationService';
import { AdminAccessControlService } from '../../adminAccessControlService';
import { logAdminActivity } from '../../adminOversightService';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: vi.fn(),
    transaction: vi.fn(),
  }
}));

describe('Admin Content Moderation Workflow Integration Tests', () => {
  let contentModerationService: ContentModerationService;
  let accessControlService: AdminAccessControlService;

  beforeEach(() => {
    vi.clearAllMocks();
    contentModerationService = new ContentModerationService();
    accessControlService = new AdminAccessControlService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Content Moderation and Quality Control Processes', () => {
    it('should complete automated product screening and approval workflow', async () => {
      const adminUserId = 'admin-moderator';
      const productId = 'product-pending-1';

      // Step 1: Validate admin moderation permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'content-moderator',
          permissions: null,
          resourcePermissions: {
            products: ['read', 'approve', 'reject', 'moderate'],
            content: ['read', 'analyze', 'moderate'],
            moderation: ['read', 'process', 'bulk_operations']
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockAdminData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const hasModerationPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'products',
        action: 'moderate'
      });

      expect(hasModerationPermission).toBe(true);

      // Step 2: Run automated screening on product
      const mockProduct = {
        id: productId,
        title: 'High Quality Wireless Headphones',
        description: 'Premium wireless headphones with noise cancellation technology. Features include 30-hour battery life, premium sound quality, and comfortable design for extended use.',
        images: [
          'https://example.com/headphones-main.jpg',
          'https://example.com/headphones-side.jpg'
        ],
        supplier_id: 'supplier-1'
      };

      // Mock product query
      (db.query as any).mockResolvedValueOnce({
        rows: [mockProduct]
      });

      // Mock storage queries for analysis results
      (db.query as any).mockResolvedValue({ rows: [] });

      const screeningResult = await contentModerationService.runAutomatedScreening(productId);

      expect(screeningResult).toHaveProperty('textAnalysis');
      expect(screeningResult).toHaveProperty('imageAnalysis');
      expect(screeningResult).toHaveProperty('duplicateCheck');
      expect(screeningResult).toHaveProperty('overallScore');
      expect(screeningResult).toHaveProperty('recommendation');
      expect(screeningResult).toHaveProperty('flags');

      expect(screeningResult.textAnalysis).toHaveLength(2); // Title and description
      expect(screeningResult.imageAnalysis).toHaveLength(2); // Two images
      expect(screeningResult.overallScore).toBeGreaterThan(70); // Good quality content
      expect(screeningResult.recommendation).toBe('approve');

      // Step 3: Admin reviews automated screening results
      const reviewDecision = {
        productId: productId,
        screeningResult: screeningResult,
        adminDecision: screeningResult.recommendation === 'approve' ? 'approve' : 'review',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        reviewNotes: screeningResult.recommendation === 'approve' 
          ? 'Automated screening passed all quality checks'
          : 'Requires manual review due to flagged content'
      };

      expect(reviewDecision.adminDecision).toBe('approve');

      // Step 4: Update product status based on decision
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              id: productId,
              status: 'approved',
              approvedAt: new Date(),
              approvedBy: adminUserId,
              moderationScore: screeningResult.overallScore,
              moderationFlags: screeningResult.flags
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      const updatedProduct = {
        id: productId,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: adminUserId,
        moderationScore: screeningResult.overallScore,
        moderationFlags: screeningResult.flags
      };

      expect(updatedProduct.status).toBe('approved');
      expect(updatedProduct.approvedBy).toBe(adminUserId);

      // Step 5: Log moderation activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Content Moderator',
        'approve_product',
        `Approved product after automated screening (score: ${screeningResult.overallScore})`,
        'product',
        productId,
        mockProduct.title
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 6: Update moderation statistics
      const moderationStats = {
        totalProcessed: 1,
        approved: reviewDecision.adminDecision === 'approve' ? 1 : 0,
        rejected: 0,
        pendingReview: reviewDecision.adminDecision === 'review' ? 1 : 0,
        averageScore: screeningResult.overallScore,
        processingTime: screeningResult.textAnalysis[0]?.processingTime || 0
      };

      expect(moderationStats.approved).toBe(1);
      expect(moderationStats.averageScore).toBeGreaterThan(70);
    });

    it('should handle product rejection workflow with policy violations', async () => {
      const adminUserId = 'admin-moderator';
      const productId = 'product-violation-1';

      // Step 1: Validate moderation permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'content-moderator',
          permissions: null,
          resourcePermissions: {
            products: ['read', 'approve', 'reject', 'moderate'],
            content: ['read', 'analyze', 'moderate']
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockAdminData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const hasRejectionPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'products',
        action: 'reject'
      });

      expect(hasRejectionPermission).toBe(true);

      // Step 2: Run automated screening on problematic product
      const mockProblematicProduct = {
        id: productId,
        title: 'FAKE REPLICA COUNTERFEIT BRAND WATCH!!!',
        description: 'This is a perfect copy of the original brand watch. Guaranteed fake replica with same quality as original. BUY NOW limited time offer!!!',
        images: [
          'https://example.com/fake-watch.jpg'
        ],
        supplier_id: 'supplier-problematic'
      };

      // Mock product query
      (db.query as any).mockResolvedValueOnce({
        rows: [mockProblematicProduct]
      });

      // Mock storage queries
      (db.query as any).mockResolvedValue({ rows: [] });

      const screeningResult = await contentModerationService.runAutomatedScreening(productId);

      expect(screeningResult.overallScore).toBeLessThan(50); // Poor quality content
      expect(screeningResult.recommendation).toBe('reject');
      expect(screeningResult.flags.length).toBeGreaterThan(0);

      // Verify specific violations
      const policyViolations = screeningResult.flags.filter(f => f.type === 'policy_violation');
      const spamFlags = screeningResult.flags.filter(f => f.type === 'spam');
      
      expect(policyViolations.length).toBeGreaterThan(0);
      expect(spamFlags.length).toBeGreaterThan(0);

      // Step 3: Admin confirms rejection based on screening
      const rejectionDecision = {
        productId: productId,
        adminDecision: 'reject',
        rejectionReasons: [
          'Policy violation: Contains prohibited terms (counterfeit, fake, replica)',
          'Spam content: Excessive promotional language and urgency tactics',
          'Quality issue: Poor content quality and inappropriate capitalization'
        ],
        rejectedBy: adminUserId,
        rejectedAt: new Date(),
        screeningScore: screeningResult.overallScore,
        violationFlags: screeningResult.flags.filter(f => f.severity === 'critical' || f.severity === 'high')
      };

      expect(rejectionDecision.adminDecision).toBe('reject');
      expect(rejectionDecision.rejectionReasons.length).toBeGreaterThan(0);

      // Step 4: Update product status to rejected
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              id: productId,
              status: 'rejected',
              rejectedAt: new Date(),
              rejectedBy: adminUserId,
              rejectionReasons: rejectionDecision.rejectionReasons,
              moderationScore: screeningResult.overallScore
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Step 5: Notify supplier of rejection
      const supplierNotification = {
        supplierId: mockProblematicProduct.supplier_id,
        type: 'product_rejected',
        title: 'Product Rejected - Policy Violations',
        message: `Your product "${mockProblematicProduct.title}" has been rejected due to policy violations. Please review our content guidelines and resubmit with compliant content.`,
        rejectionReasons: rejectionDecision.rejectionReasons,
        productId: productId,
        createdAt: new Date()
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      // Step 6: Log rejection activity
      await logAdminActivity(
        adminUserId,
        'Content Moderator',
        'reject_product',
        `Rejected product due to policy violations: ${rejectionDecision.rejectionReasons.join('; ')}`,
        'product',
        productId,
        mockProblematicProduct.title
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 7: Update supplier compliance score
      const supplierComplianceUpdate = {
        supplierId: mockProblematicProduct.supplier_id,
        violationCount: 1,
        complianceScore: 65, // Reduced due to violation
        lastViolation: new Date(),
        violationType: 'policy_violation'
      };

      expect(supplierComplianceUpdate.complianceScore).toBeLessThan(70);
    });

    it('should handle bulk moderation operations', async () => {
      const adminUserId = 'admin-moderator';
      const productIds = ['product-1', 'product-2', 'product-3', 'product-4', 'product-5'];

      // Step 1: Validate bulk moderation permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'senior-moderator',
          permissions: null,
          resourcePermissions: {
            products: ['read', 'approve', 'reject', 'moderate'],
            moderation: ['read', 'process', 'bulk_operations'],
            content: ['read', 'analyze', 'moderate']
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockAdminData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const hasBulkPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'moderation',
        action: 'bulk_operations'
      });

      expect(hasBulkPermission).toBe(true);

      // Step 2: Get products for bulk moderation
      const mockProducts = productIds.map((id, index) => ({
        id,
        title: `Product ${index + 1}`,
        description: `Description for product ${index + 1} with detailed information about features and specifications.`,
        images: [`https://example.com/product-${index + 1}.jpg`],
        supplier_id: `supplier-${index + 1}`,
        status: 'pending_approval'
      }));

      // Mock product queries for each product
      mockProducts.forEach(product => {
        (db.query as any).mockResolvedValueOnce({
          rows: [product]
        });
      });

      // Mock storage queries
      (db.query as any).mockResolvedValue({ rows: [] });

      // Step 3: Run automated screening on all products
      const bulkScreeningResults = [];
      for (const productId of productIds) {
        const screeningResult = await contentModerationService.runAutomatedScreening(productId);
        bulkScreeningResults.push({
          productId,
          screeningResult,
          recommendation: screeningResult.recommendation
        });
      }

      expect(bulkScreeningResults).toHaveLength(5);

      // Step 4: Process bulk decisions
      const bulkDecisions = bulkScreeningResults.map(result => {
        // Auto-approve products with high scores, queue others for review
        const autoApprove = result.screeningResult.overallScore > 80 && 
                           result.screeningResult.flags.filter(f => f.severity === 'critical').length === 0;
        
        return {
          productId: result.productId,
          decision: autoApprove ? 'approve' : 'review',
          score: result.screeningResult.overallScore,
          flags: result.screeningResult.flags,
          automated: autoApprove
        };
      });

      const autoApproved = bulkDecisions.filter(d => d.decision === 'approve');
      const requiresReview = bulkDecisions.filter(d => d.decision === 'review');

      // Step 5: Apply bulk approvals
      if (autoApproved.length > 0) {
        const mockUpdate = vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockReturnValue(
                autoApproved.map(decision => ({
                  id: decision.productId,
                  status: 'approved',
                  approvedAt: new Date(),
                  approvedBy: adminUserId,
                  moderationScore: decision.score
                }))
              )
            })
          })
        });

        (db.update as any).mockImplementation(mockUpdate);
      }

      // Step 6: Queue products requiring review
      if (requiresReview.length > 0) {
        const mockInsert = vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue(Promise.resolve())
        });

        (db.insert as any).mockImplementation(mockInsert);

        // Add to manual review queue
        const reviewQueueEntries = requiresReview.map(decision => ({
          productId: decision.productId,
          priority: decision.flags.filter(f => f.severity === 'high').length > 0 ? 'high' : 'normal',
          assignedTo: null, // Will be assigned by queue management
          queuedAt: new Date(),
          queuedBy: adminUserId,
          flags: decision.flags
        }));

        expect(reviewQueueEntries.length).toBe(requiresReview.length);
      }

      // Step 7: Log bulk operation
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Senior Moderator',
        'bulk_moderation',
        `Processed ${productIds.length} products: ${autoApproved.length} auto-approved, ${requiresReview.length} queued for review`,
        'bulk_operation',
        undefined,
        'Bulk Product Moderation'
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 8: Generate bulk operation summary
      const bulkOperationSummary = {
        operationId: `bulk_${Date.now()}`,
        processedBy: adminUserId,
        processedAt: new Date(),
        totalProducts: productIds.length,
        autoApproved: autoApproved.length,
        queuedForReview: requiresReview.length,
        averageScore: bulkDecisions.reduce((sum, d) => sum + d.score, 0) / bulkDecisions.length,
        processingTimeMs: Date.now() - Date.now(), // Simulated
        efficiency: (autoApproved.length / productIds.length) * 100
      };

      expect(bulkOperationSummary.totalProducts).toBe(5);
      expect(bulkOperationSummary.autoApproved + bulkOperationSummary.queuedForReview).toBe(5);
      expect(bulkOperationSummary.efficiency).toBeGreaterThanOrEqual(0);
      expect(bulkOperationSummary.efficiency).toBeLessThanOrEqual(100);
    });

    it('should handle manual review queue workflow', async () => {
      const adminUserId = 'admin-reviewer';
      const productId = 'product-review-1';

      // Step 1: Validate review permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'content-reviewer',
          permissions: null,
          resourcePermissions: {
            products: ['read', 'approve', 'reject', 'review'],
            content: ['read', 'analyze'],
            review_queue: ['read', 'process', 'assign']
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockAdminData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const hasReviewPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'review_queue',
        action: 'process'
      });

      expect(hasReviewPermission).toBe(true);

      // Step 2: Get product from review queue
      const mockQueueItem = {
        id: 'queue-item-1',
        productId: productId,
        priority: 'high',
        assignedTo: adminUserId,
        queuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        flags: [
          {
            type: 'quality_issue',
            severity: 'medium',
            description: 'Product description could be more detailed',
            confidence: 0.7
          },
          {
            type: 'inappropriate',
            severity: 'high',
            description: 'Potential trademark concerns in product name',
            confidence: 0.8
          }
        ]
      };

      const mockProduct = {
        id: productId,
        title: 'Brand-Like Premium Headphones',
        description: 'Good headphones with nice sound.',
        images: ['https://example.com/headphones.jpg'],
        supplier_id: 'supplier-review',
        status: 'pending_review'
      };

      // Mock queue and product queries
      (db.query as any)
        .mockResolvedValueOnce({ rows: [mockQueueItem] })
        .mockResolvedValueOnce({ rows: [mockProduct] });

      // Step 3: Admin performs manual review
      const manualReviewResult = {
        productId: productId,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        decision: 'approve_with_conditions',
        conditions: [
          'Update product title to avoid trademark concerns',
          'Expand product description with technical specifications',
          'Add additional product images showing different angles'
        ],
        reviewNotes: 'Product quality is acceptable but requires minor improvements for better compliance and user experience',
        flagsResolved: mockQueueItem.flags.map(flag => ({
          ...flag,
          resolved: flag.severity === 'medium',
          resolution: flag.severity === 'medium' ? 'Acceptable for approval with conditions' : 'Requires supplier action'
        }))
      };

      expect(manualReviewResult.decision).toBe('approve_with_conditions');
      expect(manualReviewResult.conditions.length).toBe(3);

      // Step 4: Update product status based on review
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              id: productId,
              status: 'approved_conditional',
              reviewedAt: new Date(),
              reviewedBy: adminUserId,
              reviewConditions: manualReviewResult.conditions,
              reviewNotes: manualReviewResult.reviewNotes
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Step 5: Remove from review queue
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.delete as any).mockImplementation(mockDelete);

      // Step 6: Notify supplier of conditional approval
      const supplierNotification = {
        supplierId: mockProduct.supplier_id,
        type: 'product_approved_conditional',
        title: 'Product Approved with Conditions',
        message: `Your product "${mockProduct.title}" has been approved with conditions. Please address the following requirements:`,
        conditions: manualReviewResult.conditions,
        productId: productId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to comply
        createdAt: new Date()
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      // Step 7: Log review activity
      await logAdminActivity(
        adminUserId,
        'Content Reviewer',
        'manual_review_complete',
        `Completed manual review: ${manualReviewResult.decision} with ${manualReviewResult.conditions.length} conditions`,
        'product',
        productId,
        mockProduct.title
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 8: Update reviewer performance metrics
      const reviewerMetrics = {
        reviewerId: adminUserId,
        reviewsCompleted: 1,
        averageReviewTime: 2 * 60 * 60 * 1000, // 2 hours
        approvalRate: 1, // 100% (conditional approval counts as approval)
        qualityScore: 85, // Based on thoroughness and accuracy
        lastReview: new Date()
      };

      expect(reviewerMetrics.reviewsCompleted).toBe(1);
      expect(reviewerMetrics.averageReviewTime).toBeGreaterThan(0);
    });

    it('should handle content quality monitoring and improvement workflow', async () => {
      const adminUserId = 'admin-quality';

      // Step 1: Validate quality monitoring permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'quality-manager',
          permissions: null,
          resourcePermissions: {
            quality: ['read', 'monitor', 'analyze', 'improve'],
            content: ['read', 'analyze', 'quality_control'],
            reports: ['read', 'generate']
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockAdminData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const hasQualityPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'quality',
        action: 'monitor'
      });

      expect(hasQualityPermission).toBe(true);

      // Step 2: Analyze platform content quality metrics
      const mockQualityMetrics = {
        totalProducts: 1000,
        averageQualityScore: 78.5,
        qualityDistribution: {
          excellent: 250, // 90-100
          good: 400,      // 70-89
          fair: 280,      // 50-69
          poor: 70        // <50
        },
        commonIssues: [
          { type: 'short_description', count: 180, percentage: 18 },
          { type: 'low_quality_images', count: 120, percentage: 12 },
          { type: 'missing_specifications', count: 95, percentage: 9.5 },
          { type: 'inappropriate_language', count: 45, percentage: 4.5 }
        ],
        improvementTrends: {
          lastMonth: 76.2,
          currentMonth: 78.5,
          improvement: 2.3
        }
      };

      // Mock quality metrics queries
      (db.query as any).mockResolvedValue({
        rows: [mockQualityMetrics]
      });

      // Step 3: Identify suppliers needing quality improvement
      const mockSuppliersNeedingImprovement = [
        {
          supplierId: 'supplier-low-quality',
          supplierName: 'Needs Improvement Supplier',
          averageScore: 45.2,
          productCount: 25,
          commonIssues: ['short_description', 'low_quality_images'],
          improvementPotential: 'high'
        },
        {
          supplierId: 'supplier-medium-quality',
          supplierName: 'Medium Quality Supplier',
          averageScore: 62.8,
          productCount: 40,
          commonIssues: ['missing_specifications'],
          improvementPotential: 'medium'
        }
      ];

      // Step 4: Generate quality improvement recommendations
      const qualityImprovementPlan = {
        planId: `quality_plan_${Date.now()}`,
        createdBy: adminUserId,
        createdAt: new Date(),
        targetSuppliers: mockSuppliersNeedingImprovement,
        recommendations: [
          {
            type: 'supplier_training',
            description: 'Provide content quality guidelines and best practices training',
            targetSuppliers: mockSuppliersNeedingImprovement.map(s => s.supplierId),
            priority: 'high',
            estimatedImpact: 15 // percentage improvement
          },
          {
            type: 'automated_suggestions',
            description: 'Implement real-time content improvement suggestions during product creation',
            targetSuppliers: 'all',
            priority: 'medium',
            estimatedImpact: 8
          },
          {
            type: 'quality_incentives',
            description: 'Introduce quality score-based commission bonuses',
            targetSuppliers: mockSuppliersNeedingImprovement.filter(s => s.improvementPotential === 'high').map(s => s.supplierId),
            priority: 'medium',
            estimatedImpact: 12
          }
        ],
        expectedOutcomes: {
          targetAverageScore: 85,
          timeframe: '3 months',
          estimatedImprovement: 6.5
        }
      };

      expect(qualityImprovementPlan.recommendations.length).toBe(3);
      expect(qualityImprovementPlan.targetSuppliers.length).toBe(2);

      // Step 5: Implement quality monitoring alerts
      const qualityAlerts = [
        {
          type: 'quality_decline',
          severity: 'medium',
          description: 'Platform average quality score declined by 2% this week',
          affectedSuppliers: 15,
          recommendedAction: 'Review recent submissions and identify common issues'
        },
        {
          type: 'supplier_quality_drop',
          severity: 'high',
          description: 'Supplier "Needs Improvement Supplier" quality score below threshold',
          affectedSuppliers: 1,
          recommendedAction: 'Immediate supplier outreach and support required'
        }
      ];

      // Step 6: Log quality monitoring activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Quality Manager',
        'quality_analysis_complete',
        `Completed quality analysis: Average score ${mockQualityMetrics.averageQualityScore}, ${qualityAlerts.length} alerts generated`,
        'quality_analysis',
        qualityImprovementPlan.planId,
        'Platform Quality Analysis'
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 7: Generate quality improvement report
      const qualityReport = {
        reportId: `quality_report_${Date.now()}`,
        generatedBy: adminUserId,
        generatedAt: new Date(),
        period: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        metrics: mockQualityMetrics,
        improvementPlan: qualityImprovementPlan,
        alerts: qualityAlerts,
        recommendations: [
          'Focus on supplier education and training programs',
          'Implement proactive quality monitoring and alerts',
          'Consider quality-based incentive programs',
          'Enhance automated content analysis capabilities'
        ]
      };

      expect(qualityReport.recommendations.length).toBe(4);
      expect(qualityReport.metrics.averageQualityScore).toBe(78.5);
    });

    it('should handle permission denied for content moderation operations', async () => {
      const limitedAdminUserId = 'admin-limited';

      // Mock admin with limited permissions (no moderation access)
      const mockLimitedAdminData = [{
        adminUser: {
          id: limitedAdminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'financial-manager',
          permissions: null,
          resourcePermissions: {
            financial: ['read', 'update_commission', 'process_payouts'],
            commission: ['read', 'update']
            // No content moderation permissions
          }
        }
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockLimitedAdminData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      // Validate admin does NOT have moderation permissions
      const hasModerationPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'products',
        action: 'moderate'
      });

      expect(hasModerationPermission).toBe(false);

      const hasApprovalPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'products',
        action: 'approve'
      });

      expect(hasApprovalPermission).toBe(false);

      const hasBulkPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'moderation',
        action: 'bulk_operations'
      });

      expect(hasBulkPermission).toBe(false);
    });
  });
});