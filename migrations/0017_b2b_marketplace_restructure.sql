-- ==================== B2B MARKETPLACE SYSTEM RESTRUCTURE ====================
-- Migration for restructuring the B2B marketplace to properly separate Admin, Supplier, and Buyer roles

-- ==================== BUYERS TABLE (Enhanced) ====================
CREATE TABLE IF NOT EXISTS "buyers" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL UNIQUE,
  "company_name" varchar(255),
  "industry" varchar(100),
  "business_type" varchar(50),
  "annual_volume" decimal(15,2),
  "preferred_payment_terms" text[],
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- ==================== ENHANCED RFQs TABLE (Buyer-Centric) ====================
-- Drop existing RFQ table and recreate with enhanced structure
DROP TABLE IF EXISTS "rfqs" CASCADE;

CREATE TABLE "rfqs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyer_id" varchar NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "category_id" varchar,
  "specifications" jsonb,
  "quantity" integer NOT NULL,
  "target_price" decimal(10,2),
  "budget_range" jsonb, -- {min: 1000, max: 5000}
  "delivery_location" varchar(255),
  "required_delivery_date" date,
  "payment_terms" varchar(100),
  "status" varchar(50) DEFAULT 'open', -- open, closed, expired
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE,
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
);

-- ==================== ENHANCED INQUIRIES TABLE (Buyer-Supplier Communication) ====================
-- Drop existing inquiries table and recreate with enhanced structure
DROP TABLE IF EXISTS "inquiries" CASCADE;
DROP TABLE IF EXISTS "inquiry_quotations" CASCADE;
DROP TABLE IF EXISTS "inquiry_revisions" CASCADE;

CREATE TABLE "inquiries" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyer_id" varchar NOT NULL,
  "supplier_id" varchar,
  "product_id" varchar,
  "subject" varchar(255),
  "message" text NOT NULL,
  "quantity" integer,
  "status" varchar(50) DEFAULT 'pending', -- pending, responded, closed
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE,
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE SET NULL,
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL
);

-- ==================== ENHANCED QUOTATIONS TABLE (Supplier Responses) ====================
-- Drop existing quotations table and recreate with enhanced structure
DROP TABLE IF EXISTS "quotations" CASCADE;

CREATE TABLE "quotations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" varchar NOT NULL,
  "rfq_id" varchar,
  "inquiry_id" varchar,
  "unit_price" decimal(10,2) NOT NULL,
  "total_price" decimal(15,2) NOT NULL,
  "moq" integer NOT NULL,
  "lead_time" varchar(50),
  "payment_terms" varchar(100),
  "validity_period" integer, -- days
  "terms_conditions" text,
  "attachments" text[],
  "status" varchar(50) DEFAULT 'sent', -- sent, accepted, rejected, expired
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE,
  FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE,
  FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE,
  
  -- Ensure quotation is linked to either RFQ or inquiry, but not both
  CONSTRAINT "quotation_source_check" CHECK (
    (rfq_id IS NOT NULL AND inquiry_id IS NULL) OR 
    (rfq_id IS NULL AND inquiry_id IS NOT NULL)
  )
);

-- ==================== ENHANCED DISPUTES TABLE (Admin-Managed) ====================
-- Update existing disputes table or create if not exists
CREATE TABLE IF NOT EXISTS "disputes_new" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar NOT NULL,
  "buyer_id" varchar NOT NULL,
  "supplier_id" varchar NOT NULL,
  "admin_id" varchar,
  "dispute_type" varchar(50), -- quality, delivery, payment, other
  "description" text NOT NULL,
  "buyer_evidence" text[],
  "supplier_evidence" text[],
  "admin_notes" text,
  "status" varchar(50) DEFAULT 'open', -- open, investigating, resolved, closed
  "resolution" text,
  "refund_amount" decimal(10,2),
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE,
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE,
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Migrate existing disputes data if table exists
-- Note: This will be handled manually if needed since the disputes table structure has changed significantly

-- Drop old disputes table and rename new one
DROP TABLE IF EXISTS "disputes" CASCADE;
ALTER TABLE "disputes_new" RENAME TO "disputes";

-- ==================== ENHANCED CONVERSATIONS TABLE (Multi-Role Chat) ====================
-- Drop existing conversations table and recreate with enhanced structure
DROP TABLE IF EXISTS "conversations" CASCADE;

