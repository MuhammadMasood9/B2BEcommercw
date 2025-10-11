import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== USERS & AUTHENTICATION ====================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("buyer"), // buyer, supplier, admin
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ==================== BUYER PROFILES ====================

export const buyerProfiles = pgTable("buyer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  companyName: text("company_name"),
  fullName: text("full_name"),
  phone: text("phone"),
  country: text("country"),
  industry: text("industry"),
  buyingPreferences: json("buying_preferences"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBuyerProfileSchema = createInsertSchema(buyerProfiles).omit({
  id: true,
  createdAt: true,
});

export type InsertBuyerProfile = z.infer<typeof insertBuyerProfileSchema>;
export type BuyerProfile = typeof buyerProfiles.$inferSelect;

// ==================== SUPPLIER PROFILES ====================

export const supplierProfiles = pgTable("supplier_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  companyName: text("company_name").notNull(),
  businessType: text("business_type"), // Manufacturer, Trading Company, Wholesaler
  fullName: text("full_name").notNull(),
  position: text("position"),
  phone: text("phone"),
  country: text("country"),
  city: text("city"),
  address: text("address"),
  mainProducts: text("main_products").array(),
  website: text("website"),
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  description: text("description"),
  yearEstablished: integer("year_established"),
  totalEmployees: integer("total_employees"),
  factorySize: text("factory_size"),
  responseRate: decimal("response_rate", { precision: 5, scale: 2 }).default("0"),
  responseTime: text("response_time"), // e.g., "< 24 hours"
  verificationLevel: text("verification_level").default("basic"), // basic, business, premium
  membershipTier: text("membership_tier").default("free"), // free, gold, premium
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalOrders: integer("total_orders").default(0),
  totalReviews: integer("total_reviews").default(0),
  productionCapacity: text("production_capacity"),
  oemOdmService: boolean("oem_odm_service").default(false),
  tradeAssurance: boolean("trade_assurance").default(false),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupplierProfileSchema = createInsertSchema(supplierProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupplierProfile = z.infer<typeof insertSupplierProfileSchema>;
export type SupplierProfile = typeof supplierProfiles.$inferSelect;

// ==================== CATEGORIES ====================

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: varchar("parent_id"),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// ==================== PRODUCTS ====================

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  description: text("description"),
  categoryId: varchar("category_id"),
  specifications: json("specifications"), // Key-value pairs
  images: text("images").array(),
  videos: text("videos").array(),
  
  // B2B Pricing
  minOrderQuantity: integer("min_order_quantity").notNull().default(1),
  priceRanges: json("price_ranges"), // [{ minQty, maxQty, pricePerUnit }]
  
  // Sample & Customization
  sampleAvailable: boolean("sample_available").default(false),
  samplePrice: decimal("sample_price", { precision: 10, scale: 2 }),
  customizationAvailable: boolean("customization_available").default(false),
  
  // Shipping & Delivery
  leadTime: text("lead_time"), // e.g., "15-30 days"
  port: text("port"), // e.g., "Shanghai/Ningbo"
  paymentTerms: text("payment_terms").array(), // ["T/T", "L/C", "Western Union"]
  
  // Stock & Status
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  
  // Analytics
  views: integer("views").default(0),
  inquiries: integer("inquiries").default(0),
  
  // Metadata
  tags: text("tags").array(),
  sku: text("sku"),
  metaData: json("meta_data"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ==================== RFQs (Request for Quotation) ====================

export const rfqs = pgTable("rfqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull(),
  title: text("title").notNull(),
  categoryId: varchar("category_id"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }),
  deliveryLocation: text("delivery_location"),
  expectedDate: timestamp("expected_date"),
  attachments: text("attachments").array(),
  status: text("status").default("open"), // open, closed
  quotationsCount: integer("quotations_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertRfqSchema = createInsertSchema(rfqs).omit({
  id: true,
  createdAt: true,
});

export type InsertRfq = z.infer<typeof insertRfqSchema>;
export type Rfq = typeof rfqs.$inferSelect;

// ==================== QUOTATIONS ====================

export const quotations = pgTable("quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  moq: integer("moq").notNull(),
  leadTime: text("lead_time"),
  paymentTerms: text("payment_terms"),
  validUntil: timestamp("valid_until"),
  message: text("message"),
  attachments: text("attachments").array(),
  status: text("status").default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
});

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;

// ==================== INQUIRIES ====================

export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  quantity: integer("quantity").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }),
  message: text("message"),
  requirements: text("requirements"),
  status: text("status").default("pending"), // pending, replied, negotiating, closed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

// ==================== CONVERSATIONS ====================

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  unreadCountBuyer: integer("unread_count_buyer").default(0),
  unreadCountSupplier: integer("unread_count_supplier").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// ==================== MESSAGES ====================

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  message: text("message").notNull(),
  attachments: text("attachments").array(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ==================== REVIEWS ====================

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id"),
  supplierId: varchar("supplier_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  orderReference: text("order_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// ==================== FAVORITES ====================

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(), // productId or supplierId
  itemType: text("item_type").notNull(), // product or supplier
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// ==================== CERTIFICATIONS ====================

export const certifications = pgTable("certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  certificateType: text("certificate_type").notNull(), // ISO, CE, FDA, etc.
  certificateName: text("certificate_name").notNull(),
  issuedBy: text("issued_by"),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  documentUrl: text("document_url"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
});

export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Certification = typeof certifications.$inferSelect;

// ==================== CUSTOMERS (Legacy/Compatibility) ====================

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  phone: text("phone"),
  country: text("country"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  isVerified: boolean("is_verified").default(false),
  accountType: text("account_type").default("buyer"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// ==================== SUPPLIERS (Legacy/Compatibility) ====================

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  country: text("country"),
  city: text("city"),
  address: text("address"),
  website: text("website"),
  logoUrl: text("logo_url"),
  description: text("description"),
  productsOffered: text("products_offered").array(),
  isVerified: boolean("is_verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalOrders: integer("total_orders").default(0),
  responseTime: text("response_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// ==================== ORDERS ====================

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  buyerId: varchar("buyer_id"),
  supplierId: varchar("supplier_id"),
  customerId: varchar("customer_id"),
  status: text("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  items: json("items").notNull(),
  shippingAddress: json("shipping_address"),
  billingAddress: json("billing_address"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
