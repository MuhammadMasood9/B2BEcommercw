import { db } from './db';
import { 
  inquiries, 
  inquiryQuotations,
  products,
  supplierProfiles,
  type Inquiry, 
  type InsertInquiry, 
  type InquiryQuotation,
  type Product,
  type SupplierProfile 
} from '@shared/schema';
import { eq, and, or, desc, asc, sql, gte, lte, inArray, isNull } from 'drizzle-orm';
import { notificationService } from './notificationService';

export interface InquiryFilters {
  status?: 'pending' | 'responded' | 'closed';
  supplierId?: string;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface InquiryAnalytics {
  totalInquiries: number;
  pendingInquiries: number;
  respondedInquiries: number;
  closedInquiries: number;
  averageResponseTime: number; // in hours
  responseRate: number; // percentage of inquiries that got responses
  conversionRate: number; // percentage of inquiries that resulted in orders
  topProducts: Array<{
    productId: string;
    productName: string;
    inquiryCount: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    inquiryCount: number;
    responseRate: number;
  }>;
}

export interface InquiryWithDetails extends Inquiry {
  product?: Product;
  supplier?: SupplierProfile;
  quotations: InquiryQuotation[];
  quotationCount: number;
  bestQuotation?: InquiryQuotation;
}

export class BuyerInquiryService {

  /**
   * Create a new inquiry
   */
  async createInquiry(buyerId: string, inquiryData: Omit<InsertInquiry, 'buyerId'>): Promise<Inquiry> {
    const [inquiry] = await db.insert(inquiries).values({
      ...inquiryData,
      buyerId,
      status: 'pending',
    }).returning();

    // Send notification to supplier if specified
    if (inquiry.supplierId) {
      try {
        await notificationService.createNotification({
          userId: inquiry.supplierId,
          type: 'info',
          title: 'New Product Inquiry',
          message: `You have received a new inquiry: ${inquiry.subject || 'Product inquiry'}`,
          relatedId: inquiry.id,
          relatedType: 'inquiry',
        });
      } catch (error) {
        console.error('Error sending inquiry notification:', error);
      }
    }

    return inquiry;
  }

  /**
   * Get inquiry by ID with full details
   */
  async getInquiryById(inquiryId: string, buyerId?: string): Promise<InquiryWithDetails | null> {
    // Get inquiry with product and supplier details
    let inquiryQuery = db
      .select({
        inquiry: inquiries,
        product: products,
        supplier: supplierProfiles,
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(supplierProfiles, eq(inquiries.supplierId, supplierProfiles.id))
      .where(eq(inquiries.id, inquiryId));

    if (buyerId) {
      inquiryQuery = inquiryQuery.where(and(eq(inquiries.id, inquiryId), eq(inquiries.buyerId, buyerId)));
    }

    const [inquiryResult] = await inquiryQuery.limit(1);
    if (!inquiryResult) return null;

    // Get quotations for this inquiry
    const quotationsResult = await db
      .select()
      .from(inquiryQuotations)
      .where(eq(inquiryQuotations.inquiryId, inquiryId))
      .orderBy(asc(inquiryQuotations.pricePerUnit));

    // Find best quotation (lowest price)
    const bestQuotation = quotationsResult.length > 0 ? quotationsResult[0] : undefined;

    return {
      ...inquiryResult.inquiry,
      product: inquiryResult.product,
      supplier: inquiryResult.supplier,
      quotations: quotationsResult,
      quotationCount: quotationsResult.length,
      bestQuotation,
    };
  }

  /**
   * Get buyer's inquiries with filtering and pagination
   */
  async getBuyerInquiries(
    buyerId: string,
    filters: InquiryFilters = {},
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
    const whereConditions = [eq(inquiries.buyerId, buyerId)];

    if (filters.status) {
      whereConditions.push(eq(inquiries.status, filters.status));
    }

    if (filters.supplierId) {
      whereConditions.push(eq(inquiries.supplierId, filters.supplierId));
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
        )
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inquiries)
      .where(and(...whereConditions));

    // Get inquiries with product and supplier details
    const inquiriesWithDetails = await db
      .select({
        inquiry: inquiries,
        product: products,
        supplier: supplierProfiles,
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(supplierProfiles, eq(inquiries.supplierId, supplierProfiles.id))
      .where(and(...whereConditions))
      .orderBy(desc(inquiries.createdAt))
      .limit(limit)
      .offset(offset);

    // Get quotation counts for each inquiry
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
    const formattedInquiries: InquiryWithDetails[] = inquiriesWithDetails.map(row => ({
      ...row.inquiry,
      product: row.product,
      supplier: row.supplier,
      quotations: [], // Will be loaded separately if needed
      quotationCount: quotationCountMap[row.inquiry.id] || 0,
    }));

    return {
      inquiries: formattedInquiries,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Update inquiry
   */
  async updateInquiry(inquiryId: string, buyerId: string, updateData: Partial<InsertInquiry>): Promise<Inquiry> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.buyerId, buyerId)))
      .returning();

    return updatedInquiry;
  }

  /**
   * Close inquiry
   */
  async closeInquiry(inquiryId: string, buyerId: string): Promise<Inquiry> {
    const [closedInquiry] = await db
      .update(inquiries)
      .set({
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.buyerId, buyerId)))
      .returning();

    return closedInquiry;
  }

