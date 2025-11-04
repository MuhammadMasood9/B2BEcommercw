import { db } from './db';
import { 
  quotations, 
  inquiryQuotations,
  rfqs,
  inquiries,
  buyers,
  users,
  type Rfq,
  type Inquiry,
  type Buyer,
  type User 
} from '@shared/schema';
import { eq, and, or, desc, asc, sql, gte, lte } from 'drizzle-orm';

export interface QuotationFilters {
  type?: 'rfq' | 'inquiry';
  status?: 'sent' | 'accepted' | 'rejected' | 'expired' | 'pending';
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  minValue?: number;
  maxValue?: number;
}

export interface QuotationAnalytics {
  totalQuotations: number;
  rfqQuotations: number;
  inquiryQuotations: number;
  acceptedQuotations: number;
  rejectedQuotations: number;
  pendingQuotations: number;
  expiredQuotations: number;
  acceptanceRate: number;
  averageQuotationValue: number;
  totalQuotationValue: number;
  conversionRate: number; // percentage that resulted in orders
  monthlyTrend: Array<{
    month: string;
    quotationCount: number;
    acceptedCount: number;
    totalValue: number;
  }>;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description: string;
  paymentTerms: string;
  leadTime: string;
  validityPeriod: number;
  termsConditions: string;
  isDefault: boolean;
}

export interface UnifiedQuotation {
  id: string;
  type: 'rfq' | 'inquiry';
  status: string;
  unitPrice?: number;
  pricePerUnit?: number;
  totalPrice: number;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validityPeriod?: number;
  termsConditions?: string;
  message?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt?: Date;
  // Related data
  rfq?: Rfq;
  inquiry?: Inquiry;
  buyer: Buyer & { user: User };

}

export class SupplierQuotationService {

