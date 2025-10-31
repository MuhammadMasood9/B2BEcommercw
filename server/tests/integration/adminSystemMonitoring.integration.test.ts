import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../../db';
import { AdminAccessControlService } from '../../adminAccessControlService';
import { 
  getSystemHealthMetrics,
  getPlatformAnalytics,
  logAdminActivity 
} from '../../adminOversightService';

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

describe('Admin System Monitoring Integration Tests', () => {
  let accessControlService: AdminAccessControlService;

  beforeEach(() => {
    vi.clearAllMocks();
    accessControlService = new AdminAccessControlService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('System Monitoring and Alerting Functionality', () => {
    it('should complete system health monitoring workflow', async () => {
      const adminUserId = 'admin-sysmon';

      // Step 1: Validate system monitoring permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'system-administrator',
          permissions: null,
          resourcePermissions: {
            system: ['read', 'monitor', 'configure', 'alert'],
            monitoring: ['read', 'access', 'configure'],
            alerts: ['read', 'create', 'manage', 'resolve']
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

      const hasMonitoringPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'system',
        action: 'monitor'
      });

      expect(hasMonitoringPermission).toBe(true);

      // Step 2: Collect system health metrics
      const mockActiveSuppliers = [{ count: 45 }];
      const mockActiveOrders = [{ count: 120 }];

      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockActiveSuppliers)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockActiveOrders)
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      // Mock system load to be high for testing alert generation
      const originalRandom = Math.random;
      Math.random = vi.fn()
        .mockReturnValueOnce(0.95) // High system load (95%)
        .mockReturnValueOnce(0.06) // High error rate (6%)
        .mockReturnValueOnce(0.8)  // High response time (550ms)
        .mockReturnValueOnce(0.98); // High uptime (99.48%)

      const systemHealth = await getSystemHealthMetrics();

      expect(systemHealth.onlineSuppliers).toBe(45);
      expect(systemHealth.activeOrders).toBe(120);
      expect(systemHealth.systemLoad).toBeGreaterThan(90);
      expect(systemHealth.errorRate).toBeGreaterThan(5);
      expect(systemHealth.overallStatus).toBe('critical');

      Math.random = originalRandom;

      // Step 3: Generate system alerts based on metrics
      const systemAlerts = [];

      if (systemHealth.systemLoad > 90) {
        systemAlerts.push({
          id: `alert_${Date.now()}_load`,
          type: 'system_performance',
          severity: 'critical',
          title: 'High System Load Detected',
          message: `System load at ${systemHealth.systemLoad}% - immediate attention required`,
          source: 'system_monitor',
          metrics: { systemLoad: systemHealth.systemLoad },
          recommendedActions: [
            'Check server resource utilization',
            'Review active processes and connections',
            'Consider scaling resources if needed'
          ],
          createdAt: new Date(),
          acknowledged: false
        });
      }

      if (systemHealth.errorRate > 5) {
        systemAlerts.push({
          id: `alert_${Date.now()}_errors`,
          type: 'system_errors',
          severity: 'high',
          title: 'Elevated Error Rate',
          message: `Error rate at ${systemHealth.errorRate}% - investigation needed`,
          source: 'error_monitor',
          metrics: { errorRate: systemHealth.errorRate },
          recommendedActions: [
            'Review application logs for error patterns',
            'Check database connectivity and performance',
            'Verify external service dependencies'
          ],
          createdAt: new Date(),
          acknowledged: false
        });
      }

      expect(systemAlerts.length).toBe(2);
      expect(systemAlerts[0].severity).toBe('critical');
      expect(systemAlerts[1].severity).toBe('high');

      // Step 4: Store alerts in database
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      for (const alert of systemAlerts) {
        // Store alert
        await db.insert.mockImplementation(() => ({
          values: vi.fn().mockReturnValue(Promise.resolve())
        }));
      }

      // Step 5: Send notifications to administrators
      const notificationTargets = [
        { adminId: adminUserId, role: 'system-administrator' },
        { adminId: 'admin-ops', role: 'operations-manager' }
      ];

      const notifications = systemAlerts.flatMap(alert => 
        notificationTargets.map(target => ({
          adminId: target.adminId,
          type: 'system_alert',
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          alertId: alert.id,
          createdAt: new Date()
        }))
      );

      expect(notifications.length).toBe(4); // 2 alerts × 2 admins

      // Step 6: Log monitoring activity
      await logAdminActivity(
        adminUserId,
        'System Administrator',
        'system_health_check',
        `System health check completed: ${systemAlerts.length} alerts generated (Status: ${systemHealth.overallStatus})`,
        'system_monitoring',
        undefined,
        'System Health Check'
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 7: Update system status dashboard
      const dashboardUpdate = {
        timestamp: new Date(),
        systemHealth,
        alerts: systemAlerts,
        notifications: notifications.length,
        status: systemHealth.overallStatus,
        lastUpdatedBy: adminUserId
      };

      expect(dashboardUpdate.status).toBe('critical');
      expect(dashboardUpdate.alerts.length).toBe(2);
    });

    it('should handle alert acknowledgment and resolution workflow', async () => {
      const adminUserId = 'admin-sysmon';
      const alertId = 'alert_12345_load';

      // Step 1: Validate alert management permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'system-administrator',
          permissions: null,
          resourcePermissions: {
            alerts: ['read', 'acknowledge', 'resolve', 'manage'],
            system: ['read', 'monitor']
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

      const hasAlertPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'alerts',
        action: 'acknowledge'
      });

      expect(hasAlertPermission).toBe(true);

      // Step 2: Get alert details
      const mockAlert = {
        id: alertId,
        type: 'system_performance',
        severity: 'critical',
        title: 'High System Load Detected',
        message: 'System load at 95% - immediate attention required',
        source: 'system_monitor',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolved: false,
        resolvedBy: null,
        resolvedAt: null
      };

      (db.query as any).mockResolvedValueOnce({
        rows: [mockAlert]
      });

      // Step 3: Acknowledge alert
      const acknowledgment = {
        alertId: alertId,
        acknowledgedBy: adminUserId,
        acknowledgedAt: new Date(),
        acknowledgmentNotes: 'Investigating high system load - checking server resources and active processes'
      };

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              ...mockAlert,
              acknowledged: true,
              acknowledgedBy: adminUserId,
              acknowledgedAt: acknowledgment.acknowledgedAt
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      expect(acknowledgment.acknowledgedBy).toBe(adminUserId);

      // Step 4: Investigate and take corrective actions
      const investigationActions = [
        {
          action: 'check_server_resources',
          description: 'Reviewed CPU, memory, and disk usage',
          result: 'CPU at 92%, Memory at 78%, Disk I/O elevated',
          timestamp: new Date()
        },
        {
          action: 'identify_high_usage_processes',
          description: 'Identified processes consuming excessive resources',
          result: 'Found 3 long-running database queries causing bottleneck',
          timestamp: new Date()
        },
        {
          action: 'optimize_database_queries',
          description: 'Optimized slow queries and added missing indexes',
          result: 'Query performance improved by 60%',
          timestamp: new Date()
        },
        {
          action: 'restart_services',
          description: 'Restarted application services to clear memory leaks',
          result: 'Memory usage reduced to 45%',
          timestamp: new Date()
        }
      ];

      // Step 5: Verify system improvement
      const postActionMetrics = {
        systemLoad: 65, // Improved from 95%
        errorRate: 1.2, // Improved from 6%
        avgResponseTime: 180, // Improved from 550ms
        overallStatus: 'healthy' as const
      };

      expect(postActionMetrics.systemLoad).toBeLessThan(70);
      expect(postActionMetrics.overallStatus).toBe('healthy');

      // Step 6: Resolve alert
      const resolution = {
        alertId: alertId,
        resolvedBy: adminUserId,
        resolvedAt: new Date(),
        resolution: 'System load reduced through database query optimization and service restart. Monitoring continues.',
        actions: investigationActions,
        postResolutionMetrics: postActionMetrics
      };

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue([{
              ...mockAlert,
              acknowledged: true,
              acknowledgedBy: adminUserId,
              resolved: true,
              resolvedBy: adminUserId,
              resolvedAt: resolution.resolvedAt,
              resolution: resolution.resolution
            }])
          })
        })
      });

      (db.update as any).mockImplementation(mockUpdate);

      // Step 7: Log resolution activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'System Administrator',
        'alert_resolved',
        `Resolved critical system alert: ${mockAlert.title}. System load reduced from 95% to ${postActionMetrics.systemLoad}%`,
        'alert_resolution',
        alertId,
        mockAlert.title
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 8: Update monitoring dashboard
      const resolutionSummary = {
        alertId: alertId,
        resolutionTime: resolution.resolvedAt.getTime() - mockAlert.createdAt.getTime(),
        actionsCount: investigationActions.length,
        systemImprovement: {
          loadReduction: 95 - postActionMetrics.systemLoad,
          errorReduction: 6 - postActionMetrics.errorRate,
          responseImprovement: 550 - postActionMetrics.avgResponseTime
        },
        resolvedBy: adminUserId
      };

      expect(resolutionSummary.resolutionTime).toBeGreaterThan(0);
      expect(resolutionSummary.systemImprovement.loadReduction).toBe(30);
    });

    it('should handle platform analytics and reporting workflow', async () => {
      const adminUserId = 'admin-analytics';

      // Step 1: Validate analytics permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'analytics-manager',
          permissions: null,
          resourcePermissions: {
            analytics: ['read', 'generate', 'export'],
            reports: ['read', 'create', 'schedule'],
            platform: ['read', 'analyze']
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

      const hasAnalyticsPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'analytics',
        action: 'generate'
      });

      expect(hasAnalyticsPermission).toBe(true);

      // Step 2: Generate comprehensive platform analytics
      const mockSupplierStats = [
        { status: 'approved', count: 150 },
        { status: 'pending', count: 25 },
        { status: 'suspended', count: 8 }
      ];

      const mockProductStats = [
        { status: 'approved', count: 2500 },
        { status: 'pending_approval', count: 180 },
        { status: 'rejected', count: 95 }
      ];

      const mockOrderStats = [
        { totalOrders: 5000, totalRevenue: 2500000, totalCommission: 62500 }
      ];

      const mockAvgMetrics = [
        { avgRating: 4.3, avgResponseRate: 87.2 }
      ];

      const mockTopSuppliers = [
        { id: '1', name: 'Top Supplier A', sales: 500000, orders: 800 },
        { id: '2', name: 'Top Supplier B', sales: 450000, orders: 720 }
      ];

      const mockRecentActivity = [
        { action: 'supplier_approved', description: 'New supplier approved', createdAt: new Date() }
      ];

      mockSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue(mockSupplierStats)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue(mockProductStats)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockOrderStats)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockAvgMetrics)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue(mockTopSuppliers)
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockRecentActivity)
            })
          })
        });

      (db.select as any).mockImplementation(mockSelect);

      const platformAnalytics = await getPlatformAnalytics();

      expect(platformAnalytics.totalSuppliers).toBe(183);
      expect(platformAnalytics.activeSuppliers).toBe(150);
      expect(platformAnalytics.totalProducts).toBe(2775);
      expect(platformAnalytics.totalOrders).toBe(5000);
      expect(platformAnalytics.totalRevenue).toBe(2500000);

      // Step 3: Generate trend analysis
      const trendPeriods = [
        { period: 'last_week', suppliers: 145, products: 2650, orders: 4800, revenue: 2400000 },
        { period: 'last_month', suppliers: 135, products: 2400, orders: 4200, revenue: 2100000 },
        { period: 'last_quarter', suppliers: 120, products: 2100, orders: 3500, revenue: 1750000 }
      ];

      const trendAnalysis = {
        supplierGrowth: {
          weekOverWeek: ((150 - 145) / 145) * 100, // 3.45%
          monthOverMonth: ((150 - 135) / 135) * 100, // 11.11%
          quarterOverQuarter: ((150 - 120) / 120) * 100 // 25%
        },
        productGrowth: {
          weekOverWeek: ((2775 - 2650) / 2650) * 100, // 4.72%
          monthOverMonth: ((2775 - 2400) / 2400) * 100, // 15.63%
          quarterOverQuarter: ((2775 - 2100) / 2100) * 100 // 32.14%
        },
        revenueGrowth: {
          weekOverWeek: ((2500000 - 2400000) / 2400000) * 100, // 4.17%
          monthOverMonth: ((2500000 - 2100000) / 2100000) * 100, // 19.05%
          quarterOverQuarter: ((2500000 - 1750000) / 1750000) * 100 // 42.86%
        }
      };

      expect(trendAnalysis.supplierGrowth.monthOverMonth).toBeCloseTo(11.11, 1);
      expect(trendAnalysis.revenueGrowth.quarterOverQuarter).toBeCloseTo(42.86, 1);

      // Step 4: Identify key insights and recommendations
      const insights = [
        {
          type: 'growth_acceleration',
          description: 'Platform showing strong growth across all metrics',
          impact: 'positive',
          confidence: 0.95,
          recommendation: 'Continue current growth strategies and prepare for scaling'
        },
        {
          type: 'supplier_quality',
          description: 'Average supplier rating above 4.0 indicates good quality',
          impact: 'positive',
          confidence: 0.88,
          recommendation: 'Maintain quality standards while scaling supplier base'
        },
        {
          type: 'pending_approvals',
          description: '180 products pending approval may create bottleneck',
          impact: 'neutral',
          confidence: 0.82,
          recommendation: 'Consider increasing moderation team capacity'
        }
      ];

      expect(insights.length).toBe(3);
      expect(insights.filter(i => i.impact === 'positive')).toHaveLength(2);

      // Step 5: Generate comprehensive analytics report
      const analyticsReport = {
        reportId: `analytics_${Date.now()}`,
        generatedBy: adminUserId,
        generatedAt: new Date(),
        period: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        platformMetrics: platformAnalytics,
        trendAnalysis,
        insights,
        recommendations: insights.map(i => i.recommendation),
        executiveSummary: {
          overallHealth: 'excellent',
          keyHighlights: [
            'Strong growth across all key metrics',
            'High supplier quality maintained',
            'Revenue growth exceeding targets'
          ],
          areasForImprovement: [
            'Streamline product approval process',
            'Prepare infrastructure for continued growth'
          ]
        }
      };

      expect(analyticsReport.executiveSummary.overallHealth).toBe('excellent');
      expect(analyticsReport.recommendations.length).toBe(3);

      // Step 6: Schedule automated reports
      const reportSchedule = {
        reportType: 'platform_analytics',
        frequency: 'weekly',
        recipients: ['admin-ceo', 'admin-ops', 'admin-analytics'],
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        format: 'pdf',
        includeCharts: true,
        createdBy: adminUserId
      };

      // Step 7: Log analytics generation activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Analytics Manager',
        'generate_analytics_report',
        `Generated comprehensive platform analytics report: ${analyticsReport.executiveSummary.overallHealth} health status`,
        'analytics_report',
        analyticsReport.reportId,
        'Platform Analytics Report'
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle system performance optimization workflow', async () => {
      const adminUserId = 'admin-performance';

      // Step 1: Validate performance optimization permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'performance-engineer',
          permissions: null,
          resourcePermissions: {
            system: ['read', 'monitor', 'optimize', 'configure'],
            performance: ['read', 'analyze', 'optimize'],
            database: ['read', 'optimize']
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

      const hasOptimizationPermission = await accessControlService.validatePermission({
        adminUserId,
        resource: 'performance',
        action: 'optimize'
      });

      expect(hasOptimizationPermission).toBe(true);

      // Step 2: Analyze current performance metrics
      const performanceBaseline = {
        timestamp: new Date(),
        metrics: {
          avgResponseTime: 450, // ms
          throughput: 1200, // requests/minute
          errorRate: 2.8, // %
          databaseQueryTime: 180, // ms
          memoryUsage: 72, // %
          cpuUsage: 68, // %
          diskIO: 45 // %
        },
        bottlenecks: [
          {
            component: 'database',
            severity: 'medium',
            description: 'Slow queries affecting response time',
            impact: 'Response time increased by 150ms'
          },
          {
            component: 'api_endpoints',
            severity: 'low',
            description: 'Some endpoints not optimally cached',
            impact: 'Unnecessary database calls'
          }
        ]
      };

      expect(performanceBaseline.metrics.avgResponseTime).toBeGreaterThan(400);
      expect(performanceBaseline.bottlenecks.length).toBe(2);

      // Step 3: Implement performance optimizations
      const optimizationActions = [
        {
          action: 'database_query_optimization',
          description: 'Added indexes and optimized slow queries',
          expectedImprovement: 'Reduce query time by 40%',
          implementedAt: new Date(),
          status: 'completed'
        },
        {
          action: 'api_caching_enhancement',
          description: 'Implemented Redis caching for frequently accessed data',
          expectedImprovement: 'Reduce API response time by 25%',
          implementedAt: new Date(),
          status: 'completed'
        },
        {
          action: 'connection_pool_optimization',
          description: 'Optimized database connection pool settings',
          expectedImprovement: 'Improve concurrent request handling',
          implementedAt: new Date(),
          status: 'completed'
        },
        {
          action: 'static_asset_optimization',
          description: 'Enabled compression and CDN for static assets',
          expectedImprovement: 'Reduce page load time by 30%',
          implementedAt: new Date(),
          status: 'completed'
        }
      ];

      expect(optimizationActions.every(action => action.status === 'completed')).toBe(true);

      // Step 4: Measure post-optimization performance
      const performanceAfterOptimization = {
        timestamp: new Date(),
        metrics: {
          avgResponseTime: 280, // Improved from 450ms
          throughput: 1800, // Improved from 1200 req/min
          errorRate: 1.2, // Improved from 2.8%
          databaseQueryTime: 108, // Improved from 180ms
          memoryUsage: 58, // Improved from 72%
          cpuUsage: 52, // Improved from 68%
          diskIO: 35 // Improved from 45%
        },
        improvements: {
          responseTimeImprovement: ((450 - 280) / 450) * 100, // 37.8%
          throughputImprovement: ((1800 - 1200) / 1200) * 100, // 50%
          errorRateImprovement: ((2.8 - 1.2) / 2.8) * 100, // 57.1%
          queryTimeImprovement: ((180 - 108) / 180) * 100 // 40%
        }
      };

      expect(performanceAfterOptimization.improvements.responseTimeImprovement).toBeCloseTo(37.8, 1);
      expect(performanceAfterOptimization.improvements.throughputImprovement).toBe(50);

      // Step 5: Generate performance optimization report
      const optimizationReport = {
        reportId: `perf_opt_${Date.now()}`,
        optimizedBy: adminUserId,
        optimizedAt: new Date(),
        baseline: performanceBaseline,
        actions: optimizationActions,
        results: performanceAfterOptimization,
        summary: {
          totalActions: optimizationActions.length,
          overallImprovement: 'significant',
          keyAchievements: [
            '37.8% reduction in response time',
            '50% increase in throughput',
            '57.1% reduction in error rate',
            '40% improvement in database query performance'
          ],
          nextSteps: [
            'Monitor performance metrics for stability',
            'Plan for additional caching layers',
            'Consider auto-scaling implementation'
          ]
        }
      };

      expect(optimizationReport.summary.totalActions).toBe(4);
      expect(optimizationReport.summary.keyAchievements.length).toBe(4);

      // Step 6: Set up performance monitoring alerts
      const performanceAlerts = [
        {
          metric: 'avgResponseTime',
          threshold: 350, // Alert if response time exceeds 350ms
          severity: 'medium',
          enabled: true
        },
        {
          metric: 'errorRate',
          threshold: 2.0, // Alert if error rate exceeds 2%
          severity: 'high',
          enabled: true
        },
        {
          metric: 'throughput',
          threshold: 1500, // Alert if throughput drops below 1500 req/min
          severity: 'medium',
          enabled: true
        }
      ];

      // Step 7: Log optimization activity
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      await logAdminActivity(
        adminUserId,
        'Performance Engineer',
        'performance_optimization',
        `Completed performance optimization: ${optimizationReport.summary.overallImprovement} improvement achieved`,
        'performance_optimization',
        optimizationReport.reportId,
        'System Performance Optimization'
      );

      expect(db.insert).toHaveBeenCalled();

      // Step 8: Schedule follow-up monitoring
      const monitoringSchedule = {
        type: 'performance_monitoring',
        frequency: 'hourly',
        metrics: ['avgResponseTime', 'throughput', 'errorRate'],
        alertThresholds: performanceAlerts,
        reportingFrequency: 'daily',
        scheduledBy: adminUserId,
        nextCheck: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      };

      expect(monitoringSchedule.metrics.length).toBe(3);
      expect(monitoringSchedule.alertThresholds.length).toBe(3);
    });

    it('should handle permission denied for system monitoring operations', async () => {
      const limitedAdminUserId = 'admin-limited';

      // Mock admin with limited permissions (no system monitoring access)
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
            // No system monitoring permissions
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

      // Validate admin does NOT have system monitoring permissions
      const hasMonitoringPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'system',
        action: 'monitor'
      });

      expect(hasMonitoringPermission).toBe(false);

      const hasAnalyticsPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'analytics',
        action: 'generate'
      });

      expect(hasAnalyticsPermission).toBe(false);

      const hasAlertPermission = await accessControlService.validatePermission({
        adminUserId: limitedAdminUserId,
        resource: 'alerts',
        action: 'manage'
      });

      expect(hasAlertPermission).toBe(false);
    });
  });
});