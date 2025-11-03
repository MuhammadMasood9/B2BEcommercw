import { db } from "./db";
import { commissionSettings, supplierProfiles, orders, categories } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface CommissionCalculation {
  orderId: string;
  supplierId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  supplierAmount: number;
  calculatedAt: Date;
}

export interface CommissionRates {
  defaultRate: number;
  freeRate: number;
  silverRate: number;
  goldRate: number;
  platinumRate: number;
  categoryRates?: Record<string, number>;
  vendorOverrides?: Record<string, number>;
}

export interface CommissionHistory {
  id: string;
  changeType: 'rate_update' | 'tier_change' | 'category_update' | 'supplier_override';
  entityId?: string;
  entityType?: string;
  previousValue: any;
  newValue: any;
  changedBy: string;
  reason?: string;
  effectiveDate: Date;
  createdAt: Date;
}

export interface CommissionImpactAnalysis {
  affectedSuppliers: number;
  estimatedRevenueChange: number;
  estimatedSupplierImpact: number;
  projectedMonthlyChange: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface CommissionSimulation {
  currentRevenue: number;
  projectedRevenue: number;
  revenueChange: number;
  revenueChangePercent: number;
  affectedOrders: number;
  supplierImpact: {
    supplierId: string;
    supplierName: string;
    currentCommission: number;
    newCommission: number;
    impact: number;
  }[];
}

export class CommissionService {
  private static instance: CommissionService;
  private cachedRates: CommissionRates | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): CommissionService {
    if (!CommissionService.instance) {
      CommissionService.instance = new CommissionService();
    }
    return CommissionService.instance;
  }

  /**
   * Get current commission rates with caching
   */
  private async getCommissionRates(): Promise<CommissionRates> {
    const now = new Date();
    
    // Return cached rates if still valid
    if (this.cachedRates && this.cacheExpiry && now < this.cacheExpiry) {
      return this.cachedRates;
    }

    try {
      const settings = await db.select().from(commissionSettings).limit(1);
      
      if (settings.length === 0) {
        // Create default settings if none exist
        const defaultSettings = {
          defaultRate: 5.0,
          freeRate: 5.0,
          silverRate: 3.0,
          goldRate: 2.0,
          platinumRate: 1.5,
          categoryRates: {},
          vendorOverrides: {},
        };

        await db.insert(commissionSettings).values(defaultSettings);
        this.cachedRates = defaultSettings;
      } else {
        const setting = settings[0];
        this.cachedRates = {
          defaultRate: Number(setting.defaultRate),
          freeRate: Number(setting.freeRate),
          silverRate: Number(setting.silverRate),
          goldRate: Number(setting.goldRate),
          platinumRate: Number(setting.platinumRate),
          categoryRates: setting.categoryRates as Record<string, number> || {},
          vendorOverrides: setting.vendorOverrides as Record<string, number> || {},
        };
      }

      this.cacheExpiry = new Date(now.getTime() + this.CACHE_DURATION);
      return this.cachedRates;
    } catch (error) {
      console.error("Error fetching commission rates:", error);
      // Return default rates as fallback
      return {
        defaultRate: 5.0,
        freeRate: 5.0,
        silverRate: 3.0,
        goldRate: 2.0,
        platinumRate: 1.5,
        categoryRates: {},
        vendorOverrides: {},
      };
    }
  }

  /**
   * Calculate commission rate for a specific supplier and category
   */
  async calculateCommissionRate(
    supplierId: string,
    categoryId?: string
  ): Promise<number> {
    const rates = await this.getCommissionRates();

    // Check for vendor-specific override first
    if (rates.vendorOverrides && rates.vendorOverrides[supplierId]) {
      return rates.vendorOverrides[supplierId];
    }

    try {
      // Get supplier profile to determine membership tier
      const supplier = await db
        .select({
          membershipTier: supplierProfiles.membershipTier,
          customCommissionRate: supplierProfiles.customCommissionRate,
        })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      if (supplier.length === 0) {
        return rates.defaultRate;
      }

      const supplierData = supplier[0];

      // Use custom commission rate if set
      if (supplierData.customCommissionRate !== null) {
        return Number(supplierData.customCommissionRate);
      }

      // Check for category-specific rate
      if (categoryId && rates.categoryRates && rates.categoryRates[categoryId]) {
        return rates.categoryRates[categoryId];
      }

      // Use tier-based rate
      switch (supplierData.membershipTier) {
        case "platinum":
          return rates.platinumRate;
        case "gold":
          return rates.goldRate;
        case "silver":
          return rates.silverRate;
        case "free":
        default:
          return rates.freeRate;
      }
    } catch (error) {
      console.error("Error calculating commission rate:", error);
      return rates.defaultRate;
    }
  }

