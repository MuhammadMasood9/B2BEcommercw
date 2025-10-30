import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== USERS & AUTHENTICATION ====================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyName: text("company_name"),
  phone: text("phone"),
  role: text("role").notNull().default("buyer"), // buyer, admin, supplier
  emailVerified: boolean("email_verified").default(false),
  isActive: boolean("is_active").default(true),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
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
  isFeatured: boolean("is_featured").default(false),
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
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  description: text("description"),
  categoryId: varchar("category_id"),
  specifications: json("specifications"), // Key-value pairs
  images: text("images").array(),
  videos: text("videos").array(),
  
  // Supplier Information
  supplierId: varchar("supplier_id"),
  status: varchar("status").default("draft"), // draft, pending_approval, approved, rejected
  isApproved: boolean("is_approved").default(false),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  rejectionReason: text("rejection_reason"),
  
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
  
  // Product Variants & Options
  colors: text("colors").array(), // Available colors: ["Black", "White", "Blue"]
  sizes: text("sizes").array(), // Available sizes: ["S", "M", "L", "XL"] or ["250g", "500g", "1kg"]
  keyFeatures: text("key_features").array(), // Array of key features
  customizationDetails: text("customization_details"), // Details about customization options
  
  // Certifications & Badges
  certifications: text("certifications").array(), // ["ISO9001", "CE", "RoHS"]
  hasTradeAssurance: boolean("has_trade_assurance").default(false),
  
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
  productId: varchar("product_id"), // Product-specific RFQ
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
  supplierId: varchar("supplier_id").notNull(), // Admin is the supplier
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
  supplierId: varchar("supplier_id"), // Route inquiries to specific suppliers
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

// ==================== INQUIRY QUOTATIONS ====================

export const inquiryQuotations = pgTable("inquiry_quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inquiryId: varchar("inquiry_id").notNull(),
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

export const insertInquiryQuotationSchema = createInsertSchema(inquiryQuotations).omit({
  id: true,
  createdAt: true,
});

export type InsertInquiryQuotation = z.infer<typeof insertInquiryQuotationSchema>;
export type InquiryQuotation = typeof inquiryQuotations.$inferSelect;

// ==================== INQUIRY REVISIONS ====================

export const inquiryRevisions = pgTable("inquiry_revisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inquiryId: varchar("inquiry_id").notNull(),
  revisionNumber: integer("revision_number").notNull(),
  quantity: integer("quantity").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }),
  message: text("message"),
  requirements: text("requirements"),
  status: text("status").default("pending"), // pending, replied, negotiating, closed
  createdBy: varchar("created_by").notNull(), // buyer_id or admin_id
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInquiryRevisionSchema = createInsertSchema(inquiryRevisions).omit({
  id: true,
  createdAt: true,
});

export type InsertInquiryRevision = z.infer<typeof insertInquiryRevisionSchema>;
export type InquiryRevision = typeof inquiryRevisions.$inferSelect;

// ==================== ORDERS ====================

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  buyerId: varchar("buyer_id").notNull(),
  customerId: varchar("customer_id"),
  inquiryId: varchar("inquiry_id"),
  quotationId: varchar("quotation_id"),
  rfqId: varchar("rfq_id"), // For RFQ-based orders
  supplierId: varchar("supplier_id"), // For multivendor orders
  parentOrderId: varchar("parent_order_id"), // For split orders
  productId: varchar("product_id"), // Made optional for RFQ orders
  quantity: integer("quantity"), // Made optional for RFQ orders
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }), // Made optional for RFQ orders
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  
  // Commission & Financial
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 15, scale: 2 }),
  supplierAmount: decimal("supplier_amount", { precision: 15, scale: 2 }),
  
  items: json("items").notNull(), // Array of order items
  status: text("status").default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded
  shippingAddress: json("shipping_address"),
  billingAddress: json("billing_address"),
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

