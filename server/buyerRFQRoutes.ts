import { Router } from "express";
import { eq, and, or, desc, asc, ilike, sql, gte, lte, isNull, ne, count, avg } from "drizzle-orm";
import { db } from "./db";
import { 
  rfqs, 
  quotations, 
  buyers, 
  users, 
  supplierProfiles, 
  categories,
  notifications,
  orders,
  InsertRfq,
  Rfq,
  Quotation
} from "@shared/schema";
import { authMiddleware } from "./auth";
import { rfqNotificationService } from "./rfqNotificationService";

const router = Router();

// Middleware to ensure user is a buyer
const buyerMiddleware = async (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== 'buyer') {
    return res.status(403).json({ error: "Buyer access required" });
  }

  // Get buyer profile
  const buyerProfile = await db
    .select()
    .from(buyers)
    .where(eq(buyers.userId, req.user.id))
    .limit(1);

  if (buyerProfile.length === 0) {
    return res.status(404).json({ error: "Buyer profile not found" });
  }

  req.buyer = buyerProfile[0];
  next();
};

// Apply authentication and buyer middleware to all routes
router.use(authMiddleware);
router.use(buyerMiddleware);

// GET /api/buyer/rfqs - Get buyer's RFQs with filtering and pagination
router.get('/', async (req, res) => {
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

    // Build base query
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
        )`.as('lastQuotationDate'),
        viewCount: sql<number>`0`.as('viewCount')
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(eq(rfqs.buyerId, buyerId));

    // Apply filters
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
        // 'all' doesn't add any additional conditions
      }
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'title' ? rfqs.title :
                      sortBy === 'status' ? rfqs.status :
                      sortBy === 'expiresAt' ? rfqs.expiresAt :
                      rfqs.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    // Apply pagination
    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Format the response
    const formattedRfqs = result.map(row => ({
      ...row.rfq,
      categoryName: row.category?.name || 'Uncategorized',
      quotationCount: row.quotationCount,
      lastQuotationDate: row.lastQuotationDate,
      viewCount: row.viewCount
    }));

    res.json({
      success: true,
      rfqs: formattedRfqs,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: formattedRfqs.length
      }
    });
  } catch (error) {
    console.error("Error fetching buyer RFQs:", error);
    res.status(500).json({ error: "Failed to fetch RFQs" });
  }
});

// POST /api/buyer/rfqs - Create new RFQ
router.post('/', async (req, res) => {
  try {
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

    // Validate required fields
    if (!title || !description || !quantity || !deliveryLocation || !paymentTerms) {
      return res.status(400).json({ 
        error: "Missing required fields: title, description, quantity, deliveryLocation, paymentTerms" 
      });
    }

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    // Validate budget range if provided
    if (budgetRange && budgetRange.min > budgetRange.max) {
      return res.status(400).json({ error: "Budget minimum cannot be greater than maximum" });
    }

    // Set default expiry date if not provided (30 days from now)
    let expiryDate = expiresAt ? new Date(expiresAt) : null;
    if (!expiryDate) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    // Validate expiry date
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

    // Send notifications about new RFQ
    rfqNotificationService.notifyRFQCreated(newRfq.id);

    res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      rfq: newRfq
    });
  } catch (error) {
    console.error("Error creating RFQ:", error);
    res.status(500).json({ error: "Failed to create RFQ" });
  }
});

// GET /api/buyer/rfqs/:id - Get specific RFQ with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.buyer.id;

    const result = await db
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
        )`.as('quotationCount')
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(and(
        eq(rfqs.id, id),
        eq(rfqs.buyerId, buyerId)
      ))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    const rfqData = {
      ...result[0].rfq,
      categoryName: result[0].category?.name || 'Uncategorized',
      quotationCount: result[0].quotationCount
    };

    // Note: View count tracking would be implemented with a separate analytics table

    res.json({
      success: true,
      rfq: rfqData
    });
  } catch (error) {
    console.error("Error fetching RFQ:", error);
    res.status(500).json({ error: "Failed to fetch RFQ" });
  }
});

