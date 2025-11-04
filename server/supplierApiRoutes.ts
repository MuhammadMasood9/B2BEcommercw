import { Router } from "express";
import { eq, and, or, desc, asc, ilike, sql, gte, lte, isNull, ne, count, avg, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  products, 
  categories, 
  users, 
  supplierProfiles,
  rfqs, 
  quotations, 
  buyers, 
  inquiries,
  orders,
  InsertQuotation,
  Rfq,
  Quotation,
  Inquiry,
  Order
} from "@shared/schema";
import { hybridAuthMiddleware } from "./authMiddleware";
import { 
  requireSupplier, 
  requireSupplierOwnership, 
  requireSupplierStatus,
  getSupplierIdFromParams 
} from "./authGuards";
import RBACService from "./rbacService";
import { supplierMiddleware } from "./auth";
import { authMiddleware } from "./auth";

const router = Router();

// Apply supplier authentication to all routes
router.use(hybridAuthMiddleware);
router.use(requireSupplier);
router.use(requireSupplierStatus(['approved']));

// Apply authentication and supplier middleware to all routes
router.use(authMiddleware);
router.use(supplierMiddleware);

// ==================== RFQ MANAGEMENT ROUTES ====================

// GET /api/supplier/rfqs - Get relevant RFQs for supplier
router.get("/rfqs", async (req, res) => {
  try {
    const {
      search,
      status = 'open',
      categoryId,
      minQuantity,
      maxQuantity,
      minBudget,
      maxBudget,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    const supplierId = req.supplier.id;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        rfq: rfqs,
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName,
          industry: buyers.industry,
          businessType: buyers.businessType
        },
        category: {
          id: categories.id,
          name: categories.name
        },
        quotationCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${quotations} 
          WHERE ${quotations.rfqId} = ${rfqs.id}
        )`.as('quotationCount'),
        hasQuoted: sql<boolean>`(
          SELECT COUNT(*) > 0
          FROM ${quotations}
          WHERE ${quotations.rfqId} = ${rfqs.id}
          AND ${quotations.supplierId} = ${supplierId}
        )`.as('hasQuoted')
      })
      .from(rfqs)
      .leftJoin(buyers, eq(rfqs.buyerId, buyers.id))
      .leftJoin(categories, eq(rfqs.categoryId, categories.id));

    const conditions = [
      eq(rfqs.status, 'open'),
      or(
        isNull(rfqs.expiresAt),
        gte(rfqs.expiresAt, new Date())
      )
    ];

    // Search filter
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(rfqs.title, `%${search}%`),
          ilike(rfqs.description, `%${search}%`)
        )
      );
    }

    // Status filter (for supplier, we show open RFQs by default)
    if (status && typeof status === 'string' && status !== 'open') {
      // Allow suppliers to see RFQs they've quoted on even if closed
      if (status === 'quoted') {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM ${quotations}
            WHERE ${quotations.rfqId} = ${rfqs.id}
            AND ${quotations.supplierId} = ${supplierId}
          )`
        );
      }
    }

    // Category filter - match supplier's product categories
    if (categoryId && typeof categoryId === 'string') {
      conditions.push(eq(rfqs.categoryId, categoryId));
    } else {
      // Show RFQs in categories where supplier has products
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${products}
          WHERE ${products.supplierId} = ${supplierId}
          AND ${products.categoryId} = ${rfqs.categoryId}
          AND ${products.isPublished} = true
        )`
      );
    }

    // Quantity filters
    if (minQuantity) {
      conditions.push(gte(rfqs.quantity, Number(minQuantity)));
    }
    if (maxQuantity) {
      conditions.push(lte(rfqs.quantity, Number(maxQuantity)));
    }

    // Budget filters
    if (minBudget) {
      conditions.push(
        or(
          isNull(rfqs.budgetRange),
          sql`(${rfqs.budgetRange}->>'min')::numeric >= ${Number(minBudget)}`
        )
      );
    }
    if (maxBudget) {
      conditions.push(
        or(
          isNull(rfqs.budgetRange),
          sql`(${rfqs.budgetRange}->>'max')::numeric <= ${Number(maxBudget)}`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'title' ? rfqs.title :
                      sortBy === 'quantity' ? rfqs.quantity :
                      sortBy === 'expiresAt' ? rfqs.expiresAt :
                      rfqs.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(rfqs)
      .leftJoin(buyers, eq(rfqs.buyerId, buyers.id))
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(and(...conditions));

    const [{ count: totalCount }] = await countQuery;

    const formattedRfqs = result.map(row => ({
      ...row.rfq,
      buyer: row.buyer,
      categoryName: row.category?.name || 'Uncategorized',
      quotationCount: row.quotationCount,
      hasQuoted: row.hasQuoted
    }));

    res.json({
      success: true,
      rfqs: formattedRfqs,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching supplier RFQs:", error);
    res.status(500).json({ error: "Failed to fetch RFQs" });
  }
});

// GET /api/supplier/rfqs/:id - Get specific RFQ details
router.get("/rfqs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const supplierId = req.supplier.id;

    const result = await db
      .select({
        rfq: rfqs,
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName,
          industry: buyers.industry,
          businessType: buyers.businessType,
          annualVolume: buyers.annualVolume
        },
        category: {
          id: categories.id,
          name: categories.name
        },
        quotationCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${quotations} 
          WHERE ${quotations.rfqId} = ${rfqs.id}
        )`.as('quotationCount'),
        myQuotation: sql<any>`(
          SELECT row_to_json(q.*)
          FROM ${quotations} q
          WHERE q.${quotations.rfqId} = ${rfqs.id}
          AND q.${quotations.supplierId} = ${supplierId}
          LIMIT 1
        )`.as('myQuotation')
      })
      .from(rfqs)
      .leftJoin(buyers, eq(rfqs.buyerId, buyers.id))
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(eq(rfqs.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    const rfqData = {
      ...result[0].rfq,
      buyer: result[0].buyer,
      categoryName: result[0].category?.name || 'Uncategorized',
      quotationCount: result[0].quotationCount,
      myQuotation: result[0].myQuotation
    };

    res.json({
      success: true,
      rfq: rfqData
    });
  } catch (error) {
    console.error("Error fetching RFQ details:", error);
    res.status(500).json({ error: "Failed to fetch RFQ details" });
  }
});

