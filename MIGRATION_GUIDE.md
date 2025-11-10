# Data Migration Guide: Multivendor Marketplace

This guide provides comprehensive instructions for migrating your B2B ecommerce platform from an admin-managed model to a multivendor marketplace model.

## Overview

The migration process transforms your platform by:
- Creating a default supplier profile for the admin
- Assigning all existing products to the default supplier
- Routing existing inquiries and RFQs to product suppliers
- Converting admin quotations to supplier quotations
- Updating orders with supplier information
- Maintaining data integrity throughout the process

## Prerequisites

Before running the migration, ensure:

1. **Database Backup**: Create a complete backup of your database
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Admin User Exists**: At least one admin user must exist in the system
   ```sql
   SELECT id, email FROM users WHERE role = 'admin';
   ```

3. **Schema Updates Applied**: All schema migrations must be applied
   ```bash
   npm run db:push
   ```

4. **Application Stopped**: Stop the application to prevent data conflicts during migration
   ```bash
   # Stop your application server
   ```

## Migration Process

### Step 1: Review Current Data

Before migration, review your current data:

```bash
# Check total records
psql $DATABASE_URL -c "SELECT 
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM inquiries) as inquiries,
  (SELECT COUNT(*) FROM rfqs) as rfqs,
  (SELECT COUNT(*) FROM quotations) as quotations,
  (SELECT COUNT(*) FROM orders) as orders;"
```

### Step 2: Run the Migration

Execute the migration script:

```bash
npm run migrate:multivendor
```

The script will:
1. Check prerequisites (admin user exists)
2. Create a default admin supplier profile
3. Migrate products to the default supplier
4. Route inquiries to product suppliers
5. Route RFQs to product suppliers
6. Convert quotations to supplier quotations
7. Update orders with supplier information
8. Verify migration results
9. Check data integrity

### Step 3: Review Migration Results

The migration script provides detailed output:

```
=== PRODUCTS MIGRATION VERIFICATION ===
Total products: 150
Products with supplier: 150
Products without supplier: 0

=== INQUIRIES MIGRATION VERIFICATION ===
Total inquiries: 45
Inquiries with supplier: 45
Inquiries without supplier: 0

... (additional verification output)
```

### Step 4: Test Data Integrity

Run comprehensive integrity tests:

```bash
npm run test:integrity
```

This will verify:
- All products have valid supplier assignments
- All inquiries are routed to correct suppliers
- All RFQs are routed to correct suppliers
- All quotations reference valid suppliers
- No orphaned data exists
- All foreign key relationships are valid

### Step 5: Manual Verification

Perform manual spot checks:

```sql
-- Check products with suppliers
SELECT p.name, sp.business_name, sp.store_name
FROM products p
JOIN supplier_profiles sp ON p.supplier_id = sp.id
LIMIT 10;

-- Check inquiries routing
SELECT i.id, p.name, sp.business_name
FROM inquiries i
JOIN products p ON i.product_id = p.id
JOIN supplier_profiles sp ON i.supplier_id = sp.id
LIMIT 10;

-- Check quotations
SELECT q.id, sp.business_name, q.total_price
FROM quotations q
JOIN supplier_profiles sp ON q.supplier_id = sp.id
LIMIT 10;
```

### Step 6: Start Application

Once verification is complete, restart your application:

```bash
npm run dev
```

Test the following functionality:
- Product listings show supplier information
- Inquiries are sent to suppliers (not admin)
- RFQs are routed to suppliers
- Suppliers can manage their products
- Admin can approve/reject products
- Orders are associated with suppliers

## Rollback Procedure

If you encounter issues, you can rollback the migration:

### Step 1: Stop Application

```bash
# Stop your application server
```

### Step 2: Run Rollback Script

```bash
npm run migrate:rollback
```

The rollback script will:
1. Create backup tables of current data
2. Remove all supplier assignments from products
3. Remove supplier routing from inquiries and RFQs
4. Convert supplier quotations back to admin quotations
5. Remove supplier references from orders
6. Verify rollback completion

### Step 3: Verify Rollback

```bash
npm run test:integrity
```

Note: After rollback, the system will return to admin-managed mode.

### Step 4: Restore from Backup (if needed)

If rollback doesn't work as expected:

