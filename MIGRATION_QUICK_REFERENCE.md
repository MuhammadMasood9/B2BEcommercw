# Migration Quick Reference

## Quick Start

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup.sql

# 2. Run migration
npm run migrate:multivendor

# 3. Test integrity
npm run test:integrity

# 4. If issues, rollback
npm run migrate:rollback
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run migrate:multivendor` | Run data migration to multivendor model |
| `npm run migrate:rollback` | Rollback migration to admin-managed model |
| `npm run test:integrity` | Run comprehensive data integrity tests |

## Migration Files

| File | Purpose |
|------|---------|
| `migrations/0013_data_migration_to_multivendor.sql` | Main SQL migration script |
| `migrations/0013_rollback_data_migration.sql` | SQL rollback script |
| `scripts/run-data-migration.ts` | Node.js migration runner |
| `scripts/rollback-data-migration.ts` | Node.js rollback runner |
| `scripts/test-data-integrity.ts` | Data integrity test suite |

## What Gets Migrated

| Entity | Migration Action |
|--------|------------------|
| Products | Assigned to default admin supplier, approval status set to 'approved' |
| Inquiries | Routed to product's supplier |
| RFQs | Routed to product's supplier (if product-specific) |
| Quotations | Converted from admin to supplier quotations |
| Inquiry Quotations | Assigned to product's supplier |
| Orders | Updated with supplier information from product/quotation |
| Conversations | Updated to include supplier reference |

## Verification Queries

```sql
-- Check products migration
SELECT COUNT(*) as total,
       COUNT(supplier_id) as with_supplier
FROM products;

-- Check inquiries routing
SELECT COUNT(*) as total,
       COUNT(supplier_id) as with_supplier
FROM inquiries;

-- Check quotations
SELECT COUNT(*) as total,
       COUNT(supplier_id) as with_supplier
FROM quotations;

-- Check default admin supplier
SELECT * FROM supplier_profiles 
WHERE store_slug = 'platform-store';
```

## Common Issues

| Issue | Quick Fix |
|-------|-----------|
| No admin user | Create admin user in users table with role='admin' |
| Products without supplier | Run migration again or manually assign to default supplier |
| Orphaned inquiries | Delete or reassign to valid products |
| Migration already run | Rollback first, then re-run migration |

## Rollback Safety

The rollback script:
- ✅ Creates backup tables before rollback
- ✅ Removes all supplier assignments
- ✅ Preserves original data structure
- ✅ Verifies rollback completion
- ✅ Provides detailed output

Backup tables created:
- `products_backup_pre_rollback`
- `inquiries_backup_pre_rollback`
- `rfqs_backup_pre_rollback`
- `quotations_backup_pre_rollback`
- `inquiry_quotations_backup_pre_rollback`
- `conversations_backup_pre_rollback`
- `orders_backup_pre_rollback`

## Testing Checklist

After migration, test:
- [ ] Products show supplier information
- [ ] Product detail pages display supplier
- [ ] Inquiries route to suppliers (not admin)
- [ ] RFQs route to suppliers
- [ ] Suppliers can view their inquiries
- [ ] Suppliers can create quotations
- [ ] Orders show supplier information
- [ ] Admin can approve products
- [ ] Admin can manage suppliers
- [ ] Supplier dashboard works

## Emergency Rollback

If critical issues occur:

```bash
# 1. Stop application immediately
# 2. Run rollback
npm run migrate:rollback

# 3. If rollback fails, restore from backup
psql $DATABASE_URL < backup.sql

# 4. Verify restoration
npm run test:integrity
```

## Support Commands

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# Count records
psql $DATABASE_URL -c "SELECT 
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM supplier_profiles) as suppliers,
  (SELECT COUNT(*) FROM inquiries) as inquiries;"

# View migration audit log
psql $DATABASE_URL -c "SELECT * FROM migration_audit ORDER BY created_at DESC;"

# Check for data issues
psql $DATABASE_URL -c "
SELECT 'Products without supplier' as issue, COUNT(*) as count
FROM products WHERE supplier_id IS NULL
UNION ALL
SELECT 'Inquiries without supplier', COUNT(*)
FROM inquiries WHERE supplier_id IS NULL
UNION ALL
SELECT 'Quotations without supplier', COUNT(*)
FROM quotations WHERE supplier_id IS NULL;"
```

## Migration Timeline

Typical migration takes:
- Small database (< 1000 records): 1-2 minutes
- Medium database (1000-10000 records): 2-5 minutes
- Large database (> 10000 records): 5-15 minutes

## Post-Migration

1. Update admin supplier profile with real information
2. Invite real suppliers to register
3. Reassign products to real suppliers (optional)
4. Monitor system for 24-48 hours
5. Clean up backup tables after verification

## Key Points

- ✅ Always backup before migration
- ✅ Test on staging environment first
- ✅ Run during low-traffic period
- ✅ Keep application stopped during migration
- ✅ Verify results before restarting
- ✅ Monitor closely after migration
- ✅ Keep backup for at least 7 days

## Contact

For issues or questions:
1. Check MIGRATION_GUIDE.md for detailed instructions
2. Review migration script logs
3. Run integrity tests for specific issues
4. Consult development team if needed