// ==================== INQUIRY MANAGEMENT ROUTES ====================

// GET /api/supplier/inquiries - Get inquiries for supplier
router.get("/inquiries", async (req, res) => {
  try {
    const {
      search,
      status,
      productId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    const supplierId = req.supplier.id;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        inquiry: inquiries,
        product: {
          id: products.id,
          name: products.name,
          images: products.images
        },
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName,
          industry: buyers.industry,
          businessType: buyers.businessType
        }
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(buyers, eq(inquiries.buyerId, buyers.id))
      .where(eq(inquiries.supplierId, supplierId));

    const conditions = [eq(inquiries.supplierId, supplierId)];

    // Search filter
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(inquiries.subject, `%${search}%`),
          ilike(inquiries.message, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status && typeof status === 'string') {
      conditions.push(eq(inquiries.status, status));
    }

    // Product filter
    if (productId && typeof productId === 'string') {
      conditions.push(eq(inquiries.productId, productId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'subject' ? inquiries.subject :
                      sortBy === 'status' ? inquiries.status :
                      inquiries.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(inquiries)
      .where(and(...conditions));

    const [{ count: totalCount }] = await countQuery;

    const formattedInquiries = result.map(row => ({
      ...row.inquiry,
      product: row.product,
      buyer: row.buyer
    }));

    res.json({
      success: true,
      inquiries: formattedInquiries,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching supplier inquiries:", error);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// PUT /api/supplier/inquiries/:id/respond - Respond to inquiry
router.put("/inquiries/:id/respond", async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const supplierId = req.supplier.id;

    if (!response || typeof response !== 'string') {
      return res.status(400).json({ error: "Response message is required" });
    }

    // Verify inquiry belongs to supplier
    const inquiryExists = await db
      .select({ id: inquiries.id })
      .from(inquiries)
      .where(and(
        eq(inquiries.id, id),
        eq(inquiries.supplierId, supplierId)
      ))
      .limit(1);

    if (inquiryExists.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // Update inquiry status and add response
    await db
      .update(inquiries)
      .set({
        status: 'responded',
        updatedAt: new Date()
        // Note: In a full implementation, you'd store the response in a separate messages table
      })
      .where(eq(inquiries.id, id));

    res.json({
      success: true,
      message: "Inquiry response sent successfully"
    });
  } catch (error) {
    console.error("Error responding to inquiry:", error);
    res.status(500).json({ error: "Failed to respond to inquiry" });
  }
});

// ==================== QUOTATION MANAGEMENT ROUTES ====================

// GET /api/supplier/quotations - Get supplier's quotations
router.get("/quotations", async (req, res) => {
  try {
    const {
      search,
      status,
      rfqId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    const supplierId = req.supplier.id;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        quotation: quotations,
        rfq: {
          id: rfqs.id,
          title: rfqs.title,
          quantity: rfqs.quantity,
          status: rfqs.status
        },
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName,
          industry: buyers.industry
        }
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .leftJoin(buyers, eq(rfqs.buyerId, buyers.id))
      .where(eq(quotations.supplierId, supplierId));

    const conditions = [eq(quotations.supplierId, supplierId)];

    // Search filter
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(rfqs.title, `%${search}%`),
          ilike(rfqs.description, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status && typeof status === 'string') {
      conditions.push(eq(quotations.status, status));
    }

    // RFQ filter
    if (rfqId && typeof rfqId === 'string') {
      conditions.push(eq(quotations.rfqId, rfqId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'unitPrice' ? quotations.unitPrice :
                      sortBy === 'totalPrice' ? quotations.totalPrice :
                      sortBy === 'status' ? quotations.status :
                      quotations.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .where(and(...conditions));

    const [{ count: totalCount }] = await countQuery;

    const formattedQuotations = result.map(row => ({
      ...row.quotation,
      rfq: row.rfq,
      buyer: row.buyer
    }));

    res.json({
      success: true,
      quotations: formattedQuotations,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching supplier quotations:", error);
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

// POST /api/supplier/quotations - Create quotation for RFQ
router.post("/quotations", async (req, res) => {
  try {
    const supplierId = req.supplier.id;
    const {
      rfqId,
      unitPrice,
      moq,
      leadTime,
      paymentTerms,
      validityPeriod,
      termsConditions,
      attachments
    } = req.body;

    // Validate required fields
    if (!rfqId || !unitPrice || !moq || !leadTime || !paymentTerms) {
      return res.status(400).json({ 
        error: "Missing required fields: rfqId, unitPrice, moq, leadTime, paymentTerms" 
      });
    }

    // Verify RFQ exists and is open
    const rfqResult = await db
      .select()
      .from(rfqs)
      .where(and(
        eq(rfqs.id, rfqId),
        eq(rfqs.status, 'open'),
        or(
          isNull(rfqs.expiresAt),
          gte(rfqs.expiresAt, new Date())
        )
      ))
      .limit(1);

    if (rfqResult.length === 0) {
      return res.status(404).json({ error: "RFQ not found or not available for quotation" });
    }

    const rfq = rfqResult[0];

    // Check if supplier already quoted
    const existingQuotation = await db
      .select({ id: quotations.id })
      .from(quotations)
      .where(and(
        eq(quotations.rfqId, rfqId),
        eq(quotations.supplierId, supplierId)
      ))
      .limit(1);

    if (existingQuotation.length > 0) {
      return res.status(400).json({ error: "You have already submitted a quotation for this RFQ" });
    }

    // Validate pricing
    const unitPriceNum = parseFloat(unitPrice);
    const moqNum = parseInt(moq);
    const totalPrice = unitPriceNum * rfq.quantity;

    if (unitPriceNum <= 0 || moqNum <= 0) {
      return res.status(400).json({ error: "Unit price and MOQ must be greater than 0" });
    }

    if (moqNum > rfq.quantity) {
      return res.status(400).json({ error: "MOQ cannot be greater than RFQ quantity" });
    }

    const quotationData: InsertQuotation = {
      supplierId,
      rfqId,
      inquiryId: null,
      unitPrice: unitPriceNum.toString(),
      totalPrice: totalPrice.toString(),
      moq: moqNum,
      leadTime: leadTime.trim(),
      paymentTerms: paymentTerms.trim(),
      validityPeriod: validityPeriod || 30,
      termsConditions: termsConditions || null,
      attachments: attachments || [],
      status: 'sent'
    };

    const [newQuotation] = await db.insert(quotations).values(quotationData).returning();

    res.status(201).json({
      success: true,
      message: "Quotation submitted successfully",
      quotation: newQuotation
    });
  } catch (error) {
    console.error("Error creating quotation:", error);
    res.status(500).json({ error: "Failed to create quotation" });
  }
});

// PUT /api/supplier/quotations/:id - Update quotation
router.put("/quotations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const supplierId = req.supplier.id;
    const {
      unitPrice,
      moq,
      leadTime,
      paymentTerms,
      validityPeriod,
      termsConditions,
      attachments
    } = req.body;

    // Verify quotation belongs to supplier and is still editable
    const quotationResult = await db
      .select({
        quotation: quotations,
        rfq: rfqs
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .where(and(
        eq(quotations.id, id),
        eq(quotations.supplierId, supplierId),
        eq(quotations.status, 'sent')
      ))
      .limit(1);

    if (quotationResult.length === 0) {
      return res.status(404).json({ error: "Quotation not found or not editable" });
    }

    const { quotation, rfq } = quotationResult[0];

    // Validate new values if provided
    let updateData: any = { updatedAt: new Date() };

    if (unitPrice !== undefined) {
      const unitPriceNum = parseFloat(unitPrice);
      if (unitPriceNum <= 0) {
        return res.status(400).json({ error: "Unit price must be greater than 0" });
      }
      updateData.unitPrice = unitPriceNum.toString();
      updateData.totalPrice = (unitPriceNum * rfq.quantity).toString();
    }

    if (moq !== undefined) {
      const moqNum = parseInt(moq);
      if (moqNum <= 0 || moqNum > rfq.quantity) {
        return res.status(400).json({ error: "Invalid MOQ value" });
      }
      updateData.moq = moqNum;
    }

    if (leadTime !== undefined) {
      updateData.leadTime = leadTime.trim();
    }

    if (paymentTerms !== undefined) {
      updateData.paymentTerms = paymentTerms.trim();
    }

    if (validityPeriod !== undefined) {
      updateData.validityPeriod = parseInt(validityPeriod);
    }

    if (termsConditions !== undefined) {
      updateData.termsConditions = termsConditions;
    }

    if (attachments !== undefined) {
      updateData.attachments = attachments;
    }

    await db
      .update(quotations)
      .set(updateData)
      .where(eq(quotations.id, id));

    res.json({
      success: true,
      message: "Quotation updated successfully"
    });
  } catch (error) {
    console.error("Error updating quotation:", error);
    res.status(500).json({ error: "Failed to update quotation" });
  }
});

// ==================== ORDER MANAGEMENT ROUTES ====================

// GET /api/supplier/orders - Get supplier's orders
router.get("/orders", async (req, res) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    const supplierId = req.supplier.id;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        order: orders,
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName,
          industry: buyers.industry
        },
        rfq: {
          id: rfqs.id,
          title: rfqs.title
        }
      })
      .from(orders)
      .leftJoin(buyers, eq(orders.buyerId, buyers.id))
      .leftJoin(rfqs, eq(orders.rfqId, rfqs.id))
      .where(eq(orders.supplierId, supplierId));

    const conditions = [eq(orders.supplierId, supplierId)];

    // Search filter
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(rfqs.title, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status && typeof status === 'string') {
      conditions.push(eq(orders.status, status));
    }

    // Payment status filter
    if (paymentStatus && typeof paymentStatus === 'string') {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'orderNumber' ? orders.orderNumber :
                      sortBy === 'totalAmount' ? orders.totalAmount :
                      sortBy === 'status' ? orders.status :
                      orders.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(orders)
      .where(and(...conditions));

    const [{ count: totalCount }] = await countQuery;

    const formattedOrders = result.map(row => ({
      ...row.order,
      buyer: row.buyer,
      rfq: row.rfq
    }));

    res.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching supplier orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PUT /api/supplier/orders/:id/status - Update order status
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const supplierId = req.supplier.id;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Verify order belongs to supplier
    const orderExists = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(and(
        eq(orders.id, id),
        eq(orders.supplierId, supplierId)
      ))
      .limit(1);

    if (orderExists.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date()
        // Note: In a full implementation, you'd store notes in a separate order_updates table
      })
      .where(eq(orders.id, id));

    res.json({
      success: true,
      message: "Order status updated successfully"
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;