import { Router, Request } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { 
  inquiryQuotations, 
  quotations,
  inquiries,
  rfqs,
  orders,
  products,
  supplierProfiles,
  buyers,
  notifications,
  insertOrderSchema,
  insertNotificationSchema,
  type InquiryQuotation,
  type Quotation
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

// POST /api/inquiry-quotations/:id/accept - Accept inquiry quotation
router.post("/inquiry-quotations/:id/accept", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { shippingAddress, notes } = req.body;

    if (!shippingAddress?.trim()) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    // Get quotation with related data
    const quotationResult = await db
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
      .where(and(
        eq(inquiryQuotations.id, id),
        eq(inquiries.buyerId, req.buyer.id),
        eq(inquiryQuotations.status, "pending")
      ))
      .limit(1);

    if (quotationResult.length === 0) {
      return res.status(404).json({ 
        error: "Quotation not found or not available for acceptance" 
      });
    }

    const { quotation, inquiry, product, supplier } = quotationResult[0];

    if (!product) {
      return res.status(400).json({ 
        error: "Cannot create order: Product information not found" 
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate amounts
    const quantity = inquiry.quantity || quotation.moq || 1;
    const unitPrice = parseFloat(quotation.pricePerUnit?.toString() || "0");
    const totalAmount = parseFloat(quotation.totalPrice?.toString() || "0");

    // Create order
    const orderData = {
      orderNumber,
      buyerId: req.buyer.id,
      inquiryId: inquiry.id,
      quotationId: quotation.id,
      supplierId: inquiry.supplierId,
      productId: product.id,
      quantity,
      unitPrice: unitPrice.toString(),
      totalAmount: totalAmount.toString(),
      shippingAmount: "0",
      taxAmount: "0",
      items: [{
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        totalPrice: totalAmount
      }],
      status: "confirmed",
      paymentStatus: "pending",
      shippingAddress: {
        address: shippingAddress,
        notes: notes || null
      },
      notes: notes || null
    };

    const [newOrder] = await db
      .insert(orders)
      .values(orderData)
      .returning();

    // Update quotation status
    await db
      .update(inquiryQuotations)
      .set({ 
        status: "accepted"
      })
      .where(eq(inquiryQuotations.id, id));

    // Update inquiry status
    await db
      .update(inquiries)
      .set({ 
        status: "responded",
        updatedAt: new Date()
      })
      .where(eq(inquiries.id, inquiry.id));

    // Create notifications
    if (supplier) {
      await db.insert(notifications).values({
        userId: supplier.userId,
        type: "success",
        title: "Quotation Accepted",
        message: `Your quotation for ${product.name} has been accepted. Order #${orderNumber} has been created.`,
        relatedId: newOrder.id,
        relatedType: "order"
      });
    }

    if (req.user) {
      await db.insert(notifications).values({
        userId: req.user.id,
        type: "success",
        title: "Order Created",
        message: `Your order #${orderNumber} has been created successfully.`,
        relatedId: newOrder.id,
        relatedType: "order"
      });
    }

    res.json({
      message: "Quotation accepted and order created successfully",
      order: newOrder,
      orderNumber
    });
  } catch (error) {
    console.error("Error accepting inquiry quotation:", error);
    res.status(500).json({ error: "Failed to accept quotation" });
  }
});

// POST /api/inquiry-quotations/:id/reject - Reject inquiry quotation
router.post("/inquiry-quotations/:id/reject", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    // Get quotation with related data
    const quotationResult = await db
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
      .where(and(
        eq(inquiryQuotations.id, id),
        eq(inquiries.buyerId, req.buyer.id),
        eq(inquiryQuotations.status, "pending")
      ))
      .limit(1);

    if (quotationResult.length === 0) {
      return res.status(404).json({ 
        error: "Quotation not found or not available for rejection" 
      });
    }

    const { quotation, inquiry, product, supplier } = quotationResult[0];

    // Update quotation status
    await db
      .update(inquiryQuotations)
      .set({ 
        status: "rejected",
        rejectionReason: reason
      })
      .where(eq(inquiryQuotations.id, id));

    // Create notification for supplier
    if (supplier && product) {
      await db.insert(notifications).values({
        userId: supplier.userId,
        type: "info",
        title: "Quotation Rejected",
        message: `Your quotation for ${product.name} has been rejected. Reason: ${reason}`,
        relatedId: quotation.id,
        relatedType: "quotation"
      });
    }

    res.json({
      message: "Quotation rejected successfully"
    });
  } catch (error) {
    console.error("Error rejecting inquiry quotation:", error);
    res.status(500).json({ error: "Failed to reject quotation" });
  }
});

