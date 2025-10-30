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
}

export const commissionService = CommissionService.getInstance();