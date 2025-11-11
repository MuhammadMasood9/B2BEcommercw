-- Align quotations table with TypeScript schema

-- Rename columns to match schema
ALTER TABLE "quotations" RENAME COLUMN "unit_price" TO "price_per_unit";
ALTER TABLE "quotations" RENAME COLUMN "terms_conditions" TO "message";

-- Drop columns that don't exist in schema
ALTER TABLE "quotations" DROP COLUMN IF EXISTS "validity_period";
ALTER TABLE "quotations" DROP COLUMN IF EXISTS "updated_at";

-- Add columns that exist in schema but not in database
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "admin_id" varchar;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "valid_until" timestamp;
