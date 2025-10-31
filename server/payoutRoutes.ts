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
 * Advanced automated payout processing endpoint
 */
router.post("/admin/financial/payouts/automated-processing", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { supplierIds, approveAll } = req.body;
    
    // Create payout batch
    const batch = await payoutService.createPayoutBatch(
      supplierIds,
      req.user!.id
    );
    
    if (!batch) {
      return res.status(400).json({ error: "No eligible suppliers for payout" });
    }
    
    // If approveAll is true, process the batch immediately
    if (approveAll) {
      const result = await payoutService.processPayoutBatch(batch.id);
      res.json({
        batch,
        processingResult: result,
        message: "Automated payout batch created and processed"
      });
    } else {
      res.json({
        batch,
        message: "Automated payout batch created and queued for approval"
      });
    }
  } catch (error) {
    console.error("Error processing automated payouts:", error);
    res.status(500).json({ error: "Failed to process automated payouts" });
  }
});

/**
 * Get payout processing queue with priority
 */
router.get("/admin/payouts/queue", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { limit } = paginationSchema.parse(req.query);
    const limitNum = limit ? parseInt(limit) : 50;
    
    const queue = await payoutService.getPayoutProcessingQueue(limitNum);
    res.json(queue);
  } catch (error) {
    console.error("Error fetching payout queue:", error);
    res.status(500).json({ error: "Failed to fetch payout queue" });
  }
});

/**
 * Bulk approve payouts
 */
router.post("/admin/payouts/bulk-approve", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { payoutIds } = req.body;
    
    if (!Array.isArray(payoutIds) || payoutIds.length === 0) {
      return res.status(400).json({ error: "Payout IDs array is required" });
    }
    
    const result = await payoutService.bulkApprovePayouts(payoutIds, req.user!.id);
    res.json(result);
  } catch (error) {
    console.error("Error bulk approving payouts:", error);
    res.status(500).json({ error: "Failed to bulk approve payouts" });
  }
});

/**
 * Get payment method configurations
 */
router.get("/admin/payouts/payment-methods", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const methods = payoutService.getPaymentMethods();
    res.json(methods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ error: "Failed to fetch payment methods" });
  }
});

/**
 * Validate payment method for supplier
 */
router.post("/admin/payouts/validate-method", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { supplierId, method } = req.body;
    
    if (!supplierId || !method) {
      return res.status(400).json({ error: "Supplier ID and payment method are required" });
    }
    
    const validation = await payoutService.validatePaymentMethod(supplierId, method);
    res.json(validation);
  } catch (error) {
    console.error("Error validating payment method:", error);
    res.status(500).json({ error: "Failed to validate payment method" });
  }
});

/**
 * Get payout failure analysis
 */
router.get("/admin/payouts/failure-analysis", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const analysis = await payoutService.getPayoutFailureAnalysis(start, end);
    res.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid date range", details: error.errors });
    }
    console.error("Error fetching failure analysis:", error);
    res.status(500).json({ error: "Failed to fetch failure analysis" });
  }
});

/**
 * Get automated payout configuration
 */
router.get("/admin/payouts/config", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const config = payoutService.getAutomatedPayoutConfig();
    res.json(config);
  } catch (error) {
    console.error("Error fetching payout config:", error);
    res.status(500).json({ error: "Failed to fetch payout configuration" });
  }
});

/**
 * Update automated payout configuration
 */
router.put("/admin/payouts/config", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const configSchema = z.object({
      enabled: z.boolean().optional(),
      schedule: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
      minAmount: z.number().min(0).optional(),
      maxBatchSize: z.number().min(1).optional(),
      requireApproval: z.boolean().optional(),
      approvalThreshold: z.number().min(0).optional(),
      retryAttempts: z.number().min(0).optional(),
      retryDelay: z.number().min(1).optional(),
    });
    
    const validatedConfig = configSchema.parse(req.body);
    await payoutService.updateAutomatedPayoutConfig(validatedConfig);
    
    res.json({ message: "Payout configuration updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid configuration", details: error.errors });
    }
    console.error("Error updating payout config:", error);
    res.status(500).json({ error: "Failed to update payout configuration" });
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