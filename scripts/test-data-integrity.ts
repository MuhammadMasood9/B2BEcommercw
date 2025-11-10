/**
 * Data Integrity Test Script for Multivendor Marketplace
 * 
 * This script performs comprehensive data integrity checks after migration
 */

import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface IntegrityTest {
  name: string;
  description: string;
  passed: boolean;
  details?: any;
}

/**
 * Test 1: All products have suppliers
 */
async function testProductsHaveSuppliers(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE supplier_id IS NULL OR supplier_id = ''
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'Products Have Suppliers',
      description: 'All products should be assigned to a supplier',
      passed: count === 0,
      details: {
        productsWithoutSupplier: count
      }
    };
  } catch (error: any) {
    return {
      name: 'Products Have Suppliers',
      description: 'All products should be assigned to a supplier',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 2: Product suppliers exist
 */
async function testProductSuppliersExist(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM products p
      LEFT JOIN supplier_profiles sp ON p.supplier_id = sp.id
      WHERE p.supplier_id IS NOT NULL 
        AND p.supplier_id != ''
        AND sp.id IS NULL
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'Product Suppliers Exist',
      description: 'All product supplier references should point to existing suppliers',
      passed: count === 0,
      details: {
        productsWithInvalidSupplier: count
      }
    };
  } catch (error: any) {
    return {
      name: 'Product Suppliers Exist',
      description: 'All product supplier references should point to existing suppliers',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 3: Inquiries routed to product suppliers
 */
async function testInquiriesRoutedCorrectly(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inquiries i
      JOIN products p ON i.product_id = p.id
      WHERE p.supplier_id IS NOT NULL 
        AND p.supplier_id != ''
        AND (i.supplier_id IS NULL OR i.supplier_id = '' OR i.supplier_id != p.supplier_id)
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'Inquiries Routed Correctly',
      description: 'All inquiries should be routed to their product\'s supplier',
      passed: count === 0,
      details: {
        inquiriesWithMismatchedSupplier: count
      }
    };
  } catch (error: any) {
    return {
      name: 'Inquiries Routed Correctly',
      description: 'All inquiries should be routed to their product\'s supplier',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 4: RFQs routed to product suppliers
 */
async function testRFQsRoutedCorrectly(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM rfqs r
      JOIN products p ON r.product_id = p.id
      WHERE p.supplier_id IS NOT NULL 
        AND p.supplier_id != ''
        AND (r.supplier_id IS NULL OR r.supplier_id = '' OR r.supplier_id != p.supplier_id)
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'RFQs Routed Correctly',
      description: 'All product-specific RFQs should be routed to their product\'s supplier',
      passed: count === 0,
      details: {
        rfqsWithMismatchedSupplier: count
      }
    };
  } catch (error: any) {
    return {
      name: 'RFQs Routed Correctly',
      description: 'All product-specific RFQs should be routed to their product\'s supplier',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 5: Quotations have suppliers
 */
async function testQuotationsHaveSuppliers(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM quotations 
      WHERE supplier_id IS NULL OR supplier_id = ''
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'Quotations Have Suppliers',
      description: 'All quotations should reference a supplier',
      passed: count === 0,
      details: {
        quotationsWithoutSupplier: count
      }
    };
  } catch (error: any) {
    return {
      name: 'Quotations Have Suppliers',
      description: 'All quotations should reference a supplier',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 6: Inquiry quotations have suppliers
 */
async function testInquiryQuotationsHaveSuppliers(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inquiry_quotations 
      WHERE supplier_id IS NULL OR supplier_id = ''
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'Inquiry Quotations Have Suppliers',
      description: 'All inquiry quotations should reference a supplier',
      passed: count === 0,
      details: {
        inquiryQuotationsWithoutSupplier: count
      }
    };
  } catch (error: any) {
    return {
      name: 'Inquiry Quotations Have Suppliers',
      description: 'All inquiry quotations should reference a supplier',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 7: No orphaned inquiries
 */
async function testNoOrphanedInquiries(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inquiries i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE p.id IS NULL
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'No Orphaned Inquiries',
      description: 'All inquiries should reference existing products',
      passed: count === 0,
      details: {
        orphanedInquiries: count
      }
    };
  } catch (error: any) {
    return {
      name: 'No Orphaned Inquiries',
      description: 'All inquiries should reference existing products',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 8: No orphaned RFQs
 */
async function testNoOrphanedRFQs(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM rfqs r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.product_id IS NOT NULL 
        AND p.id IS NULL
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'No Orphaned RFQs',
      description: 'All product-specific RFQs should reference existing products',
      passed: count === 0,
      details: {
        orphanedRFQs: count
      }
    };
  } catch (error: any) {
    return {
      name: 'No Orphaned RFQs',
      description: 'All product-specific RFQs should reference existing products',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 9: Supplier profiles are valid
 */
async function testSupplierProfilesValid(): Promise<IntegrityTest> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM supplier_profiles sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE u.id IS NULL
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'Supplier Profiles Valid',
      description: 'All supplier profiles should reference existing users',
      passed: count === 0,
      details: {
        supplierProfilesWithInvalidUser: count
      }
    };
  } catch (error: any) {
    return {
      name: 'Supplier Profiles Valid',
      description: 'All supplier profiles should reference existing users',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Test 10: Orders have suppliers
 */
async function testOrdersHaveSuppliers(): Promise<IntegrityTest> {
  try {
    // Orders should have supplier if they have a product or quotation with supplier
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN quotations q ON o.quotation_id = q.id
      WHERE (o.supplier_id IS NULL OR o.supplier_id = '')
        AND (
          (p.supplier_id IS NOT NULL AND p.supplier_id != '')
          OR (q.supplier_id IS NOT NULL AND q.supplier_id != '')
        )
    `);
    
    const count = parseInt(result.rows[0].count);
    
    return {
      name: 'Orders Have Suppliers',
      description: 'All orders should have supplier information when product or quotation has supplier',
      passed: count === 0,
      details: {
        ordersWithoutSupplier: count
      }
    };
  } catch (error: any) {
    return {
      name: 'Orders Have Suppliers',
      description: 'All orders should have supplier information when product or quotation has supplier',
      passed: false,
      details: { error: error.message }
    };
  }
}

/**
 * Run all integrity tests
 */
async function runIntegrityTests() {
  console.log('='.repeat(80));
  console.log('DATA INTEGRITY TESTS FOR MULTIVENDOR MARKETPLACE');
  console.log('='.repeat(80));
  console.log('');
  
  const tests: IntegrityTest[] = [];
  
  try {
    // Run all tests
    console.log('Running integrity tests...\n');
    
    tests.push(await testProductsHaveSuppliers());
    tests.push(await testProductSuppliersExist());
    tests.push(await testInquiriesRoutedCorrectly());
    tests.push(await testRFQsRoutedCorrectly());
    tests.push(await testQuotationsHaveSuppliers());
    tests.push(await testInquiryQuotationsHaveSuppliers());
    tests.push(await testNoOrphanedInquiries());
    tests.push(await testNoOrphanedRFQs());
    tests.push(await testSupplierProfilesValid());
    tests.push(await testOrdersHaveSuppliers());
    
    // Display results
    console.log('Test Results:');
    console.log('-'.repeat(80));
    
    let passedCount = 0;
    let failedCount = 0;
    
    for (const test of tests) {
      const status = test.passed ? '✓ PASS' : '✗ FAIL';
      const statusColor = test.passed ? '\x1b[32m' : '\x1b[31m';
      const resetColor = '\x1b[0m';
      
      console.log(`${statusColor}${status}${resetColor} | ${test.name}`);
      console.log(`       ${test.description}`);
      
      if (!test.passed && test.details) {
        console.log(`       Details:`, JSON.stringify(test.details, null, 2));
      }
      
      console.log('');
      
      if (test.passed) {
        passedCount++;
      } else {
        failedCount++;
      }
    }
    
    // Summary
    console.log('='.repeat(80));
    console.log(`SUMMARY: ${passedCount} passed, ${failedCount} failed out of ${tests.length} tests`);
    
    if (failedCount === 0) {
      console.log('\x1b[32m✓ All integrity tests passed!\x1b[0m');
      console.log('The data migration is complete and data integrity is verified.');
    } else {
      console.log('\x1b[31m✗ Some integrity tests failed.\x1b[0m');
      console.log('Please review the failed tests and fix any data integrity issues.');
      console.log('You may need to run manual SQL queries to fix the issues or rollback the migration.');
    }
    console.log('='.repeat(80));
    
    process.exit(failedCount > 0 ? 1 : 0);
    
  } catch (error: any) {
    console.error('\n❌ Integrity tests failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runIntegrityTests().catch(console.error);
}

export { runIntegrityTests };
