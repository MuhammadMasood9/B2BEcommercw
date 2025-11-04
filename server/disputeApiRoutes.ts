import { Router } from "express";
import { eq, and, or, desc, asc, ilike, sql, gte, lte, isNull, ne, count, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  disputes,
  orders,
  buyers,
  supplierProfiles,
  users,
  InsertDispute,
  Dispute
} from "@shared/schema";
import { hybridAuthMiddleware } from "./authMiddleware";
import { requireAuth, requireAdmin, requireRoles } from "./authGuards";
import RBACService from "./rbacService";
import { upload } from "./upload";
import { adminMiddleware } from "./auth";
import { adminMiddleware } from "./auth";
import { adminMiddleware } from "./auth";
import { adminMiddleware } from "./auth";
import { adminMiddleware } from "./auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(hybridAuthMiddleware);
router.use(requireAuth);

// GET /api/admin/disputes - Get all disputes for admin management
router.get("/admin/disputes", adminMiddleware, async (req, res) => {
  try {
    const {
      search,
      status,
      disputeType,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        dispute: disputes,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          totalAmount: orders.totalAmount
        },
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName
        },
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName
        },
        admin: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(disputes)
      .leftJoin(orders, eq(disputes.orderId, orders.id))
      .leftJoin(buyers, eq(disputes.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.id))
      .leftJoin(users, eq(disputes.adminId, users.id));

    const conditions = [];

    // Search filter
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(disputes.description, `%${search}%`),
          ilike(orders.orderNumber, `%${search}%`),
          ilike(buyers.companyName, `%${search}%`),
          ilike(supplierProfiles.businessName, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status && typeof status === 'string') {
      conditions.push(eq(disputes.status, status));
    }

    // Dispute type filter
    if (disputeType && typeof disputeType === 'string') {
      conditions.push(eq(disputes.disputeType, disputeType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'disputeType' ? disputes.disputeType :
                      sortBy === 'status' ? disputes.status :
                      sortBy === 'resolvedAt' ? disputes.resolvedAt :
                      disputes.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(disputes)
      .leftJoin(orders, eq(disputes.orderId, orders.id))
      .leftJoin(buyers, eq(disputes.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.id));

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    const formattedDisputes = result.map(row => ({
      ...row.dispute,
      order: row.order,
      buyer: row.buyer,
      supplier: row.supplier,
      admin: row.admin
    }));

    res.json({
      success: true,
      disputes: formattedDisputes,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching admin disputes:", error);
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

// GET /api/admin/disputes/:id - Get specific dispute details for admin
router.get("/admin/disputes/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .select({
        dispute: disputes,
        order: orders,
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName,
          industry: buyers.industry,
          businessType: buyers.businessType
        },
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          contactPerson: supplierProfiles.contactPerson,
          phone: supplierProfiles.phone,
          email: supplierProfiles.email
        },
        admin: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(disputes)
      .leftJoin(orders, eq(disputes.orderId, orders.id))
      .leftJoin(buyers, eq(disputes.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.id))
      .leftJoin(users, eq(disputes.adminId, users.id))
      .where(eq(disputes.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    const disputeData = {
      ...result[0].dispute,
      order: result[0].order,
      buyer: result[0].buyer,
      supplier: result[0].supplier,
      admin: result[0].admin
    };

    res.json({
      success: true,
      dispute: disputeData
    });
  } catch (error) {
    console.error("Error fetching dispute details:", error);
    res.status(500).json({ error: "Failed to fetch dispute details" });
  }
});

// PUT /api/admin/disputes/:id/assign - Assign dispute to admin
router.put("/admin/disputes/:id/assign", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Verify dispute exists and is not already resolved
    const disputeExists = await db
      .select({ id: disputes.id, status: disputes.status })
      .from(disputes)
      .where(and(
        eq(disputes.id, id),
        ne(disputes.status, 'resolved'),
        ne(disputes.status, 'closed')
      ))
      .limit(1);

    if (disputeExists.length === 0) {
      return res.status(404).json({ error: "Dispute not found or already resolved" });
    }

    // Assign dispute to admin
    await db
      .update(disputes)
      .set({
        adminId,
        status: 'investigating',
        updatedAt: new Date()
      })
      .where(eq(disputes.id, id));

    res.json({
      success: true,
      message: "Dispute assigned successfully"
    });
  } catch (error) {
    console.error("Error assigning dispute:", error);
    res.status(500).json({ error: "Failed to assign dispute" });
  }
});

// PUT /api/admin/disputes/:id/resolve - Resolve dispute
router.put("/admin/disputes/:id/resolve", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, refundAmount, adminNotes } = req.body;
    const adminId = req.user.id;

    if (!resolution) {
      return res.status(400).json({ error: "Resolution is required" });
    }

    // Verify dispute exists and admin is assigned
    const disputeResult = await db
      .select({
        dispute: disputes,
        order: orders
      })
      .from(disputes)
      .leftJoin(orders, eq(disputes.orderId, orders.id))
      .where(and(
        eq(disputes.id, id),
        or(
          eq(disputes.adminId, adminId),
          isNull(disputes.adminId)
        )
      ))
      .limit(1);

    if (disputeResult.length === 0) {
      return res.status(404).json({ error: "Dispute not found or access denied" });
    }

    const { dispute, order } = disputeResult[0];

    // Validate refund amount if provided
    let refundAmountNum = null;
    if (refundAmount !== undefined && refundAmount !== null) {
      refundAmountNum = parseFloat(refundAmount);
      if (refundAmountNum < 0 || (order && refundAmountNum > parseFloat(order.totalAmount))) {
        return res.status(400).json({ error: "Invalid refund amount" });
      }
    }

    // Update dispute with resolution
    await db
      .update(disputes)
      .set({
        adminId,
        status: 'resolved',
        resolution: resolution.trim(),
        refundAmount: refundAmountNum ? refundAmountNum.toString() : null,
        adminNotes: adminNotes || null,
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(disputes.id, id));

    res.json({
      success: true,
      message: "Dispute resolved successfully"
    });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    res.status(500).json({ error: "Failed to resolve dispute" });
  }
});

