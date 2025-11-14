import { eq, and, or, desc, asc, like, ilike, sql as drizzleSql, sql, ne, count, gte } from "drizzle-orm";
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
  type InquiryQuotation, type InsertInquiryQuotation, inquiryQuotations,
  type InquiryRevision, type InsertInquiryRevision, inquiryRevisions,
  type Order, type InsertOrder, orders,
  type Conversation, type InsertConversation, conversations,
  type Message, type InsertMessage, messages,
  type Review, type InsertReview, reviews,
  type Favorite, type InsertFavorite, favorites,
  type Customer, type InsertCustomer, customers,
  type Notification, notifications
} from "@shared/schema";
import bcrypt from "bcryptjs";

let conversationsSchemaPatched = false;

async function ensureConversationSchemaPatched() {
  if (conversationsSchemaPatched) return;

  const patchStatements = [
    sql`
      ALTER TABLE conversations
      ALTER COLUMN buyer_id TYPE text USING buyer_id::text;
    `,
    sql`
      ALTER TABLE conversations
      ALTER COLUMN unread_count_admin TYPE text USING unread_count_admin::text;
    `,
    sql`
      ALTER TABLE conversations
      ALTER COLUMN unread_count_admin DROP NOT NULL;
    `,
    sql`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS supplier_id text;
    `,
    sql`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS product_id text;
    `,
    sql`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS last_message text;
    `,
    sql`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS last_message_at timestamp;
    `,
    sql`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS unread_count_buyer integer DEFAULT 0;
    `,
    sql`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS unread_count_supplier integer DEFAULT 0;
    `,
    sql`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS type text;
    `,
    sql`
      ALTER TABLE conversations
      ALTER COLUMN type SET DEFAULT 'buyer_support';
    `,
    sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS receiver_id text;
    `,
    sql`
      ALTER TABLE messages
      ALTER COLUMN receiver_id TYPE text USING receiver_id::text;
    `,
    sql`
      ALTER TABLE messages
      ALTER COLUMN receiver_id DROP NOT NULL;
    `,
    sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS sender_type text;
    `,
    sql`
      UPDATE messages
      SET sender_type = COALESCE(sender_type, 'buyer');
    `,
    sql`
      ALTER TABLE messages
      ALTER COLUMN sender_type SET DEFAULT 'buyer';
    `,
    sql`
      ALTER TABLE messages
      ALTER COLUMN sender_type SET NOT NULL;
    `,
  ];

  for (const statement of patchStatements) {
    try {
      await db.execute(statement);
    } catch (error: any) {
      const message = error?.message || '';
      if (
        !(message.includes('already exists') ||
          message.includes('type text') ||
          error?.code === '42701' ||
          error?.code === '42703')
      ) {
        console.warn('[conversations schema] patch step skipped:', message || error);
      }
    }
  }

  try {
    await db.execute(sql`
      ALTER TABLE conversations
      DROP CONSTRAINT IF EXISTS "conversations_buyer_id_fkey";
    `);
  } catch (error: any) {
    const message = error?.message || '';
    if (!message.includes('does not exist')) {
      console.warn('[conversations schema] drop buyer fk skipped:', message || error);
    }
  }

  try {
    await db.execute(sql`
      ALTER TABLE conversations
      DROP CONSTRAINT IF EXISTS "conversations_buyer_id_users_id_fk";
    `);
  } catch (error: any) {
    const message = error?.message || '';
    if (!message.includes('does not exist')) {
      console.warn('[conversations schema] drop buyer fk (users_id) skipped:', message || error);
    }
  }

  try {
    await db.execute(sql`
      ALTER TABLE conversations
      ADD CONSTRAINT "conversations_buyer_id_users_fkey"
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE;
    `);
  } catch (error: any) {
    const message = error?.message || '';
    if (!message.includes('already exists')) {
      console.warn('[conversations schema] add buyer fk skipped:', message || error);
    }
  }

  // Ensure type is not null after default applied
  try {
    await db.execute(sql`
      UPDATE conversations
      SET type = 'buyer_support'
      WHERE type IS NULL;
    `);
    await db.execute(sql`
      ALTER TABLE conversations
      ALTER COLUMN type SET NOT NULL;
    `);
  } catch (error: any) {
    const message = error?.message || '';
    if (!(message.includes('not null') || error?.code === '42701')) {
      console.warn('[conversations schema] type constraint skipped:', message || error);
    }
  }

  conversationsSchemaPatched = true;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;

  // Buyer Profile operations
  getBuyerProfile(userId: string): Promise<BuyerProfile | undefined>;
  createBuyerProfile(profile: InsertBuyerProfile): Promise<BuyerProfile>;
  updateBuyerProfile(userId: string, profile: Partial<InsertBuyerProfile>): Promise<BuyerProfile | undefined>;

  // Product operations
  getProducts(filters?: {
    categoryId?: string;
    search?: string;
    isPublished?: boolean;
    minMOQ?: number;
    maxMOQ?: number;
    featured?: boolean;
    supplierId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]>;
  getProductsCount(filters?: {
    categoryId?: string;
    search?: string;
    isPublished?: boolean;
    minMOQ?: number;
    maxMOQ?: number;
    featured?: boolean;
    supplierId?: string;
  }): Promise<number>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  bulkCreateProducts(products: InsertProduct[]): Promise<Product[]>;
  incrementProductViews(id: string): Promise<void>;
  incrementProductInquiries(id: string): Promise<void>;

  // Category operations
  getCategories(filters?: { parentId?: string | null; isActive?: boolean; search?: string; featured?: boolean }): Promise<Category[]>;
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
  getQuotations(filters?: { rfqId?: string; status?: string }): Promise<Quotation[]>;
  getQuotation(id: string): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined>;

  // Inquiry operations
  getInquiries(filters?: { productId?: string; buyerId?: string; status?: string }): Promise<any[]>;
  getInquiry(id: string): Promise<any | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined>;

  // Admin Inquiry operations
  getAdminInquiries(filters?: { status?: string; search?: string }): Promise<any[]>;
  addQuotationToInquiry(inquiryId: string, quotation: any): Promise<Inquiry | undefined>;

  // Inquiry Quotation operations
  createInquiryQuotation(quotation: InsertInquiryQuotation): Promise<InquiryQuotation>;
  getInquiryQuotations(inquiryId?: string): Promise<any[]>;
  updateInquiryQuotation(id: string, quotation: Partial<InsertInquiryQuotation>): Promise<InquiryQuotation | undefined>;
  getInquiryQuotation(id: string): Promise<InquiryQuotation | undefined>;

  // Inquiry revision operations
  createInquiryRevision(revision: InsertInquiryRevision): Promise<InquiryRevision>;
  getInquiryRevisions(inquiryId: string): Promise<any[]>;
  updateInquiryStatus(inquiryId: string, status: string): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(filters?: { buyerId?: string; status?: string }): Promise<Order[]>;
  getOrdersWithDetails(filters?: { buyerId?: string; status?: string }): Promise<any[]>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  getAdminOrders(filters?: { status?: string; search?: string }): Promise<any[]>;

  // Conversation operations
  getConversations(userId: string, role: 'buyer' | 'admin'): Promise<Conversation[]>;
  getBuyerConversations(buyerId: string): Promise<any[]>;
  getSupplierConversations(supplierId: string): Promise<any[]>;
  getAdminConversations(adminId: string): Promise<any[]>;
  getAllConversationsForAdmin(adminId?: string): Promise<any[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getOrCreateConversation(buyerId: string): Promise<Conversation>;
  createConversation(data: {
    buyerId: string;
    supplierId?: string;
    adminId?: string;
    productId?: string;
    type?: string;
  }): Promise<Conversation>;
  updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  resolveSupplierUserId(identifier?: string | null): Promise<string | null>;

  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  getConversationMessages(conversationId: string, userId: string, userRole?: string, limit?: number, before?: string): Promise<any[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  markConversationMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  updateConversationLastMessage(conversationId: string): Promise<void>;

  // Review operations
  getReviews(filters?: { productId?: string; buyerId?: string }): Promise<Review[]>;
  getReview(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview & { buyerId: string; supplierId: string }): Promise<Review>;

  // Favorite operations
  getFavorites(userId: string, itemType?: 'product'): Promise<Favorite[]>;
  getFavorite(userId: string, itemId: string): Promise<Favorite | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: string, itemId: string): Promise<boolean>;

  // Customer operations (legacy)
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;


  // Analytics
  getAnalytics(): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    recentOrders: Order[];
  }>;

  getBuyerDashboardStats(buyerId: string): Promise<{
    activeRfqs: number;
    pendingInquiries: number;
    unreadMessages: number;
    favoriteProducts: number;
    totalQuotations: number;
    totalOrders: number;
    totalSpent: number;
    recentInquiries: any[];
    recentRFQs: any[];
    recentQuotations: any[];
    recentOrders: any[];
    recentConversations: any[];
    recentNotifications: any[];
  }>;

  // Users
  getUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  getUserOnlineStatus(userId: string): Promise<{ isOnline: boolean; lastSeen: Date | null } | undefined>;
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
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...user };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const [updated] = await db.update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db.update(users)
      .set({
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserOnlineStatus(userId: string): Promise<{ isOnline: boolean; lastSeen: Date | null } | undefined> {
    const [user] = await db.select({
      isOnline: users.isOnline,
      lastSeen: users.lastSeen
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ? { isOnline: user.isOnline || false, lastSeen: user.lastSeen } : undefined;
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

  // Product operations
  async getProducts(filters?: {
    categoryId?: string;
    search?: string;
    isPublished?: boolean;
    minMOQ?: number;
    maxMOQ?: number;
    featured?: boolean;
    supplierId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    let query = db.select({
      // Product fields
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      categoryId: products.categoryId,
      specifications: products.specifications,
      images: products.images,
      videos: products.videos,
      minOrderQuantity: products.minOrderQuantity,
      priceRanges: products.priceRanges,
      sampleAvailable: products.sampleAvailable,
      samplePrice: products.samplePrice,
      customizationAvailable: products.customizationAvailable,
      leadTime: products.leadTime,
      port: products.port,
      paymentTerms: products.paymentTerms,
      inStock: products.inStock,
      stockQuantity: products.stockQuantity,
      isPublished: products.isPublished,
      isFeatured: products.isFeatured,
      views: products.views,
      inquiries: products.inquiries,
      colors: products.colors,
      sizes: products.sizes,
      keyFeatures: products.keyFeatures,
      customizationDetails: products.customizationDetails,
      certifications: products.certifications,
      hasTradeAssurance: products.hasTradeAssurance,
      tags: products.tags,
      sku: products.sku,
      metaData: products.metaData,
      supplierId: products.supplierId,
      approvalStatus: products.approvalStatus,
      approvedBy: products.approvedBy,
      approvedAt: products.approvedAt,
      rejectionReason: products.rejectionReason,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      // Supplier fields
      supplierName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      storeSlug: supplierProfiles.storeSlug,
      supplierRating: supplierProfiles.rating,
      supplierVerified: supplierProfiles.isVerified,
      supplierActive: supplierProfiles.isActive
    })
      .from(products)
      .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id));

    const conditions = [];

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.isPublished !== undefined) {
      conditions.push(eq(products.isPublished, filters.isPublished));
    }
    if (filters?.featured !== undefined) {
      conditions.push(eq(products.isFeatured, filters.featured));
    }
    if (filters?.supplierId) {
      conditions.push(eq(products.supplierId, filters.supplierId));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(products.name, searchPattern),
          like(products.description, searchPattern),
          like(supplierProfiles.businessName, searchPattern),
          like(supplierProfiles.storeName, searchPattern)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Add ordering
    query = query.orderBy(desc(products.createdAt)) as any;

    // Add pagination
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getProductsCount(filters?: {
    categoryId?: string;
    search?: string;
    isPublished?: boolean;
    minMOQ?: number;
    maxMOQ?: number;
    featured?: boolean;
    supplierId?: string;
  }): Promise<number> {
    const conditions = [];

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.isPublished !== undefined) {
      conditions.push(eq(products.isPublished, filters.isPublished));
    }
    if (filters?.featured !== undefined) {
      conditions.push(eq(products.isFeatured, filters.featured));
    }
    if (filters?.supplierId) {
      conditions.push(eq(products.supplierId, filters.supplierId));
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

    let query = db.select({ count: sql`count(*)::int` }).from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    const total = parseInt(result[0]?.count as string) || 0;
    console.log(`🔢 getProductsCount: ${total} products found`);
    return total;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [result] = await db.select({
      // Product fields
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      categoryId: products.categoryId,
      specifications: products.specifications,
      images: products.images,
      videos: products.videos,
      minOrderQuantity: products.minOrderQuantity,
      priceRanges: products.priceRanges,
      sampleAvailable: products.sampleAvailable,
      samplePrice: products.samplePrice,
      customizationAvailable: products.customizationAvailable,
      leadTime: products.leadTime,
      port: products.port,
      paymentTerms: products.paymentTerms,
      inStock: products.inStock,
      stockQuantity: products.stockQuantity,
      isPublished: products.isPublished,
      isFeatured: products.isFeatured,
      views: products.views,
      inquiries: products.inquiries,
      colors: products.colors,
      sizes: products.sizes,
      keyFeatures: products.keyFeatures,
      customizationDetails: products.customizationDetails,
      certifications: products.certifications,
      hasTradeAssurance: products.hasTradeAssurance,
      tags: products.tags,
      sku: products.sku,
      metaData: products.metaData,
      supplierId: products.supplierId,
      approvalStatus: products.approvalStatus,
      approvedBy: products.approvedBy,
      approvedAt: products.approvedAt,
      rejectionReason: products.rejectionReason,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      // Supplier fields
      supplierName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      storeSlug: supplierProfiles.storeSlug,
      supplierRating: supplierProfiles.rating,
      supplierVerified: supplierProfiles.isVerified,
      supplierActive: supplierProfiles.isActive
    })
      .from(products)
      .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
      .where(eq(products.id, id))
      .limit(1);
    return result;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [result] = await db.select({
      // Product fields
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      categoryId: products.categoryId,
      specifications: products.specifications,
      images: products.images,
      videos: products.videos,
      minOrderQuantity: products.minOrderQuantity,
      priceRanges: products.priceRanges,
      sampleAvailable: products.sampleAvailable,
      samplePrice: products.samplePrice,
      customizationAvailable: products.customizationAvailable,
      leadTime: products.leadTime,
      port: products.port,
      paymentTerms: products.paymentTerms,
      inStock: products.inStock,
      stockQuantity: products.stockQuantity,
      isPublished: products.isPublished,
      isFeatured: products.isFeatured,
      views: products.views,
      inquiries: products.inquiries,
      colors: products.colors,
      sizes: products.sizes,
      keyFeatures: products.keyFeatures,
      customizationDetails: products.customizationDetails,
      certifications: products.certifications,
      hasTradeAssurance: products.hasTradeAssurance,
      tags: products.tags,
      sku: products.sku,
      metaData: products.metaData,
      supplierId: products.supplierId,
      approvalStatus: products.approvalStatus,
      approvedBy: products.approvedBy,
      approvedAt: products.approvedAt,
      rejectionReason: products.rejectionReason,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      // Supplier fields
      supplierName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      storeSlug: supplierProfiles.storeSlug,
      supplierRating: supplierProfiles.rating,
      supplierVerified: supplierProfiles.isVerified,
      supplierActive: supplierProfiles.isActive
    })
      .from(products)
      .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
      .where(eq(products.slug, slug))
      .limit(1);
    return result;
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
  async getCategories(filters?: { parentId?: string | null; isActive?: boolean; search?: string; featured?: boolean }): Promise<Category[]> {
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
    if (filters?.featured !== undefined) {
      conditions.push(eq(categories.isFeatured, filters.featured));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(like(categories.name, searchPattern));
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
  async getQuotations(filters?: { rfqId?: string; status?: string }): Promise<Quotation[]> {
    let query = db.select().from(quotations);
    const conditions = [];

    if (filters?.rfqId) {
      conditions.push(eq(quotations.rfqId, filters.rfqId));
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
  async getInquiries(filters?: { productId?: string; buyerId?: string; status?: string }): Promise<any[]> {
    let whereConditions = [];

    if (filters?.productId) {
      whereConditions.push(eq(inquiries.productId, filters.productId));
    }
    if (filters?.buyerId) {
      whereConditions.push(eq(inquiries.buyerId, filters.buyerId));
    }
    if (filters?.status) {
      whereConditions.push(eq(inquiries.status, filters.status));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const results = await db.select({
      id: inquiries.id,
      productId: inquiries.productId,
      buyerId: inquiries.buyerId,
      quantity: inquiries.quantity,
      targetPrice: inquiries.targetPrice,
      message: inquiries.message,
      requirements: inquiries.requirements,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      // Join with product data
      productName: products.name,
      productImage: products.images,
      productDescription: products.description,
      // Join with buyer data (admin name since admin acts as supplier)
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: buyerProfiles.companyName,
      buyerCountry: buyerProfiles.country,
      buyerPhone: buyerProfiles.phone,
      supplierName: sql`'Admin Supplier'`.as('supplierName'),
      supplierCountry: sql`'USA'`.as('supplierCountry'),
      supplierVerified: sql`true`.as('supplierVerified')
    })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(users, eq(inquiries.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(inquiries.buyerId, buyerProfiles.userId))
      .where(whereClause)
      .orderBy(desc(inquiries.createdAt));

    // Fetch quotations for each inquiry
    const resultsWithQuotations = await Promise.all(
      results.map(async (inquiry) => {
        const quotations = await this.getInquiryQuotations(inquiry.id);

        // Parse product image
        let productImage = null;
        try {
          if (inquiry.productImage && typeof inquiry.productImage === 'string') {
            const parsed = JSON.parse(inquiry.productImage);
            productImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
          }
        } catch (error) {
          productImage = null;
        }

        return {
          ...inquiry,
          productImage,
          quotations: quotations || []
        };
      })
    );

    return resultsWithQuotations;
  }

  async getInquiry(id: string): Promise<any | undefined> {
    const [inquiry] = await db.select({
      id: inquiries.id,
      productId: inquiries.productId,
      buyerId: inquiries.buyerId,
      quantity: inquiries.quantity,
      targetPrice: inquiries.targetPrice,
      message: inquiries.message,
      requirements: inquiries.requirements,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      // Join with product data
      productName: products.name,
      productImage: products.images
    })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .where(eq(inquiries.id, id))
      .limit(1);
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

  // Admin Inquiry operations
  async getAdminInquiries(filters?: { status?: string; search?: string }): Promise<any[]> {
    let whereConditions = [];

    if (filters?.status && filters.status !== 'all') {
      whereConditions.push(eq(inquiries.status, filters.status));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(users.firstName, `%${filters.search}%`),
          like(buyerProfiles.companyName, `%${filters.search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const results = await db.select({
      id: inquiries.id,
      productId: inquiries.productId,
      buyerId: inquiries.buyerId,
      quantity: inquiries.quantity,
      targetPrice: inquiries.targetPrice,
      message: inquiries.message,
      requirements: inquiries.requirements,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      productName: products.name,
      productImage: products.images,
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: buyerProfiles.companyName,
      buyerCountry: buyerProfiles.country,
      buyerPhone: buyerProfiles.phone
    })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(users, eq(inquiries.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(inquiries.buyerId, buyerProfiles.userId))
      .where(whereClause)
      .orderBy(desc(inquiries.createdAt));

    // Fetch quotations for each inquiry
    const resultsWithQuotations = await Promise.all(
      results.map(async (inquiry) => {
        const quotations = await this.getInquiryQuotations(inquiry.id);

        // Parse product image
        let productImage = null;
        try {
          if (inquiry.productImage && typeof inquiry.productImage === 'string') {
            const parsed = JSON.parse(inquiry.productImage);
            productImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
          }
        } catch (error) {
          productImage = null;
        }

        return {
          ...inquiry,
          productImage,
          quotations: quotations || []
        };
      })
    );

    return resultsWithQuotations;
  }

  async addQuotationToInquiry(inquiryId: string, quotation: any): Promise<Inquiry | undefined> {
    // Update inquiry status to 'replied'
    const [updated] = await db.update(inquiries)
      .set({ status: 'replied' })
      .where(eq(inquiries.id, inquiryId))
      .returning();

    // In a real implementation, you would also store the quotation in a separate table
    // For now, we'll just update the inquiry status

    return updated;
  }

  // Conversation operations
  async getConversations(userId: string, role: 'buyer' | 'admin'): Promise<Conversation[]> {
    const condition = eq(conversations.buyerId, userId);

    return await db.select().from(conversations)
      .where(condition)
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return conversation;
  }

  async getOrCreateConversation(buyerId: string): Promise<Conversation> {
    const [existing] = await db.select().from(conversations)
      .where(eq(conversations.buyerId, buyerId))
      .limit(1);

    if (existing) return existing;

    const [created] = await db.insert(conversations)
      .values({
        buyerId,
        unreadCountAdmin: 0,
        unreadCountBuyer: 0,
        unreadCountSupplier: 0
      })
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


  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }

  async markConversationMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await ensureConversationSchemaPatched();
    
    // Mark messages as read for this user
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));

    // Get conversation details to determine user role
    const [conversation] = await db.select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      supplierId: conversations.supplierId,
      adminId: conversations.adminId
    }).from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return;
    }

    // Resolve supplier user ID if needed
    let normalizedSupplierId = conversation.supplierId;
    if (conversation.supplierId) {
      normalizedSupplierId = await this.resolveSupplierUserId(conversation.supplierId);
    }

    // Determine which unread count to reset based on user role
    const updateData: any = {};
    
    if (userId === conversation.buyerId) {
      updateData.unreadCountBuyer = 0;
    } else if (normalizedSupplierId && userId === normalizedSupplierId) {
      updateData.unreadCountSupplier = 0;
    } else if (conversation.adminId && userId === conversation.adminId) {
      updateData.unreadCountAdmin = 0;
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(conversations)
        .set(updateData)
        .where(eq(conversations.id, conversationId));
    }
  }

  // Review operations
  async getReviews(filters?: { productId?: string; buyerId?: string }): Promise<Review[]> {
    let query = db.select().from(reviews);
    const conditions = [];

    if (filters?.productId) {
      conditions.push(eq(reviews.productId, filters.productId));
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

  async createReview(review: InsertReview & { buyerId: string; supplierId: string }): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  // Favorite operations
  async getFavorites(userId: string, itemType?: 'product'): Promise<Favorite[]> {
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

  // Order operations (legacy - keeping for backward compatibility)
  async getOrders(filters?: { buyerId?: string; status?: string }): Promise<Order[]> {
    let query = db.select().from(orders);
    const conditions = [];

    if (filters?.buyerId) {
      conditions.push(eq(orders.buyerId, filters.buyerId));
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
    const [productCount] = await db.select({ count: drizzleSql`count(*)::int` }).from(products);
    const [orderCount] = await db.select({ count: drizzleSql`count(*)::int` }).from(orders);
    const [customerCount] = await db.select({ count: drizzleSql`count(*)::int` }).from(customers);

    const [revenueResult] = await db.select({
      total: drizzleSql`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
    }).from(orders);

    const recentOrders = await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return {
      totalProducts: parseInt(productCount.count as string) || 0,
      totalOrders: parseInt(orderCount.count as string) || 0,
      totalCustomers: parseInt(customerCount.count as string) || 0,
      totalRevenue: parseFloat(revenueResult.total as string) || 0,
      recentOrders
    };
  }

  async getBuyerDashboardStats(buyerId: string) {
    const fetchCount = async <T>(query: () => Promise<T>, extract: (value: T) => number, label: string): Promise<number> => {
      try {
        const result = await query();
        return extract(result);
      } catch (error) {
        console.error(`[getBuyerDashboardStats] Failed to fetch ${label}:`, error);
        return 0;
      }
    };

    const parseCount = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const [activeRfqs, pendingInquiries, unreadMessages, favoriteProducts] = await Promise.all([
      fetchCount(
        () => db.select({ count: drizzleSql`count(*)::int` }).from(rfqs).where(and(eq(rfqs.buyerId, buyerId), eq(rfqs.status, 'open'))),
        (rows) => parseCount(Array.isArray(rows) ? rows[0]?.count : (rows as any)?.count),
        'active RFQs'
      ),
      fetchCount(
        () => db.select({ count: drizzleSql`count(*)::int` }).from(inquiries).where(and(eq(inquiries.buyerId, buyerId), eq(inquiries.status, 'pending'))),
        (rows) => parseCount(Array.isArray(rows) ? rows[0]?.count : (rows as any)?.count),
        'pending inquiries'
      ),
      fetchCount(
        () => db.select({ total: drizzleSql`COALESCE(SUM(${conversations.unreadCountBuyer}), 0)::int` }).from(conversations).where(eq(conversations.buyerId, buyerId)),
        (rows) => parseCount(Array.isArray(rows) ? rows[0]?.total : (rows as any)?.total),
        'unread messages'
      ),
      fetchCount(
        () => db.select({ count: drizzleSql`count(*)::int` }).from(favorites).where(and(eq(favorites.userId, buyerId), eq(favorites.itemType, 'product'))),
        (rows) => parseCount(Array.isArray(rows) ? rows[0]?.count : (rows as any)?.count),
        'favorite products'
      ),
    ]);

    const safeLoad = async <T>(label: string, loader: () => Promise<T>): Promise<T | []> => {
      try {
        return await loader();
      } catch (error) {
        console.error(`[getBuyerDashboardStats] Failed to load ${label}:`, error);
        return [];
      }
    };

    const [quotationListRaw, orderListRaw] = await Promise.all([
      safeLoad('buyer quotations', async () =>
        (await this.getInquiryQuotations()).filter(
          (q: any) => q.buyerId && q.buyerId.toString() === buyerId.toString()
        )
      ),
      safeLoad('buyer orders', () => this.getOrders({ buyerId })),
    ]);

    const quotationList = Array.isArray(quotationListRaw) ? quotationListRaw : [];
    const orderList = Array.isArray(orderListRaw) ? orderListRaw : [];

    const totalSpent = orderList.reduce((sum: number, order: any) => sum + (Number(order?.totalAmount) || 0), 0);

    const safeSlice = async <T>(label: string, loader: () => Promise<T[]>): Promise<T[]> => {
      const data = await safeLoad(label, loader);
      return Array.isArray(data) ? data.slice(0, 5) : [];
    };

    const [recentInquiries, recentRFQs, recentQuotations, recentOrders, recentConversations, recentNotifications] = await Promise.all([
      safeSlice('recent inquiries', async () =>
        await db
          .select({
            id: inquiries.id,
            productName: products.name,
            quantity: inquiries.quantity,
            status: inquiries.status,
            createdAt: inquiries.createdAt,
            estimatedValue: inquiries.targetPrice,
          })
          .from(inquiries)
          .leftJoin(products, eq(inquiries.productId, products.id))
          .where(eq(inquiries.buyerId, buyerId))
          .orderBy(desc(inquiries.createdAt))
          .limit(5)
      ),
      safeSlice('recent RFQs', async () =>
        await db
          .select()
          .from(rfqs)
          .where(eq(rfqs.buyerId, buyerId))
          .orderBy(desc(rfqs.createdAt))
          .limit(5)
      ),
      safeSlice('recent quotations', async () => quotationList),
      safeSlice('recent orders', async () => orderList),
      safeSlice('recent conversations', async () => this.getBuyerConversations(buyerId)),
      safeSlice('recent notifications', async () =>
        await db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, buyerId))
          .orderBy(desc(notifications.createdAt))
          .limit(5)
      ),
    ]);

    return {
      activeRfqs,
      pendingInquiries,
      unreadMessages,
      favoriteProducts,
      totalQuotations: quotationList.length,
      totalOrders: orderList.length,
      totalSpent,
      recentInquiries,
      recentRFQs,
      recentQuotations,
      recentOrders,
      recentConversations,
      recentNotifications,
    };
  }

  // Inquiry Quotation operations
  async createInquiryQuotation(quotation: InsertInquiryQuotation): Promise<InquiryQuotation> {
    const [created] = await db.insert(inquiryQuotations).values(quotation).returning();
    return created;
  }

  async getInquiryQuotations(inquiryId?: string): Promise<any[]> {
    let whereCondition = undefined;
    if (inquiryId) {
      whereCondition = eq(inquiryQuotations.inquiryId, inquiryId);
    }

    const results = await db.select({
      id: inquiryQuotations.id,
      inquiryId: inquiryQuotations.inquiryId,
      pricePerUnit: inquiryQuotations.pricePerUnit,
      totalPrice: inquiryQuotations.totalPrice,
      moq: inquiryQuotations.moq,
      leadTime: inquiryQuotations.leadTime,
      paymentTerms: inquiryQuotations.paymentTerms,
      validUntil: inquiryQuotations.validUntil,
      message: inquiryQuotations.message,
      attachments: inquiryQuotations.attachments,
      status: inquiryQuotations.status,
      createdAt: inquiryQuotations.createdAt,
      // Join with inquiry data
      buyerId: inquiries.buyerId,
      productId: inquiries.productId,
      productName: products.name,
      productImage: products.images,
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: buyerProfiles.companyName,
      buyerCountry: buyerProfiles.country,
      inquiryQuantity: inquiries.quantity,
      inquiryMessage: inquiries.message,
      inquiryRequirements: inquiries.requirements,
      inquiryStatus: inquiries.status,
      supplierName: sql`'Admin Supplier'`.as('supplierName'),
      supplierCountry: sql`'USA'`.as('supplierCountry')
    })
      .from(inquiryQuotations)
      .leftJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(users, eq(inquiries.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(inquiries.buyerId, buyerProfiles.userId))
      .where(whereCondition)
      .orderBy(desc(inquiryQuotations.createdAt));

    // Transform results to include parsed product images
    return results.map(result => {
      let productImage = null;
      try {
        if (result.productImage && typeof result.productImage === 'string') {
          const parsed = JSON.parse(result.productImage);
          productImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
        }
      } catch (error) {
        productImage = null;
      }

      return {
        ...result,
        productImage
      };
    });
  }

  async updateInquiryQuotation(id: string, quotation: Partial<InsertInquiryQuotation>): Promise<InquiryQuotation | undefined> {
    const [updated] = await db.update(inquiryQuotations)
      .set(quotation)
      .where(eq(inquiryQuotations.id, id))
      .returning();
    return updated;
  }

  async getInquiryQuotation(id: string): Promise<InquiryQuotation | undefined> {
    const [quotation] = await db.select().from(inquiryQuotations).where(eq(inquiryQuotations.id, id)).limit(1);
    return quotation;
  }

  async getInquiryQuotationWithDetails(id: string): Promise<any | undefined> {
    const results = await db.select({
      id: inquiryQuotations.id,
      inquiryId: inquiryQuotations.inquiryId,
      pricePerUnit: inquiryQuotations.pricePerUnit,
      totalPrice: inquiryQuotations.totalPrice,
      moq: inquiryQuotations.moq,
      leadTime: inquiryQuotations.leadTime,
      paymentTerms: inquiryQuotations.paymentTerms,
      validUntil: inquiryQuotations.validUntil,
      message: inquiryQuotations.message,
      attachments: inquiryQuotations.attachments,
      status: inquiryQuotations.status,
      createdAt: inquiryQuotations.createdAt,
      // Join with inquiry data
      buyerId: inquiries.buyerId,
      productId: inquiries.productId,
      productName: products.name,
      productImage: products.images,
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: buyerProfiles.companyName,
      buyerCountry: buyerProfiles.country,
      inquiryQuantity: inquiries.quantity,
      inquiryMessage: inquiries.message,
      inquiryRequirements: inquiries.requirements,
      inquiryStatus: inquiries.status,
      supplierName: sql`'Admin Supplier'`.as('supplierName'),
      supplierCountry: sql`'USA'`.as('supplierCountry')
    })
      .from(inquiryQuotations)
      .leftJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(users, eq(inquiries.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(inquiries.buyerId, buyerProfiles.userId))
      .where(eq(inquiryQuotations.id, id))
      .limit(1);

    if (results.length === 0) {
      return undefined;
    }

    const result = results[0];

    // Parse product image
    let productImage = null;
    try {
      if (result.productImage && typeof result.productImage === 'string') {
        const parsed = JSON.parse(result.productImage);
        productImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      }
    } catch (error) {
      productImage = null;
    }

    return { ...result, productImage };
  }

  // Enhanced Order operations with joins
  async getOrdersWithDetails(filters?: { buyerId?: string; status?: string }): Promise<any[]> {
    let whereConditions = [];

    if (filters?.buyerId) {
      whereConditions.push(eq(orders.buyerId, filters.buyerId));
    }

    if (filters?.status) {
      whereConditions.push(eq(orders.status, filters.status));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const results = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      buyerId: orders.buyerId,
      inquiryId: orders.inquiryId,
      quotationId: orders.quotationId,
      productId: orders.productId,
      quantity: orders.quantity,
      unitPrice: orders.unitPrice,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      shippingAddress: orders.shippingAddress,
      trackingNumber: orders.trackingNumber,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      // Join with product and user data
      productName: products.name,
      productImage: products.images,
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: buyerProfiles.companyName
    })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(users, eq(orders.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(orders.buyerId, buyerProfiles.userId))
      .where(whereClause)
      .orderBy(desc(orders.createdAt));

    return results;
  }

  async getAdminOrders(filters?: { status?: string; search?: string }): Promise<any[]> {
    let whereConditions = [];

    if (filters?.status && filters.status !== 'all') {
      whereConditions.push(eq(orders.status, filters.status));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(users.firstName, `%${filters.search}%`),
          like(buyerProfiles.companyName, `%${filters.search}%`),
          like(orders.orderNumber, `%${filters.search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const results = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      buyerId: orders.buyerId,
      inquiryId: orders.inquiryId,
      quotationId: orders.quotationId,
      productId: orders.productId,
      quantity: orders.quantity,
      unitPrice: orders.unitPrice,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      shippingAddress: orders.shippingAddress,
      trackingNumber: orders.trackingNumber,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      // Join with product and user data
      productName: products.name,
      productImage: products.images,
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: buyerProfiles.companyName,
      buyerPhone: buyerProfiles.phone,
      buyerCountry: buyerProfiles.country
    })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(users, eq(orders.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(orders.buyerId, buyerProfiles.userId))
      .where(whereClause)
      .orderBy(desc(orders.createdAt));

    return results;
  }

  // Inquiry revision operations
  async createInquiryRevision(revision: InsertInquiryRevision): Promise<InquiryRevision> {
    const [result] = await db.insert(inquiryRevisions).values(revision).returning();
    return result;
  }

  async getInquiryRevisions(inquiryId: string): Promise<any[]> {
    const results = await db.select({
      id: inquiryRevisions.id,
      inquiryId: inquiryRevisions.inquiryId,
      revisionNumber: inquiryRevisions.revisionNumber,
      quantity: inquiryRevisions.quantity,
      targetPrice: inquiryRevisions.targetPrice,
      message: inquiryRevisions.message,
      requirements: inquiryRevisions.requirements,
      status: inquiryRevisions.status,
      createdBy: inquiryRevisions.createdBy,
      createdAt: inquiryRevisions.createdAt,
      // Join with user data to get creator name
      creatorName: users.firstName,
      creatorEmail: users.email
    })
      .from(inquiryRevisions)
      .leftJoin(users, eq(inquiryRevisions.createdBy, users.id))
      .where(eq(inquiryRevisions.inquiryId, inquiryId))
      .orderBy(asc(inquiryRevisions.revisionNumber));

    return results;
  }

  async updateInquiryStatus(inquiryId: string, status: string): Promise<void> {
    await db.update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, inquiryId));
  }

  async resolveSupplierUserId(identifier?: string | null): Promise<string | null> {
    if (!identifier) return null;

    const [profile] = await db.select({
      id: supplierProfiles.id,
      userId: supplierProfiles.userId
    })
      .from(supplierProfiles)
      .where(or(eq(supplierProfiles.id, identifier), eq(supplierProfiles.userId, identifier)))
      .limit(1);

    return profile?.userId || identifier;
  }

  // ==================== CHAT SYSTEM METHODS ====================

  async getBuyerConversations(buyerId: string) {
    await ensureConversationSchemaPatched();

    const supplierJoinCondition = or(
      eq(conversations.supplierId, supplierProfiles.id),
      eq(conversations.supplierId, supplierProfiles.userId)
    );

    const results = await db.select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      supplierId: sql<string>`COALESCE(${supplierProfiles.userId}, ${conversations.supplierId})`,
      supplierProfileId: supplierProfiles.id,
      adminId: conversations.adminId,
      type: conversations.type,
      subject: conversations.lastMessage,
      lastMessage: conversations.lastMessage,
      status: sql`'active'`.as('status'),
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      unreadCountBuyer: conversations.unreadCountBuyer,
      unreadCountSupplier: conversations.unreadCountSupplier,
      unreadCountAdmin: conversations.unreadCountAdmin,
      unreadCount: conversations.unreadCountBuyer,
      // Join with admin data
      adminName: users.firstName,
      adminEmail: users.email,
      adminCompany: users.companyName,
      productId: conversations.productId,
      productName: products.name,
      productImages: products.images,
      supplierName: supplierProfiles.storeName,
      supplierCompany: supplierProfiles.businessName,
      supplierSlug: supplierProfiles.storeSlug,
      supplierLogo: supplierProfiles.storeLogo,
      supplierCountry: supplierProfiles.country
    })
      .from(conversations)
      .leftJoin(users, eq(conversations.adminId, users.id))
      .leftJoin(products, eq(conversations.productId, products.id))
      .leftJoin(supplierProfiles, supplierJoinCondition)
      .where(eq(conversations.buyerId, buyerId))
      .orderBy(desc(conversations.lastMessageAt));

    return results;
  }

  async getAdminConversations(adminId: string) {
    await ensureConversationSchemaPatched();
    
    const supplierJoinCondition = or(
      eq(conversations.supplierId, supplierProfiles.id),
      eq(conversations.supplierId, supplierProfiles.userId)
    );

    const results = await db.select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      supplierId: sql<string>`COALESCE(${supplierProfiles.userId}, ${conversations.supplierId})`,
      supplierProfileId: supplierProfiles.id,
      adminId: conversations.adminId,
      type: conversations.type,
      subject: conversations.lastMessage,
      lastMessage: conversations.lastMessage,
      status: sql`'active'`.as('status'),
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      unreadCountBuyer: conversations.unreadCountBuyer,
      unreadCountSupplier: conversations.unreadCountSupplier,
      unreadCountAdmin: conversations.unreadCountAdmin,
      unreadCount: conversations.unreadCountAdmin,
      productId: conversations.productId,
      // Join with buyer data
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: users.companyName,
      productName: products.name,
      productImages: products.images,
      supplierName: supplierProfiles.storeName,
      supplierCompany: supplierProfiles.businessName,
      supplierSlug: supplierProfiles.storeSlug,
      supplierLogo: supplierProfiles.storeLogo,
      supplierCountry: supplierProfiles.country
    })
      .from(conversations)
      .leftJoin(users, eq(conversations.buyerId, users.id))
      .leftJoin(products, eq(conversations.productId, products.id))
      .leftJoin(supplierProfiles, supplierJoinCondition)
      .where(eq(conversations.adminId, adminId))
      .orderBy(desc(conversations.lastMessageAt));

    return results;
  }

  async getSupplierConversations(supplierId: string) {
    await ensureConversationSchemaPatched();
    
    // First resolve the supplier user ID
    const resolvedSupplierId = await this.resolveSupplierUserId(supplierId);
    
    const supplierJoinCondition = or(
      eq(conversations.supplierId, supplierProfiles.id),
      eq(conversations.supplierId, supplierProfiles.userId)
    );

    const whereCondition = or(
      eq(conversations.supplierId, supplierId),
      eq(conversations.supplierId, resolvedSupplierId || supplierId),
      eq(supplierProfiles.userId, supplierId)
    );

    const results = await db.select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      supplierId: sql<string>`COALESCE(${supplierProfiles.userId}, ${conversations.supplierId})`,
      supplierProfileId: supplierProfiles.id,
      adminId: conversations.adminId,
      type: conversations.type,
      subject: conversations.lastMessage,
      lastMessage: conversations.lastMessage,
      status: sql`'active'`.as('status'),
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      productId: conversations.productId,
      unreadCountBuyer: conversations.unreadCountBuyer,
      unreadCountSupplier: conversations.unreadCountSupplier,
      unreadCountAdmin: conversations.unreadCountAdmin,
      unreadCount: conversations.unreadCountSupplier,
      // Join with buyer data
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: users.companyName,
      productName: products.name,
      productImages: products.images,
      // Join with admin data
      adminName: sql<string>`admin_users.first_name`,
      adminEmail: sql<string>`admin_users.email`
    })
      .from(conversations)
      .leftJoin(users, eq(conversations.buyerId, users.id))
      .leftJoin(products, eq(conversations.productId, products.id))
      .leftJoin(supplierProfiles, supplierJoinCondition)
      .leftJoin(sql`users as admin_users`, sql`admin_users.id = ${conversations.adminId}`)
      .where(whereCondition)
      .orderBy(desc(conversations.lastMessageAt));

    return results;
  }

  async getAllConversationsForAdmin(adminId?: string) {
    await ensureConversationSchemaPatched();
    
    const supplierJoinCondition = or(
      eq(conversations.supplierId, supplierProfiles.id),
      eq(conversations.supplierId, supplierProfiles.userId)
    );

    let whereCondition = sql`1=1`; // Default condition - show all conversations for admin overview

    if (adminId) {
      // If specific admin ID provided, show only conversations where this admin is a participant
      whereCondition = eq(conversations.adminId, adminId);
    }

    const results = await db.select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      supplierId: sql<string>`COALESCE(${supplierProfiles.userId}, ${conversations.supplierId})`,
      supplierProfileId: supplierProfiles.id,
      adminId: conversations.adminId,
      type: conversations.type,
      subject: conversations.lastMessage,
      lastMessage: conversations.lastMessage,
      status: sql`'active'`.as('status'),
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      productId: conversations.productId,
      unreadCountBuyer: conversations.unreadCountBuyer,
      unreadCountSupplier: conversations.unreadCountSupplier,
      unreadCountAdmin: conversations.unreadCountAdmin,
      unreadCount: conversations.unreadCountAdmin,
      // Join with buyer data
      buyerName: users.firstName,
      buyerEmail: users.email,
      buyerCompany: users.companyName,
      // Join with product data
      productName: products.name,
      productImages: products.images,
      supplierName: supplierProfiles.storeName,
      supplierCompany: supplierProfiles.businessName,
      supplierSlug: supplierProfiles.storeSlug,
      supplierLogo: supplierProfiles.storeLogo,
      supplierCountry: supplierProfiles.country
    })
      .from(conversations)
      .leftJoin(users, eq(conversations.buyerId, users.id))
      .leftJoin(products, eq(conversations.productId, products.id))
      .leftJoin(supplierProfiles, supplierJoinCondition)
      .where(whereCondition)
      .orderBy(desc(conversations.lastMessageAt));

    return results;
  }

  async getConversationMessages(conversationId: string, userId: string, userRole?: string, limit: number = 50, before?: string): Promise<any[]> {
    await ensureConversationSchemaPatched();
    
    // Get conversation details to verify access and get participant info
    const [conversation] = await db.select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      supplierId: conversations.supplierId,
      adminId: conversations.adminId,
      type: conversations.type
    })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return [];
    }

    // Resolve supplier user ID if needed
    let normalizedSupplierId = conversation.supplierId;
    if (conversation.supplierId) {
      normalizedSupplierId = await this.resolveSupplierUserId(conversation.supplierId);
    }

    // Verify user has access to this conversation
    const hasAccess = userId === conversation.buyerId || 
                     userId === normalizedSupplierId || 
                     userId === conversation.adminId ||
                     userRole === 'admin';

    if (!hasAccess) {
      throw new Error('Access denied to conversation');
    }

    // Build query conditions
    const conditions = [eq(messages.conversationId, conversationId)];
    
    if (before) {
      // For pagination - get messages before the specified message ID
      conditions.push(sql`${messages.createdAt} < (SELECT created_at FROM messages WHERE id = ${before})`);
    }

    // Get messages with sender details
    const results = await db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      senderType: messages.senderType,
      content: messages.message,
      attachments: messages.attachments,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      // Join with sender data
      senderName: users.firstName,
      senderEmail: users.email,
      senderCompany: users.companyName
    })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    // Process results to ensure correct sender types and names
    const processedResults = results.map(msg => {
      let senderType = msg.senderType || 'buyer';
      let senderName = msg.senderName || 'User';

      // Determine sender type based on conversation participants
      if (msg.senderId === conversation.buyerId) {
        senderType = 'buyer';
      } else if (normalizedSupplierId && msg.senderId === normalizedSupplierId) {
        senderType = 'supplier';
      } else if (conversation.adminId && msg.senderId === conversation.adminId) {
        senderType = 'admin';
        senderName = msg.senderName || 'Admin';
      }

      return {
        ...msg,
        senderType,
        senderName,
        messageType: 'text' // Default message type
      };
    });

    // Return in chronological order (oldest first)
    return processedResults.reverse();
  }

  async createConversation(data: {
    buyerId: string;
    supplierId?: string;
    adminId?: string;
    productId?: string;
    type?: string;
  }): Promise<Conversation> {
    await ensureConversationSchemaPatched();
    
    // Determine conversation type based on participants
    let conversationType = data.type;
    if (!conversationType) {
      if (data.supplierId && data.adminId) {
        conversationType = 'support'; // Multi-party conversation
      } else if (data.supplierId) {
        conversationType = 'buyer_supplier';
      } else if (data.adminId) {
        conversationType = 'buyer_admin';
      } else {
        conversationType = 'buyer_support'; // Default fallback
      }
    }

    // Resolve supplier user ID if needed
    let resolvedSupplierId = null;
    if (data.supplierId) {
      resolvedSupplierId = await this.resolveSupplierUserId(data.supplierId);
    }

    // Check if conversation already exists for this combination
    const existingConditions = [eq(conversations.buyerId, data.buyerId)];
    
    if (resolvedSupplierId) {
      existingConditions.push(eq(conversations.supplierId, resolvedSupplierId));
    }
    if (data.adminId) {
      existingConditions.push(eq(conversations.adminId, data.adminId));
    }
    if (data.productId) {
      existingConditions.push(eq(conversations.productId, data.productId));
    }

    const [existing] = await db.select()
      .from(conversations)
      .where(and(...existingConditions))
      .limit(1);

    if (existing) {
      return existing;
    }

    // Create new conversation
    const [conversation] = await db.insert(conversations)
      .values({
        buyerId: data.buyerId,
        supplierId: resolvedSupplierId,
        adminId: data.adminId || null,
        productId: data.productId || null,
        type: conversationType,
        lastMessage: null,
        lastMessageAt: null,
        unreadCountBuyer: 0,
        unreadCountSupplier: 0,
        unreadCountAdmin: 0
      })
      .returning();

    return conversation;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    await ensureConversationSchemaPatched();
    
    const [conversation] = await db.select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      supplierId: conversations.supplierId,
      adminId: conversations.adminId,
      type: conversations.type
    })
      .from(conversations)
      .where(eq(conversations.id, message.conversationId))
      .limit(1);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Resolve supplier user ID if needed
    let normalizedSupplierId = conversation.supplierId;
    if (conversation.supplierId) {
      const resolvedSupplierId = await this.resolveSupplierUserId(conversation.supplierId);
      if (resolvedSupplierId && resolvedSupplierId !== conversation.supplierId) {
        normalizedSupplierId = resolvedSupplierId;
        await db.update(conversations)
          .set({ supplierId: resolvedSupplierId })
          .where(eq(conversations.id, conversation.id));
      }
    }

    // Determine sender type and receiver
    const isFromBuyer = message.senderId === conversation.buyerId;
    const isFromSupplier = normalizedSupplierId ? message.senderId === normalizedSupplierId : false;
    const isFromAdmin = conversation.adminId ? message.senderId === conversation.adminId : false;

    const senderType = isFromBuyer
      ? 'buyer'
      : isFromSupplier
        ? 'supplier'
        : isFromAdmin
          ? 'admin'
          : 'buyer';

    // Determine receiver ID based on conversation type and sender
    let receiverId = message.receiverId;
    if (!receiverId) {
      if (isFromBuyer) {
        receiverId = normalizedSupplierId || conversation.adminId;
      } else if (isFromSupplier) {
        receiverId = conversation.buyerId;
      } else if (isFromAdmin) {
        receiverId = conversation.buyerId;
      }
    }

    // Create the message
    const [created] = await db.insert(messages).values({
      ...message,
      receiverId,
      senderType
    }).returning();

    // Update conversation last message and increment unread counts
    const updateData: any = {
      lastMessage: message.message,
      lastMessageAt: new Date()
    };

    // Increment unread counts for recipients (not the sender)
    if (isFromBuyer) {
      // Buyer sent message - increment unread for supplier and admin
      if (normalizedSupplierId) {
        updateData.unreadCountSupplier = sql`COALESCE(${conversations.unreadCountSupplier}, 0) + 1`;
      }
      if (conversation.adminId) {
        updateData.unreadCountAdmin = sql`COALESCE(${conversations.unreadCountAdmin}, 0) + 1`;
      }
    } else if (isFromSupplier) {
      // Supplier sent message - increment unread for buyer and admin
      updateData.unreadCountBuyer = sql`COALESCE(${conversations.unreadCountBuyer}, 0) + 1`;
      if (conversation.adminId) {
        updateData.unreadCountAdmin = sql`COALESCE(${conversations.unreadCountAdmin}, 0) + 1`;
      }
    } else if (isFromAdmin) {
      // Admin sent message - increment unread for buyer and supplier
      updateData.unreadCountBuyer = sql`COALESCE(${conversations.unreadCountBuyer}, 0) + 1`;
      if (normalizedSupplierId) {
        updateData.unreadCountSupplier = sql`COALESCE(${conversations.unreadCountSupplier}, 0) + 1`;
      }
    }

    await db.update(conversations)
      .set(updateData)
      .where(eq(conversations.id, message.conversationId));

    return created;
  }

  async updateConversationLastMessage(conversationId: string) {
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    await ensureConversationSchemaPatched();
    
    // Get all conversations where the user is a participant
    const userConversations = await db.select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      supplierId: conversations.supplierId,
      adminId: conversations.adminId,
      unreadCountBuyer: conversations.unreadCountBuyer,
      unreadCountSupplier: conversations.unreadCountSupplier,
      unreadCountAdmin: conversations.unreadCountAdmin
    })
      .from(conversations)
      .where(or(
        eq(conversations.buyerId, userId),
        eq(conversations.supplierId, userId),
        eq(conversations.adminId, userId)
      ));

    let totalUnread = 0;

    for (const conversation of userConversations) {
      // Resolve supplier user ID if needed
      let normalizedSupplierId = conversation.supplierId;
      if (conversation.supplierId) {
        normalizedSupplierId = await this.resolveSupplierUserId(conversation.supplierId);
      }

      // Determine which unread count applies to this user
      if (userId === conversation.buyerId) {
        totalUnread += conversation.unreadCountBuyer || 0;
      } else if (normalizedSupplierId && userId === normalizedSupplierId) {
        totalUnread += conversation.unreadCountSupplier || 0;
      } else if (conversation.adminId && userId === conversation.adminId) {
        totalUnread += conversation.unreadCountAdmin || 0;
      }
    }

    return totalUnread;
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    await ensureConversationSchemaPatched();
    
    // Mark messages as read
    await db.update(messages)
      .set({
        isRead: true
      })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId)
        )
      );

    // Get conversation to determine user role and reset appropriate unread count
    const [conversation] = await db.select().from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation) {
      // Resolve supplier user ID if needed
      let normalizedSupplierId = conversation.supplierId;
      if (conversation.supplierId) {
        normalizedSupplierId = await this.resolveSupplierUserId(conversation.supplierId);
      }

      const updateData: any = {};
      
      // Determine which unread count to reset based on user role in conversation
      if (userId === conversation.buyerId) {
        updateData.unreadCountBuyer = 0;
      } else if (normalizedSupplierId && userId === normalizedSupplierId) {
        updateData.unreadCountSupplier = 0;
      } else if (conversation.adminId && userId === conversation.adminId) {
        updateData.unreadCountAdmin = 0;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(conversations)
          .set(updateData)
          .where(eq(conversations.id, conversationId));
      }
    }
  }



  async getAvailableAdmins() {
    const results = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      companyName: users.companyName
    })
      .from(users)
      .where(eq(users.role, 'admin'));

    return results;
  }

  async getConversationById(conversationId: string) {
    const [conversation] = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    return conversation;
  }
}

export const storage = new PostgresStorage();

