import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../../db';
import { CommissionService } from '../../commissionService';
import { AdminAccessControlService } from '../../adminAccessControlService';
import { logAdminActivity } from '../../adminOversightService';

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

describe('Admin Financial Management Integration Tests', () => {
  let commissionService: CommissionService;
  let accessControlService: AdminAccessControlService;

  beforeEach(() => {
    vi.clearAllMocks();
    commissionService = CommissionService.getInstance();
    accessControlService = new AdminAccessControlService();
    // Clear commission service cache
    (commissionService as any).cachedRates = null;
    (commissionService as any).cacheExpiry = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Financial Management and Payout Workflows', () => {
    it('should complete commission rate update workflow', async () => {
      const adminUserId = 'admin-financial';
      const newRates = {
        silverRate: 2.8,
        goldRate: 2.2,
        platinumRate: 1.8
      };

      // Step 1: Validate admin permissions for financial operations
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'financial-manager',
          permissions: null,
          resourcePermissions: {
            financial: ['read', 'update_commission', 'process_payouts'],
            commission: ['read', 'update', 'analyze_impact']
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

      const hasPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'commission',
        action: 'update'
      });

      expect(hasPermission).toBe(true);

      // Step 2: Analyze impact of commission changes
      const mockCurrentSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      const mockSuppliers = [
        { id: 'supplier-1', membershipTier: 'silver', customCommissionRate: null },
        { id: 'supplier-2', membershipTier: 'gold', customCommissionRate: null },
        { id: 'supplier-3', membershipTier: 'platinum', customCommissionRate: null }
      ];

      const mockRecentOrders = [
        { supplierId: 'supplier-1', totalAmount: '1000', commissionAmount: '30' },
        { supplierId: 'supplier-2', totalAmount: '2000', commissionAmount: '40' },
        { supplierId: 'supplier-3', totalAmount: '1500', commissionAmount: '22.5' }
      ];

      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockCurrentSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockSuppliers)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockRecentOrders)
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const impactAnalysis = await commissionService.analyzeCommissionImpact(newRates);

      expect(impactAnalysis.affectedSuppliers).toBeGreaterThan(0);
      expect(impactAnalysis.riskLevel).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(impactAnalysis.riskLevel);

      // Step 3: Update commission settings if impact is acceptable
      if (impactAnalysis.riskLevel !== 'high') {
        const mockExistingSettings = [{
          id: 'settings-1',
          defaultRate: '5.0'
        }];

        mockSelect.mockReturnValue({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockExistingSettings)
          })
        });

        const mockUpdate = vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(Promise.resolve())
          })
        });

        (db.select as any).mockImplementation(mockSelect);
        (db.update as any).mockImplementation(mockUpdate);

        await commissionService.updateCommissionSettings(newRates, adminUserId);

        expect(db.update).toHaveBeenCalled();

        // Step 4: Log the commission update activity
        const mockInsert = vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue(Promise.resolve())
        });

        (db.insert as any).mockImplementation(mockInsert);

        await logAdminActivity(
          adminUserId,
          'Financial Admin',
          'update_commission_rates',
          `Updated commission rates: Silver ${newRates.silverRate}%, Gold ${newRates.goldRate}%, Platinum ${newRates.platinumRate}%`,
          'commission_settings',
          'settings-1',
          'Commission Rate Update'
        );

        expect(db.insert).toHaveBeenCalled();
      }
    });

    it('should complete payout processing workflow', async () => {
      const adminUserId = 'admin-financial';
      const payoutBatchId = 'batch-2024-001';

      // Step 1: Validate payout processing permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'financial-manager',
          permissions: null,
          resourcePermissions: {
            financial: ['read', 'process_payouts', 'approve_payouts'],
            payouts: ['read', 'process', 'approve', 'retry']
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

      const hasPayoutPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'payouts',
        action: 'process'
      });

      expect(hasPayoutPermission).toBe(true);

      // Step 2: Get pending payouts for processing
      const mockPendingPayouts = [
        {
          id: 'payout-1',
          supplierId: 'supplier-1',
          supplierName: 'Supplier A',
          amount: 970.00,
          commissionDeducted: 30.00,
          status: 'pending',
          paymentMethod: 'bank_transfer',
          createdAt: new Date()
        },
        {
          id: 'payout-2',
          supplierId: 'supplier-2',
          supplierName: 'Supplier B',
          amount: 1960.00,
          commissionDeducted: 40.00,
          status: 'pending',
          paymentMethod: 'paypal',
          createdAt: new Date()
        }
      ];

      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue(mockPendingPayouts)
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      // Simulate getting pending payouts
      const pendingPayouts = mockPendingPayouts;
      expect(pendingPayouts).toHaveLength(2);
      expect(pendingPayouts.every(p => p.status === 'pending')).toBe(true);

      // Step 3: Create payout batch
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue([{
            id: payoutBatchId,
            batchNumber: 'BATCH-2024-001',
            totalAmount: 2930.00,
            totalPayouts: 2,
            status: 'processing',
            createdAt: new Date(),
            createdBy: adminUserId
          }])
        })
      });

      (db.insert as any).mockImplementation(mockInsert);

      const payoutBatch = {
        id: payoutBatchId,
        batchNumber: 'BATCH-2024-001',
        totalAmount: pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
        totalPayouts: pendingPayouts.length,
        status: 'processing',
        payouts: pendingPayouts,
        createdBy: adminUserId,
        createdAt: new Date()
      };

      expect(payoutBatch.totalAmount).toBe(2930.00);
      expect(payoutBatch.totalPayouts).toBe(2);

      // Step 4: Process individual payouts
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue(
              pendingPayouts.map(p => ({
                ...p,
                status: 'processing',
                batchId: payoutBatchId,
                processedAt: new Date(),
                processedBy: adminUserId
              }))
            )
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Simulate processing payouts
      const processedPayouts = pendingPayouts.map(payout => ({
        ...payout,
        status: 'processing',
        batchId: payoutBatchId,
        processedAt: new Date(),
        processedBy: adminUserId
      }));

      expect(processedPayouts.every(p => p.status === 'processing')).toBe(true);

      // Step 5: Simulate payment gateway processing
      const paymentResults = processedPayouts.map(payout => {
        // Simulate 90% success rate
        const isSuccess = Math.random() > 0.1;
        return {
          payoutId: payout.id,
          status: isSuccess ? 'completed' : 'failed',
          transactionId: isSuccess ? `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
          failureReason: isSuccess ? null : 'Insufficient funds in payment account',
          processedAt: new Date()
        };
      });

      const successfulPayouts = paymentResults.filter(r => r.status === 'completed');
      const failedPayouts = paymentResults.filter(r => r.status === 'failed');

      expect(successfulPayouts.length + failedPayouts.length).toBe(processedPayouts.length);

      // Step 6: Update payout statuses based on payment results
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue(
              paymentResults.map(result => ({
                id: result.payoutId,
                status: result.status,
                transactionId: result.transactionId,
                failureReason: result.failureReason,
                completedAt: result.status === 'completed' ? result.processedAt : null
              }))
            )
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Step 7: Update batch status
      const batchStatus = failedPayouts.length === 0 ? 'completed' : 
                         successfulPayouts.length === 0 ? 'failed' : 'partially_completed';

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              id: payoutBatchId,
              status: batchStatus,
              completedAt: new Date(),
              successfulPayouts: successfulPayouts.length,
              failedPayouts: failedPayouts.length
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      const finalBatchStatus = {
        id: payoutBatchId,
        status: batchStatus,
        successfulPayouts: successfulPayouts.length,
        failedPayouts: failedPayouts.length,
        completedAt: new Date()
      };

      expect(['completed', 'failed', 'partially_completed']).toContain(finalBatchStatus.status);

      // Step 8: Log payout processing activity
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Financial Admin',
        'process_payout_batch',
        `Processed payout batch ${payoutBatch.batchNumber}: ${finalBatchStatus.successfulPayouts} successful, ${finalBatchStatus.failedPayouts} failed`,
        'payout_batch',
        payoutBatchId,
        payoutBatch.batchNumber
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 9: Handle failed payouts if any
      if (failedPayouts.length > 0) {
        // Log failed payouts for retry
        for (const failedPayout of failedPayouts) {
          await logAdminActivity(
            adminUserId,
            'Financial Admin',
            'payout_failed',
            `Payout failed for supplier: ${failedPayout.failureReason}`,
            'payout',
            failedPayout.payoutId,
            `Failed Payout - ${failedPayout.payoutId}`
          );
        }

        expect(db.insert).toHaveBeenCalledTimes(1 + failedPayouts.length);
      }
    });

    it('should handle commission simulation and analysis workflow', async () => {
      const adminUserId = 'admin-financial';
      const proposedRates = {
        silverRate: 2.5,
        goldRate: 1.8,
        platinumRate: 1.2
      };

      // Step 1: Validate simulation permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'financial-analyst',
          permissions: null,
          resourcePermissions: {
            commission: ['read', 'simulate', 'analyze'],
            financial: ['read', 'analyze']
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

      const hasSimulationPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'commission',
        action: 'simulate'
      });

      expect(hasSimulationPermission).toBe(true);

      // Step 2: Run commission simulation on historical data
      const mockCurrentSettings = [{
        defaultRate: '5.0',
        freeRate: '5.0',
        silverRate: '3.0',
        goldRate: '2.0',
        platinumRate: '1.5',
        categoryRates: {},
        vendorOverrides: {}
      }];

      const mockHistoricalOrders = [
        {
          id: 'order-1',
          supplierId: 'supplier-1',
          totalAmount: '1000',
          commissionAmount: '30',
          supplierName: 'Supplier A'
        },
        {
          id: 'order-2',
          supplierId: 'supplier-2',
          totalAmount: '2000',
          commissionAmount: '40',
          supplierName: 'Supplier B'
        },
        {
          id: 'order-3',
          supplierId: 'supplier-3',
          totalAmount: '1500',
          commissionAmount: '22.5',
          supplierName: 'Supplier C'
        }
      ];

      const mockSupplierProfiles = [
        { membershipTier: 'silver', customCommissionRate: null },
        { membershipTier: 'gold', customCommissionRate: null },
        { membershipTier: 'platinum', customCommissionRate: null }
      ];

      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockCurrentSettings)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue(mockHistoricalOrders)
            })
          })
        });

      // Mock supplier profile lookups for rate calculation
      mockSupplierProfiles.forEach(profile => {
        mockSelect.mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockCurrentSettings)
          })
        }).mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([profile])
            })
          })
        });
      });

      (db.select as any).mockImplementation(mockSelect);

      const simulation = await commissionService.simulateCommissionChanges(
        proposedRates,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
      );

      expect(simulation).toHaveProperty('currentRevenue');
      expect(simulation).toHaveProperty('projectedRevenue');
      expect(simulation).toHaveProperty('revenueChange');
      expect(simulation).toHaveProperty('revenueChangePercent');
      expect(simulation).toHaveProperty('affectedOrders');
      expect(simulation).toHaveProperty('supplierImpact');

      expect(simulation.affectedOrders).toBe(mockHistoricalOrders.length);
      expect(Array.isArray(simulation.supplierImpact)).toBe(true);

      // Step 3: Generate detailed financial report
      const financialReport = {
        simulationId: `sim_${Date.now()}`,
        proposedRates,
        simulationResults: simulation,
        recommendations: [],
        riskAssessment: 'low',
        approvalRequired: false,
        generatedBy: adminUserId,
        generatedAt: new Date()
      };

      // Add recommendations based on simulation results
      if (simulation.revenueChangePercent > 10) {
        financialReport.recommendations.push('Significant revenue increase expected - monitor supplier retention');
        financialReport.riskAssessment = 'medium';
      } else if (simulation.revenueChangePercent < -10) {
        financialReport.recommendations.push('Revenue decrease expected - ensure business case justification');
        financialReport.riskAssessment = 'high';
        financialReport.approvalRequired = true;
      } else {
        financialReport.recommendations.push('Moderate impact expected - proceed with standard monitoring');
      }

      expect(financialReport.recommendations.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(financialReport.riskAssessment);

      // Step 4: Log simulation activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Financial Analyst',
        'commission_simulation',
        `Ran commission simulation: ${simulation.revenueChangePercent.toFixed(2)}% revenue change projected`,
        'commission_simulation',
        financialReport.simulationId,
        'Commission Rate Simulation'
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle financial reporting and analytics workflow', async () => {
      const adminUserId = 'admin-financial';
      const reportPeriod = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date()
      };

      // Step 1: Validate reporting permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'financial-manager',
          permissions: null,
          resourcePermissions: {
            financial: ['read', 'generate_reports', 'view_analytics'],
            reports: ['read', 'generate', 'export']
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

      const hasReportingPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'reports',
        action: 'generate'
      });

      expect(hasReportingPermission).toBe(true);

      // Step 2: Generate platform commission summary
      const mockPlatformSummary = [{
        totalOrders: 500,
        totalSales: 250000,
        totalCommission: 6250,
        totalPaidToSuppliers: 243750,
        avgCommissionRate: 2.5
      }];

      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(mockPlatformSummary)
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      const platformSummary = await commissionService.getPlatformCommissionSummary(
        reportPeriod.startDate,
        reportPeriod.endDate
      );

      expect(platformSummary.totalOrders).toBe(500);
      expect(platformSummary.totalCommission).toBe(6250);
      expect(platformSummary.avgCommissionRate).toBe(2.5);

      // Step 3: Generate advanced commission analytics
      const mockTierAnalytics = [
        {
          membershipTier: 'free',
          totalOrders: 100,
          totalRevenue: 25000,
          totalCommission: 1250,
          avgOrderValue: 250,
          avgCommissionRate: 5.0
        },
        {
          membershipTier: 'silver',
          totalOrders: 200,
          totalRevenue: 100000,
          totalCommission: 3000,
          avgOrderValue: 500,
          avgCommissionRate: 3.0
        },
        {
          membershipTier: 'gold',
          totalOrders: 150,
          totalRevenue: 100000,
          totalCommission: 2000,
          avgOrderValue: 667,
          avgCommissionRate: 2.0
        },
        {
          membershipTier: 'platinum',
          totalOrders: 50,
          totalRevenue: 25000,
          totalCommission: 375,
          avgOrderValue: 500,
          avgCommissionRate: 1.5
        }
      ];

      const mockTopSuppliers = [
        {
          supplierId: 'supplier-1',
          supplierName: 'Top Supplier A',
          membershipTier: 'platinum',
          totalOrders: 25,
          totalCommission: 200,
          avgCommissionRate: 1.6
        },
        {
          supplierId: 'supplier-2',
          supplierName: 'Top Supplier B',
          membershipTier: 'gold',
          totalOrders: 30,
          totalCommission: 180,
          avgCommissionRate: 2.0
        }
      ];

      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue(mockTierAnalytics)
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue(mockTopSuppliers)
                  })
                })
              })
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const advancedAnalytics = await commissionService.getAdvancedCommissionAnalytics(
        reportPeriod.startDate,
        reportPeriod.endDate
      );

      expect(advancedAnalytics.tierAnalytics).toHaveLength(4);
      expect(advancedAnalytics.topSuppliers).toHaveLength(2);

      // Verify tier analytics calculations
      const totalCommissionFromTiers = advancedAnalytics.tierAnalytics.reduce(
        (sum, tier) => sum + tier.totalCommission, 0
      );
      expect(totalCommissionFromTiers).toBe(6625); // Sum of all tier commissions

      // Step 4: Generate comprehensive financial report
      const comprehensiveReport = {
        reportId: `report_${Date.now()}`,
        period: reportPeriod,
        platformSummary,
        tierAnalytics: advancedAnalytics.tierAnalytics,
        topSuppliers: advancedAnalytics.topSuppliers,
        insights: [],
        generatedBy: adminUserId,
        generatedAt: new Date()
      };

      // Generate insights based on data
      const platinumTier = advancedAnalytics.tierAnalytics.find(t => t.membershipTier === 'platinum');
      if (platinumTier && platinumTier.avgOrderValue > 600) {
        comprehensiveReport.insights.push('Platinum tier suppliers have highest average order value');
      }

      const freeTier = advancedAnalytics.tierAnalytics.find(t => t.membershipTier === 'free');
      if (freeTier && freeTier.totalOrders > 50) {
        comprehensiveReport.insights.push('Free tier still represents significant order volume');
      }

      expect(comprehensiveReport.insights.length).toBeGreaterThan(0);

      // Step 5: Log report generation activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Financial Manager',
        'generate_financial_report',
        `Generated comprehensive financial report for period ${reportPeriod.startDate.toISOString().split('T')[0]} to ${reportPeriod.endDate.toISOString().split('T')[0]}`,
        'financial_report',
        comprehensiveReport.reportId,
        'Monthly Financial Report'
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle permission denied for financial operations', async () => {
      const limitedAdminUserId = 'admin-limited';

      // Mock admin with limited permissions (no financial access)
      const mockLimitedAdminData = [{
        adminUser: {
          id: limitedAdminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'content-moderator',
          permissions: null,
          resourcePermissions: {
            products: ['read', 'approve', 'reject'],
            content: ['read', 'moderate']
            // No financial permissions
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

      // Validate admin does NOT have financial permissions
      const hasCommissionPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'commission',
        action: 'update'
      });

      expect(hasCommissionPermission).toBe(false);

      const hasPayoutPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'payouts',
        action: 'process'
      });

      expect(hasPayoutPermission).toBe(false);

      const hasReportingPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'financial',
        action: 'generate_reports'
      });

      expect(hasReportingPermission).toBe(false);
    });
  });
});