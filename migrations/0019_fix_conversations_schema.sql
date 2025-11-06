-- Fix conversations table schema to include missing columns for backward compatibility

-- Add missing columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS product_id VARCHAR,
ADD COLUMN IF NOT EXISTS unread_count_buyer INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unread_count_admin VARCHAR DEFAULT '0',
ADD COLUMN IF NOT EXISTS unread_count_supplier INTEGER DEFAULT 0;

-- Update existing conversations to have default values
UPDATE conversations 
SET 
  unread_count_buyer = 0,
  unread_count_admin = '0',
  unread_count_supplier = 0
WHERE 
  unread_count_buyer IS NULL 
  OR unread_count_admin IS NULL 
  OR unread_count_supplier IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_supplier_id ON conversations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_unread_count_admin ON conversations(unread_count_admin);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);