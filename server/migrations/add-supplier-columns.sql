-- Migration to add missing supplier-related columns to conversations table
-- This fixes the "column unread_count_supplier does not exist" error

-- Add missing columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS supplier_id VARCHAR;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS unread_count_buyer INTEGER DEFAULT 0;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS unread_count_supplier INTEGER DEFAULT 0;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS product_id VARCHAR;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_supplier_id ON conversations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);