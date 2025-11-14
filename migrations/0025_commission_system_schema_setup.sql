-- Commission System Schema Setup
-- This migration ensures all required tables, columns, and indexes are in place for the commission system

-- ==================== COMMISSION TIERS TABLE ====================

-- Create commission_tiers table if not exists
CREATE TABLE IF NOT EXISTS commission_tiers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  min_amount DECIMAL(10, 2) NOT NULL,
  max_amount DECIMAL(10, 2),
  commission_rate DECIMAL(5, 4) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== SUPPLIER PROFILES ENHANCEMENTS ====================

-- Add commission-related fields to supplier_profiles if they don't exist
ALTER TABLE supplier_profiles 
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 4),
  ADD COLUMN IF NOT EXISTS commission_credit_limit DECIMAL(10, 2) DEFAULT 10000.00,
  ADD COLUMN IF NOT EXISTS total_unpaid_commission DECIMAL(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMP;

-- ==================== COMMISSIONS TABLE ENHANCEMENTS ====================

-- Ensure commissions table has all required columns
ALTER TABLE commissions 
  ADD COLUMN IF NOT EXISTS order_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 4),
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS supplier_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified_by VARCHAR,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP;

-- Update status column to support all required values
-- Status values: 'unpaid', 'payment_submitted', 'paid', 'overdue', 'disputed'
-- No need to alter column type, just ensure it accepts these values

-- ==================== PAYMENT SUBMISSIONS TABLE ====================

-- Create payment_submissions table if not exists
CREATE TABLE IF NOT EXISTS payment_submissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission_ids JSON NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer',
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by VARCHAR,
  rejection_reason TEXT,
  proof_of_payment TEXT,
  transaction_reference TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Commission tiers indexes
CREATE INDEX IF NOT EXISTS idx_commission_tiers_active ON commission_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_tiers_amount_range ON commission_tiers(min_amount, max_amount);

-- Supplier profiles indexes
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_restricted ON supplier_profiles(is_restricted);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_unpaid_commission ON supplier_profiles(total_unpaid_commission);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_credit_limit ON supplier_profiles(commission_credit_limit);

-- Commissions indexes
CREATE INDEX IF NOT EXISTS idx_commissions_supplier_id ON commissions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_supplier_status ON commissions(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_due_date ON commissions(due_date);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

-- Payment submissions indexes
CREATE INDEX IF NOT EXISTS idx_payment_submissions_supplier_id ON payment_submissions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_submitted_at ON payment_submissions(submitted_at);

-- ==================== SEED DEFAULT COMMISSION TIERS ====================

-- Delete existing default tiers to avoid duplicates (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commission_tiers') THEN
    DELETE FROM commission_tiers WHERE description LIKE '%Orders%' OR description LIKE '%commission)%';
  END IF;
END $$;

-- Insert default commission tiers based on requirements
-- Tier 1: 0-10000 Rs = 5%
-- Tier 2: 10001-100000 Rs = 10%
-- Tier 3: 100001+ Rs = 15%
INSERT INTO commission_tiers (min_amount, max_amount, commission_rate, description, is_active)
VALUES 
  (0, 10000, 0.05, 'Orders ₹0 - ₹10,000 (5% commission)', true),
  (10001, 100000, 0.10, 'Orders ₹10,001 - ₹1,00,000 (10% commission)', true),
  (100001, NULL, 0.15, 'Orders above ₹1,00,000 (15% commission)', true)
ON CONFLICT DO NOTHING;

-- ==================== HELPER FUNCTIONS ====================

-- Function to select appropriate commission tier based on order amount
CREATE OR REPLACE FUNCTION select_commission_tier(order_amount_param DECIMAL)
RETURNS TABLE(
  tier_id VARCHAR,
  tier_rate DECIMAL,
  tier_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    commission_rate,
    description
  FROM commission_tiers
  WHERE is_active = true
    AND order_amount_param >= min_amount
    AND (max_amount IS NULL OR order_amount_param <= max_amount)
  ORDER BY min_amount DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if supplier should be restricted
CREATE OR REPLACE FUNCTION should_restrict_supplier(supplier_id_param VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  unpaid_amount DECIMAL;
  credit_limit DECIMAL;
BEGIN
  SELECT 
    total_unpaid_commission,
    commission_credit_limit
  INTO unpaid_amount, credit_limit
  FROM supplier_profiles
  WHERE id = supplier_id_param;
  
  RETURN unpaid_amount >= credit_limit;
END;
$$ LANGUAGE plpgsql;

-- ==================== COMMENTS ====================

COMMENT ON TABLE commission_tiers IS 'Tiered commission rates based on order amount ranges';
COMMENT ON TABLE payment_submissions IS 'Supplier commission payment submissions with proof of payment';
COMMENT ON COLUMN supplier_profiles.commission_rate IS 'Custom commission rate override for this supplier (overrides tier rates)';
COMMENT ON COLUMN supplier_profiles.commission_credit_limit IS 'Maximum unpaid commission allowed before account restriction';
COMMENT ON COLUMN supplier_profiles.total_unpaid_commission IS 'Current total of unpaid commissions';
COMMENT ON COLUMN supplier_profiles.is_restricted IS 'Account restricted when unpaid commission exceeds credit limit';
COMMENT ON COLUMN commissions.status IS 'Commission status: unpaid, payment_submitted, paid, overdue, disputed';
