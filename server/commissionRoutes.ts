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