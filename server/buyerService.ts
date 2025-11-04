import { db } from './db';
import { buyers, users, buyerProfiles, type Buyer, type InsertBuyer, type User } from '@shared/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

export interface BuyerProfileData {
  companyName?: string;
  industry?: string;
  businessType?: string;
  annualVolume?: number;
  preferredPaymentTerms?: string[];
}

export interface BuyerAnalytics {
  totalRFQs: number;
  totalInquiries: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  preferredCategories: string[];
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    orderCount: number;
    totalSpent: number;
  }>;
}

export class BuyerService {
  
  /**
   * Create a new buyer profile
   */
  async createBuyerProfile(userId: string, profileData: BuyerProfileData): Promise<Buyer> {
    const [buyer] = await db.insert(buyers).values({
      userId,
      ...profileData,
    }).returning();
    
    return buyer;
  }

  /**
   * Get buyer profile by user ID
   */
  async getBuyerByUserId(userId: string): Promise<Buyer | null> {
    const [buyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.userId, userId))
      .limit(1);
    
    return buyer || null;
  }

  /**
   * Get buyer profile by buyer ID
   */
  async getBuyerById(buyerId: string): Promise<Buyer | null> {
    const [buyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, buyerId))
      .limit(1);
    
    return buyer || null;
  }

  /**
   * Update buyer profile
   */
  async updateBuyerProfile(buyerId: string, profileData: Partial<BuyerProfileData>): Promise<Buyer> {
    const [updatedBuyer] = await db
      .update(buyers)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(buyers.id, buyerId))
      .returning();
    
    return updatedBuyer;
  }

  /**
   * Get buyer with user information
   */
  async getBuyerWithUser(buyerId: string): Promise<(Buyer & { user: User }) | null> {
    const result = await db
      .select()
      .from(buyers)
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(eq(buyers.id, buyerId))
      .limit(1);
    
    if (result.length === 0) return null;
    
    return {
      ...result[0].buyers,
      user: result[0].users,
    };
  }

  /**
   * Get buyer analytics and statistics
   */
  async getBuyerAnalytics(buyerId: string): Promise<BuyerAnalytics> {
    // Get RFQ count
    const rfqCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(db.select().from(db.schema.rfqs).where(eq(db.schema.rfqs.buyerId, buyerId)).as('rfq_subquery'));

    // Get inquiry count
    const inquiryCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(db.select().from(db.schema.inquiries).where(eq(db.schema.inquiries.buyerId, buyerId)).as('inquiry_subquery'));

    // Get order statistics
    const orderStats = await db
      .select({
        count: sql<number>`count(*)`,
        totalSpent: sql<number>`coalesce(sum(total_amount), 0)`,
        avgOrderValue: sql<number>`coalesce(avg(total_amount), 0)`,
      })
      .from(db.schema.orders)
      .where(eq(db.schema.orders.buyerId, buyerId));

    // Get top suppliers
    const topSuppliers = await db
      .select({
        supplierId: db.schema.orders.supplierId,
        orderCount: sql<number>`count(*)`,
        totalSpent: sql<number>`sum(total_amount)`,
      })
      .from(db.schema.orders)
      .where(and(
        eq(db.schema.orders.buyerId, buyerId),
        sql`supplier_id IS NOT NULL`
      ))
      .groupBy(db.schema.orders.supplierId)
      .orderBy(desc(sql`sum(total_amount)`))
      .limit(5);

    // Get supplier names for top suppliers
    const suppliersWithNames = await Promise.all(
      topSuppliers.map(async (supplier) => {
        const [supplierProfile] = await db
          .select({ businessName: db.schema.supplierProfiles.businessName })
          .from(db.schema.supplierProfiles)
          .where(eq(db.schema.supplierProfiles.id, supplier.supplierId!))
          .limit(1);
        
        return {
          supplierId: supplier.supplierId!,
          supplierName: supplierProfile?.businessName || 'Unknown Supplier',
          orderCount: supplier.orderCount,
          totalSpent: Number(supplier.totalSpent),
        };
      })
    );

    return {
      totalRFQs: rfqCount[0]?.count || 0,
      totalInquiries: inquiryCount[0]?.count || 0,
      totalOrders: orderStats[0]?.count || 0,
      totalSpent: Number(orderStats[0]?.totalSpent || 0),
      averageOrderValue: Number(orderStats[0]?.avgOrderValue || 0),
      preferredCategories: [], // TODO: Implement based on order history
      topSuppliers: suppliersWithNames,
    };
  }

  /**
   * Get all buyers with pagination
   */
  async getAllBuyers(page: number = 1, limit: number = 20): Promise<{
    buyers: Array<Buyer & { user: User }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(buyers);
    
    // Get buyers with user information
    const buyersWithUsers = await db
      .select()
      .from(buyers)
      .innerJoin(users, eq(buyers.userId, users.id))
      .orderBy(desc(buyers.createdAt))
      .limit(limit)
      .offset(offset);
    
    const formattedBuyers = buyersWithUsers.map(row => ({
      ...row.buyers,
      user: row.users,
    }));
    
    return {
      buyers: formattedBuyers,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Search buyers by company name or industry
   */
  async searchBuyers(searchTerm: string, limit: number = 10): Promise<Array<Buyer & { user: User }>> {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    const results = await db
      .select()
      .from(buyers)
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(
        sql`LOWER(${buyers.companyName}) LIKE ${searchPattern} OR LOWER(${buyers.industry}) LIKE ${searchPattern}`
      )
      .orderBy(asc(buyers.companyName))
      .limit(limit);
    
    return results.map(row => ({
      ...row.buyers,
      user: row.users,
    }));
  }

  /**
   * Delete buyer profile
   */
  async deleteBuyerProfile(buyerId: string): Promise<void> {
    await db.delete(buyers).where(eq(buyers.id, buyerId));
  }
}

export const buyerService = new BuyerService();