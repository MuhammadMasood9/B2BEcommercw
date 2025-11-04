import { Router, Request } from "express";
import { eq, and, or, desc, asc, sql, ilike } from "drizzle-orm";
import { db } from "./db";
import { 
  inquiries, 
  quotations, 
  inquiryQuotations,
  inquiryTemplates,
  products, 
  supplierProfiles, 
  users,
  buyers,
  notifications,
  insertInquirySchema,
  insertNotificationSchema,
  type Inquiry,
  type InquiryQuotation
} from "@shared/schema";
import { authMiddleware } from "./auth";

const router = Router();

// Extend Request interface to include buyer
interface AuthenticatedRequest extends Request {
  user?: any;
  buyer?: any;
}

// Middleware to ensure user is authenticated and is a buyer
const buyerMiddleware = async (req: AuthenticatedRequest, res: any, next: any) => {
  try {
    await authMiddleware(req, res, () => {});
    
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user is a buyer
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: "Buyer access required" });
    }

    // Get buyer profile
    const buyerResult = await db
      .select()
      .from(buyers)
      .where(eq(buyers.userId, req.user.id))
      .limit(1);

    if (buyerResult.length === 0) {
      return res.status(404).json({ error: "Buyer profile not found" });
    }

    req.buyer = buyerResult[0];
    next();
  } catch (error) {
    console.error("Buyer middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// GET /api/buyer/inquiries - Get buyer's inquiries with quotations
router.get("/", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      status, 
      search, 
      sort = "newest", 
      limit = "20", 
      offset = "0",
      productId,
      supplierId 
    } = req.query;

    // Build base query
    let baseQuery = db
      .select({
        inquiry: inquiries,
        product: products,
        supplier: supplierProfiles,
        quotationCount: sql<number>`(
          SELECT COUNT(*) FROM ${inquiryQuotations} 
          WHERE ${inquiryQuotations.inquiryId} = ${inquiries.id}
        )`.as("quotationCount")
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(supplierProfiles, eq(inquiries.supplierId, supplierProfiles.userId));

    // Apply filters
    const conditions = [eq(inquiries.buyerId, req.buyer.id)];

    if (status && status !== "all") {
      conditions.push(eq(inquiries.status, status as string));
    }

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(inquiries.subject, `%${search}%`),
          ilike(inquiries.message, `%${search}%`),
          ilike(supplierProfiles.businessName, `%${search}%`)
        )
      );
    }

    if (productId) {
      conditions.push(eq(inquiries.productId, productId as string));
    }

    if (supplierId) {
      conditions.push(eq(inquiries.supplierId, supplierId as string));
    }

    // Apply where conditions
    baseQuery = baseQuery.where(and(...conditions));

    // Apply sorting
    switch (sort) {
      case "oldest":
        baseQuery = baseQuery.orderBy(asc(inquiries.createdAt));
        break;
      case "status":
        baseQuery = baseQuery.orderBy(asc(inquiries.status), desc(inquiries.createdAt));
        break;
      case "product":
        baseQuery = baseQuery.orderBy(asc(products.name), desc(inquiries.createdAt));
        break;
      case "supplier":
        baseQuery = baseQuery.orderBy(asc(supplierProfiles.businessName), desc(inquiries.createdAt));
        break;
      default: // newest
        baseQuery = baseQuery.orderBy(desc(inquiries.createdAt));
    }

    // Apply pagination
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;
    
    const result = await baseQuery.limit(limitNum).offset(offsetNum);

    // Get quotations for each inquiry
    const inquiriesWithQuotations = await Promise.all(
      result.map(async (item) => {
        const quotations = await db
          .select()
          .from(inquiryQuotations)
          .where(eq(inquiryQuotations.inquiryId, item.inquiry.id))
          .orderBy(desc(inquiryQuotations.createdAt));

        return {
          ...item.inquiry,
          product: item.product,
          supplier: item.supplier,
          quotationCount: item.quotationCount,
          quotations
        };
      })
    );

    res.json({
      inquiries: inquiriesWithQuotations,
      total: result.length,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error("Error fetching buyer inquiries:", error);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// POST /api/buyer/inquiries - Create new inquiry
router.post("/", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      productId,
      supplierId,
      subject,
      message,
      quantity,
      targetPrice,
      requirements,
      urgency = "normal",
      deadline
    } = req.body;

    // Validate required fields
    if (!productId || !subject || !message) {
      return res.status(400).json({ 
        error: "Product ID, subject, and message are required" 
      });
    }

    // Verify product exists
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productResult.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productResult[0];

    // If supplierId is provided, verify it exists
    let supplier = null;
    if (supplierId) {
      const supplierResult = await db
        .select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, supplierId))
        .limit(1);

      if (supplierResult.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      supplier = supplierResult[0];
    } else if (product.supplierId) {
      // Use product's supplier if no specific supplier provided
      const supplierResult = await db
        .select()
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, product.supplierId))
        .limit(1);

      if (supplierResult.length > 0) {
        supplier = supplierResult[0];
      }
    }

    // Create inquiry
    const inquiryData = {
      buyerId: req.buyer.id,
      supplierId: supplier?.userId || product.supplierId,
      productId,
      subject,
      message,
      quantity: quantity ? parseInt(quantity) : null,
      targetPrice: targetPrice ? parseFloat(targetPrice).toString() : null,
      requirements: requirements || null,
      status: "pending" as const
    };

    const [newInquiry] = await db
      .insert(inquiries)
      .values(inquiryData)
      .returning();

    // Create notification for supplier
    if (supplier && req.user) {
      await db.insert(notifications).values({
        userId: supplier.userId,
        type: "info",
        title: "New Product Inquiry",
        message: `You have received a new inquiry for ${product.name} from ${req.user.firstName} ${req.user.lastName}`,
        relatedId: newInquiry.id,
        relatedType: "inquiry"
      });
    }

    // Increment product inquiry count
    await db
      .update(products)
      .set({ 
        inquiries: sql`${products.inquiries} + 1` 
      })
      .where(eq(products.id, productId));

    res.status(201).json({
      message: "Inquiry sent successfully",
      inquiry: {
        ...newInquiry,
        product,
        supplier
      }
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    res.status(500).json({ error: "Failed to create inquiry" });
  }
});

