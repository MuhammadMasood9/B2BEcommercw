import { db } from "./db";
import { orders, payouts, supplierProfiles, commissionSettings, products, categories } from "../shared/schema";
import { eq, and, sql, gte, lte, desc, asc } from "drizzle-orm";
import { commissionService } from "./commissionService";
import { payoutService } from "./payoutService";

export interface FinancialDashboardData {
  overview: {
    totalRevenue: number;
    totalCommission: number;
    totalPayouts: number;
    netProfit: number;
    revenueGrowth: number;
    commissionGrowth: number;
    payoutGrowth: number;
    profitMargin: number;
  };
  trends: {
    revenue: ChartDataPoint[];
    commission: ChartDataPoint[];
    payouts: ChartDataPoint[];
    profit: ChartDataPoint[];
  };
  breakdown: {
    byTier: TierBreakdown[];
    byCategory: CategoryBreakdown[];
    bySupplier: SupplierBreakdown[];
    byPaymentMethod: PaymentMethodBreakdown[];
  };
  forecasting: {
    revenueProjection: ForecastData[];
    commissionProjection: ForecastData[];
    payoutProjection: ForecastData[];
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TierBreakdown {
  tier: string;
  suppliers: number;
  orders: number;
  revenue: number;
  commission: number;
  avgCommissionRate: number;
  growth: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  orders: number;
  revenue: number;
  commission: number;
  suppliers: number;
  growth: number;
}

export interface SupplierBreakdown {
  supplierId: string;
  supplierName: string;
  tier: string;
  orders: number;
  revenue: number;
  commission: number;
  payouts: number;
  commissionRate: number;
  growth: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  payouts: number;
  amount: number;
  successRate: number;
  avgProcessingTime: number;
  fees: number;
}

export interface ForecastData {
  date: string;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'revenue' | 'commission' | 'payout' | 'supplier' | 'custom';
  parameters: ReportParameters;
  schedule?: ReportSchedule;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients?: string[];
  createdBy: string;
  createdAt: Date;
  lastGenerated?: Date;
}

export interface ReportParameters {
  dateRange: {
    start: Date;
    end: Date;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  filters: {
    supplierIds?: string[];
    categoryIds?: string[];
    tiers?: string[];
    paymentMethods?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
  groupBy?: string[];
  metrics: string[];
  includeCharts: boolean;
  includeComparisons: boolean;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  enabled: boolean;
}

export interface TaxReportData {
  period: {
    start: Date;
    end: Date;
    quarter?: number;
    year: number;
  };
  summary: {
    totalRevenue: number;
    totalCommission: number;
    totalPayouts: number;
    taxableIncome: number;
    estimatedTax: number;
  };
  breakdown: {
    byMonth: MonthlyTaxData[];
    bySupplier: SupplierTaxData[];
    byCategory: CategoryTaxData[];
  };
  compliance: {
    form1099Required: boolean;
    form1099Count: number;
    internationalPayments: number;
    withholdingRequired: number;
  };
}

export interface MonthlyTaxData {
  month: string;
  revenue: number;
  commission: number;
  payouts: number;
  taxableIncome: number;
}

export interface SupplierTaxData {
  supplierId: string;
  supplierName: string;
  totalPayouts: number;
  taxableAmount: number;
  form1099Required: boolean;
  withholdingAmount: number;
}

export interface CategoryTaxData {
  categoryId: string;
  categoryName: string;
  revenue: number;
  commission: number;
  taxRate: number;
}

export class FinancialAnalyticsService {
  private static instance: FinancialAnalyticsService;

  public static getInstance(): FinancialAnalyticsService {
    if (!FinancialAnalyticsService.instance) {
      FinancialAnalyticsService.instance = new FinancialAnalyticsService();
    }
    return FinancialAnalyticsService.instance;
  }

  /**
   * Get comprehensive financial dashboard data
   */
  async getFinancialDashboard(
    startDate?: Date,
    endDate?: Date,
    compareWithPrevious: boolean = true
  ): Promise<FinancialDashboardData> {
    try {
      // Default to last 30 days if no date range provided
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }
      if (!endDate) {
        endDate = new Date();
      }

      // Calculate previous period for comparison
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
      const prevEndDate = new Date(startDate);

      // Get overview data
      const overview = await this.getFinancialOverview(startDate, endDate, compareWithPrevious ? prevStartDate : undefined, compareWithPrevious ? prevEndDate : undefined);
      
      // Get trend data
      const trends = await this.getFinancialTrends(startDate, endDate);
      
      // Get breakdown data
      const breakdown = await this.getFinancialBreakdown(startDate, endDate);
      
      // Get forecasting data
      const forecasting = await this.getFinancialForecasting(startDate, endDate);

      return {
        overview,
        trends,
        breakdown,
        forecasting,
      };
    } catch (error) {
      console.error("Error getting financial dashboard:", error);
      throw new Error("Failed to get financial dashboard data");
    }
  }

  /**
   * Get financial overview with growth calculations
   */
  private async getFinancialOverview(
    startDate: Date,
    endDate: Date,
    prevStartDate?: Date,
    prevEndDate?: Date
  ) {
    try {
      // Current period data
      const currentData = await db
        .select({
          totalRevenue: sql<number>`sum(${orders.totalAmount})`,
          totalCommission: sql<number>`sum(${orders.commissionAmount})`,
          orderCount: sql<number>`count(*)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );

      // Payout data
      const payoutData = await db
        .select({
          totalPayouts: sql<number>`sum(${payouts.netAmount})`,
        })
        .from(payouts)
        .where(
          and(
            eq(payouts.status, "completed"),
            gte(payouts.createdAt, startDate),
            lte(payouts.createdAt, endDate)
          )
        );

      const totalRevenue = Number(currentData[0]?.totalRevenue || 0);
      const totalCommission = Number(currentData[0]?.totalCommission || 0);
      const totalPayouts = Number(payoutData[0]?.totalPayouts || 0);
      const netProfit = totalCommission - totalPayouts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      let revenueGrowth = 0;
      let commissionGrowth = 0;
      let payoutGrowth = 0;

      // Calculate growth if previous period data is requested
      if (prevStartDate && prevEndDate) {
        const prevData = await db
          .select({
            totalRevenue: sql<number>`sum(${orders.totalAmount})`,
            totalCommission: sql<number>`sum(${orders.commissionAmount})`,
          })
          .from(orders)
          .where(
            and(
              eq(orders.paymentStatus, "paid"),
              gte(orders.createdAt, prevStartDate),
              lte(orders.createdAt, prevEndDate)
            )
          );

        const prevPayoutData = await db
          .select({
            totalPayouts: sql<number>`sum(${payouts.netAmount})`,
          })
          .from(payouts)
          .where(
            and(
              eq(payouts.status, "completed"),
              gte(payouts.createdAt, prevStartDate),
              lte(payouts.createdAt, prevEndDate)
            )
          );

        const prevRevenue = Number(prevData[0]?.totalRevenue || 0);
        const prevCommission = Number(prevData[0]?.totalCommission || 0);
        const prevPayouts = Number(prevPayoutData[0]?.totalPayouts || 0);

        revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        commissionGrowth = prevCommission > 0 ? ((totalCommission - prevCommission) / prevCommission) * 100 : 0;
        payoutGrowth = prevPayouts > 0 ? ((totalPayouts - prevPayouts) / prevPayouts) * 100 : 0;
      }

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalPayouts: Math.round(totalPayouts * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        commissionGrowth: Math.round(commissionGrowth * 100) / 100,
        payoutGrowth: Math.round(payoutGrowth * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
      };
    } catch (error) {
      console.error("Error getting financial overview:", error);
      return {
        totalRevenue: 0,
        totalCommission: 0,
        totalPayouts: 0,
        netProfit: 0,
        revenueGrowth: 0,
        commissionGrowth: 0,
        payoutGrowth: 0,
        profitMargin: 0,
      };
    }
  }

  /**
   * Get financial trends over time
   */
  private async getFinancialTrends(startDate: Date, endDate: Date) {
    try {
      // Generate daily data points
      const trends = await db
        .select({
          date: sql<string>`DATE(${orders.createdAt})`,
          revenue: sql<number>`sum(${orders.totalAmount})`,
          commission: sql<number>`sum(${orders.commissionAmount})`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        )
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt})`);

      // Get payout trends
      const payoutTrends = await db
        .select({
          date: sql<string>`DATE(${payouts.createdAt})`,
          payouts: sql<number>`sum(${payouts.netAmount})`,
        })
        .from(payouts)
        .where(
          and(
            eq(payouts.status, "completed"),
            gte(payouts.createdAt, startDate),
            lte(payouts.createdAt, endDate)
          )
        )
        .groupBy(sql`DATE(${payouts.createdAt})`)
        .orderBy(sql`DATE(${payouts.createdAt})`);

      // Merge and format data
      const revenueData: ChartDataPoint[] = trends.map(item => ({
        date: item.date,
        value: Number(item.revenue || 0),
      }));

      const commissionData: ChartDataPoint[] = trends.map(item => ({
        date: item.date,
        value: Number(item.commission || 0),
      }));

      const payoutData: ChartDataPoint[] = payoutTrends.map(item => ({
        date: item.date,
        value: Number(item.payouts || 0),
      }));

      const profitData: ChartDataPoint[] = trends.map(item => ({
        date: item.date,
        value: Number(item.commission || 0) - (payoutTrends.find(p => p.date === item.date)?.payouts ? Number(payoutTrends.find(p => p.date === item.date)!.payouts) : 0),
      }));

      return {
        revenue: revenueData,
        commission: commissionData,
        payouts: payoutData,
        profit: profitData,
      };
    } catch (error) {
      console.error("Error getting financial trends:", error);
      return {
        revenue: [],
        commission: [],
        payouts: [],
        profit: [],
      };
    }
  }

  /**
   * Get financial breakdown by various dimensions
   */
  private async getFinancialBreakdown(startDate: Date, endDate: Date) {
    try {
      // Breakdown by tier
      const tierBreakdown = await this.getTierBreakdown(startDate, endDate);
      
      // Breakdown by category
      const categoryBreakdown = await this.getCategoryBreakdown(startDate, endDate);
      
      // Breakdown by supplier (top 10)
      const supplierBreakdown = await this.getSupplierBreakdown(startDate, endDate, 10);
      
      // Breakdown by payment method
      const paymentMethodBreakdown = await this.getPaymentMethodBreakdown(startDate, endDate);

      return {
        byTier: tierBreakdown,
        byCategory: categoryBreakdown,
        bySupplier: supplierBreakdown,
        byPaymentMethod: paymentMethodBreakdown,
      };
    } catch (error) {
      console.error("Error getting financial breakdown:", error);
      return {
        byTier: [],
        byCategory: [],
        bySupplier: [],
        byPaymentMethod: [],
      };
    }
  }

  /**
   * Get tier breakdown
   */
  private async getTierBreakdown(startDate: Date, endDate: Date): Promise<TierBreakdown[]> {
    try {
      const tierData = await db
        .select({
          tier: supplierProfiles.membershipTier,
          suppliers: sql<number>`count(DISTINCT ${supplierProfiles.id})`,
          orders: sql<number>`count(${orders.id})`,
          revenue: sql<number>`sum(${orders.totalAmount})`,
          commission: sql<number>`sum(${orders.commissionAmount})`,
          avgCommissionRate: sql<number>`avg(${orders.commissionRate})`,
        })
        .from(orders)
        .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        )
        .groupBy(supplierProfiles.membershipTier);

      return tierData.map(item => ({
        tier: item.tier || 'unknown',
        suppliers: Number(item.suppliers || 0),
        orders: Number(item.orders || 0),
        revenue: Number(item.revenue || 0),
        commission: Number(item.commission || 0),
        avgCommissionRate: Number(item.avgCommissionRate || 0),
        growth: 0, // Would calculate from previous period
      }));
    } catch (error) {
      console.error("Error getting tier breakdown:", error);
      return [];
    }
  }

  /**
   * Get category breakdown
   */
  private async getCategoryBreakdown(startDate: Date, endDate: Date): Promise<CategoryBreakdown[]> {
    try {
      const categoryData = await db
        .select({
          categoryId: products.categoryId,
          categoryName: categories.name,
          orders: sql<number>`count(${orders.id})`,
          revenue: sql<number>`sum(${orders.totalAmount})`,
          commission: sql<number>`sum(${orders.commissionAmount})`,
          suppliers: sql<number>`count(DISTINCT ${orders.supplierId})`,
        })
        .from(orders)
        .leftJoin(products, eq(orders.id, products.id)) // This would need proper order-product relationship
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        )
        .groupBy(products.categoryId, categories.name);

      return categoryData.map(item => ({
        categoryId: item.categoryId || 'unknown',
        categoryName: item.categoryName || 'Unknown Category',
        orders: Number(item.orders || 0),
        revenue: Number(item.revenue || 0),
        commission: Number(item.commission || 0),
        suppliers: Number(item.suppliers || 0),
        growth: 0, // Would calculate from previous period
      }));
    } catch (error) {
      console.error("Error getting category breakdown:", error);
      return [];
    }
  }

  /**
   * Get supplier breakdown
   */
  private async getSupplierBreakdown(startDate: Date, endDate: Date, limit: number = 10): Promise<SupplierBreakdown[]> {
    try {
      const supplierData = await db
        .select({
          supplierId: orders.supplierId,
          supplierName: supplierProfiles.businessName,
          tier: supplierProfiles.membershipTier,
          orders: sql<number>`count(${orders.id})`,
          revenue: sql<number>`sum(${orders.totalAmount})`,
          commission: sql<number>`sum(${orders.commissionAmount})`,
          avgCommissionRate: sql<number>`avg(${orders.commissionRate})`,
        })
        .from(orders)
        .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        )
        .groupBy(orders.supplierId, supplierProfiles.businessName, supplierProfiles.membershipTier)
        .orderBy(desc(sql`sum(${orders.commissionAmount})`))
        .limit(limit);

      // Get payout data for each supplier
      const supplierBreakdown: SupplierBreakdown[] = [];
      
      for (const supplier of supplierData) {
        const payoutData = await db
          .select({
            payouts: sql<number>`sum(${payouts.netAmount})`,
          })
          .from(payouts)
          .where(
            and(
              eq(payouts.supplierId, supplier.supplierId),
              eq(payouts.status, "completed"),
              gte(payouts.createdAt, startDate),
              lte(payouts.createdAt, endDate)
            )
          );

        supplierBreakdown.push({
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName || 'Unknown Supplier',
          tier: supplier.tier || 'free',
          orders: Number(supplier.orders || 0),
          revenue: Number(supplier.revenue || 0),
          commission: Number(supplier.commission || 0),
          payouts: Number(payoutData[0]?.payouts || 0),
          commissionRate: Number(supplier.avgCommissionRate || 0),
          growth: 0, // Would calculate from previous period
        });
      }

      return supplierBreakdown;
    } catch (error) {
      console.error("Error getting supplier breakdown:", error);
      return [];
    }
  }

  /**
   * Get payment method breakdown
   */
  private async getPaymentMethodBreakdown(startDate: Date, endDate: Date): Promise<PaymentMethodBreakdown[]> {
    try {
      const paymentData = await db
        .select({
          method: payouts.method,
          payouts: sql<number>`count(*)`,
          amount: sql<number>`sum(${payouts.netAmount})`,
          successful: sql<number>`count(CASE WHEN ${payouts.status} = 'completed' THEN 1 END)`,
          failed: sql<number>`count(CASE WHEN ${payouts.status} = 'failed' THEN 1 END)`,
        })
        .from(payouts)
        .where(
          and(
            gte(payouts.createdAt, startDate),
            lte(payouts.createdAt, endDate)
          )
        )
        .groupBy(payouts.method);

      return paymentData.map(item => {
        const totalPayouts = Number(item.payouts || 0);
        const successful = Number(item.successful || 0);
        const successRate = totalPayouts > 0 ? (successful / totalPayouts) * 100 : 0;
        
        return {
          method: item.method || 'unknown',
          payouts: totalPayouts,
          amount: Number(item.amount || 0),
          successRate: Math.round(successRate * 100) / 100,
          avgProcessingTime: 0, // Would calculate from processing timestamps
          fees: 0, // Would calculate based on method fee structure
        };
      });
    } catch (error) {
      console.error("Error getting payment method breakdown:", error);
      return [];
    }
  }

  /**
   * Get financial forecasting data
   */
  private async getFinancialForecasting(startDate: Date, endDate: Date) {
    try {
      // Simple linear regression for forecasting
      // In a real implementation, this would use more sophisticated algorithms
      
      const historicalData = await this.getFinancialTrends(startDate, endDate);
      
      // Generate 30-day forecast
      const forecastDays = 30;
      const today = new Date();
      
      const revenueProjection: ForecastData[] = [];
      const commissionProjection: ForecastData[] = [];
      const payoutProjection: ForecastData[] = [];
      
      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        
        // Simple trend calculation (would use more sophisticated methods in production)
        const avgRevenue = historicalData.revenue.reduce((sum, item) => sum + item.value, 0) / historicalData.revenue.length;
        const avgCommission = historicalData.commission.reduce((sum, item) => sum + item.value, 0) / historicalData.commission.length;
        const avgPayout = historicalData.payouts.reduce((sum, item) => sum + item.value, 0) / historicalData.payouts.length;
        
        revenueProjection.push({
          date: forecastDate.toISOString().split('T')[0],
          predicted: avgRevenue * (1 + Math.random() * 0.2 - 0.1), // Add some variance
          confidence: Math.max(0.5, 1 - (i / forecastDays) * 0.5), // Decreasing confidence over time
          trend: 'stable',
        });
        
        commissionProjection.push({
          date: forecastDate.toISOString().split('T')[0],
          predicted: avgCommission * (1 + Math.random() * 0.2 - 0.1),
          confidence: Math.max(0.5, 1 - (i / forecastDays) * 0.5),
          trend: 'stable',
        });
        
        payoutProjection.push({
          date: forecastDate.toISOString().split('T')[0],
          predicted: avgPayout * (1 + Math.random() * 0.2 - 0.1),
          confidence: Math.max(0.5, 1 - (i / forecastDays) * 0.5),
          trend: 'stable',
        });
      }
      
      return {
        revenueProjection,
        commissionProjection,
        payoutProjection,
      };
    } catch (error) {
      console.error("Error getting financial forecasting:", error);
      return {
        revenueProjection: [],
        commissionProjection: [],
        payoutProjection: [],
      };
    }
  }

