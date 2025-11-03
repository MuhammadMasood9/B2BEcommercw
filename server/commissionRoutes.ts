import express from "express";
import { commissionService } from "./commissionService";
import { requireAuth, requireRole } from "./auth";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const commissionRatesSchema = z.object({
  defaultRate: z.number().min(0).max(100).optional(),
  freeRate: z.number().min(0).max(100).optional(),
  silverRate: z.number().min(0).max(100).optional(),
  goldRate: z.number().min(0).max(100).optional(),
  platinumRate: z.number().min(0).max(100).optional(),
  categoryRates: z.record(z.string(), z.number().min(0).max(100)).optional(),
  vendorOverrides: z.record(z.string(), z.number().min(0).max(100)).optional(),
});

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const supplierCommissionSchema = z.object({
  supplierId: z.string(),
  customRate: z.number().min(0).max(100),
});

// ==================== ADMIN COMMISSION MANAGEMENT ====================

/**
 * Get current commission settings
 */
router.get("/admin/settings", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const rates = await commissionService["getCommissionRates"]();
    res.json(rates);
  } catch (error) {
    console.error("Error fetching commission settings:", error);
    res.status(500).json({ error: "Failed to fetch commission settings" });
  }
});

/**
 * Advanced commission settings endpoint with impact analysis
 */
router.put("/admin/financial/commission/advanced-settings", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const validatedData = commissionRatesSchema.parse(req.body);
    
    // Analyze impact before applying changes
    const impactAnalysis = await commissionService.analyzeCommissionImpact(validatedData);
    
    // Apply the changes
    await commissionService.updateCommissionSettings(validatedData, req.user!.id);
    
    res.json({ 
      message: "Commission settings updated successfully",
      impactAnalysis 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error updating advanced commission settings:", error);
    res.status(500).json({ error: "Failed to update commission settings" });
  }
});

/**
 * Analyze commission impact without applying changes
 */
router.post("/admin/commission/impact-analysis", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const validatedData = commissionRatesSchema.parse(req.body);
    const impactAnalysis = await commissionService.analyzeCommissionImpact(validatedData);
    res.json(impactAnalysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error analyzing commission impact:", error);
    res.status(500).json({ error: "Failed to analyze commission impact" });
  }
});

/**
 * Simulate commission changes on historical data
 */
router.post("/admin/commission/simulate", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { rateChanges, startDate, endDate } = req.body;
    const validatedRates = commissionRatesSchema.parse(rateChanges);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const simulation = await commissionService.simulateCommissionChanges(validatedRates, start, end);
    res.json(simulation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error simulating commission changes:", error);
    res.status(500).json({ error: "Failed to simulate commission changes" });
  }
});

/**
 * Get commission history and change tracking
 */
router.get("/admin/commission/history", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await commissionService.getCommissionHistory(entityType, entityId, limit);
    res.json(history);
  } catch (error) {
    console.error("Error fetching commission history:", error);
    res.status(500).json({ error: "Failed to fetch commission history" });
  }
});

/**
 * Create commission adjustment for dispute resolution
 */
router.post("/admin/commission/adjustment", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { orderId, disputeId, adjustmentType, adjustmentAmount, reason } = req.body;
    
    if (!orderId || !adjustmentType || !adjustmentAmount || !reason) {
      return res.status(400).json({ error: "Missing required fields: orderId, adjustmentType, adjustmentAmount, reason" });
    }
    
    const adjustment = await commissionService.createCommissionAdjustment({
      orderId,
      disputeId,
      adjustmentType,
      adjustmentAmount: parseFloat(adjustmentAmount),
      reason,
      adminId: req.user!.id,
    });
    
    res.json({ 
      message: "Commission adjustment created successfully",
      adjustment 
    });
  } catch (error) {
    console.error("Error creating commission adjustment:", error);
    res.status(500).json({ error: "Failed to create commission adjustment" });
  }
});

/**
 * Get commission adjustments
 */
router.get("/admin/commission/adjustments", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { orderId, disputeId, limit = 50, offset = 0 } = req.query;
    
    const adjustments = await commissionService.getCommissionAdjustments({
      orderId: orderId as string,
      disputeId: disputeId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    
    res.json(adjustments);
  } catch (error) {
    console.error("Error fetching commission adjustments:", error);
    res.status(500).json({ error: "Failed to fetch commission adjustments" });
  }
});

/**
 * Export commission report
 */
router.get("/admin/commission/export", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, includeAdjustments = 'true' } = req.query;
    
    const reportData = await commissionService.generateCommissionReport({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      includeAdjustments: includeAdjustments === 'true',
    });
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=commission-report.csv');
      res.send(reportData.csv);
    } else {
      res.json(reportData.data);
    }
  } catch (error) {
    console.error("Error exporting commission report:", error);
    res.status(500).json({ error: "Failed to export commission report" });
  }
});

/**
 * Bulk update supplier commission rates
 */
