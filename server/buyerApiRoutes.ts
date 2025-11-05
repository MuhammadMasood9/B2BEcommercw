import { Router } from "express";
import { eq, and, or, desc, asc, ilike, sql, gte, lte, isNull, ne, count, avg, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  products, 
  categories, 
  productAttributes, 
  users, 
  supplierProfiles,
  rfqs, 
  quotations, 
  buyers, 
  inquiries,
  orders,
  InsertRfq,
  InsertInquiry,
  Rfq,
  Quotation,
  Inquiry
} from "@shared/schema";
import { hybridAuthMiddleware } from "./authMiddleware";
import { requireBuyer, requireBuyerOwnership, getBuyerIdFromParams } from "./authGuards";
import RBACService from "./rbacService";
import { buyerMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { asyncHandler, ErrorFactory } from "./errorHandler";
import { RetryManager, circuitBreakers } from "./gracefulRecovery";

const router = Router();

// Apply buyer authentication to all routes
router.use(hybridAuthMiddleware);
router.use(requireBuyer);

// Apply authentication and buyer middleware to all routes
router.use(authMiddleware);
router.use(buyerMiddleware);

// ==================== PRODUCT DISCOVERY ROUTES ====================

// GET /api/buyer/products - Advanced product search with filtering
router.get("/products", asyncHandler(async (req, res) => {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      minMoq,
      maxMoq,
      supplierCountries,
      supplierTypes,
      verifiedOnly,
      tradeAssuranceOnly,
      readyToShipOnly,
      sampleAvailableOnly,
      customizationAvailableOnly,
      inStockOnly,
      certifications,
      paymentTerms,
      leadTimeRange,
      minRating,
      sort = "relevance",
      limit = "20",
      offset = "0"
    } = req.query;

    let query = db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      images: products.images,
      minOrderQuantity: products.minOrderQuantity,
      priceRanges: products.priceRanges,
      sampleAvailable: products.sampleAvailable,
      samplePrice: products.samplePrice,
      leadTime: products.leadTime,
      views: products.views,
      inquiries: products.inquiries,
      isFeatured: products.isFeatured,
      hasTradeAssurance: products.hasTradeAssurance,
      createdAt: products.createdAt,
      // Supplier information
      supplierBusinessName: supplierProfiles.businessName,
      supplierStoreName: supplierProfiles.storeName,
      supplierStoreSlug: supplierProfiles.storeSlug,
      supplierStoreLogo: supplierProfiles.storeLogo,
      supplierVerificationLevel: supplierProfiles.verificationLevel,
      supplierIsVerified: supplierProfiles.isVerified,
      supplierRating: supplierProfiles.rating,
      supplierResponseRate: supplierProfiles.responseRate,
      supplierMembershipTier: supplierProfiles.membershipTier,
      supplierCountry: supplierProfiles.country,
      // Category information
      categoryName: categories.name
    })
    .from(products)
    .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
    .leftJoin(categories, eq(products.categoryId, categories.id));

    const conditions = [
      eq(products.isPublished, true),
      eq(products.isApproved, true),
      eq(supplierProfiles.status, 'approved'),
      eq(supplierProfiles.isActive, true)
    ];

    // Search filter
    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
          ilike(products.shortDescription, `%${search}%`),
          ilike(supplierProfiles.businessName, `%${search}%`),
          ilike(supplierProfiles.storeName, `%${search}%`)
        )
      );
    }

    // Category filter
    if (categoryId && categoryId !== "all") {
      conditions.push(eq(products.categoryId, categoryId as string));
    }

    // Price range filter
    if (minPrice || maxPrice) {
      if (minPrice) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${products.priceRanges}) AS price_range
            WHERE (price_range->>'pricePerUnit')::numeric >= ${Number(minPrice)}
          )`
        );
      }
      if (maxPrice) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${products.priceRanges}) AS price_range
            WHERE (price_range->>'pricePerUnit')::numeric <= ${Number(maxPrice)}
          )`
        );
      }
    }

    // MOQ range filter
    if (minMoq) {
      conditions.push(gte(products.minOrderQuantity, Number(minMoq)));
    }
    if (maxMoq) {
      conditions.push(lte(products.minOrderQuantity, Number(maxMoq)));
    }

    // Supplier country filter
    if (supplierCountries && typeof supplierCountries === "string") {
      const countries = supplierCountries.split(",");
      conditions.push(inArray(supplierProfiles.country, countries));
    }

    // Supplier type filter
    if (supplierTypes && typeof supplierTypes === "string") {
      const types = supplierTypes.split(",");
      conditions.push(inArray(supplierProfiles.businessType, types));
    }

    // Boolean filters
    if (verifiedOnly === "true") {
      conditions.push(eq(supplierProfiles.isVerified, true));
    }

    if (tradeAssuranceOnly === "true") {
      conditions.push(eq(products.hasTradeAssurance, true));
    }

    if (readyToShipOnly === "true") {
      conditions.push(eq(products.inStock, true));
    }

    if (sampleAvailableOnly === "true") {
      conditions.push(eq(products.sampleAvailable, true));
    }

    if (customizationAvailableOnly === "true") {
      conditions.push(eq(products.customizationAvailable, true));
    }

    if (inStockOnly === "true") {
      conditions.push(eq(products.inStock, true));
    }

    // Minimum rating filter
    if (minRating) {
      conditions.push(sql`${supplierProfiles.rating}::numeric >= ${Number(minRating)}`);
    }

    // Certifications filter
    if (certifications && typeof certifications === "string") {
      const certArray = certifications.split(",");
      conditions.push(
        sql`${products.certifications} && ${certArray}`
      );
    }

    // Payment terms filter
    if (paymentTerms && typeof paymentTerms === "string") {
      const termsArray = paymentTerms.split(",");
      conditions.push(
        sql`${products.paymentTerms} && ${termsArray}`
      );
    }

    // Lead time filter
    if (leadTimeRange && leadTimeRange !== "all") {
      const range = leadTimeRange as string;
      switch (range) {
        case "1-7":
          conditions.push(
            or(
              ilike(products.leadTime, "%1-7%"),
              ilike(products.leadTime, "%1 day%"),
              ilike(products.leadTime, "%7 day%")
            )
          );
          break;
        case "8-15":
          conditions.push(
            or(
              ilike(products.leadTime, "%8-15%"),
              ilike(products.leadTime, "%10 day%"),
              ilike(products.leadTime, "%15 day%")
            )
          );
          break;
        case "16-30":
          conditions.push(
            or(
              ilike(products.leadTime, "%16-30%"),
              ilike(products.leadTime, "%30 day%"),
              ilike(products.leadTime, "%1 month%")
            )
          );
          break;
        case "31-60":
          conditions.push(
            or(
              ilike(products.leadTime, "%31-60%"),
              ilike(products.leadTime, "%60 day%"),
              ilike(products.leadTime, "%2 month%")
            )
          );
          break;
        case "60+":
          conditions.push(
            or(
              ilike(products.leadTime, "%60+%"),
              ilike(products.leadTime, "%3 month%"),
              ilike(products.leadTime, "%90 day%")
            )
          );
          break;
      }
    }

    // Build final query with conditions
    let finalQuery = query;
    if (conditions.length > 0) {
      finalQuery = finalQuery.where(and(...conditions));
    }

    // Apply sorting
    switch (sort) {
      case "price-low":
        finalQuery = finalQuery.orderBy(
          sql`(
            SELECT MIN((price_range->>'pricePerUnit')::numeric)
            FROM jsonb_array_elements(${products.priceRanges}) AS price_range
          ) ASC NULLS LAST`
        );
        break;
      case "price-high":
        finalQuery = finalQuery.orderBy(
          sql`(
            SELECT MAX((price_range->>'pricePerUnit')::numeric)
            FROM jsonb_array_elements(${products.priceRanges}) AS price_range
          ) DESC NULLS LAST`
        );
        break;
      case "newest":
        finalQuery = finalQuery.orderBy(desc(products.createdAt));
        break;
      case "moq-low":
        finalQuery = finalQuery.orderBy(asc(products.minOrderQuantity));
        break;
      case "moq-high":
        finalQuery = finalQuery.orderBy(desc(products.minOrderQuantity));
        break;
      case "popularity":
        finalQuery = finalQuery.orderBy(desc(products.views));
        break;
      case "rating":
        finalQuery = finalQuery.orderBy(desc(sql`${supplierProfiles.rating}::numeric`));
        break;
      case "lead-time":
        finalQuery = finalQuery.orderBy(asc(products.leadTime));
        break;
      default: // relevance
        if (search) {
          finalQuery = finalQuery.orderBy(
            sql`
              CASE 
                WHEN ${products.name} ILIKE ${`%${search}%`} THEN 1
                WHEN ${products.shortDescription} ILIKE ${`%${search}%`} THEN 2
                WHEN ${products.description} ILIKE ${`%${search}%`} THEN 3
                ELSE 4
              END,
              ${products.views} DESC
            `
          );
        } else {
          finalQuery = finalQuery.orderBy(desc(products.isFeatured), desc(products.views));
        }
    }

    // Pagination
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;
    
    finalQuery = finalQuery.limit(limitNum).offset(offsetNum);

    const result = await finalQuery;

    // Get total count for pagination
    let countQuery = db.select({ count: count() })
      .from(products)
      .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
      .leftJoin(categories, eq(products.categoryId, categories.id));

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const countResult = await countQuery;
    const totalCount = countResult[0]?.count || 0;

    res.json({
      success: true,
      products: result,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  // Error handling is now managed by asyncHandler wrapper
}));

