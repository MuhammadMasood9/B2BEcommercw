-- Add approval_status column to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "approval_status" varchar DEFAULT 'pending';

-- Update existing products to have 'approved' status if they were previously approved
UPDATE "products" SET "approval_status" = 'approved' WHERE "is_approved" = true;

-- Create index for approval_status
CREATE INDEX IF NOT EXISTS "products_approval_status_idx" ON "products" ("approval_status");
