-- Remove foreign key constraint from inquiries.buyer_id to buyers table
-- The buyers table doesn't exist in the current schema, so this constraint is invalid
-- buyer_id should reference users table instead

DO $$ 
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'inquiries_buyer_id_fkey'
        AND table_name = 'inquiries'
    ) THEN
        ALTER TABLE "inquiries" DROP CONSTRAINT "inquiries_buyer_id_fkey";
        RAISE NOTICE 'Dropped inquiries_buyer_id_fkey constraint';
    ELSE
        RAISE NOTICE 'inquiries_buyer_id_fkey constraint does not exist';
    END IF;

    -- Add foreign key to users table instead (if not exists)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'inquiries_buyer_id_users_fkey'
        AND table_name = 'inquiries'
    ) THEN
        ALTER TABLE "inquiries" 
        ADD CONSTRAINT "inquiries_buyer_id_users_fkey" 
        FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE;
        RAISE NOTICE 'Added inquiries_buyer_id_users_fkey constraint';
    ELSE
        RAISE NOTICE 'inquiries_buyer_id_users_fkey constraint already exists';
    END IF;
END $$;
