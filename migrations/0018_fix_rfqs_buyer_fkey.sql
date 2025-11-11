-- Fix rfqs foreign key constraint to reference users table instead of buyers table
-- Drop the incorrect foreign key constraint
ALTER TABLE "rfqs" DROP CONSTRAINT IF EXISTS "rfqs_buyer_id_fkey";

-- Add the correct foreign key constraint pointing to users table
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_buyer_id_fkey" 
  FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Also add foreign key for supplier_id if it doesn't exist
ALTER TABLE "rfqs" DROP CONSTRAINT IF EXISTS "rfqs_supplier_id_fkey";
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_supplier_id_fkey" 
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE SET NULL;

-- Add foreign key for product_id if it doesn't exist
ALTER TABLE "rfqs" DROP CONSTRAINT IF EXISTS "rfqs_product_id_fkey";
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_product_id_fkey" 
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;