  /**
   * Generate custom financial report
   */
  async generateCustomReport(parameters: ReportParameters): Promise<any> {
    try {
      const { dateRange, filters, groupBy, metrics, includeCharts, includeComparisons } = parameters;
      
      // Build base query with filters
      let query = db
        .select({
          date: sql<string>`DATE(${orders.createdAt})`,
          supplierId: orders.supplierId,
          supplierName: supplierProfiles.businessName,
          membershipTier: supplierProfiles.membershipTier,
          totalAmount: orders.totalAmount,
          commissionAmount: orders.commissionAmount,
          commissionRate: orders.commissionRate,
        })
        .from(orders)
        .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, dateRange.start),
            lte(orders.createdAt, dateRange.end)
          )
        );

      // Apply filters
      const conditions = [
        eq(orders.paymentStatus, "paid"),
        gte(orders.createdAt, dateRange.start),
        lte(orders.createdAt, dateRange.end)
      ];

      if (filters.supplierIds && filters.supplierIds.length > 0) {
        conditions.push(sql`${orders.supplierId} IN (${filters.supplierIds.join(',')})`);
      }

      if (filters.tiers && filters.tiers.length > 0) {
        conditions.push(sql`${supplierProfiles.membershipTier} IN (${filters.tiers.join(',')})`);
      }

      if (filters.minAmount) {
        conditions.push(sql`${orders.totalAmount} >= ${filters.minAmount}`);
      }

      if (filters.maxAmount) {
        conditions.push(sql`${orders.totalAmount} <= ${filters.maxAmount}`);
      }

      query = query.where(and(...conditions));

      const result = await query;
      
      // Process and aggregate data based on groupBy and metrics
      const reportData = this.processReportData(result, groupBy, metrics, dateRange.period);
      
      return {
        parameters,
        data: reportData,
        generatedAt: new Date(),
        recordCount: result.length,
      };
    } catch (error) {
      console.error("Error generating custom report:", error);
      throw new Error("Failed to generate custom report");
    }
  }

  /**
   * Process report data based on grouping and metrics
   */
  private processReportData(data: any[], groupBy?: string[], metrics?: string[], period?: string) {
    // This would implement sophisticated data processing and aggregation
    // For now, return basic aggregation
    
    const summary = {
      totalRecords: data.length,
      totalRevenue: data.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      totalCommission: data.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
      avgCommissionRate: data.reduce((sum, item) => sum + Number(item.commissionRate || 0), 0) / data.length,
    };

    return {
      summary,
      details: data,
      groupedData: {}, // Would implement grouping logic
    };
  }

  /**
   * Generate tax report
   */
  async generateTaxReport(
    year: number,
    quarter?: number
  ): Promise<TaxReportData> {
    try {
      let startDate: Date;
      let endDate: Date;

      if (quarter) {
        // Quarterly report
        startDate = new Date(year, (quarter - 1) * 3, 1);
        endDate = new Date(year, quarter * 3, 0);
      } else {
        // Annual report
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
      }

      // Get summary data
      const summaryData = await db
        .select({
          totalRevenue: sql<number>`sum(${orders.totalAmount})`,
          totalCommission: sql<number>`sum(${orders.commissionAmount})`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );

      const payoutSummary = await db
        .select({
          totalPayouts: sql<number>`sum(${payouts.netAmount})`,
        })
        .from(payouts)
        .where(
          and(
            eq(payouts.status, "completed"),
            gte(payouts.createdAt, startDate),
            lte(payouts.createdAt, endDate)
          )
        );

      const totalRevenue = Number(summaryData[0]?.totalRevenue || 0);
      const totalCommission = Number(summaryData[0]?.totalCommission || 0);
      const totalPayouts = Number(payoutSummary[0]?.totalPayouts || 0);
      const taxableIncome = totalCommission; // Simplified tax calculation
      const estimatedTax = taxableIncome * 0.21; // Simplified corporate tax rate

      // Get monthly breakdown
      const monthlyData = await this.getMonthlyTaxBreakdown(startDate, endDate);
      
      // Get supplier tax data
      const supplierTaxData = await this.getSupplierTaxBreakdown(startDate, endDate);
      
      // Get category tax data
      const categoryTaxData = await this.getCategoryTaxBreakdown(startDate, endDate);

      return {
        period: {
          start: startDate,
          end: endDate,
          quarter,
          year,
        },
        summary: {
          totalRevenue,
          totalCommission,
          totalPayouts,
          taxableIncome,
          estimatedTax,
        },
        breakdown: {
          byMonth: monthlyData,
          bySupplier: supplierTaxData,
          byCategory: categoryTaxData,
        },
        compliance: {
          form1099Required: supplierTaxData.some(s => s.form1099Required),
          form1099Count: supplierTaxData.filter(s => s.form1099Required).length,
          internationalPayments: 0, // Would calculate from supplier locations
          withholdingRequired: supplierTaxData.reduce((sum, s) => sum + s.withholdingAmount, 0),
        },
      };
    } catch (error) {
      console.error("Error generating tax report:", error);
      throw new Error("Failed to generate tax report");
    }
  }

  /**
   * Get monthly tax breakdown
   */
  private async getMonthlyTaxBreakdown(startDate: Date, endDate: Date): Promise<MonthlyTaxData[]> {
    try {
      const monthlyData = await db
        .select({
          month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
          revenue: sql<number>`sum(${orders.totalAmount})`,
          commission: sql<number>`sum(${orders.commissionAmount})`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        )
        .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`);

      return monthlyData.map(item => ({
        month: item.month,
        revenue: Number(item.revenue || 0),
        commission: Number(item.commission || 0),
        payouts: 0, // Would get from payouts table
        taxableIncome: Number(item.commission || 0),
      }));
    } catch (error) {
      console.error("Error getting monthly tax breakdown:", error);
      return [];
    }
  }

  /**
   * Get supplier tax breakdown
   */
  private async getSupplierTaxBreakdown(startDate: Date, endDate: Date): Promise<SupplierTaxData[]> {
    try {
      const supplierPayouts = await db
        .select({
          supplierId: payouts.supplierId,
          supplierName: supplierProfiles.businessName,
          totalPayouts: sql<number>`sum(${payouts.netAmount})`,
        })
        .from(payouts)
        .leftJoin(supplierProfiles, eq(payouts.supplierId, supplierProfiles.id))
        .where(
          and(
            eq(payouts.status, "completed"),
            gte(payouts.createdAt, startDate),
            lte(payouts.createdAt, endDate)
          )
        )
        .groupBy(payouts.supplierId, supplierProfiles.businessName);

      return supplierPayouts.map(item => {
        const totalPayouts = Number(item.totalPayouts || 0);
        const form1099Required = totalPayouts >= 600; // IRS threshold for 1099
        
        return {
          supplierId: item.supplierId,
          supplierName: item.supplierName || 'Unknown Supplier',
          totalPayouts,
          taxableAmount: totalPayouts,
          form1099Required,
          withholdingAmount: 0, // Would calculate based on supplier tax status
        };
      });
    } catch (error) {
      console.error("Error getting supplier tax breakdown:", error);
      return [];
    }
  }

  /**
   * Get category tax breakdown
   */
  private async getCategoryTaxBreakdown(startDate: Date, endDate: Date): Promise<CategoryTaxData[]> {
    try {
      // This would require proper order-product-category relationships
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error("Error getting category tax breakdown:", error);
      return [];
    }
  }

  /**
   * Export report to different formats
   */
  async exportReport(reportData: any, format: 'pdf' | 'excel' | 'csv' | 'json'): Promise<Buffer | string> {
    try {
      switch (format) {
        case 'json':
          return JSON.stringify(reportData, null, 2);
        case 'csv':
          return this.convertToCSV(reportData);
        case 'excel':
          // Would use a library like xlsx to generate Excel files
          throw new Error("Excel export not implemented");
        case 'pdf':
          // Would use a library like puppeteer or pdfkit to generate PDFs
          throw new Error("PDF export not implemented");
        default:
          throw new Error("Unsupported export format");
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      throw new Error("Failed to export report");
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    try {
      if (!data.data || !data.data.details || !Array.isArray(data.data.details)) {
        return "No data available";
      }

      const items = data.data.details;
      if (items.length === 0) {
        return "No data available";
      }

      // Get headers from first item
      const headers = Object.keys(items[0]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...items.map(item => 
          headers.map(header => {
            const value = item[header];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error("Error converting to CSV:", error);
      return "Error generating CSV";
    }
  }
}

export const financialAnalyticsService = FinancialAnalyticsService.getInstance();