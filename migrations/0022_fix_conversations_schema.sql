-- Fix conversations table schema
-- This migration cleans up the confusing unread_count_admin field and adds proper admin support

-- Step 1: Add new admin_id column
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "admin_id" varchar;

-- Step 2: Add new unread_count_admin_new column (temporary)
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_admin_new" integer DEFAULT 0;

-- Step 3: Add type column if it doesn't exist
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'buyer_supplier';

-- Step 4: Migrate data from old unread_count_admin (which stores admin_id) to new admin_id column
UPDATE "conversations" 
SET "admin_id" = "unread_count_admin"
WHERE "unread_count_admin" IS NOT NULL 
  AND "unread_count_admin" != '';

-- Step 5: Set conversation type based on participants
UPDATE "conversations"
SET "type" = CASE
  WHEN "admin_id" IS NOT NULL AND "supplier_id" IS NOT NULL THEN 'support'
  WHEN "admin_id" IS NOT NULL AND "supplier_id" IS NULL THEN 'buyer_admin'
  WHEN "supplier_id" IS NOT NULL THEN 'buyer_supplier'
  ELSE 'buyer_supplier'
END;

-- Step 6: Drop the old confusing unread_count_admin column
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "unread_count_admin";

-- Step 7: Rename the new column to unread_count_admin
ALTER TABLE "conversations" RENAME COLUMN "unread_count_admin_new" TO "unread_count_admin";

-- Step 8: Add foreign key constraint for admin_id
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_admin_id_users_id_fk'
  ) THEN
    ALTER TABLE "conversations" 
    ADD CONSTRAINT "conversations_admin_id_users_id_fk" 
    FOREIGN KEY ("admin_id") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $;

-- Step 9: Update foreign key constraints to use CASCADE for buyer_id and supplier_id
DO $
BEGIN
  -- Drop existing buyer_id constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_buyer_id_users_id_fk'
  ) THEN
    ALTER TABLE "conversations" DROP CONSTRAINT "conversations_buyer_id_users_id_fk";
  END IF;
  
  -- Add buyer_id constraint with CASCADE
  ALTER TABLE "conversations" 
  ADD CONSTRAINT "conversations_buyer_id_users_id_fk" 
  FOREIGN KEY ("buyer_id") REFERENCES "users"("id") 
  ON DELETE CASCADE ON UPDATE NO ACTION;
END $;

DO $
BEGIN
  -- Drop existing supplier_id constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_supplier_id_supplier_profiles_id_fk'
  ) THEN
    ALTER TABLE "conversations" DROP CONSTRAINT "conversations_supplier_id_supplier_profiles_id_fk";
  END IF;
  
  -- Note: supplier_id should reference users table, not supplier_profiles
  -- Add supplier_id constraint with CASCADE
  ALTER TABLE "conversations" 
  ADD CONSTRAINT "conversations_supplier_id_users_id_fk" 
  FOREIGN KEY ("supplier_id") REFERENCES "users"("id") 
  ON DELETE CASCADE ON UPDATE NO ACTION;
END $;

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS "conversations_admin_id_idx" ON "conversations" ("admin_id");
CREATE INDEX IF NOT EXISTS "conversations_buyer_id_idx" ON "conversations" ("buyer_id");
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" ("last_message_at" DESC);
CREATE INDEX IF NOT EXISTS "conversations_type_idx" ON "conversations" ("type");

-- Step 11: Update messages table to add receiver_id and sender_type if they don't exist
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "receiver_id" varchar;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender_type" text DEFAULT 'buyer';

-- Step 12: Add foreign key constraints for messages table
DO $
BEGIN
  -- Add constraint for conversation_id with CASCADE
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_conversation_id_conversations_id_fk'
  ) THEN
    ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_conversations_id_fk";
  END IF;
  
  ALTER TABLE "messages" 
  ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" 
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") 
  ON DELETE CASCADE ON UPDATE NO ACTION;
END $;

DO $
BEGIN
  -- Add constraint for sender_id with CASCADE
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_sender_id_users_id_fk'
  ) THEN
    ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_users_id_fk";
  END IF;
  
  ALTER TABLE "messages" 
  ADD CONSTRAINT "messages_sender_id_users_id_fk" 
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") 
  ON DELETE CASCADE ON UPDATE NO ACTION;
END $;

DO $
BEGIN
  -- Add constraint for receiver_id with SET NULL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_receiver_id_users_id_fk'
  ) THEN
    ALTER TABLE "messages" 
    ADD CONSTRAINT "messages_receiver_id_users_id_fk" 
    FOREIGN KEY ("receiver_id") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $;

-- Step 13: Create indexes for messages table
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages" ("conversation_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" ("sender_id");
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages" ("receiver_id");
CREATE INDEX IF NOT EXISTS "messages_unread_idx" ON "messages" ("receiver_id", "is_read") WHERE "is_read" = false;

-- Step 14: Clean up orphaned conversations (optional - removes conversations with invalid references)
-- Uncomment if you want to remove orphaned data
-- DELETE FROM "conversations" WHERE "buyer_id" NOT IN (SELECT "id" FROM "users");
-- DELETE FROM "conversations" WHERE "supplier_id" IS NOT NULL AND "supplier_id" NOT IN (SELECT "id" FROM "users");
-- DELETE FROM "conversations" WHERE "admin_id" IS NOT NULL AND "admin_id" NOT IN (SELECT "id" FROM "users");
