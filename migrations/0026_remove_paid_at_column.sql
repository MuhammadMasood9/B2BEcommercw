-- Migration: Remove paid_at column from commissions table
-- This column is redundant as we already have payment_date column

-- Remove paid_at column if it exists
ALTER TABLE commissions DROP COLUMN IF EXISTS paid_at;
