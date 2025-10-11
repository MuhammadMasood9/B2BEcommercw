import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories
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

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: text("external_id"), // For imported products
  type: text("type").default("simple"), // simple, variable, etc.
  sku: text("sku").unique(),
  gtin: text("gtin"), // GTIN, UPC, EAN, or ISBN
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  description: text("description"),
  categoryId: varchar("category_id"),
  tags: text("tags").array(),
  images: text("images").array(), // Array of image URLs
  regularPrice: decimal("regular_price", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  salePriceStartDate: timestamp("sale_price_start_date"),
  salePriceEndDate: timestamp("sale_price_end_date"),
  taxStatus: text("tax_status").default("taxable"),
  taxClass: text("tax_class"),
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  lowStockAmount: integer("low_stock_amount"),
  backordersAllowed: boolean("backorders_allowed").default(false),
  soldIndividually: boolean("sold_individually").default(false),
  weight: decimal("weight", { precision: 10, scale: 2 }), // kg
  length: decimal("length", { precision: 10, scale: 2 }), // cm
  width: decimal("width", { precision: 10, scale: 2 }), // cm
  height: decimal("height", { precision: 10, scale: 2 }), // cm
  shippingClass: text("shipping_class"),
  allowReviews: boolean("allow_reviews").default(true),
  isFeatured: boolean("is_featured").default(false),
  isPublished: boolean("is_published").default(true),
  visibility: text("visibility").default("visible"),
  purchaseNote: text("purchase_note"),
  downloadLimit: integer("download_limit"),
  downloadExpiryDays: integer("download_expiry_days"),
  metaData: json("meta_data"), // For additional custom fields
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

// Customers
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
  accountType: text("account_type").default("buyer"), // buyer, supplier, both
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Suppliers
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

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id"),
  supplierId: varchar("supplier_id"),
  status: text("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  items: json("items").notNull(), // Array of order items
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