// GET /api/buyer/inquiries/:id - Get specific inquiry with quotations
router.get("/:id", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Get inquiry with related data
    const inquiryResult = await db
      .select({
        inquiry: inquiries,
        product: products,
        supplier: supplierProfiles
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(supplierProfiles, eq(inquiries.supplierId, supplierProfiles.userId))
      .where(and(
        eq(inquiries.id, id),
        eq(inquiries.buyerId, req.buyer.id)
      ))
      .limit(1);

    if (inquiryResult.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const { inquiry, product, supplier } = inquiryResult[0];

    // Get quotations for this inquiry
    const quotations = await db
      .select()
      .from(inquiryQuotations)
      .where(eq(inquiryQuotations.inquiryId, id))
      .orderBy(desc(inquiryQuotations.createdAt));

    res.json({
      ...inquiry,
      product,
      supplier,
      quotations
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({ error: "Failed to fetch inquiry" });
  }
});

// PUT /api/buyer/inquiries/:id - Update inquiry (for counter-offers)
router.put("/:id", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { quantity, targetPrice, message, requirements, urgency } = req.body;

    // Verify inquiry ownership
    const inquiryResult = await db
      .select()
      .from(inquiries)
      .where(and(
        eq(inquiries.id, id),
        eq(inquiries.buyerId, req.buyer.id)
      ))
      .limit(1);

    if (inquiryResult.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const inquiry = inquiryResult[0];

    // Only allow updates if inquiry is still active
    if (inquiry.status === "closed") {
      return res.status(400).json({ error: "Cannot update closed inquiry" });
    }

    // Update inquiry
    const updateData: any = {
      updatedAt: new Date()
    };

    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (targetPrice !== undefined) updateData.targetPrice = parseFloat(targetPrice);
    if (message !== undefined) updateData.message = message;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (urgency !== undefined) updateData.urgency = urgency;

    const [updatedInquiry] = await db
      .update(inquiries)
      .set(updateData)
      .where(eq(inquiries.id, id))
      .returning();

    // Create notification for supplier about the update
    if (inquiry.supplierId) {
      await db.insert(notifications).values({
        userId: inquiry.supplierId,
        type: "info",
        title: "Inquiry Updated",
        message: `The buyer has updated their inquiry. Please review the changes.`,
        relatedId: id,
        relatedType: "inquiry"
      });
    }

    res.json({
      message: "Inquiry updated successfully",
      inquiry: updatedInquiry
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    res.status(500).json({ error: "Failed to update inquiry" });
  }
});

// POST /api/buyer/inquiries/:id/counter-offer - Send counter offer
router.post("/:id/counter-offer", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { quantity, targetPrice, message, requirements, urgency, deadline } = req.body;

    // Verify inquiry ownership
    const inquiryResult = await db
      .select()
      .from(inquiries)
      .where(and(
        eq(inquiries.id, id),
        eq(inquiries.buyerId, req.buyer.id)
      ))
      .limit(1);

    if (inquiryResult.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const inquiry = inquiryResult[0];

    // Update inquiry with counter-offer details
    const updateData: any = {
      quantity: quantity ? parseInt(quantity) : inquiry.quantity,
      targetPrice: targetPrice ? parseFloat(targetPrice) : inquiry.targetPrice,
      message: message || inquiry.message,
      requirements: requirements || inquiry.requirements,
      status: "pending", // Reset to pending for supplier response
      updatedAt: new Date()
    };

    const [updatedInquiry] = await db
      .update(inquiries)
      .set(updateData)
      .where(eq(inquiries.id, id))
      .returning();

    // Create notification for supplier
    if (inquiry.supplierId) {
      await db.insert(notifications).values({
        userId: inquiry.supplierId,
        type: "info",
        title: "Counter Offer Received",
        message: `The buyer has sent a counter offer for their inquiry. Please review and respond.`,
        relatedId: id,
        relatedType: "inquiry"
      });
    }

    res.json({
      message: "Counter offer sent successfully",
      inquiry: updatedInquiry
    });
  } catch (error) {
    console.error("Error sending counter offer:", error);
    res.status(500).json({ error: "Failed to send counter offer" });
  }
});

// DELETE /api/buyer/inquiries/:id - Cancel inquiry
router.delete("/:id", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verify inquiry ownership
    const inquiryResult = await db
      .select()
      .from(inquiries)
      .where(and(
        eq(inquiries.id, id),
        eq(inquiries.buyerId, req.buyer.id)
      ))
      .limit(1);

    if (inquiryResult.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const inquiry = inquiryResult[0];

    // Only allow cancellation if inquiry is still pending
    if (inquiry.status !== "pending") {
      return res.status(400).json({ 
        error: "Can only cancel pending inquiries" 
      });
    }

    // Update status to closed instead of deleting
    await db
      .update(inquiries)
      .set({ 
        status: "closed",
        updatedAt: new Date()
      })
      .where(eq(inquiries.id, id));

    // Create notification for supplier
    if (inquiry.supplierId) {
      await db.insert(notifications).values({
        userId: inquiry.supplierId,
        type: "info",
        title: "Inquiry Cancelled",
        message: `The buyer has cancelled their inquiry.`,
        relatedId: id,
        relatedType: "inquiry"
      });
    }

    res.json({
      message: "Inquiry cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling inquiry:", error);
    res.status(500).json({ error: "Failed to cancel inquiry" });
  }
});

// GET /api/buyer/inquiries/:id/quotations - Get quotations for specific inquiry
router.get("/:id/quotations", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verify inquiry ownership
    const inquiryResult = await db
      .select()
      .from(inquiries)
      .where(and(
        eq(inquiries.id, id),
        eq(inquiries.buyerId, req.buyer.id)
      ))
      .limit(1);

    if (inquiryResult.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // Get quotations with supplier information
    const quotations = await db
      .select({
        quotation: inquiryQuotations,
        supplier: supplierProfiles
      })
      .from(inquiryQuotations)
      .leftJoin(supplierProfiles, eq(inquiryQuotations.inquiryId, supplierProfiles.userId))
      .where(eq(inquiryQuotations.inquiryId, id))
      .orderBy(desc(inquiryQuotations.createdAt));

    res.json({
      quotations: quotations.map(item => ({
        ...item.quotation,
        supplier: item.supplier
      }))
    });
  } catch (error) {
    console.error("Error fetching inquiry quotations:", error);
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

// GET /api/buyer/quotations - Get all quotations for buyer (both inquiry and RFQ quotations)
router.get("/quotations", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      status, 
      search, 
      sort = "newest", 
      type = "all",
      limit = "20", 
      offset = "0" 
    } = req.query;

    const quotations: any[] = [];

    // Get inquiry quotations
    if (type === "all" || type === "inquiry") {
      const inquiryQuotationsQuery = db
        .select({
          quotation: inquiryQuotations,
          inquiry: inquiries,
          product: products,
          supplier: supplierProfiles
        })
        .from(inquiryQuotations)
        .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
        .leftJoin(products, eq(inquiries.productId, products.id))
        .leftJoin(supplierProfiles, eq(inquiries.supplierId, supplierProfiles.userId))
        .where(eq(inquiries.buyerId, req.buyer.id));

      const inquiryQuotations_result = await inquiryQuotationsQuery;
      
      quotations.push(...inquiryQuotations_result.map(item => ({
        id: item.quotation.id,
        type: "inquiry",
        inquiryId: item.inquiry.id,
        productName: item.product?.name || "Unknown Product",
        supplierName: item.supplier?.businessName,
        unitPrice: parseFloat(item.quotation.pricePerUnit?.toString() || "0"),
        totalPrice: parseFloat(item.quotation.totalPrice?.toString() || "0"),
        quantity: item.inquiry.quantity || 0,
        moq: item.quotation.moq || 0,
        leadTime: item.quotation.leadTime || "Not specified",
        paymentTerms: item.quotation.paymentTerms || "Not specified",
        validUntil: item.quotation.validUntil,
        status: item.quotation.status,
        message: item.quotation.message,
        createdAt: item.quotation.createdAt,
        attachments: item.quotation.attachments
      })));
    }

    // Get RFQ quotations
    if (type === "all" || type === "rfq") {
      // This would need to be implemented based on your RFQ system
      // For now, we'll leave this as a placeholder
    }

    // Apply filters
    let filteredQuotations = quotations;

    if (status && status !== "all") {
      filteredQuotations = filteredQuotations.filter(q => q.status === status);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredQuotations = filteredQuotations.filter(q =>
        q.productName.toLowerCase().includes(searchLower) ||
        (q.supplierName && q.supplierName.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filteredQuotations.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price-low":
          return a.unitPrice - b.unitPrice;
        case "price-high":
          return b.unitPrice - a.unitPrice;
        case "total-low":
          return a.totalPrice - b.totalPrice;
        case "total-high":
          return b.totalPrice - a.totalPrice;
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Apply pagination
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedQuotations = filteredQuotations.slice(offsetNum, offsetNum + limitNum);

    res.json({
      quotations: paginatedQuotations,
      total: filteredQuotations.length,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error("Error fetching buyer quotations:", error);
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

export default router;