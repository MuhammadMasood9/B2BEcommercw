import { db } from './db';
import { 
  rfqs, 
  quotations, 
  categories,
  buyers,
  users,
  products,
  type Rfq, 
  type Quotation,
  type InsertQuotation,
  type Category,
  type Buyer,
  type User 
} from '@shared/schema';
import { eq, and, or, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import { notificationService } from './notificationService';

export interface SupplierRFQFilters {
  status?: 'open' | 'closed' | 'expired';
  categoryId?: string;
  minBudget?: number;
  maxBudget?: number;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  hasQuoted?: boolean;
}

export interface SupplierRFQAnalytics {
  totalRFQsAvailable: number;
  quotedRFQs: number;
  acceptedQuotations: number;
  rejectedQuotations: number;
  pendingQuotations: number;
  quotationAcceptanceRate: number;
  averageQuotationValue: number;
  totalQuotationValue: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    rfqCount: number;
    quotationCount: number;
  }>;
}

export interface RFQWithBuyer extends Rfq {
  category?: Category;
  buyer: Buyer & { user: User };
  hasQuoted: boolean;
  myQuotation?: Quotation;
  quotationCount: number;
}

export class SupplierRFQService {

  /**
   * Get available RFQs for supplier with filtering
   */
  async getAvailableRFQs(
    supplierId: string,
    filters: SupplierRFQFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    rfqs: RFQWithBuyer[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    // Only show open RFQs by default unless specified
    if (filters.status) {
      whereConditions.push(eq(rfqs.status, filters.status));
    } else {
      whereConditions.push(eq(rfqs.status, 'open'));
    }

    if (filters.categoryId) {
      whereConditions.push(eq(rfqs.categoryId, filters.categoryId));
    }

    if (filters.minBudget || filters.maxBudget) {
      if (filters.minBudget) {
        whereConditions.push(
          or(
            sql`${rfqs.targetPrice}::numeric >= ${filters.minBudget}`,
            sql`(${rfqs.budgetRange}->>'min')::numeric >= ${filters.minBudget}`
          )
        );
      }
      if (filters.maxBudget) {
        whereConditions.push(
          or(
            sql`${rfqs.targetPrice}::numeric <= ${filters.maxBudget}`,
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

    // Get RFQs with buyer and category details
    const rfqsWithDetails = await db
      .select({
        rfq: rfqs,
        category: categories,
        buyer: buyers,
        user: users,
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .innerJoin(buyers, eq(rfqs.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(rfqs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get quotation information for each RFQ
    const rfqIds = rfqsWithDetails.map(r => r.rfq.id);
    
    // Get supplier's quotations for these RFQs
    const supplierQuotations = rfqIds.length > 0 
      ? await db
          .select()
          .from(quotations)
          .where(and(
            inArray(quotations.rfqId, rfqIds),
            eq(quotations.supplierId, supplierId)
          ))
      : [];

    const supplierQuotationMap = supplierQuotations.reduce((acc, quotation) => {
      acc[quotation.rfqId!] = quotation;
      return acc;
    }, {} as Record<string, Quotation>);

    // Get total quotation counts for each RFQ
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
    let formattedRFQs: RFQWithBuyer[] = rfqsWithDetails.map(row => ({
      ...row.rfq,
      category: row.category || undefined,
      buyer: {
        ...row.buyer,
        user: row.user,
      },
      hasQuoted: !!supplierQuotationMap[row.rfq.id],
      myQuotation: supplierQuotationMap[row.rfq.id],
      quotationCount: quotationCountMap[row.rfq.id] || 0,
    }));

    // Apply hasQuoted filter if specified
    if (filters.hasQuoted !== undefined) {
      formattedRFQs = formattedRFQs.filter(rfq => rfq.hasQuoted === filters.hasQuoted);
    }

    return {
      rfqs: formattedRFQs,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get RFQ details for supplier
   */
  async getRFQDetails(rfqId: string, supplierId: string): Promise<RFQWithBuyer | null> {
    // Get RFQ with buyer and category details
    const [rfqResult] = await db
      .select({
        rfq: rfqs,
        category: categories,
        buyer: buyers,
        user: users,
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .innerJoin(buyers, eq(rfqs.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(eq(rfqs.id, rfqId))
      .limit(1);

    if (!rfqResult) return null;

    // Get supplier's quotation for this RFQ
    const [supplierQuotation] = await db
      .select()
      .from(quotations)
      .where(and(eq(quotations.rfqId, rfqId), eq(quotations.supplierId, supplierId)))
      .limit(1);

    // Get total quotation count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(eq(quotations.rfqId, rfqId));

    return {
      ...rfqResult.rfq,
      category: rfqResult.category || undefined,
      buyer: {
        ...rfqResult.buyer,
        user: rfqResult.user,
      },
      hasQuoted: !!supplierQuotation,
      myQuotation: supplierQuotation,
      quotationCount: count,
    };
  }

  /**
   * Create quotation for RFQ
   */
  async createQuotation(supplierId: string, quotationData: Omit<InsertQuotation, 'supplierId'>): Promise<Quotation> {
    // Verify RFQ exists and is open
    const [rfq] = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.id, quotationData.rfqId!))
      .limit(1);

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    if (rfq.status !== 'open') {
      throw new Error('RFQ is no longer accepting quotations');
    }

    // Check if supplier already quoted
    const [existingQuotation] = await db
      .select()
      .from(quotations)
      .where(and(eq(quotations.rfqId, quotationData.rfqId!), eq(quotations.supplierId, supplierId)))
      .limit(1);

    if (existingQuotation) {
      throw new Error('You have already submitted a quotation for this RFQ');
    }

    // Create quotation
    const [quotation] = await db.insert(quotations).values({
      ...quotationData,
      supplierId,
      status: 'sent',
    }).returning();

    // Send notification to buyer
    try {
      await notificationService.createNotification({
        userId: rfq.buyerId,
        type: 'info',
        title: 'New Quotation Received',
        message: `You have received a new quotation for your RFQ: ${rfq.title}`,
        relatedId: quotation.id,
        relatedType: 'quotation',
      });
    } catch (error) {
      console.error('Error sending quotation notification:', error);
    }

    return quotation;
  }

  /**
   * Update quotation
   */
  async updateQuotation(quotationId: string, supplierId: string, updateData: Partial<InsertQuotation>): Promise<Quotation> {
    // Verify quotation belongs to supplier and is still editable
    const [existingQuotation] = await db
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, quotationId), eq(quotations.supplierId, supplierId)))
      .limit(1);

    if (!existingQuotation) {
      throw new Error('Quotation not found or access denied');
    }

    if (existingQuotation.status !== 'sent') {
      throw new Error('Quotation cannot be modified after it has been accepted or rejected');
    }

    // Update quotation
    const [updatedQuotation] = await db
      .update(quotations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId))
      .returning();

    return updatedQuotation;
  }

  /**
   * Withdraw quotation
   */
  async withdrawQuotation(quotationId: string, supplierId: string): Promise<void> {
    // Verify quotation belongs to supplier and is still withdrawable
    const [existingQuotation] = await db
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, quotationId), eq(quotations.supplierId, supplierId)))
      .limit(1);

    if (!existingQuotation) {
      throw new Error('Quotation not found or access denied');
    }

    if (existingQuotation.status !== 'sent') {
      throw new Error('Quotation cannot be withdrawn after it has been accepted or rejected');
    }

    // Delete quotation
    await db.delete(quotations).where(eq(quotations.id, quotationId));
  }

  /**
   * Get supplier's quotations with filtering
   */
  async getSupplierQuotations(
    supplierId: string,
    status?: 'sent' | 'accepted' | 'rejected' | 'expired',
    page: number = 1,
    limit: number = 20
  ): Promise<{
    quotations: Array<Quotation & { rfq: Rfq; buyer: Buyer & { user: User } }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(quotations.supplierId, supplierId)];
    if (status) {
      whereConditions.push(eq(quotations.status, status));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(and(...whereConditions));

    // Get quotations with RFQ and buyer details
    const quotationsWithDetails = await db
      .select({
        quotation: quotations,
        rfq: rfqs,
        buyer: buyers,
        user: users,
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .innerJoin(buyers, eq(rfqs.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(quotations.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedQuotations = quotationsWithDetails.map(row => ({
      ...row.quotation,
      rfq: row.rfq,
      buyer: {
        ...row.buyer,
        user: row.user,
      },
    }));

    return {
      quotations: formattedQuotations,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get supplier RFQ analytics
   */
  async getSupplierRFQAnalytics(supplierId: string): Promise<SupplierRFQAnalytics> {
    // Get quotation counts by status
    const quotationStats = await db
      .select({
        status: quotations.status,
        count: sql<number>`count(*)`,
        avgValue: sql<number>`avg(total_price)`,
        totalValue: sql<number>`sum(total_price)`,
      })
      .from(quotations)
      .where(eq(quotations.supplierId, supplierId))
      .groupBy(quotations.status);

    const quotationStatsMap = quotationStats.reduce((acc, stat) => {
      acc[stat.status!] = {
        count: stat.count,
        avgValue: Number(stat.avgValue || 0),
        totalValue: Number(stat.totalValue || 0),
      };
      return acc;
    }, {} as Record<string, { count: number; avgValue: number; totalValue: number }>);

    // Get total available RFQs (open status)
    const [{ totalRFQs }] = await db
      .select({ totalRFQs: sql<number>`count(*)` })
      .from(rfqs)
      .where(eq(rfqs.status, 'open'));

    // Get quoted RFQs count
    const [{ quotedRFQs }] = await db
      .select({ quotedRFQs: sql<number>`count(DISTINCT ${quotations.rfqId})` })
      .from(quotations)
      .where(eq(quotations.supplierId, supplierId));

    // Calculate acceptance rate
    const totalQuotations = Object.values(quotationStatsMap).reduce((sum, stat) => sum + stat.count, 0);
    const acceptedQuotations = quotationStatsMap.accepted?.count || 0;
    const acceptanceRate = totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0;

    // Get top categories
    const topCategories = await db
      .select({
        categoryId: rfqs.categoryId,
        categoryName: categories.name,
        rfqCount: sql<number>`count(DISTINCT ${rfqs.id})`,
        quotationCount: sql<number>`count(${quotations.id})`,
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .where(and(eq(quotations.supplierId, supplierId), sql`${rfqs.categoryId} IS NOT NULL`))
      .groupBy(rfqs.categoryId, categories.name)
      .orderBy(desc(sql`count(${quotations.id})`))
      .limit(5);

    return {
      totalRFQsAvailable: totalRFQs,
      quotedRFQs,
      acceptedQuotations: quotationStatsMap.accepted?.count || 0,
      rejectedQuotations: quotationStatsMap.rejected?.count || 0,
      pendingQuotations: quotationStatsMap.sent?.count || 0,
      quotationAcceptanceRate: acceptanceRate,
      averageQuotationValue: quotationStatsMap.accepted?.avgValue || 0,
      totalQuotationValue: Object.values(quotationStatsMap).reduce((sum, stat) => sum + stat.totalValue, 0),
      topCategories: topCategories.map(cat => ({
        categoryId: cat.categoryId!,
        categoryName: cat.categoryName || 'Unknown Category',
        rfqCount: cat.rfqCount,
        quotationCount: cat.quotationCount,
      })),
    };
  }

  /**
   * Get recommended RFQs for supplier based on their products/categories
   */
  async getRecommendedRFQs(supplierId: string, limit: number = 10): Promise<RFQWithBuyer[]> {
    // Get supplier's product categories
    const supplierCategories = await db
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(and(
        eq(products.supplierId, supplierId),
        eq(products.isPublished, true),
        sql`${products.categoryId} IS NOT NULL`
      ))
      .groupBy(products.categoryId);

    const categoryIds = supplierCategories.map(cat => cat.categoryId!);

    if (categoryIds.length === 0) {
      return [];
    }

    // Get RFQs in supplier's categories that they haven't quoted yet
    const recommendedRFQs = await db
      .select({
        rfq: rfqs,
        category: categories,
        buyer: buyers,
        user: users,
      })
      .from(rfqs)
      .leftJoin(categories, eq(rfqs.categoryId, categories.id))
      .innerJoin(buyers, eq(rfqs.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(and(
        eq(rfqs.status, 'open'),
        inArray(rfqs.categoryId, categoryIds),
        sql`${rfqs.id} NOT IN (
          SELECT rfq_id FROM ${quotations} 
          WHERE supplier_id = ${supplierId} AND rfq_id IS NOT NULL
        )`
      ))
      .orderBy(desc(rfqs.createdAt))
      .limit(limit);

    return recommendedRFQs.map(row => ({
      ...row.rfq,
      category: row.category || undefined,
      buyer: {
        ...row.buyer,
        user: row.user,
      },
      hasQuoted: false,
      quotationCount: 0,
    }));
  }

  /**
   * Get recent quotations for supplier dashboard
   */
  async getRecentQuotations(supplierId: string, limit: number = 5): Promise<Array<Quotation & { rfq: Rfq }>> {
    const recentQuotations = await db
      .select({
        quotation: quotations,
        rfq: rfqs,
      })
      .from(quotations)
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .where(eq(quotations.supplierId, supplierId))
      .orderBy(desc(quotations.createdAt))
      .limit(limit);

    return recentQuotations.map(row => ({
      ...row.quotation,
      rfq: row.rfq,
    }));
  }

  /**
   * Check if quotation is expired and update status
   */
  async updateExpiredQuotations(): Promise<void> {
    await db
      .update(quotations)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(and(
        eq(quotations.status, 'sent'),
        sql`${quotations.validityPeriod} IS NOT NULL`,
        sql`${quotations.createdAt} + INTERVAL '1 day' * ${quotations.validityPeriod} < NOW()`
      ));
  }
}

export const supplierRFQService = new SupplierRFQService();