  /**
   * Calculate commission for an order
   */
  async calculateOrderCommission(
    orderId: string,
    supplierId: string,
    orderAmount: number,
    categoryId?: string
  ): Promise<CommissionCalculation> {
    const commissionRate = await this.calculateCommissionRate(supplierId, categoryId);
    const commissionAmount = (orderAmount * commissionRate) / 100;
    const supplierAmount = orderAmount - commissionAmount;

    return {
      orderId,
      supplierId,
      orderAmount,
      commissionRate,
      commissionAmount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimal places
      supplierAmount: Math.round(supplierAmount * 100) / 100,
      calculatedAt: new Date(),
    };
  }

  /**
   * Apply commission calculation to an order
   */
  async applyCommissionToOrder(
    orderId: string,
    supplierId: string,
    orderAmount: number,
    categoryId?: string
  ): Promise<CommissionCalculation> {
    const calculation = await this.calculateOrderCommission(
      orderId,
      supplierId,
      orderAmount,
      categoryId
    );

    try {
      // Update the order with commission information
      await db
        .update(orders)
        .set({
          commissionRate: calculation.commissionRate.toString(),
          commissionAmount: calculation.commissionAmount.toString(),
          supplierAmount: calculation.supplierAmount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return calculation;
    } catch (error) {
      console.error("Error applying commission to order:", error);
      throw new Error("Failed to apply commission to order");
    }
  }

  /**
   * Get commission summary for a supplier
   */
  async getSupplierCommissionSummary(
    supplierId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      let query = db
        .select({
          totalOrders: sql<number>`count(*)`,
          totalSales: sql<number>`sum(${orders.totalAmount})`,
          totalCommission: sql<number>`sum(${orders.commissionAmount})`,
          totalEarnings: sql<number>`sum(${orders.supplierAmount})`,
          avgCommissionRate: sql<number>`avg(${orders.commissionRate})`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.supplierId, supplierId),
            eq(orders.paymentStatus, "paid")
          )
        );

      if (startDate && endDate) {
        query = query.where(
          and(
            eq(orders.supplierId, supplierId),
            eq(orders.paymentStatus, "paid"),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        );
      }

      const result = await query;
      
      return {
        totalOrders: Number(result[0]?.totalOrders || 0),
        totalSales: Number(result[0]?.totalSales || 0),
        totalCommission: Number(result[0]?.totalCommission || 0),
        totalEarnings: Number(result[0]?.totalEarnings || 0),
        avgCommissionRate: Number(result[0]?.avgCommissionRate || 0),
      };
    } catch (error) {
      console.error("Error getting supplier commission summary:", error);
      return {
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
        totalEarnings: 0,
        avgCommissionRate: 0,
      };
    }
  }

  /**
   * Get platform commission summary
   */
  async getPlatformCommissionSummary(startDate?: Date, endDate?: Date) {
    try {
      let query = db
        .select({
          totalOrders: sql<number>`count(*)`,
          totalSales: sql<number>`sum(${orders.totalAmount})`,
          totalCommission: sql<number>`sum(${orders.commissionAmount})`,
          totalPaidToSuppliers: sql<number>`sum(${orders.supplierAmount})`,
          avgCommissionRate: sql<number>`avg(${orders.commissionRate})`,
        })
        .from(orders)
        .where(eq(orders.paymentStatus, "paid"));

      if (startDate && endDate) {
        query = query.where(
          and(
            eq(orders.paymentStatus, "paid"),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        );
      }

      const result = await query;
      
      return {
        totalOrders: Number(result[0]?.totalOrders || 0),
        totalSales: Number(result[0]?.totalSales || 0),
        totalCommission: Number(result[0]?.totalCommission || 0),
        totalPaidToSuppliers: Number(result[0]?.totalPaidToSuppliers || 0),
        avgCommissionRate: Number(result[0]?.avgCommissionRate || 0),
      };
    } catch (error) {
      console.error("Error getting platform commission summary:", error);
      return {
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
        totalPaidToSuppliers: 0,
        avgCommissionRate: 0,
      };
    }
  }

  /**
   * Update commission settings
   */
  async updateCommissionSettings(
    rates: Partial<CommissionRates>,
    updatedBy: string
  ): Promise<void> {
    try {
      const existingSettings = await db.select().from(commissionSettings).limit(1);
      
      if (existingSettings.length === 0) {
        // Create new settings
        await db.insert(commissionSettings).values({
          ...rates,
          updatedBy,
          updatedAt: new Date(),
        });
      } else {
        // Update existing settings
        await db
          .update(commissionSettings)
          .set({
            ...rates,
            updatedBy,
            updatedAt: new Date(),
          })
          .where(eq(commissionSettings.id, existingSettings[0].id));
      }

      // Clear cache to force refresh
      this.cachedRates = null;
      this.cacheExpiry = null;
    } catch (error) {
      console.error("Error updating commission settings:", error);
      throw new Error("Failed to update commission settings");
    }
  }

  /**
   * Set custom commission rate for a specific supplier
   */
  async setSupplierCommissionRate(
    supplierId: string,
    customRate: number
  ): Promise<void> {
    try {
      await db
        .update(supplierProfiles)
        .set({
          customCommissionRate: customRate.toString(),
          updatedAt: new Date(),
        })
        .where(eq(supplierProfiles.id, supplierId));

      // Clear cache to force refresh
      this.cachedRates = null;
      this.cacheExpiry = null;
    } catch (error) {
      console.error("Error setting supplier commission rate:", error);
      throw new Error("Failed to set supplier commission rate");
    }
  }

  /**
   * Get commission tracking report
   */
  async getCommissionTrackingReport(
    supplierId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      let query = db
        .select({
          orderId: orders.id,
          orderNumber: orders.orderNumber,
          supplierId: orders.supplierId,
          totalAmount: orders.totalAmount,
          commissionRate: orders.commissionRate,
          commissionAmount: orders.commissionAmount,
          supplierAmount: orders.supplierAmount,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
          supplierName: supplierProfiles.businessName,
        })
        .from(orders)
        .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

      const conditions = [];
      
      if (supplierId) {
        conditions.push(eq(orders.supplierId, supplierId));
      }
      
      if (startDate && endDate) {
        conditions.push(sql`${orders.createdAt} >= ${startDate}`);
        conditions.push(sql`${orders.createdAt} <= ${endDate}`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query;
      
      return result.map(row => ({
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        totalAmount: Number(row.totalAmount),
        commissionRate: Number(row.commissionRate || 0),
        commissionAmount: Number(row.commissionAmount || 0),
        supplierAmount: Number(row.supplierAmount || 0),
        paymentStatus: row.paymentStatus,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error("Error getting commission tracking report:", error);
      return [];
    }
  }

  /**
   * Analyze impact of commission rate changes
   */
  async analyzeCommissionImpact(
    rateChanges: Partial<CommissionRates>
  ): Promise<CommissionImpactAnalysis> {
    try {
      // Get current rates for comparison
      const currentRates = await this.getCommissionRates();
      
      // Calculate affected suppliers
      const suppliersQuery = await db
        .select({
          id: supplierProfiles.id,
          membershipTier: supplierProfiles.membershipTier,
          customCommissionRate: supplierProfiles.customCommissionRate,
        })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.isApproved, true));

      let affectedSuppliers = 0;
      let estimatedRevenueChange = 0;
      let estimatedSupplierImpact = 0;

      // Get recent order data for impact calculation (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentOrders = await db
        .select({
          supplierId: orders.supplierId,
          totalAmount: orders.totalAmount,
          commissionAmount: orders.commissionAmount,
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            sql`${orders.createdAt} >= ${thirtyDaysAgo}`
          )
        );

      // Calculate impact for each supplier
      for (const supplier of suppliersQuery) {
        const currentRate = supplier.customCommissionRate 
          ? Number(supplier.customCommissionRate)
          : this.getTierRate(supplier.membershipTier, currentRates);

        let newRate = currentRate;
        
        // Check if this supplier is affected by rate changes
        if (!supplier.customCommissionRate) {
          newRate = this.getTierRate(supplier.membershipTier, { ...currentRates, ...rateChanges });
        }

        if (currentRate !== newRate) {
          affectedSuppliers++;
          
          // Calculate impact based on recent orders
          const supplierOrders = recentOrders.filter(order => order.supplierId === supplier.id);
          const supplierRevenue = supplierOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
          
          const currentCommission = (supplierRevenue * currentRate) / 100;
          const newCommission = (supplierRevenue * newRate) / 100;
          const commissionDiff = newCommission - currentCommission;
          
          estimatedRevenueChange += commissionDiff;
          estimatedSupplierImpact += -commissionDiff; // Inverse for suppliers
        }
      }

      // Project monthly change (multiply by ~30/30 = 1 for monthly estimate)
      const projectedMonthlyChange = estimatedRevenueChange;

      // Determine risk level
      const revenueChangePercent = Math.abs(estimatedRevenueChange) / Math.max(1, Math.abs(estimatedRevenueChange + estimatedSupplierImpact)) * 100;
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      
      if (revenueChangePercent > 20 || affectedSuppliers > 100) {
        riskLevel = 'high';
      } else if (revenueChangePercent > 10 || affectedSuppliers > 50) {
        riskLevel = 'medium';
      }

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (riskLevel === 'high') {
        recommendations.push('Consider phased rollout of rate changes');
        recommendations.push('Notify affected suppliers in advance');
        recommendations.push('Monitor supplier retention closely');
      }
      
      if (estimatedRevenueChange < 0) {
        recommendations.push('Revenue decrease expected - ensure business case is justified');
      }
      
      if (affectedSuppliers > 50) {
        recommendations.push('Prepare customer support for increased inquiries');
      }

      return {
        affectedSuppliers,
        estimatedRevenueChange: Math.round(estimatedRevenueChange * 100) / 100,
        estimatedSupplierImpact: Math.round(estimatedSupplierImpact * 100) / 100,
        projectedMonthlyChange: Math.round(projectedMonthlyChange * 100) / 100,
        riskLevel,
        recommendations,
      };
    } catch (error) {
      console.error("Error analyzing commission impact:", error);
      return {
        affectedSuppliers: 0,
        estimatedRevenueChange: 0,
        estimatedSupplierImpact: 0,
        projectedMonthlyChange: 0,
        riskLevel: 'low',
        recommendations: ['Unable to calculate impact - proceed with caution'],
      };
    }
  }

  /**
   * Simulate commission changes on historical data
   */
  async simulateCommissionChanges(
    rateChanges: Partial<CommissionRates>,
    startDate?: Date,
    endDate?: Date
  ): Promise<CommissionSimulation> {
    try {
      const currentRates = await this.getCommissionRates();
      const newRates = { ...currentRates, ...rateChanges };

      // Default to last 30 days if no date range provided
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }
      if (!endDate) {
        endDate = new Date();
      }

      // Get historical orders for simulation
      const historicalOrders = await db
        .select({
          id: orders.id,
          supplierId: orders.supplierId,
          totalAmount: orders.totalAmount,
          commissionAmount: orders.commissionAmount,
          supplierName: supplierProfiles.businessName,
        })
        .from(orders)
        .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        );

      let currentRevenue = 0;
      let projectedRevenue = 0;
      const supplierImpacts: { [key: string]: any } = {};

      // Calculate current and projected revenue
      for (const order of historicalOrders) {
        const currentCommission = Number(order.commissionAmount || 0);
        currentRevenue += currentCommission;

        // Calculate new commission rate for this supplier
        const newRate = await this.calculateCommissionRate(order.supplierId);
        const newCommission = (Number(order.totalAmount) * newRate) / 100;
        projectedRevenue += newCommission;

        // Track supplier impact
        if (!supplierImpacts[order.supplierId]) {
          supplierImpacts[order.supplierId] = {
            supplierId: order.supplierId,
            supplierName: order.supplierName,
            currentCommission: 0,
            newCommission: 0,
            impact: 0,
          };
        }

        supplierImpacts[order.supplierId].currentCommission += currentCommission;
        supplierImpacts[order.supplierId].newCommission += newCommission;
        supplierImpacts[order.supplierId].impact = 
          supplierImpacts[order.supplierId].newCommission - supplierImpacts[order.supplierId].currentCommission;
      }

      const revenueChange = projectedRevenue - currentRevenue;
      const revenueChangePercent = currentRevenue > 0 ? (revenueChange / currentRevenue) * 100 : 0;

      return {
        currentRevenue: Math.round(currentRevenue * 100) / 100,
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
        revenueChange: Math.round(revenueChange * 100) / 100,
        revenueChangePercent: Math.round(revenueChangePercent * 100) / 100,
        affectedOrders: historicalOrders.length,
        supplierImpact: Object.values(supplierImpacts).map(impact => ({
          ...impact,
          currentCommission: Math.round(impact.currentCommission * 100) / 100,
          newCommission: Math.round(impact.newCommission * 100) / 100,
          impact: Math.round(impact.impact * 100) / 100,
        })),
      };
    } catch (error) {
      console.error("Error simulating commission changes:", error);
      return {
        currentRevenue: 0,
        projectedRevenue: 0,
        revenueChange: 0,
        revenueChangePercent: 0,
        affectedOrders: 0,
        supplierImpact: [],
      };
    }
  }

  /**
   * Get commission rate history for tracking changes
   */
  async getCommissionHistory(
    entityType?: string,
    entityId?: string,
    limit: number = 50
  ): Promise<CommissionHistory[]> {
    try {
      // This would require a commission_history table in a real implementation
      // For now, we'll return a placeholder structure
      return [];
    } catch (error) {
      console.error("Error getting commission history:", error);
      return [];
    }
  }

  /**
   * Helper method to get tier rate from rates object
   */
  private getTierRate(tier: string, rates: CommissionRates): number {
    switch (tier) {
      case "platinum":
        return rates.platinumRate;
      case "gold":
        return rates.goldRate;
      case "silver":
        return rates.silverRate;
      case "free":
      default:
        return rates.freeRate;
    }
  }

  /**
   * Bulk update commission rates for multiple suppliers
   */
  async bulkUpdateSupplierRates(
    updates: { supplierId: string; customRate: number }[],
    updatedBy: string
  ): Promise<void> {
    try {
      for (const update of updates) {
        await this.setSupplierCommissionRate(update.supplierId, update.customRate);
      }
      
      // Clear cache to force refresh
      this.cachedRates = null;
      this.cacheExpiry = null;
    } catch (error) {
      console.error("Error bulk updating supplier rates:", error);
      throw new Error("Failed to bulk update supplier rates");
    }
  }

  /**
   * Get advanced commission analytics
   */
  async getAdvancedCommissionAnalytics(
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Default to last 90 days if no date range provided
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
      }
      if (!endDate) {
        endDate = new Date();
      }

      // Get commission data by tier
      const tierAnalytics = await db
        .select({
          membershipTier: supplierProfiles.membershipTier,
          totalOrders: sql<number>`count(${orders.id})`,
          totalRevenue: sql<number>`sum(${orders.totalAmount})`,
          totalCommission: sql<number>`sum(${orders.commissionAmount})`,
          avgOrderValue: sql<number>`avg(${orders.totalAmount})`,
          avgCommissionRate: sql<number>`avg(${orders.commissionRate})`,
        })
        .from(orders)
        .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        )
        .groupBy(supplierProfiles.membershipTier);

      // Get top performing suppliers by commission
      const topSuppliers = await db
        .select({
          supplierId: orders.supplierId,
          supplierName: supplierProfiles.businessName,
          membershipTier: supplierProfiles.membershipTier,
          totalOrders: sql<number>`count(${orders.id})`,
          totalCommission: sql<number>`sum(${orders.commissionAmount})`,
          avgCommissionRate: sql<number>`avg(${orders.commissionRate})`,
        })
        .from(orders)
        .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        )
        .groupBy(orders.supplierId, supplierProfiles.businessName, supplierProfiles.membershipTier)
        .orderBy(sql`sum(${orders.commissionAmount}) DESC`)
        .limit(10);