// DELETE /api/buyer/rfqs/:id - Delete RFQ
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.buyer.id;

    // Check if RFQ exists and belongs to buyer
    const existingRfq = await db
      .select()
      .from(rfqs)
      .where(and(
        eq(rfqs.id, id),
        eq(rfqs.buyerId, buyerId)
      ))
      .limit(1);

    if (existingRfq.length === 0) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    // Check if there are any accepted quotations
    const acceptedQuotations = await db
      .select()
      .from(quotations)
      .where(and(
        eq(quotations.rfqId, id),
        eq(quotations.status, 'accepted')
      ))
      .limit(1);

    if (acceptedQuotations.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete RFQ with accepted quotations. Please contact support if you need to cancel." 
      });
    }

    // Delete related quotations first
    await db.delete(quotations).where(eq(quotations.rfqId, id));

    // Delete the RFQ
    await db.delete(rfqs).where(eq(rfqs.id, id));

    res.json({
      success: true,
      message: "RFQ deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting RFQ:", error);
    res.status(500).json({ error: "Failed to delete RFQ" });
  }
});

// GET /api/buyer/rfqs/:id/quotations - Get quotations for specific RFQ
router.get('/:id/quotations', async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.buyer.id;
    const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Verify RFQ belongs to buyer
    const rfqExists = await db
      .select({ id: rfqs.id })
      .from(rfqs)
      .where(and(
        eq(rfqs.id, id),
        eq(rfqs.buyerId, buyerId)
      ))
      .limit(1);

    if (rfqExists.length === 0) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    // Fetch quotations with supplier information
    let query = db
      .select({
        quotation: quotations,
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          rating: supplierProfiles.rating,
          isVerified: supplierProfiles.isVerified,
          verificationLevel: supplierProfiles.verificationLevel,
          responseRate: supplierProfiles.responseRate,
          totalOrders: supplierProfiles.totalOrders
        }
      })
      .from(quotations)
      .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
      .where(eq(quotations.rfqId, id));

    // Apply sorting
    const sortColumn = sortBy === 'unitPrice' ? quotations.unitPrice :
                      sortBy === 'totalPrice' ? quotations.totalPrice :
                      sortBy === 'leadTime' ? quotations.leadTime :
                      quotations.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    const result = await query;

    // Format the response
    const formattedQuotations = result.map(row => ({
      ...row.quotation,
      supplierName: row.supplier?.storeName || 'Unknown Supplier',
      supplierCompany: row.supplier?.businessName || 'Unknown Company',
      supplierRating: parseFloat(row.supplier?.rating || '0'),
      supplierVerified: row.supplier?.isVerified || false,
      supplierVerificationLevel: row.supplier?.verificationLevel || 'none',
      supplierResponseRate: parseFloat(row.supplier?.responseRate || '0'),
      supplierTotalOrders: row.supplier?.totalOrders || 0
    }));

    res.json({
      success: true,
      quotations: formattedQuotations
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

// POST /api/buyer/rfqs/:id/quotations/:quotationId/accept - Accept a quotation
router.post('/:id/quotations/:quotationId/accept', async (req, res) => {
  try {
    const { id: rfqId, quotationId } = req.params;
    const buyerId = req.buyer.id;

    // Verify RFQ belongs to buyer and is open
    const rfqResult = await db
      .select()
      .from(rfqs)
      .where(and(
        eq(rfqs.id, rfqId),
        eq(rfqs.buyerId, buyerId),
        eq(rfqs.status, 'open')
      ))
      .limit(1);

    if (rfqResult.length === 0) {
      return res.status(404).json({ error: "RFQ not found or not available for acceptance" });
    }

    // Verify quotation exists and belongs to the RFQ
    const quotationResult = await db
      .select({
        quotation: quotations,
        supplier: supplierProfiles
      })
      .from(quotations)
      .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.userId))
      .where(and(
        eq(quotations.id, quotationId),
        eq(quotations.rfqId, rfqId),
        eq(quotations.status, 'sent')
      ))
      .limit(1);

    if (quotationResult.length === 0) {
      return res.status(404).json({ error: "Quotation not found or not available for acceptance" });
    }

    const quotation = quotationResult[0].quotation;
    const supplier = quotationResult[0].supplier;

    // Start transaction
    await db.transaction(async (tx) => {
      // Accept the quotation
      await tx
        .update(quotations)
        .set({ 
          status: 'accepted',
          updatedAt: new Date()
        })
        .where(eq(quotations.id, quotationId));

      // Reject all other quotations for this RFQ
      await tx
        .update(quotations)
        .set({ 
          status: 'rejected',
          updatedAt: new Date()
        })
        .where(and(
          eq(quotations.rfqId, rfqId),
          ne(quotations.id, quotationId),
          eq(quotations.status, 'sent')
        ));

      // Close the RFQ
      await tx
        .update(rfqs)
        .set({ 
          status: 'closed',
          updatedAt: new Date()
        })
        .where(eq(rfqs.id, rfqId));

      // Create order from accepted quotation
      const orderData = {
        orderNumber: `RFQ-${Date.now()}`,
        buyerId: buyerId,
        rfqId: rfqId,
        quotationId: quotationId,
        supplierId: quotation.supplierId,
        quantity: rfqResult[0].quantity,
        unitPrice: quotation.unitPrice,
        totalAmount: quotation.totalPrice,
        items: [{
          rfqId: rfqId,
          quotationId: quotationId,
          quantity: rfqResult[0].quantity,
          unitPrice: quotation.unitPrice,
          totalPrice: quotation.totalPrice,
          specifications: rfqResult[0].specifications
        }],
        status: 'pending',
        paymentStatus: 'pending'
      };

      const [newOrder] = await tx.insert(orders).values(orderData).returning();
    });

    // Send notifications about quotation acceptance
    rfqNotificationService.notifyQuotationAccepted(quotationId);

    res.json({
      success: true,
      message: "Quotation accepted successfully",
      quotationId: quotationId,
      rfqId: rfqId
    });
  } catch (error) {
    console.error("Error accepting quotation:", error);
    res.status(500).json({ error: "Failed to accept quotation" });
  }
});

