-- Align rfqs table with TypeScript schema
-- Drop columns that don't exist in schema (keeping specifications for now as it might be used)
ALTER TABLE "rfqs" DROP COLUMN IF EXISTS "budget_range";
ALTER TABLE "rfqs" DROP COLUMN IF EXISTS "payment_terms";
ALTER TABLE "rfqs" DROP COLUMN IF EXISTS "updated_at";
ALTER TABLE "rfqs" DROP COLUMN IF EXISTS "required_delivery_date";

-- Add columns that exist in schema but not in database
ALTER TABLE "rfqs" ADD COLUMN IF NOT EXISTS "expected_date" timestamp;
ALTER TABLE "rfqs" ADD COLUMN IF NOT EXISTS "attachments" text[];
ALTER TABLE "rfqs" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "rfqs" ADD COLUMN IF NOT EXISTS "quotations_count" integer DEFAULT 0;

-- Ensure product_id exists (should already exist from migration 0008)
ALTER TABLE "rfqs" ADD COLUMN IF NOT EXISTS "product_id" varchar;
