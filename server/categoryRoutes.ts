import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { categories, insertCategorySchema } from "@shared/schema";
import { eq, isNull, like, or } from "drizzle-orm";

const router = Router();

// Get all categories
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const { search, parentId, isActive } = req.query;
    
    let query = db.select().from(categories);
    
    // Apply filters
    const conditions: any[] = [];
    
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(categories.name, `%${search}%`),
          like(categories.description, `%${search}%`)
        )
      );
    }
    
    if (parentId === 'null') {
      conditions.push(isNull(categories.parentId));
    } else if (parentId && typeof parentId === 'string') {
      conditions.push(eq(categories.parentId, parentId));
    }
    
    if (isActive === 'true') {
      conditions.push(eq(categories.isActive, true));
    } else if (isActive === 'false') {
      conditions.push(eq(categories.isActive, false));
    }
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : or(...conditions));
    }
    
    const result = await query;
    
    res.json(result);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ 
      error: "Failed to fetch categories",
      details: error.message 
    });
  }
});

// Get category by ID
router.get("/categories/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(result[0]);
  } catch (error: any) {
    console.error("Error fetching category:", error);
    res.status(500).json({ 
      error: "Failed to fetch category",
      details: error.message 
    });
  }
});

// Get category with subcategories
router.get("/categories/:id/tree", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the category
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    
    if (category.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Get subcategories
    const subcategories = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, id));
    
    res.json({
      ...category[0],
      subcategories,
    });
  } catch (error: any) {
    console.error("Error fetching category tree:", error);
    res.status(500).json({ 
      error: "Failed to fetch category tree",
      details: error.message 
    });
  }
});

// Create category
router.post("/categories", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertCategorySchema.parse(req.body);
    
    // Handle "none" as null for parentId
    if (validatedData.parentId === "none" || validatedData.parentId === "") {
      validatedData.parentId = null;
    }
    
    // Check if slug already exists
    const existingSlug = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, validatedData.slug))
      .limit(1);
    
    if (existingSlug.length > 0) {
      return res.status(400).json({ 
        error: "A category with this slug already exists" 
      });
    }
    
    // Create the category
    const result = await db
      .insert(categories)
      .values(validatedData)
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error("Error creating category:", error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: "Validation error",
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create category",
      details: error.message 
    });
  }
});

// Update category
router.put("/categories/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Validate request body
    const validatedData = insertCategorySchema.partial().parse(req.body);
    
    // Handle "none" as null for parentId
    if (validatedData.parentId === "none" || validatedData.parentId === "") {
      validatedData.parentId = null;
    }
    
    // Check if slug is being changed and if it's unique
    if (validatedData.slug && validatedData.slug !== existing[0].slug) {
      const existingSlug = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, validatedData.slug))
        .limit(1);
      
      if (existingSlug.length > 0) {
        return res.status(400).json({ 
          error: "A category with this slug already exists" 
        });
      }
    }
    
    // Prevent circular parent relationships
    if (validatedData.parentId === id) {
      return res.status(400).json({ 
        error: "A category cannot be its own parent" 
      });
    }
    
    // Update the category
    const result = await db
      .update(categories)
      .set(validatedData)
      .where(eq(categories.id, id))
      .returning();
    
    res.json(result[0]);
  } catch (error: any) {
    console.error("Error updating category:", error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: "Validation error",
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to update category",
      details: error.message 
    });
  }
});

// Delete category
router.delete("/categories/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Check if category has subcategories
    const subcategories = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, id));
    
    if (subcategories.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete category with subcategories. Delete or reassign subcategories first." 
      });
    }
    
    // TODO: Check if category has products
    // For now, we'll just delete it
    
    await db
      .delete(categories)
      .where(eq(categories.id, id));
    
    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    res.status(500).json({ 
      error: "Failed to delete category",
      details: error.message 
    });
  }
});

// Toggle category status
router.patch("/categories/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }
    
    const result = await db
      .update(categories)
      .set({ isActive })
      .where(eq(categories.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(result[0]);
  } catch (error: any) {
    console.error("Error toggling category status:", error);
    res.status(500).json({ 
      error: "Failed to toggle category status",
      details: error.message 
    });
  }
});

// Update category display order
router.patch("/categories/:id/order", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;
    
    if (typeof displayOrder !== 'number') {
      return res.status(400).json({ error: "displayOrder must be a number" });
    }
    
    const result = await db
      .update(categories)
      .set({ displayOrder })
      .where(eq(categories.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(result[0]);
  } catch (error: any) {
    console.error("Error updating category order:", error);
    res.status(500).json({ 
      error: "Failed to update category order",
      details: error.message 
    });
  }
});

export default router;

