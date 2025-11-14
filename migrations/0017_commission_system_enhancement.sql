-- Commission System Enhancement Migration
-- This migration adds support for tiered commission rates and supplier restrictions

-- Add new columns to commissions table
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS order_amount DECIMAL(10, 2);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS payment_verified_by VARCHAR;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

-- Update commissions status to include more states
-- Status can be: 'unpaid', 'payment_submitted', 'paid', 'overdue', 'disputed'

-- Create commission_tiers table for tiered commission rates
CREATE TABLE IF NOT EXISTS commission_tiers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  min_amount DECIMAL(10, 2) NOT NULL,
  max_amount DECIMAL(10, 2),
  commission_rate DECIMAL(5, 4) NOT NULL, -- e.g., 0.05 for 5%, 0.10 for 10%
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default commission tiers based on requirements
-- Below 10,000 Rs = 5%
-- 10,000 - 100,000 Rs = 10%
-- Above 100,000 Rs = 15% (example)
INSERT INTO commission_tiers (min_amount, max_amount, commission_rate, description, is_active)
VALUES 
  (0, 10000, 0.05, 'Orders below ₹10,000 - 5% commission', true),
  (10000, 100000, 0.10, 'Orders between ₹10,000 and ₹1,00,000 - 10% commission', true),
  (100000, NULL, 0.15, 'Orders above ₹1,00,000 - 15% commission', true)
ON CONFLICT DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commissions_supplier_status ON commissions(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_due_date ON commissions(due_date);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_restricted ON supplier_profiles(is_restricted);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_unpaid_commission ON supplier_profiles(total_unpaid_commission);

-- Create function to calculate commission based on tiers
CREATE OR REPLACE FUNCTION calculate_commission_rate(order_amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  rate DECIMAL;
BEGIN
  SELECT commission_rate INTO rate
  FROM commission_tiers
  WHERE is_active = true
    AND order_amount >= min_amount
    AND (max_amount IS NULL OR order_amount < max_amount)
  ORDER BY min_amount DESC
  LIMIT 1;
  
  -- Default to 10% if no tier found
  RETURN COALESCE(rate, 0.10);
END;
$$ LANGUAGE plpgsql;

-- Create function to check and update supplier restriction status
CREATE OR REPLACE FUNCTION check_supplier_restriction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if total unpaid commission exceeds credit limit
  IF NEW.total_unpaid_commission >= NEW.commission_credit_limit THEN
    NEW.is_restricted := true;
  ELSE
    NEW.is_restricted := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update restriction status
DROP TRIGGER IF EXISTS trigger_check_supplier_restriction ON supplier_profiles;
CREATE TRIGGER trigger_check_supplier_restriction
  BEFORE UPDATE OF total_unpaid_commission ON supplier_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_supplier_restriction();

-- Create function to update supplier unpaid commission total
CREATE OR REPLACE FUNCTION update_supplier_unpaid_total()
RETURNS TRIGGER AS $$
DECLARE
  supplier_id_val VARCHAR;
  total_unpaid DECIMAL;
BEGIN
  -- Get supplier_id from NEW or OLD record
  supplier_id_val := COALESCE(NEW.supplier_id, OLD.supplier_id);
  
  -- Calculate total unpaid commission for this supplier
  SELECT COALESCE(SUM(CAST(commission_amount AS DECIMAL)), 0)
  INTO total_unpaid
  FROM commissions
  WHERE supplier_id = supplier_id_val
    AND status IN ('unpaid', 'payment_submitted', 'overdue');
  
  -- Update supplier profile
  UPDATE supplier_profiles
  SET total_unpaid_commission = total_unpaid::TEXT,
      updated_at = NOW()
  WHERE id = supplier_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update supplier unpaid total
DROP TRIGGER IF EXISTS trigger_update_supplier_unpaid_total ON commissions;
CREATE TRIGGER trigger_update_supplier_unpaid_total
  AFTER INSERT OR UPDATE OF status ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_unpaid_total();

-- Add platform settings for commission system
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES 
  ('commission_payment_grace_period_days', '30', 'Number of days before commission payment becomes overdue'),
  ('commission_reminder_days_before_due', '7', 'Send reminder X days before commission due date'),
  ('commission_auto_restrict_on_overdue', 'true', 'Automatically restrict supplier when commission is overdue')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description;

-- Create view for supplier commission summary
CREATE OR REPLACE VIEW supplier_commission_summary AS
SELECT 
  sp.id as supplier_id,
  sp.user_id,
  sp.business_name,
  sp.store_name,
  sp.commission_credit_limit,
  sp.total_unpaid_commission,
  sp.is_restricted,
  sp.last_payment_date,
  COUNT(CASE WHEN c.status = 'unpaid' THEN 1 END) as unpaid_count,
  COUNT(CASE WHEN c.status = 'overdue' THEN 1 END) as overdue_count,
  COUNT(CASE WHEN c.status = 'paid' THEN 1 END) as paid_count,
  COALESCE(SUM(CASE WHEN c.status = 'unpaid' THEN CAST(c.commission_amount AS DECIMAL) END), 0) as unpaid_amount,
  COALESCE(SUM(CASE WHEN c.status = 'overdue' THEN CAST(c.commission_amount AS DECIMAL) END), 0) as overdue_amount,
  COALESCE(SUM(CASE WHEN c.status = 'paid' THEN CAST(c.commission_amount AS DECIMAL) END), 0) as paid_amount,
  MIN(CASE WHEN c.status IN ('unpaid', 'overdue') THEN c.due_date END) as earliest_due_date
FROM supplier_profiles sp
LEFT JOIN commissions c ON sp.id = c.supplier_id
GROUP BY sp.id, sp.user_id, sp.business_name, sp.store_name, 
         sp.commission_credit_limit, sp.total_unpaid_commission, 
         sp.is_restricted, sp.last_payment_date;

COMMENT ON TABLE commission_tiers IS 'Tiered commission rates based on order amount';
COMMENT ON TABLE commissions IS 'Commission records for each order with payment tracking';
COMMENT ON COLUMN supplier_profiles.is_restricted IS 'Supplier is restricted when unpaid commission exceeds credit limit';
COMMENT ON COLUMN supplier_profiles.commission_credit_limit IS 'Maximum unpaid commission allowed before restriction';
COMMENT ON COLUMN supplier_profiles.total_unpaid_commission IS 'Current total of unpaid commissions';
