-- Simple migration: Add commission payment tracking fields

-- Step 1: Add credit limit and restriction fields to supplier_profiles
ALTER TABLE supplier_profiles 
ADD COLUMN IF NOT EXISTS commission_credit_limit DECIMAL(10, 2) DEFAULT 1000.00;

ALTER TABLE supplier_profiles 
ADD COLUMN IF NOT EXISTS total_unpaid_commission DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE supplier_profiles 
ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;

ALTER TABLE supplier_profiles 
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP;

ALTER TABLE supplier_profiles 
ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMP;

-- Step 2: Add payment tracking fields to commissions table
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;

ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP;

ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_verified_by VARCHAR;

ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP;

-- Step 3: Create commission_payments table
CREATE TABLE IF NOT EXISTS commission_payments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_proof_url TEXT,
  transaction_id TEXT,
  payment_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  verified_by VARCHAR,
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create commission_payment_items table
CREATE TABLE IF NOT EXISTS commission_payment_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR NOT NULL,
  commission_id VARCHAR NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_commissions_supplier_status ON commissions(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_supplier ON commission_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(status);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_restricted ON supplier_profiles(is_restricted);
