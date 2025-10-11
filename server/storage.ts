import { 
  type User, type InsertUser,
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Customer, type InsertCustomer,
  type Supplier, type InsertSupplier,
  type Order, type InsertOrder
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProducts(filters?: { categoryId?: string; search?: string; isPublished?: boolean }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  bulkCreateProducts(products: InsertProduct[]): Promise<Product[]>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  // Order operations
  getOrders(filters?: { customerId?: string; supplierId?: string; status?: string }): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalSuppliers: number;
    totalRevenue: number;
    recentOrders: Order[];
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private categories: Map<string, Category>;
  private customers: Map<string, Customer>;
  private suppliers: Map<string, Supplier>;
  private orders: Map<string, Order>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.customers = new Map();
    this.suppliers = new Map();
    this.orders = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Product operations
  async getProducts(filters?: { categoryId?: string; search?: string; isPublished?: boolean }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filters?.categoryId) {
      products = products.filter(p => p.categoryId === filters.categoryId);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search)
      );
    }
    
    if (filters?.isPublished !== undefined) {
      products = products.filter(p => p.isPublished === filters.isPublished);
    }
    
    return products;
  }
  
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const now = new Date();
    const newProduct: Product = { 
      externalId: null,
      type: "simple",
      sku: null,
      gtin: null,
      shortDescription: null,
      description: null,
      categoryId: null,
      tags: null,
      images: null,
      regularPrice: null,
      salePrice: null,
      salePriceStartDate: null,
      salePriceEndDate: null,
      taxStatus: "taxable",
      taxClass: null,
      inStock: true,
      stockQuantity: 0,
      lowStockAmount: null,
      backordersAllowed: false,
      soldIndividually: false,
      weight: null,
      length: null,
      width: null,
      height: null,
      shippingClass: null,
      allowReviews: true,
      isFeatured: false,
      isPublished: true,
      visibility: "visible",
      purchaseNote: null,
      downloadLimit: null,
      downloadExpiryDays: null,
      metaData: null,
      ...product,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = {
      ...existing,
      ...product,
      id,
      updatedAt: new Date()
    };
    this.products.set(id, updated);
    return updated;
  }
  
  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async bulkCreateProducts(products: InsertProduct[]): Promise<Product[]> {
    const created: Product[] = [];
    const now = new Date();
    
    for (const product of products) {
      const id = randomUUID();
      const newProduct: Product = {
        externalId: null,
        type: "simple",
        sku: null,
        gtin: null,
        shortDescription: null,
        description: null,
        categoryId: null,
        tags: null,
        images: null,
        regularPrice: null,
        salePrice: null,
        salePriceStartDate: null,
        salePriceEndDate: null,
        taxStatus: "taxable",
        taxClass: null,
        inStock: true,
        stockQuantity: 0,
        lowStockAmount: null,
        backordersAllowed: false,
        soldIndividually: false,
        weight: null,
        length: null,
        width: null,
        height: null,
        shippingClass: null,
        allowReviews: true,
        isFeatured: false,
        isPublished: true,
        visibility: "visible",
        purchaseNote: null,
        downloadLimit: null,
        downloadExpiryDays: null,
        metaData: null,
        ...product,
        id,
        createdAt: now,
        updatedAt: now
      };
      this.products.set(id, newProduct);
      created.push(newProduct);
    }
    
    return created;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = {
      description: null,
      parentId: null,
      imageUrl: null,
      displayOrder: 0,
      isActive: true,
      ...category,
      id,
      createdAt: new Date()
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    
    const updated: Category = {
      ...existing,
      ...category,
      id
    };
    this.categories.set(id, updated);
    return updated;
  }
  
  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const newCustomer: Customer = {
      firstName: null,
      lastName: null,
      company: null,
      phone: null,
      country: null,
      address: null,
      city: null,
      state: null,
      postalCode: null,
      isVerified: false,
      accountType: "buyer",
      notes: null,
      ...customer,
      id,
      createdAt: new Date()
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated: Customer = {
      ...existing,
      ...customer,
      id
    };
    this.customers.set(id, updated);
    return updated;
  }
  
  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }
  
  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }
  
  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const newSupplier: Supplier = {
      phone: null,
      country: null,
      city: null,
      address: null,
      website: null,
      logoUrl: null,
      description: null,
      productsOffered: null,
      isVerified: false,
      rating: "0",
      totalOrders: 0,
      responseTime: null,
      ...supplier,
      id,
      createdAt: new Date()
    };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }
  
  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existing = this.suppliers.get(id);
    if (!existing) return undefined;
    
    const updated: Supplier = {
      ...existing,
      ...supplier,
      id
    };
    this.suppliers.set(id, updated);
    return updated;
  }
  
  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }
  
  // Order operations
  async getOrders(filters?: { customerId?: string; supplierId?: string; status?: string }): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    
    if (filters?.customerId) {
      orders = orders.filter(o => o.customerId === filters.customerId);
    }
    
    if (filters?.supplierId) {
      orders = orders.filter(o => o.supplierId === filters.supplierId);
    }
    
    if (filters?.status) {
      orders = orders.filter(o => o.status === filters.status);
    }
    
    return orders;
  }
  
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const now = new Date();
    const newOrder: Order = {
      customerId: null,
      supplierId: null,
      status: "pending",
      shippingAmount: "0",
      taxAmount: "0",
      shippingAddress: null,
      billingAddress: null,
      paymentMethod: null,
      paymentStatus: "pending",
      trackingNumber: null,
      notes: null,
      ...order,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated: Order = {
      ...existing,
      ...order,
      id,
      updatedAt: new Date()
    };
    this.orders.set(id, updated);
    return updated;
  }
  
  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }
  
  // Analytics
  async getAnalytics() {
    const totalOrders = this.orders.size;
    const totalRevenue = Array.from(this.orders.values()).reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount as any || 0);
    }, 0);
    
    const recentOrders = Array.from(this.orders.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 5);
    
    return {
      totalProducts: this.products.size,
      totalOrders,
      totalCustomers: this.customers.size,
      totalSuppliers: this.suppliers.size,
      totalRevenue,
      recentOrders
    };
  }
}

export const storage = new MemStorage();
