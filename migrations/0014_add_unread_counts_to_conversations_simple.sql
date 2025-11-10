-- Add unread count columns to conversations table
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_buyer" integer DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_supplier" integer DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "product_id" varchar;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message" text;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "conversations_supplier_id_idx" ON "conversations" ("supplier_id");
CREATE INDEX IF NOT EXISTS "conversations_product_id_idx" ON "conversations" ("product_id");