// ==================== CONVERSATIONS ====================

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull(),
  unreadCountAdmin: varchar("unread_count_admin").notNull(), // This is actually adminId in existing table
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  unreadCountBuyer: integer("unread_count_buyer").default(0),
  unreadCountSupplier: integer("unread_count_supplier").default(0),
  productId: varchar("product_id"), // Add productId for product-based conversations
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
  buyerId: varchar("buyer_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  orderReference: text("order_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  // We inject buyerId from the authenticated session on the server
  buyerId: true,
  // Supplier is the admin in this app; set on server side
  supplierId: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// ==================== FAVORITES ====================

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  itemId: varchar("item_id").notNull(), // productId
  itemType: text("item_type").notNull(), // product
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;


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


// ==================== SESSIONS TABLE ====================

export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export type Session = typeof sessions.$inferSelect;

// ==================== NOTIFICATIONS ====================

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'info', 'success', 'error', 'warning'
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  relatedId: varchar("related_id"), // ID of related entity (inquiry, quotation, etc.)
  relatedType: text("related_type"), // Type of related entity
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ==================== ACTIVITY LOGS ====================

export const activity_logs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull(),
  adminName: text("admin_name").notNull(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  entityType: text("entity_type").notNull(), // 'inquiry', 'quotation', 'order', 'product', 'user', 'category', 'chat', 'system'
  entityId: varchar("entity_id"),
  entityName: text("entity_name"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activity_logs).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activity_logs.$inferSelect;

// ==================== SUPPLIER PROFILES ====================

export const supplierProfiles = pgTable("supplier_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  
  // Business Information
  businessName: varchar("business_name").notNull(),
  businessType: varchar("business_type").notNull(), // manufacturer, trading_company, wholesaler
  storeName: varchar("store_name").notNull().unique(),
  storeSlug: varchar("store_slug").notNull().unique(),
  storeDescription: text("store_description"),
  storeLogo: varchar("store_logo"),
  storeBanner: varchar("store_banner"),
  
  // Contact Details
  contactPerson: varchar("contact_person").notNull(),
  position: varchar("position").notNull(),
  phone: varchar("phone").notNull(),
  whatsapp: varchar("whatsapp"),
  wechat: varchar("wechat"),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  country: varchar("country").notNull(),
  website: varchar("website"),
  
  // Business Details
  yearEstablished: integer("year_established"),
  employees: varchar("employees"),
  factorySize: varchar("factory_size"),
  annualRevenue: varchar("annual_revenue"),
  mainProducts: text("main_products").array(),
  exportMarkets: text("export_markets").array(),
  
  // Verification & Status
  verificationLevel: varchar("verification_level").default("none"), // none, basic, business, premium, trade_assurance
  verificationDocs: json("verification_docs"),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  
  // Membership & Performance
  membershipTier: varchar("membership_tier").default("free"), // free, silver, gold, platinum
  subscriptionId: varchar("subscription_id"),
  subscriptionStatus: varchar("subscription_status"),
  subscriptionExpiry: timestamp("subscription_expiry"),
  
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  responseRate: decimal("response_rate", { precision: 5, scale: 2 }).default("0"),
  responseTime: varchar("response_time"),
  totalSales: decimal("total_sales", { precision: 15, scale: 2 }).default("0"),
  totalOrders: integer("total_orders").default(0),
  
  // Status & Control
  status: varchar("status").default("pending"), // pending, approved, rejected, suspended
  isActive: boolean("is_active").default(false),
  isFeatured: boolean("is_featured").default(false),
  isSuspended: boolean("is_suspended").default(false),
  suspensionReason: text("suspension_reason"),
  
  // Commission & Payout
  customCommissionRate: decimal("custom_commission_rate", { precision: 5, scale: 2 }),
  bankName: varchar("bank_name"),
  accountNumber: varchar("account_number"),
  accountName: varchar("account_name"),
  paypalEmail: varchar("paypal_email"),
  
  // Metadata
  totalProducts: integer("total_products").default(0),
  totalInquiries: integer("total_inquiries").default(0),
  storeViews: integer("store_views").default(0),
  followers: integer("followers").default(0),
  
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

// ==================== COMMISSION SETTINGS ====================

export const commissionSettings = pgTable("commission_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Global Rates
  defaultRate: decimal("default_rate", { precision: 5, scale: 2 }).default("5.0"),
  freeRate: decimal("free_rate", { precision: 5, scale: 2 }).default("5.0"),
  silverRate: decimal("silver_rate", { precision: 5, scale: 2 }).default("3.0"),
  goldRate: decimal("gold_rate", { precision: 5, scale: 2 }).default("2.0"),
  platinumRate: decimal("platinum_rate", { precision: 5, scale: 2 }).default("1.5"),
  
  // Category & Vendor Overrides
  categoryRates: json("category_rates"), // {categoryId: rate}
  vendorOverrides: json("vendor_overrides"), // {vendorId: rate}
  
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"),
});

export const insertCommissionSettingsSchema = createInsertSchema(commissionSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertCommissionSettings = z.infer<typeof insertCommissionSettingsSchema>;
export type CommissionSettings = typeof commissionSettings.$inferSelect;

// ==================== PAYOUTS ====================

export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  orderId: varchar("order_id"),
  
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 15, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).notNull(),
  
  method: varchar("method").notNull(), // bank_transfer, paypal, stripe
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  
  scheduledDate: timestamp("scheduled_date").notNull(),
  processedDate: timestamp("processed_date"),
  
  transactionId: varchar("transaction_id"),
  failureReason: text("failure_reason"),
  invoiceUrl: varchar("invoice_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payouts.$inferSelect;

// ==================== SUPPLIER REVIEWS ====================

export const supplierReviews = pgTable("supplier_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  orderId: varchar("order_id"),
  
  overallRating: integer("overall_rating").notNull(),
  productQuality: integer("product_quality"),
  communication: integer("communication"),
  shippingSpeed: integer("shipping_speed"),
  afterSales: integer("after_sales"),
  
  comment: text("comment"),
  images: text("images").array(),
  
  supplierResponse: text("supplier_response"),
  respondedAt: timestamp("responded_at"),
  
  isVerified: boolean("is_verified").default(false),
  isApproved: boolean("is_approved").default(true),
  helpfulCount: integer("helpful_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupplierReviewSchema = createInsertSchema(supplierReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupplierReview = z.infer<typeof insertSupplierReviewSchema>;
export type SupplierReview = typeof supplierReviews.$inferSelect;

// ==================== STAFF MEMBERS ====================

export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  
  email: varchar("email").notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull(), // owner, manager, product_manager, customer_service, accountant
  permissions: json("permissions").notNull(),
  
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;
