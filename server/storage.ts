import { eq, and, or, desc, asc, like, sql as drizzleSql, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  type User, type InsertUser, users,
  type BuyerProfile, type InsertBuyerProfile, buyerProfiles,
  type SupplierProfile, type InsertSupplierProfile, supplierProfiles,
  type Product, type InsertProduct, products,
  type Category, type InsertCategory, categories,
  type Rfq, type InsertRfq, rfqs,
  type Quotation, type InsertQuotation, quotations,
  type Inquiry, type InsertInquiry, inquiries,
  type Conversation, type InsertConversation, conversations,
  type Message, type InsertMessage, messages,
  type Review, type InsertReview, reviews,
  type Favorite, type InsertFavorite, favorites,
  type Certification, type InsertCertification, certifications,
  type Customer, type InsertCustomer, customers,
  type Supplier, type InsertSupplier, suppliers,
  type Order, type InsertOrder, orders
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Buyer Profile operations
  getBuyerProfile(userId: string): Promise<BuyerProfile | undefined>;
  createBuyerProfile(profile: InsertBuyerProfile): Promise<BuyerProfile>;
  updateBuyerProfile(userId: string, profile: Partial<InsertBuyerProfile>): Promise<BuyerProfile | undefined>;
  
  // Supplier Profile operations
  getSupplierProfile(userId: string): Promise<SupplierProfile | undefined>;
  getSupplierProfiles(filters?: { isVerified?: boolean; country?: string }): Promise<SupplierProfile[]>;
  createSupplierProfile(profile: InsertSupplierProfile): Promise<SupplierProfile>;
  updateSupplierProfile(userId: string, profile: Partial<InsertSupplierProfile>): Promise<SupplierProfile | undefined>;
  
  // Product operations
  getProducts(filters?: { 
    categoryId?: string; 
    supplierId?: string;
    search?: string; 
    isPublished?: boolean;
    minMOQ?: number;
    maxMOQ?: number;
  }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  bulkCreateProducts(products: InsertProduct[]): Promise<Product[]>;
  incrementProductViews(id: string): Promise<void>;
  incrementProductInquiries(id: string): Promise<void>;
  
  // Category operations
  getCategories(filters?: { parentId?: string; isActive?: boolean }): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // RFQ operations
  getRfqs(filters?: { buyerId?: string; status?: string; categoryId?: string }): Promise<Rfq[]>;
  getRfq(id: string): Promise<Rfq | undefined>;
  createRfq(rfq: InsertRfq): Promise<Rfq>;
  updateRfq(id: string, rfq: Partial<InsertRfq>): Promise<Rfq | undefined>;
  incrementRfqQuotationCount(id: string): Promise<void>;
  
  // Quotation operations
  getQuotations(filters?: { rfqId?: string; supplierId?: string; status?: string }): Promise<Quotation[]>;
  getQuotation(id: string): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  
  // Inquiry operations
  getInquiries(filters?: { productId?: string; buyerId?: string; supplierId?: string; status?: string }): Promise<Inquiry[]>;
  getInquiry(id: string): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined>;
  
  // Conversation operations
  getConversations(userId: string, role: 'buyer' | 'supplier'): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getOrCreateConversation(buyerId: string, supplierId: string): Promise<Conversation>;
  updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  
  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  markConversationMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  
  // Review operations
  getReviews(filters?: { productId?: string; supplierId?: string; buyerId?: string }): Promise<Review[]>;
  getReview(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Favorite operations
  getFavorites(userId: string, itemType?: 'product' | 'supplier'): Promise<Favorite[]>;
  getFavorite(userId: string, itemId: string): Promise<Favorite | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: string, itemId: string): Promise<boolean>;
  
  // Certification operations
  getCertifications(supplierId: string): Promise<Certification[]>;
  createCertification(certification: InsertCertification): Promise<Certification>;
  updateCertification(id: string, certification: Partial<InsertCertification>): Promise<Certification | undefined>;
  deleteCertification(id: string): Promise<boolean>;
  
  // Customer operations (legacy)
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
  // Supplier operations (legacy)
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  // Order operations
  getOrders(filters?: { buyerId?: string; supplierId?: string; customerId?: string; status?: string }): Promise<Order[]>;
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
  
  getBuyerDashboardStats(buyerId: string): Promise<{
    activeRfqs: number;
    pendingInquiries: number;
    unreadMessages: number;
    favoriteSuppliers: number;
  }>;
  
  getSupplierDashboardStats(supplierId: string): Promise<{
    totalProducts: number;
    totalInquiries: number;
    totalQuotations: number;
    responseRate: number;
    totalViews: number;
  }>;
}

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Buyer Profile operations
  async getBuyerProfile(userId: string): Promise<BuyerProfile | undefined> {
    const [profile] = await db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, userId)).limit(1);
    return profile;
  }

  async createBuyerProfile(profile: InsertBuyerProfile): Promise<BuyerProfile> {
    const [created] = await db.insert(buyerProfiles).values(profile).returning();
    return created;
  }

  async updateBuyerProfile(userId: string, profile: Partial<InsertBuyerProfile>): Promise<BuyerProfile | undefined> {
    const [updated] = await db.update(buyerProfiles)
      .set(profile)
      .where(eq(buyerProfiles.userId, userId))
      .returning();
    return updated;
  }

  // Supplier Profile operations
  async getSupplierProfile(userId: string): Promise<SupplierProfile | undefined> {
    const [profile] = await db.select().from(supplierProfiles).where(eq(supplierProfiles.userId, userId)).limit(1);
    return profile;
  }

  async getSupplierProfiles(filters?: { isVerified?: boolean; country?: string }): Promise<SupplierProfile[]> {
    let query = db.select().from(supplierProfiles);
    const conditions = [];
    
    if (filters?.isVerified !== undefined) {
      conditions.push(eq(supplierProfiles.isVerified, filters.isVerified));
    }
    if (filters?.country) {
      conditions.push(eq(supplierProfiles.country, filters.country));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async createSupplierProfile(profile: InsertSupplierProfile): Promise<SupplierProfile> {
    const [created] = await db.insert(supplierProfiles).values(profile).returning();
    return created;
  }

  async updateSupplierProfile(userId: string, profile: Partial<InsertSupplierProfile>): Promise<SupplierProfile | undefined> {
    const [updated] = await db.update(supplierProfiles)
      .set(profile)
      .where(eq(supplierProfiles.userId, userId))
      .returning();
    return updated;
  }

  // Product operations
  async getProducts(filters?: { 
    categoryId?: string; 
    supplierId?: string;
    search?: string; 
    isPublished?: boolean;
    minMOQ?: number;
    maxMOQ?: number;
  }): Promise<Product[]> {
    let query = db.select().from(products);
    const conditions = [];
    
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(products.supplierId, filters.supplierId));
    }
    if (filters?.isPublished !== undefined) {
      conditions.push(eq(products.isPublished, filters.isPublished));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(products.name, searchPattern),
          like(products.description, searchPattern)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async bulkCreateProducts(productList: InsertProduct[]): Promise<Product[]> {
    if (productList.length === 0) return [];
    const created = await db.insert(products).values(productList).returning();
    return created;
  }

  async incrementProductViews(id: string): Promise<void> {
    await db.update(products)
      .set({ views: drizzleSql`${products.views} + 1` })
      .where(eq(products.id, id));
  }

  async incrementProductInquiries(id: string): Promise<void> {
    await db.update(products)
      .set({ inquiries: drizzleSql`${products.inquiries} + 1` })
      .where(eq(products.id, id));
  }

  // Category operations
  async getCategories(filters?: { parentId?: string; isActive?: boolean }): Promise<Category[]> {
    let query = db.select().from(categories);
    const conditions = [];
    
    if (filters?.parentId !== undefined) {
      if (filters.parentId === null) {
        conditions.push(drizzleSql`${categories.parentId} IS NULL`);
      } else {
        conditions.push(eq(categories.parentId, filters.parentId));
      }
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(categories.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(asc(categories.displayOrder));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // RFQ operations
  async getRfqs(filters?: { buyerId?: string; status?: string; categoryId?: string }): Promise<Rfq[]> {
    let query = db.select().from(rfqs);
    const conditions = [];
    
    if (filters?.buyerId) {
      conditions.push(eq(rfqs.buyerId, filters.buyerId));
    }
    if (filters?.status) {
      conditions.push(eq(rfqs.status, filters.status));
    }
    if (filters?.categoryId) {
      conditions.push(eq(rfqs.categoryId, filters.categoryId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(rfqs.createdAt));
  }

  async getRfq(id: string): Promise<Rfq | undefined> {
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id)).limit(1);
    return rfq;
  }

  async createRfq(rfq: InsertRfq): Promise<Rfq> {
    const [created] = await db.insert(rfqs).values(rfq).returning();
    return created;
  }

  async updateRfq(id: string, rfq: Partial<InsertRfq>): Promise<Rfq | undefined> {
    const [updated] = await db.update(rfqs)
      .set(rfq)
      .where(eq(rfqs.id, id))
      .returning();
    return updated;
  }

  async incrementRfqQuotationCount(id: string): Promise<void> {
    await db.update(rfqs)
      .set({ quotationsCount: drizzleSql`${rfqs.quotationsCount} + 1` })
      .where(eq(rfqs.id, id));
  }

  // Quotation operations
  async getQuotations(filters?: { rfqId?: string; supplierId?: string; status?: string }): Promise<Quotation[]> {
    let query = db.select().from(quotations);
    const conditions = [];
    
    if (filters?.rfqId) {
      conditions.push(eq(quotations.rfqId, filters.rfqId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(quotations.supplierId, filters.supplierId));
    }
    if (filters?.status) {
      conditions.push(eq(quotations.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(quotations.createdAt));
  }

  async getQuotation(id: string): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
    return quotation;
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [created] = await db.insert(quotations).values(quotation).returning();
    return created;
  }

  async updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const [updated] = await db.update(quotations)
      .set(quotation)
      .where(eq(quotations.id, id))
      .returning();
    return updated;
  }

  // Inquiry operations
  async getInquiries(filters?: { productId?: string; buyerId?: string; supplierId?: string; status?: string }): Promise<Inquiry[]> {
    let query = db.select().from(inquiries);
    const conditions = [];
    
    if (filters?.productId) {
      conditions.push(eq(inquiries.productId, filters.productId));
    }
    if (filters?.buyerId) {
      conditions.push(eq(inquiries.buyerId, filters.buyerId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(inquiries.supplierId, filters.supplierId));
    }
    if (filters?.status) {
      conditions.push(eq(inquiries.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(inquiries.createdAt));
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    return inquiry;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [created] = await db.insert(inquiries).values(inquiry).returning();
    return created;
  }

  async updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const [updated] = await db.update(inquiries)
      .set(inquiry)
      .where(eq(inquiries.id, id))
      .returning();
    return updated;
  }

  // Conversation operations
  async getConversations(userId: string, role: 'buyer' | 'supplier'): Promise<Conversation[]> {
    const condition = role === 'buyer' 
      ? eq(conversations.buyerId, userId)
      : eq(conversations.supplierId, userId);
    
    return await db.select().from(conversations)
      .where(condition)
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return conversation;
  }

  async getOrCreateConversation(buyerId: string, supplierId: string): Promise<Conversation> {
    const [existing] = await db.select().from(conversations)
      .where(and(
        eq(conversations.buyerId, buyerId),
        eq(conversations.supplierId, supplierId)
      ))
      .limit(1);
    
    if (existing) return existing;
    
    const [created] = await db.insert(conversations)
      .values({ buyerId, supplierId })
      .returning();
    return created;
  }

  async updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [updated] = await db.update(conversations)
      .set(conversation)
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  // Message operations
  async getMessages(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return message;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    
    // Update conversation
    const conversation = await db.select().from(conversations)
      .where(eq(conversations.id, message.conversationId))
      .limit(1);
    
    if (conversation[0]) {
      const unreadField = message.senderId === conversation[0].buyerId 
        ? 'unreadCountSupplier' 
        : 'unreadCountBuyer';
      
      await db.update(conversations)
        .set({
          lastMessage: message.message,
          lastMessageAt: new Date(),
          [unreadField]: drizzleSql`${conversations[unreadField as keyof typeof conversations]} + 1`
        })
        .where(eq(conversations.id, message.conversationId));
    }
    
    return created;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }

  async markConversationMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));
    
    // Reset unread count
    const conversation = await db.select().from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    
    if (conversation[0]) {
      const unreadField = userId === conversation[0].buyerId 
        ? 'unreadCountBuyer' 
        : 'unreadCountSupplier';
      
      await db.update(conversations)
        .set({ [unreadField]: 0 })
        .where(eq(conversations.id, conversationId));
    }
  }

  // Review operations
  async getReviews(filters?: { productId?: string; supplierId?: string; buyerId?: string }): Promise<Review[]> {
    let query = db.select().from(reviews);
    const conditions = [];
    
    if (filters?.productId) {
      conditions.push(eq(reviews.productId, filters.productId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(reviews.supplierId, filters.supplierId));
    }
    if (filters?.buyerId) {
      conditions.push(eq(reviews.buyerId, filters.buyerId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(reviews.createdAt));
  }

  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    
    // Update supplier rating and review count
    const supplierReviews = await this.getReviews({ supplierId: review.supplierId });
    const avgRating = supplierReviews.reduce((sum, r) => sum + r.rating, 0) / supplierReviews.length;
    
    await db.update(supplierProfiles)
      .set({ 
        rating: avgRating.toFixed(2),
        totalReviews: supplierReviews.length
      })
      .where(eq(supplierProfiles.userId, review.supplierId));
    
    return created;
  }

  // Favorite operations
  async getFavorites(userId: string, itemType?: 'product' | 'supplier'): Promise<Favorite[]> {
    const conditions = [eq(favorites.userId, userId)];
    
    if (itemType) {
      conditions.push(eq(favorites.itemType, itemType));
    }
    
    return await db.select().from(favorites)
      .where(and(...conditions))
      .orderBy(desc(favorites.createdAt));
  }

  async getFavorite(userId: string, itemId: string): Promise<Favorite | undefined> {
    const [favorite] = await db.select().from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.itemId, itemId)
      ))
      .limit(1);
    return favorite;
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [created] = await db.insert(favorites).values(favorite).returning();
    return created;
  }

  async deleteFavorite(userId: string, itemId: string): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.itemId, itemId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Certification operations
  async getCertifications(supplierId: string): Promise<Certification[]> {
    return await db.select().from(certifications)
      .where(eq(certifications.supplierId, supplierId))
      .orderBy(desc(certifications.createdAt));
  }

  async createCertification(certification: InsertCertification): Promise<Certification> {
    const [created] = await db.insert(certifications).values(certification).returning();
    return created;
  }

  async updateCertification(id: string, certification: Partial<InsertCertification>): Promise<Certification | undefined> {
    const [updated] = await db.update(certifications)
      .set(certification)
      .where(eq(certifications.id, id))
      .returning();
    return updated;
  }

  async deleteCertification(id: string): Promise<boolean> {
    const result = await db.delete(certifications).where(eq(certifications.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Customer operations (legacy)
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Supplier operations (legacy)
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers)
      .set(supplier)
      .where(eq(suppliers.id, id))
      .returning();
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Order operations
  async getOrders(filters?: { buyerId?: string; supplierId?: string; customerId?: string; status?: string }): Promise<Order[]> {
    let query = db.select().from(orders);
    const conditions = [];
    
    if (filters?.buyerId) {
      conditions.push(eq(orders.buyerId, filters.buyerId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(orders.supplierId, filters.supplierId));
    }
    if (filters?.customerId) {
      conditions.push(eq(orders.customerId, filters.customerId));
    }
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Analytics
  async getAnalytics() {
    const [productCount] = await db.select({ count: drizzleSql<number>`count(*)::int` }).from(products);
    const [orderCount] = await db.select({ count: drizzleSql<number>`count(*)::int` }).from(orders);
    const [customerCount] = await db.select({ count: drizzleSql<number>`count(*)::int` }).from(customers);
    const [supplierCount] = await db.select({ count: drizzleSql<number>`count(*)::int` }).from(suppliers);
    
    const [revenueResult] = await db.select({ 
      total: drizzleSql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` 
    }).from(orders);
    
    const recentOrders = await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);
    
    return {
      totalProducts: productCount.count || 0,
      totalOrders: orderCount.count || 0,
      totalCustomers: customerCount.count || 0,
      totalSuppliers: supplierCount.count || 0,
      totalRevenue: revenueResult.total || 0,
      recentOrders
    };
  }

  async getBuyerDashboardStats(buyerId: string) {
    const [activeRfqCount] = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(rfqs)
      .where(and(eq(rfqs.buyerId, buyerId), eq(rfqs.status, 'open')));
    
    const [pendingInquiryCount] = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(inquiries)
      .where(and(eq(inquiries.buyerId, buyerId), eq(inquiries.status, 'pending')));
    
    const [unreadMessageCount] = await db.select({ 
      total: drizzleSql<number>`COALESCE(SUM(${conversations.unreadCountBuyer}), 0)::int` 
    })
      .from(conversations)
      .where(eq(conversations.buyerId, buyerId));
    
    const [favoriteSupplierCount] = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(favorites)
      .where(and(eq(favorites.userId, buyerId), eq(favorites.itemType, 'supplier')));
    
    return {
      activeRfqs: activeRfqCount.count || 0,
      pendingInquiries: pendingInquiryCount.count || 0,
      unreadMessages: unreadMessageCount.total || 0,
      favoriteSuppliers: favoriteSupplierCount.count || 0
    };
  }

  async getSupplierDashboardStats(supplierId: string) {
    const [productCount] = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.supplierId, supplierId));
    
    const [inquiryCount] = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(inquiries)
      .where(eq(inquiries.supplierId, supplierId));
    
    const [quotationCount] = await db.select({ count: drizzleSql<number>`count(*)::int` })
      .from(quotations)
      .where(eq(quotations.supplierId, supplierId));
    
    const [viewsResult] = await db.select({ 
      total: drizzleSql<number>`COALESCE(SUM(${products.views}), 0)::int` 
    })
      .from(products)
      .where(eq(products.supplierId, supplierId));
    
    const supplierProfile = await this.getSupplierProfile(supplierId);
    
    return {
      totalProducts: productCount.count || 0,
      totalInquiries: inquiryCount.count || 0,
      totalQuotations: quotationCount.count || 0,
      responseRate: parseFloat(supplierProfile?.responseRate || '0'),
      totalViews: viewsResult.total || 0
    };
  }
}

export const storage = new PostgresStorage();
