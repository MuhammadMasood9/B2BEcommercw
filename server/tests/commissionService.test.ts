import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommissionService, commissionService } from '../commissionService';
import { db } from '../db';

// Mock the database
vi.mock('../db', () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
    }
}));

describe('CommissionService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear cache before each test
        (commissionService as any).cachedRates = null;
        (commissionService as any).cacheExpiry = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('calculateCommissionRate', () => {
        it('should return default rate when no supplier found', async () => {
            // Mock commission settings
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                        defaultRate: 5.0,
                        freeRate: 5.0,
                        silverRate: 3.0,
                        goldRate: 2.0,
                        platinumRate: 1.5,
                        categoryRates: {},
                        vendorOverrides: {},
                    }]),
                }),
            });

            // Mock supplier not found
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const rate = await commissionService.calculateCommissionRate('non-existent-supplier');
            expect(rate).toBe(5.0);
        });

        it('should return custom commission rate when set', async () => {
            // Mock commission settings
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                        defaultRate: 5.0,
                        freeRate: 5.0,
                        silverRate: 3.0,
                        goldRate: 2.0,
                        platinumRate: 1.5,
                        categoryRates: {},
                        vendorOverrides: {},
                    }]),
                }),
            });

            // Mock supplier with custom rate
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{
                            membershipTier: 'free',
                            customCommissionRate: '2.5',
                        }]),
                    }),
                }),
            });

            const rate = await commissionService.calculateCommissionRate('supplier-123');
            expect(rate).toBe(2.5);
        });

        it('should return tier-based rate for platinum member', async () => {
            // Mock commission settings
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                        defaultRate: 5.0,
                        freeRate: 5.0,
                        silverRate: 3.0,
                        goldRate: 2.0,
                        platinumRate: 1.5,
                        categoryRates: {},
                        vendorOverrides: {},
                    }]),
                }),
            });

            // Mock platinum supplier
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{
                            membershipTier: 'platinum',
                            customCommissionRate: null,
                        }]),
                    }),
                }),
            });

            const rate = await commissionService.calculateCommissionRate('supplier-123');
            expect(rate).toBe(1.5);
        });

        it('should return category-specific rate when available', async () => {
            // Mock commission settings with category rates
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                        defaultRate: 5.0,
                        freeRate: 5.0,
                        silverRate: 3.0,
                        goldRate: 2.0,
                        platinumRate: 1.5,
                        categoryRates: { 'electronics': 4.0 },
                        vendorOverrides: {},
                    }]),
                }),
            });

            // Mock supplier
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{
                            membershipTier: 'free',
                            customCommissionRate: null,
                        }]),
                    }),
                }),
            });

            const rate = await commissionService.calculateCommissionRate('supplier-123', 'electronics');
            expect(rate).toBe(4.0);
        });

        it('should return vendor override rate when available', async () => {
            // Mock commission settings with vendor override
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                        defaultRate: 5.0,
                        freeRate: 5.0,
                        silverRate: 3.0,
                        goldRate: 2.0,
                        platinumRate: 1.5,
                        categoryRates: {},
                        vendorOverrides: { 'supplier-123': 1.0 },
                    }]),
                }),
            });

            const rate = await commissionService.calculateCommissionRate('supplier-123');
            expect(rate).toBe(1.0);
        });
    });

    describe('calculateOrderCommission', () => {
        it('should calculate commission correctly', async () => {
            // Mock commission rate calculation
            vi.spyOn(commissionService, 'calculateCommissionRate').mockResolvedValue(3.0);

            const result = await commissionService.calculateOrderCommission(
                'order-123',
                'supplier-123',
                1000,
                'electronics'
            );

            expect(result).toEqual({
                orderId: 'order-123',
                supplierId: 'supplier-123',
                orderAmount: 1000,
                commissionRate: 3.0,
                commissionAmount: 30,
                supplierAmount: 970,
                calculatedAt: expect.any(Date),
            });
        });

        it('should round commission amounts to 2 decimal places', async () => {
            vi.spyOn(commissionService, 'calculateCommissionRate').mockResolvedValue(3.33);

            const result = await commissionService.calculateOrderCommission(
                'order-123',
                'supplier-123',
                100,
                'electronics'
            );

            expect(result.commissionAmount).toBe(3.33);
            expect(result.supplierAmount).toBe(96.67);
        });
    });

    describe('applyCommissionToOrder', () => {
        it('should update order with commission information', async () => {
            // Mock commission calculation
            vi.spyOn(commissionService, 'calculateOrderCommission').mockResolvedValue({
                orderId: 'order-123',
                supplierId: 'supplier-123',
                orderAmount: 1000,
                commissionRate: 3.0,
                commissionAmount: 30,
                supplierAmount: 970,
                calculatedAt: new Date(),
            });

            // Mock database update
            (db.update as any).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([]),
                }),
            });

            const result = await commissionService.applyCommissionToOrder(
                'order-123',
                'supplier-123',
                1000
            );

            expect(result.commissionAmount).toBe(30);
            expect(result.supplierAmount).toBe(970);
            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('getSupplierCommissionSummary', () => {
        it('should return commission summary for supplier', async () => {
            const mockSummary = {
                totalOrders: 10,
                totalSales: 5000,
                totalCommission: 150,
                totalEarnings: 4850,
                avgCommissionRate: 3.0,
            };

            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([mockSummary]),
                }),
            });

            const result = await commissionService.getSupplierCommissionSummary('supplier-123');

            expect(result).toEqual({
                totalOrders: 10,
                totalSales: 5000,
                totalCommission: 150,
                totalEarnings: 4850,
                avgCommissionRate: 3.0,
            });
        });

        it('should handle date range filtering', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            // Mock commission settings first
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                        defaultRate: 5.0,
                        freeRate: 5.0,
                        silverRate: 3.0,
                        goldRate: 2.0,
                        platinumRate: 1.5,
                        categoryRates: {},
                        vendorOverrides: {},
                    }]),
                }),
            });

            // Mock the actual query result
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{
                        totalOrders: '5',
                        totalSales: '2500',
                        totalCommission: '75',
                        totalEarnings: '2425',
                        avgCommissionRate: '3.0',
                    }]),
                }),
            });

            const result = await commissionService.getSupplierCommissionSummary(
                'supplier-123',
                startDate,
                endDate
            );

            expect(result.totalOrders).toBe(5);
            expect(result.totalSales).toBe(2500);
        });
    });

    describe('updateCommissionSettings', () => {
        it('should create new settings when none exist', async () => {
            // Mock no existing settings
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([]),
                }),
            });

            // Mock insert
            (db.insert as any).mockReturnValue({
                values: vi.fn().mockResolvedValue([]),
            });

            const newRates = {
                defaultRate: 4.0,
                silverRate: 2.5,
            };

            await commissionService.updateCommissionSettings(newRates, 'admin-123');

            expect(db.insert).toHaveBeenCalled();
        });

        it('should update existing settings', async () => {
            // Mock existing settings
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{ id: 'settings-123' }]),
                }),
            });

            // Mock update
            (db.update as any).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([]),
                }),
            });

            const newRates = {
                defaultRate: 4.0,
                silverRate: 2.5,
            };

            await commissionService.updateCommissionSettings(newRates, 'admin-123');

            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('setSupplierCommissionRate', () => {
        it('should set custom commission rate for supplier', async () => {
            (db.update as any).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([]),
                }),
            });

            await commissionService.setSupplierCommissionRate('supplier-123', 2.5);

            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('getCommissionTrackingReport', () => {
        it('should return commission tracking report', async () => {
            const mockReport = [
                {
                    orderId: 'order-1',
                    orderNumber: 'ORD-001',
                    supplierId: 'supplier-123',
                    supplierName: 'Test Supplier',
                    totalAmount: '1000',
                    commissionRate: '3.0',
                    commissionAmount: '30',
                    supplierAmount: '970',
                    paymentStatus: 'paid',
                    createdAt: new Date(),
                },
            ];

            // Mock commission settings first
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{
                        defaultRate: 5.0,
                        freeRate: 5.0,
                        silverRate: 3.0,
                        goldRate: 2.0,
                        platinumRate: 1.5,
                        categoryRates: {},
                        vendorOverrides: {},
                    }]),
                }),
            });

            // Mock the tracking report query
            (db.select as any).mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                offset: vi.fn().mockResolvedValue(mockReport),
                            }),
                        }),
                    }),
                }),
            });

            const result = await commissionService.getCommissionTrackingReport();

            expect(result).toHaveLength(1);
            expect(result[0].orderId).toBe('order-1');
            expect(result[0].supplierName).toBe('Test Supplier');
        });

        it('should filter by supplier ID when provided', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                offset: vi.fn().mockReturnValue({
                                    where: vi.fn().mockResolvedValue([]),
                                }),
                            }),
                        }),
                    }),
                }),
            });

            await commissionService.getCommissionTrackingReport('supplier-123');

            expect(db.select).toHaveBeenCalled();
        });
    });
});