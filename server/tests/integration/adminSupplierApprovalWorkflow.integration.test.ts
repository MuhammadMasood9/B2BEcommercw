import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../../db';
import { AdminAccessControlService } from '../../adminAccessControlService';
import { 
  getSupplierPerformanceMetrics, 
  logAdminActivity,
  getPlatformAnalytics 
} from '../../adminOversightService';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}));

describe('Admin Supplier Approval Workflow Integration Tests', () => {
  let accessControlService: AdminAccessControlService;

  beforeEach(() => {
    vi.clearAllMocks();
    accessControlService = new AdminAccessControlService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Supplier Approval Process', () => {
    it('should complete full supplier approval workflow', async () => {
      // Step 1: Admin logs in and validates permissions
      const adminUserId = 'admin-1';
      const supplierId = 'supplier-pending-1';

      // Mock admin permission validation
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-1',
          permissions: null,
          resourcePermissions: {
            suppliers: ['read', 'approve', 'reject']
          }
        }
      }];

      const mockSelect = vi.fn();
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockAdminData)
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      // Validate admin has approval permissions
      const hasPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'suppliers',
        action: 'approve'
      });

      expect(hasPermission).toBe(true);

      // Step 2: Get pending supplier for review
      const mockPendingSupplier = {
        supplierId: supplierId,
        businessName: 'Test Business LLC',
        storeName: 'Test Store',
        membershipTier: 'free',
        verificationLevel: 'pending',
        totalOrders: 0,
        totalSales: 0,
        responseRate: 0,
        responseTime: 'N/A',
        rating: 0,
        totalReviews: 0,
        totalProducts: 0,
        approvedProducts: 0,
        pendingProducts: 5,
        rejectedProducts: 0,
        complianceScore: 85,
        policyViolations: 0,
        disputeCount: 0,
        lastActivity: new Date(),
        isActive: false,
        isSuspended: false,
        riskLevel: 'low' as const,
        riskFactors: []
      };

      // Mock supplier performance metrics query
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockReturnValue([{
                  supplierId: supplierId,
                  businessName: 'Test Business LLC',
                  storeName: 'Test Store',
                  membershipTier: 'free',
                  verificationLevel: 'pending',
                  totalOrders: 0,
                  totalSales: '0',
                  responseRate: '0',
                  responseTime: 'N/A',
                  rating: '0',
                  totalReviews: 0,
                  totalProducts: 0,
                  isActive: false,
                  isSuspended: false,
                  updatedAt: new Date()
                }])
              })
            })
          })
        })
      });

      // Mock count query
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue([{ count: 1 }])
        })
      });

      // Mock product stats query
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue([
              { status: 'pending_approval', count: 5 }
            ])
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const supplierMetrics = await getSupplierPerformanceMetrics(supplierId);

      expect(supplierMetrics.suppliers).toHaveLength(1);
      expect(supplierMetrics.suppliers[0].supplierId).toBe(supplierId);
      expect(supplierMetrics.suppliers[0].verificationLevel).toBe('pending');

      // Step 3: Admin approves supplier
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              id: supplierId,
              status: 'approved',
              verificationLevel: 'verified',
              isActive: true,
              approvedAt: new Date(),
              approvedBy: adminUserId
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Simulate supplier approval
      const approvalResult = {
        supplierId: supplierId,
        status: 'approved',
        approvedBy: adminUserId,
        approvedAt: new Date(),
        reason: 'All documentation verified and business meets requirements'
      };

      expect(approvalResult.status).toBe('approved');
      expect(approvalResult.approvedBy).toBe(adminUserId);

      // Step 4: Log admin activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Admin User',
        'approve_supplier',
        `Approved supplier: ${mockPendingSupplier.businessName}`,
        'supplier',
        supplierId,
        mockPendingSupplier.businessName
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 5: Verify platform analytics updated
      const mockAnalyticsData = {
        totalSuppliers: 26, // Increased by 1
        activeSuppliers: 21, // Increased by 1
        pendingSuppliers: 4, // Decreased by 1
        suspendedSuppliers: 1,
        totalProducts: 150,
        approvedProducts: 120,
        pendingProducts: 25,
        rejectedProducts: 5,
        totalOrders: 500,
        totalRevenue: 250000,
        totalCommission: 12500,
        averageSupplierRating: 4.2,
        averageResponseRate: 85.5,
        topPerformingSuppliers: [],
        recentActivity: []
      };

      // Mock platform analytics queries
      const mockAnalyticsSelect = vi.fn();
      mockAnalyticsSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue([
              { status: 'approved', count: 21 },
              { status: 'pending', count: 4 },
              { status: 'suspended', count: 1 }
            ])
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue([
                { status: 'approved', count: 120 },
                { status: 'pending_approval', count: 25 },
                { status: 'rejected', count: 5 }
              ])
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue([
              { totalOrders: 500, totalRevenue: 250000, totalCommission: 12500 }
            ])
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue([
              { avgRating: 4.2, avgResponseRate: 85.5 }
            ])
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue([])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([])
            })
          })
        });

      (db.select as any).mockImplementation(mockAnalyticsSelect);

      const updatedAnalytics = await getPlatformAnalytics();

      expect(updatedAnalytics.activeSuppliers).toBe(21);
      expect(updatedAnalytics.pendingSuppliers).toBe(4);
      expect(updatedAnalytics.totalSuppliers).toBe(26);
    });

    it('should handle supplier rejection workflow', async () => {
      const adminUserId = 'admin-1';
      const supplierId = 'supplier-pending-2';
      const rejectionReason = 'Incomplete documentation and failed verification checks';

      // Mock admin permission validation
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-1',
          permissions: null,
          resourcePermissions: {
            suppliers: ['read', 'approve', 'reject']
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

      // Validate admin has rejection permissions
      const hasPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'suppliers',
        action: 'reject'
      });

      expect(hasPermission).toBe(true);

      // Mock supplier rejection
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              id: supplierId,
              status: 'rejected',
              rejectedAt: new Date(),
              rejectedBy: adminUserId,
              rejectionReason: rejectionReason
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Simulate supplier rejection
      const rejectionResult = {
        supplierId: supplierId,
        status: 'rejected',
        rejectedBy: adminUserId,
        rejectedAt: new Date(),
        reason: rejectionReason
      };

      expect(rejectionResult.status).toBe('rejected');
      expect(rejectionResult.reason).toBe(rejectionReason);

      // Log rejection activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Admin User',
        'reject_supplier',
        `Rejected supplier: ${rejectionReason}`,
        'supplier',
        supplierId,
        'Test Supplier'
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle bulk supplier operations', async () => {
      const adminUserId = 'admin-1';
      const supplierIds = ['supplier-1', 'supplier-2', 'supplier-3'];

      // Mock admin permission validation
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-1',
          permissions: null,
          resourcePermissions: {
            suppliers: ['read', 'approve', 'reject', 'bulk_operations']
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

      // Validate admin has bulk operations permissions
      const hasPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'suppliers',
        action: 'bulk_operations'
      });

      expect(hasPermission).toBe(true);

      // Mock bulk approval operation
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue(
              supplierIds.map(id => ({
                id,
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: adminUserId
              }))
            )
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Simulate bulk approval
      const bulkApprovalResult = {
        operation: 'bulk_approve',
        supplierIds: supplierIds,
        processedBy: adminUserId,
        processedAt: new Date(),
        successCount: supplierIds.length,
        failureCount: 0
      };

      expect(bulkApprovalResult.successCount).toBe(3);
      expect(bulkApprovalResult.failureCount).toBe(0);

      // Log bulk operation activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Admin User',
        'bulk_approve_suppliers',
        `Bulk approved ${supplierIds.length} suppliers`,
        'bulk_operation',
        undefined,
        'Bulk Supplier Approval'
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle supplier performance monitoring workflow', async () => {
      const adminUserId = 'admin-1';
      const supplierId = 'supplier-active-1';

      // Mock admin permission validation
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-1',
          permissions: null,
          resourcePermissions: {
            suppliers: ['read', 'monitor', 'suspend']
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

      // Validate admin has monitoring permissions
      const hasPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'suppliers',
        action: 'monitor'
      });

      expect(hasPermission).toBe(true);

      // Mock supplier with performance issues
      const mockSupplierWithIssues = {
        supplierId: supplierId,
        businessName: 'Problematic Supplier',
        storeName: 'Problem Store',
        membershipTier: 'silver',
        verificationLevel: 'verified',
        totalOrders: 100,
        totalSales: 5000,
        responseRate: 45, // Low response rate
        responseTime: '48 hours', // Slow response
        rating: 2.8, // Low rating
        totalReviews: 50,
        totalProducts: 20,
        approvedProducts: 15,
        pendingProducts: 2,
        rejectedProducts: 3,
        complianceScore: 35, // Low compliance
        policyViolations: 3,
        disputeCount: 8,
        lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        isActive: true,
        isSuspended: false,
        riskLevel: 'high' as const,
        riskFactors: ['Low customer rating', 'Poor response rate', 'High dispute count']
      };

      // Mock performance metrics query
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockReturnValue([{
                  supplierId: supplierId,
                  businessName: 'Problematic Supplier',
                  storeName: 'Problem Store',
                  membershipTier: 'silver',
                  verificationLevel: 'verified',
                  totalOrders: 100,
                  totalSales: '5000',
                  responseRate: '45',
                  responseTime: '48 hours',
                  rating: '2.8',
                  totalReviews: 50,
                  totalProducts: 20,
                  isActive: true,
                  isSuspended: false,
                  updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }])
              })
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const performanceMetrics = await getSupplierPerformanceMetrics(supplierId);

      expect(performanceMetrics.suppliers[0].riskLevel).toBe('high');
      expect(performanceMetrics.suppliers[0].riskFactors.length).toBeGreaterThan(0);

      // Admin decides to suspend supplier due to poor performance
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              id: supplierId,
              isSuspended: true,
              suspendedAt: new Date(),
              suspendedBy: adminUserId,
              suspensionReason: 'Poor performance metrics and high risk factors'
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Simulate supplier suspension
      const suspensionResult = {
        supplierId: supplierId,
        isSuspended: true,
        suspendedBy: adminUserId,
        suspendedAt: new Date(),
        reason: 'Poor performance metrics and high risk factors'
      };

      expect(suspensionResult.isSuspended).toBe(true);

      // Log suspension activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Admin User',
        'suspend_supplier',
        `Suspended supplier due to poor performance: ${suspensionResult.reason}`,
        'supplier',
        supplierId,
        'Problematic Supplier'
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle permission denied scenarios', async () => {
      const limitedAdminUserId = 'admin-limited';
      const supplierId = 'supplier-1';

      // Mock admin with limited permissions
      const mockLimitedAdminData = [{
        adminUser: {
          id: limitedAdminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'role-limited',
          permissions: null,
          resourcePermissions: {
            suppliers: ['read'] // Only read permission, no approve/reject
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

      // Validate admin does NOT have approval permissions
      const hasApprovalPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'suppliers',
        action: 'approve'
      });

      expect(hasApprovalPermission).toBe(false);

      // Validate admin does NOT have rejection permissions
      const hasRejectionPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'suppliers',
        action: 'reject'
      });

      expect(hasRejectionPermission).toBe(false);

      // But admin should have read permissions
      const hasReadPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'suppliers',
        action: 'read'
      });

      expect(hasReadPermission).toBe(true);
    });
  });
});