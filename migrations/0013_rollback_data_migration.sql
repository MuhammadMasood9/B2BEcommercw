-- ==================== ROLLBACK DATA MIGRATION TO MULTIVENDOR SYSTEM ====================
-- This script rolls back the data migration from supplier-managed to admin-managed model
-- Use this ONLY if you need to revert the migration

-- WARNING: This will remove supplier assignments from all data
-- Make sure you have a database backup before running this script

-- ==================== STEP 1: CREATE ROLLBACK BACKUP ====================
-- Create backup tables before rollback

DO $$
BEGIN
  -- Backup products
  CREATE TABLE IF NOT EXISTS products_backup_pre_rollback AS 
  SELECT * FROM products WHERE supplier_id IS NOT NULL;
  
  -- Backup inquiries
  CREATE TABLE IF NOT EXISTS inquiries_backup_pre_rollback AS 
  SELECT * FROM inquiries WHERE supplier_id IS NOT NULL;
  
  -- Backup RFQs
  CREATE TABLE IF NOT EXISTS rfqs_backup_pre_rollback AS 
  SELECT * FROM rfqs WHERE supplier_id IS NOT NULL;
  
  -- Backup quotations
  CREATE TABLE IF NOT EXISTS quotations_backup_pre_rollback AS 
  SELECT * FROM quotations WHERE supplier_id IS NOT NULL;
  
  -- Backup inquiry quotations
  CREATE TABLE IF NOT EXISTS inquiry_quotations_backup_pre_rollback AS 
  SELECT * FROM inquiry_quotations WHERE supplier_id IS NOT NULL;
  
  -- Backup conversations
  CREATE TABLE IF NOT EXISTS conversations_backup_pre_rollback AS 
  SELECT * FROM conversations WHERE supplier_id IS NOT NULL;
  
  -- Backup orders
  CREATE TABLE IF NOT EXISTS orders_backup_pre_rollback AS 
  SELECT * FROM orders WHERE supplier_id IS NOT NULL;
  
  RAISE NOTICE 'Created backup tables for rollback';
END $$;

-- ==================== STEP 2: ROLLBACK PRODUCTS ====================
-- Remove supplier assignments from products

DO $$
DECLARE
  products_rolled_back INTEGER := 0;
BEGIN
  UPDATE products
  SET 
    supplier_id = NULL,
    approval_status = 'approved', -- Keep as approved since they were live
    approved_by = NULL,
    approved_at = NULL,
    rejection_reason = NULL,
    updated_at = NOW()
  WHERE supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS products_rolled_back = ROW_COUNT;
  RAISE NOTICE 'Rolled back % products', products_rolled_back;
END $$;

-- ==================== STEP 3: ROLLBACK INQUIRIES ====================
-- Remove supplier routing from inquiries

DO $$
DECLARE
  inquiries_rolled_back INTEGER := 0;
BEGIN
  UPDATE inquiries
  SET supplier_id = NULL
  WHERE supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS inquiries_rolled_back = ROW_COUNT;
  RAISE NOTICE 'Rolled back % inquiries', inquiries_rolled_back;
END $$;

-- ==================== STEP 4: ROLLBACK RFQs ====================
-- Remove supplier routing from RFQs

DO $$
DECLARE
  rfqs_rolled_back INTEGER := 0;
BEGIN
  UPDATE rfqs
  SET supplier_id = NULL
  WHERE supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS rfqs_rolled_back = ROW_COUNT;
  RAISE NOTICE 'Rolled back % RFQs', rfqs_rolled_back;
END $$;

-- ==================== STEP 5: ROLLBACK QUOTATIONS ====================
-- Convert supplier quotations back to admin quotations

DO $$
DECLARE
  quotations_rolled_back INTEGER := 0;
BEGIN
  -- Move supplier_id back to admin_id if admin_id is NULL
  UPDATE quotations
  SET 
    admin_id = COALESCE(admin_id, supplier_id),
    supplier_id = NULL
  WHERE supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS quotations_rolled_back = ROW_COUNT;
  RAISE NOTICE 'Rolled back % quotations', quotations_rolled_back;
END $$;

-- ==================== STEP 6: ROLLBACK INQUIRY QUOTATIONS ====================
-- Remove supplier references from inquiry quotations

DO $$
DECLARE
  inquiry_quotations_rolled_back INTEGER := 0;
BEGIN
  UPDATE inquiry_quotations
  SET supplier_id = NULL
  WHERE supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS inquiry_quotations_rolled_back = ROW_COUNT;
  RAISE NOTICE 'Rolled back % inquiry quotations', inquiry_quotations_rolled_back;
END $$;

-- ==================== STEP 7: ROLLBACK CONVERSATIONS ====================
-- Remove supplier references from conversations

DO $$
DECLARE
  conversations_rolled_back INTEGER := 0;
BEGIN
  UPDATE conversations
  SET supplier_id = NULL
  WHERE supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS conversations_rolled_back = ROW_COUNT;
  RAISE NOTICE 'Rolled back % conversations', conversations_rolled_back;
END $$;

-- ==================== STEP 8: ROLLBACK ORDERS ====================
-- Remove supplier references from orders

DO $$
DECLARE
  orders_rolled_back INTEGER := 0;
BEGIN
  UPDATE orders
  SET supplier_id = NULL
  WHERE supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS orders_rolled_back = ROW_COUNT;
  RAISE NOTICE 'Rolled back % orders', orders_rolled_back;
