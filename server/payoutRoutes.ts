import express from "express";
import { payoutService } from "./payoutService";
import { requireAuth, requireRole } from "./auth";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const payoutMethodSchema = z.object({
  method: z.enum(['bank_transfer', 'paypal', 'stripe']).default('bank_transfer'),
});

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const paginationSchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// ==================== ADMIN PAYOUT MANAGEMENT ====================

/**
 * Get payout summary for admin dashboard
 */
router.get("/admin/summary", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const summary = await payoutService.getPayoutSummary(start, end);
    res.json(summary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid date range", details: error.errors });
    }
    console.error("Error fetching payout summary:", error);
    res.status(500).json({ error: "Failed to fetch payout summary" });
  }
});

/**
 * Get all pending payouts for processing
 */
router.get("/admin/pending", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;
    
    // This would need to be implemented in payoutService
    // For now, return empty array as placeholder
    res.json([]);
  } catch (error) {
    console.error("Error fetching pending payouts:", error);
    res.status(500).json({ error: "Failed to fetch pending payouts" });
  }
});

/**
 * Process all pending payouts
 */
router.post("/admin/process-all", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const result = await payoutService.processAllPendingPayouts();
    res.json(result);
  } catch (error) {
    console.error("Error processing all payouts:", error);
    res.status(500).json({ error: "Failed to process payouts" });
  }
});

/**
 * Process a specific payout
 */
router.post("/admin/process/:payoutId", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { payoutId } = req.params;
    const result = await payoutService.processPayout(payoutId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error processing payout:", error);
    res.status(500).json({ error: "Failed to process payout" });
  }
});

/**
 * Retry a failed payout
 */
router.post("/admin/retry/:payoutId", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { payoutId } = req.params;
    const result = await payoutService.retryFailedPayout(payoutId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error retrying payout:", error);
    res.status(500).json({ error: "Failed to retry payout" });
  }
});

// ==================== SUPPLIER PAYOUT MANAGEMENT ====================

/**
 * Get supplier's earnings summary
 */
router.get("/supplier/earnings", requireAuth, requireRole(["supplier"]), async (req, res) => {
  try {
    const supplierId = req.user!.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier profile not found" });
    }
    
    const summary = await payoutService.getSupplierEarningsSummary(supplierId);
    res.json(summary);
  } catch (error) {
    console.error("Error fetching supplier earnings:", error);
    res.status(500).json({ error: "Failed to fetch earnings summary" });
  }
});

/**
 * Get supplier's payout history
 */
router.get("/supplier/history", requireAuth, requireRole(["supplier"]), async (req, res) => {
  try {
    const supplierId = req.user!.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier profile not found" });
    }
    
    const { startDate, endDate, limit, offset } = {
      ...dateRangeSchema.parse(req.query),
      ...paginationSchema.parse(req.query),
    };
    
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const history = await payoutService.getSupplierPayoutHistory(
      supplierId,
      limitNum,
      offsetNum,
      start,
      end
    );
    
    res.json(history);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    console.error("Error fetching payout history:", error);
    res.status(500).json({ error: "Failed to fetch payout history" });
  }
});

/**
 * Get supplier's pending payout calculation
 */
router.get("/supplier/pending", requireAuth, requireRole(["supplier"]), async (req, res) => {
  try {
    const supplierId = req.user!.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier profile not found" });
    }
    
    const pendingPayout = await payoutService.calculatePendingPayouts(supplierId);
    res.json(pendingPayout);
  } catch (error) {
    console.error("Error calculating pending payouts:", error);
    res.status(500).json({ error: "Failed to calculate pending payouts" });
  }
});

/**
 * Request payout for supplier
 */
router.post("/supplier/request", requireAuth, requireRole(["supplier"]), async (req, res) => {
  try {
    const supplierId = req.user!.supplierId;
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier profile not found" });
    }
    
    const { method } = payoutMethodSchema.parse(req.body);
    
    const payoutId = await payoutService.schedulePayout(supplierId, method);
    
    if (payoutId) {
      res.json({ 
        success: true, 
        payoutId,
        message: "Payout request submitted successfully" 
      });
    } else {
      res.status(400).json({ 
        error: "No eligible earnings for payout or minimum threshold not met" 
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payout method", details: error.errors });
    }
    console.error("Error requesting payout:", error);
    res.status(500).json({ error: "Failed to request payout" });
  }
});

// ==================== INTERNAL PAYOUT OPERATIONS ====================

/**
 * Schedule payout for a supplier (internal use)
 */
router.post("/schedule", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { supplierId, method } = req.body;
    
    if (!supplierId) {
      return res.status(400).json({ error: "Supplier ID is required" });
    }
    
    const validatedMethod = payoutMethodSchema.parse({ method: method || 'bank_transfer' });
    
    const payoutId = await payoutService.schedulePayout(supplierId, validatedMethod.method);
    
    if (payoutId) {
      res.json({ 
        success: true, 
        payoutId,
        message: "Payout scheduled successfully" 
      });
    } else {
      res.status(400).json({ 
        error: "No eligible earnings for payout or minimum threshold not met" 
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    console.error("Error scheduling payout:", error);
    res.status(500).json({ error: "Failed to schedule payout" });
  }
});

/**
 * Calculate pending payouts for a supplier (internal use)
 */
router.get("/calculate/:supplierId", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { supplierId } = req.params;
    const pendingPayout = await payoutService.calculatePendingPayouts(supplierId);
    res.json(pendingPayout);
  } catch (error) {
    console.error("Error calculating pending payouts:", error);
    res.status(500).json({ error: "Failed to calculate pending payouts" });
  }
});

export default router;