// POST /api/admin/disputes/:id/evidence - Upload evidence for dispute
router.post("/admin/disputes/:id/evidence", adminMiddleware, upload.array('evidence', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one evidence file is required" });
    }

    // Verify dispute exists
    const disputeExists = await db
      .select({ id: disputes.id, adminNotes: disputes.adminNotes })
      .from(disputes)
      .where(eq(disputes.id, id))
      .limit(1);

    if (disputeExists.length === 0) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    // Process uploaded files
    const evidenceFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));

    // Update dispute with admin evidence and notes
    const existingNotes = disputeExists[0].adminNotes || '';
    const newNotes = notes ? `${existingNotes}\n\nAdmin Evidence (${new Date().toISOString()}): ${notes}` : existingNotes;

    await db
      .update(disputes)
      .set({
        adminNotes: newNotes,
        updatedAt: new Date()
        // Note: In a full implementation, you'd store evidence files in a separate table
      })
      .where(eq(disputes.id, id));

    res.json({
      success: true,
      message: "Evidence uploaded successfully",
      evidence: evidenceFiles
    });
  } catch (error) {
    console.error("Error uploading dispute evidence:", error);
    res.status(500).json({ error: "Failed to upload evidence" });
  }
});

// ==================== BUYER/SUPPLIER DISPUTE CREATION ROUTES ====================

