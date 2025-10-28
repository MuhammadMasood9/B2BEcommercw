-- Migration to add productId column to rfqs table
-- This allows RFQs to be linked to specific products

ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS product_id VARCHAR(255);

