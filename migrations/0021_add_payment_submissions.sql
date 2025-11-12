-- Create payment_submissions table
CREATE TABLE IF NOT EXISTS payment_submissions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id VARCHAR NOT NULL,
    amount DECIMAL NOT NULL,
    commission_ids JSON NOT NULL,
    payment_method TEXT DEFAULT 'bank_transfer',
    status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    verified_by VARCHAR,
    rejection_reason TEXT,
    proof_of_payment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update commissions table structure
ALTER TABLE commissions 
DROP COLUMN IF EXISTS order_amount,
DROP COLUMN IF EXISTS commission_rate,
DROP COLUMN IF EXISTS commission_amount,
DROP COLUMN IF EXISTS supplier_amount,
DROP COLUMN IF EXISTS payment_proof_url,
DROP COLUMN IF EXISTS payment_transaction_id,
DROP COLUMN IF EXISTS payment_date,
DROP COLUMN IF EXISTS payment_submitted_at,
DROP COLUMN IF EXISTS payment_verified_by,
DROP COLUMN IF EXISTS payment_verified_at;

-- Add new columns to commissions if they don't exist
ALTER TABLE commissions 
ADD COLUMN IF NOT EXISTS amount DECIMAL,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Update commissions status values
UPDATE commissions SET status = 'pending' WHERE status = 'unpaid';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_submissions_supplier_id ON payment_submissions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_supplier_status ON commissions(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_due_date ON commissions(due_date);