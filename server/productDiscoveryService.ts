import { db } from './db';
import { 
  products, 
  categories, 
  productAttributes, 
  supplierProfiles,
  type Product, 
  type Category,
  type ProductAttribute,
  type SupplierProfile 
} from '@shared/schema';
import { eq, and, or, like, gte, lte, inArray, sql, desc, asc, isNotNull } from 'drizzle-orm';

export interface ProductFilters {
  categoryId?: string;
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  minMOQ?: number;
  maxMOQ?: number;
  supplierCountry?: string;
  supplierVerificationLevel?: string;
  hasTradeAssurance?: boolean;
  sampleAvailable?: boolean;
  customizationAvailable?: boolean;
  certifications?: string[];
  colors?: string[];
  sizes?: string[];
  searchTerm?: string;
  tags?: string[];
  inStock?: boolean;
  isPublished?: boolean;
  isApproved?: boolean;
}

export interface ProductSortOptions {
  field: 'price' | 'popularity' | 'rating' | 'leadTime' | 'createdAt' | 'views' | 'inquiries';
  direction: 'asc' | 'desc';
}

export interface ProductDiscoveryResult {
  products: Array<Product & { 
    supplier: SupplierProfile;
    category: Category | null;
    attributes: ProductAttribute[];
  }>;
  total: number;
  page: number;
  totalPages: number;
  filters: {
    availableCategories: Category[];
    availableSuppliers: Array<{ id: string; name: string; country: string; verificationLevel: string }>;
    priceRange: { min: number; max: number };
    moqRange: { min: number; max: number };
    availableCertifications: string[];
    availableColors: string[];
    availableSizes: string[];
  };
}

export class ProductDiscoveryService {

