-- Database Cleanup Migration for Chat Management System
-- This migration removes orphaned conversations and ensures data integrity

-- Step 1: Remove orphaned conversations with invalid buyer references
DELETE FROM "conversations" 
WHERE "buyer_id" NOT IN (SELECT "id" FROM "users");

-- Step 2: Remove orphaned conversations with invalid supplier references
DELETE FROM "conversations" 
WHERE "supplier_id" IS NOT NULL 
  AND "supplier_id" NOT IN (SELECT "id" FROM "users");

-- Step 3: Remove orphaned conversations with invalid admin references
DELETE FROM "conversations" 
WHERE "admin_id" IS NOT NULL 
  AND "admin_id" NOT IN (SELECT "id" FROM "users");

-- Step 4: Remove orphaned conversations with invalid product references
DELETE FROM "conversations" 
WHERE "product_id" IS NOT NULL 
  AND "product_id" NOT IN (SELECT "id" FROM "products");

-- Step 5: Remove orphaned messages with invalid conversation references
-- (This should be handled by CASCADE, but let's be explicit)
DELETE FROM "messages" 
WHERE "conversation_id" NOT IN (SELECT "id" FROM "conversations");

-- Step 6: Remove orphaned messages with invalid sender references
DELETE FROM "messages" 
WHERE "sender_id" NOT IN (SELECT "id" FROM "users");

-- Step 7: Clean up invalid receiver references (set to NULL instead of delete)
UPDATE "messages" 
SET "receiver_id" = NULL 
WHERE "receiver_id" IS NOT NULL 
  AND "receiver_id" NOT IN (SELECT "id" FROM "users");

-- Step 8: Ensure all foreign key constraints are properly set with CASCADE
-- This is a safety check in case previous migrations didn't complete properly

-- Drop and recreate conversations.buyer_id constraint
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_buyer_id_users_id_fk'
  ) THEN
    ALTER TABLE "conversations" DROP CONSTRAINT "conversations_buyer_id_users_id_fk";
  END IF;
  
  ALTER TABLE "conversations" 
  ADD CONSTRAINT "conversations_buyer_id_users_id_fk" 
  FOREIGN KEY ("buyer_id") REFERENCES "users"("id") 
  ON DELETE CASCADE;
END $;

-- Drop and recreate conversations.supplier_id constraint
DO $
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
  
  -- Add the correct constraint
  ALTER TABLE "conversations" 
  ADD CONSTRAINT "conversations_supplier_id_users_id_fk" 
  FOREIGN KEY ("supplier_id") REFERENCES "users"("id") 
  ON DELETE CASCADE;
END $;

-- Drop and recreate conversations.admin_id constraint
DO $
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
END $;

-- Drop and recreate conversations.product_id constraint
DO $
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
END $;

-- Drop and recreate messages.conversation_id constraint
DO $
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
END $;

-- Drop and recreate messages.sender_id constraint
DO $
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
END $;

-- Drop and recreate messages.receiver_id constraint
DO $
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
  
  -- Add the correct constraint
  ALTER TABLE "messages" 
  ADD CONSTRAINT "messages_receiver_id_users_id_fk" 
  FOREIGN KEY ("receiver_id") REFERENCES "users"("id") 
  ON DELETE SET NULL;
END $;

-- Step 9: Create additional performance indexes if they don't exist
CREATE INDEX IF NOT EXISTS "conversations_admin_id_idx" ON "conversations" ("admin_id");
CREATE INDEX IF NOT EXISTS "conversations_buyer_id_idx" ON "conversations" ("buyer_id");
CREATE INDEX IF NOT EXISTS "conversations_supplier_id_idx" ON "conversations" ("supplier_id");
CREATE INDEX IF NOT EXISTS "conversations_product_id_idx" ON "conversations" ("product_id");
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" ("last_message_at" DESC);
CREATE INDEX IF NOT EXISTS "conversations_type_idx" ON "conversations" ("type");
CREATE INDEX IF NOT EXISTS "conversations_created_at_idx" ON "conversations" ("created_at" DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "conversations_buyer_last_message_idx" ON "conversations" ("buyer_id", "last_message_at" DESC);
CREATE INDEX IF NOT EXISTS "conversations_supplier_last_message_idx" ON "conversations" ("supplier_id", "last_message_at" DESC);
CREATE INDEX IF NOT EXISTS "conversations_admin_last_message_idx" ON "conversations" ("admin_id", "last_message_at" DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages" ("conversation_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" ("sender_id");
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages" ("receiver_id");
CREATE INDEX IF NOT EXISTS "messages_unread_idx" ON "messages" ("receiver_id", "is_read") WHERE "is_read" = false;
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages" ("created_at" DESC);

-- Composite indexes for pagination and filtering
CREATE INDEX IF NOT EXISTS "messages_sender_created_at_idx" ON "messages" ("sender_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "messages_conversation_sender_idx" ON "messages" ("conversation_id", "sender_id", "created_at" DESC);

-- Step 10: Update statistics for query planner optimization
ANALYZE "conversations";
ANALYZE "messages";

-- Step 11: Log cleanup completion
DO $
BEGIN
  RAISE NOTICE 'Database cleanup completed successfully';
  RAISE NOTICE 'Orphaned conversations and messages have been removed';
  RAISE NOTICE 'Foreign key constraints have been updated with proper CASCADE behavior';
  RAISE NOTICE 'Performance indexes have been created';
END $;