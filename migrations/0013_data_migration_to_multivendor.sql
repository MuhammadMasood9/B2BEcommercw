-- ==================== DATA MIGRATION TO MULTIVENDOR SYSTEM ====================
-- This migration script migrates existing data from admin-managed to supplier-managed model
-- Run this after all schema changes are complete

-- ==================== STEP 1: CREATE DEFAULT ADMIN SUPPLIER ====================
-- Create a default supplier profile for the admin to handle existing products
-- This ensures all existing products have a supplier

DO $$
DECLARE
  admin_user_id VARCHAR;
  admin_supplier_id VARCHAR;
BEGIN
  -- Find the first admin user
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Check if admin supplier already exists
    SELECT id INTO admin_supplier_id FROM supplier_profiles WHERE user_id = admin_user_id;
    
    IF admin_supplier_id IS NULL THEN
      -- Create default admin supplier profile
      INSERT INTO supplier_profiles (
        user_id,
        business_name,
        business_type,
        store_name,
        store_slug,
        store_description,
        contact_person,
        phone,
        address,
        city,
        country,
        verification_level,
        is_verified,
        verified_at,
        status,
        is_active,
        rating,
        created_at,
        updated_at
      ) VALUES (
        admin_user_id,
        'Platform Default Store',
        'trading_company',
        'Platform Store',
        'platform-store',
        'Default platform store for existing products',
        'Platform Admin',
        '000-000-0000',
        'Platform Address',
        'Platform City',
        'Platform Country',
        'premium',
        true,
        NOW(),
        'approved',
        true,
        5.0,
        NOW(),
        NOW()
      )
      RETURNING id INTO admin_supplier_id;
      
      RAISE NOTICE 'Created default admin supplier with ID: %', admin_supplier_id;
    ELSE
      RAISE NOTICE 'Admin supplier already exists with ID: %', admin_supplier_id;
    END IF;
  ELSE
    RAISE NOTICE 'No admin user found. Please create an admin user first.';
  END IF;
END $$;

-- ==================== STEP 2: MIGRATE EXISTING PRODUCTS ====================
-- Assign all products without supplier_id to the default admin supplier
-- Set approval status to 'approved' for existing products

DO $$
DECLARE
  admin_supplier_id VARCHAR;
  admin_user_id VARCHAR;
  products_updated INTEGER := 0;
BEGIN
  -- Get admin user and supplier
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  SELECT id INTO admin_supplier_id FROM supplier_profiles WHERE user_id = admin_user_id LIMIT 1;
  
  IF admin_supplier_id IS NOT NULL THEN
    -- Update products without supplier_id
    UPDATE products
    SET 
      supplier_id = admin_supplier_id,
      approval_status = 'approved',
      approved_by = admin_user_id,
      approved_at = NOW(),
      updated_at = NOW()
    WHERE supplier_id IS NULL OR supplier_id = '';
    
    GET DIAGNOSTICS products_updated = ROW_COUNT;
    RAISE NOTICE 'Migrated % products to admin supplier', products_updated;
  ELSE
    RAISE NOTICE 'No admin supplier found. Skipping product migration.';
  END IF;
END $$;

-- ==================== STEP 3: MIGRATE EXISTING INQUIRIES ====================
-- Route existing inquiries to product suppliers

DO $$
DECLARE
  inquiries_updated INTEGER := 0;
BEGIN
  -- Update inquiries to route to product's supplier
  UPDATE inquiries i
  SET 
    supplier_id = p.supplier_id
  FROM products p
  WHERE i.product_id = p.id
    AND (i.supplier_id IS NULL OR i.supplier_id = '')
    AND p.supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS inquiries_updated = ROW_COUNT;
  RAISE NOTICE 'Migrated % inquiries to suppliers', inquiries_updated;
END $$;

-- ==================== STEP 4: MIGRATE EXISTING RFQs ====================
-- Route product-specific RFQs to product suppliers

DO $$
DECLARE
  rfqs_updated INTEGER := 0;
BEGIN
  -- Update RFQs with product_id to route to product's supplier
  UPDATE rfqs r
  SET 
    supplier_id = p.supplier_id
  FROM products p
  WHERE r.product_id = p.id
    AND (r.supplier_id IS NULL OR r.supplier_id = '')
    AND p.supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS rfqs_updated = ROW_COUNT;
  RAISE NOTICE 'Migrated % RFQs to suppliers', rfqs_updated;