// GET /api/buyer/rfqs/analytics - Get RFQ analytics for buyer
router.get('/analytics', async (req, res) => {
  try {
    const buyerId = req.buyer.id;

    // Get basic counts
    const [
      totalRfqsResult,
      activeRfqsResult,
      closedRfqsResult,
      expiredRfqsResult,
      totalQuotationsResult
    ] = await Promise.all([
      // Total RFQs
      db.select({ count: count() }).from(rfqs).where(eq(rfqs.buyerId, buyerId)),
      
      // Active RFQs
      db.select({ count: count() }).from(rfqs).where(
        and(
          eq(rfqs.buyerId, buyerId),
          eq(rfqs.status, 'open'),
          or(
            isNull(rfqs.expiresAt),
            gte(rfqs.expiresAt, new Date())
          )
        )
      ),
      
      // Closed RFQs
      db.select({ count: count() }).from(rfqs).where(
        and(
          eq(rfqs.buyerId, buyerId),
          eq(rfqs.status, 'closed')
        )
      ),
      
      // Expired RFQs
      db.select({ count: count() }).from(rfqs).where(
        and(
          eq(rfqs.buyerId, buyerId),
          or(
            eq(rfqs.status, 'expired'),
            and(
              eq(rfqs.status, 'open'),
              lte(rfqs.expiresAt, new Date())
            )
          )
        )
      ),
      
      // Total quotations received
      db.select({ count: count() }).from(quotations)
        .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
        .where(eq(rfqs.buyerId, buyerId))
    ]);

    // Get average quotations per RFQ
    const avgQuotationsResult = await db
      .select({ 
        avg: avg(sql<number>`quotation_counts.count`) 
      })
      .from(
        db.select({ 
          count: count() 
        })
        .from(quotations)
        .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
        .where(eq(rfqs.buyerId, buyerId))
        .groupBy(rfqs.id)
        .as('quotation_counts')
      );

    // Get top categories
    const topCategoriesResult = await db
      .select({
        categoryId: rfqs.categoryId,
        categoryName: categories.name,
        count: count()
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(eq(rfqs.buyerId, buyerId))
      .groupBy(rfqs.categoryId, categories.name)
      .orderBy(desc(count()))
      .limit(5);

    const analytics = {
      totalRfqs: totalRfqsResult[0]?.count || 0,
      activeRfqs: activeRfqsResult[0]?.count || 0,
      closedRfqs: closedRfqsResult[0]?.count || 0,
      expiredRfqs: expiredRfqsResult[0]?.count || 0,
      totalQuotations: totalQuotationsResult[0]?.count || 0,
      avgQuotationsPerRfq: parseFloat(avgQuotationsResult[0]?.avg || '0').toFixed(1),
      topCategories: topCategoriesResult.map(row => ({
        category: row.categoryName || 'Uncategorized',
        count: row.count
      }))
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error("Error fetching RFQ analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;