```bash
# Restore from your database backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Migration Files

### SQL Migration Files

1. **0013_data_migration_to_multivendor.sql**
   - Main migration script
   - Creates default admin supplier
   - Migrates all data to multivendor model
   - Includes verification queries

2. **0013_rollback_data_migration.sql**
   - Rollback script
   - Creates backup tables
   - Removes supplier assignments
   - Restores admin-managed model

### TypeScript Scripts

1. **scripts/run-data-migration.ts**
   - Node.js migration runner
   - Provides detailed progress output
   - Performs automatic verification
   - Checks data integrity

2. **scripts/rollback-data-migration.ts**
   - Node.js rollback runner
   - Requires user confirmation
   - Creates safety backups
   - Verifies rollback completion

3. **scripts/test-data-integrity.ts**
   - Comprehensive integrity tests
   - 10 different test scenarios
   - Detailed failure reporting
   - Can be run independently

## Common Issues and Solutions

### Issue 1: No Admin User Found

**Error**: "No admin user found. Please create an admin user first."

**Solution**:
```sql
-- Create an admin user
INSERT INTO users (email, password, role, first_name, last_name)
VALUES ('admin@example.com', 'hashed_password', 'admin', 'Admin', 'User');
```

### Issue 2: Products Without Suppliers

**Error**: "X products without supplier"

**Solution**:
```sql
-- Manually assign products to default supplier
UPDATE products
SET supplier_id = (
  SELECT id FROM supplier_profiles 
  WHERE store_slug = 'platform-store' 
  LIMIT 1
)
WHERE supplier_id IS NULL;
```

### Issue 3: Orphaned Inquiries

**Error**: "X inquiries with non-existent products"

**Solution**:
```sql
-- Delete orphaned inquiries
DELETE FROM inquiries
WHERE product_id NOT IN (SELECT id FROM products);

-- Or assign to a valid product
UPDATE inquiries
SET product_id = 'valid_product_id'
WHERE product_id NOT IN (SELECT id FROM products);
```

### Issue 4: Migration Already Run

**Error**: "Migration has already been completed"

**Solution**:
- If you need to re-run migration, first rollback:
  ```bash
  npm run migrate:rollback
  npm run migrate:multivendor
  ```

## Post-Migration Tasks

After successful migration:

1. **Update Admin Supplier Profile**
   - Log in as admin
   - Navigate to supplier profile
   - Update business information
   - Add logo and banner images

2. **Create Additional Suppliers**
   - Invite real suppliers to register
   - Review and approve supplier applications
   - Verify supplier documents

3. **Reassign Products** (Optional)
   - If you have real suppliers, reassign products from default admin supplier
   - Update product approval status if needed

4. **Update Documentation**
   - Update user guides for new multivendor features
   - Train admin staff on supplier management
   - Create supplier onboarding materials

5. **Monitor System**
   - Watch for any data inconsistencies
   - Monitor supplier activity
   - Check inquiry routing
   - Verify order processing

## Data Integrity Checks

Run these queries periodically to ensure data integrity:

```sql
-- Check for products without suppliers
SELECT COUNT(*) FROM products WHERE supplier_id IS NULL;

-- Check for mismatched inquiry routing
SELECT COUNT(*) FROM inquiries i
JOIN products p ON i.product_id = p.id
WHERE i.supplier_id != p.supplier_id;

-- Check for quotations without suppliers
SELECT COUNT(*) FROM quotations WHERE supplier_id IS NULL;

-- Check for orders without suppliers
SELECT COUNT(*) FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.supplier_id IS NULL AND p.supplier_id IS NOT NULL;
```

## Support

If you encounter issues during migration:

1. Check the migration logs for detailed error messages
2. Review the verification output
3. Run integrity tests to identify specific issues
4. Consult this guide for common solutions
5. If needed, rollback and restore from backup

## Migration Checklist

- [ ] Database backup created
- [ ] Admin user exists
- [ ] Schema migrations applied
- [ ] Application stopped
- [ ] Migration script executed successfully
- [ ] Verification output reviewed
- [ ] Integrity tests passed
- [ ] Manual spot checks completed
- [ ] Application restarted
- [ ] Functionality tested
- [ ] Post-migration tasks completed
- [ ] Documentation updated

## Conclusion

This migration transforms your platform into a true multivendor marketplace. Take your time with each step, verify results thoroughly, and don't hesitate to rollback if issues arise. The backup and rollback procedures ensure you can safely revert if needed.

For questions or issues, refer to the migration scripts' source code or consult your development team.