END $$;

-- ==================== STEP 5: MIGRATE EXISTING QUOTATIONS ====================
-- Convert admin quotations to supplier quotations
-- The schema already has both admin_id and supplier_id columns

DO $$
DECLARE
  quotations_updated INTEGER := 0;
  admin_supplier_id VARCHAR;
  admin_user_id VARCHAR;
BEGIN
  -- Get admin supplier
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  SELECT id INTO admin_supplier_id FROM supplier_profiles WHERE user_id = admin_user_id LIMIT 1;
  
  IF admin_supplier_id IS NOT NULL THEN
    -- Update quotations to reference supplier instead of admin
    -- For RFQ-based quotations, use the RFQ's supplier_id if available
    UPDATE quotations q
    SET 
      supplier_id = COALESCE(r.supplier_id, admin_supplier_id)
    FROM rfqs r
    WHERE q.rfq_id = r.id
      AND (q.supplier_id IS NULL OR q.supplier_id = '')
      AND q.admin_id IS NOT NULL;
    
    GET DIAGNOSTICS quotations_updated = ROW_COUNT;
    RAISE NOTICE 'Migrated % quotations to suppliers', quotations_updated;
    
    -- Update any remaining quotations without supplier_id to admin supplier
    UPDATE quotations
    SET supplier_id = admin_supplier_id
    WHERE (supplier_id IS NULL OR supplier_id = '')
      AND admin_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'No admin supplier found. Skipping quotation migration.';
  END IF;
END $$;

-- ==================== STEP 6: MIGRATE INQUIRY QUOTATIONS ====================
-- Route inquiry quotations to product suppliers

DO $$
DECLARE
  inquiry_quotations_updated INTEGER := 0;
  admin_supplier_id VARCHAR;
  admin_user_id VARCHAR;
BEGIN
  -- Get admin supplier
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  SELECT id INTO admin_supplier_id FROM supplier_profiles WHERE user_id = admin_user_id LIMIT 1;
  
  IF admin_supplier_id IS NOT NULL THEN
    -- Update inquiry quotations to reference supplier
    UPDATE inquiry_quotations iq
    SET 
      supplier_id = COALESCE(i.supplier_id, admin_supplier_id)
    FROM inquiries i
    WHERE iq.inquiry_id = i.id
      AND (iq.supplier_id IS NULL OR iq.supplier_id = '');
    
    GET DIAGNOSTICS inquiry_quotations_updated = ROW_COUNT;
    RAISE NOTICE 'Migrated % inquiry quotations to suppliers', inquiry_quotations_updated;
  ELSE
    RAISE NOTICE 'No admin supplier found. Skipping inquiry quotation migration.';
  END IF;
END $$;

-- ==================== STEP 7: MIGRATE CONVERSATIONS ====================
-- Update conversations to include supplier_id for supplier-buyer communication

DO $$
DECLARE
  conversations_updated INTEGER := 0;
  admin_supplier_id VARCHAR;
  admin_user_id VARCHAR;
BEGIN
  -- Get admin supplier
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  SELECT id INTO admin_supplier_id FROM supplier_profiles WHERE user_id = admin_user_id LIMIT 1;
  
  IF admin_supplier_id IS NOT NULL THEN
    -- Update conversations where unread_count_admin is actually the admin user ID
    -- Set supplier_id to admin supplier for existing conversations
    UPDATE conversations
    SET supplier_id = admin_supplier_id
    WHERE (supplier_id IS NULL OR supplier_id = '')
      AND unread_count_admin IS NOT NULL;
    
    GET DIAGNOSTICS conversations_updated = ROW_COUNT;
    RAISE NOTICE 'Migrated % conversations to include supplier', conversations_updated;
  ELSE
    RAISE NOTICE 'No admin supplier found. Skipping conversation migration.';
  END IF;
END $$;

-- ==================== STEP 8: UPDATE ORDERS WITH SUPPLIER INFORMATION ====================
-- Add supplier information to existing orders based on product or quotation

DO $$
DECLARE
  orders_updated INTEGER := 0;
