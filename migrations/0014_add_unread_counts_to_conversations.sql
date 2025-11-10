-- Add unread count columns to conversations table
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_buyer" integer DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_supplier" integer DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "product_id" varchar;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message" text;

-- Rename admin_id to unread_count_admin if it exists (for backward compatibility)
-- Note: This is a workaround for the schema mismatch
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'admin_id'
  ) THEN
    -- We'll keep admin_id as is since it's referenced in the schema as unreadCountAdmin
    -- The schema.ts maps unreadCountAdmin to admin_id column
  END IF;
END $$;

-- Add foreign key for supplier_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_supplier_id_supplier_profiles_id_fk'
  ) THEN
    ALTER TABLE "conversations" 
    ADD CONSTRAINT "conversations_supplier_id_supplier_profiles_id_fk" 
    FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- Add foreign key for product_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "conversations" 
    ADD CONSTRAINT "conversations_product_id_products_id_fk" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "conversations_supplier_id_idx" ON "conversations" ("supplier_id");
CREATE INDEX IF NOT EXISTS "conversations_product_id_idx" ON "conversations" ("product_id");