// GET /api/buyer/products/:id - Get detailed product information
router.get("/products/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await db
      .select({
        product: products,
        supplier: supplierProfiles,
        category: categories
      })
      .from(products)
      .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(
        eq(products.id, id),
        eq(products.isPublished, true),
        eq(products.isApproved, true)
      ))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { product, supplier, category } = result[0];

    // Increment view count
    await db
      .update(products)
      .set({ views: sql`${products.views} + 1` })
      .where(eq(products.id, id));

    res.json({
      success: true,
      product: {
        ...product,
        supplier: supplier,
        category: category
      }
    });
  // Error handling managed by asyncHandler
}));

// ==================== RFQ MANAGEMENT ROUTES ====================

// GET /api/buyer/rfqs - Get buyer's RFQs with filtering and pagination
router.get("/rfqs", async (req, res) => {
  try {
    const {
      search,
      status,
      filter,
      categoryId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    const buyerId = req.buyer.id;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        rfq: rfqs,
        category: {
          id: categories.id,
          name: categories.name
        },
        quotationCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${quotations} 
          WHERE ${quotations.rfqId} = ${rfqs.id}
        )`.as('quotationCount'),
        lastQuotationDate: sql<string>`(
          SELECT MAX(${quotations.createdAt})
          FROM ${quotations}
          WHERE ${quotations.rfqId} = ${rfqs.id}
        )`.as('lastQuotationDate')
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(eq(rfqs.buyerId, buyerId));

    const conditions = [eq(rfqs.buyerId, buyerId)];

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
      conditions.push(eq(rfqs.status, status));
    }

    // Category filter
    if (categoryId && typeof categoryId === 'string') {
      conditions.push(eq(rfqs.categoryId, categoryId));
    }

    // Filter by type (active, closed, expired, all)
    if (filter && typeof filter === 'string') {
      switch (filter) {
        case 'active':
          conditions.push(
            and(
              eq(rfqs.status, 'open'),
              or(
                isNull(rfqs.expiresAt),
                gte(rfqs.expiresAt, new Date())
              )
            )
          );
          break;
        case 'closed':
          conditions.push(eq(rfqs.status, 'closed'));
          break;
        case 'expired':
          conditions.push(
            or(
              eq(rfqs.status, 'expired'),
              and(
                eq(rfqs.status, 'open'),
                lte(rfqs.expiresAt, new Date())
              )
            )
          );
          break;
      }
    }

    // Build final query
    let finalRfqQuery = query;
    if (conditions.length > 0) {
      finalRfqQuery = finalRfqQuery.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'title' ? rfqs.title :
                      sortBy === 'status' ? rfqs.status :
                      sortBy === 'expiresAt' ? rfqs.expiresAt :
                      rfqs.createdAt;

    if (sortOrder === 'asc') {
      finalRfqQuery = finalRfqQuery.orderBy(asc(sortColumn));
    } else {
      finalRfqQuery = finalRfqQuery.orderBy(desc(sortColumn));
    }

    finalRfqQuery = finalRfqQuery.limit(limitNum).offset(offsetNum);

    const result = await finalRfqQuery;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(rfqs);
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const countResult = await countQuery;
    const totalCount = countResult[0]?.count || 0;

    const formattedRfqs = result.map(row => ({
      ...row.rfq,
      categoryName: row.category?.name || 'Uncategorized',
      quotationCount: row.quotationCount,
      lastQuotationDate: row.lastQuotationDate
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
    console.error("Error fetching buyer RFQs:", error);
    res.status(500).json({ error: "Failed to fetch RFQs" });
  }
});

// POST /api/buyer/rfqs - Create new RFQ
router.post("/rfqs", asyncHandler(async (req, res) => {
    const buyerId = req.buyer.id;
    const {
      title,
      description,
      categoryId,
      specifications,
      quantity,
      targetPrice,
      budgetRange,
      deliveryLocation,
      requiredDeliveryDate,
      paymentTerms,
      expiresAt
    } = req.body;

    // Validate required fields using new error handling
    if (!title || !description || !quantity || !deliveryLocation || !paymentTerms) {
      throw ErrorFactory.validation(
        "Missing required fields: title, description, quantity, deliveryLocation, paymentTerms",
        { 
          missingFields: [
            !title && 'title',
            !description && 'description', 
            !quantity && 'quantity',
            !deliveryLocation && 'deliveryLocation',
            !paymentTerms && 'paymentTerms'
          ].filter(Boolean)
        },
        req.headers['x-request-id'] as string
      );
    }

    // Business logic validation
    if (quantity <= 0) {
      throw ErrorFactory.businessLogic('minimum_order_not_met', { quantity }, req.headers['x-request-id'] as string);
    }

    if (targetPrice && targetPrice <= 0) {
      throw ErrorFactory.validation('Target price must be greater than 0', { targetPrice }, req.headers['x-request-id'] as string);
    }

    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    if (budgetRange && budgetRange.min > budgetRange.max) {
      return res.status(400).json({ error: "Budget minimum cannot be greater than maximum" });
    }

    let expiryDate = expiresAt ? new Date(expiresAt) : null;
    if (!expiryDate) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    if (expiryDate <= new Date()) {
      return res.status(400).json({ error: "Expiry date must be in the future" });
    }

    const rfqData: InsertRfq = {
      buyerId,
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId || null,
      specifications: specifications || {},
      quantity: parseInt(quantity),
      targetPrice: targetPrice ? parseFloat(targetPrice).toString() : null,
      budgetRange: budgetRange || null,
      deliveryLocation: deliveryLocation.trim(),
      requiredDeliveryDate: requiredDeliveryDate ? new Date(requiredDeliveryDate) : null,
      paymentTerms: paymentTerms.trim(),
      status: 'open',
      expiresAt: expiryDate
    };

    const [newRfq] = await db.insert(rfqs).values(rfqData).returning();

    res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      rfq: newRfq
    });
}));

// ==================== INQUIRY MANAGEMENT ROUTES ====================

// GET /api/buyer/inquiries - Get buyer's inquiries
router.get("/inquiries", async (req, res) => {
  try {
    const {
      search,
      status,
      supplierId,
      productId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    const buyerId = req.buyer.id;
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
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          storeLogo: supplierProfiles.storeLogo
        }
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(supplierProfiles, eq(inquiries.supplierId, supplierProfiles.id))
      .where(eq(inquiries.buyerId, buyerId));

    const conditions = [eq(inquiries.buyerId, buyerId)];

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

    // Supplier filter
    if (supplierId && typeof supplierId === 'string') {
      conditions.push(eq(inquiries.supplierId, supplierId));
    }

    // Product filter
    if (productId && typeof productId === 'string') {
      conditions.push(eq(inquiries.productId, productId));
    }

    // Build final query
    let finalInquiryQuery = query;
    if (conditions.length > 0) {
      finalInquiryQuery = finalInquiryQuery.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'subject' ? inquiries.subject :
                      sortBy === 'status' ? inquiries.status :
                      inquiries.createdAt;

    if (sortOrder === 'asc') {
      finalInquiryQuery = finalInquiryQuery.orderBy(asc(sortColumn));
    } else {
      finalInquiryQuery = finalInquiryQuery.orderBy(desc(sortColumn));
    }

    finalInquiryQuery = finalInquiryQuery.limit(limitNum).offset(offsetNum);

    const result = await finalInquiryQuery;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(inquiries);
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const countResult = await countQuery;
    const totalCount = countResult[0]?.count || 0;

    const formattedInquiries = result.map(row => ({
      ...row.inquiry,
      product: row.product,
      supplier: row.supplier
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
    console.error("Error fetching buyer inquiries:", error);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// POST /api/buyer/inquiries - Create new inquiry
router.post("/inquiries", async (req, res) => {
  try {
    const buyerId = req.buyer.id;
    const {
      supplierId,
      productId,
      subject,
      message,
      quantity
    } = req.body;

    // Validate required fields
    if (!supplierId || !subject || !message) {
      return res.status(400).json({ 
        error: "Missing required fields: supplierId, subject, message" 
      });
    }

    // Verify supplier exists and is active
    const supplierExists = await db
      .select({ id: supplierProfiles.id })
      .from(supplierProfiles)
      .where(and(
        eq(supplierProfiles.id, supplierId),
        eq(supplierProfiles.status, 'approved'),
        eq(supplierProfiles.isActive, true)
      ))
      .limit(1);

    if (supplierExists.length === 0) {
      return res.status(404).json({ error: "Supplier not found or not active" });
    }

    // Verify product exists if provided
    if (productId) {
      const productExists = await db
        .select({ id: products.id })
        .from(products)
        .where(and(
          eq(products.id, productId),
          eq(products.supplierId, supplierId),
          eq(products.isPublished, true)
        ))
        .limit(1);

      if (productExists.length === 0) {
        return res.status(404).json({ error: "Product not found or not available" });
      }
    }

    const inquiryData: InsertInquiry = {
      buyerId,
      supplierId,
      productId: productId || null,
      subject: subject.trim(),
      message: message.trim(),
      quantity: quantity ? parseInt(quantity) : null,
      status: 'pending'
    };

    const [newInquiry] = await db.insert(inquiries).values(inquiryData).returning();

    // Update product inquiry count if applicable
    if (productId) {
      await db
        .update(products)
        .set({ inquiries: sql`${products.inquiries} + 1` })
        .where(eq(products.id, productId));
    }

    res.status(201).json({
      success: true,
      message: "Inquiry sent successfully",
      inquiry: newInquiry
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    res.status(500).json({ error: "Failed to send inquiry" });
  }
});

// ==================== QUOTATION COMPARISON ROUTES ====================

// GET /api/buyer/quotations - Get quotations for buyer's RFQs
router.get("/quotations", async (req, res) => {
  try {
    const {
      rfqId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    const buyerId = req.buyer.id;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        quotation: quotations,
        rfq: {
          id: rfqs.id,
          title: rfqs.title,
          quantity: rfqs.quantity
        },
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          storeLogo: supplierProfiles.storeLogo,
          rating: supplierProfiles.rating,
          isVerified: supplierProfiles.isVerified,
          verificationLevel: supplierProfiles.verificationLevel,
          responseRate: supplierProfiles.responseRate
        }
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.id))
      .where(eq(rfqs.buyerId, buyerId));

    const conditions = [eq(rfqs.buyerId, buyerId)];

    // RFQ filter
    if (rfqId && typeof rfqId === 'string') {
      conditions.push(eq(quotations.rfqId, rfqId));
    }

    // Status filter
    if (status && typeof status === 'string') {
      conditions.push(eq(quotations.status, status));
    }

    // Build final query
    let finalQuotationQuery = query;
    if (conditions.length > 0) {
      finalQuotationQuery = finalQuotationQuery.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'unitPrice' ? quotations.unitPrice :
                      sortBy === 'totalPrice' ? quotations.totalPrice :
                      sortBy === 'leadTime' ? quotations.leadTime :
                      quotations.createdAt;

    if (sortOrder === 'asc') {
      finalQuotationQuery = finalQuotationQuery.orderBy(asc(sortColumn));
    } else {
      finalQuotationQuery = finalQuotationQuery.orderBy(desc(sortColumn));
    }

    finalQuotationQuery = finalQuotationQuery.limit(limitNum).offset(offsetNum);

    const result = await finalQuotationQuery;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id));
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const countResult = await countQuery;
    const totalCount = countResult[0]?.count || 0;

    const formattedQuotations = result.map(row => ({
      ...row.quotation,
      rfq: row.rfq,
      supplier: row.supplier
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
    console.error("Error fetching quotations:", error);
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

// GET /api/buyer/quotations/compare - Compare multiple quotations
router.get("/quotations/compare", async (req, res) => {
  try {
    const { quotationIds } = req.query;

    if (!quotationIds || typeof quotationIds !== 'string') {
      return res.status(400).json({ error: "quotationIds parameter is required" });
    }

    const ids = quotationIds.split(',');
    if (ids.length < 2 || ids.length > 5) {
      return res.status(400).json({ error: "Please select 2-5 quotations to compare" });
    }

    const buyerId = req.buyer.id;

    const result = await db
      .select({
        quotation: quotations,
        rfq: {
          id: rfqs.id,
          title: rfqs.title,
          quantity: rfqs.quantity,
          specifications: rfqs.specifications
        },
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          storeLogo: supplierProfiles.storeLogo,
          rating: supplierProfiles.rating,
          isVerified: supplierProfiles.isVerified,
          verificationLevel: supplierProfiles.verificationLevel,
          responseRate: supplierProfiles.responseRate,
          totalOrders: supplierProfiles.totalOrders,
          country: supplierProfiles.country
        }
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.id))
      .where(and(
        inArray(quotations.id, ids),
        eq(rfqs.buyerId, buyerId)
      ));

    if (result.length === 0) {
      return res.status(404).json({ error: "No quotations found" });
    }

    const comparison = result.map(row => ({
      ...row.quotation,
      rfq: row.rfq,
      supplier: row.supplier
    }));

    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error("Error comparing quotations:", error);
    res.status(500).json({ error: "Failed to compare quotations" });
  }
});

export default router;