BEGIN
  -- Update orders with supplier from product
  UPDATE orders o
  SET supplier_id = p.supplier_id
  FROM products p
  WHERE o.product_id = p.id
    AND (o.supplier_id IS NULL OR o.supplier_id = '')
    AND p.supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS orders_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % orders with supplier from product', orders_updated;
  
  -- Update orders with supplier from quotation
  UPDATE orders o
  SET supplier_id = q.supplier_id
  FROM quotations q
  WHERE o.quotation_id = q.id
    AND (o.supplier_id IS NULL OR o.supplier_id = '')
    AND q.supplier_id IS NOT NULL;
  
  GET DIAGNOSTICS orders_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % orders with supplier from quotation', orders_updated;
END $$;

-- ==================== STEP 9: CREATE MIGRATION AUDIT LOG ====================
-- Create a table to track migration status and results

CREATE TABLE IF NOT EXISTS migration_audit (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'started', 'completed', 'failed', 'rolled_back'
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Log this migration
INSERT INTO migration_audit (migration_name, status, details)
VALUES (
  '0013_data_migration_to_multivendor',
  'completed',
  jsonb_build_object(
    'description', 'Migrated existing data from admin-managed to supplier-managed model',
    'timestamp', NOW()
  )
);

-- ==================== VERIFICATION QUERIES ====================
-- Run these queries to verify the migration was successful

-- Check products migration
DO $$
DECLARE
  total_products INTEGER;
  products_with_supplier INTEGER;
  products_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT COUNT(*) INTO products_with_supplier FROM products WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO products_without_supplier FROM products WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== PRODUCTS MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Products with supplier: %', products_with_supplier;
  RAISE NOTICE 'Products without supplier: %', products_without_supplier;
END $$;

-- Check inquiries migration
DO $$
DECLARE
  total_inquiries INTEGER;
  inquiries_with_supplier INTEGER;
  inquiries_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_inquiries FROM inquiries;
  SELECT COUNT(*) INTO inquiries_with_supplier FROM inquiries WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO inquiries_without_supplier FROM inquiries WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== INQUIRIES MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Total inquiries: %', total_inquiries;
  RAISE NOTICE 'Inquiries with supplier: %', inquiries_with_supplier;
  RAISE NOTICE 'Inquiries without supplier: %', inquiries_without_supplier;
END $$;

-- Check RFQs migration
DO $$
DECLARE
  total_rfqs INTEGER;
  rfqs_with_supplier INTEGER;
  rfqs_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rfqs FROM rfqs;
  SELECT COUNT(*) INTO rfqs_with_supplier FROM rfqs WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO rfqs_without_supplier FROM rfqs WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== RFQs MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Total RFQs: %', total_rfqs;
  RAISE NOTICE 'RFQs with supplier: %', rfqs_with_supplier;
  RAISE NOTICE 'RFQs without supplier: %', rfqs_without_supplier;
END $$;

-- Check quotations migration
DO $$
DECLARE
  total_quotations INTEGER;
  quotations_with_supplier INTEGER;
  quotations_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_quotations FROM quotations;
  SELECT COUNT(*) INTO quotations_with_supplier FROM quotations WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO quotations_without_supplier FROM quotations WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== QUOTATIONS MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Total quotations: %', total_quotations;
  RAISE NOTICE 'Quotations with supplier: %', quotations_with_supplier;
  RAISE NOTICE 'Quotations without supplier: %', quotations_without_supplier;
END $$;

-- Check orders migration
DO $$
DECLARE
  total_orders INTEGER;
  orders_with_supplier INTEGER;
  orders_without_supplier INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orders FROM orders;
  SELECT COUNT(*) INTO orders_with_supplier FROM orders WHERE supplier_id IS NOT NULL AND supplier_id != '';
  SELECT COUNT(*) INTO orders_without_supplier FROM orders WHERE supplier_id IS NULL OR supplier_id = '';
  
  RAISE NOTICE '=== ORDERS MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Total orders: %', total_orders;
  RAISE NOTICE 'Orders with supplier: %', orders_with_supplier;
  RAISE NOTICE 'Orders without supplier: %', orders_without_supplier;
END $$;

RAISE NOTICE '=== DATA MIGRATION COMPLETED ===';
RAISE NOTICE 'Please review the verification results above.';
RAISE NOTICE 'If any issues are found, use the rollback script: 0013_rollback_data_migration.sql';
