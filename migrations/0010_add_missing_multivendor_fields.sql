-- Add missing multivendor fields to existing tables
-- This migration adds only the fields that don't exist yet

-- ==================== UPDATE PRODUCTS TABLE ====================

-- Add supplier_id and approval status fields to products table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
        ALTER TABLE "products" ADD COLUMN "supplier_id" varchar;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'approval_status') THEN
        ALTER TABLE "products" ADD COLUMN "approval_status" text DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'approved_by') THEN
        ALTER TABLE "products" ADD COLUMN "approved_by" varchar;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'approved_at') THEN
        ALTER TABLE "products" ADD COLUMN "approved_at" timestamp;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'rejection_reason') THEN
        ALTER TABLE "products" ADD COLUMN "rejection_reason" text;
    END IF;
END $$;

-- ==================== UPDATE INQUIRIES TABLE ====================

-- Add supplier_id to inquiries table for direct routing (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'supplier_id') THEN
        ALTER TABLE "inquiries" ADD COLUMN "supplier_id" varchar;
    END IF;
END $$;

-- ==================== UPDATE RFQs TABLE ====================

-- Add supplier_id to rfqs table for direct routing (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rfqs' AND column_name = 'supplier_id') THEN
        ALTER TABLE "rfqs" ADD COLUMN "supplier_id" varchar;
    END IF;
END $$;

-- ==================== UPDATE QUOTATIONS TABLE ====================

-- Add new supplier_id column for multivendor (keep existing supplier_id as admin_id for migration)
DO $$ 
BEGIN
    -- Check if we need to rename existing supplier_id to admin_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'supplier_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'admin_id') THEN
        ALTER TABLE "quotations" RENAME COLUMN "supplier_id" TO "admin_id";
    END IF;
    
    -- Add new supplier_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'supplier_id') THEN
        ALTER TABLE "quotations" ADD COLUMN "supplier_id" varchar;
    END IF;
END $$;

-- ==================== UPDATE INQUIRY QUOTATIONS TABLE ====================

-- Add supplier_id to inquiry_quotations table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiry_quotations' AND column_name = 'supplier_id') THEN
        ALTER TABLE "inquiry_quotations" ADD COLUMN "supplier_id" varchar;
    END IF;
END $$;

-- ==================== CREATE COMMISSIONS TABLE ====================

-- Create commissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "commissions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar NOT NULL,
  "supplier_id" varchar NOT NULL,
  "order_amount" decimal NOT NULL,
  "commission_rate" decimal NOT NULL,
  "commission_amount" decimal NOT NULL,
  "supplier_amount" decimal NOT NULL,
  "status" text DEFAULT 'pending',
  "created_at" timestamp DEFAULT NOW()
);

-- ==================== CREATE PAYOUTS TABLE ====================

-- Create payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payouts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" varchar NOT NULL,
  "amount" decimal NOT NULL,
  "commission_deducted" decimal NOT NULL,
  "net_amount" decimal NOT NULL,
  "payout_method" text,
  "status" text DEFAULT 'pending',
  "scheduled_date" timestamp,
  "processed_date" timestamp,
  "transaction_id" text,
  "created_at" timestamp DEFAULT NOW()
);

-- ==================== UPDATE CONVERSATIONS TABLE ====================

-- Add supplier_id to conversations for supplier-buyer communication (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'supplier_id') THEN
        ALTER TABLE "conversations" ADD COLUMN "supplier_id" varchar;
    END IF;
END $$;

-- ==================== CREATE INDEXES ====================

-- Create indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    -- Products indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_supplier_id') THEN
        CREATE INDEX "idx_products_supplier_id" ON "products"("supplier_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_approval_status') THEN
        CREATE INDEX "idx_products_approval_status" ON "products"("approval_status");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_supplier_approval') THEN
        CREATE INDEX "idx_products_supplier_approval" ON "products"("supplier_id", "approval_status");
    END IF;
    
    -- Inquiries indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_supplier_id') THEN
        CREATE INDEX "idx_inquiries_supplier_id" ON "inquiries"("supplier_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiries_product_supplier') THEN
        CREATE INDEX "idx_inquiries_product_supplier" ON "inquiries"("product_id", "supplier_id");
    END IF;
    
    -- RFQs indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rfqs_supplier_id') THEN
        CREATE INDEX "idx_rfqs_supplier_id" ON "rfqs"("supplier_id");
    END IF;
    
    -- Quotations indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quotations_supplier_id') THEN
        CREATE INDEX "idx_quotations_supplier_id" ON "quotations"("supplier_id");
    END IF;
    
    -- Inquiry quotations indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inquiry_quotations_supplier_id') THEN
        CREATE INDEX "idx_inquiry_quotations_supplier_id" ON "inquiry_quotations"("supplier_id");
    END IF;
    
    -- Commissions indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_commissions_order_id') THEN
        CREATE INDEX "idx_commissions_order_id" ON "commissions"("order_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_commissions_supplier_id') THEN
        CREATE INDEX "idx_commissions_supplier_id" ON "commissions"("supplier_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_commissions_status') THEN
        CREATE INDEX "idx_commissions_status" ON "commissions"("status");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_commissions_supplier_status') THEN
        CREATE INDEX "idx_commissions_supplier_status" ON "commissions"("supplier_id", "status");
    END IF;
    
    -- Payouts indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_supplier_id') THEN
        CREATE INDEX "idx_payouts_supplier_id" ON "payouts"("supplier_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_status') THEN
        CREATE INDEX "idx_payouts_status" ON "payouts"("status");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_scheduled_date') THEN
        CREATE INDEX "idx_payouts_scheduled_date" ON "payouts"("scheduled_date");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_supplier_status') THEN
        CREATE INDEX "idx_payouts_supplier_status" ON "payouts"("supplier_id", "status");
    END IF;
    
    -- Conversations indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_supplier_id') THEN
        CREATE INDEX "idx_conversations_supplier_id" ON "conversations"("supplier_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_buyer_supplier') THEN
        CREATE INDEX "idx_conversations_buyer_supplier" ON "conversations"("buyer_id", "supplier_id");
    END IF;
END $$;