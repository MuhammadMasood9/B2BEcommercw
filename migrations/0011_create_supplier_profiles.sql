-- Create supplier_profiles table for multivendor marketplace
-- This migration creates the supplier_profiles table if it doesn't exist

-- ==================== CREATE SUPPLIER PROFILES TABLE ====================

CREATE TABLE IF NOT EXISTS "supplier_profiles" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL UNIQUE,
  "business_name" text NOT NULL,
  "business_type" text NOT NULL, -- 'manufacturer', 'trading_company', 'wholesaler'
  "store_name" text NOT NULL UNIQUE,
  "store_slug" text NOT NULL UNIQUE,
  "store_description" text,
  "store_logo" text,
  "store_banner" text,
  
  -- Contact Information
  "contact_person" text NOT NULL,
  "position" text,
  "phone" text NOT NULL,
  "whatsapp" text,
  "address" text NOT NULL,
  "city" text NOT NULL,
  "country" text NOT NULL,
  "website" text,
  
  -- Business Details
  "year_established" integer,
  "employees_count" text,
  "annual_revenue" text,
  "main_products" text[],
  "export_markets" text[],
  
  -- Verification & Status
  "verification_level" text DEFAULT 'none', -- 'none', 'basic', 'business', 'premium'
  "verification_documents" jsonb,
  "is_verified" boolean DEFAULT false,
  "verified_at" timestamp,
  
  -- Performance Metrics
  "rating" decimal DEFAULT 0,
  "total_reviews" integer DEFAULT 0,
  "response_rate" decimal DEFAULT 0,
  "response_time" text, -- '< 2 hours'
  "total_sales" decimal DEFAULT 0,
  "total_orders" integer DEFAULT 0,
  
  -- Status
  "status" text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
  "is_active" boolean DEFAULT false,
  "is_featured" boolean DEFAULT false,
  
  -- Commission
  "commission_rate" decimal, -- Override default platform commission
  
  -- Store Settings
  "store_policies" jsonb,
  "operating_hours" jsonb,
  
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

-- ==================== CREATE INDEXES FOR SUPPLIER PROFILES ====================

-- User ID index (for lookups by user)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_user_id" ON "supplier_profiles"("user_id");

-- Store name index (for uniqueness checks)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_store_name" ON "supplier_profiles"("store_name");

-- Store slug index (for URL lookups)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_store_slug" ON "supplier_profiles"("store_slug");

-- Status index (for filtering by status)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_status" ON "supplier_profiles"("status");

-- Active suppliers index (for public listings)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_active" ON "supplier_profiles"("is_active", "status");

-- Verified suppliers index (for trust filtering)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_verified" ON "supplier_profiles"("is_verified", "verification_level");

-- Featured suppliers index (for homepage display)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_featured" ON "supplier_profiles"("is_featured", "is_active");

-- Business type index (for category filtering)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_business_type" ON "supplier_profiles"("business_type");

-- Country index (for location filtering)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_country" ON "supplier_profiles"("country");

-- Rating index (for sorting by rating)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_rating" ON "supplier_profiles"("rating" DESC);

-- Composite index for active verified suppliers (common query)
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_active_verified" ON "supplier_profiles"("is_active", "is_verified", "status");