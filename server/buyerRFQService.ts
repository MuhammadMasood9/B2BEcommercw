import { db } from './db';
import { 
  rfqs, 
  quotations, 
  categories,
  supplierProfiles,
  type Rfq, 
  type InsertRfq, 
  type Quotation,
  type Category,
  type SupplierProfile 
} from '@shared/schema';
import { eq, and, or, desc, asc, sql, gte, lte, inArray, isNull } from 'drizzle-orm';
import { rfqMatchingService } from './rfqMatchingService';
import { rfqNotificationService } from './rfqNotificationService';

export interface RFQFilters {
  status?: 'open' | 'closed' | 'expired';
  categoryId?: string;
  minBudget?: number;
  maxBudget?: number;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface RFQAnalytics {
  totalRFQs: number;
  openRFQs: number;
  closedRFQs: number;
  expiredRFQs: number;
  averageQuotationsPerRFQ: number;
  averageResponseTime: number; // in hours
  conversionRate: number; // percentage of RFQs that resulted in orders
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    rfqCount: number;
  }>;
}

export interface RFQWithDetails extends Rfq {
  category?: Category;
  quotations: Array<Quotation & { supplier: SupplierProfile }>;
  quotationCount: number;
  bestQuotation?: Quotation & { supplier: SupplierProfile };
}

export class BuyerRFQService {

  /**
   * Create a new RFQ
   */
  async createRFQ(buyerId: string, rfqData: Omit<InsertRfq, 'buyerId'>): Promise<Rfq> {
    // Set expiration date if not provided (default 30 days)
    const expiresAt = rfqData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [rfq] = await db.insert(rfqs).values({
      ...rfqData,
      buyerId,
      expiresAt,
      status: 'open',
    }).returning();

    // Find and notify relevant suppliers
    try {
      await rfqMatchingService.matchRFQToSuppliers(rfq.id);
      await rfqNotificationService.notifyNewRFQ(rfq.id);
    } catch (error) {
      console.error('Error matching RFQ to suppliers:', error);
    }

    return rfq;
  }

  /**
   * Get RFQ by ID with full details
   */
  async getRFQById(rfqId: string, buyerId?: string): Promise<RFQWithDetails | null> {
    // Get RFQ with category
    const rfqQuery = db
      .select({
        rfq: rfqs,
        category: categories,
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(eq(rfqs.id, rfqId));

    if (buyerId) {
      rfqQuery.where(and(eq(rfqs.id, rfqId), eq(rfqs.buyerId, buyerId)));
    }

    const [rfqResult] = await rfqQuery.limit(1);
    if (!rfqResult) return null;

    // Get quotations with supplier details
    const quotationsWithSuppliers = await db
      .select({
        quotation: quotations,
        supplier: supplierProfiles,
      })
      .from(quotations)
      .innerJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.id))
      .where(eq(quotations.rfqId, rfqId))
      .orderBy(asc(quotations.unitPrice));

    const formattedQuotations = quotationsWithSuppliers.map(row => ({
      ...row.quotation,
      supplier: row.supplier,
    }));

    // Find best quotation (lowest price)
    const bestQuotation = formattedQuotations.length > 0 ? formattedQuotations[0] : undefined;

    return {
      ...rfqResult.rfq,
      category: rfqResult.category,
      quotations: formattedQuotations,
      quotationCount: formattedQuotations.length,
      bestQuotation,
    };
  }

  /**
   * Get buyer's RFQs with filtering and pagination
   */
  async getBuyerRFQs(
    buyerId: string,
    filters: RFQFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    rfqs: RFQWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(rfqs.buyerId, buyerId)];

    if (filters.status) {
      whereConditions.push(eq(rfqs.status, filters.status));
    }

    if (filters.categoryId) {
      whereConditions.push(eq(rfqs.categoryId, filters.categoryId));
    }

