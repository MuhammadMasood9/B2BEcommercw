import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "./auth";
import {
  getComprehensiveOrderMonitoring,
  createDispute,
  getDisputes,
  updateDisputeStatus,
  addDisputeMessage,
  getDisputeMessages,
  createOrderIntervention,
  getOrderInterventions,
  createRefund,
  updateRefundStatus,
  getRefunds,
  detectOrderAnomalies,
  updateAnomalyStatus,
} from "./orderManagementService";

const router = Router();

// ==================== ORDER MONITORING ROUTES ====================

// GET /api/admin/orders/comprehensive-monitoring
router.get("/comprehensive-monitoring", authMiddleware, async (req, res) => {
  try {
    const {
      status,
      supplierId,
      buyerId,
      dateFrom,
      dateTo,
      search,
      limit = "50",
      offset = "0"
    } = req.query;

    const filters = {
      status: status as string,
      supplierId: supplierId as string,
      buyerId: buyerId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      search: search as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const monitoringData = await getComprehensiveOrderMonitoring(filters);

    res.json({
      success: true,
      data: monitoringData,
    });
  } catch (error) {
    console.error("Error fetching comprehensive order monitoring:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order monitoring data",
    });
  }
});

// POST /api/admin/orders/:id/detect-anomalies
router.post("/:id/detect-anomalies", authMiddleware, async (req, res) => {
  try {
    const { id: orderId } = req.params;
    
    const anomalies = await detectOrderAnomalies(orderId);

    res.json({
      success: true,
      data: { anomalies },
    });
  } catch (error) {
    console.error("Error detecting order anomalies:", error);
    res.status(500).json({
      success: false,
      error: "Failed to detect order anomalies",
    });
  }
});

// GET /api/admin/orders/:id/interventions
router.get("/:id/interventions", authMiddleware, async (req, res) => {
  try {
    const { id: orderId } = req.params;
    
    const interventions = await getOrderInterventions(orderId);

    res.json({
      success: true,
      data: { interventions },
    });
  } catch (error) {
    console.error("Error fetching order interventions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order interventions",
    });
  }
});

// POST /api/admin/orders/:id/intervene
router.post("/:id/intervene", authMiddleware, async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: "Admin authentication required",
      });
    }

    const interventionSchema = z.object({
      type: z.enum(['status_override', 'refund_processing', 'communication_facilitation', 'escalation']),
      reason: z.string().min(1),
      actionTaken: z.string().min(1),
      previousStatus: z.string().optional(),
      newStatus: z.string().optional(),
      previousData: z.any().optional(),
      newData: z.any().optional(),
      financialImpact: z.number().optional(),
      commissionAdjustment: z.number().optional(),
    });

    const validatedData = interventionSchema.parse(req.body);

    const intervention = await createOrderIntervention({
      orderId,
      adminId,
      ...validatedData,
    });

    res.json({
      success: true,
      data: { intervention },
    });
  } catch (error) {
    console.error("Error creating order intervention:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create order intervention",
    });
  }
});

// ==================== DISPUTE MANAGEMENT ROUTES ====================

// POST /api/admin/disputes/resolution-workflow
router.post("/disputes/resolution-workflow", authMiddleware, async (req, res) => {
  try {
    const disputeSchema = z.object({
      orderId: z.string(),
      buyerId: z.string(),
      supplierId: z.string(),
      type: z.enum(['product_quality', 'shipping_delay', 'wrong_item', 'payment_issue', 'communication', 'other']),
      title: z.string().min(1),
      description: z.string().min(1),
      amount: z.number().optional(),
      evidence: z.array(z.any()).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    });

    const validatedData = disputeSchema.parse(req.body);

    const dispute = await createDispute(validatedData);

    res.json({
      success: true,
      data: { dispute },
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create dispute",
    });
  }
});

// GET /api/admin/disputes
router.get("/disputes", authMiddleware, async (req, res) => {
  try {
    const {
      status,
      supplierId,
      buyerId,
      limit = "50",
      offset = "0"
    } = req.query;

    const filters = {
      status: status as string,
      supplierId: supplierId as string,
      buyerId: buyerId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await getDisputes(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching disputes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch disputes",
    });
  }
});

// PUT /api/admin/disputes/:id/status
router.put("/disputes/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id: disputeId } = req.params;
    const mediatorId = req.user?.id;

    const statusSchema = z.object({
      status: z.enum(['open', 'under_review', 'mediation', 'resolved', 'closed']),
      resolutionType: z.enum(['refund', 'replacement', 'partial_refund', 'no_action', 'custom']).optional(),
      resolutionSummary: z.string().optional(),
      mediationNotes: z.string().optional(),
    });

    const validatedData = statusSchema.parse(req.body);

    const dispute = await updateDisputeStatus(
      disputeId,
      validatedData.status,
      mediatorId,
      {
        resolutionType: validatedData.resolutionType,
        resolutionSummary: validatedData.resolutionSummary,
        mediationNotes: validatedData.mediationNotes,
      }
    );

    res.json({
      success: true,
      data: { dispute },
    });
  } catch (error) {
    console.error("Error updating dispute status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update dispute status",
    });
  }
});

