# Payouts Table Columns Fixed

## Summary
Fixed column name mismatches in the payouts table between the database and the schema.

## Issue
The database had different column names than what the schema expected:
- Database had `commission_amount` but schema expected `commission_deducted`
- Database had `method` but schema expected `payout_method`

This was causing errors when trying to fetch payouts in the admin panel.

## Changes Made

### Migration 0028
**File:** `migrations/0028_fix_payouts_columns.sql`

Renamed columns to match the schema:
```sql
ALTER TABLE payouts RENAME COLUMN commission_amount TO commission_deducted;
ALTER TABLE payouts RENAME COLUMN method TO payout_method;
```

### Database Schema (After Fix)
```
payouts table columns:
- id (varchar, primary key)
- supplier_id (varchar, not null)
- order_id (varchar, nullable)
- amount (numeric, not null)
- commission_deducted (numeric, not null) ✅ FIXED
- net_amount (numeric, not null)
- payout_method (varchar, not null) ✅ FIXED
- status (varchar, default 'pending')
- scheduled_date (timestamp, not null)
- processed_date (timestamp, nullable)
- transaction_id (varchar, nullable)
- failure_reason (text, nullable)
- invoice_url (varchar, nullable)
- created_at (timestamp, default now())
- updated_at (timestamp, default now())
```

## Status
✅ Migration 0028 applied successfully
✅ Column `commission_amount` renamed to `commission_deducted`
✅ Column `method` renamed to `payout_method`
✅ Build successful
✅ Schema matches database

## Next Steps
**Restart your development server** to load the updated schema:
1. Stop the current server (Ctrl+C)
2. Run `npm run dev` or `npm start`
3. Navigate to Admin → Payouts page
4. The payouts should now load without errors

## Related Files
- `shared/schema.ts` - Payouts table schema definition
- `server/commissionRoutes.ts` - Payouts API endpoints
- `client/src/pages/admin/AdminPayouts.tsx` - Admin payouts page

## Testing
After restarting the server, test:
1. ✅ Admin can view payouts page
2. ✅ Pending payouts are displayed
3. ✅ Payout processing works
4. ✅ Payout completion works
