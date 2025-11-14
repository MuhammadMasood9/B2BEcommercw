-- Migration: Fix payouts table column names
-- Rename columns to match the schema

-- Rename commission_amount to commission_deducted
ALTER TABLE payouts RENAME COLUMN commission_amount TO commission_deducted;

-- Rename method to payout_method
ALTER TABLE payouts RENAME COLUMN method TO payout_method;

-- Add comments
COMMENT ON COLUMN payouts.commission_deducted IS 'Amount of commission deducted from the payout';
COMMENT ON COLUMN payouts.payout_method IS 'Method used for payout (bank_transfer, paypal, etc.)';
