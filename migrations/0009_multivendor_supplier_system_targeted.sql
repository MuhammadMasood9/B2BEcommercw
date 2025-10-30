-- Migration: Multivendor Supplier System (Targeted)
-- Description: Add only new supplier system tables and columns

-- ==================== SUPPLIER PROFILES TABLE ====================

CREATE TABLE IF NOT EXISTS supplier_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Business Information
  business_name VARCHAR NOT NULL,
  business_type VARCHAR NOT NULL CHECK (business_type IN ('manufacturer', 'trading_company', 'wholesaler')),
  store_name VARCHAR UNIQUE NOT NULL,
  store_slug VARCHAR UNIQUE NOT NULL,
  store_description TEXT,
  store_logo VARCHAR,
  store_banner VARCHAR,
  
  -- Contact Details
  contact_person VARCHAR NOT NULL,
  position VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  whatsapp VARCHAR,
  wechat VARCHAR,
  address TEXT NOT NULL,
  city VARCHAR NOT NULL,
  country VARCHAR NOT NULL,
  website VARCHAR,
  
  -- Business Details
  year_established INTEGER,
  employees VARCHAR,
  factory_size VARCHAR,
  annual_revenue VARCHAR,
  main_products TEXT[],
  export_markets TEXT[],
  
  -- Verification & Status
  verification_level VARCHAR DEFAULT 'none' CHECK (verification_level IN ('none', 'basic', 'business', 'premium', 'trade_assurance')),
  verification_docs JSONB,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  
  -- Membership & Performance
  membership_tier VARCHAR DEFAULT 'free' CHECK (membership_tier IN ('free', 'silver', 'gold', 'platinum')),
  subscription_id VARCHAR,
  subscription_status VARCHAR,
  subscription_expiry TIMESTAMP,
  
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0 CHECK (response_rate >= 0 AND response_rate <= 100),
  response_time VARCHAR,
  total_sales DECIMAL(15,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- Status & Control
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  is_active BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  
  -- Commission & Payout
  custom_commission_rate DECIMAL(5,2) CHECK (custom_commission_rate >= 0 AND custom_commission_rate <= 100),
  bank_name VARCHAR,
  account_number VARCHAR,
  account_name VARCHAR,
  paypal_email VARCHAR,
  
  -- Metadata
  total_products INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  store_views INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== COMMISSION SETTINGS TABLE ====================

CREATE TABLE IF NOT EXISTS commission_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Global Rates
  default_rate DECIMAL(5,2) DEFAULT 5.0 CHECK (default_rate >= 0 AND default_rate <= 100),
  free_rate DECIMAL(5,2) DEFAULT 5.0 CHECK (free_rate >= 0 AND free_rate <= 100),
  silver_rate DECIMAL(5,2) DEFAULT 3.0 CHECK (silver_rate >= 0 AND silver_rate <= 100),
  gold_rate DECIMAL(5,2) DEFAULT 2.0 CHECK (gold_rate >= 0 AND gold_rate <= 100),
  platinum_rate DECIMAL(5,2) DEFAULT 1.5 CHECK (platinum_rate >= 0 AND platinum_rate <= 100),
  
  -- Category & Vendor Overrides
  category_rates JSONB, -- {categoryId: rate}
  vendor_overrides JSONB, -- {vendorId: rate}
  
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR REFERENCES users(id)
);

-- Insert default commission settings
INSERT INTO commission_settings (default_rate, free_rate, silver_rate, gold_rate, platinum_rate) 
VALUES (5.0, 5.0, 3.0, 2.0, 1.5)
ON CONFLICT DO NOTHING;

-- ==================== PAYOUTS TABLE ====================

CREATE TABLE IF NOT EXISTS payouts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
  order_id VARCHAR REFERENCES orders(id),
  
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  commission_amount DECIMAL(15,2) NOT NULL CHECK (commission_amount >= 0),
  net_amount DECIMAL(15,2) NOT NULL CHECK (net_amount >= 0),
  
  method VARCHAR NOT NULL CHECK (method IN ('bank_transfer', 'paypal', 'stripe')),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  scheduled_date TIMESTAMP NOT NULL,
  processed_date TIMESTAMP,
  
  transaction_id VARCHAR,
  failure_reason TEXT,
  invoice_url VARCHAR,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== SUPPLIER REVIEWS TABLE ====================

CREATE TABLE IF NOT EXISTS supplier_reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
  buyer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR REFERENCES orders(id),
  
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  product_quality INTEGER CHECK (product_quality >= 1 AND product_quality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  shipping_speed INTEGER CHECK (shipping_speed >= 1 AND shipping_speed <= 5),
  after_sales INTEGER CHECK (after_sales >= 1 AND after_sales <= 5),
  
  comment TEXT,
  images TEXT[],
  
  supplier_response TEXT,
  responded_at TIMESTAMP,
  
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one review per buyer per order
  UNIQUE(buyer_id, order_id)
);

-- ==================== STAFF MEMBERS TABLE ====================