  /**
   * Get all quotations for supplier (both RFQ and inquiry quotations)
   */
  async getSupplierQuotations(
    supplierId: string,
    filters: QuotationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    quotations: UnifiedQuotation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    let allQuotations: UnifiedQuotation[] = [];

    // Get RFQ quotations if not filtered to inquiry only
    if (!filters.type || filters.type === 'rfq') {
      const rfqQuotationsQuery = this.buildRFQQuotationsQuery(supplierId, filters);
      const rfqQuotations = await rfqQuotationsQuery;
      
      for (const row of rfqQuotations) {
        allQuotations.push({
          id: row.quotation.id,
          type: 'rfq',
          status: row.quotation.status!,
          unitPrice: Number(row.quotation.unitPrice),
          totalPrice: Number(row.quotation.totalPrice),
          moq: row.quotation.moq,
          leadTime: row.quotation.leadTime || '',
          paymentTerms: row.quotation.paymentTerms || '',
          validityPeriod: row.quotation.validityPeriod || undefined,
          termsConditions: row.quotation.termsConditions || undefined,
          attachments: row.quotation.attachments || [],
          createdAt: row.quotation.createdAt!,
          updatedAt: row.quotation.updatedAt || undefined,
          rfq: row.rfq,
          buyer: {
            ...row.buyer,
            user: row.user,
          },
        });
      }
    }

    // Get inquiry quotations if not filtered to RFQ only
    if (!filters.type || filters.type === 'inquiry') {
      const inquiryQuotationsQuery = this.buildInquiryQuotationsQuery(supplierId, filters);
      const inquiryQuotations = await inquiryQuotationsQuery;
      
      for (const row of inquiryQuotations) {
        allQuotations.push({
          id: row.quotation.id,
          type: 'inquiry',
          status: row.quotation.status!,
          pricePerUnit: Number(row.quotation.pricePerUnit),
          totalPrice: Number(row.quotation.totalPrice),
          moq: row.quotation.moq,
          leadTime: row.quotation.leadTime || '',
          paymentTerms: row.quotation.paymentTerms || '',
          message: row.quotation.message || undefined,
          attachments: row.quotation.attachments || [],
          createdAt: row.quotation.createdAt!,
          inquiry: row.inquiry,
          buyer: {
            ...row.buyer,
            user: row.user,
          },
        });
      }
    }

    // Sort by creation date (newest first)
    allQuotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const total = allQuotations.length;
    const paginatedQuotations = allQuotations.slice(offset, offset + limit);

    return {
      quotations: paginatedQuotations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Build RFQ quotations query with filters
   */
  private async buildRFQQuotationsQuery(supplierId: string, filters: QuotationFilters) {
    // Apply filters
    const whereConditions = [eq(quotations.supplierId, supplierId)];

    if (filters.status) {
      whereConditions.push(eq(quotations.status, filters.status));
    }

    if (filters.dateFrom) {
      whereConditions.push(gte(quotations.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      whereConditions.push(lte(quotations.createdAt, filters.dateTo));
    }

    if (filters.minValue) {
      whereConditions.push(sql`${quotations.totalPrice}::numeric >= ${filters.minValue}`);
    }

    if (filters.maxValue) {
      whereConditions.push(sql`${quotations.totalPrice}::numeric <= ${filters.maxValue}`);
    }

    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
      whereConditions.push(
        or(
          sql`LOWER(${rfqs.title}) LIKE ${searchPattern}`,
          sql`LOWER(${rfqs.description}) LIKE ${searchPattern}`,
          sql`LOWER(${quotations.termsConditions}) LIKE ${searchPattern}`
        )!
      );
    }

    return await db
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
      .where(and(...whereConditions));
  }

  /**
   * Build inquiry quotations query with filters
   */
  private async buildInquiryQuotationsQuery(supplierId: string, filters: QuotationFilters) {
    // Apply filters
    const whereConditions = [eq(inquiries.supplierId, supplierId)];

    if (filters.status) {
      whereConditions.push(eq(inquiryQuotations.status, filters.status));
    }

    if (filters.dateFrom) {
      whereConditions.push(gte(inquiryQuotations.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      whereConditions.push(lte(inquiryQuotations.createdAt, filters.dateTo));
    }

    if (filters.minValue) {
      whereConditions.push(sql`${inquiryQuotations.totalPrice}::numeric >= ${filters.minValue}`);
    }

    if (filters.maxValue) {
      whereConditions.push(sql`${inquiryQuotations.totalPrice}::numeric <= ${filters.maxValue}`);
    }

    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
      whereConditions.push(
        or(
          sql`LOWER(${inquiries.subject}) LIKE ${searchPattern}`,
          sql`LOWER(${inquiries.message}) LIKE ${searchPattern}`,
          sql`LOWER(${inquiryQuotations.message}) LIKE ${searchPattern}`
        )!
      );
    }

    return await db
      .select({
        quotation: inquiryQuotations,
        inquiry: inquiries,
        buyer: buyers,
        user: users,
      })
      .from(inquiryQuotations)
      .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .innerJoin(buyers, eq(inquiries.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(and(...whereConditions));
  }

  /**
   * Get quotation analytics for supplier
   */
  async getSupplierQuotationAnalytics(supplierId: string): Promise<QuotationAnalytics> {
    // Get RFQ quotation stats
    const rfqQuotationStats = await db
      .select({
        status: quotations.status,
        count: sql<number>`count(*)`,
        totalValue: sql<number>`sum(total_price)`,
      })
      .from(quotations)
      .where(eq(quotations.supplierId, supplierId))
      .groupBy(quotations.status);

    // Get inquiry quotation stats
    const inquiryQuotationStats = await db
      .select({
        status: inquiryQuotations.status,
        count: sql<number>`count(*)`,
        totalValue: sql<number>`sum(total_price)`,
      })
      .from(inquiryQuotations)
      .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .where(eq(inquiries.supplierId, supplierId))
      .groupBy(inquiryQuotations.status);

    // Combine stats
    const combinedStats = new Map<string, { count: number; totalValue: number }>();
    
    rfqQuotationStats.forEach(stat => {
      const existing = combinedStats.get(stat.status!) || { count: 0, totalValue: 0 };
      combinedStats.set(stat.status!, {
        count: existing.count + stat.count,
        totalValue: existing.totalValue + Number(stat.totalValue || 0),
      });
    });

    inquiryQuotationStats.forEach(stat => {
      const existing = combinedStats.get(stat.status!) || { count: 0, totalValue: 0 };
      combinedStats.set(stat.status!, {
        count: existing.count + stat.count,
        totalValue: existing.totalValue + Number(stat.totalValue || 0),
      });
    });

    // Get total counts
    const [{ rfqCount }] = await db
      .select({ rfqCount: sql<number>`count(*)` })
      .from(quotations)
      .where(eq(quotations.supplierId, supplierId));

    const [{ inquiryCount }] = await db
      .select({ inquiryCount: sql<number>`count(*)` })
      .from(inquiryQuotations)
      .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .where(eq(inquiries.supplierId, supplierId));

    // Calculate metrics
    const totalQuotations = rfqCount + inquiryCount;
    const acceptedQuotations = combinedStats.get('accepted')?.count || 0;
    const rejectedQuotations = combinedStats.get('rejected')?.count || 0;
    const pendingQuotations = (combinedStats.get('sent')?.count || 0) + (combinedStats.get('pending')?.count || 0);
    const expiredQuotations = combinedStats.get('expired')?.count || 0;
    
    const acceptanceRate = totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0;
    const totalValue = Array.from(combinedStats.values()).reduce((sum, stat) => sum + stat.totalValue, 0);
    const averageValue = totalQuotations > 0 ? totalValue / totalQuotations : 0;

    // Get monthly trend (last 12 months)
    const monthlyTrend = await this.getMonthlyQuotationTrend(supplierId);

    return {
      totalQuotations,
      rfqQuotations: rfqCount,
      inquiryQuotations: inquiryCount,
      acceptedQuotations,
      rejectedQuotations,
      pendingQuotations,
      expiredQuotations,
      acceptanceRate,
      averageQuotationValue: averageValue,
      totalQuotationValue: totalValue,
      conversionRate: 0, // TODO: Calculate based on orders
      monthlyTrend,
    };
  }

  /**
   * Get monthly quotation trend
   */
  private async getMonthlyQuotationTrend(supplierId: string) {
    const rfqTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${quotations.createdAt}, 'YYYY-MM')`,
        quotationCount: sql<number>`count(*)`,
        acceptedCount: sql<number>`count(CASE WHEN ${quotations.status} = 'accepted' THEN 1 END)`,
        totalValue: sql<number>`sum(total_price)`,
      })
      .from(quotations)
      .where(and(
        eq(quotations.supplierId, supplierId),
        gte(quotations.createdAt, new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000))
      ))
      .groupBy(sql`TO_CHAR(${quotations.createdAt}, 'YYYY-MM')`)
      .orderBy(asc(sql`TO_CHAR(${quotations.createdAt}, 'YYYY-MM')`));

    const inquiryTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${inquiryQuotations.createdAt}, 'YYYY-MM')`,
        quotationCount: sql<number>`count(*)`,
        acceptedCount: sql<number>`count(CASE WHEN ${inquiryQuotations.status} = 'accepted' THEN 1 END)`,
        totalValue: sql<number>`sum(total_price)`,
      })
      .from(inquiryQuotations)
      .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .where(and(
        eq(inquiries.supplierId, supplierId),
        gte(inquiryQuotations.createdAt, new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000))
      ))
      .groupBy(sql`TO_CHAR(${inquiryQuotations.createdAt}, 'YYYY-MM')`)
      .orderBy(asc(sql`TO_CHAR(${inquiryQuotations.createdAt}, 'YYYY-MM')`));

    // Combine trends
    const combinedTrend = new Map<string, { quotationCount: number; acceptedCount: number; totalValue: number }>();

    rfqTrend.forEach(item => {
      combinedTrend.set(item.month, {
        quotationCount: item.quotationCount,
        acceptedCount: item.acceptedCount,
        totalValue: Number(item.totalValue || 0),
      });
    });

    inquiryTrend.forEach(item => {
      const existing = combinedTrend.get(item.month) || { quotationCount: 0, acceptedCount: 0, totalValue: 0 };
      combinedTrend.set(item.month, {
        quotationCount: existing.quotationCount + item.quotationCount,
        acceptedCount: existing.acceptedCount + item.acceptedCount,
        totalValue: existing.totalValue + Number(item.totalValue || 0),
      });
    });

    return Array.from(combinedTrend.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  /**
   * Get quotation templates for supplier
   */
  async getQuotationTemplates(supplierId: string): Promise<QuotationTemplate[]> {
    // Return default templates - in a real implementation, these would be stored in the database
    return [
      {
        id: 'template-1',
        name: 'Standard Manufacturing Quote',
        description: 'Standard template for manufacturing products',
        paymentTerms: '30% deposit, 70% before shipment',
        leadTime: '15-20 days after order confirmation',
        validityPeriod: 30,
        termsConditions: 'Price is valid for 30 days. FOB terms apply. Quality guarantee provided.',
        isDefault: true,
      },
      {
        id: 'template-2',
        name: 'Bulk Order Quote',
        description: 'Template for large quantity orders',
        paymentTerms: 'T/T, L/C at sight',
        leadTime: '20-30 days depending on quantity',
        validityPeriod: 45,
        termsConditions: 'Bulk pricing applies. Extended warranty included. Free samples available.',
        isDefault: false,
      },
      {
        id: 'template-3',
        name: 'Custom Product Quote',
        description: 'Template for customized products',
        paymentTerms: '50% deposit, 50% before delivery',
        leadTime: '25-35 days for custom production',
        validityPeriod: 15,
        termsConditions: 'Custom specifications require approval. No returns on customized items.',
        isDefault: false,
      },
    ];
  }

  /**
   * Get recent quotations for supplier dashboard
   */
  async getRecentQuotations(supplierId: string, limit: number = 5): Promise<UnifiedQuotation[]> {
    const result = await this.getSupplierQuotations(supplierId, {}, 1, limit);
    return result.quotations;
  }

  /**
   * Get quotation by ID
   */
  async getQuotationById(quotationId: string, supplierId: string, type: 'rfq' | 'inquiry'): Promise<UnifiedQuotation | null> {
    if (type === 'rfq') {
      const [result] = await db
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
        .where(and(eq(quotations.id, quotationId), eq(quotations.supplierId, supplierId)))
        .limit(1);

      if (!result) return null;

      return {
        id: result.quotation.id,
        type: 'rfq',
        status: result.quotation.status!,
        unitPrice: Number(result.quotation.unitPrice),
        totalPrice: Number(result.quotation.totalPrice),
        moq: result.quotation.moq,
        leadTime: result.quotation.leadTime || '',
        paymentTerms: result.quotation.paymentTerms || '',
        validityPeriod: result.quotation.validityPeriod || undefined,
        termsConditions: result.quotation.termsConditions || undefined,
        attachments: result.quotation.attachments || [],
        createdAt: result.quotation.createdAt!,
        updatedAt: result.quotation.updatedAt || undefined,
        rfq: result.rfq,
        buyer: {
          ...result.buyer,
          user: result.user,
        },
      };
    } else {
      const [result] = await db
        .select({
          quotation: inquiryQuotations,
          inquiry: inquiries,
          buyer: buyers,
          user: users,
        })
        .from(inquiryQuotations)
        .innerJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
        .innerJoin(buyers, eq(inquiries.buyerId, buyers.id))
        .innerJoin(users, eq(buyers.userId, users.id))
        .where(and(eq(inquiryQuotations.id, quotationId), eq(inquiries.supplierId, supplierId)))
        .limit(1);

      if (!result) return null;

      return {
        id: result.quotation.id,
        type: 'inquiry',
        status: result.quotation.status!,
        pricePerUnit: Number(result.quotation.pricePerUnit),
        totalPrice: Number(result.quotation.totalPrice),
        moq: result.quotation.moq,
        leadTime: result.quotation.leadTime || '',
        paymentTerms: result.quotation.paymentTerms || '',
        message: result.quotation.message || undefined,
        attachments: result.quotation.attachments || [],
        createdAt: result.quotation.createdAt!,
        inquiry: result.inquiry,
        buyer: {
          ...result.buyer,
          user: result.user,
        },
      };
    }
  }

  /**
   * Get quotation performance metrics
   */
  async getQuotationPerformanceMetrics(supplierId: string): Promise<{
    averageResponseTime: number; // hours
    quotationWinRate: number; // percentage
    averageQuotationValue: number;
    topPerformingCategories: Array<{ categoryName: string; acceptanceRate: number; count: number }>;
  }> {
    // TODO: Implement detailed performance metrics
    // This would require tracking response times and category performance
    
    const analytics = await this.getSupplierQuotationAnalytics(supplierId);
    
    return {
      averageResponseTime: 0, // TODO: Calculate from actual data
      quotationWinRate: analytics.acceptanceRate,
      averageQuotationValue: analytics.averageQuotationValue,
      topPerformingCategories: [], // TODO: Implement category analysis
    };
  }
}

export const supplierQuotationService = new SupplierQuotationService();