  /**
   * Advanced product search with filtering, sorting, and pagination
   */
  async searchProducts(
    filters: ProductFilters = {},
    sort: ProductSortOptions = { field: 'createdAt', direction: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<ProductDiscoveryResult> {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    // Base conditions
    if (filters.isPublished !== false) {
      whereConditions.push(eq(products.isPublished, true));
    }
    if (filters.isApproved !== false) {
      whereConditions.push(eq(products.isApproved, true));
    }
    if (filters.inStock !== false) {
      whereConditions.push(eq(products.inStock, true));
    }

    // Category filter
    if (filters.categoryId) {
      whereConditions.push(eq(products.categoryId, filters.categoryId));
    }

    // Supplier filter
    if (filters.supplierId) {
      whereConditions.push(eq(products.supplierId, filters.supplierId));
    }

    // Price range filter (using first price range)
    if (filters.minPrice || filters.maxPrice) {
      if (filters.minPrice) {
        whereConditions.push(sql`
          CASE 
            WHEN ${products.priceRanges} IS NOT NULL AND jsonb_array_length(${products.priceRanges}) > 0
            THEN (${products.priceRanges}->0->>'pricePerUnit')::numeric >= ${filters.minPrice}
            ELSE false
          END
        `);
      }
      if (filters.maxPrice) {
        whereConditions.push(sql`
          CASE 
            WHEN ${products.priceRanges} IS NOT NULL AND jsonb_array_length(${products.priceRanges}) > 0
            THEN (${products.priceRanges}->0->>'pricePerUnit')::numeric <= ${filters.maxPrice}
            ELSE false
          END
        `);
      }
    }

    // MOQ filter
    if (filters.minMOQ) {
      whereConditions.push(gte(products.minOrderQuantity, filters.minMOQ));
    }
    if (filters.maxMOQ) {
      whereConditions.push(lte(products.minOrderQuantity, filters.maxMOQ));
    }

    // Boolean filters
    if (filters.hasTradeAssurance) {
      whereConditions.push(eq(products.hasTradeAssurance, true));
    }
    if (filters.sampleAvailable) {
      whereConditions.push(eq(products.sampleAvailable, true));
    }
    if (filters.customizationAvailable) {
      whereConditions.push(eq(products.customizationAvailable, true));
    }

    // Array filters
    if (filters.certifications && filters.certifications.length > 0) {
      whereConditions.push(sql`${products.certifications} && ${filters.certifications}`);
    }
    if (filters.colors && filters.colors.length > 0) {
      whereConditions.push(sql`${products.colors} && ${filters.colors}`);
    }
    if (filters.sizes && filters.sizes.length > 0) {
      whereConditions.push(sql`${products.sizes} && ${filters.sizes}`);
    }
    if (filters.tags && filters.tags.length > 0) {
      whereConditions.push(sql`${products.tags} && ${filters.tags}`);
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
      whereConditions.push(
        or(
          like(sql`LOWER(${products.name})`, searchPattern),
          like(sql`LOWER(${products.description})`, searchPattern),
          like(sql`LOWER(${products.shortDescription})`, searchPattern),
          sql`${products.tags}::text ILIKE ${searchPattern}`,
          sql`${products.keyFeatures}::text ILIKE ${searchPattern}`
        )
      );
    }

    // Build supplier filters
    const supplierWhereConditions = [];
    if (filters.supplierCountry) {
      supplierWhereConditions.push(eq(supplierProfiles.country, filters.supplierCountry));
    }
    if (filters.supplierVerificationLevel) {
      supplierWhereConditions.push(eq(supplierProfiles.verificationLevel, filters.supplierVerificationLevel));
    }

    // Build sort order
    let orderBy;
    switch (sort.field) {
      case 'price':
        orderBy = sort.direction === 'asc' 
          ? asc(sql`(${products.priceRanges}->0->>'pricePerUnit')::numeric`)
          : desc(sql`(${products.priceRanges}->0->>'pricePerUnit')::numeric`);
        break;
      case 'popularity':
        orderBy = sort.direction === 'asc' ? asc(products.views) : desc(products.views);
        break;
      case 'leadTime':
        orderBy = sort.direction === 'asc' ? asc(products.leadTime) : desc(products.leadTime);
        break;
      case 'views':
        orderBy = sort.direction === 'asc' ? asc(products.views) : desc(products.views);
        break;
      case 'inquiries':
        orderBy = sort.direction === 'asc' ? asc(products.inquiries) : desc(products.inquiries);
        break;
      default:
        orderBy = sort.direction === 'asc' ? asc(products.createdAt) : desc(products.createdAt);
    }

    // Get total count
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .innerJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id));

    if (whereConditions.length > 0) {
      countQuery = countQuery.where(and(...whereConditions));
    }
    if (supplierWhereConditions.length > 0) {
      countQuery = countQuery.where(and(...supplierWhereConditions));
    }

    const [{ count }] = await countQuery;

    // Get products with related data
    let productsQuery = db
      .select({
        product: products,
        supplier: supplierProfiles,
        category: categories,
      })
      .from(products)
      .innerJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
      .leftJoin(categories, eq(products.categoryId, categories.id));

    if (whereConditions.length > 0) {
      productsQuery = productsQuery.where(and(...whereConditions));
    }
    if (supplierWhereConditions.length > 0) {
      productsQuery = productsQuery.where(and(...supplierWhereConditions));
    }

    const productsResult = await productsQuery
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get product attributes for each product
    const productIds = productsResult.map(p => p.product.id);
    const attributes = productIds.length > 0 
      ? await db
          .select()
          .from(productAttributes)
          .where(inArray(productAttributes.productId, productIds))
      : [];

    // Group attributes by product ID
    const attributesByProduct = attributes.reduce((acc, attr) => {
      if (!acc[attr.productId]) acc[attr.productId] = [];
      acc[attr.productId].push(attr);
      return acc;
    }, {} as Record<string, ProductAttribute[]>);

    // Format results
    const formattedProducts = productsResult.map(row => ({
      ...row.product,
      supplier: row.supplier,
      category: row.category,
      attributes: attributesByProduct[row.product.id] || [],
    }));

    // Get filter options
    const filterOptions = await this.getFilterOptions(filters);

    return {
      products: formattedProducts,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      filters: filterOptions,
    };
  }