CREATE TABLE "conversations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" varchar(50) NOT NULL, -- buyer_supplier, buyer_admin, supplier_admin
  "buyer_id" varchar,
  "supplier_id" varchar,
  "admin_id" varchar,
  "subject" varchar(255),
  "status" varchar(50) DEFAULT 'active', -- active, archived, closed
  "last_message_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE,
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE,
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE,
  
  -- Ensure conversation has appropriate participants based on type
  CONSTRAINT "conversation_participants_check" CHECK (
    (type = 'buyer_supplier' AND buyer_id IS NOT NULL AND supplier_id IS NOT NULL AND admin_id IS NULL) OR
    (type = 'buyer_admin' AND buyer_id IS NOT NULL AND admin_id IS NOT NULL AND supplier_id IS NULL) OR
    (type = 'supplier_admin' AND supplier_id IS NOT NULL AND admin_id IS NOT NULL AND buyer_id IS NULL)
  )
);

-- ==================== ENHANCED MESSAGES TABLE (Chat Messages) ====================
-- Drop existing messages table and recreate with enhanced structure
DROP TABLE IF EXISTS "messages" CASCADE;

CREATE TABLE "messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" varchar NOT NULL,
  "sender_id" varchar NOT NULL,
  "sender_type" varchar(20) NOT NULL, -- buyer, supplier, admin
  "message" text NOT NULL,
  "attachments" text[],
  "product_references" varchar[], -- Array of product IDs referenced in message
  "is_read" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE,
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- ==================== PRODUCT ATTRIBUTES TABLE (Advanced Filtering) ====================
CREATE TABLE IF NOT EXISTS "product_attributes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" varchar NOT NULL,
  "attribute_name" varchar(100) NOT NULL,
  "attribute_value" text NOT NULL,
  "is_filterable" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
);

-- ==================== ENHANCED CATEGORIES TABLE ====================
-- Add additional fields to categories for better filtering
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

-- ==================== DATABASE INDEXES FOR PERFORMANCE ====================

-- Buyers table indexes
CREATE INDEX IF NOT EXISTS "idx_buyers_user_id" ON "buyers"("user_id");
CREATE INDEX IF NOT EXISTS "idx_buyers_company_name" ON "buyers"("company_name");
CREATE INDEX IF NOT EXISTS "idx_buyers_industry" ON "buyers"("industry");

