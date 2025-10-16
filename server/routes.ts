import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRoutes } from "./authRoutes";
import categoryRoutes from "./categoryRoutes";
import uploadRoutes from "./uploadRoutes";
import { upload } from "./upload";
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

  app.post("/api/rfqs", upload.array('attachments', 10), async (req, res) => {
    try {
      // Handle file uploads
      const uploadedFiles = req.files as Express.Multer.File[] || [];
      const filePaths = uploadedFiles.map(file => `/uploads/${file.filename}`);

      // Prepare RFQ data
      const rfqData = {
        title: req.body.title,
        description: req.body.description,
        quantity: parseInt(req.body.quantity),
        deliveryLocation: req.body.deliveryLocation,
        status: req.body.status || 'open',
        buyerId: req.body.buyerId,
        categoryId: req.body.categoryId || null,
        targetPrice: req.body.targetPrice || null,
        expectedDate: req.body.expectedDate ? new Date(req.body.expectedDate) : null,
        attachments: filePaths.length > 0 ? filePaths : null
      };

      const validatedData = insertRfqSchema.parse(rfqData);
      const rfq = await storage.createRfq(validatedData);
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

  // Accept RFQ quotation
  app.post("/api/quotations/:id/accept", async (req, res) => {
    try {
      const { shippingAddress } = req.body;
      const quotationId = req.params.id;

      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      if (quotation.status !== 'pending') {
        return res.status(400).json({ error: "Only pending quotations can be accepted" });
      }

      // Get RFQ details for order creation
      const rfq = await storage.getRfq(quotation.rfqId);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }

      // Create order directly from accepted quotation
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const orderData = {
        orderNumber: orderNumber,
        buyerId: rfq.buyerId,
        supplierId: quotation.supplierId,
        rfqId: quotation.rfqId,
        quotationId: quotationId,
        totalAmount: parseFloat(quotation.totalPrice),
        status: 'pending_approval', // Buyer needs to accept the created order
        shippingAddress: JSON.stringify({
          address: shippingAddress,
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }),
        items: JSON.stringify([{
          productName: rfq.title,
          quantity: rfq.quantity,
          unitPrice: parseFloat(quotation.pricePerUnit),
          totalPrice: parseFloat(quotation.totalPrice)
        }])
      };

      const order = await storage.createOrder(orderData as any);

      // Update quotation status to accepted and add order info
      await storage.updateQuotation(quotationId, { 
        status: 'accepted',
        message: `Shipping Address: ${shippingAddress}\n\nOrder Created: ${order.id}\n\n${quotation.message || ''}`
      });

      // Close the RFQ
      await storage.updateRfq(quotation.rfqId, { status: 'closed' });

      res.json({ 
        success: true, 
        message: 'Quotation accepted and order created successfully!',
        orderId: order.id
      });
    } catch (error: any) {
      console.error('Error accepting RFQ quotation:', error);
      res.status(500).json({ error: error.message });
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
        status: 'rejected',
        rejectionReason: reason || 'No reason provided'
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

  // Get all quotations for buyer (centralized view) - ONLY their own quotations
  app.get("/api/buyer/quotations", async (req, res) => {
    try {
      const { status, search, sort } = req.query;
      
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      
      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Get all inquiry quotations
      let quotations = await storage.getInquiryQuotations();
      
      // FILTER: Only show quotations for THIS buyer's inquiries
      quotations = quotations.filter((q: any) => q.buyerId === buyerId);
      
      // Filter by status if provided
      if (status && status !== 'all') {
        quotations = quotations.filter((q: any) => q.status === status);
      }
      
      // Search filter
      if (search) {
        const searchLower = (search as string).toLowerCase();
        quotations = quotations.filter((q: any) => 
          q.productName?.toLowerCase().includes(searchLower) ||
          q.buyerName?.toLowerCase().includes(searchLower) ||
          q.buyerCompany?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort
      if (sort) {
        switch(sort) {
          case 'newest':
            quotations.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'oldest':
            quotations.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'price-high':
            quotations.sort((a: any, b: any) => (b.pricePerUnit || 0) - (a.pricePerUnit || 0));
            break;
          case 'price-low':
            quotations.sort((a: any, b: any) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0));
            break;
        }
      }
      
      res.json({ quotations });
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

      // Get the accepted quotation with details
      const quotation = await storage.getInquiryQuotationWithDetails(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      if (quotation.status !== 'accepted') {
        return res.status(400).json({ error: "Only accepted quotations can be converted to orders" });
      }

      // Create order with items array using quotation data (already has joined inquiry data)
      const orderItems = [{
        productId: quotation.productId,
        productName: quotation.productName || 'Product',
        quantity: quotation.moq,
        unitPrice: parseFloat(quotation.pricePerUnit.toString()),
        totalPrice: parseFloat(quotation.totalPrice.toString())
      }];

      const orderData = {
        buyerId: quotation.buyerId,
        productId: quotation.productId,
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
        inquiryId: quotation.inquiryId,
        quotationId,
        items: orderItems,
        notes: 'Order created by admin from accepted quotation. Waiting for buyer approval.'
      } as any;

      const order = await storage.createOrder(orderData);

      // Update quotation to link to the created order
      await storage.updateInquiryQuotation(quotationId, { 
        status: 'order_created',
        message: quotation.message + `\n\nOrder Created: ${order.orderNumber}`
      });

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

  const httpServer = createServer(app);

  return httpServer;
}
