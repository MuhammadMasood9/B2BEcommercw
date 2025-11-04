import { db } from "./db";
import { 
  rfqs, 
  supplierProfiles, 
  products, 
  categories, 
  notifications,
  users,
  Rfq,
  SupplierProfile
} from "@shared/schema";
import { eq, and, or, ilike, sql, inArray, gte, lte, isNull } from "drizzle-orm";

interface MatchingCriteria {
  categoryMatch: boolean;
  productMatch: boolean;
  locationMatch: boolean;
  priceMatch: boolean;
  moqMatch: boolean;
  verificationMatch: boolean;
  score: number;
}

interface SupplierMatch {
  supplier: SupplierProfile;
  criteria: MatchingCriteria;
  matchedProducts: any[];
}

class RFQMatchingService {
  /**
   * Find relevant suppliers for a given RFQ
   */
  async findRelevantSuppliers(rfqId: string): Promise<SupplierMatch[]> {
    try {
      // Get RFQ details
      const rfqResult = await db
        .select({
          rfq: rfqs,
          category: categories
        })
        .from(rfqs)
        .leftJoin(categories, eq(rfqs.categoryId, categories.id))
        .where(eq(rfqs.id, rfqId))
        .limit(1);

      if (rfqResult.length === 0) {
        throw new Error('RFQ not found');
      }

      const { rfq, category } = rfqResult[0];

      // Get all active suppliers
      const suppliers = await db
        .select()
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.isActive, true),
          eq(supplierProfiles.status, 'approved')
        ));

      const matches: SupplierMatch[] = [];

      for (const supplier of suppliers) {
        const match = await this.evaluateSupplierMatch(rfq, supplier, category);
        if (match.criteria.score > 0) {
          matches.push(match);
        }
      }

      // Sort by score (highest first)
      matches.sort((a, b) => b.criteria.score - a.criteria.score);

      return matches;
    } catch (error) {
      console.error('Error finding relevant suppliers:', error);
      throw error;
    }
  }

  /**
   * Evaluate how well a supplier matches an RFQ
   */
  private async evaluateSupplierMatch(
    rfq: Rfq, 
    supplier: SupplierProfile, 
    category: any
  ): Promise<SupplierMatch> {
    const criteria: MatchingCriteria = {
      categoryMatch: false,
      productMatch: false,
      locationMatch: false,
      priceMatch: false,
      moqMatch: false,
      verificationMatch: false,
      score: 0
    };

    let matchedProducts: any[] = [];

    // 1. Category Match (30 points)
    if (rfq.categoryId && category) {
      const supplierProducts = await db
        .select()
        .from(products)
        .where(and(
          eq(products.supplierId, supplier.userId),
          eq(products.categoryId, rfq.categoryId),
          eq(products.isPublished, true),
          eq(products.isApproved, true)
        ))
        .limit(10);

      if (supplierProducts.length > 0) {
        criteria.categoryMatch = true;
        criteria.score += 30;
        matchedProducts = supplierProducts;
      }
    }

    // 2. Product Match by Keywords (25 points)
    if (!criteria.categoryMatch && (rfq.title || rfq.description)) {
      const keywords = this.extractKeywords(rfq.title + ' ' + rfq.description);
      
      if (keywords.length > 0) {
        const keywordConditions = keywords.map(keyword => 
          or(
            ilike(products.name, `%${keyword}%`),
            ilike(products.description, `%${keyword}%`),
            ilike(products.shortDescription, `%${keyword}%`)
          )
        );

        const keywordProducts = await db
          .select()
          .from(products)
          .where(and(
            eq(products.supplierId, supplier.userId),
            eq(products.isPublished, true),
            eq(products.isApproved, true),
            or(...keywordConditions)
          ))
          .limit(10);

        if (keywordProducts.length > 0) {
          criteria.productMatch = true;
          criteria.score += 25;
          matchedProducts = keywordProducts;
        }
      }
    }

    // 3. MOQ Match (20 points)
    if (matchedProducts.length > 0) {
      const compatibleMoqProducts = matchedProducts.filter(product => 
        product.minOrderQuantity <= rfq.quantity
      );

      if (compatibleMoqProducts.length > 0) {
        criteria.moqMatch = true;
        criteria.score += 20;
      }
    }

    // 4. Price Range Match (15 points)
    if (rfq.budgetRange && matchedProducts.length > 0) {
      const priceCompatibleProducts = matchedProducts.filter(product => {
        if (!product.priceRanges || !Array.isArray(product.priceRanges)) {
          return false;
        }

        return product.priceRanges.some((priceRange: any) => {
          const pricePerUnit = parseFloat(priceRange.pricePerUnit || '0');
          const totalBudget = pricePerUnit * rfq.quantity;
          
          const budgetRange = rfq.budgetRange as any;
          return totalBudget >= budgetRange.min && 
                 totalBudget <= budgetRange.max;
        });
      });

      if (priceCompatibleProducts.length > 0) {
        criteria.priceMatch = true;
        criteria.score += 15;
      }
    }

    // 5. Verification Level (10 points)
    if (supplier.isVerified) {
      criteria.verificationMatch = true;
      
      switch (supplier.verificationLevel) {
        case 'trade_assurance':
          criteria.score += 10;
          break;
        case 'premium':
          criteria.score += 8;
          break;
        case 'business':
          criteria.score += 6;
          break;
        case 'basic':
          criteria.score += 4;
          break;
        default:
          criteria.score += 2;
      }
    }

    // 6. Supplier Performance Bonus (up to 10 points)
    const performanceScore = this.calculatePerformanceScore(supplier);
    criteria.score += performanceScore;

    // 7. Location Match Bonus (5 points)
    if (rfq.deliveryLocation && supplier.country) {
      const deliveryCountry = this.extractCountryFromLocation(rfq.deliveryLocation);
      if (deliveryCountry && deliveryCountry.toLowerCase() === supplier.country.toLowerCase()) {
        criteria.locationMatch = true;
        criteria.score += 5;
      }
    }

    return {
      supplier,
      criteria,
      matchedProducts
    };
  }

  /**
   * Extract keywords from RFQ title and description
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];

    // Remove common words and extract meaningful keywords
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords

    return Array.from(new Set(words)); // Remove duplicates
  }

  /**
   * Calculate supplier performance score
   */
  private calculatePerformanceScore(supplier: SupplierProfile): number {
    let score = 0;

    // Rating score (0-5 points)
    const rating = parseFloat(supplier.rating || '0');
    score += Math.min(rating, 5);

    // Response rate score (0-3 points)
    const responseRate = parseFloat(supplier.responseRate || '0');
    score += Math.min(responseRate / 100 * 3, 3);

    // Order history score (0-2 points)
    const totalOrders = supplier.totalOrders || 0;
    if (totalOrders > 100) score += 2;
    else if (totalOrders > 50) score += 1.5;
    else if (totalOrders > 10) score += 1;
    else if (totalOrders > 0) score += 0.5;

    return Math.min(score, 10);
  }

  /**
   * Extract country from delivery location string
   */
  private extractCountryFromLocation(location: string): string | null {
    if (!location) return null;

    // Simple country extraction - in a real system, you'd use a proper geocoding service
    const commonCountries = [
      'USA', 'United States', 'US',
      'China', 'CN',
      'Germany', 'DE',
      'Japan', 'JP',
      'United Kingdom', 'UK', 'GB',
      'France', 'FR',
      'Italy', 'IT',
      'Spain', 'ES',
      'Canada', 'CA',
      'Australia', 'AU',
      'India', 'IN',
      'Brazil', 'BR',
      'Mexico', 'MX',
      'South Korea', 'KR',
      'Netherlands', 'NL',
      'Singapore', 'SG'
    ];

    const locationUpper = location.toUpperCase();
    
    for (const country of commonCountries) {
      if (locationUpper.includes(country.toUpperCase())) {
        return country;
      }
    }

    return null;
  }

  /**
   * Notify relevant suppliers about a new RFQ
   */
  async notifyRelevantSuppliers(rfqId: string, maxNotifications: number = 20): Promise<void> {
    try {
      const matches = await this.findRelevantSuppliers(rfqId);
      
      // Get RFQ details for notification
      const rfqResult = await db
        .select()
        .from(rfqs)
        .where(eq(rfqs.id, rfqId))
        .limit(1);

      if (rfqResult.length === 0) {
        throw new Error('RFQ not found');
      }

      const rfq = rfqResult[0];

      // Notify top matching suppliers
      const topMatches = matches.slice(0, maxNotifications);
      
      const notifications = topMatches.map(match => ({
        userId: match.supplier.userId,
        type: 'info' as const,
        title: 'New RFQ Match',
        message: `A new RFQ "${rfq.title}" matches your products. Score: ${match.criteria.score}%`,
        relatedId: rfqId,
        relatedType: 'rfq' as const
      }));

      if (notifications.length > 0) {
        await db.insert(notifications).values(notifications);
      }

      console.log(`Notified ${notifications.length} suppliers about RFQ ${rfqId}`);
    } catch (error) {
      console.error('Error notifying suppliers:', error);
      throw error;
    }
  }

  /**
   * Get matching statistics for an RFQ
   */
  async getMatchingStats(rfqId: string): Promise<{
    totalSuppliers: number;
    matchedSuppliers: number;
    topScore: number;
    averageScore: number;
  }> {
    try {
      const matches = await this.findRelevantSuppliers(rfqId);
      
      const totalSuppliers = await db
        .select({ count: sql<number>`count(*)` })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.isActive, true),
          eq(supplierProfiles.status, 'approved')
        ));

      const matchedSuppliers = matches.length;
      const topScore = matches.length > 0 ? matches[0].criteria.score : 0;
      const averageScore = matches.length > 0 
        ? matches.reduce((sum, match) => sum + match.criteria.score, 0) / matches.length 
        : 0;

      return {
        totalSuppliers: totalSuppliers[0]?.count || 0,
        matchedSuppliers,
        topScore,
        averageScore: Math.round(averageScore * 100) / 100
      };
    } catch (error) {
      console.error('Error getting matching stats:', error);
      throw error;
    }
  }
}

export const rfqMatchingService = new RFQMatchingService();