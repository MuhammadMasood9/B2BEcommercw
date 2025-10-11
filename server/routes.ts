import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertCustomerSchema, insertSupplierSchema, insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, isPublished } = req.query;
      const filters: any = {};
      
      if (categoryId) filters.categoryId = categoryId as string;
      if (search) filters.search = search as string;
      if (isPublished !== undefined) filters.isPublished = isPublished === 'true';
      
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
          // Parse CSV fields and convert to our schema
          const images = p.images ? (typeof p.images === 'string' ? p.images.split(',').map((img: string) => img.trim()).filter(Boolean) : p.images) : [];
          const tags = p.tags ? (typeof p.tags === 'string' ? p.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : p.tags) : [];
          
          const productData = {
            externalId: p.id || p.ID,
            type: p.type || p.Type || "simple",
            sku: p.sku || p.SKU,
            gtin: p.gtin || p['GTIN, UPC, EAN, or ISBN'],
            name: p.name || p.Name,
            slug: (p.name || p.Name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            shortDescription: p.shortDescription || p['Short description'],
            description: p.description || p.Description,
            tags,
            images,
            regularPrice: p.regularPrice || p['Regular price'],
            salePrice: p.salePrice || p['Sale price'],
            taxStatus: p.taxStatus || p['Tax status'] || "taxable",
            taxClass: p.taxClass || p['Tax class'],
            inStock: p.inStock !== undefined ? p.inStock : (p['In stock?'] === '1' || p['In stock?'] === 1),
            stockQuantity: parseInt(p.stockQuantity || p.Stock || '0'),
            lowStockAmount: p.lowStockAmount || p['Low stock amount'] ? parseInt(p.lowStockAmount || p['Low stock amount']) : undefined,
            backordersAllowed: p.backordersAllowed || p['Backorders allowed?'] === '1',
            soldIndividually: p.soldIndividually || p['Sold individually?'] === '1',
            weight: p.weight || p['Weight (kg)'],
            length: p.length || p['Length (cm)'],
            width: p.width || p['Width (cm)'],
            height: p.height || p['Height (cm)'],
            shippingClass: p.shippingClass || p['Shipping class'],
            allowReviews: p.allowReviews !== undefined ? p.allowReviews : (p['Allow customer reviews?'] !== '0'),
            isFeatured: p.isFeatured || p['Is featured?'] === '1',
            isPublished: p.isPublished !== undefined ? p.isPublished : (p.Published === '1' || p.Published === 1),
            visibility: p.visibility || p['Visibility in catalog'] || "visible",
            purchaseNote: p.purchaseNote || p['Purchase note'],
            downloadLimit: p.downloadLimit || p['Download limit'] ? parseInt(p.downloadLimit || p['Download limit']) : undefined,
            downloadExpiryDays: p.downloadExpiryDays || p['Download expiry days'] ? parseInt(p.downloadExpiryDays || p['Download expiry days']) : undefined,
          };
          
          // Validate each product with Zod schema
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

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
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

  // Customers
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

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, validatedData);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const success = await storage.deleteSupplier(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const { customerId, supplierId, status } = req.query;
      const filters: any = {};
      
      if (customerId) filters.customerId = customerId as string;
      if (supplierId) filters.supplierId = supplierId as string;
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