END $$;

-- ==================== STEP 9: OPTIONAL - REMOVE DEFAULT ADMIN SUPPLIER ====================
-- Uncomment the following block if you want to remove the default admin supplier profile
-- WARNING: This will delete the supplier profile created during migration

/*
DO $$
DECLARE
  admin_user_id VARCHAR;
  admin_supplier_id VARCHAR;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  SELECT id INTO admin_supplier_id FROM supplier_profiles 
  WHERE user_id = admin_user_id AND store_slug = 'platform-store';
  
  IF admin_supplier_id IS NOT NULL THEN
    DELETE FROM supplier_profiles WHERE id = admin_supplier_id;
    RAISE NOTICE 'Deleted default admin supplier profile';
  END IF;
END $$;
*/

-- ==================== STEP 10: LOG ROLLBACK ====================
-- Log the rollback in migration audit

INSERT INTO migration_audit (migration_name, status, details)
VALUES (
  '0013_data_migration_to_multivendor',
  'rolled_back',
  jsonb_build_object(
    'description', 'Rolled back data migration from supplier-managed to admin-managed model',
    'timestamp', NOW(),
    'backup_tables_created', true
  )
);

-- ==================== VERIFICATION QUERIES ====================
-- Run these queries to verify the rollback was successful

-- Check products rollback
DO $$
DECLARE
  total_products INTEGER;
  products_with_supplier INTEGER;
  products_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO products_with_supplier FROM products WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO products_without_supplier FROM products WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== PRODUCTS ROLLBACK VERIFICATION ===';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Products with supplier: % (should be 0)', products_with_supplier;
  RAISE NOTICE 'Products without supplier: %', products_without_supplier;
END $$;

-- Check inquiries rollback
DO $$
DECLARE
  total_inquiries INTEGER;
  inquiries_with_supplier INTEGER;
  inquiries_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_inquiries FROM inquiries;
  SELECT COUNT(*) INTO inquiries_with_supplier FROM inquiries WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO inquiries_without_supplier FROM inquiries WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== INQUIRIES ROLLBACK VERIFICATION ===';
  RAISE NOTICE 'Total inquiries: %', total_inquiries;
  RAISE NOTICE 'Inquiries with supplier: % (should be 0)', inquiries_with_supplier;
  RAISE NOTICE 'Inquiries without supplier: %', inquiries_without_supplier;
END $$;

-- Check RFQs rollback
DO $$
DECLARE
  total_rfqs INTEGER;
  rfqs_with_supplier INTEGER;
  rfqs_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rfqs FROM rfqs;
  SELECT COUNT(*) INTO rfqs_with_supplier FROM rfqs WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO rfqs_without_supplier FROM rfqs WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== RFQs ROLLBACK VERIFICATION ===';
  RAISE NOTICE 'Total RFQs: %', total_rfqs;
  RAISE NOTICE 'RFQs with supplier: % (should be 0)', rfqs_with_supplier;
  RAISE NOTICE 'RFQs without supplier: %', rfqs_without_supplier;
END $$;

-- Check quotations rollback
DO $$
DECLARE
  total_quotations INTEGER;
  quotations_with_supplier INTEGER;
  quotations_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_quotations FROM quotations;
  SELECT COUNT(*) INTO quotations_with_supplier FROM quotations WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO quotations_without_supplier FROM quotations WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== QUOTATIONS ROLLBACK VERIFICATION ===';
  RAISE NOTICE 'Total quotations: %', total_quotations;
  RAISE NOTICE 'Quotations with supplier: % (should be 0)', quotations_with_supplier;
  RAISE NOTICE 'Quotations without supplier: %', quotations_without_supplier;
END $$;

-- Check orders rollback
DO $$
DECLARE
  total_orders INTEGER;
  orders_with_supplier INTEGER;
  orders_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orders FROM orders;
  SELECT COUNT(*) INTO orders_with_supplier FROM orders WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO orders_without_supplier FROM orders WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== ORDERS ROLLBACK VERIFICATION ===';
  RAISE NOTICE 'Total orders: %', total_orders;
  RAISE NOTICE 'Orders with supplier: % (should be 0)', orders_with_supplier;
  RAISE NOTICE 'Orders without supplier: %', orders_without_supplier;
END $$;

-- List backup tables
DO $$
BEGIN
  RAISE NOTICE '=== BACKUP TABLES CREATED ===';
  RAISE NOTICE 'The following backup tables were created:';
  RAISE NOTICE '- products_backup_pre_rollback';
  RAISE NOTICE '- inquiries_backup_pre_rollback';
  RAISE NOTICE '- rfqs_backup_pre_rollback';
  RAISE NOTICE '- quotations_backup_pre_rollback';
  RAISE NOTICE '- inquiry_quotations_backup_pre_rollback';
  RAISE NOTICE '- conversations_backup_pre_rollback';
  RAISE NOTICE '- orders_backup_pre_rollback';
  RAISE NOTICE '';
  RAISE NOTICE 'You can restore data from these tables if needed.';
  RAISE NOTICE 'To clean up backup tables, run: DROP TABLE IF EXISTS <table_name>;';
END $$;

RAISE NOTICE '=== ROLLBACK COMPLETED ===';
RAISE NOTICE 'Please review the verification results above.';
RAISE NOTICE 'All supplier assignments have been removed from the data.';
