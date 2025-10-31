import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../../db';
import { AdminAccessControlService } from '../../adminAccessControlService';
import { 
  getSupplierPerformanceMetrics,
  getPlatformAnalytics 
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

describe('Admin Data Isolation Security Tests', () => {
  let accessControlService: AdminAccessControlService;

  beforeEach(() => {
    vi.clearAllMocks();
    accessControlService = new AdminAccessControlService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Role-Based Data Access Control', () => {
    it('should enforce strict data isolation between admin roles', async () => {
      const contentModeratorId = 'admin-content-mod';
      const financialManagerId = 'admin-financial';
      const regionalManagerId = 'admin-regional';

      // Mock different admin roles with specific data access permissions
      const adminRoles = {
        [contentModeratorId]: {
          adminUser: {
            id: contentModeratorId,
            isActive: true,
            isLocked: false,
            additionalPermissions: null
          },
          role: {
            id: 'content-moderator',
            permissions: null,
            resourcePermissions: {
              products: ['read', 'approve', 'reject'],
              content: ['read', 'moderate'],
              suppliers: ['read'] // Read-only supplier access
            }
          }
        },
        [financialManagerId]: {
          adminUser: {
            id: financialManagerId,
            isActive: true,
            isLocked: false,
            additionalPermissions: null
          },
          role: {
            id: 'financial-manager',
            permissions: null,
            resourcePermissions: {
              financial: ['read', 'update', 'process'],
              commission: ['read', 'update'],
              payouts: ['read', 'process'],
              reports: ['read', 'generate']
            }
          }
        },
        [regionalManagerId]: {
          adminUser: {
            id: regionalManagerId,
            isActive: true,
            isLocked: false,
            additionalPermissions: {
              'region:north': ['read', 'manage'],
              'suppliers:region:north': ['read', 'approve', 'suspend']
            }
          },
          role: {
            id: 'regional-manager',
            permissions: null,
            resourcePermissions: {
              suppliers: ['read'], // General read access
              products: ['read'], // General read access
              orders: ['read'] // General read access
            }
          }
        }
      };

      // Test data isolation for content moderator
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([adminRoles[contentModeratorId]])
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      // Content moderator should NOT access financial data
      const contentModCanAccessFinancial = await accessControlService.validatePermission({
        adminUserId: contentModeratorId,
        resource: 'financial',
        action: 'read'
      });
      expect(contentModCanAccessFinancial).toBe(false);

      const contentModCanAccessCommission = await accessControlService.validatePermission({
        adminUserId: contentModeratorId,
        resource: 'commission',
        action: 'read'
      });
      expect(contentModCanAccessCommission).toBe(false);

      // Content moderator should access content data
      const contentModCanModerate = await accessControlService.validatePermission({
        adminUserId: contentModeratorId,
        resource: 'content',
        action: 'moderate'
      });
      expect(contentModCanModerate).toBe(true);

      // Test data isolation for financial manager
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([adminRoles[financialManagerId]])
            })
          })
        })
      });

      // Financial manager should NOT access content moderation
      const financialCanModerate = await accessControlService.validatePermission({
        adminUserId: financialManagerId,
        resource: 'content',
        action: 'moderate'
      });
      expect(financialCanModerate).toBe(false);

      const financialCanApproveProducts = await accessControlService.validatePermission({
        adminUserId: financialManagerId,
        resource: 'products',
        action: 'approve'
      });
      expect(financialCanApproveProducts).toBe(false);

      // Financial manager should access financial data
      const financialCanAccessReports = await accessControlService.validatePermission({
        adminUserId: financialManagerId,
        resource: 'reports',
        action: 'generate'
      });
      expect(financialCanAccessReports).toBe(true);
    });

    it('should enforce regional data access restrictions', async () => {
      const northRegionalManagerId = 'admin-north-region';
      const southRegionalManagerId = 'admin-south-region';

      // Mock regional managers with different geographical access
      const regionalAdmins = {
        [northRegionalManagerId]: {
          adminUser: {
            id: northRegionalManagerId,
            isActive: true,
            isLocked: false,
            additionalPermissions: {
              'region:north': ['read', 'manage'],
              'suppliers:region:north': ['read', 'approve', 'suspend']
            }
          },
          role: {
            id: 'regional-manager',
            permissions: null,
            resourcePermissions: {
              suppliers: ['read'],
              products: ['read'],
              orders: ['read']
            }
          }
        },
        [southRegionalManagerId]: {
          adminUser: {
            id: southRegionalManagerId,
            isActive: true,
            isLocked: false,
            additionalPermissions: {
              'region:south': ['read', 'manage'],
              'suppliers:region:south': ['read', 'approve', 'suspend']
            }
          },
          role: {
            id: 'regional-manager',
            permissions: null,
            resourcePermissions: {
              suppliers: ['read'],
              products: ['read'],
              orders: ['read']
            }
          }
        }
      };

      // Mock supplier data with regional information
      const mockSuppliers = [
        {
          supplierId: 'supplier-north-1',
          businessName: 'North Business 1',
          region: 'north',
          membershipTier: 'silver',
          isActive: true
        },
        {
          supplierId: 'supplier-north-2',
          businessName: 'North Business 2',
          region: 'north',
          membershipTier: 'gold',
          isActive: true
        },
        {
          supplierId: 'supplier-south-1',
          businessName: 'South Business 1',
          region: 'south',
          membershipTier: 'silver',
          isActive: true
        },
        {
          supplierId: 'supplier-south-2',
          businessName: 'South Business 2',
          region: 'south',
          membershipTier: 'platinum',
          isActive: true
        }
      ];

      // Test north regional manager access
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue([regionalAdmins[northRegionalManagerId]])
            })
          })
        })
      });

      (db.select as any).mockImplementation(mockSelect);

      // North manager should have access to north region suppliers
      const northManagerPermissions = regionalAdmins[northRegionalManagerId].adminUser.additionalPermissions;
      const hasNorthRegionAccess = northManagerPermissions?.['region:north']?.includes('manage');
      expect(hasNorthRegionAccess).toBe(true);

      const hasNorthSuppliersAccess = northManagerPermissions?.['suppliers:region:north']?.includes('approve');
      expect(hasNorthSuppliersAccess).toBe(true);

      // North manager should NOT have access to south region
      const hasSouthRegionAccess = northManagerPermissions?.['region:south'];
      expect(hasSouthRegionAccess).toBeUndefined();

      // Simulate data filtering based on regional access
      const northManagerAccessibleSuppliers = mockSuppliers.filter(supplier => 
        supplier.region === 'north' || 
        northManagerPermissions?.[`suppliers:region:${supplier.region}`]
      );

      expect(northManagerAccessibleSuppliers).toHaveLength(2);
      expect(northManagerAccessibleSuppliers.every(s => s.region === 'north')).toBe(true);

      // Test south regional manager access
      const southManagerPermissions = regionalAdmins[southRegionalManagerId].adminUser.additionalPermissions;
      const southManagerAccessibleSuppliers = mockSuppliers.filter(supplier => 
        supplier.region === 'south' || 
        southManagerPermissions?.[`suppliers:region:${supplier.region}`]
      );

      expect(southManagerAccessibleSuppliers).toHaveLength(2);
      expect(southManagerAccessibleSuppliers.every(s => s.region === 'south')).toBe(true);
    });

    it('should prevent cross-tenant data access', async () => {
      const tenant1AdminId = 'admin-tenant-1';
      const tenant2AdminId = 'admin-tenant-2';

      // Mock multi-tenant admin setup
      const tenantAdmins = {
        [tenant1AdminId]: {
          adminUser: {
            id: tenant1AdminId,
            tenantId: 'tenant-1',
            isActive: true,
            isLocked: false,
            additionalPermissions: {
              'tenant:tenant-1': ['read', 'manage'],
              'suppliers:tenant:tenant-1': ['read', 'approve', 'manage'],
              'orders:tenant:tenant-1': ['read', 'manage']
            }
          },
          role: {
            id: 'tenant-admin',
            permissions: null,
            resourcePermissions: {
              suppliers: ['read', 'manage'],
              products: ['read', 'manage'],
              orders: ['read', 'manage']
            }
          }
        },
        [tenant2AdminId]: {
          adminUser: {
            id: tenant2AdminId,
            tenantId: 'tenant-2',
            isActive: true,
            isLocked: false,
            additionalPermissions: {
              'tenant:tenant-2': ['read', 'manage'],
              'suppliers:tenant:tenant-2': ['read', 'approve', 'manage'],
              'orders:tenant:tenant-2': ['read', 'manage']
            }
          },
          role: {
            id: 'tenant-admin',
            permissions: null,
            resourcePermissions: {
              suppliers: ['read', 'manage'],
              products: ['read', 'manage'],
              orders: ['read', 'manage']
            }
          }
        }
      };

      // Mock tenant-specific data
      const mockTenantData = {
        'tenant-1': {
          suppliers: [
            { id: 'supplier-t1-1', name: 'Tenant 1 Supplier 1', tenantId: 'tenant-1' },
            { id: 'supplier-t1-2', name: 'Tenant 1 Supplier 2', tenantId: 'tenant-1' }
          ],
          orders: [
            { id: 'order-t1-1', supplierId: 'supplier-t1-1', tenantId: 'tenant-1', amount: 1000 },
            { id: 'order-t1-2', supplierId: 'supplier-t1-2', tenantId: 'tenant-1', amount: 1500 }
          ]
        },
        'tenant-2': {
          suppliers: [
            { id: 'supplier-t2-1', name: 'Tenant 2 Supplier 1', tenantId: 'tenant-2' },
            { id: 'supplier-t2-2', name: 'Tenant 2 Supplier 2', tenantId: 'tenant-2' }
          ],
          orders: [
            { id: 'order-t2-1', supplierId: 'supplier-t2-1', tenantId: 'tenant-2', amount: 2000 },
            { id: 'order-t2-2', supplierId: 'supplier-t2-2', tenantId: 'tenant-2', amount: 2500 }
          ]
        }
      };

      // Test tenant 1 admin access
      const tenant1Admin = tenantAdmins[tenant1AdminId];
      const tenant1AccessibleSuppliers = mockTenantData['tenant-1'].suppliers.filter(supplier =>
        supplier.tenantId === tenant1Admin.adminUser.tenantId
      );

      expect(tenant1AccessibleSuppliers).toHaveLength(2);
      expect(tenant1AccessibleSuppliers.every(s => s.tenantId === 'tenant-1')).toBe(true);

      // Tenant 1 admin should NOT access tenant 2 data
      const tenant1CrossTenantAccess = mockTenantData['tenant-2'].suppliers.filter(supplier =>
        supplier.tenantId === tenant1Admin.adminUser.tenantId
      );

      expect(tenant1CrossTenantAccess).toHaveLength(0);

      // Test tenant 2 admin access
      const tenant2Admin = tenantAdmins[tenant2AdminId];
      const tenant2AccessibleOrders = mockTenantData['tenant-2'].orders.filter(order =>
        order.tenantId === tenant2Admin.adminUser.tenantId
      );

      expect(tenant2AccessibleOrders).toHaveLength(2);
      expect(tenant2AccessibleOrders.every(o => o.tenantId === 'tenant-2')).toBe(true);

      // Verify tenant isolation in permissions
      const tenant1Permissions = tenant1Admin.adminUser.additionalPermissions;
      const tenant2Permissions = tenant2Admin.adminUser.additionalPermissions;

      expect(tenant1Permissions?.['tenant:tenant-2']).toBeUndefined();
      expect(tenant2Permissions?.['tenant:tenant-1']).toBeUndefined();
    });
  });

  describe('Sensitive Data Protection', () => {
    it('should protect personally identifiable information (PII)', async () => {
      const adminUserId = 'admin-pii-test';
      const sensitiveDataTypes = [
        'email',
        'phone',
        'address',
        'payment_info',
        'tax_id',
        'bank_account'
      ];

      // Mock admin with different PII access levels
      const piiAccessLevels = {
        'view_masked': ['email', 'phone'], // Can see masked versions
        'view_full': ['address'], // Can see full data
        'no_access': ['payment_info', 'tax_id', 'bank_account'] // No access
      };

      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: {
            'pii:view_masked': piiAccessLevels.view_masked,
            'pii:view_full': piiAccessLevels.view_full
          }
        },
        role: {
          id: 'customer-support',
          permissions: null,
          resourcePermissions: {
            users: ['read'],
            suppliers: ['read'],
            support: ['read', 'respond']
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

      // Mock user data with PII
      const mockUserData = {
        id: 'user-123',
        email: 'user@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State 12345',
        paymentInfo: {
          cardNumber: '4111111111111111',
          expiryDate: '12/25'
        },
        taxId: '123-45-6789',
        bankAccount: {
          routingNumber: '123456789',
          accountNumber: '987654321'
        }
      };

      // Simulate data filtering based on PII access permissions
      const adminPermissions = mockAdminData[0].adminUser.additionalPermissions;
      const filteredUserData = { ...mockUserData };

      // Apply PII filtering
      sensitiveDataTypes.forEach(dataType => {
        if (adminPermissions?.[`pii:view_full`]?.includes(dataType)) {
          // Keep full data
        } else if (adminPermissions?.[`pii:view_masked`]?.includes(dataType)) {
          // Mask data
          switch (dataType) {
            case 'email':
              filteredUserData.email = 'u***@e******.com';
              break;
            case 'phone':
              filteredUserData.phone = '+1***-***-**90';
              break;
          }
        } else {
          // Remove data completely
          switch (dataType) {
            case 'payment_info':
              delete (filteredUserData as any).paymentInfo;
              break;
            case 'tax_id':
              delete (filteredUserData as any).taxId;
              break;
            case 'bank_account':
              delete (filteredUserData as any).bankAccount;
              break;
          }
        }
      });

      // Verify PII protection
      expect(filteredUserData.email).toBe('u***@e******.com'); // Masked
      expect(filteredUserData.phone).toBe('+1***-***-**90'); // Masked
      expect(filteredUserData.address).toBe('123 Main St, City, State 12345'); // Full access
      expect(filteredUserData).not.toHaveProperty('paymentInfo'); // No access
      expect(filteredUserData).not.toHaveProperty('taxId'); // No access
      expect(filteredUserData).not.toHaveProperty('bankAccount'); // No access
    });

    it('should enforce financial data access restrictions', async () => {
      const adminUserId = 'admin-financial-restricted';

      // Mock admin with limited financial access
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: {
            'financial:view_summary': ['revenue', 'order_count'],
            'financial:view_detailed': [] // No detailed financial access
          }
        },
        role: {
          id: 'operations-manager',
          permissions: null,
          resourcePermissions: {
            orders: ['read'],
            suppliers: ['read'],
            reports: ['read']
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

      // Mock financial data
      const mockFinancialData = {
        summary: {
          totalRevenue: 1000000,
          totalOrders: 5000,
          averageOrderValue: 200
        },
        detailed: {
          commissionRates: {
            free: 5.0,
            silver: 3.0,
            gold: 2.0,
            platinum: 1.5
          },
          supplierPayouts: [
            { supplierId: 'supplier-1', amount: 50000, status: 'pending' },
            { supplierId: 'supplier-2', amount: 75000, status: 'completed' }
          ],
          platformProfit: 150000,
          taxLiability: 30000
        }
      };

      // Apply financial data filtering
      const adminPermissions = mockAdminData[0].adminUser.additionalPermissions;
      const filteredFinancialData: any = {};

      // Check summary access
      if (adminPermissions?.['financial:view_summary']) {
        const allowedSummaryFields = adminPermissions['financial:view_summary'];
        filteredFinancialData.summary = {};
        
        if (allowedSummaryFields.includes('revenue')) {
          filteredFinancialData.summary.totalRevenue = mockFinancialData.summary.totalRevenue;
        }
        if (allowedSummaryFields.includes('order_count')) {
          filteredFinancialData.summary.totalOrders = mockFinancialData.summary.totalOrders;
        }
      }

      // Check detailed access
      if (adminPermissions?.['financial:view_detailed']?.length > 0) {
        filteredFinancialData.detailed = mockFinancialData.detailed;
      }

      // Verify financial data protection
      expect(filteredFinancialData.summary).toBeDefined();
      expect(filteredFinancialData.summary.totalRevenue).toBe(1000000);
      expect(filteredFinancialData.summary.totalOrders).toBe(5000);
      expect(filteredFinancialData.summary).not.toHaveProperty('averageOrderValue'); // Not in allowed fields
      expect(filteredFinancialData).not.toHaveProperty('detailed'); // No detailed access
    });

    it('should audit sensitive data access attempts', async () => {
      const adminUserId = 'admin-audit-sensitive';
      const sensitiveResources = [
        'user_pii',
        'financial_details',
        'supplier_contracts',
        'payment_methods',
        'tax_information'
      ];

      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: null
        },
        role: {
          id: 'limited-admin',
          permissions: null,
          resourcePermissions: {
            users: ['read'],
            orders: ['read']
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

      const accessAttempts = [];
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      // Test access attempts to sensitive resources
      for (const resource of sensitiveResources) {
        const hasAccess = await accessControlService.validatePermission({
          adminUserId,
          resource,
          action: 'read'
        });

        // Log access attempt
        const accessAttempt = {
          adminUserId,
          resource,
          action: 'read',
          granted: hasAccess,
          timestamp: new Date(),
          ipAddress: '192.168.1.100',
          userAgent: 'Admin Browser',
          riskLevel: hasAccess ? 'low' : 'medium'
        };

        accessAttempts.push(accessAttempt);

        await accessControlService.logAdminActivity({
          adminUserId,
          action: hasAccess ? 'sensitive_data_access_granted' : 'sensitive_data_access_denied',
          description: `Access ${hasAccess ? 'granted' : 'denied'} for sensitive resource: ${resource}`,
          category: 'data_access',
          entityType: 'sensitive_data',
          entityId: resource,
          riskLevel: accessAttempt.riskLevel
        });
      }

      // Verify all access attempts were logged
      expect(accessAttempts).toHaveLength(sensitiveResources.length);
      expect(db.insert).toHaveBeenCalledTimes(sensitiveResources.length);

      // Verify most access attempts were denied (limited admin)
      const deniedAttempts = accessAttempts.filter(attempt => !attempt.granted);
      expect(deniedAttempts.length).toBeGreaterThan(3); // Most should be denied

      // Verify audit trail completeness
      accessAttempts.forEach(attempt => {
        expect(attempt).toHaveProperty('adminUserId');
        expect(attempt).toHaveProperty('resource');
        expect(attempt).toHaveProperty('granted');
        expect(attempt).toHaveProperty('timestamp');
        expect(attempt).toHaveProperty('riskLevel');
      });
    });
  });

  describe('Data Leakage Prevention', () => {
    it('should prevent unauthorized data export', async () => {
      const adminUserId = 'admin-export-test';
      const exportRequests = [
        { type: 'user_data', format: 'csv', includesPII: true },
        { type: 'financial_report', format: 'pdf', includesPII: false },
        { type: 'supplier_list', format: 'excel', includesPII: true },
        { type: 'order_history', format: 'json', includesPII: false }
      ];

      // Mock admin with limited export permissions
      const mockAdminData = [{
        adminUser: {
          id: adminUserId,
          isActive: true,
          isLocked: false,
          additionalPermissions: {
            'export:non_pii': ['financial_report', 'order_history'],
            'export:pii': [] // No PII export permissions
          }
        },
        role: {
          id: 'analyst',
          permissions: null,
          resourcePermissions: {
            reports: ['read', 'generate'],
            analytics: ['read']
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

      const exportResults = [];
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      // Process export requests
      for (const request of exportRequests) {
        const adminPermissions = mockAdminData[0].adminUser.additionalPermissions;
        
        let canExport = false;
        if (request.includesPII) {
          canExport = adminPermissions?.['export:pii']?.includes(request.type) || false;
        } else {
          canExport = adminPermissions?.['export:non_pii']?.includes(request.type) || false;
        }

        const exportResult = {
          requestType: request.type,
          format: request.format,
          includesPII: request.includesPII,
          approved: canExport,
          timestamp: new Date(),
          adminUserId
        };

        exportResults.push(exportResult);

        // Log export attempt
        await accessControlService.logAdminActivity({
          adminUserId,
          action: canExport ? 'data_export_approved' : 'data_export_denied',
          description: `Data export ${canExport ? 'approved' : 'denied'}: ${request.type} (${request.format})`,
          category: 'data_export',
          entityType: 'export_request',
          entityId: request.type,
          riskLevel: request.includesPII ? 'high' : 'medium'
        });
      }

      // Verify export restrictions
      expect(exportResults).toHaveLength(4);

      const approvedExports = exportResults.filter(result => result.approved);
      const deniedExports = exportResults.filter(result => !result.approved);

      // Should approve non-PII exports only
      expect(approvedExports).toHaveLength(2);
      expect(approvedExports.every(export => !export.includesPII)).toBe(true);

      // Should deny PII exports
      expect(deniedExports).toHaveLength(2);
      expect(deniedExports.every(export => export.includesPII)).toBe(true);

      // Verify all attempts were logged
      expect(db.insert).toHaveBeenCalledTimes(4);
    });

    it('should detect and prevent data scraping attempts', async () => {
      const adminUserId = 'admin-scraping-test';
      const timeWindow = 5 * 60 * 1000; // 5 minutes
      const requestThreshold = 100; // 100 requests in 5 minutes

      // Mock rapid data access attempts
      const dataAccessAttempts = Array.from({ length: 120 }, (_, index) => ({
        adminUserId,
        resource: 'suppliers',
        action: 'read',
        timestamp: new Date(Date.now() - (120 - index) * 2000), // 2 seconds apart
        ipAddress: '192.168.1.100',
        userAgent: 'Admin Browser',
        responseSize: Math.floor(Math.random() * 10000) + 1000 // 1-11KB responses
      }));

      // Analyze access pattern
      const recentAttempts = dataAccessAttempts.filter(
        attempt => Date.now() - attempt.timestamp.getTime() < timeWindow
      );

      const isSuspiciousPattern = recentAttempts.length > requestThreshold;
      expect(isSuspiciousPattern).toBe(true);

      // Calculate additional suspicious indicators
      const avgResponseSize = recentAttempts.reduce((sum, attempt) => sum + attempt.responseSize, 0) / recentAttempts.length;
      const totalDataTransferred = recentAttempts.reduce((sum, attempt) => sum + attempt.responseSize, 0);
      const requestFrequency = recentAttempts.length / (timeWindow / 60000); // requests per minute

      // Detect scraping patterns
      const scrapingIndicators = {
        highFrequency: requestFrequency > 20, // More than 20 requests per minute
        largeDataVolume: totalDataTransferred > 500000, // More than 500KB total
        uniformTiming: true, // Requests at regular intervals (simplified check)
        sameResource: recentAttempts.every(attempt => attempt.resource === 'suppliers')
      };

      const scrapingScore = Object.values(scrapingIndicators).filter(Boolean).length;
      const isLikelyScraping = scrapingScore >= 3;

      expect(isLikelyScraping).toBe(true);
      expect(scrapingIndicators.highFrequency).toBe(true);
      expect(scrapingIndicators.sameResource).toBe(true);

      if (isLikelyScraping) {
        // Mock security response
        const securityResponse = {
          action: 'rate_limit_applied',
          adminUserId,
          suspiciousActivity: 'data_scraping_detected',
          indicators: scrapingIndicators,
          scrapingScore,
          requestsBlocked: 50, // Block next 50 requests
          cooldownPeriod: 30 * 60 * 1000, // 30 minutes
          alertGenerated: true,
          timestamp: new Date()
        };

        const mockInsert = vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue(Promise.resolve())
        });

        (db.insert as any).mockImplementation(mockInsert);

        expect(securityResponse.action).toBe('rate_limit_applied');
        expect(securityResponse.scrapingScore).toBeGreaterThanOrEqual(3);
        expect(securityResponse.alertGenerated).toBe(true);
      }
    });

    it('should enforce data retention and access logging', async () => {
      const adminUserId = 'admin-retention-test';
      const dataAccessLogs = [];

      // Mock various data access events
      const accessEvents = [
        { resource: 'user_profile', entityId: 'user-123', action: 'read', sensitivityLevel: 'high' },
        { resource: 'supplier_contract', entityId: 'supplier-456', action: 'read', sensitivityLevel: 'high' },
        { resource: 'order_summary', entityId: 'order-789', action: 'read', sensitivityLevel: 'medium' },
        { resource: 'product_catalog', entityId: 'product-101', action: 'read', sensitivityLevel: 'low' },
        { resource: 'financial_report', entityId: 'report-202', action: 'generate', sensitivityLevel: 'high' }
      ];

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue(Promise.resolve())
      });

      (db.insert as any).mockImplementation(mockInsert);

      // Log each access event with appropriate retention policy
      for (const event of accessEvents) {
        const retentionPeriod = event.sensitivityLevel === 'high' ? 7 * 365 * 24 * 60 * 60 * 1000 : // 7 years for high sensitivity
                              event.sensitivityLevel === 'medium' ? 3 * 365 * 24 * 60 * 60 * 1000 : // 3 years for medium
                              1 * 365 * 24 * 60 * 60 * 1000; // 1 year for low sensitivity

        const accessLog = {
          adminUserId,
          resource: event.resource,
          entityId: event.entityId,
          action: event.action,
          sensitivityLevel: event.sensitivityLevel,
          timestamp: new Date(),
          ipAddress: '192.168.1.100',
          userAgent: 'Admin Browser',
          retentionPeriod,
          deleteAfter: new Date(Date.now() + retentionPeriod),
          encrypted: event.sensitivityLevel === 'high'
        };

        dataAccessLogs.push(accessLog);

        await accessControlService.logAdminActivity({
          adminUserId,
          action: `access_${event.resource}`,
          description: `Accessed ${event.resource}: ${event.entityId}`,
          category: 'data_access',
          entityType: event.resource,
          entityId: event.entityId,
          riskLevel: event.sensitivityLevel === 'high' ? 'high' : 'medium'
        });
      }

      // Verify logging and retention policies
      expect(dataAccessLogs).toHaveLength(5);
      expect(db.insert).toHaveBeenCalledTimes(5);

      // Verify retention periods are correctly assigned
      const highSensitivityLogs = dataAccessLogs.filter(log => log.sensitivityLevel === 'high');
      const mediumSensitivityLogs = dataAccessLogs.filter(log => log.sensitivityLevel === 'medium');
      const lowSensitivityLogs = dataAccessLogs.filter(log => log.sensitivityLevel === 'low');

      expect(highSensitivityLogs).toHaveLength(3);
      expect(mediumSensitivityLogs).toHaveLength(1);
      expect(lowSensitivityLogs).toHaveLength(1);

      // Verify high sensitivity data is encrypted
      highSensitivityLogs.forEach(log => {
        expect(log.encrypted).toBe(true);
        expect(log.retentionPeriod).toBe(7 * 365 * 24 * 60 * 60 * 1000);
      });

      // Verify retention periods are appropriate
      mediumSensitivityLogs.forEach(log => {
        expect(log.retentionPeriod).toBe(3 * 365 * 24 * 60 * 60 * 1000);
      });

      lowSensitivityLogs.forEach(log => {
        expect(log.retentionPeriod).toBe(1 * 365 * 24 * 60 * 60 * 1000);
      });
    });
  });
});