      return {
        tierAnalytics: tierAnalytics.map(row => ({
          membershipTier: row.membershipTier,
          totalOrders: Number(row.totalOrders || 0),
          totalRevenue: Number(row.totalRevenue || 0),
          totalCommission: Number(row.totalCommission || 0),
          avgOrderValue: Number(row.avgOrderValue || 0),
          avgCommissionRate: Number(row.avgCommissionRate || 0),
        })),
        topSuppliers: topSuppliers.map(row => ({
          supplierId: row.supplierId,
          supplierName: row.supplierName,
          membershipTier: row.membershipTier,
          totalOrders: Number(row.totalOrders || 0),
          totalCommission: Number(row.totalCommission || 0),
          avgCommissionRate: Number(row.avgCommissionRate || 0),
        })),
      };
    } catch (error) {
      console.error("Error getting advanced commission analytics:", error);
      return {
        tierAnalytics: [],
        topSuppliers: [],
      };
    }
  }
  /**
   * Create commission adjustment for dispute resolution
   */
  async createCommissionAdjustment(adjustmentData: {
    orderId: string;
    disputeId?: string;
    adjustmentType: 'refund' | 'penalty' | 'bonus' | 'correction';
    adjustmentAmount: number;
    reason: string;
    adminId: string;
  }) {
    try {
      // Get the original order to calculate impact
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, adjustmentData.orderId))
        .limit(1);

      if (order.length === 0) {
        throw new Error("Order not found");
      }

      const originalOrder = order[0];
      const originalCommission = Number(originalOrder.commissionAmount || 0);
      
      // Calculate new commission based on adjustment
      let newCommissionAmount = originalCommission;
      let newSupplierAmount = Number(originalOrder.supplierAmount || 0);
      
      switch (adjustmentData.adjustmentType) {
        case 'refund':
          // Reduce commission proportionally to refund
          const refundRatio = adjustmentData.adjustmentAmount / Number(originalOrder.totalAmount);
          newCommissionAmount = originalCommission * (1 - refundRatio);
          newSupplierAmount = newSupplierAmount - (adjustmentData.adjustmentAmount - (originalCommission * refundRatio));
          break;
        case 'penalty':
          // Reduce supplier amount, increase commission
          newSupplierAmount = newSupplierAmount - adjustmentData.adjustmentAmount;
          newCommissionAmount = originalCommission + adjustmentData.adjustmentAmount;
          break;
        case 'bonus':
          // Increase supplier amount, reduce commission
          newSupplierAmount = newSupplierAmount + adjustmentData.adjustmentAmount;
          newCommissionAmount = Math.max(0, originalCommission - adjustmentData.adjustmentAmount);
          break;
        case 'correction':
          // Direct commission adjustment
          newCommissionAmount = originalCommission + adjustmentData.adjustmentAmount;
          newSupplierAmount = newSupplierAmount - adjustmentData.adjustmentAmount;
          break;
      }

      // Update the order with new commission amounts
      await db
        .update(orders)
        .set({
          commissionAmount: newCommissionAmount.toString(),
          supplierAmount: newSupplierAmount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, adjustmentData.orderId));

      // Create adjustment record (you would need to create this table)
      const adjustmentRecord = {
        id: Math.random().toString(36).substring(2, 15),
        orderId: adjustmentData.orderId,
        disputeId: adjustmentData.disputeId,
        adjustmentType: adjustmentData.adjustmentType,
        originalCommission: originalCommission,
        adjustmentAmount: adjustmentData.adjustmentAmount,
        newCommission: newCommissionAmount,
        reason: adjustmentData.reason,
        adminId: adjustmentData.adminId,
        createdAt: new Date(),
      };

      return adjustmentRecord;
    } catch (error) {
      console.error("Error creating commission adjustment:", error);
      throw new Error("Failed to create commission adjustment");
    }
  }

  /**
   * Get commission adjustments
   */
  async getCommissionAdjustments(filters: {
    orderId?: string;
    disputeId?: string;
    limit: number;
    offset: number;
  }) {
    try {
      // This would require a commission_adjustments table
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error("Error getting commission adjustments:", error);
      return [];
    }
  }

  /**
   * Generate commission report with export functionality
   */
  async generateCommissionReport(options: {
    startDate?: Date;
    endDate?: Date;
    includeAdjustments: boolean;
  }) {
    try {
      // Get commission data
      const trackingData = await this.getCommissionTrackingReport(
        undefined,
        options.startDate,
        options.endDate,
        1000, // Large limit for export
        0
      );

      // Generate CSV format
      const csvHeaders = [
        'Order ID',
        'Order Number',
        'Supplier ID',
        'Supplier Name',
        'Total Amount',
        'Commission Rate',
        'Commission Amount',
        'Supplier Amount',
        'Payment Status',
        'Created At'
      ];

      const csvRows = trackingData.map(record => [
        record.orderId,
        record.orderNumber,
        record.supplierId,
        record.supplierName,
        record.totalAmount.toFixed(2),
        (record.commissionRate * 100).toFixed(2) + '%',
        record.commissionAmount.toFixed(2),
        record.supplierAmount.toFixed(2),
        record.paymentStatus,
        record.createdAt.toISOString()
      ]);

      const csv = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return {
        data: trackingData,
        csv: csv,
        summary: {
          totalRecords: trackingData.length,
          totalCommission: trackingData.reduce((sum, record) => sum + record.commissionAmount, 0),
          totalSupplierAmount: trackingData.reduce((sum, record) => sum + record.supplierAmount, 0),
        }
      };
    } catch (error) {
      console.error("Error generating commission report:", error);
      throw new Error("Failed to generate commission report");
    }
  }
}

export const commissionService = CommissionService.getInstance();