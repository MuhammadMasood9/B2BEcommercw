import express from "express";
import { financialAnalyticsService } from "./financialAnalyticsService";
import { requireAuth, requireRole } from "./auth";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  compareWithPrevious: z.string().optional().transform(val => val === 'true'),
});

const reportParametersSchema = z.object({
  dateRange: z.object({
    start: z.string().transform(str => new Date(str)),
    end: z.string().transform(str => new Date(str)),
    period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  }),
  filters: z.object({
    supplierIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    tiers: z.array(z.string()).optional(),
    paymentMethods: z.array(z.string()).optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
  }).optional(),
  groupBy: z.array(z.string()).optional(),
  metrics: z.array(z.string()),
  includeCharts: z.boolean().default(false),
  includeComparisons: z.boolean().default(false),
});

const taxReportSchema = z.object({
  year: z.number().min(2020).max(2030),
  quarter: z.number().min(1).max(4).optional(),
});

const exportSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
});

// ==================== FINANCIAL DASHBOARD ====================

/**
 * Get comprehensive financial dashboard
 */
router.get("/admin/financial/dashboard", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate, compareWithPrevious } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(
      start,
      end,
      compareWithPrevious
    );
    
    res.json(dashboard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching financial dashboard:", error);
    res.status(500).json({ error: "Failed to fetch financial dashboard" });
  }
});

/**
 * Get financial overview metrics
 */
router.get("/admin/financial/overview", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate, compareWithPrevious } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(
      start,
      end,
      compareWithPrevious
    );
    
    // Return only the overview section
    res.json(dashboard.overview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching financial overview:", error);
    res.status(500).json({ error: "Failed to fetch financial overview" });
  }
});

/**
 * Get financial trends data
 */
router.get("/admin/financial/trends", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(start, end, false);
    
    // Return only the trends section
    res.json(dashboard.trends);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching financial trends:", error);
    res.status(500).json({ error: "Failed to fetch financial trends" });
  }
});

/**
 * Get financial breakdown data
 */
router.get("/admin/financial/breakdown", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const breakdownType = req.query.type as string;
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(start, end, false);
    
    // Return specific breakdown or all breakdowns
    if (breakdownType && dashboard.breakdown[breakdownType as keyof typeof dashboard.breakdown]) {
      res.json(dashboard.breakdown[breakdownType as keyof typeof dashboard.breakdown]);
    } else {
      res.json(dashboard.breakdown);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching financial breakdown:", error);
    res.status(500).json({ error: "Failed to fetch financial breakdown" });
  }
});

/**
 * Get financial forecasting data
 */
router.get("/admin/financial/forecasting", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(start, end, false);
    
    // Return only the forecasting section
    res.json(dashboard.forecasting);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching financial forecasting:", error);
    res.status(500).json({ error: "Failed to fetch financial forecasting" });
  }
});

// ==================== CUSTOM REPORTS ====================

/**
 * Generate custom financial report
 */
router.post("/admin/financial/reports/generate", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const parameters = reportParametersSchema.parse(req.body);
    
    const report = await financialAnalyticsService.generateCustomReport(parameters);
    
    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid report parameters", details: error.errors });
    }
    console.error("Error generating custom report:", error);
    res.status(500).json({ error: "Failed to generate custom report" });
  }
});

/**
 * Export financial report
 */
router.post("/admin/financial/reports/export", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { format } = exportSchema.parse(req.body);
    const reportData = req.body.reportData;
    
    if (!reportData) {
      return res.status(400).json({ error: "Report data is required" });
    }
    
    const exportedData = await financialAnalyticsService.exportReport(reportData, format);
    
    // Set appropriate headers based on format
    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="financial_report.csv"');
        break;
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="financial_report.json"');
        break;
      case 'excel':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="financial_report.xlsx"');
        break;
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="financial_report.pdf"');
        break;
    }
    
    res.send(exportedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid export parameters", details: error.errors });
    }
    console.error("Error exporting report:", error);
    res.status(500).json({ error: "Failed to export report" });
  }
});

// ==================== TAX REPORTING ====================

/**
 * Generate tax report
 */
router.post("/admin/financial/tax-report", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { year, quarter } = taxReportSchema.parse(req.body);
    
    const taxReport = await financialAnalyticsService.generateTaxReport(year, quarter);
    
    res.json(taxReport);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid tax report parameters", details: error.errors });
    }
    console.error("Error generating tax report:", error);
    res.status(500).json({ error: "Failed to generate tax report" });
  }
});

/**
 * Get tax compliance summary
 */
