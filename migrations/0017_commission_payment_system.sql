-- Migration: Commission Payment System (Supplier Pays Admin)
-- Suppliers owe commission to platform and must pay to continue operations

-- Add credit limit and restriction fields to supplier_profiles
ALTER TABLE supplier_profiles 
ADD COLUMN IF NOT EXISTS commission_credit_limit DECIMAL(10, 2) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS total_unpaid_commission DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMP;

-- Add payment tracking fields to commissions table
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_verified_by VARCHAR,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP;

-- Update commission status to reflect new flow
-- Status: 'unpaid' -> 'payment_submitted' -> 'paid'
-- Old 'pending' status means order not yet completed
-- Old 'paid' status means commission has been paid to admin

-- Create platform_settings table for global credit limit
CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create commission_payments table to track payment submissions
CREATE TABLE IF NOT EXISTS commission_payments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR NOT NULL REFERENCES supplier_profiles(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'bank_transfer', 'paypal', 'stripe', etc.
  payment_proof_url TEXT,
  transaction_id TEXT,
  payment_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  notes TEXT,
  verified_by VARCHAR REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create junction table to link payments to commissions
CREATE TABLE IF NOT EXISTS commission_payment_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR NOT NULL REFERENCES commission_payments(id) ON DELETE CASCADE,
  commission_id VARCHAR NOT NULL REFERENCES commissions(id),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default credit limit setting
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES ('default_commission_credit_limit', '1000.00', 'Default credit limit for new suppliers')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_commissions_supplier_status ON commissions(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_supplier ON commission_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(status);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_restricted ON supplier_profiles(is_restricted);

-- Create function to update supplier's unpaid commission total
CREATE OR REPLACE FUNCTION update_supplier_unpaid_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate total unpaid commission for the supplier
  UPDATE supplier_profiles
  SET 
    total_unpaid_commission = (
      SELECT COALESCE(SUM(CAST(commission_amount AS DECIMAL)), 0)
      FROM commissions
      WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
      AND status IN ('unpaid', 'payment_submitted')
    ),
    is_restricted = (
      SELECT COALESCE(SUM(CAST(commission_amount AS DECIMAL)), 0)
      FROM commissions
      WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
      AND status IN ('unpaid', 'payment_submitted')
    ) >= commission_credit_limit
  WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update unpaid commission totals
DROP TRIGGER IF EXISTS trigger_update_unpaid_commission ON commissions;
CREATE TRIGGER trigger_update_unpaid_commission
AFTER INSERT OR UPDATE OR DELETE ON commissions
FOR EACH ROW
EXECUTE FUNCTION update_supplier_unpaid_commission();

-- Update existing commissions to 'unpaid' status if they were 'pending'
-- (This assumes 'pending' meant the commission was owed but not paid)
UPDATE commissions 
SET status = 'unpaid' 
WHERE status = 'pending';

-- Comments for clarity
COMMENT ON COLUMN supplier_profiles.commission_credit_limit IS 'Maximum unpaid commission amount allowed before restrictions';
COMMENT ON COLUMN supplier_profiles.total_unpaid_commission IS 'Current total of unpaid commissions (auto-calculated)';
COMMENT ON COLUMN supplier_profiles.is_restricted IS 'Account restricted due to exceeding credit limit (auto-calculated)';
COMMENT ON TABLE commission_payments IS 'Tracks supplier payments to admin for commissions';
COMMENT ON TABLE commission_payment_items IS 'Links payments to specific commission records';