    if (filters.minBudget || filters.maxBudget) {
      if (filters.minBudget) {
        whereConditions.push(
          or(
            gte(rfqs.targetPrice, filters.minBudget),
            sql`(${rfqs.budgetRange}->>'min')::numeric >= ${filters.minBudget}`
          )
        );
      }
      if (filters.maxBudget) {
        whereConditions.push(
          or(
            lte(rfqs.targetPrice, filters.maxBudget),
            sql`(${rfqs.budgetRange}->>'max')::numeric <= ${filters.maxBudget}`
          )
        );
      }
    }

    if (filters.dateFrom) {
      whereConditions.push(gte(rfqs.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      whereConditions.push(lte(rfqs.createdAt, filters.dateTo));
    }

    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
      whereConditions.push(
        or(
          sql`LOWER(${rfqs.title}) LIKE ${searchPattern}`,
          sql`LOWER(${rfqs.description}) LIKE ${searchPattern}`
        )
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfqs)
      .where(and(...whereConditions));

    // Get RFQs with categories
    const rfqsWithCategories = await db
      .select({
        rfq: rfqs,
        category: categories,
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(rfqs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get quotation counts for each RFQ
    const rfqIds = rfqsWithCategories.map(r => r.rfq.id);
    const quotationCounts = rfqIds.length > 0 
      ? await db
          .select({
            rfqId: quotations.rfqId,
            count: sql<number>`count(*)`,
          })
          .from(quotations)
          .where(inArray(quotations.rfqId, rfqIds))
          .groupBy(quotations.rfqId)
      : [];

    const quotationCountMap = quotationCounts.reduce((acc, item) => {
      acc[item.rfqId!] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Format results
    const formattedRFQs: RFQWithDetails[] = rfqsWithCategories.map(row => ({
      ...row.rfq,
      category: row.category,
      quotations: [], // Will be loaded separately if needed
      quotationCount: quotationCountMap[row.rfq.id] || 0,
    }));

    return {
      rfqs: formattedRFQs,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Update RFQ
   */
  async updateRFQ(rfqId: string, buyerId: string, updateData: Partial<InsertRfq>): Promise<Rfq> {
    const [updatedRFQ] = await db
      .update(rfqs)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(rfqs.id, rfqId), eq(rfqs.buyerId, buyerId)))
      .returning();

    return updatedRFQ;
  }

  /**
   * Close RFQ
   */
  async closeRFQ(rfqId: string, buyerId: string): Promise<Rfq> {
    const [closedRFQ] = await db
      .update(rfqs)
      .set({
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(and(eq(rfqs.id, rfqId), eq(rfqs.buyerId, buyerId)))
      .returning();

    return closedRFQ;
  }

  /**
   * Delete RFQ
   */
  async deleteRFQ(rfqId: string, buyerId: string): Promise<void> {
    await db
      .delete(rfqs)
      .where(and(eq(rfqs.id, rfqId), eq(rfqs.buyerId, buyerId)));
  }

  /**
   * Get RFQ analytics for buyer
   */
  async getBuyerRFQAnalytics(buyerId: string): Promise<RFQAnalytics> {
    // Get RFQ counts by status
    const statusCounts = await db
      .select({
        status: rfqs.status,
        count: sql<number>`count(*)`,
      })
      .from(rfqs)
      .where(eq(rfqs.buyerId, buyerId))
      .groupBy(rfqs.status);

    const statusCountMap = statusCounts.reduce((acc, item) => {
      acc[item.status!] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Get average quotations per RFQ
    const [avgQuotations] = await db
      .select({
        avg: sql<number>`AVG(quotation_count)`,
      })
      .from(
        db
          .select({
            rfqId: quotations.rfqId,
            quotationCount: sql<number>`count(*)`.as('quotation_count'),
          })
          .from(quotations)
          .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
          .where(eq(rfqs.buyerId, buyerId))
          .groupBy(quotations.rfqId)
          .as('rfq_quotations')
      );

    // Get top categories
    const topCategories = await db
      .select({
        categoryId: rfqs.categoryId,
        categoryName: categories.name,
        count: sql<number>`count(*)`,
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(and(eq(rfqs.buyerId, buyerId), sql`${rfqs.categoryId} IS NOT NULL`))
      .groupBy(rfqs.categoryId, categories.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const totalRFQs = statusCountMap.open + statusCountMap.closed + statusCountMap.expired || 0;

    return {
      totalRFQs,
      openRFQs: statusCountMap.open || 0,
      closedRFQs: statusCountMap.closed || 0,
      expiredRFQs: statusCountMap.expired || 0,
      averageQuotationsPerRFQ: avgQuotations?.avg || 0,
      averageResponseTime: 0, // TODO: Calculate based on quotation timestamps
      conversionRate: 0, // TODO: Calculate based on orders created from RFQs
      topCategories: topCategories.map(cat => ({
        categoryId: cat.categoryId!,
        categoryName: cat.categoryName || 'Unknown Category',
        rfqCount: cat.count,
      })),
    };
  }

  /**
   * Get quotations for an RFQ
   */
  async getRFQQuotations(rfqId: string, buyerId?: string): Promise<Array<Quotation & { supplier: SupplierProfile }>> {
    let query = db
      .select({
        quotation: quotations,
        supplier: supplierProfiles,
      })
      .from(quotations)
      .innerJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.id))
      .where(eq(quotations.rfqId, rfqId));

    // Verify buyer ownership if buyerId provided
    if (buyerId) {
      query = query
        .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
        .where(and(eq(quotations.rfqId, rfqId), eq(rfqs.buyerId, buyerId)));
    }

    const results = await query.orderBy(asc(quotations.unitPrice));

    return results.map(row => ({
      ...row.quotation,
      supplier: row.supplier,
    }));
  }

  /**
   * Accept a quotation
   */
  async acceptQuotation(quotationId: string, buyerId: string): Promise<Quotation> {
    // Verify the quotation belongs to buyer's RFQ
    const [quotationWithRFQ] = await db
      .select({
        quotation: quotations,
        rfq: rfqs,
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .where(and(eq(quotations.id, quotationId), eq(rfqs.buyerId, buyerId)))
      .limit(1);

    if (!quotationWithRFQ) {
      throw new Error('Quotation not found or access denied');
    }

    // Update quotation status
    const [acceptedQuotation] = await db
      .update(quotations)
      .set({
        status: 'accepted',
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId))
      .returning();

    // Close the RFQ
    await db
      .update(rfqs)
      .set({
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(eq(rfqs.id, quotationWithRFQ.quotation.rfqId!));

    return acceptedQuotation;
  }

  /**
   * Reject a quotation
   */
  async rejectQuotation(quotationId: string, buyerId: string, reason?: string): Promise<Quotation> {
    // Verify the quotation belongs to buyer's RFQ
    const [quotationWithRFQ] = await db
      .select({
        quotation: quotations,
        rfq: rfqs,
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .where(and(eq(quotations.id, quotationId), eq(rfqs.buyerId, buyerId)))
      .limit(1);

    if (!quotationWithRFQ) {
      throw new Error('Quotation not found or access denied');
    }

    // Update quotation status
    const [rejectedQuotation] = await db
      .update(quotations)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId))
      .returning();

    return rejectedQuotation;
  }

  /**
   * Extend RFQ expiration
   */
  async extendRFQExpiration(rfqId: string, buyerId: string, newExpirationDate: Date): Promise<Rfq> {
    const [extendedRFQ] = await db
      .update(rfqs)
      .set({
        expiresAt: newExpirationDate,
        updatedAt: new Date(),
      })
      .where(and(eq(rfqs.id, rfqId), eq(rfqs.buyerId, buyerId)))
      .returning();

    return extendedRFQ;
  }

  /**
   * Get expired RFQs that need status update
   */
  async getExpiredRFQs(): Promise<Rfq[]> {
    return await db
      .select()
      .from(rfqs)
      .where(and(
        eq(rfqs.status, 'open'),
        sql`${rfqs.expiresAt} < NOW()`
      ));
  }

  /**
   * Mark RFQs as expired
   */
  async markRFQsAsExpired(rfqIds: string[]): Promise<void> {
    if (rfqIds.length === 0) return;

    await db
      .update(rfqs)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(inArray(rfqs.id, rfqIds));
  }
}

export const buyerRFQService = new BuyerRFQService();