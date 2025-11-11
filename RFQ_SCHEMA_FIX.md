# RFQ Schema Fix - Database Alignment

## Problem
RFQ creation was failing with the error:
```
column "product_id" of relation "rfqs" does not exist
```

Later, after adding `product_id`, it failed with:
```
column "expected_date" of relation "rfqs" does not exist
```

## Root Cause
The database schema for the `rfqs` table was out of sync with the TypeScript schema defined in `shared/schema.ts`. The database had been manually modified or had old migrations applied that didn't match the current codebase.

### Database Schema Issues Found:
1. Missing columns: `expected_date`, `attachments`, `supplier_id`, `quotations_count`, `product_id`
2. Extra columns: `required_delivery_date`, `budget_range`, `payment_terms`, `updated_at`, `specifications`

## Solution Applied

### Migration 0017: Align RFQs Schema
Created `migrations/0017_align_rfqs_schema.sql` to:
- Drop unused columns: `budget_range`, `payment_terms`, `updated_at`, `required_delivery_date`
- Keep `specifications` column (might be used elsewhere)
- Add missing columns: `expected_date`, `attachments`, `supplier_id`, `quotations_count`, `product_id`

### Scripts Created:
1. `scripts/run-migration-0017.ts` - Runs the alignment migration
2. `scripts/add-expected-date.ts` - Specifically adds the expected_date column
3. `scripts/check-rfqs-schema.ts` - Verifies the rfqs table schema
4. `scripts/fix-rfqs-product-id.ts` - Checks and adds product_id column

## Final Schema
The `rfqs` table now has the following columns:
- `id` (varchar, PRIMARY KEY)
- `buyer_id` (varchar, NOT NULL)
- `title` (varchar, NOT NULL)
- `description` (text)
- `category_id` (varchar)
- `specifications` (jsonb)
- `quantity` (integer, NOT NULL)
- `target_price` (numeric)
- `delivery_location` (varchar)
- `status` (varchar)
- `expires_at` (timestamp)
- `created_at` (timestamp, NOT NULL)
- `product_id` (varchar) ✅ ADDED
- `attachments` (text[]) ✅ ADDED
- `supplier_id` (varchar) ✅ ADDED
- `quotations_count` (integer) ✅ ADDED
- `expected_date` (timestamp) ✅ ADDED

## Additional Issue: Foreign Key Constraint

After fixing the schema, another issue was discovered:
```
insert or update on table "rfqs" violates foreign key constraint "rfqs_buyer_id_fkey"
Key (buyer_id)=(3f9ae933-500b-45e4-8f84-872c909e7799) is not present in table "buyers"
```

### Root Cause
The `rfqs_buyer_id_fkey` constraint was incorrectly pointing to the `buyers` table instead of the `users` table. The application uses `users.id` for buyer identification, not `buyers.id`.

### Solution
Created `migrations/0018_fix_rfqs_buyer_fkey.sql` to:
- Drop the incorrect `rfqs_buyer_id_fkey` constraint
- Add correct constraint: `buyer_id` → `users.id`
- Add missing constraints: `supplier_id` → `supplier_profiles.id`
- Add missing constraints: `product_id` → `products.id`

## Result
✅ RFQ creation now works correctly with product-specific RFQs
✅ All required columns are present in the database
✅ Schema is aligned with TypeScript definitions
✅ Foreign key constraints point to correct tables

## Final Foreign Key Constraints
- `buyer_id` → `users.id` (ON DELETE CASCADE)
- `supplier_id` → `supplier_profiles.id` (ON DELETE SET NULL)
- `product_id` → `products.id` (ON DELETE SET NULL)
- `category_id` → `categories.id`

## Testing
Run the verification scripts to confirm:
```bash
npx tsx scripts/check-rfqs-schema.ts
npx tsx scripts/check-rfqs-constraints.ts
```

The RFQ POST endpoint at `/api/rfqs` should now successfully create RFQs with product associations.