  /**
   * Get available filter options based on current filters
   */
  private async getFilterOptions(currentFilters: ProductFilters) {
    // Get available categories
    const availableCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.name));

    // Get available suppliers
    const availableSuppliers = await db
      .select({
        id: supplierProfiles.id,
        name: supplierProfiles.businessName,
        country: supplierProfiles.country,
        verificationLevel: supplierProfiles.verificationLevel,
      })
      .from(supplierProfiles)
      .where(and(
        eq(supplierProfiles.isActive, true),
        eq(supplierProfiles.isVerified, true)
      ))
      .orderBy(asc(supplierProfiles.businessName));

    // Get price range
    const priceRange = await db
      .select({
        min: sql<number>`MIN((${products.priceRanges}->0->>'pricePerUnit')::numeric)`,
        max: sql<number>`MAX((${products.priceRanges}->0->>'pricePerUnit')::numeric)`,
      })
      .from(products)
      .where(and(
        eq(products.isPublished, true),
        eq(products.isApproved, true),
        isNotNull(products.priceRanges)
      ));

    // Get MOQ range
    const moqRange = await db
      .select({
        min: sql<number>`MIN(${products.minOrderQuantity})`,
        max: sql<number>`MAX(${products.minOrderQuantity})`,
      })
      .from(products)
      .where(and(
        eq(products.isPublished, true),
        eq(products.isApproved, true)
      ));

    // Get available certifications, colors, and sizes
    const productArrays = await db
      .select({
        certifications: products.certifications,
        colors: products.colors,
        sizes: products.sizes,
      })
      .from(products)
      .where(and(
        eq(products.isPublished, true),
        eq(products.isApproved, true)
      ));

    // Extract unique values from arrays
    const certifications = new Set<string>();
    const colors = new Set<string>();
    const sizes = new Set<string>();

    productArrays.forEach(product => {
      product.certifications?.forEach(cert => certifications.add(cert));
      product.colors?.forEach(color => colors.add(color));
      product.sizes?.forEach(size => sizes.add(size));
    });

    return {
      availableCategories,
      availableSuppliers,
      priceRange: {
        min: priceRange[0]?.min || 0,
        max: priceRange[0]?.max || 0,
      },
      moqRange: {
        min: moqRange[0]?.min || 1,
        max: moqRange[0]?.max || 1000,
      },
      availableCertifications: Array.from(certifications).sort(),
      availableColors: Array.from(colors).sort(),
      availableSizes: Array.from(sizes).sort(),
    };
  }

  /**
   * Get product recommendations for a buyer
   */
  async getProductRecommendations(buyerId: string, limit: number = 10): Promise<Product[]> {
    // Get buyer's order history to understand preferences
    const buyerOrders = await db
      .select({ productId: db.schema.orders.productId })
      .from(db.schema.orders)
      .where(and(
        eq(db.schema.orders.buyerId, buyerId),
        isNotNull(db.schema.orders.productId)
      ))
      .limit(50);

    const orderedProductIds = buyerOrders.map(order => order.productId!);

    if (orderedProductIds.length === 0) {
      // Return popular products if no order history
      return await db
        .select()
        .from(products)
        .where(and(
          eq(products.isPublished, true),
          eq(products.isApproved, true),
          eq(products.inStock, true)
        ))
        .orderBy(desc(products.views))
        .limit(limit);
    }

    // Get categories from ordered products
    const orderedProducts = await db
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(inArray(products.id, orderedProductIds));

    const preferredCategories = [...new Set(orderedProducts.map(p => p.categoryId).filter(Boolean))];

    // Get recommendations from preferred categories
    const recommendations = await db
      .select()
      .from(products)
      .where(and(
        eq(products.isPublished, true),
        eq(products.isApproved, true),
        eq(products.inStock, true),
        preferredCategories.length > 0 
          ? inArray(products.categoryId, preferredCategories)
          : sql`true`,
        sql`${products.id} NOT IN (${orderedProductIds.join(', ') || 'NULL'})`
      ))
      .orderBy(desc(products.views), desc(products.inquiries))
      .limit(limit);

    return recommendations;
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(limit: number = 20): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.isPublished, true),
        eq(products.isApproved, true),
        eq(products.inStock, true)
      ))
      .orderBy(
        desc(sql`(${products.views} * 0.3 + ${products.inquiries} * 0.7)`),
        desc(products.createdAt)
      )
      .limit(limit);
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.isPublished, true),
        eq(products.isApproved, true),
        eq(products.inStock, true),
        eq(products.isFeatured, true)
      ))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  /**
   * Update product view count
   */
  async incrementProductViews(productId: string): Promise<void> {
    await db
      .update(products)
      .set({
        views: sql`${products.views} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
  }

  /**
   * Get similar products
   */
  async getSimilarProducts(productId: string, limit: number = 8): Promise<Product[]> {
    // Get the source product
    const [sourceProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!sourceProduct) return [];

    // Find similar products by category and supplier
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.isPublished, true),
        eq(products.isApproved, true),
        eq(products.inStock, true),
        sql`${products.id} != ${productId}`,
        or(
          eq(products.categoryId, sourceProduct.categoryId),
          eq(products.supplierId, sourceProduct.supplierId)
        )
      ))
      .orderBy(
        sql`CASE WHEN ${products.categoryId} = ${sourceProduct.categoryId} THEN 1 ELSE 2 END`,
        desc(products.views)
      )
      .limit(limit);
  }
}

export const productDiscoveryService = new ProductDiscoveryService();