CREATE TABLE IF NOT EXISTS staff_members (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
  
  email VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('owner', 'manager', 'product_manager', 'customer_service', 'accountant')),
  permissions JSONB NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique email per supplier
  UNIQUE(supplier_id, email)
);

-- ==================== ADD COLUMNS TO EXISTING TABLES ====================

-- Add supplier columns to products table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
    ALTER TABLE products ADD COLUMN supplier_id VARCHAR REFERENCES supplier_profiles(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
    ALTER TABLE products ADD COLUMN status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_approved') THEN
    ALTER TABLE products ADD COLUMN is_approved BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'approved_at') THEN
    ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'approved_by') THEN
    ALTER TABLE products ADD COLUMN approved_by VARCHAR REFERENCES users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'rejection_reason') THEN
    ALTER TABLE products ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Add supplier and commission columns to orders table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'parent_order_id') THEN
    ALTER TABLE orders ADD COLUMN parent_order_id VARCHAR REFERENCES orders(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'commission_rate') THEN
    ALTER TABLE orders ADD COLUMN commission_rate DECIMAL(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'commission_amount') THEN
    ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(15,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'supplier_amount') THEN
    ALTER TABLE orders ADD COLUMN supplier_amount DECIMAL(15,2);
  END IF;
END $$;

-- Update users table role constraint to include supplier
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_role_check') THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
  
  -- Add new constraint with supplier role
  ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('buyer', 'admin', 'supplier'));
END $$;

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Supplier profiles indexes
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_user_id ON supplier_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_store_slug ON supplier_profiles(store_slug);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_status ON supplier_profiles(status);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_membership_tier ON supplier_profiles(membership_tier);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_verification_level ON supplier_profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_is_active ON supplier_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_rating ON supplier_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_total_sales ON supplier_profiles(total_sales DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_created_at ON supplier_profiles(created_at DESC);

-- Products table indexes for supplier queries
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_status ON products(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_products_supplier_approved ON products(supplier_id, is_approved);

-- Orders table indexes for supplier queries
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders(parent_order_id);

-- Payouts table indexes
CREATE INDEX IF NOT EXISTS idx_payouts_supplier_id ON payouts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_scheduled_date ON payouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payouts_supplier_status ON payouts(supplier_id, status);

-- Supplier reviews indexes
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier_id ON supplier_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_buyer_id ON supplier_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_rating ON supplier_reviews(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_created_at ON supplier_reviews(created_at DESC);

-- Staff members indexes
CREATE INDEX IF NOT EXISTS idx_staff_members_supplier_id ON staff_members(supplier_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_email ON staff_members(email);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON staff_members(role);
CREATE INDEX IF NOT EXISTS idx_staff_members_is_active ON staff_members(is_active);

-- ==================== TRIGGERS FOR AUTOMATIC UPDATES ====================

-- Function to update supplier profile stats
CREATE OR REPLACE FUNCTION update_supplier_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_products count
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE supplier_profiles 
    SET total_products = (
      SELECT COUNT(*) 
      FROM products 
      WHERE supplier_id = NEW.supplier_id AND is_published = true
    )
    WHERE id = NEW.supplier_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE supplier_profiles 
    SET total_products = (
      SELECT COUNT(*) 
      FROM products 
      WHERE supplier_id = OLD.supplier_id AND is_published = true
    )
    WHERE id = OLD.supplier_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_supplier_product_count ON products;
CREATE TRIGGER trigger_update_supplier_product_count
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_stats();

-- Function to update supplier rating
CREATE OR REPLACE FUNCTION update_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE supplier_profiles 
    SET 
      rating = (
        SELECT COALESCE(AVG(overall_rating), 0) 
        FROM supplier_reviews 
        WHERE supplier_id = NEW.supplier_id AND is_approved = true
      ),
      total_reviews = (
        SELECT COUNT(*) 
        FROM supplier_reviews 
        WHERE supplier_id = NEW.supplier_id AND is_approved = true
      )
    WHERE id = NEW.supplier_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE supplier_profiles 
    SET 
      rating = (
        SELECT COALESCE(AVG(overall_rating), 0) 
        FROM supplier_reviews 
        WHERE supplier_id = OLD.supplier_id AND is_approved = true
      ),
      total_reviews = (
        SELECT COUNT(*) 
        FROM supplier_reviews 
        WHERE supplier_id = OLD.supplier_id AND is_approved = true
      )
    WHERE id = OLD.supplier_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_supplier_rating ON supplier_reviews;
CREATE TRIGGER trigger_update_supplier_rating
  AFTER INSERT OR UPDATE OR DELETE ON supplier_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_rating();

-- Function to update supplier sales stats
CREATE OR REPLACE FUNCTION update_supplier_sales_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.supplier_id IS NOT NULL THEN
    UPDATE supplier_profiles 
    SET 
      total_sales = total_sales + NEW.total_amount,
      total_orders = total_orders + 1
    WHERE id = NEW.supplier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_supplier_sales_stats ON orders;
CREATE TRIGGER trigger_update_supplier_sales_stats
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_sales_stats();