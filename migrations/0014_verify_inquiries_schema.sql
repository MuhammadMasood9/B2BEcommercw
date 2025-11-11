-- Verify and fix inquiries table schema
-- This migration ensures all required columns exist

DO $$ 
BEGIN
    -- Check if target_price column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'target_price'
    ) THEN
        ALTER TABLE "inquiries" ADD COLUMN "target_price" numeric(10, 2);
        RAISE NOTICE 'Added target_price column to inquiries table';
    ELSE
        RAISE NOTICE 'target_price column already exists in inquiries table';
    END IF;

    -- Check if supplier_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'supplier_id'
    ) THEN
        ALTER TABLE "inquiries" ADD COLUMN "supplier_id" varchar;
        RAISE NOTICE 'Added supplier_id column to inquiries table';
    ELSE
        RAISE NOTICE 'supplier_id column already exists in inquiries table';
    END IF;

    -- Check if quantity column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE "inquiries" ADD COLUMN "quantity" integer NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added quantity column to inquiries table';
    ELSE
        RAISE NOTICE 'quantity column already exists in inquiries table';
    END IF;

    -- Check if message column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'message'
    ) THEN
        ALTER TABLE "inquiries" ADD COLUMN "message" text;
        RAISE NOTICE 'Added message column to inquiries table';
    ELSE
        RAISE NOTICE 'message column already exists in inquiries table';
    END IF;

    -- Check if requirements column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'requirements'
    ) THEN
        ALTER TABLE "inquiries" ADD COLUMN "requirements" text;
        RAISE NOTICE 'Added requirements column to inquiries table';
    ELSE
        RAISE NOTICE 'requirements column already exists in inquiries table';
    END IF;

    -- Check if status column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE "inquiries" ADD COLUMN "status" text DEFAULT 'pending';
        RAISE NOTICE 'Added status column to inquiries table';
    ELSE
        RAISE NOTICE 'status column already exists in inquiries table';
    END IF;

    -- Check if created_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE "inquiries" ADD COLUMN "created_at" timestamp DEFAULT now();
        RAISE NOTICE 'Added created_at column to inquiries table';
    ELSE
        RAISE NOTICE 'created_at column already exists in inquiries table';
    END IF;
END $$;

-- Display current schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inquiries'
ORDER BY ordinal_position;
