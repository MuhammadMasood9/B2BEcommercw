-- Migration: Add paid_at column to commissions table
-- This column tracks when a commission was marked as paid

ALTER TABLE commissions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Add comment to explain the column
COMMENT ON COLUMN commissions.paid_at IS 'Timestamp when the commission was marked as paid';