  /**
   * Delete inquiry
   */
  async deleteInquiry(inquiryId: string, buyerId: string): Promise<void> {
    await db
      .delete(inquiries)
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.buyerId, buyerId)));
  }

  /**
   * Get inquiry analytics for buyer
   */
  async getBuyerInquiryAnalytics(buyerId: string): Promise<InquiryAnalytics> {
    // Get inquiry counts by status
    const statusCounts = await db
      .select({
        status: inquiries.status,
        count: sql<number>`count(*)`,
      })
      .from(inquiries)
      .where(eq(inquiries.buyerId, buyerId))
      .groupBy(inquiries.status);

    const statusCountMap = statusCounts.reduce((acc, item) => {
      acc[item.status!] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Get response rate
    const totalInquiries = statusCountMap.pending + statusCountMap.responded + statusCountMap.closed || 0;
    const respondedInquiries = statusCountMap.responded + statusCountMap.closed || 0;
    const responseRate = totalInquiries > 0 ? (respondedInquiries / totalInquiries) * 100 : 0;

    // Get top products
    const topProducts = await db
      .select({
        productId: inquiries.productId,
        productName: products.name,
        count: sql<number>`count(*)`,
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .where(and(eq(inquiries.buyerId, buyerId), sql`${inquiries.productId} IS NOT NULL`))
      .groupBy(inquiries.productId, products.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Get top suppliers
    const topSuppliers = await db
      .select({
        supplierId: inquiries.supplierId,
        supplierName: supplierProfiles.businessName,
        totalCount: sql<number>`count(*)`,
        respondedCount: sql<number>`count(CASE WHEN ${inquiries.status} IN ('responded', 'closed') THEN 1 END)`,
      })
      .from(inquiries)
      .leftJoin(supplierProfiles, eq(inquiries.supplierId, supplierProfiles.id))
      .where(and(eq(inquiries.buyerId, buyerId), sql`${inquiries.supplierId} IS NOT NULL`))
      .groupBy(inquiries.supplierId, supplierProfiles.businessName)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

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
        inquiryCount: product.count,
      })),
      topSuppliers: topSuppliers.map(supplier => ({
        supplierId: supplier.supplierId!,
        supplierName: supplier.supplierName || 'Unknown Supplier',
        inquiryCount: supplier.totalCount,
        responseRate: supplier.totalCount > 0 ? (supplier.respondedCount / supplier.totalCount) * 100 : 0,
      })),
    };
  }

  /**
   * Get quotations for an inquiry
   */
  async getInquiryQuotations(inquiryId: string, buyerId?: string): Promise<InquiryQuotation[]> {
    let query = db
      .select()
      .from(inquiryQuotations)
      .where(eq(inquiryQuotations.inquiryId, inquiryId));

    // Verify buyer ownership if buyerId provided
    if (buyerId) {
      query = query
        .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
        .where(and(eq(inquiryQuotations.inquiryId, inquiryId), eq(inquiries.buyerId, buyerId)));
    }

    return await query.orderBy(asc(inquiryQuotations.pricePerUnit));
  }

  /**
   * Accept an inquiry quotation
   */
  async acceptInquiryQuotation(quotationId: string, buyerId: string): Promise<InquiryQuotation> {
    // Verify the quotation belongs to buyer's inquiry
    const [quotationWithInquiry] = await db
      .select({
        quotation: inquiryQuotations,
        inquiry: inquiries,
      })
      .from(inquiryQuotations)
      .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .where(and(eq(inquiryQuotations.id, quotationId), eq(inquiries.buyerId, buyerId)))
      .limit(1);

    if (!quotationWithInquiry) {
      throw new Error('Quotation not found or access denied');
    }

    // Update quotation status
    const [acceptedQuotation] = await db
      .update(inquiryQuotations)
      .set({
        status: 'accepted',
      })
      .where(eq(inquiryQuotations.id, quotationId))
      .returning();

    // Close the inquiry
    await db
      .update(inquiries)
      .set({
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(eq(inquiries.id, quotationWithInquiry.quotation.inquiryId));

    return acceptedQuotation;
  }

  /**
   * Reject an inquiry quotation
   */
  async rejectInquiryQuotation(quotationId: string, buyerId: string, reason?: string): Promise<InquiryQuotation> {
    // Verify the quotation belongs to buyer's inquiry
    const [quotationWithInquiry] = await db
      .select({
        quotation: inquiryQuotations,
        inquiry: inquiries,
      })
      .from(inquiryQuotations)
      .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .where(and(eq(inquiryQuotations.id, quotationId), eq(inquiries.buyerId, buyerId)))
      .limit(1);

    if (!quotationWithInquiry) {
      throw new Error('Quotation not found or access denied');
    }

    // Update quotation status
    const [rejectedQuotation] = await db
      .update(inquiryQuotations)
      .set({
        status: 'rejected',
        rejectionReason: reason,
      })
      .where(eq(inquiryQuotations.id, quotationId))
      .returning();

    return rejectedQuotation;
  }

  /**
   * Get inquiry templates for quick inquiry creation
   */
  async getInquiryTemplates(): Promise<Array<{ subject: string; message: string; category: string }>> {
    // Return common inquiry templates
    return [
      {
        subject: 'Product Pricing Inquiry',
        message: 'Hello, I am interested in your product and would like to know about pricing for different quantities. Could you please provide a detailed quotation?',
        category: 'pricing',
      },
      {
        subject: 'Sample Request',
        message: 'Hi, I would like to request a sample of this product to evaluate quality. Please let me know the sample cost and shipping details.',
        category: 'sample',
      },
      {
        subject: 'Customization Inquiry',
        message: 'Hello, I am interested in customizing this product according to my specifications. Could you please confirm if customization is possible and provide details?',
        category: 'customization',
      },
      {
        subject: 'Bulk Order Inquiry',
        message: 'Hi, I am planning to place a bulk order for this product. Please provide pricing for large quantities and delivery timeline.',
        category: 'bulk',
      },
      {
        subject: 'Technical Specifications',
        message: 'Hello, I need detailed technical specifications and certifications for this product. Could you please provide complete documentation?',
        category: 'technical',
      },
    ];
  }

  /**
   * Get recent inquiries for buyer dashboard
   */
  async getRecentInquiries(buyerId: string, limit: number = 5): Promise<InquiryWithDetails[]> {
    const recentInquiries = await db
      .select({
        inquiry: inquiries,
        product: products,
        supplier: supplierProfiles,
      })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(supplierProfiles, eq(inquiries.supplierId, supplierProfiles.id))
      .where(eq(inquiries.buyerId, buyerId))
      .orderBy(desc(inquiries.createdAt))
      .limit(limit);

    return recentInquiries.map(row => ({
      ...row.inquiry,
      product: row.product,
      supplier: row.supplier,
      quotations: [],
      quotationCount: 0,
    }));
  }

  /**
   * Mark inquiry as responded (called by supplier service)
   */
  async markInquiryAsResponded(inquiryId: string): Promise<void> {
    await db
      .update(inquiries)
      .set({
        status: 'responded',
        updatedAt: new Date(),
      })
      .where(eq(inquiries.id, inquiryId));
  }
}

export const buyerInquiryService = new BuyerInquiryService();