// POST /api/disputes - Create new dispute (buyer or supplier)
router.post("/disputes", async (req, res) => {
  try {
    const {
      orderId,
      disputeType,
      description,
      evidence
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate required fields
    if (!orderId || !disputeType || !description) {
      return res.status(400).json({ 
        error: "Missing required fields: orderId, disputeType, description" 
      });
    }

    const validDisputeTypes = ['quality', 'delivery', 'payment', 'other'];
    if (!validDisputeTypes.includes(disputeType)) {
      return res.status(400).json({ error: "Invalid dispute type" });
    }

    // Verify order exists and user is involved
    const orderResult = await db
      .select({
        order: orders,
        buyer: buyers,
        supplier: supplierProfiles
      })
      .from(orders)
      .leftJoin(buyers, eq(orders.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { order, buyer, supplier } = orderResult[0];

    // Check if user is involved in the order
    let buyerId = null;
    let supplierId = null;

    if (req.user.role === 'buyer') {
      if (!buyer || buyer.userId !== req.user.id) {
        return res.status(403).json({ error: "You are not authorized to dispute this order" });
      }
      buyerId = buyer.id;
      supplierId = supplier?.id || null;
    } else if (req.user.role === 'supplier') {
      if (!supplier || supplier.userId !== req.user.id) {
        return res.status(403).json({ error: "You are not authorized to dispute this order" });
      }
      supplierId = supplier.id;
      buyerId = buyer?.id || null;
    } else {
      return res.status(403).json({ error: "Only buyers and suppliers can create disputes" });
    }

    // Check if dispute already exists for this order
    const existingDispute = await db
      .select({ id: disputes.id })
      .from(disputes)
      .where(and(
        eq(disputes.orderId, orderId),
        or(
          eq(disputes.status, 'open'),
          eq(disputes.status, 'investigating')
        )
      ))
      .limit(1);

    if (existingDispute.length > 0) {
      return res.status(400).json({ error: "An active dispute already exists for this order" });
    }

    const disputeData: InsertDispute = {
      orderId,
      buyerId,
      supplierId,
      disputeType,
      description: description.trim(),
      buyerEvidence: req.user.role === 'buyer' ? (evidence || []) : [],
      supplierEvidence: req.user.role === 'supplier' ? (evidence || []) : [],
      status: 'open'
    };

    const [newDispute] = await db.insert(disputes).values(disputeData).returning();

    res.status(201).json({
      success: true,
      message: "Dispute created successfully",
      dispute: newDispute
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({ error: "Failed to create dispute" });
  }
});

// GET /api/disputes/my - Get user's disputes (buyer or supplier)
router.get("/disputes/my", async (req, res) => {
  try {
    const {
      status,
      disputeType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        dispute: disputes,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          totalAmount: orders.totalAmount
        },
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName
        },
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName
        }
      })
      .from(disputes)
      .leftJoin(orders, eq(disputes.orderId, orders.id))
      .leftJoin(buyers, eq(disputes.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.id));

    const conditions = [];

    // Filter by user role
    if (req.user.role === 'buyer') {
      // Get buyer profile
      const buyerProfile = await db
        .select({ id: buyers.id })
        .from(buyers)
        .where(eq(buyers.userId, req.user.id))
        .limit(1);

      if (buyerProfile.length === 0) {
        return res.status(404).json({ error: "Buyer profile not found" });
      }

      conditions.push(eq(disputes.buyerId, buyerProfile[0].id));
    } else if (req.user.role === 'supplier') {
      // Get supplier profile
      const supplierProfile = await db
        .select({ id: supplierProfiles.id })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, req.user.id))
        .limit(1);

      if (supplierProfile.length === 0) {
        return res.status(404).json({ error: "Supplier profile not found" });
      }

      conditions.push(eq(disputes.supplierId, supplierProfile[0].id));
    } else {
      return res.status(403).json({ error: "Invalid user role for dispute access" });
    }

    // Status filter
    if (status && typeof status === 'string') {
      conditions.push(eq(disputes.status, status));
    }

    // Dispute type filter
    if (disputeType && typeof disputeType === 'string') {
      conditions.push(eq(disputes.disputeType, disputeType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'disputeType' ? disputes.disputeType :
                      sortBy === 'status' ? disputes.status :
                      disputes.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(disputes)
      .where(and(...conditions));

    const [{ count: totalCount }] = await countQuery;

    const formattedDisputes = result.map(row => ({
      ...row.dispute,
      order: row.order,
      buyer: row.buyer,
      supplier: row.supplier
    }));

    res.json({
      success: true,
      disputes: formattedDisputes,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching user disputes:", error);
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

// POST /api/disputes/:id/evidence - Upload evidence for dispute (buyer or supplier)
router.post("/disputes/:id/evidence", upload.array('evidence', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one evidence file is required" });
    }

    // Verify dispute exists and user is involved
    const disputeResult = await db
      .select({
        dispute: disputes,
        buyer: buyers,
        supplier: supplierProfiles
      })
      .from(disputes)
      .leftJoin(buyers, eq(disputes.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.id))
      .where(eq(disputes.id, id))
      .limit(1);

    if (disputeResult.length === 0) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    const { dispute, buyer, supplier } = disputeResult[0];

    // Check if user is involved in the dispute
    let canUpload = false;
    let evidenceField = '';

    if (req.user.role === 'buyer' && buyer && buyer.userId === req.user.id) {
      canUpload = true;
      evidenceField = 'buyerEvidence';
    } else if (req.user.role === 'supplier' && supplier && supplier.userId === req.user.id) {
      canUpload = true;
      evidenceField = 'supplierEvidence';
    }

    if (!canUpload) {
      return res.status(403).json({ error: "You are not authorized to upload evidence for this dispute" });
    }

    // Process uploaded files
    const evidenceFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      notes: notes || '',
      uploadedAt: new Date()
    }));

    // Update dispute with new evidence
    const existingEvidence = evidenceField === 'buyerEvidence' ? dispute.buyerEvidence : dispute.supplierEvidence;
    const updatedEvidence = [...(existingEvidence || []), ...evidenceFiles];

    const updateData = {
      [evidenceField]: updatedEvidence,
      updatedAt: new Date()
    };

    await db
      .update(disputes)
      .set(updateData)
      .where(eq(disputes.id, id));

    res.json({
      success: true,
      message: "Evidence uploaded successfully",
      evidence: evidenceFiles
    });
  } catch (error) {
    console.error("Error uploading dispute evidence:", error);
    res.status(500).json({ error: "Failed to upload evidence" });
  }
});

export default router;