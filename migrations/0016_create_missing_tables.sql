-- Create missing tables for the multivendor marketplace

-- Create inquiry_quotations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "inquiry_quotations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "inquiry_id" varchar NOT NULL,
  "supplier_id" varchar,
  "price_per_unit" numeric(10, 2) NOT NULL,
  "total_price" numeric(10, 2) NOT NULL,
  "moq" integer NOT NULL,
  "lead_time" text,
  "payment_terms" text,
  "valid_until" timestamp,
  "message" text,
  "attachments" text[],
  "status" text DEFAULT 'pending',
  "created_at" timestamp DEFAULT now()
);

-- Add foreign key constraints for inquiry_quotations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inquiry_quotations_inquiry_id_fkey'
    ) THEN
        ALTER TABLE "inquiry_quotations" 
        ADD CONSTRAINT "inquiry_quotations_inquiry_id_fkey" 
        FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inquiry_quotations_supplier_id_fkey'
    ) THEN
        ALTER TABLE "inquiry_quotations" 
        ADD CONSTRAINT "inquiry_quotations_supplier_id_fkey" 
        FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Add quotations_count column to supplier_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'supplier_profiles' AND column_name = 'quotations_count'
    ) THEN
        ALTER TABLE "supplier_profiles" ADD COLUMN "quotations_count" integer DEFAULT 0;
        RAISE NOTICE 'Added quotations_count column to supplier_profiles';
    END IF;
END $$;

-- Add product_id column to rfqs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rfqs' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE "rfqs" ADD COLUMN "product_id" varchar;
        RAISE NOTICE 'Added product_id column to rfqs';
    END IF;
END $$;

-- Display created tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('inquiry_quotations', 'rfqs')
ORDER BY table_name;