// POST /api/quotations/:id/accept - Accept RFQ quotation
router.post("/quotations/:id/accept", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { shippingAddress, notes } = req.body;

    if (!shippingAddress?.trim()) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    // Get RFQ quotation with related data
    const quotationResult = await db
      .select({
        quotation: quotations,
        rfq: rfqs,
        product: products,
        supplier: supplierProfiles
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .leftJoin(products, eq(rfqs.categoryId, products.categoryId)) // This is a simplified join - you might need better logic
      .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
      .where(and(
        eq(quotations.id, id),
        eq(rfqs.buyerId, req.buyer.id),
        eq(quotations.status, "sent")
      ))
      .limit(1);

    if (quotationResult.length === 0) {
      return res.status(404).json({ 
        error: "Quotation not found or not available for acceptance" 
      });
    }

    const { quotation, rfq, product, supplier } = quotationResult[0];

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate amounts
    const quantity = rfq.quantity || quotation.moq || 1;
    const unitPrice = parseFloat(quotation.unitPrice?.toString() || "0");
    const totalAmount = parseFloat(quotation.totalPrice?.toString() || "0");

    // Create order
    const orderData = {
      orderNumber,
      buyerId: req.buyer.id,
      rfqId: rfq.id,
      quotationId: quotation.id,
      supplierId: quotation.supplierId,
      productId: product?.id || null,
      quantity,
      unitPrice: unitPrice.toString(),
      totalAmount: totalAmount.toString(),
      shippingAmount: "0",
      taxAmount: "0",
      items: [{
        productId: product?.id || null,
        productName: product?.name || rfq.title,
        quantity,
        unitPrice,
        totalPrice: totalAmount
      }],
      status: "confirmed",
      paymentStatus: "pending",
      shippingAddress: {
        address: shippingAddress,
        notes: notes || null
      },
      notes: notes || null
    };

    const [newOrder] = await db
      .insert(orders)
      .values(orderData)
      .returning();

    // Update quotation status
    await db
      .update(quotations)
      .set({ 
        status: "accepted",
        updatedAt: new Date()
      })
      .where(eq(quotations.id, id));

    // Update RFQ status
    await db
      .update(rfqs)
      .set({ 
        status: "closed",
        updatedAt: new Date()
      })
      .where(eq(rfqs.id, rfq.id));

    // Create notifications
    if (supplier) {
      await db.insert(notifications).values({
        userId: supplier.userId,
        type: "success",
        title: "RFQ Quotation Accepted",
        message: `Your quotation for RFQ "${rfq.title}" has been accepted. Order #${orderNumber} has been created.`,
        relatedId: newOrder.id,
        relatedType: "order"
      });
    }

    if (req.user) {
      await db.insert(notifications).values({
        userId: req.user.id,
        type: "success",
        title: "Order Created",
        message: `Your order #${orderNumber} has been created successfully.`,
        relatedId: newOrder.id,
        relatedType: "order"
      });
    }

    res.json({
      message: "Quotation accepted and order created successfully",
      order: newOrder,
      orderNumber
    });
  } catch (error) {
    console.error("Error accepting RFQ quotation:", error);
    res.status(500).json({ error: "Failed to accept quotation" });
  }
});