router.get("/admin/financial/tax-compliance", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Generate current year tax report for compliance overview
    const taxReport = await financialAnalyticsService.generateTaxReport(currentYear);
    
    // Return only compliance information
    res.json({
      year: currentYear,
      compliance: taxReport.compliance,
      summary: taxReport.summary,
    });
  } catch (error) {
    console.error("Error fetching tax compliance:", error);
    res.status(500).json({ error: "Failed to fetch tax compliance data" });
  }
});

// ==================== REVENUE ANALYTICS ====================

/**
 * Get revenue analytics
 */
router.get("/admin/financial/revenue/analytics", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(start, end, true);
    
    // Return revenue-focused analytics
    res.json({
      overview: {
        totalRevenue: dashboard.overview.totalRevenue,
        revenueGrowth: dashboard.overview.revenueGrowth,
        profitMargin: dashboard.overview.profitMargin,
      },
      trends: dashboard.trends.revenue,
      breakdown: {
        byTier: dashboard.breakdown.byTier.map(tier => ({
          tier: tier.tier,
          revenue: tier.revenue,
          orders: tier.orders,
          suppliers: tier.suppliers,
          growth: tier.growth,
        })),
        bySupplier: dashboard.breakdown.bySupplier.map(supplier => ({
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          revenue: supplier.revenue,
          orders: supplier.orders,
          growth: supplier.growth,
        })),
      },
      forecasting: dashboard.forecasting.revenueProjection,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({ error: "Failed to fetch revenue analytics" });
  }
});

/**
 * Get commission analytics
 */
router.get("/admin/financial/commission/analytics", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(start, end, true);
    
    // Return commission-focused analytics
    res.json({
      overview: {
        totalCommission: dashboard.overview.totalCommission,
        commissionGrowth: dashboard.overview.commissionGrowth,
        avgCommissionRate: dashboard.breakdown.byTier.reduce((sum, tier) => sum + tier.avgCommissionRate, 0) / dashboard.breakdown.byTier.length,
      },
      trends: dashboard.trends.commission,
      breakdown: {
        byTier: dashboard.breakdown.byTier.map(tier => ({
          tier: tier.tier,
          commission: tier.commission,
          avgCommissionRate: tier.avgCommissionRate,
          suppliers: tier.suppliers,
        })),
        bySupplier: dashboard.breakdown.bySupplier.map(supplier => ({
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          commission: supplier.commission,
          commissionRate: supplier.commissionRate,
          tier: supplier.tier,
        })),
      },
      forecasting: dashboard.forecasting.commissionProjection,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching commission analytics:", error);
    res.status(500).json({ error: "Failed to fetch commission analytics" });
  }
});

/**
 * Get payout analytics
 */
router.get("/admin/financial/payout/analytics", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(start, end, true);
    
    // Return payout-focused analytics
    res.json({
      overview: {
        totalPayouts: dashboard.overview.totalPayouts,
        payoutGrowth: dashboard.overview.payoutGrowth,
        netProfit: dashboard.overview.netProfit,
      },
      trends: dashboard.trends.payouts,
      breakdown: {
        byPaymentMethod: dashboard.breakdown.byPaymentMethod,
        bySupplier: dashboard.breakdown.bySupplier.map(supplier => ({
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          payouts: supplier.payouts,
          tier: supplier.tier,
        })),
      },
      forecasting: dashboard.forecasting.payoutProjection,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching payout analytics:", error);
    res.status(500).json({ error: "Failed to fetch payout analytics" });
  }
});

// ==================== PREDICTIVE ANALYTICS ====================

/**
 * Get predictive financial analytics
 */
router.get("/admin/financial/predictive", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const dashboard = await financialAnalyticsService.getFinancialDashboard(start, end, false);
    
    // Return predictive analytics
    res.json({
      forecasting: dashboard.forecasting,
      insights: {
        revenueGrowthTrend: dashboard.overview.revenueGrowth > 0 ? 'positive' : dashboard.overview.revenueGrowth < 0 ? 'negative' : 'stable',
        commissionEfficiency: dashboard.overview.profitMargin,
        payoutTrend: dashboard.overview.payoutGrowth,
        recommendations: [
          dashboard.overview.revenueGrowth < 0 ? 'Consider reviewing commission rates to attract more suppliers' : null,
          dashboard.overview.profitMargin < 10 ? 'Profit margin is low, consider optimizing commission structure' : null,
          dashboard.breakdown.byTier.find(t => t.tier === 'free' && t.suppliers > dashboard.breakdown.byTier.find(t => t.tier === 'platinum')?.suppliers) ? 'Consider incentivizing tier upgrades' : null,
        ].filter(Boolean),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching predictive analytics:", error);
    res.status(500).json({ error: "Failed to fetch predictive analytics" });
  }
});

export default router;