// POST /api/admin/disputes/:id/messages
router.post("/disputes/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { id: disputeId } = req.params;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const messageSchema = z.object({
      message: z.string().min(1),
      attachments: z.array(z.string()).optional(),
      isInternal: z.boolean().optional(),
    });

    const validatedData = messageSchema.parse(req.body);

    const message = await addDisputeMessage({
      disputeId,
      senderId,
      senderType: 'admin',
      ...validatedData,
    });

    res.json({
      success: true,
      data: { message },
    });
  } catch (error) {
    console.error("Error adding dispute message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add dispute message",
    });
  }
});

// GET /api/admin/disputes/:id/messages
router.get("/disputes/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { id: disputeId } = req.params;
    
    const messages = await getDisputeMessages(disputeId);

    res.json({
      success: true,
      data: { messages },
    });
  } catch (error) {
    console.error("Error fetching dispute messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dispute messages",
    });
  }
});

// ==================== REFUND PROCESSING ROUTES ====================

// POST /api/admin/refunds
router.post("/refunds", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: "Admin authentication required",
      });
    }

    const refundSchema = z.object({
      orderId: z.string(),
      disputeId: z.string().optional(),
      buyerId: z.string(),
      supplierId: z.string(),
      refundAmount: z.number().positive(),
      originalAmount: z.number().positive(),
      refundType: z.enum(['full', 'partial', 'shipping_only']),
      reason: z.string().min(1),
      commissionAdjustment: z.number().optional(),
      supplierDeduction: z.number().optional(),
      paymentMethod: z.string().optional(),
      adminNotes: z.string().optional(),
    });

    const validatedData = refundSchema.parse(req.body);

    const refund = await createRefund({
      ...validatedData,
      adminId,
    });

    res.json({
      success: true,
      data: { refund },
    });
  } catch (error) {
    console.error("Error creating refund:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create refund",
    });
  }
});

// GET /api/admin/refunds
router.get("/refunds", authMiddleware, async (req, res) => {
  try {
    const {
      status,
      supplierId,
      buyerId,
      limit = "50",
      offset = "0"
    } = req.query;

    const filters = {
      status: status as string,
      supplierId: supplierId as string,
      buyerId: buyerId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await getRefunds(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch refunds",
    });
  }
});

// PUT /api/admin/refunds/:id/status
router.put("/refunds/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id: refundId } = req.params;

    const statusSchema = z.object({
      status: z.enum(['pending', 'processing', 'completed', 'failed']),
      transactionId: z.string().optional(),
    });

    const validatedData = statusSchema.parse(req.body);

    const refund = await updateRefundStatus(
      refundId,
      validatedData.status,
      validatedData.transactionId
    );

    res.json({
      success: true,
      data: { refund },
    });
  } catch (error) {
    console.error("Error updating refund status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update refund status",
    });
  }
});

// ==================== DISPUTE ANALYTICS ROUTES ====================

// GET /api/admin/disputes/analytics
router.get("/disputes/analytics", authMiddleware, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const { getDisputeAnalytics } = await import("./orderManagementService");
    const analytics = await getDisputeAnalytics(filters.dateFrom, filters.dateTo);

    res.json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    console.error("Error fetching dispute analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dispute analytics",
    });
  }
});

// GET /api/admin/disputes/patterns
router.get("/disputes/patterns", authMiddleware, async (req, res) => {
  try {
    const { detectDisputePatterns } = await import("./orderManagementService");
    const patterns = await detectDisputePatterns();

    res.json({
      success: true,
      data: { patterns },
    });
  } catch (error) {
    console.error("Error detecting dispute patterns:", error);
    res.status(500).json({
      success: false,
      error: "Failed to detect dispute patterns",
    });
  }
});

// ==================== ANOMALY MANAGEMENT ROUTES ====================

// PUT /api/admin/anomalies/:id/status
router.put("/anomalies/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id: anomalyId } = req.params;
    const reviewerId = req.user?.id;

    const statusSchema = z.object({
      status: z.enum(['flagged', 'investigating', 'resolved', 'false_positive']),
      reviewNotes: z.string().optional(),
    });

    const validatedData = statusSchema.parse(req.body);

    const anomaly = await updateAnomalyStatus(
      anomalyId,
      validatedData.status,
      validatedData.reviewNotes,
      reviewerId
    );

    res.json({
      success: true,
      data: { anomaly },
    });
  } catch (error) {
    console.error("Error updating anomaly status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update anomaly status",
    });
  }
});

export { router as orderManagementRoutes };