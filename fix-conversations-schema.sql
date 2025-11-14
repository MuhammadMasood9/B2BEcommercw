-- Fix conversations table schema to match the updated requirements
-- This migration adds the missing columns and fixes the schema

-- Step 1: Add admin_id column if it doesn't exist
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "admin_id" varchar;

-- Step 2: Add supplier_id column if it doesn't exist  
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;

-- Step 3: Add type column if it doesn't exist
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'buyer_supplier';

-- Step 4: Add proper unread count columns
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_buyer" integer DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_supplier" integer DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_admin" integer DEFAULT 0;

-- Step 5: Add last_message and last_message_at columns if they don't exist
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message" text;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message_at" timestamp;

-- Step 6: Add product_id column if it doesn't exist
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "product_id" varchar;

-- Step 7: Update existing conversations to have proper type
UPDATE "conversations" 
SET "type" = 'buyer_supplier' 
WHERE "type" IS NULL OR "type" = '';

-- Step 8: Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add admin_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_admin_id_users_id_fk'
  ) THEN
    ALTER TABLE "conversations" 
    ADD CONSTRAINT "conversations_admin_id_users_id_fk" 
    FOREIGN KEY ("admin_id") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;

  -- Add supplier_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_supplier_id_users_id_fk'
  ) THEN
    ALTER TABLE "conversations" 
    ADD CONSTRAINT "conversations_supplier_id_users_id_fk" 
    FOREIGN KEY ("supplier_id") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;

  -- Add product_id foreign key
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

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS "conversations_admin_id_idx" ON "conversations" ("admin_id");
CREATE INDEX IF NOT EXISTS "conversations_supplier_id_idx" ON "conversations" ("supplier_id");
CREATE INDEX IF NOT EXISTS "conversations_product_id_idx" ON "conversations" ("product_id");
CREATE INDEX IF NOT EXISTS "conversations_type_idx" ON "conversations" ("type");
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" ("last_message_at" DESC);

-- Step 10: Update messages table to add missing columns
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "receiver_id" varchar;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender_type" text DEFAULT 'buyer';

-- Step 11: Add foreign key for receiver_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_receiver_id_users_id_fk'
  ) THEN
    ALTER TABLE "messages" 
    ADD CONSTRAINT "messages_receiver_id_users_id_fk" 
    FOREIGN KEY ("receiver_id") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- Step 12: Create indexes for messages table
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages" ("receiver_id");
CREATE INDEX IF NOT EXISTS "messages_sender_type_idx" ON "messages" ("sender_type");
CREATE INDEX IF NOT EXISTS "messages_conversation_created_idx" ON "messages" ("conversation_id", "created_at" DESC);