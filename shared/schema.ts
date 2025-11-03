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

// ==================== BUYERS TABLE (Enhanced) ====================

export const buyers = pgTable("buyers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  companyName: varchar("company_name", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  businessType: varchar("business_type", { length: 50 }),
  annualVolume: decimal("annual_volume", { precision: 15, scale: 2 }),
  preferredPaymentTerms: text("preferred_payment_terms").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBuyerSchema = createInsertSchema(buyers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBuyer = z.infer<typeof insertBuyerSchema>;
export type Buyer = typeof buyers.$inferSelect;

// ==================== BUYER PROFILES (Legacy - Keep for compatibility) ====================

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

// ==================== PRODUCT ATTRIBUTES (Advanced Filtering) ====================

export const productAttributes = pgTable("product_attributes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  attributeName: varchar("attribute_name", { length: 100 }).notNull(),
  attributeValue: text("attribute_value").notNull(),
  isFilterable: boolean("is_filterable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductAttributeSchema = createInsertSchema(productAttributes).omit({
  id: true,
  createdAt: true,
});

export type InsertProductAttribute = z.infer<typeof insertProductAttributeSchema>;
export type ProductAttribute = typeof productAttributes.$inferSelect;

// ==================== RFQs (Request for Quotation) - Enhanced ====================

export const rfqs = pgTable("rfqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: varchar("category_id"),
  specifications: json("specifications"),
  quantity: integer("quantity").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }),
  budgetRange: json("budget_range"), // {min: 1000, max: 5000}
  deliveryLocation: varchar("delivery_location", { length: 255 }),
  requiredDeliveryDate: timestamp("required_delivery_date"),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  status: varchar("status", { length: 50 }).default("open"), // open, closed, expired
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRfqSchema = createInsertSchema(rfqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRfq = z.infer<typeof insertRfqSchema>;
export type Rfq = typeof rfqs.$inferSelect;

// ==================== QUOTATIONS - Enhanced ====================

export const quotations = pgTable("quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  rfqId: varchar("rfq_id"),
  inquiryId: varchar("inquiry_id"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull(),
  moq: integer("moq").notNull(),
  leadTime: varchar("lead_time", { length: 50 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  validityPeriod: integer("validity_period"), // days
  termsConditions: text("terms_conditions"),
  attachments: text("attachments").array(),
  status: varchar("status", { length: 50 }).default("sent"), // sent, accepted, rejected, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;

// ==================== INQUIRIES - Enhanced ====================

export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull(),
  supplierId: varchar("supplier_id"),
  productId: varchar("product_id"),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  quantity: integer("quantity"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, responded, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;



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

// ==================== CONVERSATIONS - Enhanced ====================

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 50 }).notNull(), // buyer_supplier, buyer_admin, supplier_admin
  buyerId: varchar("buyer_id"),
  supplierId: varchar("supplier_id"),
  adminId: varchar("admin_id"),
  subject: varchar("subject", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active"), // active, archived, closed
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// ==================== MESSAGES - Enhanced ====================

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // buyer, supplier, admin
  message: text("message").notNull(),
  attachments: text("attachments").array(),
  productReferences: varchar("product_references").array(), // Array of product IDs referenced in message
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

// ==================== AUTOMATED ALERTING SYSTEM ====================

export const systemAlerts = pgTable("system_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'system', 'security', 'business', 'compliance', 'performance', 'capacity'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  title: text("title").notNull(),
  message: text("message").notNull(),
  source: varchar("source").notNull(),
  entityId: varchar("entity_id"),
  entityType: varchar("entity_type"),
  metadata: json("metadata").default({}),
  
  // Alert Status
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedBy: varchar("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolved: boolean("resolved").default(false),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  
  // Escalation
  escalationLevel: integer("escalation_level").default(0),
  escalatedAt: timestamp("escalated_at"),
  escalatedTo: json("escalated_to").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const alertRules = pgTable("alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  
  // Rule Configuration
  type: text("type").notNull(), // 'threshold', 'anomaly', 'pattern', 'custom'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  metric: varchar("metric").notNull(),
  condition: varchar("condition").notNull(),
  threshold: decimal("threshold"),
  timeWindow: integer("time_window").default(300),
  
  // Rule Logic
  query: text("query"),
  aggregation: varchar("aggregation").default("avg"),
  
  // Notification Settings
  enabled: boolean("enabled").default(true),
  notificationChannels: json("notification_channels").default(["email"]),
  escalationRules: json("escalation_rules").default([]),
  
  // Suppression
  suppressDuration: integer("suppress_duration").default(3600),
  maxAlertsPerHour: integer("max_alerts_per_hour").default(10),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const alertConfiguration = pgTable("alert_configuration", {
  id: varchar("id").primaryKey().default("global"),
  globalSettings: json("global_settings").default({
    enableNotifications: true,
    defaultSeverity: "medium",
    retentionDays: 30,
    maxAlertsPerHour: 100,
    autoEscalationEnabled: true,
    escalationDelayMinutes: 30
  }),
  notificationChannels: json("notification_channels").default({
    email: { enabled: true, recipients: [], template: "default" },
    sms: { enabled: false, recipients: [] },
    webhook: { enabled: false, url: "", headers: {} },
    inApp: { enabled: true, showDesktop: true },
    slack: { enabled: false, webhookUrl: "", channel: "#alerts" }
  }),
  escalationMatrix: json("escalation_matrix").default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"),
});

export const alertHistory = pgTable("alert_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").notNull(),
  action: varchar("action").notNull(), // 'created', 'acknowledged', 'escalated', 'resolved', 'suppressed'
  performedBy: varchar("performed_by"),
  details: json("details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alertMetrics = pgTable("alert_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  hour: integer("hour").notNull(),
  
  // Counts by severity
  criticalCount: integer("critical_count").default(0),
  highCount: integer("high_count").default(0),
  mediumCount: integer("medium_count").default(0),
  lowCount: integer("low_count").default(0),
  
  // Counts by type
  systemCount: integer("system_count").default(0),
  securityCount: integer("security_count").default(0),
  businessCount: integer("business_count").default(0),
  complianceCount: integer("compliance_count").default(0),
  performanceCount: integer("performance_count").default(0),
  capacityCount: integer("capacity_count").default(0),
  
  // Response metrics
  avgAcknowledgmentTime: integer("avg_acknowledgment_time"),
  avgResolutionTime: integer("avg_resolution_time"),
  escalationCount: integer("escalation_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationDeliveryLog = pgTable("notification_delivery_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").notNull(),
  channel: varchar("channel").notNull(), // 'email', 'sms', 'webhook', 'in_app', 'slack'
  recipient: varchar("recipient").notNull(),
  status: text("status").notNull(), // 'pending', 'sent', 'delivered', 'failed', 'bounced'
  attemptCount: integer("attempt_count").default(1),
  errorMessage: text("error_message"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertHistorySchema = createInsertSchema(alertHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;
export type AlertRule = typeof alertRules.$inferSelect;
export type AlertConfiguration = typeof alertConfiguration.$inferSelect;
export type InsertAlertHistory = z.infer<typeof insertAlertHistorySchema>;
export type AlertHistory = typeof alertHistory.$inferSelect;
export type AlertMetrics = typeof alertMetrics.$inferSelect;
export type NotificationDeliveryLog = typeof notificationDeliveryLog.$inferSelect;

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

// ==================== DISPUTES ====================

export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  
  // Dispute Details
  type: varchar("type").notNull(), // 'product_quality', 'shipping_delay', 'wrong_item', 'payment_issue', 'communication', 'other'
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  
  // Evidence
  evidence: json("evidence").default([]),
  buyerEvidence: json("buyer_evidence").default([]),
  supplierEvidence: json("supplier_evidence").default([]),
  
  // Status & Resolution
  status: varchar("status").default("open"), // 'open', 'under_review', 'mediation', 'resolved', 'closed'
  priority: varchar("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  
  // Admin Mediation
  assignedMediator: varchar("assigned_mediator"),
  mediationNotes: text("mediation_notes"),
  resolutionSummary: text("resolution_summary"),
  resolutionType: varchar("resolution_type"), // 'refund', 'replacement', 'partial_refund', 'no_action', 'custom'
  
  // Timeline
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  
  // Escalation
  escalationLevel: integer("escalation_level").default(0),
  escalatedAt: timestamp("escalated_at"),
  escalationReason: text("escalation_reason"),
});

export const disputeMessages = pgTable("dispute_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  disputeId: varchar("dispute_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  senderType: varchar("sender_type").notNull(), // 'buyer', 'supplier', 'admin'
  
  message: text("message").notNull(),
  attachments: json("attachments").default([]),
  isInternal: boolean("is_internal").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderInterventions = pgTable("order_interventions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  adminId: varchar("admin_id").notNull(),
  
  // Intervention Details
  type: varchar("type").notNull(), // 'status_override', 'refund_processing', 'communication_facilitation', 'escalation'
  reason: text("reason").notNull(),
  actionTaken: text("action_taken").notNull(),
  
  // Before/After State
  previousStatus: varchar("previous_status"),
  newStatus: varchar("new_status"),
  previousData: json("previous_data"),
  newData: json("new_data"),
  
  // Impact
  financialImpact: decimal("financial_impact", { precision: 15, scale: 2 }).default("0"),
  commissionAdjustment: decimal("commission_adjustment", { precision: 15, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  disputeId: varchar("dispute_id"),
  buyerId: varchar("buyer_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  adminId: varchar("admin_id").notNull(),
  
  // Refund Details
  refundAmount: decimal("refund_amount", { precision: 15, scale: 2 }).notNull(),
  originalAmount: decimal("original_amount", { precision: 15, scale: 2 }).notNull(),
  refundType: varchar("refund_type").notNull(), // 'full', 'partial', 'shipping_only'
  reason: text("reason").notNull(),
  
  // Commission Handling
  commissionAdjustment: decimal("commission_adjustment", { precision: 15, scale: 2 }).default("0"),
  supplierDeduction: decimal("supplier_deduction", { precision: 15, scale: 2 }).default("0"),
  
  // Processing
  status: varchar("status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  paymentMethod: varchar("payment_method"),
  transactionId: varchar("transaction_id"),
  
  // Timeline
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  
  // Notes
  adminNotes: text("admin_notes"),
  buyerNotificationSent: boolean("buyer_notification_sent").default(false),
  supplierNotificationSent: boolean("supplier_notification_sent").default(false),
});

export const orderAnomalies = pgTable("order_anomalies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  
  // Anomaly Detection
  anomalyType: varchar("anomaly_type").notNull(), // 'unusual_amount', 'rapid_orders', 'payment_mismatch', 'shipping_inconsistency', 'supplier_pattern'
  severity: varchar("severity").default("medium"), // 'low', 'medium', 'high', 'critical'
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  
  // Details
  description: text("description").notNull(),
  detectedValues: json("detected_values"),
  expectedValues: json("expected_values"),
  
  // Status
  status: varchar("status").default("flagged"), // 'flagged', 'investigating', 'resolved', 'false_positive'
  reviewedBy: varchar("reviewed_by"),
  reviewNotes: text("review_notes"),
  
  // Timeline
  detectedAt: timestamp("detected_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  resolvedAt: timestamp("resolved_at"),
});

export const orderPerformanceMetrics = pgTable("order_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  hour: integer("hour"),
  
  // Order Volume
  totalOrders: integer("total_orders").default(0),
  completedOrders: integer("completed_orders").default(0),
  cancelledOrders: integer("cancelled_orders").default(0),
  disputedOrders: integer("disputed_orders").default(0),
  
  // Financial Metrics
  totalOrderValue: decimal("total_order_value", { precision: 15, scale: 2 }).default("0"),
  totalCommission: decimal("total_commission", { precision: 15, scale: 2 }).default("0"),
  totalRefunds: decimal("total_refunds", { precision: 15, scale: 2 }).default("0"),
  
  // Performance Metrics
  avgProcessingTime: integer("avg_processing_time"),
  avgDeliveryTime: integer("avg_delivery_time"),
  disputeRate: decimal("dispute_rate", { precision: 5, scale: 2 }),
  refundRate: decimal("refund_rate", { precision: 5, scale: 2 }),
  
  // Supplier Metrics
  activeSuppliers: integer("active_suppliers").default(0),
  topPerformingSuppliers: json("top_performing_suppliers").default([]),
  underperformingSuppliers: json("underperforming_suppliers").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types for disputes and order management
export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDisputeMessageSchema = createInsertSchema(disputeMessages).omit({
  id: true,
  createdAt: true,
});

export const insertOrderInterventionSchema = createInsertSchema(orderInterventions).omit({
  id: true,
  createdAt: true,
});

export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  requestedAt: true,
});

export const insertOrderAnomalySchema = createInsertSchema(orderAnomalies).omit({
  id: true,
  detectedAt: true,
});

export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDisputeMessage = z.infer<typeof insertDisputeMessageSchema>;
export type DisputeMessage = typeof disputeMessages.$inferSelect;
export type InsertOrderIntervention = z.infer<typeof insertOrderInterventionSchema>;
export type OrderIntervention = typeof orderInterventions.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type Refund = typeof refunds.$inferSelect;
export type InsertOrderAnomaly = z.infer<typeof insertOrderAnomalySchema>;
export type OrderAnomaly = typeof orderAnomalies.$inferSelect;
export type OrderPerformanceMetrics = typeof orderPerformanceMetrics.$inferSelect;
// ==================== PLATFORM SETTINGS MANAGEMENT ====================

export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Setting Identification
  category: varchar("category").notNull(), // 'general', 'commission', 'payout', 'verification', 'limits', 'features', 'security'
  key: varchar("key").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  
  // Setting Value and Type
  valueType: varchar("value_type").notNull(), // 'string', 'number', 'boolean', 'json', 'array'
  valueString: text("value_string"),
  valueNumber: decimal("value_number", { precision: 15, scale: 4 }),
  valueBoolean: boolean("value_boolean"),
  valueJson: json("value_json"),
  
  // Default and Validation
  defaultValue: json("default_value"),
  validationRules: json("validation_rules"), // { min, max, required, pattern, enum, etc. }
  
  // Environment and Deployment
  environment: varchar("environment").default("production"), // 'development', 'staging', 'production'
  requiresRestart: boolean("requires_restart").default(false),
  isSensitive: boolean("is_sensitive").default(false),
  
  // Dependencies and Impact
  dependencies: json("dependencies").default([]), // Array of setting keys this depends on
  affects: json("affects").default([]), // Array of systems/features this affects
  
  // Status and Control
  isActive: boolean("is_active").default(true),
  isReadonly: boolean("is_readonly").default(false),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
});

export const platformSettingsHistory = pgTable("platform_settings_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingId: varchar("setting_id").notNull(),
  
  // Change Details
  action: varchar("action").notNull(), // 'create', 'update', 'delete', 'rollback'
  previousValue: json("previous_value"),
  newValue: json("new_value"),
  changeReason: text("change_reason"),
  
  // Impact Analysis
  impactAssessment: json("impact_assessment"), // Predicted impact of the change
  validationResults: json("validation_results"), // Results of validation checks
  
  // Change Management
  changeRequestId: varchar("change_request_id"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // Rollback Information
  canRollback: boolean("can_rollback").default(true),
  rollbackData: json("rollback_data"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

export const platformSettingsValidation = pgTable("platform_settings_validation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Rule Definition
  name: varchar("name").notNull(),
  description: text("description"),
  ruleType: varchar("rule_type").notNull(), // 'dependency', 'conflict', 'range', 'format', 'business_rule'
  
  // Rule Logic
  conditions: json("conditions").notNull(), // Conditions that trigger this rule
  validationLogic: json("validation_logic").notNull(), // The actual validation logic
  errorMessage: text("error_message").notNull(),
  severity: varchar("severity").default("error"), // 'warning', 'error', 'critical'
  
  // Scope
  appliesTo: json("applies_to").default([]), // Array of setting keys or categories this applies to
  environments: json("environments").default(["production", "staging", "development"]),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const platformSettingsDeployments = pgTable("platform_settings_deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Deployment Details
  deploymentName: varchar("deployment_name").notNull(),
  description: text("description"),
  sourceEnvironment: varchar("source_environment").notNull(),
  targetEnvironment: varchar("target_environment").notNull(),
  
  // Settings Package
  settingsPackage: json("settings_package").notNull(), // Array of settings to deploy
  deploymentStrategy: varchar("deployment_strategy").default("immediate"), // 'immediate', 'scheduled', 'gradual'
  
  // Validation and Approval
  validationStatus: varchar("validation_status").default("pending"), // 'pending', 'passed', 'failed'
  validationResults: json("validation_results"),
  approvalStatus: varchar("approval_status").default("pending"), // 'pending', 'approved', 'rejected'
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // Deployment Execution
  status: varchar("status").default("draft"), // 'draft', 'scheduled', 'in_progress', 'completed', 'failed', 'rolled_back'
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Rollback Information
  rollbackPlan: json("rollback_plan"),
  canRollback: boolean("can_rollback").default(true),
  rollbackDeadline: timestamp("rollback_deadline"),
  
  // Results and Monitoring
  deploymentResults: json("deployment_results"),
  errorDetails: json("error_details"),
  performanceImpact: json("performance_impact"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const platformSettingsImpact = pgTable("platform_settings_impact", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingId: varchar("setting_id").notNull(),
  
  // Impact Assessment
  impactType: varchar("impact_type").notNull(), // 'performance', 'security', 'functionality', 'financial', 'user_experience'
  severity: varchar("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  description: text("description").notNull(),
  
  // Affected Systems
  affectedSystems: json("affected_systems").default([]), // Array of system components affected
  affectedUsers: json("affected_users").default([]), // Array of user types affected
  
  // Metrics and Monitoring
  metricsToMonitor: json("metrics_to_monitor").default([]), // Metrics that should be monitored after change
  expectedChanges: json("expected_changes"), // Expected changes in metrics
  
  // Mitigation
  mitigationSteps: json("mitigation_steps").default([]), // Steps to mitigate negative impact
  rollbackTriggers: json("rollback_triggers").default([]), // Conditions that should trigger rollback
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by"),
});

// Schema types for platform settings
export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformSettingsHistorySchema = createInsertSchema(platformSettingsHistory).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformSettingsValidationSchema = createInsertSchema(platformSettingsValidation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformSettingsDeploymentSchema = createInsertSchema(platformSettingsDeployments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformSettingsImpactSchema = createInsertSchema(platformSettingsImpact).omit({
  id: true,
  createdAt: true,
});

export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSettingsHistory = z.infer<typeof insertPlatformSettingsHistorySchema>;
export type PlatformSettingsHistory = typeof platformSettingsHistory.$inferSelect;
export type InsertPlatformSettingsValidation = z.infer<typeof insertPlatformSettingsValidationSchema>;
export type PlatformSettingsValidation = typeof platformSettingsValidation.$inferSelect;
export type InsertPlatformSettingsDeployment = z.infer<typeof insertPlatformSettingsDeploymentSchema>;
export type PlatformSettingsDeployment = typeof platformSettingsDeployments.$inferSelect;
export type InsertPlatformSettingsImpact = z.infer<typeof insertPlatformSettingsImpactSchema>;
export type PlatformSettingsImpact = typeof platformSettingsImpact.$inferSelect;

// ==================== ADMIN ACCESS CONTROL SYSTEM ====================

export const adminRoles = pgTable("admin_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  
  // Role Hierarchy
  level: integer("level").notNull().default(0), // Higher number = more permissions
  parentRoleId: varchar("parent_role_id"),
  
  // Permissions
  permissions: json("permissions").notNull().default({}),
  resourcePermissions: json("resource_permissions").notNull().default({}), // Resource-level permissions
  
  // Status and Control
  isActive: boolean("is_active").default(true),
  isSystemRole: boolean("is_system_role").default(false), // Cannot be deleted
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  
  // Role Assignment
  roleId: varchar("role_id").notNull(),
  additionalPermissions: json("additional_permissions").default({}), // User-specific permission overrides
  
  // Access Control
  isActive: boolean("is_active").default(true),
  isLocked: boolean("is_locked").default(false),
  lockReason: text("lock_reason"),
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by"),
  
  // Session Management
  maxConcurrentSessions: integer("max_concurrent_sessions").default(3),
  sessionTimeoutMinutes: integer("session_timeout_minutes").default(480), // 8 hours
  requireMfa: boolean("require_mfa").default(false),
  
  // Security
  lastLogin: timestamp("last_login"),
  lastLoginIp: varchar("last_login_ip"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastFailedLogin: timestamp("last_failed_login"),
  passwordChangedAt: timestamp("password_changed_at"),
  mustChangePassword: boolean("must_change_password").default(false),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
});

export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull(),
  sessionToken: varchar("session_token").notNull().unique(),
  
  // Session Details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  deviceFingerprint: varchar("device_fingerprint"),
  
  // Status and Control
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivity: timestamp("last_activity").defaultNow(),
  
  // Security
  createdAt: timestamp("created_at").defaultNow(),
  terminatedAt: timestamp("terminated_at"),
  terminationReason: varchar("termination_reason"), // 'logout', 'timeout', 'admin_action', 'security_violation'
});

export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull(),
  sessionId: varchar("session_id"),
  
  // Action Details
  action: varchar("action").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // 'authentication', 'authorization', 'data_modification', 'system_configuration', 'security'
  
  // Target Information
  entityType: varchar("entity_type"), // 'user', 'supplier', 'product', 'order', 'setting', etc.
  entityId: varchar("entity_id"),
  entityName: varchar("entity_name"),
  
  // Change Tracking
  previousValue: json("previous_value"),
  newValue: json("new_value"),
  
  // Request Context
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  requestMethod: varchar("request_method"),
  requestPath: varchar("request_path"),
  requestParams: json("request_params"),
  
  // Security and Risk
  riskLevel: varchar("risk_level").default("low"), // 'low', 'medium', 'high', 'critical'
  securityFlags: json("security_flags").default([]), // Array of security concerns
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

export const permissionResources = pgTable("permission_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  
  // Resource Hierarchy
  parentResourceId: varchar("parent_resource_id"),
  resourcePath: varchar("resource_path").notNull(), // e.g., 'admin.suppliers.management'
  
  // Available Actions
  availableActions: json("available_actions").notNull().default(["read", "write", "delete", "approve"]),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const securityAuditEvents = pgTable("security_audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Event Classification
  eventType: varchar("event_type").notNull(), // 'login_success', 'login_failure', 'permission_denied', 'suspicious_activity', 'data_breach_attempt'
  severity: varchar("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  category: varchar("category").notNull(), // 'authentication', 'authorization', 'data_access', 'system_security'
  
  // Event Details
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  
  // Context
  adminUserId: varchar("admin_user_id"),
  sessionId: varchar("session_id"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  // Risk Assessment
  riskScore: integer("risk_score").default(0), // 0-100
  threatIndicators: json("threat_indicators").default([]),
  
  // Response and Resolution
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedBy: varchar("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolved: boolean("resolved").default(false),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accessPatternAnalysis = pgTable("access_pattern_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull(),
  
  // Pattern Details
  patternType: varchar("pattern_type").notNull(), // 'login_time', 'ip_location', 'resource_access', 'session_duration'
  patternData: json("pattern_data").notNull(),
  
  // Analysis Results
  isAnomaly: boolean("is_anomaly").default(false),
  anomalyScore: decimal("anomaly_score", { precision: 5, scale: 2 }).default("0.0"), // 0.0 to 100.0
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }).default("0.0"), // 0.0 to 100.0
  
  // Baseline Comparison
  baselineData: json("baseline_data"),
  deviationMetrics: json("deviation_metrics"),
  
  // Actions Taken
  alertGenerated: boolean("alert_generated").default(false),
  actionRequired: boolean("action_required").default(false),
  actionsTaken: json("actions_taken").default([]),
  
  // Metadata
  analysisDate: timestamp("analysis_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types for admin access control
export const insertAdminRoleSchema = createInsertSchema(adminRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
});

export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPermissionResourceSchema = createInsertSchema(permissionResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSecurityAuditEventSchema = createInsertSchema(securityAuditEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccessPatternAnalysisSchema = createInsertSchema(accessPatternAnalysis).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminRole = z.infer<typeof insertAdminRoleSchema>;
export type AdminRole = typeof adminRoles.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminActivityLog = z.infer<typeof insertAdminActivityLogSchema>;
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type InsertPermissionResource = z.infer<typeof insertPermissionResourceSchema>;
export type PermissionResource = typeof permissionResources.$inferSelect;
export type InsertSecurityAuditEvent = z.infer<typeof insertSecurityAuditEventSchema>;
export type SecurityAuditEvent = typeof securityAuditEvents.$inferSelect;
export type InsertAccessPatternAnalysis = z.infer<typeof insertAccessPatternAnalysisSchema>;
export type AccessPatternAnalysis = typeof accessPatternAnalysis.$inferSelect;

// ================ COMMUNICATION AND NOTIFICATION MANAGEMENT ================

export const communicationTemplates = pgTable("communication_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template Identification
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'announcement', 'policy_update', 'promotional', 'system_notification', 'approval', 'rejection'
  type: varchar("type").notNull(), // 'email', 'sms', 'push', 'in_app'
  
  // Template Content
  subject: varchar("subject"), // For email templates
  content: text("content").notNull(),
  htmlContent: text("html_content"), // For rich HTML emails
  
  // Personalization
  variables: json("variables").default([]), // Array of available variables like {{firstName}}, {{companyName}}
  defaultValues: json("default_values").default({}), // Default values for variables
  
  // Targeting
  targetAudience: varchar("target_audience").notNull(), // 'all', 'suppliers', 'buyers', 'admins', 'custom'
  audienceCriteria: json("audience_criteria").default({}), // Criteria for custom targeting
  
  // Template Settings
  isActive: boolean("is_active").default(true),
  isSystemTemplate: boolean("is_system_template").default(false), // System templates cannot be deleted
  requiresApproval: boolean("requires_approval").default(false),
  
  // A/B Testing
  isAbTest: boolean("is_ab_test").default(false),
  abTestConfig: json("ab_test_config").default({}),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
  updatedBy: varchar("updated_by"),
});

export const bulkCommunications = pgTable("bulk_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Communication Details
  name: varchar("name").notNull(),
  description: text("description"),
  templateId: varchar("template_id"),
  
  // Content
  subject: varchar("subject"),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  
  // Targeting
  targetType: varchar("target_type").notNull(), // 'all', 'segment', 'individual', 'custom_query'
  targetCriteria: json("target_criteria").notNull(), // Targeting criteria and filters
  estimatedRecipients: integer("estimated_recipients").default(0),
  actualRecipients: integer("actual_recipients").default(0),
  
  // Delivery Settings
  deliveryMethod: varchar("delivery_method").notNull(), // 'immediate', 'scheduled', 'drip'
  scheduledAt: timestamp("scheduled_at"),
  deliveryTimezone: varchar("delivery_timezone").default("UTC"),
  
  // Channel Configuration
  channels: json("channels").notNull(), // Array of channels: ['email', 'sms', 'push', 'in_app']
  channelSettings: json("channel_settings").default({}), // Channel-specific settings
  
  // Personalization
  personalizationData: json("personalization_data").default({}),
  useDynamicContent: boolean("use_dynamic_content").default(false),
  
  // Status and Control
  status: varchar("status").default("draft"), // 'draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled'
  approvalStatus: varchar("approval_status").default("pending"), // 'pending', 'approved', 'rejected'
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // Delivery Tracking
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  pausedAt: timestamp("paused_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Performance Metrics
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  bouncedCount: integer("bounced_count").default(0),
  unsubscribedCount: integer("unsubscribed_count").default(0),
  failedCount: integer("failed_count").default(0),
  
  // Error Handling
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  errorDetails: json("error_details").default({}),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const communicationRecipients = pgTable("communication_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communicationId: varchar("communication_id").notNull(),
  
  // Recipient Details
  userId: varchar("user_id").notNull(),
  userType: varchar("user_type").notNull(), // 'supplier', 'buyer', 'admin'
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  
  // Personalization Data
  personalizationData: json("personalization_data").default({}),
  
  // Delivery Status per Channel
  emailStatus: varchar("email_status").default("pending"), // 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  smsStatus: varchar("sms_status").default("pending"),
  pushStatus: varchar("push_status").default("pending"),
  inAppStatus: varchar("in_app_status").default("pending"),
  
  // Delivery Timestamps
  emailSentAt: timestamp("email_sent_at"),
  emailDeliveredAt: timestamp("email_delivered_at"),
  emailOpenedAt: timestamp("email_opened_at"),
  emailClickedAt: timestamp("email_clicked_at"),
  smsSentAt: timestamp("sms_sent_at"),
  smsDeliveredAt: timestamp("sms_delivered_at"),
  pushSentAt: timestamp("push_sent_at"),
  pushDeliveredAt: timestamp("push_delivered_at"),
  inAppSentAt: timestamp("in_app_sent_at"),
  inAppReadAt: timestamp("in_app_read_at"),
  
  // Error Tracking
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  retryCount: integer("retry_count").default(0),
  
  // Engagement Tracking
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default("0"),
  interactionCount: integer("interaction_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  
  // Channel Preferences
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(true),
  inAppEnabled: boolean("in_app_enabled").default(true),
  
  // Notification Type Preferences
  marketingEmails: boolean("marketing_emails").default(true),
  systemNotifications: boolean("system_notifications").default(true),
  orderUpdates: boolean("order_updates").default(true),
  inquiryNotifications: boolean("inquiry_notifications").default(true),
  promotionalMessages: boolean("promotional_messages").default(false),
  
  // Frequency Settings
  digestFrequency: varchar("digest_frequency").default("daily"), // 'immediate', 'hourly', 'daily', 'weekly'
  quietHoursStart: varchar("quiet_hours_start"), // TIME format as string
  quietHoursEnd: varchar("quiet_hours_end"), // TIME format as string
  timezone: varchar("timezone").default("UTC"),
  
  // Contact Information
  preferredEmail: varchar("preferred_email"),
  preferredPhone: varchar("preferred_phone"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const communicationAnalytics = pgTable("communication_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Time Period
  date: timestamp("date").notNull(),
  hour: integer("hour"), // For hourly analytics
  
  // Communication Reference
  communicationId: varchar("communication_id"),
  templateId: varchar("template_id"),
  channel: varchar("channel").notNull(),
  
  // Volume Metrics
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  failedCount: integer("failed_count").default(0),
  bouncedCount: integer("bounced_count").default(0),
  
  // Engagement Metrics
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  unsubscribedCount: integer("unsubscribed_count").default(0),
  
  // Performance Metrics
  deliveryRate: decimal("delivery_rate", { precision: 5, scale: 2 }).default("0"), // (delivered / sent) * 100
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"), // (opened / delivered) * 100
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"), // (clicked / delivered) * 100
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0"), // (bounced / sent) * 100
  unsubscribeRate: decimal("unsubscribe_rate", { precision: 5, scale: 2 }).default("0"), // (unsubscribed / delivered) * 100
  
  // Audience Segmentation
  audienceType: varchar("audience_type"), // 'suppliers', 'buyers', 'all'
  audienceSegment: varchar("audience_segment"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const automatedNotificationRules = pgTable("automated_notification_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Rule Identification
  name: varchar("name").notNull(),
  description: text("description"),
  
  // Trigger Configuration
  triggerEvent: varchar("trigger_event").notNull(), // 'user_signup', 'order_placed', 'inquiry_received', 'payment_completed', etc.
  triggerConditions: json("trigger_conditions").default({}), // Additional conditions for triggering
  
  // Template and Content
  templateId: varchar("template_id"),
  customContent: json("custom_content"), // Override template content if needed
  
  // Targeting
  targetAudience: varchar("target_audience").notNull(), // 'event_user', 'admins', 'suppliers', 'custom'
  audienceFilter: json("audience_filter").default({}),
  
  // Delivery Settings
  channels: json("channels").notNull(), // Array of channels to use
  deliveryDelay: integer("delivery_delay").default(0), // Delay in minutes before sending
  maxFrequency: varchar("max_frequency").default("unlimited"), // 'once', 'daily', 'weekly', 'unlimited'
  
  // Smart Delivery
  respectQuietHours: boolean("respect_quiet_hours").default(true),
  optimizeSendTime: boolean("optimize_send_time").default(false),
  
  // Status and Control
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(5), // 1-10, higher number = higher priority
  
  // Performance Tracking
  totalTriggered: integer("total_triggered").default(0),
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
  updatedBy: varchar("updated_by"),
});

export const notificationQueue = pgTable("notification_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Queue Information
  priority: integer("priority").default(5), // 1-10, higher = more urgent
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  
  // Notification Details
  userId: varchar("user_id").notNull(),
  channel: varchar("channel").notNull(),
  notificationType: varchar("notification_type").notNull(),
  
  // Content
  subject: varchar("subject"),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  
  // Delivery Information
  recipientEmail: varchar("recipient_email"),
  recipientPhone: varchar("recipient_phone"),
  
  // Processing Status
  status: varchar("status").default("queued"), // 'queued', 'processing', 'sent', 'failed', 'cancelled'
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  
  // Error Handling
  errorMessage: text("error_message"),
  nextRetryAt: timestamp("next_retry_at"),
  
  // Reference Data
  communicationId: varchar("communication_id"),
  templateId: varchar("template_id"),
  ruleId: varchar("rule_id"), // For automated notifications
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const unsubscribeRequests = pgTable("unsubscribe_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User Information
  userId: varchar("user_id"),
  email: varchar("email").notNull(),
  
  // Unsubscribe Details
  unsubscribeType: varchar("unsubscribe_type").notNull(), // 'all', 'marketing', 'promotional', 'specific_template'
  templateId: varchar("template_id"), // For specific template unsubscribes
  communicationId: varchar("communication_id"), // Reference to the communication that triggered unsubscribe
  
  // Request Information
  reason: varchar("reason"), // 'too_frequent', 'not_relevant', 'never_signed_up', 'other'
  feedback: text("feedback"),
  
  // Processing
  status: varchar("status").default("active"), // 'active', 'resubscribed'
  processedAt: timestamp("processed_at").defaultNow(),
  resubscribedAt: timestamp("resubscribed_at"),
  
  // Metadata
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types for communication system
export const insertCommunicationTemplateSchema = createInsertSchema(communicationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBulkCommunicationSchema = createInsertSchema(bulkCommunications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationRecipientSchema = createInsertSchema(communicationRecipients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationAnalyticsSchema = createInsertSchema(communicationAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertAutomatedNotificationRuleSchema = createInsertSchema(automatedNotificationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUnsubscribeRequestSchema = createInsertSchema(unsubscribeRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertCommunicationTemplate = z.infer<typeof insertCommunicationTemplateSchema>;
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;
export type InsertBulkCommunication = z.infer<typeof insertBulkCommunicationSchema>;
export type BulkCommunication = typeof bulkCommunications.$inferSelect;
export type InsertCommunicationRecipient = z.infer<typeof insertCommunicationRecipientSchema>;
export type CommunicationRecipient = typeof communicationRecipients.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertCommunicationAnalytics = z.infer<typeof insertCommunicationAnalyticsSchema>;
export type CommunicationAnalytics = typeof communicationAnalytics.$inferSelect;
export type InsertAutomatedNotificationRule = z.infer<typeof insertAutomatedNotificationRuleSchema>;
export type AutomatedNotificationRule = typeof automatedNotificationRules.$inferSelect;
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;
export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type InsertUnsubscribeRequest = z.infer<typeof insertUnsubscribeRequestSchema>;
export type UnsubscribeRequest = typeof unsubscribeRequests.$inferSelect;
// =================== COMPLIANCE AND AUDIT MANAGEMENT SYSTEM ====================

export const comprehensiveAuditLogs = pgTable("comprehensive_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Event Classification
  eventType: varchar("event_type").notNull(), // 'admin_action', 'system_event', 'security_event', 'compliance_event', 'data_modification'
  category: varchar("category").notNull(), // 'authentication', 'authorization', 'data_access', 'financial', 'supplier_management', 'content_moderation'
  subcategory: varchar("subcategory"),
  
  // Event Details
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  action: varchar("action").notNull(),
  
  // Actor Information
  actorId: varchar("actor_id").notNull(),
  actorType: varchar("actor_type").notNull(), // 'admin', 'system', 'supplier', 'buyer'
  actorName: varchar("actor_name").notNull(),
  sessionId: varchar("session_id"),
  
  // Target Information
  targetType: varchar("target_type"), // 'user', 'supplier', 'product', 'order', 'setting', 'system'
  targetId: varchar("target_id"),
  targetName: varchar("target_name"),
  
  // Change Tracking (Immutable)
  previousState: json("previous_state"),
  newState: json("new_state"),
  changeSummary: text("change_summary"),
  
  // Request Context
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  requestMethod: varchar("request_method"),
  requestPath: varchar("request_path"),
  requestParams: json("request_params"),
  responseStatus: integer("response_status"),
  
  // Compliance and Risk
  complianceTags: text("compliance_tags").array(), // Array of compliance frameworks this relates to
  riskLevel: varchar("risk_level").default("low"), // 'low', 'medium', 'high', 'critical'
  sensitivityLevel: varchar("sensitivity_level").default("public"), // 'public', 'internal', 'confidential', 'restricted'
  
  // Immutability and Integrity
  recordHash: varchar("record_hash").notNull(), // Hash of the record for integrity verification
  previousRecordHash: varchar("previous_record_hash"), // Hash of previous record for chain integrity
  isImmutable: boolean("is_immutable").default(true),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  retentionUntil: timestamp("retention_until"), // When this record can be archived/deleted
});

export const compliancePolicies = pgTable("compliance_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Policy Information
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  policyType: varchar("policy_type").notNull(), // 'regulatory', 'internal', 'security', 'data_protection'
  framework: varchar("framework").notNull(), // 'GDPR', 'SOX', 'PCI_DSS', 'ISO27001', 'INTERNAL'
  
  // Policy Rules
  rules: json("rules").notNull(), // Array of policy rules and conditions
  enforcementLevel: varchar("enforcement_level").default("warning"), // 'info', 'warning', 'error', 'critical'
  autoRemediation: boolean("auto_remediation").default(false),
  
  // Scope and Applicability
  appliesTo: json("applies_to").default([]), // Array of entity types this applies to
  environments: json("environments").default(["production"]), // Environments where this applies
  
  // Status and Lifecycle
  status: varchar("status").default("active"), // 'draft', 'active', 'deprecated', 'archived'
  effectiveDate: timestamp("effective_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
  updatedBy: varchar("updated_by"),
});

export const complianceViolations = pgTable("compliance_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Violation Details
  policyId: varchar("policy_id").notNull(),
  violationType: varchar("violation_type").notNull(), // 'policy_breach', 'data_leak', 'unauthorized_access', 'retention_violation'
  severity: varchar("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  
  // Context
  entityType: varchar("entity_type"), // What was affected
  entityId: varchar("entity_id"),
  entityName: varchar("entity_name"),
  auditLogId: varchar("audit_log_id"), // Reference to the audit log that detected this
  
  // Detection
  detectedBy: varchar("detected_by").notNull(), // 'automated', 'manual', 'external_audit'
  detectionMethod: varchar("detection_method"), // 'rule_engine', 'anomaly_detection', 'user_report'
  detectionConfidence: decimal("detection_confidence", { precision: 5, scale: 2 }).default("0.0"), // 0.0 to 100.0
  
  // Impact Assessment
  impactLevel: varchar("impact_level").default("low"), // 'low', 'medium', 'high', 'critical'
  affectedRecords: integer("affected_records").default(0),
  financialImpact: decimal("financial_impact", { precision: 15, scale: 2 }).default("0"),
  regulatoryImpact: text("regulatory_impact"),
  
  // Status and Resolution
  status: varchar("status").default("open"), // 'open', 'investigating', 'remediation', 'resolved', 'false_positive'
  assignedTo: varchar("assigned_to"),
  resolutionPlan: text("resolution_plan"),
  remediationSteps: json("remediation_steps").default([]),
  resolutionSummary: text("resolution_summary"),
  
  // Timeline
  detectedAt: timestamp("detected_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  dueDate: timestamp("due_date"),
  
  // Escalation
  escalationLevel: integer("escalation_level").default(0),
  escalatedAt: timestamp("escalated_at"),
  escalatedTo: json("escalated_to").default([]),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dataRetentionPolicies = pgTable("data_retention_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Policy Information
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  dataType: varchar("data_type").notNull(), // 'audit_logs', 'user_data', 'financial_records', 'communication_logs'
  
  // Retention Rules
  retentionPeriodDays: integer("retention_period_days").notNull(),
  archiveAfterDays: integer("archive_after_days"),
  deleteAfterDays: integer("delete_after_days"),
  
  // Conditions
  conditions: json("conditions").default({}), // Conditions that determine when this policy applies
  legalHoldExempt: boolean("legal_hold_exempt").default(false), // Whether this data type can be subject to legal holds
  
  // Geographic and Regulatory
  geographicScope: json("geographic_scope").default([]), // Array of countries/regions this applies to
  regulatoryBasis: json("regulatory_basis").default([]), // Array of regulations that require this retention
  
  // Processing Rules
  anonymizationRules: json("anonymization_rules").default({}), // Rules for anonymizing data before deletion
  secureDeletionRequired: boolean("secure_deletion_required").default(true),
  backupRetentionDays: integer("backup_retention_days"),
  
  // Status
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(100), // Higher number = higher priority when policies conflict
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
  updatedBy: varchar("updated_by"),
});

export const dataRetentionSchedules = pgTable("data_retention_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Schedule Information
  policyId: varchar("policy_id").notNull(),
  scheduleName: varchar("schedule_name").notNull(),
  scheduleType: varchar("schedule_type").notNull(), // 'archive', 'delete', 'anonymize'
  
  // Execution Details
  targetTable: varchar("target_table").notNull(),
  targetConditions: json("target_conditions").notNull(), // SQL conditions for selecting records
  estimatedRecords: integer("estimated_records").default(0),
  estimatedSizeMb: decimal("estimated_size_mb", { precision: 15, scale: 2 }).default("0"),
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date").notNull(),
  executionWindowHours: integer("execution_window_hours").default(4), // How long the operation can run
  priority: integer("priority").default(100),
  
  // Status and Results
  status: varchar("status").default("scheduled"), // 'scheduled', 'running', 'completed', 'failed', 'cancelled'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  recordsProcessed: integer("records_processed").default(0),
  recordsArchived: integer("records_archived").default(0),
  recordsDeleted: integer("records_deleted").default(0),
  errorMessage: text("error_message"),
  
  // Verification
  verificationHash: varchar("verification_hash"), // Hash of processed data for verification
  backupLocation: varchar("backup_location"), // Where archived data is stored
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const auditReports = pgTable("audit_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Report Information
  name: varchar("name").notNull(),
  description: text("description"),
  reportType: varchar("report_type").notNull(), // 'compliance', 'security', 'activity', 'financial', 'custom'
  format: varchar("format").notNull(), // 'pdf', 'excel', 'csv', 'json'
  
  // Report Parameters
  dateRangeStart: timestamp("date_range_start").notNull(),
  dateRangeEnd: timestamp("date_range_end").notNull(),
  filters: json("filters").default({}), // Filters applied to the report
  includeSensitive: boolean("include_sensitive").default(false),
  
  // Generation Details
  status: varchar("status").default("pending"), // 'pending', 'generating', 'completed', 'failed'
  generatedBy: varchar("generated_by").notNull(),
  generatedAt: timestamp("generated_at"),
  filePath: varchar("file_path"), // Path to generated report file
  fileSizeBytes: integer("file_size_bytes").default(0),
  recordCount: integer("record_count").default(0),
  
  // Access Control
  accessLevel: varchar("access_level").default("restricted"), // 'public', 'internal', 'restricted', 'confidential'
  authorizedUsers: json("authorized_users").default([]), // Array of user IDs who can access this report
  downloadCount: integer("download_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  
  // Retention
  expiresAt: timestamp("expires_at"), // When this report should be automatically deleted
  retentionReason: varchar("retention_reason"), // Why this report is being retained
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const complianceMetrics = pgTable("compliance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Time Period
  date: timestamp("date").notNull(),
  hour: integer("hour"), // For hourly metrics
  
  // Compliance Scores
  overallComplianceScore: decimal("overall_compliance_score", { precision: 5, scale: 2 }).default("0.0"), // 0.0 to 100.0
  policyComplianceScores: json("policy_compliance_scores").default({}), // Scores by policy type
  
  // Violation Metrics
  totalViolations: integer("total_violations").default(0),
  criticalViolations: integer("critical_violations").default(0),
  highViolations: integer("high_violations").default(0),
  mediumViolations: integer("medium_violations").default(0),
  lowViolations: integer("low_violations").default(0),
  
  // Resolution Metrics
  violationsResolved: integer("violations_resolved").default(0),
  avgResolutionTimeHours: decimal("avg_resolution_time_hours", { precision: 10, scale: 2 }).default("0"),
  overdueViolations: integer("overdue_violations").default(0),
  
  // Audit Activity
  auditEventsLogged: integer("audit_events_logged").default(0),
  sensitiveEventsLogged: integer("sensitive_events_logged").default(0),
  failedAuditAttempts: integer("failed_audit_attempts").default(0),
  
  // Data Retention
  recordsArchived: integer("records_archived").default(0),
  recordsDeleted: integer("records_deleted").default(0),
  retentionPolicyViolations: integer("retention_policy_violations").default(0),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

export const legalHolds = pgTable("legal_holds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Legal Hold Information
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  caseNumber: varchar("case_number"),
  legalMatter: varchar("legal_matter").notNull(),
  
  // Scope
  dataTypes: json("data_types").notNull(), // Array of data types to preserve
  dateRangeStart: timestamp("date_range_start"),
  dateRangeEnd: timestamp("date_range_end"),
  custodians: json("custodians").default([]), // Array of data custodians
  searchTerms: json("search_terms").default([]), // Keywords for identifying relevant data
  
  // Status and Lifecycle
  status: varchar("status").default("active"), // 'draft', 'active', 'released', 'expired'
  issuedBy: varchar("issued_by").notNull(),
  issuedDate: timestamp("issued_date").defaultNow(),
  releaseDate: timestamp("release_date"),
  expiryDate: timestamp("expiry_date"),
  
  // Impact
  affectedRecordsCount: integer("affected_records_count").default(0),
  affectedDataSizeMb: decimal("affected_data_size_mb", { precision: 15, scale: 2 }).default("0"),
  preservationCost: decimal("preservation_cost", { precision: 15, scale: 2 }).default("0"),
  
  // Compliance
  notificationSent: boolean("notification_sent").default(false),
  acknowledgementsReceived: json("acknowledgements_received").default([]),
  complianceVerified: boolean("compliance_verified").default(false),
  verificationDate: timestamp("verification_date"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
  updatedBy: varchar("updated_by"),
});

// Schema types for compliance and audit management
export const insertComprehensiveAuditLogSchema = createInsertSchema(comprehensiveAuditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertCompliancePolicySchema = createInsertSchema(compliancePolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplianceViolationSchema = createInsertSchema(complianceViolations).omit({
  id: true,
  detectedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataRetentionPolicySchema = createInsertSchema(dataRetentionPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataRetentionScheduleSchema = createInsertSchema(dataRetentionSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditReportSchema = createInsertSchema(auditReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplianceMetricsSchema = createInsertSchema(complianceMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertLegalHoldSchema = createInsertSchema(legalHolds).omit({
  id: true,
  issuedDate: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComprehensiveAuditLog = z.infer<typeof insertComprehensiveAuditLogSchema>;
export type ComprehensiveAuditLog = typeof comprehensiveAuditLogs.$inferSelect;
export type InsertCompliancePolicy = z.infer<typeof insertCompliancePolicySchema>;
export type CompliancePolicy = typeof compliancePolicies.$inferSelect;
export type InsertComplianceViolation = z.infer<typeof insertComplianceViolationSchema>;
export type ComplianceViolation = typeof complianceViolations.$inferSelect;
export type InsertDataRetentionPolicy = z.infer<typeof insertDataRetentionPolicySchema>;
export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type InsertDataRetentionSchedule = z.infer<typeof insertDataRetentionScheduleSchema>;
export type DataRetentionSchedule = typeof dataRetentionSchedules.$inferSelect;
export type InsertAuditReport = z.infer<typeof insertAuditReportSchema>;
export type AuditReport = typeof auditReports.$inferSelect;
export type InsertComplianceMetrics = z.infer<typeof insertComplianceMetricsSchema>;
export type ComplianceMetrics = typeof complianceMetrics.$inferSelect;
export type InsertLegalHold = z.infer<typeof insertLegalHoldSchema>;
export type LegalHold = typeof legalHolds.$inferSelect;