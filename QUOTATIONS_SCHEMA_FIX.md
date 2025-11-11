# Quotations Schema Fix - Database Alignment

## Problem
Supplier RFQ response was failing with the error:
```
Respond to RFQ error: error: column "admin_id" does not exist
```

## Root Cause
The database schema for the `quotations` table was out of sync with the TypeScript schema defined in `shared/schema.ts`. The database had different column names and was missing some columns.

### Database Schema Issues Found:
1. Wrong column names:
   - Database had `unit_price` → Schema expects `price_per_unit`
   - Database had `terms_conditions` → Schema expects `message`
2. Missing columns: `admin_id`, `valid_until`
3. Extra columns: `validity_period`, `updated_at`

## Solution Applied

### Migration 0019: Align Quotations Schema
Created `migrations/0019_align_quotations_schema.sql` and supporting scripts to:
- Rename `unit_price` → `price_per_unit`
- Rename `terms_conditions` → `message`
- Drop unused columns: `validity_period`, `updated_at`
- Add missing columns: `admin_id`, `valid_until`

### Scripts Created:
1. `scripts/run-migration-0019.ts` - Runs the alignment migration
2. `scripts/rename-quotations-columns.ts` - Handles column renaming
3. `scripts/check-quotations-schema.ts` - Verifies the quotations table schema

## Final Schema
The `quotations` table now has the following columns:
- `id` (varchar, PRIMARY KEY)
- `supplier_id` (varchar, NOT NULL)
- `rfq_id` (varchar)
- `inquiry_id` (varchar)
- `price_per_unit` (numeric, NOT NULL) ✅ RENAMED
- `total_price` (numeric, NOT NULL)
- `moq` (integer, NOT NULL)
- `lead_time` (varchar)
- `payment_terms` (varchar)
- `message` (text) ✅ RENAMED
- `attachments` (text[])
- `status` (varchar)
- `created_at` (timestamp, NOT NULL)
- `valid_until` (timestamp) ✅ ADDED
- `admin_id` (varchar) ✅ ADDED

## Foreign Key Constraints
- `rfq_id` → `rfqs.id`
- `inquiry_id` → `inquiries.id`
- `supplier_id` → `supplier_profiles.id`

## Result
✅ Supplier RFQ responses now work correctly
✅ All required columns are present in the database
✅ Schema is aligned with TypeScript definitions
✅ Both RFQ-based and inquiry-based quotations are supported

## Testing
Run the verification script to confirm:
```bash
npx tsx scripts/check-quotations-schema.ts
```

The supplier RFQ response endpoint at `/api/suppliers/rfqs/:id/respond` should now successfully create quotations.
