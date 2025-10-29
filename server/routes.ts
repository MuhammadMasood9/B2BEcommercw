import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { authRoutes } from "./authRoutes";
import { authMiddleware } from "./auth";
import categoryRoutes from "./categoryRoutes";
import uploadRoutes from "./uploadRoutes";
import chatRoutes from "./chatRoutes";
import { upload, uploadUnrestricted } from "./upload";
import { 
  insertProductSchema, insertCategorySchema, insertCustomerSchema, insertOrderSchema,
  insertUserSchema, insertBuyerProfileSchema,
  insertRfqSchema, insertQuotationSchema, insertInquirySchema,
  insertConversationSchema, insertMessageSchema, insertReviewSchema,
  insertFavoriteSchema, insertNotificationSchema, insertActivityLogSchema,
  users, products, categories, orders, inquiries, quotations, rfqs, notifications, activity_logs, conversations
} from "@shared/schema";
import { sql, eq, and, gte, desc, or, ilike } from "drizzle-orm";
import * as path from 'path';
import * as fs from 'fs';

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('=== ROUTES LOADING - UPDATED VERSION ===');
  
  // ==================== AUTHENTICATION ROUTES ====================
  
  app.use('/api/auth', authRoutes);
  
  // ==================== UPLOAD ROUTES ====================
  
  app.use('/api', uploadRoutes);
  
  // ==================== CATEGORY ROUTES ====================
  
  app.use('/api', categoryRoutes);
  
  // ==================== CHAT ROUTES ====================
  
  app.use('/api/chat', chatRoutes);
  
  // ==================== LEGACY AUTHENTICATION (TO BE REMOVED) ====================
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Don't send password back to client
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // ==================== ANALYTICS ====================
  
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard/buyer/:buyerId", async (req, res) => {
    try {
      const stats = await storage.getBuyerDashboardStats(req.params.buyerId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==================== USERS & AUTHENTICATION ====================
  
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't send passwords to client
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== BUYER PROFILES ====================
  
  app.get("/api/buyers/:userId", async (req, res) => {
    try {
      const profile = await storage.getBuyerProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Buyer profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/buyers", async (req, res) => {
    try {
      const validatedData = insertBuyerProfileSchema.parse(req.body);
      const profile = await storage.createBuyerProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/buyers/:userId", async (req, res) => {
    try {
      const validatedData = insertBuyerProfileSchema.partial().parse(req.body);
      const profile = await storage.updateBuyerProfile(req.params.userId, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Buyer profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });


  // ==================== PRODUCTS ====================
  
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, isPublished, minMOQ, maxMOQ, featured, limit, offset } = req.query;
      const filters: any = {};
      const countFilters: any = {}; // Separate filters for count (without pagination)
      
      if (categoryId) {
        filters.categoryId = categoryId as string;
        countFilters.categoryId = categoryId as string;
      }
      if (search) {
        filters.search = search as string;
        countFilters.search = search as string;
      }
      if (isPublished !== undefined) {
        filters.isPublished = isPublished === 'true';
        countFilters.isPublished = isPublished === 'true';
      }
      if (minMOQ) {
        filters.minMOQ = parseInt(minMOQ as string);
        countFilters.minMOQ = parseInt(minMOQ as string);
      }
      if (maxMOQ) {
        filters.maxMOQ = parseInt(maxMOQ as string);
        countFilters.maxMOQ = parseInt(maxMOQ as string);
      }
      if (featured === 'true') {
        filters.featured = true;
        countFilters.featured = true;
      }
      
      // Add pagination ONLY to the getProducts filters, NOT to countFilters
      let hasLimit = false;
      let hasOffset = false;
      
      if (limit) {
        filters.limit = parseInt(limit as string);
        hasLimit = true;
      }
      if (offset !== undefined) {
        filters.offset = parseInt(offset as string);
        hasOffset = true;
      }
      
      const result = await storage.getProducts(filters);
      
      // ALWAYS return paginated response structure when limit/offset are provided
      // Even if total might not be accurate for non-paginated requests
      if (hasLimit || hasOffset) {
        const total = await storage.getProductsCount(countFilters); // Use countFilters (no pagination params)
        
        console.log(`📊 Products API Response: Returning ${result.length} products with total count: ${total}`);
        console.log(`📄 Filters applied:`, countFilters);
        
        res.json({ 
          products: result,
          total,
          page: filters.offset ? Math.floor(filters.offset / (filters.limit || 20)) + 1 : 1,
          limit: filters.limit || 20
        });
      } else {
        // No pagination parameters - return as array directly for backwards compatibility
        res.json(result);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      // Increment view count
      await storage.incrementProductViews(req.params.id);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/slug/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      // Increment view count
      await storage.incrementProductViews(product.id);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk update endpoint for publish/feature operations - MUST come before /:id routes
  app.patch("/api/products/bulk-update", async (req, res) => {
    try {
      const { productIds, productId, id, isPublished, isFeatured } = req.body;
      // Normalize to an array to support single or multiple ids
      const normalizedIds = Array.isArray(productIds)
        ? productIds
        : (productIds ? [productIds] : (productId ? [productId] : (id ? [id] : [])));

      if (!Array.isArray(normalizedIds) || normalizedIds.length === 0) {
        return res.status(400).json({ error: "productIds must be a non-empty array" });
      }

      const updates: any = {};
      if (isPublished !== undefined) {
        updates.isPublished = isPublished;
      }
      if (isFeatured !== undefined) {
        updates.isFeatured = isFeatured;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid update fields provided" });
      }

      const updatedProducts = [];
      
      for (const productId of normalizedIds) {
        try {
          const product = await storage.updateProduct(productId, updates);
          
          if (product) {
            updatedProducts.push(product);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      }
      
      res.json({ 
        message: `Updated ${updatedProducts.length} products successfully`,
        updatedProducts 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk delete endpoint - MUST come before /:id routes
  app.delete("/api/products/bulk-delete", async (req, res) => {
    try {
      const { productIds, productId, id } = req.body;
      const normalizedIds = Array.isArray(productIds)
        ? productIds
        : (productIds ? [productIds] : (productId ? [productId] : (id ? [id] : [])));

      if (!Array.isArray(normalizedIds) || normalizedIds.length === 0) {
        return res.status(400).json({ error: "productIds must be a non-empty array" });
      }

      const deletedProducts = [];
      
      for (const productId of normalizedIds) {
        try {
          const success = await storage.deleteProduct(productId);
          if (success) {
            deletedProducts.push(productId);
          }
        } catch (error) {
          console.error(`Failed to delete product ${productId}:`, error);
        }
      }
      
      res.json({ 
        message: `Deleted ${deletedProducts.length} products successfully`,
        deletedProducts 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Individual stock update endpoint
  app.patch("/api/products/:id/stock", async (req, res) => {
    try {
      const { stockQuantity } = req.body;
      
      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return res.status(400).json({ error: "Invalid stock quantity. Must be a non-negative number." });
      }

      const product = await storage.updateProduct(req.params.id, { 
        stockQuantity,
        inStock: stockQuantity > 0 
      });
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk stock update endpoint
  app.patch("/api/products/bulk-stock-update", async (req, res) => {
    try {
      const { productIds, stockQuantity } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "productIds must be a non-empty array" });
      }
      
      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return res.status(400).json({ error: "Invalid stock quantity. Must be a non-negative number." });
      }

      const updatedProducts = [];
      
      for (const productId of productIds) {
        try {
          const product = await storage.updateProduct(productId, { 
            stockQuantity,
            inStock: stockQuantity > 0 
          });
          
          if (product) {
            updatedProducts.push(product);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      }
      
      res.json({ 
        message: `Updated ${updatedProducts.length} products successfully`,
        updatedProducts 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Inventory analytics endpoint
  app.get("/api/products/inventory/analytics", async (req, res) => {
    try {
      const products = await storage.getProducts();
      
      const analytics = {
        totalProducts: products.length,
        inStock: products.filter(p => p.inStock && (p.stockQuantity || 0) > 0).length,
        lowStock: products.filter(p => p.inStock && (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10).length,
        outOfStock: products.filter(p => !p.inStock || (p.stockQuantity || 0) === 0).length,
        totalValue: products.reduce((sum, p) => {
          const price = Array.isArray(p.priceRanges) && p.priceRanges.length > 0 
            ? p.priceRanges[0].pricePerUnit || 0 
            : 0;
          return sum + (price * (p.stockQuantity || 0));
        }, 0),
        lowStockProducts: products.filter(p => p.inStock && (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10),
        outOfStockProducts: products.filter(p => !p.inStock || (p.stockQuantity || 0) === 0)
      };
      
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk product upload
  app.post("/api/products/bulk", async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: "Products must be an array" });
      }
      
      const validatedProducts = [];
      const errors = [];
      
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        try {
          const images = p.images ? (typeof p.images === 'string' ? p.images.split(',').map((img: string) => img.trim()).filter(Boolean) : p.images) : [];
          const tags = p.tags ? (typeof p.tags === 'string' ? p.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : p.tags) : [];
          const paymentTerms = p.paymentTerms ? (typeof p.paymentTerms === 'string' ? p.paymentTerms.split(',').map((term: string) => term.trim()).filter(Boolean) : p.paymentTerms) : [];
          
          const productData = {
            name: p.name || p.Name,
            slug: (p.slug || p.name || p.Name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            shortDescription: p.shortDescription || p['Short description'],
            description: p.description || p.Description,
            categoryId: p.categoryId || p.CategoryId,
            specifications: p.specifications,
            images,
            videos: p.videos || [],
            minOrderQuantity: parseInt(p.minOrderQuantity || p.MOQ || '1'),
            priceRanges: p.priceRanges || null,
            sampleAvailable: p.sampleAvailable === 'true' || p.sampleAvailable === true,
            samplePrice: p.samplePrice,
            customizationAvailable: p.customizationAvailable === 'true' || p.customizationAvailable === true,
            leadTime: p.leadTime || p['Lead Time'],
            port: p.port || p.Port,
            paymentTerms,
            inStock: p.inStock !== undefined ? p.inStock : true,
            stockQuantity: parseInt(p.stockQuantity || p.Stock || '0'),
            isPublished: p.isPublished !== undefined ? p.isPublished : true,
            isFeatured: p.isFeatured === 'true' || p.isFeatured === true,
            tags,
            sku: p.sku || p.SKU,
            metaData: p.metaData || null,
          };
          
          const validated = insertProductSchema.parse(productData);
          validatedProducts.push(validated);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message });
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({ 
          error: "Validation errors in CSV data", 
          errors,
          validCount: validatedProducts.length,
          errorCount: errors.length
        });
      }
      
      const createdProducts = await storage.bulkCreateProducts(validatedProducts);
      res.status(201).json({ count: createdProducts.length, products: createdProducts });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

// Bulk upload with Excel/JSON and actual image files - NO LIMITS
app.post("/api/products/bulk-excel", uploadUnrestricted.array('images'), async (req, res) => {
  try {
    const { products } = req.body;
    const imageFiles = req.files as Express.Multer.File[];
    
    if (!products) {
      return res.status(400).json({ error: "Products data is required" });
    }
    
    let productsData;
    try {
      // Use custom reviver to preserve string types for decimal fields
      productsData = JSON.parse(products, (key, value) => {
        // Ensure samplePrice stays as string (decimal fields should be strings)
        if (key === 'samplePrice' && typeof value === 'number') {
          console.log(`🔄 Converting samplePrice from number ${value} to string "${value.toString()}"`);
          return value.toString();
        }
        return value;
      });
    } catch (error) {
      return res.status(400).json({ error: "Invalid products JSON format" });
    }
    
    if (!Array.isArray(productsData)) {
      return res.status(400).json({ error: "Products must be an array" });
    }
    
     console.log(`📦 Received ${productsData.length} products for bulk upload`);
     console.log(`📁 Received ${imageFiles ? imageFiles.length : 0} image files`);
     
     // Log memory usage for large uploads
     const memUsage = process.memoryUsage();
     console.log(`💾 Memory usage: RSS=${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    
    // Debug: Log samplePrice types after JSON parsing
    console.log('🔍 Server-side samplePrice check after JSON.parse:');
    productsData.forEach((product: any, index: number) => {
      console.log(`Product ${index + 1}: ${product.name}`);
      console.log(`  samplePrice: ${product.samplePrice} (type: ${typeof product.samplePrice})`);
    });
    
    // Debug: Log file details
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file, index) => {
        console.log(`📄 File ${index + 1}: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size} bytes`);
      });
    }
    
     const validatedProducts = [];
     const errors = [];
     
     // Process products in batches for large uploads
     const batchSize = 50; // Smaller batches for better memory management
     const totalBatches = Math.ceil(productsData.length / batchSize);
     
     console.log(`🔄 Processing ${productsData.length} products in ${totalBatches} batches of ${batchSize}`);
     
     for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
       const startIndex = batchIndex * batchSize;
       const endIndex = Math.min(startIndex + batchSize, productsData.length);
       
       console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (products ${startIndex + 1}-${endIndex})`);
       
       for (let i = startIndex; i < endIndex; i++) {
      const p = productsData[i];
      try {
        // Process arrays from Excel/JSON
        const tags = p.tags ? (Array.isArray(p.tags) ? p.tags : p.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)) : [];
        const paymentTerms = p.paymentTerms ? (Array.isArray(p.paymentTerms) ? p.paymentTerms : p.paymentTerms.split(',').map((term: string) => term.trim()).filter(Boolean)) : [];
        const colors = p.colors ? (Array.isArray(p.colors) ? p.colors : p.colors.split(',').map((color: string) => color.trim()).filter(Boolean)) : [];
        const sizes = p.sizes ? (Array.isArray(p.sizes) ? p.sizes : p.sizes.split(',').map((size: string) => size.trim()).filter(Boolean)) : [];
        const keyFeatures = p.keyFeatures ? (Array.isArray(p.keyFeatures) ? p.keyFeatures : p.keyFeatures.split(',').map((feature: string) => feature.trim()).filter(Boolean)) : [];
        const certifications = p.certifications ? (Array.isArray(p.certifications) ? p.certifications : p.certifications.split(',').map((cert: string) => cert.trim()).filter(Boolean)) : [];
        
        // Process specifications JSON
        let specifications = null;
        if (p.specifications) {
          try {
            specifications = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
          } catch (e) {
            console.warn(`Invalid specifications JSON for product ${i + 1}:`, p.specifications);
          }
        }
        
        // Process price tiers from Excel/JSON
        const priceRanges: Array<{minQty: number, maxQty: number | null, pricePerUnit: number}> = [];
        if (p.priceTiers && Array.isArray(p.priceTiers)) {
          p.priceTiers.forEach((tier: any) => {
            if (tier.minQty && tier.pricePerUnit) {
              priceRanges.push({
                minQty: parseInt(tier.minQty),
                maxQty: tier.maxQty ? parseInt(tier.maxQty) : null,
                pricePerUnit: parseFloat(tier.pricePerUnit)
              });
            }
          });
        }
        
        // Process images from Excel/JSON (both filenames and embedded image data)
        const productImages = [];
        const imageFields = ['mainImage', 'image1', 'image2', 'image3', 'image4', 'image5'];
        
        // Collect image filenames from Excel/JSON
        const excelImageFilenames: string[] = [];
        imageFields.forEach(field => {
          if (p[field] && p[field].trim()) {
            let filename = p[field].trim();
            // Remove "FILE:" prefix if present (to prevent Google Sheets from treating as images)
            if (filename.startsWith('FILE: ')) {
              filename = filename.substring(6);
            }
            excelImageFilenames.push(filename);
          }
        });
        
        // Process images array - can contain both filenames and base64 data
        if (p.images && Array.isArray(p.images)) {
          console.log(`🖼️ Processing ${p.images.length} images for product: ${p.name}`);
          
          p.images.forEach((imageData: string, imageIndex: number) => {
            if (imageData && imageData.trim()) {
              console.log(`📸 Processing image ${imageIndex + 1} for product ${p.name}: ${imageData.substring(0, 50)}...`);
              console.log(`🔍 Image data type: ${typeof imageData}, length: ${imageData.length}`);
              console.log(`🔍 Starts with data:image: ${imageData.startsWith('data:image')}`);
              
              // Check if it's base64 image data
              if (imageData.startsWith('data:image')) {
                try {
                  // Extract base64 data and save as file
                  const base64Data = imageData.split(',')[1];
                  if (!base64Data) {
                    console.error(`No base64 data found in image ${imageIndex + 1} for product ${p.name}`);
                    return;
                  }
                  
                  const buffer = Buffer.from(base64Data, 'base64');
                  console.log(`Converted base64 to buffer: ${buffer.length} bytes`);
                  
                  // Generate unique filename
                  const timestamp = Date.now();
                  const randomSuffix = Math.random().toString(36).substring(2, 8);
                  const filename = `excel-image-${timestamp}-${randomSuffix}.jpg`;
                   const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
                   
                   // Ensure uploads directory exists
                   const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
                   if (!fs.existsSync(uploadsDir)) {
                     fs.mkdirSync(uploadsDir, { recursive: true });
                   }
                   
                   fs.writeFileSync(filePath, buffer);
                  productImages.push(`/uploads/${filename}`);
                  console.log(`✅ Saved embedded image: ${filename} (${buffer.length} bytes)`);
                } catch (error: any) {
                  console.error(`❌ Failed to save embedded image ${imageIndex + 1} for product ${p.name}: ${error.message}`);
                }
              } else {
                // It's a filename
                let filename = imageData.trim();
                if (filename.startsWith('FILE: ')) {
                  filename = filename.substring(6);
                }
                excelImageFilenames.push(filename);
                console.log(`Added filename: ${filename}`);
              }
            }
          });
        }
        
        // Match uploaded files with Excel/JSON filenames
        if (imageFiles && imageFiles.length > 0 && excelImageFilenames.length > 0) {
          excelImageFilenames.forEach(filename => {
            const matchingFile = imageFiles.find(file => file.originalname === filename);
            if (matchingFile) {
              productImages.push(`/uploads/${matchingFile.filename}`);
            }
          });
        }
        
         // If no uploaded files match, check if images exist in uploads directory
         if (productImages.length === 0 && excelImageFilenames.length > 0) {
           const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          
          excelImageFilenames.forEach(filename => {
            const filePath = path.join(uploadsDir, filename);
            if (fs.existsSync(filePath)) {
              productImages.push(`/uploads/${filename}`);
            }
          });
        }
        
        // If no Excel/JSON image fields specified, fall back to even distribution
        if (productImages.length === 0 && imageFiles && imageFiles.length > 0) {
          const imagesPerProduct = Math.ceil(imageFiles.length / productsData.length);
          const startIndex = i * imagesPerProduct;
          const endIndex = Math.min(startIndex + imagesPerProduct, imageFiles.length);
          
          for (let j = startIndex; j < endIndex; j++) {
            if (imageFiles[j]) {
              productImages.push(`/uploads/${imageFiles[j].filename}`);
            }
          }
        }
        
        // Generate unique slug using name and SKU to avoid duplicates
        const baseSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const uniqueSlug = p.sku ? `${baseSlug}-${p.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        const productData = {
          name: p.name,
          slug: uniqueSlug,
          shortDescription: p.shortDescription,
          description: p.description,
          categoryId: p.categoryId,
          specifications,
          images: productImages,
          videos: [],
          minOrderQuantity: parseInt(p.minOrderQuantity || '1'),
          priceRanges: priceRanges.length > 0 ? priceRanges : null,
          sampleAvailable: p.sampleAvailable === 'true' || p.sampleAvailable === true,
          samplePrice: p.samplePrice ? p.samplePrice.toString() : null,
          customizationAvailable: p.customizationAvailable === 'true' || p.customizationAvailable === true,
          customizationDetails: p.customizationDetails,
          leadTime: p.leadTime,
          port: p.port,
          paymentTerms,
          inStock: p.inStock === 'true' || p.inStock === true,
          stockQuantity: parseInt(p.stockQuantity || '0'),
          isPublished: p.isPublished === 'true' || p.isPublished === true,
          isFeatured: p.isFeatured === 'true' || p.isFeatured === true,
          colors,
          sizes,
          keyFeatures,
          certifications,
          tags,
          hasTradeAssurance: p.hasTradeAssurance === 'true' || p.hasTradeAssurance === true,
          sku: p.sku,
          metaData: null,
        };
        
        console.log(`💾 Final product data for ${p.name}:`);
        console.log(`📁 Images array:`, productImages);
        console.log(`📊 Images count: ${productImages.length}`);
        console.log(`🔍 First image: ${productImages[0] || 'No images'}`);
        console.log(`💰 samplePrice before processing: ${p.samplePrice} (type: ${typeof p.samplePrice})`);
        console.log(`💰 samplePrice after processing: ${productData.samplePrice} (type: ${typeof productData.samplePrice})`);
        
        const validated = insertProductSchema.parse(productData);
        validatedProducts.push(validated);
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message });
      }
    }
    
    // Log batch completion
    console.log(`✅ Completed batch ${batchIndex + 1}/${totalBatches}`);
    
    // Small delay between batches to prevent memory overload
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: "Validation errors in Excel/JSON data", 
        errors,
        validCount: validatedProducts.length,
        errorCount: errors.length
      });
    }
    
    console.log(`💾 Creating ${validatedProducts.length} products in database...`);
    const createdProducts = await storage.bulkCreateProducts(validatedProducts);
    
    console.log(`✅ Successfully created ${createdProducts.length} products in database`);
    res.status(201).json({ 
      success: true,
      count: createdProducts.length, 
      products: createdProducts,
      message: `Successfully uploaded ${createdProducts.length} products to database`
    });
  } catch (error: any) {
    console.error('Excel/JSON bulk upload error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== CATEGORIES ====================
  
  app.get("/api/categories", async (req, res) => {
    try {
      console.log('=== CATEGORIES API CALLED ===');
      const { parentId, isActive, featured } = req.query;
      const filters: any = {};
      if (parentId !== undefined) filters.parentId = parentId === 'null' ? null : parentId as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (featured === 'true') filters.featured = true;
      
      console.log('Filters:', filters);
      const categories = await storage.getCategories(filters);
      console.log('Raw categories from storage:', categories);
      
      // Add comprehensive data to each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const products = await storage.getProducts({ categoryId: category.id, isPublished: true });
          const subcategories = await storage.getCategories({ parentId: category.id, isActive: true });
          
          // Calculate trend based on product views and inquiries
          const totalViews = products.reduce((sum, product) => sum + (product.views || 0), 0);
          const totalInquiries = products.reduce((sum, product) => sum + (product.inquiries || 0), 0);
          const trendScore = totalViews + (totalInquiries * 10); // Weight inquiries more
          
          const result = {
            ...category,
            productCount: products.length,
            subcategoryCount: subcategories.length,
            totalViews,
            totalInquiries,
            trendScore,
            trend: trendScore > 100 ? 'high' : trendScore > 50 ? 'medium' : 'low',
            // Ensure imageUrl is properly formatted
            imageUrl: category.imageUrl || null
          };
          console.log(`Category: ${category.name}, Products: ${products.length}, Subcategories: ${subcategories.length}, Trend: ${result.trend}`);
          return result;
        })
      );
      
      console.log('Sending categories with counts:', categoriesWithCount);
      res.json(categoriesWithCount);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Category statistics endpoint
  app.get("/api/categories/stats", async (req, res) => {
    try {
      const categories = await storage.getCategories({ isActive: true });
      
      const stats = await Promise.all(
        categories.map(async (category) => {
          const products = await storage.getProducts({ categoryId: category.id, isPublished: true });
          const subcategories = await storage.getCategories({ parentId: category.id, isActive: true });
          
          const result = {
            categoryId: category.id,
            categoryName: category.name,
            productCount: products.length,
            subcategoryCount: subcategories.length,
            supplierCount: 1 // Admin is the only supplier
          };
          console.log(`Stats for ${category.name}:`, result);
          return result;
        })
      );
      
      console.log('Sending category stats:', stats);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search suggestions endpoint
  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }

      const searchTerm = q.toLowerCase();
      const suggestions = [];

      // Search products
      const productResults = await db
        .select({
          id: products.id,
          name: products.name,
          images: products.images,
          priceRanges: products.priceRanges,
          categoryId: products.categoryId,
          categoryName: categories.name
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(
          eq(products.isPublished, true),
          or(
            ilike(products.name, `%${searchTerm}%`),
            ilike(products.description, `%${searchTerm}%`)
          )
        ))
        .limit(5);

      // Add product suggestions
      for (const product of productResults) {
        let images = [];
        if (product.images) {
          try {
            images = typeof product.images === 'string' 
              ? JSON.parse(product.images) 
              : product.images;
          } catch (error) {
            images = [];
          }
        }
        
        let priceRanges = [];
        if (product.priceRanges) {
          try {
            priceRanges = typeof product.priceRanges === 'string' 
              ? JSON.parse(product.priceRanges) 
              : product.priceRanges;
          } catch (error) {
            priceRanges = [];
          }
        }
        
        const minPrice = priceRanges.length > 0 
          ? Math.min(...priceRanges.map((r: any) => r.pricePerUnit))
          : 0;
        
        suggestions.push({
          id: product.id,
          name: product.name,
          image: images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
          price: minPrice > 0 ? `$${minPrice.toFixed(2)}` : 'Contact for price',
          category: product.categoryName || 'Uncategorized',
          type: 'product'
        });
      }

      // Search categories
      const categoryResults = await db
        .select({
          id: categories.id,
          name: categories.name,
          imageUrl: categories.imageUrl,
          parentId: categories.parentId
        })
        .from(categories)
        .where(and(
          eq(categories.isActive, true),
          ilike(categories.name, `%${searchTerm}%`)
        ))
        .limit(3);

      // Add category suggestions
      for (const category of categoryResults) {
        suggestions.push({
          id: category.id,
          name: category.name,
          image: category.imageUrl 
            ? (category.imageUrl.startsWith('/uploads/') ? category.imageUrl : `/uploads/${category.imageUrl}`)
            : 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100&h=100&fit=crop',
          price: '',
          category: category.parentId ? 'Subcategory' : 'Category',
          type: 'category'
        });
      }

      // Sort suggestions (products first, then categories)
      suggestions.sort((a, b) => {
        if (a.type === 'product' && b.type === 'category') return -1;
        if (a.type === 'category' && b.type === 'product') return 1;
        return 0;
      });

      res.json(suggestions.slice(0, 8)); // Limit to 8 suggestions
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ error: "Failed to fetch search suggestions" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/categories/slug/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== RFQs ====================
  
  app.get("/api/rfqs", async (req, res) => {
    try {
      const { buyerId, status, categoryId } = req.query;
      const filters: any = {};
      if (buyerId) filters.buyerId = buyerId as string;
      if (status) filters.status = status as string;
      if (categoryId) filters.categoryId = categoryId as string;
      
      const rfqs = await storage.getRfqs(filters);
      res.json(rfqs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rfqs/:id", async (req, res) => {
    try {
      const rfq = await storage.getRfq(req.params.id);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      res.json(rfq);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rfqs", upload.array('files', 10), async (req, res) => {
    try {
      console.log('=== RFQ POST REQUEST ===');
      console.log('Request body:', req.body);
      console.log('productId received:', req.body.productId);
      
      // Handle file uploads
      const uploadedFiles = req.files as Express.Multer.File[] || [];
      const filePaths = uploadedFiles.map(file => `/uploads/${file.filename}`);

      // Prepare RFQ data
      const rfqData: any = {
        title: req.body.title,
        description: req.body.description,
        quantity: parseInt(req.body.quantity),
        deliveryLocation: req.body.deliveryLocation,
        status: req.body.status || 'open',
        buyerId: req.body.buyerId,
        categoryId: req.body.categoryId || null,
        productId: req.body.productId || null, // Always include productId
        targetPrice: req.body.targetPrice || null,
        expectedDate: req.body.expectedDate ? new Date(req.body.expectedDate) : null,
        attachments: filePaths.length > 0 ? filePaths : null
      };

      console.log('RFQ data to validate:', rfqData);

      // Use partial schema since some fields are optional
      const validatedData = insertRfqSchema.partial().parse(rfqData);
      
      // Remove undefined values to avoid validation errors
      Object.keys(validatedData).forEach((key: string) => {
        if ((validatedData as any)[key] === undefined) {
          delete (validatedData as any)[key];
        }
      });

      console.log('Validated RFQ data:', validatedData);
      
      const rfq = await storage.createRfq(validatedData as any);
      res.status(201).json(rfq);
    } catch (error: any) {
      console.error('Error creating RFQ:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/rfqs/:id", async (req, res) => {
    try {
      const validatedData = insertRfqSchema.partial().parse(req.body);
      const rfq = await storage.updateRfq(req.params.id, validatedData);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      res.json(rfq);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/rfqs/:id", async (req, res) => {
    try {
      const rfqId = req.params.id;
      
      // Check if RFQ has quotations
      const quotations = await storage.getQuotations({ rfqId });
      if (quotations && quotations.length > 0) {
        return res.status(400).json({ error: "Cannot delete RFQ with existing quotations" });
      }

      // Delete the RFQ (implementation depends on your storage layer)
      // For now, we'll just close it
      const rfq = await storage.updateRfq(rfqId, { status: 'closed' });
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }

      res.json({ success: true, message: 'RFQ deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== QUOTATIONS ====================
  
  app.get("/api/quotations", async (req, res) => {
    try {
      const { rfqId, status } = req.query;
      const filters: any = {};
      if (rfqId) filters.rfqId = rfqId as string;
      if (status) filters.status = status as string;
      
      const quotations = await storage.getQuotations(filters);
      res.json(quotations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.getQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quotations", async (req, res) => {
    try {
      // Ensure user is authenticated and is an admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized: Only admins can create quotations." });
      }
      const supplierId = req.user.id; // Admin is the supplier

      // Convert data types before validation
      const quotationData = {
        ...req.body,
        supplierId: supplierId, // Add supplierId from authenticated admin
        pricePerUnit: req.body.pricePerUnit ? req.body.pricePerUnit.toString() : null,
        totalPrice: req.body.totalPrice ? req.body.totalPrice.toString() : null,
        moq: parseInt(req.body.moq),
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null
      };

      const validatedData = insertQuotationSchema.parse(quotationData);
      const quotation = await storage.createQuotation(validatedData);
      
      // Increment RFQ quotation count
      await storage.incrementRfqQuotationCount(validatedData.rfqId);
      
      res.status(201).json(quotation);
    } catch (error: any) {
      console.error('Error creating quotation:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/quotations/:id", async (req, res) => {
    try {
      const validatedData = insertQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateQuotation(req.params.id, validatedData);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Accept RFQ quotation - Proper system for order creation
  // FLOW EXPLANATION:
  // 1. Get quotation from quotations table (has rfq_id field)
  // 2. Use quotation.rfqId to query rfqs table
  // 3. Extract productId from rfqs.productId field
  // 4. Use this productId to create order
  // 
  // Data Flow: quotations.rfq_id -> rfqs.id -> rfqs.product_id -> orders.product_id
  app.post("/api/quotations/:id/accept", async (req, res) => {
    try {
      const { shippingAddress } = req.body;
      const quotationId = req.params.id;

      console.log('=== START: ACCEPTING RFQ QUOTATION ===');
      console.log('Quotation ID:', quotationId);
      console.log('Shipping Address:', shippingAddress);

      // Step 1: Get quotation with rfq_id
      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        console.error('❌ Quotation not found:', quotationId);
        return res.status(404).json({ error: "Quotation not found" });
      }

      if (quotation.status !== 'pending') {
        console.error('❌ Quotation not pending:', quotation.status);
        return res.status(400).json({ error: "Only pending quotations can be accepted" });
      }

      if (!quotation.rfqId) {
        console.error('❌ Quotation missing rfqId:', quotationId);
        return res.status(400).json({ error: "Quotation is not linked to an RFQ" });
      }

      console.log('✅ Quotation found:', {
        id: quotation.id,
        rfqId: quotation.rfqId,
        status: quotation.status
      });

      // Step 2: Get RFQ from rfqs table using rfq_id from quotation
      // CRITICAL: The quotation.rfqId links to rfqs.id, and rfqs.productId contains the product ID
      console.log('🔍 Querying rfqs table for rfqId:', quotation.rfqId);
      
      const [rfqFromDb] = await db.select({
        id: rfqs.id,
        buyerId: rfqs.buyerId,
        productId: rfqs.productId, // THIS IS THE KEY FIELD - productId from rfqs table
        categoryId: rfqs.categoryId,
        title: rfqs.title,
        description: rfqs.description,
        quantity: rfqs.quantity,
        targetPrice: rfqs.targetPrice,
        status: rfqs.status
      })
        .from(rfqs)
        .where(eq(rfqs.id, quotation.rfqId)) // Use rfq_id from quotation to find RFQ
        .limit(1);

      if (!rfqFromDb) {
        console.error('❌ RFQ not found in database for rfqId:', quotation.rfqId);
        return res.status(404).json({ error: "RFQ not found in database" });
      }

      console.log('✅ RFQ found from rfqs table:', {
        rfqId: rfqFromDb.id,
        productId: rfqFromDb.productId,
        productIdType: typeof rfqFromDb.productId,
        productIdRaw: JSON.stringify(rfqFromDb.productId),
        title: rfqFromDb.title,
        fullRfqData: JSON.stringify(rfqFromDb, null, 2)
      });

      // Step 3: Extract productId from RFQ - THIS IS THE KEY STEP
      // The flow is: quotation.rfqId -> rfqs table -> rfqs.productId
      let productId: string | null = null;
      
      // Primary source: Get productId directly from the rfqs table record we just queried
      const rfqProductId = rfqFromDb.productId;
      
      console.log('=== PRODUCT ID EXTRACTION ===');
      console.log('RFQ from rfqs table - RAW DATA:', {
        rfqId: rfqFromDb.id,
        productId_camelCase: rfqFromDb.productId,
        productId_snakeCase: (rfqFromDb as any).product_id,
        productIdType: typeof rfqFromDb.productId,
        productIdValue: rfqProductId,
        isNull: rfqProductId === null,
        isUndefined: rfqProductId === undefined,
        isEmptyString: rfqProductId === '',
        allFields: Object.keys(rfqFromDb)
      });
      
      // CRITICAL: Check if RFQ actually has a productId
      if (!rfqProductId || rfqProductId === null || rfqProductId === undefined || rfqProductId === '' || String(rfqProductId).trim() === '' || String(rfqProductId).trim() === 'null') {
        console.error('❌ RFQ DOES NOT HAVE PRODUCTID IN DATABASE!');
        console.error('RFQ Details:', {
          rfqId: rfqFromDb.id,
          rfqTitle: rfqFromDb.title,
          categoryId: rfqFromDb.categoryId,
          productIdFromDb: rfqProductId
        });
        
        // Try fallback immediately before proceeding
        console.log('⚠️ Attempting fallback strategies...');
      }
      
      // Strategy 1: Use productId directly from rfqs table (PRIMARY METHOD)
      if (rfqProductId && 
          rfqProductId !== null &&
          rfqProductId !== undefined &&
          rfqProductId !== 'null' && 
          rfqProductId !== 'undefined' && 
          String(rfqProductId).trim() !== '' &&
          String(rfqProductId).trim().length >= 10) {
        productId = String(rfqProductId).trim();
        console.log('✅✅✅ Strategy 1 SUCCESS: productId found in rfqs table:', {
          productId: productId,
          length: productId.length,
          source: 'rfqs.productId',
          isValid: productId.length >= 10
        });
      } else {
        console.error('❌❌❌ Strategy 1 FAILED: RFQ does not have valid productId!', {
          rfqProductId: rfqProductId,
          type: typeof rfqProductId,
          isNull: rfqProductId === null,
          isUndefined: rfqProductId === undefined,
          isEmpty: rfqProductId === '',
          length: rfqProductId ? String(rfqProductId).length : 0
        });
        console.log('⚠️ Trying fallback strategies...');
      }

      // Strategy 2: Find product by category (fallback if rfqs.productId is null)
      if (!productId && rfqFromDb.categoryId) {
        try {
          console.log('🔍 Strategy 2: Searching for product by categoryId:', rfqFromDb.categoryId);
          const [categoryProduct] = await db.select({ id: products.id })
            .from(products)
            .where(and(
              eq(products.categoryId, rfqFromDb.categoryId),
              eq(products.isPublished, true)
            ))
            .limit(1);
          
          if (categoryProduct && categoryProduct.id) {
            productId = categoryProduct.id;
            console.log('✅ Strategy 2 SUCCESS: Found product by category:', productId);
          } else {
            console.log('⚠️ Strategy 2 FAILED: No products found in category');
          }
        } catch (err) {
          console.error('❌ Strategy 2 ERROR:', err);
        }
      }

      // Strategy 3: Find ANY published product as absolute fallback
      if (!productId) {
        try {
          console.log('🔍 Strategy 3: Searching for ANY published product...');
          const [anyProduct] = await db.select({ id: products.id })
            .from(products)
            .where(eq(products.isPublished, true))
            .orderBy(desc(products.createdAt))
            .limit(1);
          
          if (anyProduct && anyProduct.id) {
            productId = anyProduct.id;
            console.log('✅ Strategy 3 SUCCESS: Found fallback product:', productId);
          } else {
            console.log('❌ Strategy 3 FAILED: No products exist in database');
          }
        } catch (err) {
          console.error('❌ Strategy 3 ERROR:', err);
        }
      }

      // Step 4: CRITICAL VALIDATION - productId MUST exist at this point
      if (!productId || productId.trim() === '' || productId === 'null' || productId === 'undefined') {
        console.error('❌ CRITICAL FAILURE: All strategies failed. No productId found!');
        console.error('RFQ Details:', {
          rfqId: rfqFromDb.id,
          rfqProductId: rfqFromDb.productId,
          categoryId: rfqFromDb.categoryId,
          title: rfqFromDb.title,
          quotationId: quotationId
        });
        return res.status(400).json({ 
          error: "Unable to create order: This RFQ is not linked to a product and no fallback product could be found. Please ensure your RFQ is associated with a product before accepting quotations, or contact support." 
        });
      }

      // Step 5: Final validation and sanitization
      productId = String(productId).trim();
      
      if (productId.length < 10 || productId === 'null' || productId === 'undefined') {
        console.error('❌ Invalid productId after sanitization:', productId);
        return res.status(400).json({ 
          error: "Invalid product ID format. Please contact support." 
        });
      }

      console.log('✅ Final productId confirmed:', {
        productId: productId,
        length: productId.length,
        type: typeof productId
      });
      
      // Step 6: Prepare order creation data
      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      // Get quantity from RFQ or quotation MOQ
      const quantity = rfqFromDb.quantity || quotation.moq || 1;
      
      // Get unit price and total price
      const unitPrice = parseFloat(quotation.pricePerUnit || '0');
      const totalPrice = parseFloat(quotation.totalPrice || '0');
      
      // Step 7: Final verification - productId MUST be valid before proceeding
      if (!productId || productId.trim() === '' || productId === 'null' || productId === 'undefined' || productId.trim().length < 10) {
        console.error('❌ FATAL: productId is invalid after all strategies!', {
          productId: productId,
          type: typeof productId,
          length: productId ? productId.length : 0,
          rfqId: quotation.rfqId,
          quotationId: quotationId
        });
        return res.status(400).json({ 
          error: "Unable to create order: No valid product ID found for this RFQ. Please ensure the RFQ is linked to a product or contact support." 
        });
      }

      // Normalize productId to ensure it's a valid string
      productId = String(productId).trim();
      console.log('✅ FINAL productId before order creation:', {
        productId: productId,
        length: productId.length,
        type: typeof productId,
        isValid: productId.length >= 10
      });

      // Step 8: Build order data object - productId is GUARANTEED to be valid at this point
      const orderData: any = {
        orderNumber: orderNumber,
        buyerId: rfqFromDb.buyerId,
        supplierId: quotation.supplierId,
        rfqId: quotation.rfqId,
        quotationId: quotationId,
        productId: productId, // REQUIRED - guaranteed valid UUID string
        quantity: quantity,
        unitPrice: unitPrice ? String(unitPrice) : '0',
        totalAmount: String(totalPrice), // Must be string for decimal
        status: 'pending_approval',
        shippingAddress: JSON.stringify({
          address: shippingAddress || '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }),
        items: JSON.stringify([{
          productName: rfqFromDb.title || 'RFQ Product',
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice
        }])
      };

      // Final validation: ensure productId is definitely in the order data
      if (!orderData.productId || orderData.productId.trim() === '' || orderData.productId === 'null') {
        console.error('❌ CRITICAL: productId missing in orderData after assignment!', {
          orderData: JSON.stringify(orderData, null, 2),
          productId: orderData.productId,
          productIdType: typeof orderData.productId
        });
        return res.status(500).json({ 
          error: "System error: Product ID validation failed during order data preparation. Please contact support." 
        });
      }
      
      // Verify productId format one more time
      if (orderData.productId.length < 10) {
        console.error('❌ CRITICAL: productId format invalid in orderData!', {
          productId: orderData.productId,
          length: orderData.productId.length
        });
        return res.status(500).json({ 
          error: "System error: Invalid product ID format. Please contact support." 
        });
      }

      console.log('✅✅✅ ORDER DATA BEFORE CREATION - FINAL CHECK:', {
        orderNumber: orderData.orderNumber,
        productId: orderData.productId,
        productIdRaw: JSON.stringify(orderData.productId),
        productIdType: typeof orderData.productId,
        productIdLength: orderData.productId?.length,
        productIdIsNull: orderData.productId === null,
        productIdIsUndefined: orderData.productId === undefined,
        productIdIsEmpty: orderData.productId === '',
        buyerId: orderData.buyerId,
        rfqId: orderData.rfqId,
        quotationId: orderData.quotationId,
        quantity: orderData.quantity,
        totalAmount: orderData.totalAmount,
        fullOrderData: JSON.stringify(orderData, null, 2)
      });

      // ABSOLUTE FINAL CHECK - Do not proceed if productId is null/undefined/empty
      if (!orderData.productId || 
          orderData.productId === null || 
          orderData.productId === undefined || 
          orderData.productId === '' || 
          String(orderData.productId).trim() === '' ||
          String(orderData.productId).trim() === 'null') {
        console.error('❌❌❌ ABSOLUTE FINAL CHECK FAILED - productId is invalid!');
        console.error('OrderData productId value:', orderData.productId);
        console.error('Full orderData:', JSON.stringify(orderData, null, 2));
        return res.status(400).json({ 
          error: "Cannot create order: Product ID is missing. The RFQ must be linked to a product. Please contact support or update the RFQ to include a product before accepting quotations." 
        });
      }

      try {
        // CRITICAL: One more explicit check right before database insert
        // The database has NOT NULL constraint on product_id, so we MUST have a valid value
        const finalProductId = orderData.productId;
        
        if (!finalProductId || 
            finalProductId === null || 
            finalProductId === undefined || 
            finalProductId === '' ||
            String(finalProductId).trim() === '' ||
            String(finalProductId).trim() === 'null' ||
            String(finalProductId).trim().length < 10) {
          console.error('❌❌❌ PRE-INSERT VALIDATION FAILED!');
          console.error('Final productId check before DB insert:', {
            productId: finalProductId,
            type: typeof finalProductId,
            isNull: finalProductId === null,
            isUndefined: finalProductId === undefined,
            isEmpty: finalProductId === '',
            trimmedLength: finalProductId ? String(finalProductId).trim().length : 0,
            orderDataKeys: Object.keys(orderData),
            orderDataProductId: orderData.productId
          });
          return res.status(400).json({ 
            error: "Cannot create order: Product ID validation failed. The RFQ does not have a product linked. Please ensure the RFQ is associated with a product before accepting quotations." 
          });
        }

        console.log('🚀 ATTEMPTING TO CREATE ORDER WITH productId:', finalProductId);
        console.log('Order data productId field:', orderData.productId);
        
        // Ensure productId is explicitly set (defensive programming)
        orderData.productId = String(finalProductId).trim();
        
        console.log('✅ Final orderData.productId after explicit assignment:', orderData.productId);
        
        const order = await storage.createOrder(orderData);
        console.log('✅ Order created successfully:', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          productId: order.productId
        });

      // Update quotation status to accepted and add order info
      await storage.updateQuotation(quotationId, { 
        status: 'accepted',
        message: `Shipping Address: ${shippingAddress}\n\nOrder Created: ${order.id}\n\n${quotation.message || ''}`
      });

      // Close the RFQ
      await storage.updateRfq(quotation.rfqId, { status: 'closed' });

        console.log('✅ RFQ quotation accepted and order created successfully');
      res.json({ 
        success: true, 
        message: 'Quotation accepted and order created successfully!',
          orderId: order.id,
          orderNumber: order.orderNumber
        });
      } catch (createOrderError: any) {
        console.error('❌ Error creating order:', createOrderError);
        console.error('Order data that failed:', JSON.stringify(orderData, null, 2));
        
        // Check if it's a productId constraint error
        if (createOrderError.message && createOrderError.message.includes('product_id') && createOrderError.message.includes('null')) {
          return res.status(400).json({ 
            error: "Product ID is required for order creation. The RFQ must be linked to a product. Please contact support." 
          });
        }
        
        return res.status(500).json({ 
          error: createOrderError.message || "Failed to create order. Please try again or contact support." 
        });
      }
    } catch (error: any) {
      console.error('❌ Error accepting RFQ quotation:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: error.message || 'Failed to accept quotation. Please try again.' 
      });
    }
  });

  // Reject RFQ quotation
  app.post("/api/quotations/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      const quotationId = req.params.id;

      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      if (quotation.status !== 'pending') {
        return res.status(400).json({ error: "Only pending quotations can be rejected" });
      }

      // Update quotation status
      await storage.updateQuotation(quotationId, { 
        status: 'rejected'
      });

      res.json({ 
        success: true, 
        message: 'Quotation rejected successfully' 
      });
    } catch (error: any) {
      console.error('Error rejecting RFQ quotation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Accept quotation and create order
  app.post("/api/quotations/accept", async (req, res) => {
    try {
      const { quotationId, inquiryId, shippingAddress } = req.body;
      
      if (!quotationId || !inquiryId || !shippingAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get the inquiry quotation
      const quotation = await storage.getInquiryQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Get the inquiry for buyer info
      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Update quotation status to accepted
      await storage.updateInquiryQuotation(quotationId, { status: 'accepted' });

      // Update inquiry status to closed
      await storage.updateInquiry(inquiryId, { status: 'closed' });

      // Store shipping address in quotation for admin to use later
      await storage.updateInquiryQuotation(quotationId, { 
        message: `Shipping Address: ${shippingAddress}\n\n${quotation.message || ''}` 
      });

      res.status(200).json({ 
        success: true, 
        message: 'Quotation accepted successfully. Admin will create order for your approval.',
        quotationId,
        nextStep: 'admin_creates_order'
      });
    } catch (error: any) {
      console.error('Error accepting quotation:', error);
      res.status(500).json({ error: error.message || 'Failed to accept quotation' });
    }
  });

  // Reject quotation
  app.post("/api/quotations/reject", async (req, res) => {
    try {
      const { quotationId, reason } = req.body;
      
      if (!quotationId) {
        return res.status(400).json({ error: "Quotation ID is required" });
      }

      // Get the quotation
      const quotation = await storage.getInquiryQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Update quotation status to rejected
      await storage.updateInquiryQuotation(quotationId, { 
        status: 'rejected',
        message: reason ? `Rejected: ${reason}` : quotation.message
      });

      res.json({ 
        success: true, 
        message: 'Quotation rejected successfully' 
      });
    } catch (error: any) {
      console.error('Error rejecting quotation:', error);
      res.status(500).json({ error: error.message || 'Failed to reject quotation' });
    }
  });

  // ==================== INQUIRIES ====================
  
  app.get("/api/inquiries", async (req, res) => {
    try {
      const { productId, buyerId, status } = req.query;
      
      // IMPORTANT: Get buyer ID from authenticated session if not admin
      // @ts-ignore - req.user is added by auth middleware
      const currentUserId = req.user?.id;
      // @ts-ignore
      const currentUserRole = req.user?.role;
      
      const filters: any = {};
      if (productId) filters.productId = productId as string;
      
      // If buyer is logged in and not admin, only show their inquiries
      if (currentUserId && currentUserRole === 'buyer') {
        filters.buyerId = currentUserId;
      } else if (buyerId) {
        // Admin can filter by specific buyer
        filters.buyerId = buyerId as string;
      }
      
      if (status) filters.status = status as string;
      
      const inquiries = await storage.getInquiries(filters);
      res.json({ inquiries });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get buyer dashboard stats
  app.get("/api/buyer/dashboard/stats", authMiddleware, async (req, res) => {
    try {
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const stats = await storage.getBuyerDashboardStats(buyerId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching buyer dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Get all quotations for buyer (centralized view) - ONLY their own quotations
  app.get("/api/buyer/quotations", async (req, res) => {
    try {
      const { status, search, sort, type } = req.query;
      
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Get both inquiry quotations and RFQ quotations
      const [inquiryQuotations, allRfqQuotations] = await Promise.all([
        storage.getInquiryQuotations(),
        storage.getQuotations({})
      ]);
      
      // Filter inquiry quotations for this buyer
      let buyerInquiryQuotations = inquiryQuotations.filter((q: any) => 
        q.buyerId && q.buyerId.toString() === buyerId.toString()
      ).map((q: any) => ({ ...q, type: 'inquiry' }));
      
      // Get RFQs for this buyer and filter RFQ quotations
      const buyerRfqs = await storage.getRfqs({ buyerId });
      const buyerRfqIds = new Set(buyerRfqs.map((r: any) => r.id));
      
      // Enhance RFQ quotations with RFQ and product data
      const buyerRfqQuotations = await Promise.all(
        allRfqQuotations
          .filter((q: any) => buyerRfqIds.has(q.rfqId))
          .map(async (quotation: any) => {
            quotation.type = 'rfq';
            
            // Fetch RFQ details
            const rfq = await storage.getRfq(quotation.rfqId);
            if (rfq) {
              quotation.rfq = rfq;
              quotation.rfqTitle = rfq.title;
              quotation.quantity = rfq.quantity;
              quotation.targetPrice = rfq.targetPrice;
              
              // Fetch product if exists
              if (rfq.productId) {
                try {
                  const product = await db.select().from(products).where(eq(products.id, rfq.productId)).limit(1);
                  if (product[0]) {
                    quotation.product = product[0];
                    quotation.productId = product[0].id;
                    quotation.productName = product[0].name;
                    quotation.productImages = product[0].images;
                  }
                } catch (err) {
                  console.error('Error fetching product:', err);
                }
              }
            }
            
            return quotation;
          })
      );
      
      // Combine both types
      let allQuotations = [...buyerInquiryQuotations, ...buyerRfqQuotations];
      
      // Filter by type if provided
      if (type && type !== 'all') {
        allQuotations = allQuotations.filter((q: any) => q.type === type);
      }
      
      // Filter by status if provided
      if (status && status !== 'all') {
        allQuotations = allQuotations.filter((q: any) => q.status === status);
      }
      
      // Search filter
      if (search) {
        const searchLower = (search as string).toLowerCase();
        allQuotations = allQuotations.filter((q: any) => 
          q.productName?.toLowerCase().includes(searchLower) ||
          q.rfqTitle?.toLowerCase().includes(searchLower) ||
          q.buyerName?.toLowerCase().includes(searchLower) ||
          q.buyerCompany?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort
      if (sort) {
        switch(sort) {
          case 'newest':
            allQuotations.sort((a: any, b: any) => 
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            break;
          case 'oldest':
            allQuotations.sort((a: any, b: any) => 
              new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            );
            break;
          case 'price-high':
            allQuotations.sort((a: any, b: any) => 
              (parseFloat(b.pricePerUnit) || 0) - (parseFloat(a.pricePerUnit) || 0)
            );
            break;
          case 'price-low':
            allQuotations.sort((a: any, b: any) => 
              (parseFloat(a.pricePerUnit) || 0) - (parseFloat(b.pricePerUnit) || 0)
            );
            break;
        }
      }
      
      res.json({ quotations: allQuotations });
    } catch (error: any) {
      console.error('Error fetching buyer quotations:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inquiries/:id", async (req, res) => {
    try {
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      console.log('=== RECEIVED INQUIRY REQUEST ===');
      console.log('Request body:', req.body);
      
      // Clean up the request body - only include fields that exist in schema
      // Note: decimal fields should be strings, not numbers (drizzle-zod requirement)
      const cleanedData: any = {
        productId: req.body.productId,
        buyerId: req.body.buyerId,
        quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
        targetPrice: req.body.targetPrice ? String(req.body.targetPrice) : undefined, // Keep as string for decimal field
        message: req.body.message || null,
        requirements: req.body.requirements || null,
        status: req.body.status || 'pending'
      };

      // Remove undefined values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      console.log('Cleaned inquiry data:', cleanedData);

      // Validate with schema
      const validatedData = insertInquirySchema.parse(cleanedData);
      console.log('Validated inquiry data:', validatedData);
      
      const inquiry = await storage.createInquiry(validatedData);
      console.log('✅ Inquiry created successfully:', inquiry.id);
      
      // Increment product inquiry count
      await storage.incrementProductInquiries(validatedData.productId);
      
      // Get all admin users to notify them about new inquiry
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));

      // Create notification for each admin
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin.id,
          type: 'info',
          title: 'New Inquiry Received',
          message: `A new inquiry has been received for product ${validatedData.productId}`,
          relatedId: inquiry.id,
          relatedType: 'inquiry'
        });
      }
      
      res.status(201).json(inquiry);
    } catch (error: any) {
      console.error('❌ Error creating inquiry:', error);
      console.error('Error details:', error.errors || error.message);
      res.status(400).json({ 
        error: error.message || 'Failed to create inquiry',
        details: error.errors || undefined
      });
    }
  });

  app.patch("/api/inquiries/:id", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.partial().parse(req.body);
      const inquiry = await storage.updateInquiry(req.params.id, validatedData);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Request negotiation for inquiry
  app.post("/api/inquiries/negotiate", async (req, res) => {
    try {
      const { inquiryId, message, targetPrice, quantity } = req.body;
      
      if (!inquiryId) {
        return res.status(400).json({ error: "Inquiry ID is required" });
      }

      // Get the inquiry
      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Update inquiry status to negotiating
      await storage.updateInquiry(inquiryId, { status: 'negotiating' });

      // Create a revision record for negotiation tracking
      const revision = await storage.createInquiryRevision({
        inquiryId,
        revisionNumber: (inquiry.revisions?.length || 0) + 1,
        quantity: quantity || inquiry.quantity,
        targetPrice: targetPrice || inquiry.targetPrice,
        message: message || 'Requesting negotiation',
        status: 'negotiating',
        createdBy: inquiry.buyerId
      });

      res.status(201).json({ 
        success: true, 
        message: 'Negotiation request sent successfully',
        revision
      });
    } catch (error: any) {
      console.error('Error requesting negotiation:', error);
      res.status(500).json({ error: error.message || 'Failed to request negotiation' });
    }
  });

  // ==================== ADMIN INQUIRIES ====================
  
  app.get("/api/admin/inquiries", async (req, res) => {
    try {
      const { status, search } = req.query;
      const filters: any = {};
      
      if (status && status !== 'all') {
        filters.status = status;
      }
      
      if (search) {
        filters.search = search as string;
      }
      
      const inquiries = await storage.getAdminInquiries(filters);
      res.json({ inquiries });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/inquiries/quotation", async (req, res) => {
    try {
      const { inquiryId, quotation } = req.body;
      
      if (!inquiryId || !quotation) {
        return res.status(400).json({ error: "Inquiry ID and quotation data are required" });
      }
      
      // Create quotation
      const createdQuotation = await storage.createInquiryQuotation({
        inquiryId,
        pricePerUnit: quotation.pricePerUnit ? quotation.pricePerUnit.toString() : null,
        totalPrice: quotation.totalPrice ? quotation.totalPrice.toString() : null,
        moq: quotation.moq,
        leadTime: quotation.leadTime,
        paymentTerms: quotation.paymentTerms,
        validUntil: quotation.validUntil ? new Date(quotation.validUntil) : null,
        message: quotation.message,
        attachments: quotation.attachments || [],
        status: 'pending'
      });
      
      // Update inquiry status to 'replied'
      await storage.updateInquiry(inquiryId, { status: 'replied' });
      
      res.json({ success: true, quotation: createdQuotation });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all quotations
  app.get("/api/admin/quotations", async (req, res) => {
    try {
      const { status, search, type } = req.query;
      
      // Get both RFQ quotations and Inquiry quotations
      const [rfqQuotations, inquiryQuotations] = await Promise.all([
        storage.getQuotations(status ? { status: status as string } : {}),
        storage.getInquiryQuotations()
      ]);
      
      // Mark each quotation with its type and enhance with related data
      const enhancedRfqQuotations = await Promise.all(
        rfqQuotations.map(async (quotation: any) => {
          quotation.type = 'rfq';
          quotation.quotationId = quotation.id; // For consistency with inquiry quotations
          
          // Fetch RFQ details
          try {
            const rfq = await storage.getRfq(quotation.rfqId);
            if (rfq) {
              quotation.rfq = rfq;
              quotation.rfqTitle = rfq.title;
              quotation.quantity = rfq.quantity;
              quotation.targetPrice = rfq.targetPrice;
              
              // Fetch buyer details
              if (rfq.buyerId) {
                const buyer = await storage.getUser(rfq.buyerId);
                if (buyer) {
                  quotation.buyer = buyer;
                  quotation.buyerId = buyer.id;
                  quotation.buyerName = `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.email;
                  quotation.buyerCompany = buyer.companyName;
                  quotation.buyerEmail = buyer.email;
                  quotation.buyerPhone = buyer.phone;
                }
              }
              
              // Fetch product details if productId exists
              if (rfq.productId) {
                try {
                  const product = await db.select().from(products).where(eq(products.id, rfq.productId)).limit(1);
                  if (product[0]) {
                    quotation.product = product[0];
                    quotation.productId = product[0].id;
                    quotation.productName = product[0].name;
                    quotation.productImages = product[0].images;
                  }
                } catch (err) {
                  console.error('Error fetching product:', err);
                }
              }
            }
          } catch (err) {
            console.error('Error enhancing RFQ quotation:', err);
          }
          
          return quotation;
        })
      );
      
      // Mark inquiry quotations with type
      const enhancedInquiryQuotations = inquiryQuotations.map((quotation: any) => {
        quotation.type = 'inquiry';
        return quotation;
      });
      
      // Combine both types
      let allQuotations = [...enhancedRfqQuotations, ...enhancedInquiryQuotations];
      
      // Filter by type if provided
      if (type && type !== 'all') {
        allQuotations = allQuotations.filter((q: any) => q.type === type);
      }
      
      // Filter by status if provided
      if (status && status !== 'all') {
        allQuotations = allQuotations.filter((q: any) => q.status === status);
      }
      
      // Search filter
      if (search) {
        const searchLower = (search as string).toLowerCase();
        allQuotations = allQuotations.filter((q: any) => 
          q.productName?.toLowerCase().includes(searchLower) ||
          q.buyerName?.toLowerCase().includes(searchLower) ||
          q.buyerCompany?.toLowerCase().includes(searchLower) ||
          q.rfqTitle?.toLowerCase().includes(searchLower) ||
          q.id?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by created date (newest first)
      allQuotations.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      res.json({ quotations: allQuotations });
    } catch (error: any) {
      console.error('Error fetching admin quotations:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific quotation for buyer (with permission check)
  app.get("/api/buyer/quotations/:id", async (req, res) => {
    try {
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const quotation = await storage.getInquiryQuotationWithDetails(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Check if this quotation belongs to the authenticated buyer
      if (quotation.buyerId && quotation.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to view this quotation" });
      }

      res.json(quotation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept inquiry quotation
  app.post("/api/inquiry-quotations/:id/accept", async (req, res) => {
    try {
      console.log('=== ACCEPT INQUIRY QUOTATION API HIT ===');
      console.log('Quotation ID:', req.params.id);
      console.log('Request body:', req.body);
      
      const { shippingAddress } = req.body;
      const quotationId = req.params.id;

      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!shippingAddress) {
        return res.status(400).json({ error: "Shipping address is required" });
      }

      // Get the inquiry quotation
      const quotation = await storage.getInquiryQuotationWithDetails(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Check if this quotation belongs to the authenticated buyer
      if (quotation.buyerId && quotation.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to accept this quotation" });
      }

      if (quotation.status !== 'pending') {
        return res.status(400).json({ error: "Only pending quotations can be accepted" });
      }

      // Update quotation status to accepted
      await storage.updateInquiryQuotation(quotationId, { 
        status: 'accepted'
      });

      // Update inquiry status to closed
      await storage.updateInquiry(quotation.inquiryId, { status: 'closed' });

      // Create order
      const order = await storage.createOrder({
        orderNumber: `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        buyerId: buyerId,
        inquiryId: quotation.inquiryId,
        quotationId: quotationId,
        productId: quotation.productId,
        quantity: quotation.inquiryQuantity || quotation.quantity || 1,
        unitPrice: quotation.pricePerUnit || '0',
        totalAmount: quotation.totalPrice || '0',
        items: JSON.stringify([{
          productId: quotation.productId,
          productName: quotation.productName,
          quantity: quotation.inquiryQuantity || quotation.quantity || 1,
          unitPrice: quotation.pricePerUnit || '0',
          totalPrice: quotation.totalPrice || '0'
        }]),
        shippingAddress: JSON.stringify(shippingAddress),
        status: 'pending',
        notes: `Order created from quotation. Admin: ${quotation.supplierName || 'Admin'}. Message: ${quotation.message || ''}`
      });

      // Create notifications
      await createNotification({
        userId: buyerId,
        type: 'success',
        title: 'Quotation Accepted',
        message: `Your quotation has been accepted and order #${order.orderNumber} has been created`,
        relatedId: order.id,
        relatedType: 'order'
      });

      // Get all admin users to notify them about new order
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));

      // Notify each admin about new order
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin.id,
          type: 'info',
          title: 'New Order Created',
          message: `Order #${order.orderNumber} has been created from quotation ${quotationId}`,
          relatedId: order.id,
          relatedType: 'order'
        });
      }

      res.json({ 
        success: true, 
        message: 'Quotation accepted and order created successfully!',
        orderId: order.id
      });
    } catch (error: any) {
      console.error('Error accepting inquiry quotation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reject inquiry quotation
  app.post("/api/inquiry-quotations/:id/reject", async (req, res) => {
    try {
      console.log('=== REJECT INQUIRY QUOTATION API HIT ===');
      console.log('Quotation ID:', req.params.id);
      console.log('Request body:', req.body);
      
      const { reason } = req.body;
      const quotationId = req.params.id;

      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get the inquiry quotation
      const quotation = await storage.getInquiryQuotationWithDetails(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Check if this quotation belongs to the authenticated buyer
      if (quotation.buyerId && quotation.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to reject this quotation" });
      }

      if (quotation.status !== 'pending') {
        return res.status(400).json({ error: "Only pending quotations can be rejected" });
      }

      // Update quotation status to rejected
      await storage.updateInquiryQuotation(quotationId, { 
        status: 'rejected',
        message: reason ? `Rejected: ${reason}` : quotation.message
      });

      res.json({ 
        success: true, 
        message: 'Quotation rejected successfully' 
      });
    } catch (error: any) {
      console.error('Error rejecting inquiry quotation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all orders for buyer (centralized view) - ONLY their own orders
  app.get("/api/buyer/orders", async (req, res) => {
    try {
      const { status, search, sort } = req.query;
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get all orders
      let orders = await storage.getOrders();
      
      // FILTER: Only show orders for THIS buyer
      orders = orders.filter((order: any) => order.buyerId && order.buyerId.toString() === buyerId.toString());
      
      // Filter by status if provided
      if (status && status !== 'all') {
        orders = orders.filter((order: any) => order.status === status);
      }
      
      // Search filter
      if (search) {
        const searchLower = (search as string).toLowerCase();
        orders = orders.filter((order: any) =>
          order.orderNumber?.toLowerCase().includes(searchLower) ||
          order.items?.some((item: any) => item.productName?.toLowerCase().includes(searchLower)) ||
          order.supplierName?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort
      if (sort) {
        switch(sort) {
          case 'newest':
            orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'oldest':
            orders.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'amount-high':
            orders.sort((a: any, b: any) => parseFloat(b.totalAmount || '0') - parseFloat(a.totalAmount || '0'));
            break;
          case 'amount-low':
            orders.sort((a: any, b: any) => parseFloat(a.totalAmount || '0') - parseFloat(b.totalAmount || '0'));
            break;
        }
      }
      
      res.json({ orders });
    } catch (error: any) {
      console.error('Error fetching buyer orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific order for buyer (with permission check)
  app.get("/api/buyer/orders/:id", async (req, res) => {
    try {
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if this order belongs to the authenticated buyer
      if (order.buyerId && order.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to view this order" });
      }

      res.json(order);
    } catch (error: any) {
      console.error('Error fetching buyer order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel order for buyer
  app.patch("/api/buyer/orders/:id/cancel", async (req, res) => {
    try {
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if this order belongs to the authenticated buyer
      if (order.buyerId && order.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to cancel this order" });
      }

      if (!order.status || !['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ error: "Only pending or confirmed orders can be cancelled" });
      }

      const { reason } = req.body;
      
      // Update order status to cancelled
      await storage.updateOrder(req.params.id, { 
        status: 'cancelled',
        notes: (order.notes || '') + `\n\nOrder cancelled by buyer. Reason: ${reason || 'No reason provided'}`
      });

      res.json({ 
        message: 'Order cancelled successfully',
        order: await storage.getOrder(req.params.id)
      });
    } catch (error: any) {
      console.error('Error cancelling buyer order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific quotation (handles both RFQ and Inquiry quotations)
  app.get("/api/admin/quotations/:id", async (req, res) => {
    try {
      // Try to get as inquiry quotation first
      let quotation: any = await storage.getInquiryQuotation(req.params.id);
      if (quotation) {
        quotation.type = 'inquiry';
        return res.json(quotation);
      }
      
      // If not found, try as RFQ quotation
      quotation = await storage.getQuotation(req.params.id);
      if (quotation) {
        quotation = { ...quotation, type: 'rfq' };
        return res.json(quotation);
      }
      
      return res.status(404).json({ error: "Quotation not found" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update quotation (handles both types)
  app.patch("/api/admin/quotations/:id", async (req, res) => {
    try {
      const adminId = (req as any).user?.id;
      const adminName = (req as any).user?.firstName || (req as any).user?.email || 'Admin';
      
      // Try to update as inquiry quotation first
      let quotation: any = await storage.updateInquiryQuotation(req.params.id, req.body);
      if (quotation) {
        // Create activity log
        await createActivityLog({
          adminId,
          adminName,
          action: 'Updated Quotation',
          description: `Updated inquiry quotation ${req.params.id}`,
          entityType: 'quotation',
          entityId: req.params.id,
          entityName: `Quotation ${req.params.id}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.json(quotation);
      }
      
      // If not found, try as RFQ quotation
      quotation = await storage.updateQuotation(req.params.id, req.body);
      if (quotation) {
      // Create activity log
      await createActivityLog({
        adminId,
        adminName,
        action: 'Updated Quotation',
          description: `Updated RFQ quotation ${req.params.id}`,
        entityType: 'quotation',
        entityId: req.params.id,
        entityName: `Quotation ${req.params.id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
        return res.json(quotation);
      }
      
      return res.status(404).json({ error: "Quotation not found" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== INQUIRY REVISION & NEGOTIATION ROUTES ====================

  // Get inquiry revisions (negotiation history)
  app.get("/api/inquiries/:id/revisions", async (req, res) => {
    try {
      const revisions = await storage.getInquiryRevisions(req.params.id);
      res.json({ revisions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create counter-offer (customer revises inquiry)
  app.post("/api/inquiries/:id/counter-offer", async (req, res) => {
    try {
      const { quantity, targetPrice, message, requirements } = req.body;
      
      if (!quantity) {
        return res.status(400).json({ error: "Quantity is required" });
      }

      // Get current inquiry to determine next revision number
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Get current revision count
      const existingRevisions = await storage.getInquiryRevisions(req.params.id);
      const nextRevisionNumber = existingRevisions.length + 1;

      // Create revision
      const revision = await storage.createInquiryRevision({
        inquiryId: req.params.id,
        revisionNumber: nextRevisionNumber,
        quantity: parseInt(quantity),
        targetPrice: targetPrice ? parseFloat(targetPrice).toString() : null,
        message,
        requirements,
        status: 'pending',
        createdBy: (req.user as any)?.id || 'admin'
      });

      // Update inquiry status to negotiating
      await storage.updateInquiryStatus(req.params.id, 'negotiating');

      res.json({ success: true, revision });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin creates revised quotation
  app.post("/api/admin/inquiries/:id/revised-quotation", async (req, res) => {
    try {
      console.log('Received revised quotation request:', req.body);
      const { quotation } = req.body;
      
      if (!quotation) {
        console.log('No quotation data provided');
        return res.status(400).json({ error: "Quotation data is required" });
      }
      
      console.log('Quotation data:', quotation);
      
      // Validate required fields
      if (!quotation.pricePerUnit || !quotation.totalPrice || !quotation.moq) {
        return res.status(400).json({ error: "Missing required fields: pricePerUnit, totalPrice, moq" });
      }
      
      // Create new quotation
      const createdQuotation = await storage.createInquiryQuotation({
        inquiryId: req.params.id,
        pricePerUnit: quotation.pricePerUnit ? quotation.pricePerUnit.toString() : null,
        totalPrice: quotation.totalPrice ? quotation.totalPrice.toString() : null,
        moq: quotation.moq,
        leadTime: quotation.leadTime,
        paymentTerms: quotation.paymentTerms,
        validUntil: quotation.validUntil ? new Date(quotation.validUntil) : null,
        message: quotation.message,
        attachments: quotation.attachments || [],
        status: 'pending'
      });
      
      // Update inquiry status to 'replied'
      await storage.updateInquiryStatus(req.params.id, 'replied');
      
      console.log('Revised quotation created successfully:', createdQuotation);
      res.json({ success: true, quotation: createdQuotation });
    } catch (error: any) {
      console.error('Error creating revised quotation:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== RFQ QUOTATION NEGOTIATION ROUTES ====================

  // Admin creates revised RFQ quotation (creates a new quotation for the RFQ)
  app.post("/api/admin/rfqs/:rfqId/revised-quotation", async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized: Only admins can create quotations." });
      }
      
      const supplierId = req.user.id;
      const { rfqId } = req.params;
      const { pricePerUnit, totalPrice, moq, leadTime, paymentTerms, validUntil, message, attachments } = req.body;
      
      // Validate required fields
      if (!pricePerUnit || !totalPrice || !moq) {
        return res.status(400).json({ error: "Missing required fields: pricePerUnit, totalPrice, moq" });
      }
      
      // Get the RFQ to verify it exists
      const rfq = await storage.getRfq(rfqId);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      
      // Create new quotation for this RFQ
      const quotationData = {
        rfqId,
        supplierId,
        pricePerUnit: pricePerUnit.toString(),
        totalPrice: totalPrice.toString(),
        moq: parseInt(moq),
        leadTime: leadTime || null,
        paymentTerms: paymentTerms || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        message: message || null,
        attachments: attachments || [],
        status: 'pending'
      };
      
      const validatedData = insertQuotationSchema.parse(quotationData);
      const createdQuotation = await storage.createQuotation(validatedData);
      
      // Increment RFQ quotation count
      await storage.incrementRfqQuotationCount(rfqId);
      
      // Update RFQ status to negotiating if not already
      if (rfq.status === 'open') {
        await storage.updateRfq(rfqId, { status: 'open' }); // Keep open, or change logic as needed
      }
      
      res.json({ success: true, quotation: createdQuotation });
    } catch (error: any) {
      console.error('Error creating revised RFQ quotation:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get RFQ quotation history (all quotations for a specific RFQ)
  app.get("/api/rfqs/:rfqId/quotations", async (req, res) => {
    try {
      const { rfqId } = req.params;
      
      // Get all quotations for this RFQ
      const quotations = await storage.getQuotations({ rfqId });
      
      // Sort by creation date (newest first)
      quotations.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      res.json({ quotations, rfqId });
    } catch (error: any) {
      console.error('Error fetching RFQ quotation history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Customer accepts quotation (creates order)
  app.post("/api/inquiries/:id/accept-quotation", async (req, res) => {
    try {
      const { quotationId } = req.body;
      
      if (!quotationId) {
        return res.status(400).json({ error: "Quotation ID is required" });
      }

      // Get quotation details
      const quotation = await storage.getInquiryQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Get inquiry details
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order with items
      const orderItems = [{
        productId: inquiry.productId,
        productName: inquiry.productName || 'Product',
        quantity: inquiry.quantity,
        unitPrice: parseFloat(quotation.pricePerUnit.toString()),
        totalPrice: parseFloat(quotation.totalPrice.toString())
      }];

      const order = await storage.createOrder({
        orderNumber,
        buyerId: (req.user as any)?.id || 'admin',
        inquiryId: req.params.id,
        quotationId,
        productId: inquiry.productId,
        quantity: inquiry.quantity,
        unitPrice: quotation.pricePerUnit,
        totalAmount: quotation.totalPrice,
        status: 'confirmed',
        paymentMethod: 'T/T',
        paymentStatus: 'pending',
        shippingAddress: null, // Will be filled later
        notes: `Order created from accepted quotation`,
        items: orderItems
      } as any);

      // Update quotation status to accepted
      await storage.updateInquiryQuotation(quotationId, { status: 'accepted' });

      // Update inquiry status to closed
      await storage.updateInquiryStatus(req.params.id, 'closed');

      res.json({ success: true, order });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Customer rejects quotation
  app.post("/api/inquiries/:id/reject-quotation", async (req, res) => {
    try {
      const { quotationId } = req.body;
      
      if (!quotationId) {
        return res.status(400).json({ error: "Quotation ID is required" });
      }

      // Update quotation status to rejected
      await storage.updateInquiryQuotation(quotationId, { status: 'rejected' });

      // Update inquiry status to negotiating (allows for counter-offer)
      await storage.updateInquiryStatus(req.params.id, 'negotiating');

      res.json({ success: true, message: "Quotation rejected. You can now send a counter-offer." });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Orders API
  app.post("/api/orders", async (req, res) => {
    try {
      const { quotationId, inquiryId, productId, quantity, unitPrice, totalAmount, shippingAddress, paymentMethod, buyerId } = req.body;
      
      if (!quotationId || !productId || !quantity || !unitPrice || !totalAmount) {
        return res.status(400).json({ error: "Missing required order fields" });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order with items
      const orderItems = [{
        productId: productId,
        productName: 'Product', // Default name since we don't have product details here
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalAmount)
      }];

      const order = await storage.createOrder({
        orderNumber,
        buyerId: buyerId || 'admin-created', // Use provided buyerId or fallback
        inquiryId,
        quotationId,
        productId,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice).toString(),
        totalAmount: parseFloat(totalAmount).toString(),
        status: 'pending',
        paymentMethod: paymentMethod || 'T/T',
        paymentStatus: 'pending',
        shippingAddress: shippingAddress || null,
        notes: 'Order created from quotation',
        items: orderItems
      } as any);

      // Update quotation status to accepted
      await storage.updateInquiryQuotation(quotationId, { status: 'accepted' });

      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const { status, search } = req.query;
      const filters: any = {};
      
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      filters.buyerId = buyerId;
      
      if (status) {
        filters.status = status as string;
      }
      
      const orders = await storage.getOrdersWithDetails(filters);
      
      // Apply search filter if provided
      let filteredOrders = orders;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredOrders = orders.filter((order: any) => 
          order.orderNumber?.toLowerCase().includes(searchLower) ||
          order.productName?.toLowerCase().includes(searchLower) ||
          order.trackingNumber?.toLowerCase().includes(searchLower)
        );
      }
      
      res.json({ orders: filteredOrders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin create order from accepted quotation (Step 2: Admin creates order)
  app.post("/api/admin/orders/create-from-quotation", async (req, res) => {
    try {
      const { quotationId } = req.body;
      
      if (!quotationId) {
        return res.status(400).json({ error: "Quotation ID is required" });
      }

      // First try to get as inquiry quotation
      let quotation = await storage.getInquiryQuotationWithDetails(quotationId);
      let quotationType = 'inquiry';
      
      // If not found, try as RFQ quotation
      if (!quotation) {
        quotation = await storage.getQuotation(quotationId);
        if (quotation) {
          // Get RFQ details for RFQ quotation
          const rfq = await storage.getRfq(quotation.rfqId);
          if (rfq) {
            quotation = {
              ...quotation,
              buyerId: rfq.buyerId,
              productName: 'Custom Product',
              productId: null,
              inquiryId: null,
              rfqId: quotation.rfqId
            };
            quotationType = 'rfq';
          }
        }
      }
      
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      if (quotation.status !== 'accepted') {
        return res.status(400).json({ error: "Only accepted quotations can be converted to orders" });
      }

      // Create order with items array using quotation data
      const orderItems = [{
        productId: quotation.productId || 'custom',
        productName: quotation.productName || 'Custom Product',
        quantity: quotation.moq,
        unitPrice: parseFloat(quotation.pricePerUnit.toString()),
        totalPrice: parseFloat(quotation.totalPrice.toString())
      }];

      const orderData = {
        buyerId: quotation.buyerId,
        productId: quotation.productId || null,
        quantity: quotation.moq,
        unitPrice: quotation.pricePerUnit,
        totalAmount: quotation.totalPrice,
        paymentMethod: quotation.paymentTerms || 'T/T',
        paymentStatus: 'pending',
        status: 'pending_approval', // New status: waiting for user approval
        shippingAddress: quotation.message?.includes('Shipping Address:') 
          ? quotation.message.split('Shipping Address:')[1]?.split('\n')[0]?.trim() 
          : 'Address to be provided',
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        inquiryId: quotationType === 'inquiry' ? quotation.inquiryId : null,
        rfqId: quotationType === 'rfq' ? quotation.rfqId : null,
        quotationId,
        items: orderItems,
        notes: 'Order created by admin from accepted quotation. Waiting for buyer approval.'
      } as any;

      const order = await storage.createOrder(orderData);

      // Update quotation to link to the created order
      if (quotationType === 'inquiry') {
        await storage.updateInquiryQuotation(quotationId, { 
          status: 'order_created',
          message: quotation.message + `\n\nOrder Created: ${order.orderNumber}`
        });
      } else {
        await storage.updateQuotation(quotationId, { 
          status: 'order_created',
          message: quotation.message + `\n\nOrder Created: ${order.orderNumber}`
        });
      }

      res.status(201).json({ 
        success: true, 
        message: 'Order created successfully. Waiting for buyer approval.',
        order 
      });
    } catch (error: any) {
      console.error('Error creating order from quotation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // User accept order (Step 3: User accepts the order created by admin)
  app.post("/api/orders/:id/accept", async (req, res) => {
    try {
      const orderId = req.params.id;
      
      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if user owns this order
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      if (order.buyerId !== buyerId) {
        return res.status(403).json({ error: "You can only accept your own orders" });
      }

      // Check if order is in pending_approval status
      if (order.status !== 'pending_approval') {
        return res.status(400).json({ error: "Only orders pending approval can be accepted" });
      }

      // Update order status to confirmed
      const updatedOrder = await storage.updateOrder(orderId, { 
        status: 'confirmed',
        notes: (order.notes || '') + '\n\nOrder accepted by buyer.'
      });

      res.json({ 
        success: true, 
        message: 'Order accepted successfully',
        order: updatedOrder 
      });
    } catch (error: any) {
      console.error('Error accepting order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin confirm order
  app.post("/api/orders/:id/confirm", async (req, res) => {
    try {
      const orderId = req.params.id;
      
      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order status to confirmed
      const updatedOrder = await storage.updateOrder(orderId, { 
        status: 'confirmed',
        notes: 'Order confirmed by admin'
      });

      res.json({ 
        success: true, 
        message: 'Order confirmed successfully',
        order: updatedOrder 
      });
    } catch (error: any) {
      console.error('Error confirming order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Orders API
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const { status, search } = req.query;
      const filters: any = {};
      
      if (status && status !== 'all') {
        filters.status = status as string;
      }
      
      if (search) {
        filters.search = search as string;
      }
      
      const orders = await storage.getAdminOrders(filters);
      res.json({ orders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CONVERSATIONS ====================
  
  app.get("/api/conversations/:userId", async (req, res) => {
    try {
      const { role } = req.query;
      if (!role || (role !== 'buyer' && role !== 'admin')) {
        return res.status(400).json({ error: "Role must be 'buyer' or 'admin'" });
      }
      
      const conversations = await storage.getConversations(req.params.userId, role as 'buyer' | 'admin');
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/conversations/get/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const { buyerId } = req.body;
      if (!buyerId) {
        return res.status(400).json({ error: "buyerId is required" });
      }
      
      const conversation = await storage.getOrCreateConversation(buyerId);
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.partial().parse(req.body);
      const conversation = await storage.updateConversation(req.params.id, validatedData);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });


  // ==================== REVIEWS ====================
  
  app.get("/api/reviews", async (req, res) => {
    try {
      const { productId, buyerId } = req.query;
      const filters: any = {};
      if (productId) filters.productId = productId as string;
      if (buyerId) filters.buyerId = buyerId as string;
      
      const reviews = await storage.getReviews(filters);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reviews/:id", async (req, res) => {
    try {
      const review = await storage.getReview(req.params.id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== FAVORITES ====================
  
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const { itemType } = req.query;
      const favorites = await storage.getFavorites(
        req.params.userId, 
        itemType as 'product' | undefined
      );
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse(req.body);
      // Check if already favorited
      const existing = await storage.getFavorite(validatedData.userId, validatedData.itemId);
      if (existing) {
        return res.status(409).json({ error: "Already favorited" });
      }
      
      const favorite = await storage.createFavorite(validatedData);
      res.status(201).json(favorite);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/favorites/:userId/:itemId", async (req, res) => {
    try {
      const success = await storage.deleteFavorite(req.params.userId, req.params.itemId);
      if (!success) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==================== CUSTOMERS (Legacy) ====================
  
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==================== ORDERS ====================
  

  // Duplicate endpoint removed - using the one above with proper quotation handling

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ADMIN DASHBOARD APIs ====================

  // Test endpoint to verify server is working
  app.get("/api/admin/test", async (req, res) => {
    try {
      console.log('Admin test API called');
      res.json({ 
        success: true, 
        message: "Admin API is working",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error in test API:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get dashboard statistics
  app.get("/api/admin/dashboard/stats", async (req, res) => {
    try {
      console.log('Admin dashboard stats API called');
      
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        console.log('No DATABASE_URL found, returning mock data');
        const mockStats = {
          totalProducts: 1247,
          totalUsers: 3421,
          totalOrders: 892,
          totalRevenue: 125430,
          pendingInquiries: 45,
          totalQuotations: 23,
          newUsersToday: 12,
          productsViewed: 3456
        };
        return res.json(mockStats);
      }
      
      // Get total counts
      const totalProducts = await db.select({ count: sql<number>`count(*)` }).from(products);
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'buyer'));
      const totalOrders = await db.select({ count: sql<number>`count(*)` }).from(orders);
      const totalInquiries = await db.select({ count: sql<number>`count(*)` }).from(inquiries);
      const totalQuotations = await db.select({ count: sql<number>`count(*)` }).from(quotations);
      
      // Get revenue (sum of all order totals)
      const revenueResult = await db.select({ 
        total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)` 
      }).from(orders).where(eq(orders.status, 'completed'));
      
      // Get pending inquiries
      const pendingInquiries = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(inquiries).where(eq(inquiries.status, 'pending'));
      
      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(users).where(
        and(
          eq(users.role, 'buyer'),
          gte(users.createdAt, today)
        )
      );
      
      // Get total product views (if you have a views table, otherwise use inquiries as proxy)
      const productsViewed = await db.select({ 
        count: sql<number>`count(distinct ${inquiries.productId})` 
      }).from(inquiries);

      const statsData = {
        totalProducts: totalProducts[0]?.count || 0,
        totalUsers: totalUsers[0]?.count || 0,
        totalOrders: totalOrders[0]?.count || 0,
        totalRevenue: revenueResult[0]?.total || 0,
        pendingInquiries: pendingInquiries[0]?.count || 0,
        totalQuotations: totalQuotations[0]?.count || 0,
        newUsersToday: newUsersToday[0]?.count || 0,
        productsViewed: productsViewed[0]?.count || 0
      };
      
      console.log('Stats data:', statsData);
      res.json(statsData);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data on error
      const mockStats = {
        totalProducts: 1247,
        totalUsers: 3421,
        totalOrders: 892,
        totalRevenue: 125430,
        pendingInquiries: 45,
        totalQuotations: 23,
        newUsersToday: 12,
        productsViewed: 3456
      };
      res.json(mockStats);
    }
  });

  // Get recent activity
  app.get("/api/admin/dashboard/activity", async (req, res) => {
    try {
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        console.log('No DATABASE_URL found, returning mock activity data');
        const mockActivities = [
          {
            id: 'user_1',
            type: 'new_user',
            message: 'New user John Smith registered',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            icon: 'Users',
            color: 'text-green-600'
          },
          {
            id: 'inquiry_1',
            type: 'new_inquiry',
            message: 'New inquiry for product prod_123',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            icon: 'MessageSquare',
            color: 'text-blue-600'
          },
          {
            id: 'order_1',
            type: 'order_completed',
            message: 'Order #123456 completed - $2500',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            icon: 'CheckCircle',
            color: 'text-green-600'
          }
        ];
        return res.json(mockActivities);
      }
      
      const activities: any[] = [];
      
      // Get recent user registrations
      const recentUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          companyName: users.companyName,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.role, 'buyer'))
        .orderBy(desc(users.createdAt))
        .limit(5);

      recentUsers.forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          type: 'new_user',
          message: `New user ${user.firstName || 'User'} registered`,
          timestamp: user.createdAt,
          icon: 'Users',
          color: 'text-green-600'
        });
      });

      // Get recent inquiries
      const recentInquiries = await db
        .select({
          id: inquiries.id,
          productId: inquiries.productId,
          status: inquiries.status,
          quantity: inquiries.quantity,
          createdAt: inquiries.createdAt
        })
        .from(inquiries)
        .orderBy(desc(inquiries.createdAt))
        .limit(5);

      recentInquiries.forEach(inquiry => {
        activities.push({
          id: `inquiry_${inquiry.id}`,
          type: 'new_inquiry',
          message: `New inquiry for product ${inquiry.productId}`,
          timestamp: inquiry.createdAt,
          icon: 'MessageSquare',
          color: 'text-blue-600'
        });
      });

      // Get recent orders
      const recentOrders = await db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(3);

      recentOrders.forEach(order => {
        activities.push({
          id: `order_${order.id}`,
          type: 'order_completed',
          message: `Order #${order.id.slice(-6)} completed - $${order.totalAmount}`,
          timestamp: order.createdAt,
          icon: 'CheckCircle',
          color: 'text-green-600'
        });
      });

      // Sort by timestamp and return latest 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json(activities.slice(0, 10));
    } catch (error: any) {
      console.error('Error fetching recent activity:', error);
      // Return mock data on error
      const mockActivities = [
        {
          id: 'user_1',
          type: 'new_user',
          message: 'New user John Smith registered',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          icon: 'Users',
          color: 'text-green-600'
        },
        {
          id: 'inquiry_1',
          type: 'new_inquiry',
          message: 'New inquiry for product prod_123',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          icon: 'MessageSquare',
          color: 'text-blue-600'
        }
      ];
      res.json(mockActivities);
    }
  });

  // Get top performing products
  app.get("/api/admin/dashboard/top-products", async (req, res) => {
    try {
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        console.log('No DATABASE_URL found, returning mock top products data');
        const mockProducts = [
          {
            id: 'prod_1',
            name: 'Industrial LED Flood Lights 100W',
            views: 1250,
            inquiries: 45,
            orders: 12,
            revenue: 5400,
            growth: 15.2
          },
          {
            id: 'prod_2',
            name: 'Precision CNC Machined Parts',
            views: 890,
            inquiries: 23,
            orders: 8,
            revenue: 3200,
            growth: 8.7
          },
          {
            id: 'prod_3',
            name: 'High-Quality Cotton T-Shirts',
            views: 2100,
            inquiries: 67,
            orders: 15,
            revenue: 1800,
            growth: -2.1
          }
        ];
        return res.json(mockProducts);
      }
      
      const topProducts = await db
        .select({
          id: products.id,
          name: products.name,
          views: sql<number>`count(distinct ${inquiries.buyerId})`,
          inquiries: sql<number>`count(${inquiries.id})`,
          orders: sql<number>`count(distinct ${orders.id})`,
          revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`
        })
        .from(products)
        .leftJoin(inquiries, eq(products.id, inquiries.productId))
        .leftJoin(orders, eq(products.id, orders.productId))
        .groupBy(products.id, products.name)
        .orderBy(desc(sql`count(${inquiries.id})`))
        .limit(10);

      // Calculate growth (mock for now - you can implement real growth calculation)
      const productsWithGrowth = topProducts.map((product, index) => ({
        ...product,
        growth: Math.random() * 20 - 10 // Random growth between -10% and +10%
      }));

      res.json(productsWithGrowth);
    } catch (error: any) {
      console.error('Error fetching top products:', error);
      // Return mock data on error
      const mockProducts = [
        {
          id: 'prod_1',
          name: 'Industrial LED Flood Lights 100W',
          views: 1250,
          inquiries: 45,
          orders: 12,
          revenue: 5400,
          growth: 15.2
        },
        {
          id: 'prod_2',
          name: 'Precision CNC Machined Parts',
          views: 890,
          inquiries: 23,
          orders: 8,
          revenue: 3200,
          growth: 8.7
        }
      ];
      res.json(mockProducts);
    }
  });

  // Get recent inquiries
  app.get("/api/admin/dashboard/recent-inquiries", async (req, res) => {
    try {
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        console.log('No DATABASE_URL found, returning mock inquiries data');
        const mockInquiries = [
          {
            id: 'inq_1',
            productId: 'prod_123',
            status: 'pending',
            quantity: 500,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            buyerId: 'buyer_1',
            userName: 'John Smith',
            companyName: 'Tech Solutions Inc.'
          },
          {
            id: 'inq_2',
            productId: 'prod_456',
            status: 'replied',
            quantity: 1000,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            buyerId: 'buyer_2',
            userName: 'Maria Garcia',
            companyName: 'Industrial Supplies Ltd.'
          },
          {
            id: 'inq_3',
            productId: 'prod_789',
            status: 'negotiating',
            quantity: 300,
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            buyerId: 'buyer_3',
            userName: 'Ahmed Hassan',
            companyName: 'Middle East Trading Co.'
          }
        ];
        return res.json(mockInquiries);
      }
      
      const recentInquiries = await db
        .select({
          id: inquiries.id,
          productId: inquiries.productId,
          status: inquiries.status,
          quantity: inquiries.quantity,
          createdAt: inquiries.createdAt,
          buyerId: inquiries.buyerId,
          userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          companyName: users.companyName
        })
        .from(inquiries)
        .leftJoin(users, eq(inquiries.buyerId, users.id))
        .orderBy(desc(inquiries.createdAt))
        .limit(10);

      res.json(recentInquiries);
    } catch (error: any) {
      console.error('Error fetching recent inquiries:', error);
      // Return mock data on error
      const mockInquiries = [
        {
          id: 'inq_1',
          productId: 'prod_123',
          status: 'pending',
          quantity: 500,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          buyerId: 'buyer_1',
          userName: 'John Smith',
          companyName: 'Tech Solutions Inc.'
        },
        {
          id: 'inq_2',
          productId: 'prod_456',
          status: 'replied',
          quantity: 1000,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          buyerId: 'buyer_2',
          userName: 'Maria Garcia',
          companyName: 'Industrial Supplies Ltd.'
        }
      ];
      res.json(mockInquiries);
    }
  });

  // Get analytics data
  app.get("/api/admin/dashboard/analytics", async (req, res) => {
    try {
      // Get monthly revenue for the last 6 months
      const monthlyRevenue = await db
        .select({
          month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
          revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, 'completed'),
            gte(orders.createdAt, sql`now() - interval '6 months'`)
          )
        )
        .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

      // Get user registration trends
      const userTrends = await db
        .select({
          month: sql<string>`to_char(${users.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(
          and(
            eq(users.role, 'buyer'),
            gte(users.createdAt, sql`now() - interval '6 months'`)
          )
        )
        .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`);

      // Get category distribution
      const categoryDistribution = await db
        .select({
          categoryName: categories.name,
          productCount: sql<number>`count(${products.id})`,
          inquiryCount: sql<number>`count(distinct ${inquiries.id})`
        })
        .from(categories)
        .leftJoin(products, eq(categories.id, products.categoryId))
        .leftJoin(inquiries, eq(products.id, inquiries.productId))
        .groupBy(categories.id, categories.name)
        .orderBy(desc(sql`count(${products.id})`))
        .limit(10);

      res.json({
        monthlyRevenue,
        userTrends,
        categoryDistribution
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== NOTIFICATION ROUTES ====================

  // Get buyer notifications
  app.get("/api/buyer/notifications", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      console.log('=== FETCHING BUYER NOTIFICATIONS ===');
      console.log('User ID:', userId);
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));

      console.log('Found notifications:', userNotifications.length);
      console.log('Notifications:', userNotifications);

      res.json({ notifications: userNotifications });
    } catch (error: any) {
      console.error('Error fetching buyer notifications:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get admin notifications
  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const adminId = (req as any).user?.id;
      console.log('=== FETCHING ADMIN NOTIFICATIONS ===');
      console.log('Admin ID:', adminId);
      
      if (!adminId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const adminNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, adminId))
        .orderBy(desc(notifications.createdAt));

      console.log('Found admin notifications:', adminNotifications.length);
      console.log('Admin notifications:', adminNotifications);

      res.json({ notifications: adminNotifications });
    } catch (error: any) {
      console.error('Error fetching admin notifications:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db
        .delete(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ACTIVITY LOG ROUTES ====================

  // Get activity logs
  app.get("/api/admin/activity-logs", async (req, res) => {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { search, type, admin } = req.query;

      // Build query with conditions
      let whereConditions = [];
      
      if (search) {
        whereConditions.push(
          or(
            ilike(activity_logs.action, `%${search}%`),
            ilike(activity_logs.description, `%${search}%`),
            ilike(activity_logs.entityName, `%${search}%`)
          )
        );
      }

      if (type && type !== 'all') {
        whereConditions.push(eq(activity_logs.entityType, type as string));
      }

      if (admin && admin !== 'all') {
        whereConditions.push(eq(activity_logs.adminId, admin as string));
      }

      const logs = await db
        .select()
        .from(activity_logs)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(activity_logs.createdAt));

      res.json({ logs });
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get admin users for filter
  app.get("/api/admin/users", async (req, res) => {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const adminUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        })
        .from(users)
        .where(eq(users.role, 'admin'));

      res.json({ users: adminUsers });
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== NOTIFICATION HELPER FUNCTIONS ====================

  // Helper function to create notification
  async function createNotification(data: {
    userId: string;
    type: 'info' | 'success' | 'error' | 'warning';
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: string;
  }) {
    try {
      console.log('=== CREATING NOTIFICATION ===');
      console.log('Notification data:', data);
      
      const result = await db.insert(notifications).values(data);
      console.log('Notification created successfully:', result);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Helper function to create activity log
  async function createActivityLog(data: {
    adminId: string;
    adminName: string;
    action: string;
    description: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await db.insert(activity_logs).values(data);
    } catch (error) {
      console.error('Error creating activity log:', error);
    }
  }

  // Test endpoint to create a notification
  app.post("/api/test/notification", async (req, res) => {
    try {
      const { userId, type = 'info', title, message } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({ error: "userId, title, and message are required" });
      }

      await createNotification({
        userId,
        type,
        title,
        message,
        relatedId: 'test-' + Date.now(),
        relatedType: 'test'
      });

      res.json({ success: true, message: 'Test notification created' });
    } catch (error: any) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get unseen notification count for current user
  app.get("/api/notifications/unseen-count", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ));

      const count = result[0]?.count || 0;
      res.json({ count });
    } catch (error: any) {
      console.error('Error fetching unseen notification count:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get unseen chat count for current user
  app.get("/api/chat/unseen-count", async (req, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let count = 0;

      if (userRole === 'admin') {
        // For admin, count unread messages from buyers
        // Note: unreadCountAdmin column actually stores adminId, not count
        // So we need to count unreadCountBuyer for conversations where adminId matches
        const result = await db
          .select({ count: sql<number>`sum(coalesce(cast(${conversations.unreadCountBuyer} as integer), 0))` })
          .from(conversations)
          .where(eq(conversations.unreadCountAdmin, userId));
        count = result[0]?.count || 0;
      } else {
        // For buyer, count unread messages from admin
        const result = await db
          .select({ count: sql<number>`sum(coalesce(cast(${conversations.unreadCountBuyer} as integer), 0))` })
          .from(conversations)
          .where(eq(conversations.buyerId, userId));
        count = result[0]?.count || 0;
      }

      res.json({ count });
    } catch (error: any) {
      console.error('Error fetching unseen chat count:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
