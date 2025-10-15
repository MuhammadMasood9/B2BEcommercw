import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRoutes } from "./authRoutes";
import categoryRoutes from "./categoryRoutes";
import uploadRoutes from "./uploadRoutes";
import { 
  insertProductSchema, insertCategorySchema, insertCustomerSchema, insertOrderSchema,
  insertUserSchema, insertBuyerProfileSchema,
  insertRfqSchema, insertQuotationSchema, insertInquirySchema,
  insertConversationSchema, insertMessageSchema, insertReviewSchema,
  insertFavoriteSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ==================== AUTHENTICATION ROUTES ====================
  
  app.use('/api/auth', authRoutes);
  
  // ==================== UPLOAD ROUTES ====================
  
  app.use('/api', uploadRoutes);
  
  // ==================== CATEGORY ROUTES ====================
  
  app.use('/api', categoryRoutes);
  
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
      const { categoryId, search, isPublished, minMOQ, maxMOQ } = req.query;
      const filters: any = {};
      
      if (categoryId) filters.categoryId = categoryId as string;
      if (search) filters.search = search as string;
      if (isPublished !== undefined) filters.isPublished = isPublished === 'true';
      if (minMOQ) filters.minMOQ = parseInt(minMOQ as string);
      if (maxMOQ) filters.maxMOQ = parseInt(maxMOQ as string);
      
      const products = await storage.getProducts(filters);
      res.json(products);
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

  // ==================== CATEGORIES ====================
  
  app.get("/api/categories", async (req, res) => {
    try {
      const { parentId, isActive } = req.query;
      const filters: any = {};
      if (parentId !== undefined) filters.parentId = parentId === 'null' ? null : parentId as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const categories = await storage.getCategories(filters);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  app.post("/api/rfqs", async (req, res) => {
    try {
      const validatedData = insertRfqSchema.parse(req.body);
      const rfq = await storage.createRfq(validatedData);
      res.status(201).json(rfq);
    } catch (error: any) {
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
      const validatedData = insertQuotationSchema.parse(req.body);
      const quotation = await storage.createQuotation(validatedData);
      
      // Increment RFQ quotation count
      await storage.incrementRfqQuotationCount(validatedData.rfqId);
      
      res.status(201).json(quotation);
    } catch (error: any) {
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

  // ==================== INQUIRIES ====================
  
  app.get("/api/inquiries", async (req, res) => {
    try {
      const { productId, buyerId, status } = req.query;
      const filters: any = {};
      if (productId) filters.productId = productId as string;
      if (buyerId) filters.buyerId = buyerId as string;
      if (status) filters.status = status as string;
      
      const inquiries = await storage.getInquiries(filters);
      res.json(inquiries);
    } catch (error: any) {
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
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      
      // Increment product inquiry count
      await storage.incrementProductInquiries(validatedData.productId);
      
      res.status(201).json(inquiry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
        pricePerUnit: quotation.pricePerUnit,
        totalPrice: quotation.totalPrice,
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
      const quotations = await storage.getInquiryQuotations();
      res.json({ quotations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific quotation
  app.get("/api/admin/quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.getInquiryQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update quotation
  app.patch("/api/admin/quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.updateInquiryQuotation(req.params.id, req.body);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      res.json(quotation);
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
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        message,
        requirements,
        status: 'pending',
        createdBy: req.user?.id
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
        pricePerUnit: quotation.pricePerUnit,
        totalPrice: quotation.totalPrice,
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

      // Create order
      const order = await storage.createOrder({
        orderNumber,
        buyerId: req.user?.id,
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
        notes: `Order created from accepted quotation`
      });

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
      const { quotationId, inquiryId, productId, quantity, unitPrice, totalAmount, shippingAddress, paymentMethod } = req.body;
      
      if (!quotationId || !productId || !quantity || !unitPrice || !totalAmount) {
        return res.status(400).json({ error: "Missing required order fields" });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order = await storage.createOrder({
        orderNumber,
        buyerId: req.user?.id,
        inquiryId,
        quotationId,
        productId,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalAmount: parseFloat(totalAmount),
        status: 'pending',
        paymentMethod: paymentMethod || 'T/T',
        paymentStatus: 'pending',
        shippingAddress: shippingAddress || null,
        notes: 'Order created from quotation'
      });

      // Update quotation status to accepted
      await storage.updateInquiryQuotation(quotationId, { status: 'accepted' });

      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const { status } = req.query;
      const filters: any = {};
      
      if (req.user?.id) {
        filters.buyerId = req.user.id;
      }
      
      if (status) {
        filters.status = status as string;
      }
      
      const orders = await storage.getOrders(filters);
      res.json({ orders });
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

  // ==================== MESSAGES ====================
  
  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      await storage.markMessageAsRead(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/messages/conversation/:conversationId/read", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      await storage.markConversationMessagesAsRead(req.params.conversationId, userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
  
  app.get("/api/orders", async (req, res) => {
    try {
      const { buyerId, customerId, status } = req.query;
      const filters: any = {};
      
      if (buyerId) filters.buyerId = buyerId as string;
      if (customerId) filters.customerId = customerId as string;
      if (status) filters.status = status as string;
      
      const orders = await storage.getOrders(filters);
      res.json(orders);
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

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

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

  const httpServer = createServer(app);

  return httpServer;
}