// POST /api/quotations/:id/reject - Reject RFQ quotation
router.post("/quotations/:id/reject", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    // Get RFQ quotation with related data
    const quotationResult = await db
      .select({
        quotation: quotations,
        rfq: rfqs,
        supplier: supplierProfiles
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
      .where(and(
        eq(quotations.id, id),
        eq(rfqs.buyerId, req.buyer.id),
        eq(quotations.status, "sent")
      ))
      .limit(1);

    if (quotationResult.length === 0) {
      return res.status(404).json({ 
        error: "Quotation not found or not available for rejection" 
      });
    }

    const { quotation, rfq, supplier } = quotationResult[0];

    // Update quotation status
    await db
      .update(quotations)
      .set({ 
        status: "rejected",
        updatedAt: new Date()
      })
      .where(eq(quotations.id, id));

    // Create notification for supplier
    if (supplier) {
      await db.insert(notifications).values({
        userId: supplier.userId,
        type: "info",
        title: "RFQ Quotation Rejected",
        message: `Your quotation for RFQ "${rfq.title}" has been rejected. Reason: ${reason}`,
        relatedId: quotation.id,
        relatedType: "quotation"
      });
    }

    res.json({
      message: "Quotation rejected successfully"
    });
  } catch (error) {
    console.error("Error rejecting RFQ quotation:", error);
    res.status(500).json({ error: "Failed to reject quotation" });
  }
});

// GET /api/buyer/quotations - Get all quotations for buyer (combined endpoint)
router.get("/buyer/quotations", buyerMiddleware, async (req: AuthenticatedRequest, res) => {
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

      const inquiryQuotationsResult = await inquiryQuotationsQuery;
      
      quotations.push(...inquiryQuotationsResult.map(item => ({
        id: item.quotation.id,
        type: "inquiry",
        inquiryId: item.inquiry.id,
        productName: item.product?.name || "Unknown Product",
        supplierName: item.supplier?.businessName,
        adminName: item.supplier?.businessName, // For compatibility
        unitPrice: parseFloat(item.quotation.pricePerUnit?.toString() || "0"),
        totalPrice: parseFloat(item.quotation.totalPrice?.toString() || "0"),
        quantity: item.inquiry.quantity || 0,
        inquiryQuantity: item.inquiry.quantity || 0,
        moq: item.quotation.moq || 0,
        leadTime: item.quotation.leadTime || "Not specified",
        paymentTerms: item.quotation.paymentTerms || "Not specified",
        validUntil: item.quotation.validUntil,
        status: item.quotation.status,
        message: item.quotation.message,
        createdAt: item.quotation.createdAt,
        quotationDate: item.quotation.createdAt,
        attachments: item.quotation.attachments,
        pricePerUnit: parseFloat(item.quotation.pricePerUnit?.toString() || "0"),
        totalAmount: parseFloat(item.quotation.totalPrice?.toString() || "0")
      })));
    }

    // Get RFQ quotations
    if (type === "all" || type === "rfq") {
      try {
        const rfqQuotationsResult = await db
          .select({
            quotation: quotations,
            rfq: rfqs,
            supplier: supplierProfiles
          })
          .from(quotations)
          .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
          .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
          .where(eq(rfqs.buyerId, req.buyer.id));
        
        quotations.push(...rfqQuotationsResult.map(item => ({
          id: item.quotation.id,
          type: "rfq",
          rfqId: item.rfq.id,
          productName: item.rfq.title,
          supplierName: item.supplier?.businessName,
          adminName: item.supplier?.businessName, // For compatibility
          unitPrice: parseFloat(item.quotation.unitPrice?.toString() || "0"),
          totalPrice: parseFloat(item.quotation.totalPrice?.toString() || "0"),
          quantity: item.rfq.quantity || 0,
          inquiryQuantity: item.rfq.quantity || 0,
          moq: item.quotation.moq || 0,
          leadTime: item.quotation.leadTime || "Not specified",
          paymentTerms: item.quotation.paymentTerms || "Not specified",
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          status: item.quotation.status === "sent" ? "pending" : item.quotation.status,
          message: item.quotation.termsConditions,
          createdAt: item.quotation.createdAt,
          quotationDate: item.quotation.createdAt,
          attachments: item.quotation.attachments,
          pricePerUnit: parseFloat(item.quotation.unitPrice?.toString() || "0"),
          totalAmount: parseFloat(item.quotation.totalPrice?.toString() || "0")
        })));
      } catch (error) {
        console.error("Error fetching RFQ quotations:", error);
        // Continue without RFQ quotations if there's an error
      }
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