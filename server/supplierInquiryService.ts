import { db } from './db';
import { 
  inquiries, 
  inquiryQuotations,
  inquiryTemplates,
  products,
  buyers,
  users,
  orders,
  type Inquiry, 
  type InquiryQuotation,
  type InsertInquiryQuotation,
  type InquiryTemplate,
  type InsertInquiryTemplate,
  type Product,
  type Buyer,
  type User 
} from '@shared/schema';
import { eq, and, or, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import { notificationService } from './notificationService';
import { buyerInquiryService } from './buyerInquiryService';

export interface SupplierInquiryFilters {
  status?: 'pending' | 'responded' | 'closed';
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  hasQuoted?: boolean;
}

export interface SupplierInquiryAnalytics {
  totalInquiries: number;
  pendingInquiries: number;
  respondedInquiries: number;
  closedInquiries: number;
  averageResponseTime: number; // in hours
  responseRate: number; // percentage of inquiries responded to
  conversionRate: number; // percentage of inquiries that resulted in orders
  topProducts: Array<{
    productId: string;
    productName: string;
    inquiryCount: number;
    responseRate: number;
  }>;
  dailyInquiries: Array<{
    date: string;
    count: number;
  }>;
}

export interface InquiryWithDetails extends Inquiry {
  product?: Product;
  buyer: Buyer & { user: User };
  quotations: InquiryQuotation[];
  quotationCount: number;
  hasResponded: boolean;
}

export class SupplierInquiryService {

  /**
   * Get supplier's inquiries with filtering and pagination
   */
  async getSupplierInquiries(
    supplierId: string,
    filters: SupplierInquiryFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    inquiries: InquiryWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(inquiries.supplierId, supplierId)];

    if (filters.status) {
      whereConditions.push(eq(inquiries.status, filters.status));
    }

    if (filters.productId) {
      whereConditions.push(eq(inquiries.productId, filters.productId));
    }

    if (filters.dateFrom) {
      whereConditions.push(gte(inquiries.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      whereConditions.push(lte(inquiries.createdAt, filters.dateTo));
    }

    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
      whereConditions.push(
        or(
          sql`LOWER(${inquiries.subject}) LIKE ${searchPattern}`,
          sql`LOWER(${inquiries.message}) LIKE ${searchPattern}`,
          sql`LOWER(${inquiries.requirements}) LIKE ${searchPattern}`
        )!
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inquiries)
      .where(and(...whereConditions));

    // Get inquiries with product and buyer details
    const inquiriesWithDetails = await db
      .select({
        inquiry: inquiries,
        product: products,
        buyer: buyers,
        user: users,
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .innerJoin(buyers, eq(inquiries.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(inquiries.createdAt))
      .limit(limit)
      .offset(offset);

    // Get quotation information for each inquiry
    const inquiryIds = inquiriesWithDetails.map(i => i.inquiry.id);
    const quotationCounts = inquiryIds.length > 0 
      ? await db
          .select({
            inquiryId: inquiryQuotations.inquiryId,
            count: sql<number>`count(*)`,
          })
          .from(inquiryQuotations)
          .where(inArray(inquiryQuotations.inquiryId, inquiryIds))
          .groupBy(inquiryQuotations.inquiryId)
      : [];

    const quotationCountMap = quotationCounts.reduce((acc, item) => {
      acc[item.inquiryId] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Format results
    let formattedInquiries: InquiryWithDetails[] = inquiriesWithDetails.map(row => ({
      ...row.inquiry,
      product: row.product || undefined,
      buyer: {
        ...row.buyer,
        user: row.user,
      },
      quotations: [], // Will be loaded separately if needed
      quotationCount: quotationCountMap[row.inquiry.id] || 0,
      hasResponded: quotationCountMap[row.inquiry.id] > 0,
    }));

    // Apply hasQuoted filter if specified
    if (filters.hasQuoted !== undefined) {
      formattedInquiries = formattedInquiries.filter(inquiry => inquiry.hasResponded === filters.hasQuoted);
    }

    return {
      inquiries: formattedInquiries,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get inquiry details for supplier
   */
  async getInquiryDetails(inquiryId: string, supplierId: string): Promise<InquiryWithDetails | null> {
    // Get inquiry with product and buyer details
    const [inquiryResult] = await db
      .select({
        inquiry: inquiries,
        product: products,
        buyer: buyers,
        user: users,
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .innerJoin(buyers, eq(inquiries.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.supplierId, supplierId)))
      .limit(1);

    if (!inquiryResult) return null;

    // Get quotations for this inquiry
    const quotationsResult = await db
      .select()
      .from(inquiryQuotations)
      .where(eq(inquiryQuotations.inquiryId, inquiryId))
      .orderBy(desc(inquiryQuotations.createdAt));

    return {
      ...inquiryResult.inquiry,
      product: inquiryResult.product || undefined,
      buyer: {
        ...inquiryResult.buyer,
        user: inquiryResult.user,
      },
      quotations: quotationsResult,
      quotationCount: quotationsResult.length,
      hasResponded: quotationsResult.length > 0,
    };
  }

  /**
   * Respond to inquiry with quotation
   */
  async respondToInquiry(
    inquiryId: string, 
    supplierId: string, 
    quotationData: Omit<InsertInquiryQuotation, 'inquiryId'>
  ): Promise<InquiryQuotation> {
    // Verify inquiry belongs to supplier and is still open
    const [inquiry] = await db
      .select()
      .from(inquiries)
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.supplierId, supplierId)))
      .limit(1);

    if (!inquiry) {
      throw new Error('Inquiry not found or access denied');
    }

    if (inquiry.status === 'closed') {
      throw new Error('Inquiry is already closed');
    }

    // Create quotation
    const [quotation] = await db.insert(inquiryQuotations).values({
      ...quotationData,
      inquiryId,
      status: 'pending',
    }).returning();

    // Mark inquiry as responded
    await buyerInquiryService.markInquiryAsResponded(inquiryId);

    // Send notification to buyer
    try {
      await notificationService.createNotification({
        userId: inquiry.buyerId,
        type: 'info',
        title: 'Inquiry Response Received',
        message: `You have received a response to your inquiry: ${inquiry.subject || 'Product inquiry'}`,
        relatedId: quotation.id,
        relatedType: 'inquiry_quotation',
      });
    } catch (error) {
      console.error('Error sending inquiry response notification:', error);
    }

    return quotation;
  }

  /**
   * Update inquiry quotation
   */
  async updateInquiryQuotation(
    quotationId: string, 
    supplierId: string, 
    updateData: Partial<InsertInquiryQuotation>
  ): Promise<InquiryQuotation> {
    // Verify quotation belongs to supplier's inquiry
    const [quotationWithInquiry] = await db
      .select({
        quotation: inquiryQuotations,
        inquiry: inquiries,
      })
      .from(inquiryQuotations)
      .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .where(and(eq(inquiryQuotations.id, quotationId), eq(inquiries.supplierId, supplierId)))
      .limit(1);

    if (!quotationWithInquiry) {
      throw new Error('Quotation not found or access denied');
    }

    if (quotationWithInquiry.quotation.status !== 'pending') {
      throw new Error('Quotation cannot be modified after it has been accepted or rejected');
    }

    // Update quotation
    const [updatedQuotation] = await db
      .update(inquiryQuotations)
      .set(updateData)
      .where(eq(inquiryQuotations.id, quotationId))
      .returning();

    return updatedQuotation;
  }

  /**
   * Get supplier inquiry analytics
   */
  async getSupplierInquiryAnalytics(supplierId: string): Promise<SupplierInquiryAnalytics> {
    // Get inquiry counts by status
    const statusCounts = await db
      .select({
        status: inquiries.status,
        count: sql<number>`count(*)`,
      })
      .from(inquiries)
      .where(eq(inquiries.supplierId, supplierId))
      .groupBy(inquiries.status);

    const statusCountMap = statusCounts.reduce((acc, item) => {
      acc[item.status!] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const totalInquiries = statusCountMap.pending + statusCountMap.responded + statusCountMap.closed || 0;
    const respondedInquiries = statusCountMap.responded + statusCountMap.closed || 0;
    const responseRate = totalInquiries > 0 ? (respondedInquiries / totalInquiries) * 100 : 0;

    // Get top products by inquiry count
    const topProducts = await db
      .select({
        productId: inquiries.productId,
        productName: products.name,
        totalCount: sql<number>`count(*)`,
        respondedCount: sql<number>`count(CASE WHEN ${inquiries.status} IN ('responded', 'closed') THEN 1 END)`,
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .where(and(eq(inquiries.supplierId, supplierId), sql`${inquiries.productId} IS NOT NULL`))
      .groupBy(inquiries.productId, products.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Get daily inquiry counts for the last 30 days
    const dailyInquiries = await db
      .select({
        date: sql<string>`DATE(${inquiries.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(inquiries)
      .where(and(
        eq(inquiries.supplierId, supplierId),
        gte(inquiries.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      ))
      .groupBy(sql`DATE(${inquiries.createdAt})`)
      .orderBy(asc(sql`DATE(${inquiries.createdAt})`));

    return {
      totalInquiries,
      pendingInquiries: statusCountMap.pending || 0,
      respondedInquiries: statusCountMap.responded || 0,
      closedInquiries: statusCountMap.closed || 0,
      averageResponseTime: 0, // TODO: Calculate based on response timestamps
      responseRate,
      conversionRate: 0, // TODO: Calculate based on orders created from inquiries
      topProducts: topProducts.map(product => ({
        productId: product.productId!,
        productName: product.productName || 'Unknown Product',
        inquiryCount: product.totalCount,
        responseRate: product.totalCount > 0 ? (product.respondedCount / product.totalCount) * 100 : 0,
      })),
      dailyInquiries: dailyInquiries.map(day => ({
        date: day.date,
        count: day.count,
      })),
    };
  }

  /**
   * Create inquiry template
   */
  async createInquiryTemplate(supplierId: string, templateData: Omit<InsertInquiryTemplate, 'supplierId'>): Promise<InquiryTemplate> {
    const [template] = await db.insert(inquiryTemplates).values({
      ...templateData,
      supplierId,
    }).returning();

    return template;
  }

  /**
   * Get supplier's inquiry templates
   */
  async getSupplierTemplates(supplierId: string): Promise<InquiryTemplate[]> {
    return await db
      .select()
      .from(inquiryTemplates)
      .where(and(eq(inquiryTemplates.supplierId, supplierId), eq(inquiryTemplates.isActive, true)))
      .orderBy(desc(inquiryTemplates.usageCount), asc(inquiryTemplates.name));
  }

  /**
   * Update inquiry template
   */
  async updateInquiryTemplate(
    templateId: string, 
    supplierId: string, 
    updateData: Partial<InsertInquiryTemplate>
  ): Promise<InquiryTemplate> {
    const [updatedTemplate] = await db
      .update(inquiryTemplates)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(inquiryTemplates.id, templateId), eq(inquiryTemplates.supplierId, supplierId)))
      .returning();

    return updatedTemplate;
  }

  /**
   * Delete inquiry template
   */
  async deleteInquiryTemplate(templateId: string, supplierId: string): Promise<void> {
    await db
      .delete(inquiryTemplates)
      .where(and(eq(inquiryTemplates.id, templateId), eq(inquiryTemplates.supplierId, supplierId)));
  }

  /**
   * Use inquiry template (increment usage count)
   */
  async useInquiryTemplate(templateId: string, supplierId: string): Promise<InquiryTemplate> {
    const [template] = await db
      .update(inquiryTemplates)
      .set({
        usageCount: sql`${inquiryTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(inquiryTemplates.id, templateId), eq(inquiryTemplates.supplierId, supplierId)))
      .returning();

    return template;
  }

  /**
   * Get recent inquiries for supplier dashboard
   */
  async getRecentInquiries(supplierId: string, limit: number = 5): Promise<InquiryWithDetails[]> {
    const recentInquiries = await db
      .select({
        inquiry: inquiries,
        product: products,
        buyer: buyers,
        user: users,
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .innerJoin(buyers, eq(inquiries.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(eq(inquiries.supplierId, supplierId))
      .orderBy(desc(inquiries.createdAt))
      .limit(limit);

    return recentInquiries.map(row => ({
      ...row.inquiry,
      product: row.product || undefined,
      buyer: {
        ...row.buyer,
        user: row.user,
      },
      quotations: [],
      quotationCount: 0,
      hasResponded: row.inquiry.status !== 'pending',
    }));
  }

  /**
   * Get pending inquiries count
   */
  async getPendingInquiriesCount(supplierId: string): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inquiries)
      .where(and(eq(inquiries.supplierId, supplierId), eq(inquiries.status, 'pending')));

    return count;
  }

  /**
   * Mark inquiry as read/viewed by supplier
   */
  async markInquiryAsViewed(inquiryId: string, supplierId: string): Promise<void> {
    // This could be implemented with a separate table for tracking views
    // For now, we'll just ensure the inquiry exists and belongs to the supplier
    const [inquiry] = await db
      .select()
      .from(inquiries)
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.supplierId, supplierId)))
      .limit(1);

    if (!inquiry) {
      throw new Error('Inquiry not found or access denied');
    }

    // TODO: Implement inquiry view tracking if needed
  }

  /**
   * Get inquiry conversion rate (inquiries that resulted in orders)
   */
  async getInquiryConversionRate(supplierId: string): Promise<number> {
    // Get total inquiries
    const [{ totalInquiries }] = await db
      .select({ totalInquiries: sql<number>`count(*)` })
      .from(inquiries)
      .where(eq(inquiries.supplierId, supplierId));

    // Get inquiries that resulted in orders
    const [{ convertedInquiries }] = await db
      .select({ convertedInquiries: sql<number>`count(DISTINCT ${inquiries.id})` })
      .from(inquiries)
      .innerJoin(orders, eq(inquiries.id, orders.inquiryId))
      .where(eq(inquiries.supplierId, supplierId));

    return totalInquiries > 0 ? (convertedInquiries / totalInquiries) * 100 : 0;
  }

  /**
   * Get average response time for supplier
   */
  async getAverageResponseTime(supplierId: string): Promise<number> {
    // This would require tracking when inquiries are first viewed and when they're responded to
    // For now, return 0 as placeholder
    // TODO: Implement proper response time tracking
    return 0;
  }
}

export const supplierInquiryService = new SupplierInquiryService();