router.post("/admin/commission/bulk-update", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Updates must be an array" });
    }
    
    // Validate each update
    const validatedUpdates = updates.map(update => {
      if (!update.supplierId || typeof update.customRate !== 'number') {
        throw new Error("Each update must have supplierId and customRate");
      }
      return {
        supplierId: update.supplierId,
        customRate: update.customRate,
      };
    });
    
    await commissionService.bulkUpdateSupplierRates(validatedUpdates, req.user!.id);
    
    res.json({ 
      message: `Successfully updated commission rates for ${validatedUpdates.length} suppliers` 
    });
  } catch (error) {
    console.error("Error bulk updating supplier rates:", error);
    res.status(500).json({ error: "Failed to bulk update supplier rates" });
  }
});

/**
 * Get advanced commission analytics
 */
router.get("/admin/commission/analytics", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const analytics = await commissionService.getAdvancedCommissionAnalytics(start, end);
    res.json(analytics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid date range", details: error.errors });
    }
    console.error("Error fetching commission analytics:", error);
    res.status(500).json({ error: "Failed to fetch commission analytics" });
  }
});

/**
 * Update commission settings
 */
router.patch("/admin/settings", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const validatedData = commissionRatesSchema.parse(req.body);
    await commissionService.updateCommissionSettings(validatedData, req.user!.id);
    res.json({ message: "Commission settings updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error updating commission settings:", error);
    res.status(500).json({ error: "Failed to update commission settings" });
  }
});

/**
 * Set custom commission rate for a supplier
 */
router.post("/admin/supplier-rate", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { supplierId, customRate } = supplierCommissionSchema.parse(req.body);
    await commissionService.setSupplierCommissionRate(supplierId, customRate);
    res.json({ message: "Supplier commission rate updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error setting supplier commission rate:", error);
    res.status(500).json({ error: "Failed to set supplier commission rate" });
  }
});

/**
 * Get platform commission summary
 */
router.get("/admin/summary", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const summary = await commissionService.getPlatformCommissionSummary(start, end);
    res.json(summary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid date range", details: error.errors });
    }
    console.error("Error fetching platform commission summary:", error);
    res.status(500).json({ error: "Failed to fetch commission summary" });
  }
});

/**
 * Get commission tracking report
 */
router.get("/admin/tracking", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const supplierId = req.query.supplierId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const report = await commissionService.getCommissionTrackingReport(
      supplierId,
      start,
      end,
      limit,
      offset
    );
    
    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching commission tracking report:", error);
    res.status(500).json({ error: "Failed to fetch commission tracking report" });
  }
});

// ==================== SUPPLIER COMMISSION VIEWS ====================

/**
 * Get supplier's commission rate
 */
router.get("/supplier/rate", requireAuth, requireRole(["supplier"]), async (req, res) => {
  try {
    const supplierId = req.user!.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier profile not found" });
    }
    
    const categoryId = req.query.categoryId as string | undefined;
    const rate = await commissionService.calculateCommissionRate(supplierId, categoryId);
    
    res.json({ commissionRate: rate });
  } catch (error) {
    console.error("Error fetching supplier commission rate:", error);
    res.status(500).json({ error: "Failed to fetch commission rate" });
  }
});

/**
 * Get supplier's commission summary
 */
router.get("/supplier/summary", requireAuth, requireRole(["supplier"]), async (req, res) => {
  try {
    const supplierId = req.user!.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier profile not found" });
    }
    
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const summary = await commissionService.getSupplierCommissionSummary(
      supplierId,
      start,
      end
    );
    
    res.json(summary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid date range", details: error.errors });
    }
    console.error("Error fetching supplier commission summary:", error);
    res.status(500).json({ error: "Failed to fetch commission summary" });
  }
});

/**
 * Get supplier's commission history
 */
router.get("/supplier/history", requireAuth, requireRole(["supplier"]), async (req, res) => {
  try {
    const supplierId = req.user!.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier profile not found" });
    }
    
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const history = await commissionService.getCommissionTrackingReport(
      supplierId,
      start,
      end,
      limit,
      offset
    );
    
    res.json(history);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching supplier commission history:", error);
    res.status(500).json({ error: "Failed to fetch commission history" });
  }
});

// ==================== ORDER COMMISSION CALCULATION ====================

/**
 * Calculate commission for an order (internal use)
 */
router.post("/calculate", requireAuth, async (req, res) => {
  try {
    const { orderId, supplierId, orderAmount, categoryId } = req.body;
    
    if (!orderId || !supplierId || !orderAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const calculation = await commissionService.calculateOrderCommission(
      orderId,
      supplierId,
      parseFloat(orderAmount),
      categoryId
    );
    
    res.json(calculation);
  } catch (error) {
    console.error("Error calculating commission:", error);
    res.status(500).json({ error: "Failed to calculate commission" });
  }
});

/**
 * Apply commission to an order (internal use)
 */
router.post("/apply", requireAuth, async (req, res) => {
  try {
    const { orderId, supplierId, orderAmount, categoryId } = req.body;
    
    if (!orderId || !supplierId || !orderAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const calculation = await commissionService.applyCommissionToOrder(
      orderId,
      supplierId,
      parseFloat(orderAmount),
      categoryId
    );
    
    res.json(calculation);
  } catch (error) {
    console.error("Error applying commission:", error);
    res.status(500).json({ error: "Failed to apply commission" });
  }
});

export default router;