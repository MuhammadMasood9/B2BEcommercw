-- Direct fix for conversations table schema
-- This migration handles the actual current state of the database

-- Step 1: Check and fix unread_count_admin column type
DO $$
BEGIN
  -- Check if unread_count_admin is text/varchar
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'unread_count_admin'
    AND data_type IN ('text', 'character varying')
  ) THEN
    -- First, ensure admin_id column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'admin_id'
    ) THEN
      ALTER TABLE "conversations" ADD COLUMN "admin_id" varchar;
    END IF;
    
    -- Copy data from unread_count_admin to admin_id (it was storing admin IDs)
    UPDATE "conversations" 
    SET "admin_id" = "unread_count_admin"
    WHERE "unread_count_admin" IS NOT NULL 
      AND "unread_count_admin" != ''
      AND "admin_id" IS NULL;
    
    -- Drop the old column
    ALTER TABLE "conversations" DROP COLUMN "unread_count_admin";
    
    -- Add it back as integer
    ALTER TABLE "conversations" ADD COLUMN "unread_count_admin" integer DEFAULT 0;
  END IF;
END $$;

-- Step 2: Ensure type column exists and has correct default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'type'
  ) THEN
    ALTER TABLE "conversations" ADD COLUMN "type" text DEFAULT 'buyer_supplier';
  END IF;
END $$;

-- Step 3: Set conversation types based on participants
UPDATE "conversations"
SET "type" = CASE
  WHEN "admin_id" IS NOT NULL AND "supplier_id" IS NOT NULL THEN 'support'
  WHEN "admin_id" IS NOT NULL AND "supplier_id" IS NULL THEN 'buyer_admin'
  WHEN "supplier_id" IS NOT NULL THEN 'buyer_supplier'
  ELSE 'buyer_supplier'
END
WHERE "type" IS NULL OR "type" = '';

-- Step 4: Ensure all required columns exist
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "product_id" varchar;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message" text;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message_at" timestamp;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_buyer" integer DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_supplier" integer DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();

-- Step 5: Add receiver_id and sender_type to messages if they don't exist
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "receiver_id" varchar;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender_type" text DEFAULT 'buyer';

-- Step 6: Drop and recreate foreign key constraints with proper CASCADE behavior
-- For conversations.buyer_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_buyer_id_users_id_fk'
  ) THEN
    ALTER TABLE "conversations" DROP CONSTRAINT "conversations_buyer_id_users_id_fk";
  END IF;
  
  -- Only add if buyer_id column exists and is varchar
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'buyer_id'
    AND data_type IN ('character varying', 'varchar')
  ) THEN
    ALTER TABLE "conversations" 
    ADD CONSTRAINT "conversations_buyer_id_users_id_fk" 
    FOREIGN KEY ("buyer_id") REFERENCES "users"("id") 
    ON DELETE CASCADE;
  END IF;
END $$;

-- For conversations.supplier_id - Drop ALL existing constraints first
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Drop all foreign key constraints on supplier_id
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'conversations' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%supplier_id%'
  LOOP
    EXECUTE 'ALTER TABLE conversations DROP CONSTRAINT ' || constraint_rec.constraint_name;
  END LOOP;
END $$;

-- Clean up orphaned supplier_ids (convert supplier_profile IDs to user IDs)
UPDATE "conversations" c
SET "supplier_id" = sp."user_id"
FROM "supplier_profiles" sp
WHERE c."supplier_id" = sp."id"
  AND c."supplier_id" NOT IN (SELECT "id" FROM "users");

-- Set NULL for any remaining invalid supplier_ids
UPDATE "conversations"
SET "supplier_id" = NULL
WHERE "supplier_id" IS NOT NULL 
  AND "supplier_id" NOT IN (SELECT "id" FROM "users");

-- Now add the correct constraint
ALTER TABLE "conversations" 
ADD CONSTRAINT "conversations_supplier_id_users_id_fk" 
FOREIGN KEY ("supplier_id") REFERENCES "users"("id") 
ON DELETE CASCADE;

-- For conversations.admin_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_admin_id_users_id_fk'
  ) THEN
    ALTER TABLE "conversations" DROP CONSTRAINT "conversations_admin_id_users_id_fk";
  END IF;
  
  ALTER TABLE "conversations" 
  ADD CONSTRAINT "conversations_admin_id_users_id_fk" 
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") 
  ON DELETE SET NULL;
END $$;

-- For conversations.product_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "conversations" DROP CONSTRAINT "conversations_product_id_products_id_fk";
  END IF;
  
  ALTER TABLE "conversations" 
  ADD CONSTRAINT "conversations_product_id_products_id_fk" 
  FOREIGN KEY ("product_id") REFERENCES "products"("id") 
  ON DELETE SET NULL;
END $$;

-- For messages.conversation_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_conversation_id_conversations_id_fk'
  ) THEN
    ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_conversations_id_fk";
  END IF;
  
  ALTER TABLE "messages" 
  ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" 
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") 
  ON DELETE CASCADE;
END $$;

-- For messages.sender_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_sender_id_users_id_fk'
  ) THEN
    ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_users_id_fk";
  END IF;
  
  ALTER TABLE "messages" 
  ADD CONSTRAINT "messages_sender_id_users_id_fk" 
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") 
  ON DELETE CASCADE;
END $$;

-- For messages.receiver_id
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Drop all foreign key constraints on receiver_id
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'messages' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%receiver_id%'
  LOOP
    EXECUTE 'ALTER TABLE messages DROP CONSTRAINT ' || constraint_rec.constraint_name;
  END LOOP;
END $$;

-- Clean up orphaned receiver_ids (convert supplier_profile IDs to user IDs if needed)
UPDATE "messages" m
SET "receiver_id" = sp."user_id"
FROM "supplier_profiles" sp
WHERE m."receiver_id" = sp."id"
  AND m."receiver_id" NOT IN (SELECT "id" FROM "users");

-- Set NULL for any remaining invalid receiver_ids
UPDATE "messages"
SET "receiver_id" = NULL
WHERE "receiver_id" IS NOT NULL 
  AND "receiver_id" NOT IN (SELECT "id" FROM "users");

-- Now add the correct constraint
ALTER TABLE "messages" 
ADD CONSTRAINT "messages_receiver_id_users_id_fk" 
FOREIGN KEY ("receiver_id") REFERENCES "users"("id") 
ON DELETE SET NULL;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS "conversations_admin_id_idx" ON "conversations" ("admin_id");
CREATE INDEX IF NOT EXISTS "conversations_buyer_id_idx" ON "conversations" ("buyer_id");
CREATE INDEX IF NOT EXISTS "conversations_supplier_id_idx" ON "conversations" ("supplier_id");
CREATE INDEX IF NOT EXISTS "conversations_product_id_idx" ON "conversations" ("product_id");
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" ("last_message_at" DESC);
CREATE INDEX IF NOT EXISTS "conversations_type_idx" ON "conversations" ("type");

CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages" ("conversation_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" ("sender_id");
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages" ("receiver_id");
CREATE INDEX IF NOT EXISTS "messages_unread_idx" ON "messages" ("receiver_id", "is_read") WHERE "is_read" = false;
