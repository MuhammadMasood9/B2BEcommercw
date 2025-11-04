import { Router } from "express";
import { eq, and, or, gte, lte, like, ilike, inArray, sql, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { products, categories, productAttributes, users, supplierProfiles } from "@shared/schema";

const router = Router();

// Advanced product search with filtering
router.get("/products/filtered", async (req, res) => {
  try {
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

    let query = db.select().from(products);
    const conditions = [eq(products.isPublished, true)];

    // Search filter
    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
          ilike(products.shortDescription, `%${search}%`)
        )
      );
    }

    // Category filter
    if (categoryId && categoryId !== "all") {
      conditions.push(eq(products.categoryId, categoryId as string));
    }

    // Price range filter
    if (minPrice || maxPrice) {
      // This is complex because priceRanges is JSON - we'll need to use SQL
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

    // Boolean filters
    if (verifiedOnly === "true") {
      // Assuming all products from verified suppliers are verified
      conditions.push(eq(products.isApproved, true));
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
              like(products.leadTime, "%1-7%"),
              like(products.leadTime, "%1 day%"),
              like(products.leadTime, "%7 day%")
            )
          );
          break;
        case "8-15":
          conditions.push(
            or(
              like(products.leadTime, "%8-15%"),
              like(products.leadTime, "%10 day%"),
              like(products.leadTime, "%15 day%")
            )
          );
          break;
        case "16-30":
          conditions.push(
            or(
              like(products.leadTime, "%16-30%"),
              like(products.leadTime, "%30 day%"),
              like(products.leadTime, "%1 month%")
            )
          );
          break;
        case "31-60":
          conditions.push(
            or(
              like(products.leadTime, "%31-60%"),
              like(products.leadTime, "%60 day%"),
              like(products.leadTime, "%2 month%")
            )
          );
          break;
        case "60+":
          conditions.push(
            or(
              like(products.leadTime, "%60+%"),
              like(products.leadTime, "%3 month%"),
              like(products.leadTime, "%90 day%")
            )
          );
          break;
      }
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sorting
    switch (sort) {
      case "price-low":
        query = query.orderBy(
          sql`(
            SELECT MIN((price_range->>'pricePerUnit')::numeric)
            FROM jsonb_array_elements(${products.priceRanges}) AS price_range
          ) ASC NULLS LAST`
        );
        break;
      case "price-high":
        query = query.orderBy(
          sql`(
            SELECT MAX((price_range->>'pricePerUnit')::numeric)
            FROM jsonb_array_elements(${products.priceRanges}) AS price_range
          ) DESC NULLS LAST`
        );
        break;
      case "newest":
        query = query.orderBy(desc(products.createdAt));
        break;
      case "moq-low":
        query = query.orderBy(asc(products.minOrderQuantity));
        break;
      case "moq-high":
        query = query.orderBy(desc(products.minOrderQuantity));
        break;
      case "popularity":
        query = query.orderBy(desc(products.views));
        break;
      case "rating":
        // For now, we'll order by views as a proxy for rating
        query = query.orderBy(desc(products.views));
        break;
      case "lead-time":
        // Simple lead time sorting - this could be improved
        query = query.orderBy(asc(products.leadTime));
        break;
      default: // relevance
        if (search) {
          // Order by relevance when searching
          query = query.orderBy(
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
          query = query.orderBy(desc(products.views));
        }
    }

    // Pagination
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;
    
    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    res.json(result);
  } catch (error) {
    console.error("Error in filtered products search:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Search suggestions endpoint
router.get("/products/search-suggestions", async (req, res) => {
  try {
    const { q, limit = "8" } = req.query;
    
    if (!q || typeof q !== "string" || q.length < 2) {
      return res.json([]);
    }

    const limitNum = Math.min(parseInt(limit as string) || 8, 20);

    // Get product name suggestions
    const productSuggestions = await db
      .select({
        id: products.id,
        text: products.name,
        type: sql`'product'`.as("type"),
        category: products.categoryId,
        image: sql`(${products.images})[1]`.as("image")
      })
      .from(products)
      .where(
        and(
          eq(products.isPublished, true),
          ilike(products.name, `%${q}%`)
        )
      )
      .limit(limitNum / 2)
      .orderBy(desc(products.views));

    // Get category suggestions
    const categorySuggestions = await db
      .select({
        id: categories.id,
        text: categories.name,
        type: sql`'category'`.as("type"),
        count: sql`(
          SELECT COUNT(*) FROM ${products} 
          WHERE ${products.categoryId} = ${categories.id} 
          AND ${products.isPublished} = true
        )`.as("count")
      })
      .from(categories)
      .where(
        and(
          eq(categories.isActive, true),
          ilike(categories.name, `%${q}%`)
        )
      )
      .limit(limitNum / 2);

    // Combine and format suggestions
    const suggestions = [
      ...productSuggestions.map(s => ({
        id: s.id,
        text: s.text,
        type: s.type as string,
        category: s.category,
        image: s.image
      })),
      ...categorySuggestions.map(s => ({
        id: s.id,
        text: s.text,
        type: s.type as string,
        count: s.count
      }))
    ];

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Trending searches endpoint
router.get("/search/trending", async (req, res) => {
  try {
    // For now, return static trending searches
    // In a real app, this would be based on actual search analytics
    const trendingSearches = [
      "LED lights",
      "Bluetooth speakers",
      "Phone cases",
      "Wireless chargers",
      "Smart watches",
      "USB cables",
      "Power banks",
      "Headphones"
    ];

    res.json(trendingSearches);
  } catch (error) {
    console.error("Error fetching trending searches:", error);
    res.status(500).json({ error: "Failed to fetch trending searches" });
  }
});

// Saved searches endpoints
router.get("/saved-searches", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // For now, return empty array - in real app this would fetch from database
    res.json([]);
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    res.status(500).json({ error: "Failed to fetch saved searches" });
  }
});

router.post("/saved-searches", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { name, filters } = req.body;

    if (!name || !filters) {
      return res.status(400).json({ error: "Name and filters are required" });
    }

    // For now, just return success - in real app this would save to database
    res.json({ 
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving search:", error);
    res.status(500).json({ error: "Failed to save search" });
  }
});

router.put("/saved-searches/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { name, filters } = req.body;

    // For now, just return success - in real app this would update in database
    res.json({ 
      id,
      name,
      filters,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating saved search:", error);
    res.status(500).json({ error: "Failed to update search" });
  }
});

router.delete("/saved-searches/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // For now, just return success - in real app this would delete from database
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    res.status(500).json({ error: "Failed to delete search" });
  }
});

router.post("/saved-searches/:id/use", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // For now, just return success - in real app this would track usage
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking search usage:", error);
    res.status(500).json({ error: "Failed to track usage" });
  }
});

// Get single product with supplier information
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch product with supplier information
    const result = await db
      .select({
        product: products,
        supplier: supplierProfiles
      })
      .from(products)
      .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.userId))
      .where(and(
        eq(products.id, id),
        eq(products.isPublished, true)
      ))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { product, supplier } = result[0];

    // Increment view count
    await db
      .update(products)
      .set({ views: sql`${products.views} + 1` })
      .where(eq(products.id, id));

    res.json({
      ...product,
      supplier: supplier
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Get products by supplier
router.get("/products/by-supplier/:supplierId", async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { limit = "4", offset = "0", exclude } = req.query;

    let query = db
      .select()
      .from(products)
      .where(and(
        eq(products.supplierId, supplierId),
        eq(products.isPublished, true),
        exclude ? sql`${products.id} != ${exclude}` : undefined
      ))
      .orderBy(desc(products.views))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const result = await query;
    res.json(result);
  } catch (error) {
    console.error("Error fetching supplier products:", error);
    res.status(500).json({ error: "Failed to fetch supplier products" });
  }
});

export default router;