-- RFQs table indexes
CREATE INDEX IF NOT EXISTS "idx_rfqs_buyer_id" ON "rfqs"("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_rfqs_category_id" ON "rfqs"("category_id");
CREATE INDEX IF NOT EXISTS "idx_rfqs_status" ON "rfqs"("status");
CREATE INDEX IF NOT EXISTS "idx_rfqs_created_at" ON "rfqs"("created_at");
CREATE INDEX IF NOT EXISTS "idx_rfqs_expires_at" ON "rfqs"("expires_at");

-- Inquiries table indexes
CREATE INDEX IF NOT EXISTS "idx_inquiries_buyer_id" ON "inquiries"("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_inquiries_supplier_id" ON "inquiries"("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_inquiries_product_id" ON "inquiries"("product_id");
CREATE INDEX IF NOT EXISTS "idx_inquiries_status" ON "inquiries"("status");
CREATE INDEX IF NOT EXISTS "idx_inquiries_created_at" ON "inquiries"("created_at");

-- Quotations table indexes
CREATE INDEX IF NOT EXISTS "idx_quotations_supplier_id" ON "quotations"("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_quotations_rfq_id" ON "quotations"("rfq_id");
CREATE INDEX IF NOT EXISTS "idx_quotations_inquiry_id" ON "quotations"("inquiry_id");
CREATE INDEX IF NOT EXISTS "idx_quotations_status" ON "quotations"("status");
CREATE INDEX IF NOT EXISTS "idx_quotations_created_at" ON "quotations"("created_at");

-- Disputes table indexes
CREATE INDEX IF NOT EXISTS "idx_disputes_order_id" ON "disputes"("order_id");
CREATE INDEX IF NOT EXISTS "idx_disputes_buyer_id" ON "disputes"("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_disputes_supplier_id" ON "disputes"("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_disputes_admin_id" ON "disputes"("admin_id");
CREATE INDEX IF NOT EXISTS "idx_disputes_status" ON "disputes"("status");
CREATE INDEX IF NOT EXISTS "idx_disputes_created_at" ON "disputes"("created_at");

-- Conversations table indexes
CREATE INDEX IF NOT EXISTS "idx_conversations_type" ON "conversations"("type");
CREATE INDEX IF NOT EXISTS "idx_conversations_buyer_id" ON "conversations"("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_supplier_id" ON "conversations"("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_admin_id" ON "conversations"("admin_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_status" ON "conversations"("status");
CREATE INDEX IF NOT EXISTS "idx_conversations_last_message_at" ON "conversations"("last_message_at");

-- Messages table indexes
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_messages_sender_id" ON "messages"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_messages_sender_type" ON "messages"("sender_type");
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages"("created_at");
CREATE INDEX IF NOT EXISTS "idx_messages_is_read" ON "messages"("is_read");

-- Product attributes table indexes
CREATE INDEX IF NOT EXISTS "idx_product_attributes_product_id" ON "product_attributes"("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_attributes_name" ON "product_attributes"("attribute_name");
CREATE INDEX IF NOT EXISTS "idx_product_attributes_filterable" ON "product_attributes"("is_filterable");
CREATE INDEX IF NOT EXISTS "idx_product_attributes_name_value" ON "product_attributes"("attribute_name", "attribute_value");

-- Categories table indexes
CREATE INDEX IF NOT EXISTS "idx_categories_parent_id" ON "categories"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "idx_categories_is_active" ON "categories"("is_active");
CREATE INDEX IF NOT EXISTS "idx_categories_sort_order" ON "categories"("sort_order");

-- Products table additional indexes for filtering
CREATE INDEX IF NOT EXISTS "idx_products_category_id" ON "products"("category_id");
CREATE INDEX IF NOT EXISTS "idx_products_supplier_id" ON "products"("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_products_status" ON "products"("status");
CREATE INDEX IF NOT EXISTS "idx_products_is_published" ON "products"("is_published");
CREATE INDEX IF NOT EXISTS "idx_products_min_order_quantity" ON "products"("min_order_quantity");
CREATE INDEX IF NOT EXISTS "idx_products_created_at" ON "products"("created_at");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_products_category_status" ON "products"("category_id", "status");
CREATE INDEX IF NOT EXISTS "idx_products_supplier_status" ON "products"("supplier_id", "status");
CREATE INDEX IF NOT EXISTS "idx_rfqs_buyer_status" ON "rfqs"("buyer_id", "status");
CREATE INDEX IF NOT EXISTS "idx_inquiries_supplier_status" ON "inquiries"("supplier_id", "status");
CREATE INDEX IF NOT EXISTS "idx_quotations_rfq_status" ON "quotations"("rfq_id", "status");

-- ==================== UPDATE EXISTING TABLES ====================

-- Update orders table to support multivendor and RFQ-based orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "rfq_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "parent_order_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "commission_rate" decimal(5,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "commission_amount" decimal(15,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "supplier_amount" decimal(15,2);

-- Add foreign key constraints for new order fields
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_rfq_id" 
  FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_supplier_id" 
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_parent_order_id" 
  FOREIGN KEY ("parent_order_id") REFERENCES "orders"("id") ON DELETE SET NULL;

-- Add indexes for new order fields
CREATE INDEX IF NOT EXISTS "idx_orders_rfq_id" ON "orders"("rfq_id");
CREATE INDEX IF NOT EXISTS "idx_orders_supplier_id" ON "orders"("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_orders_parent_order_id" ON "orders"("parent_order_id");

-- Update products table to support better supplier relationship
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "lead_time" varchar(50);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "port" varchar(100);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "payment_terms" text[];

-- ==================== DATA MIGRATION ====================

-- Migrate existing buyer profiles to buyers table
INSERT INTO "buyers" ("id", "user_id", "company_name", "industry", "created_at", "updated_at")
SELECT 
  gen_random_uuid(),
  "user_id",
  "company_name",
  "industry",
  "created_at",
  now()
FROM "buyer_profiles"
WHERE NOT EXISTS (
  SELECT 1 FROM "buyers" WHERE "buyers"."user_id" = "buyer_profiles"."user_id"
);

-- ==================== CLEANUP ====================

-- Remove old buyer_profiles table as it's replaced by buyers
-- DROP TABLE IF EXISTS "buyer_profiles" CASCADE;

-- ==================== COMMENTS AND DOCUMENTATION ====================

COMMENT ON TABLE "buyers" IS 'Enhanced buyer profiles for B2B marketplace with business-specific information';
COMMENT ON TABLE "rfqs" IS 'Request for Quotation system - buyer-centric with enhanced specifications';
COMMENT ON TABLE "inquiries" IS 'Direct product inquiries between buyers and suppliers';
COMMENT ON TABLE "quotations" IS 'Supplier responses to RFQs and inquiries with detailed pricing';
COMMENT ON TABLE "disputes" IS 'Admin-managed dispute resolution system for orders';
COMMENT ON TABLE "conversations" IS 'Multi-role chat system supporting buyer-supplier-admin communication';
COMMENT ON TABLE "messages" IS 'Chat messages with support for attachments and product references';
COMMENT ON TABLE "product_attributes" IS 'Product attributes for advanced filtering and search capabilities';

-- Migration completed successfully