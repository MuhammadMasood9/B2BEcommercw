/**
 * Data Migration Script for Multivendor Marketplace
 * 
 * This script runs the data migration from admin-managed to supplier-managed model
 * and performs comprehensive data integrity checks.
 */

import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

interface VerificationResult {
  table: string;
  total: number;
  withSupplier: number;
  withoutSupplier: number;
  percentage: number;
}

/**
 * Run a SQL file
 */
async function runSQLFile(filePath: string): Promise<MigrationResult> {
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    return {
      success: true,
      message: `Successfully executed ${path.basename(filePath)}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to execute ${path.basename(filePath)}`,
      details: error.message
    };
  }
}

/**
 * Check if admin user exists
 */
async function checkAdminUser(): Promise<MigrationResult> {
  try {
    const result = await pool.query(
      "SELECT id, email FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'No admin user found. Please create an admin user before running migration.',
        details: { adminExists: false }
      };
    }
    
    return {
      success: true,
      message: 'Admin user found',
      details: { 
        adminExists: true,
        adminId: result.rows[0].id,
        adminEmail: result.rows[0].email
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to check admin user',
      details: error.message
    };
  }
}

/**
 * Verify data migration results
 */
async function verifyMigration(): Promise<VerificationResult[]> {
  const tables = ['products', 'inquiries', 'rfqs', 'quotations', 'orders'];
  const results: VerificationResult[] = [];
  
  for (const table of tables) {
    try {
      const totalResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const total = parseInt(totalResult.rows[0].count);
      
      const withSupplierResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${table} WHERE supplier_id IS NOT NULL AND supplier_id != ''`
      );
      const withSupplier = parseInt(withSupplierResult.rows[0].count);
      
      const withoutSupplier = total - withSupplier;
      const percentage = total > 0 ? (withSupplier / total) * 100 : 0;
      
      results.push({
        table,
        total,
        withSupplier,
        withoutSupplier,
        percentage: Math.round(percentage * 100) / 100
      });
    } catch (error: any) {
      console.error(`Error verifying ${table}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Check data integrity
 */
async function checkDataIntegrity(): Promise<MigrationResult> {
  const issues: string[] = [];
  
  try {
    // Check for products without supplier
    const productsWithoutSupplier = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE supplier_id IS NULL OR supplier_id = ''"
    );
    if (parseInt(productsWithoutSupplier.rows[0].count) > 0) {
      issues.push(`${productsWithoutSupplier.rows[0].count} products without supplier`);
    }
    
    // Check for inquiries without supplier but with product
    const inquiriesWithoutSupplier = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inquiries i
      JOIN products p ON i.product_id = p.id
      WHERE (i.supplier_id IS NULL OR i.supplier_id = '')
        AND p.supplier_id IS NOT NULL
    `);
    if (parseInt(inquiriesWithoutSupplier.rows[0].count) > 0) {
      issues.push(`${inquiriesWithoutSupplier.rows[0].count} inquiries without supplier but product has supplier`);
    }
    
    // Check for RFQs without supplier but with product
    const rfqsWithoutSupplier = await pool.query(`
      SELECT COUNT(*) as count 
      FROM rfqs r
      JOIN products p ON r.product_id = p.id
      WHERE (r.supplier_id IS NULL OR r.supplier_id = '')
        AND p.supplier_id IS NOT NULL
    `);
    if (parseInt(rfqsWithoutSupplier.rows[0].count) > 0) {
      issues.push(`${rfqsWithoutSupplier.rows[0].count} RFQs without supplier but product has supplier`);
    }
    
    // Check for quotations without supplier
    const quotationsWithoutSupplier = await pool.query(
      "SELECT COUNT(*) as count FROM quotations WHERE supplier_id IS NULL OR supplier_id = ''"
    );
    if (parseInt(quotationsWithoutSupplier.rows[0].count) > 0) {
      issues.push(`${quotationsWithoutSupplier.rows[0].count} quotations without supplier`);
    }
    
    // Check for orphaned data (inquiries with non-existent products)
    const orphanedInquiries = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inquiries i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE p.id IS NULL
    `);
    if (parseInt(orphanedInquiries.rows[0].count) > 0) {
      issues.push(`${orphanedInquiries.rows[0].count} inquiries with non-existent products`);
    }
    
    if (issues.length > 0) {
      return {
        success: false,
        message: 'Data integrity issues found',
        details: { issues }
      };
    }
    
    return {
      success: true,
      message: 'Data integrity check passed',
      details: { issues: [] }
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to check data integrity',
      details: error.message
    };
  }
}

/**
 * Get migration statistics
 */
async function getMigrationStats(): Promise<any> {
  try {
    // Get supplier count
    const supplierCount = await pool.query(
      "SELECT COUNT(*) as count FROM supplier_profiles"
    );
    
    // Get admin supplier
    const adminSupplier = await pool.query(`
      SELECT sp.id, sp.business_name, sp.store_name, u.email
      FROM supplier_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE u.role = 'admin'
      LIMIT 1
    `);
    
    // Get products by supplier
    const productsBySupplier = await pool.query(`
      SELECT 
        sp.business_name,
        sp.store_name,
        COUNT(p.id) as product_count
      FROM supplier_profiles sp
      LEFT JOIN products p ON sp.id = p.supplier_id
      GROUP BY sp.id, sp.business_name, sp.store_name
      ORDER BY product_count DESC
    `);
    
    return {
      totalSuppliers: parseInt(supplierCount.rows[0].count),
      adminSupplier: adminSupplier.rows[0] || null,
      productsBySupplier: productsBySupplier.rows
    };
  } catch (error: any) {
    console.error('Error getting migration stats:', error.message);
    return null;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('='.repeat(80));
  console.log('DATA MIGRATION TO MULTIVENDOR SYSTEM');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Step 1: Check prerequisites
    console.log('Step 1: Checking prerequisites...');
    const adminCheck = await checkAdminUser();
    console.log(`  ${adminCheck.success ? '✓' : '✗'} ${adminCheck.message}`);
    if (adminCheck.details) {
      console.log(`    Admin ID: ${adminCheck.details.adminId}`);
      console.log(`    Admin Email: ${adminCheck.details.adminEmail}`);
    }
    
    if (!adminCheck.success) {
      console.log('\n❌ Migration aborted: Prerequisites not met');
      process.exit(1);
    }
    console.log('');
    
    // Step 2: Run migration
    console.log('Step 2: Running data migration...');
    const migrationPath = path.join(__dirname, '../migrations/0013_data_migration_to_multivendor.sql');
    const migrationResult = await runSQLFile(migrationPath);
    console.log(`  ${migrationResult.success ? '✓' : '✗'} ${migrationResult.message}`);
    
    if (!migrationResult.success) {
      console.log(`    Error: ${migrationResult.details}`);
      console.log('\n❌ Migration failed');
      process.exit(1);
    }
    console.log('');
    
    // Step 3: Verify migration
    console.log('Step 3: Verifying migration results...');
    const verificationResults = await verifyMigration();
    console.log('');
    console.log('  Migration Results:');
    console.log('  ' + '-'.repeat(76));
    console.log('  | Table              | Total | With Supplier | Without | Coverage |');
    console.log('  ' + '-'.repeat(76));
    
    for (const result of verificationResults) {
      const tableName = result.table.padEnd(18);
      const total = result.total.toString().padStart(5);
      const withSupplier = result.withSupplier.toString().padStart(13);
      const without = result.withoutSupplier.toString().padStart(7);
      const coverage = `${result.percentage}%`.padStart(8);
      console.log(`  | ${tableName} | ${total} | ${withSupplier} | ${without} | ${coverage} |`);
    }
    console.log('  ' + '-'.repeat(76));
    console.log('');
    
    // Step 4: Check data integrity
    console.log('Step 4: Checking data integrity...');
    const integrityCheck = await checkDataIntegrity();
    console.log(`  ${integrityCheck.success ? '✓' : '⚠'} ${integrityCheck.message}`);
    
    if (!integrityCheck.success && integrityCheck.details?.issues) {
      console.log('  Issues found:');
      for (const issue of integrityCheck.details.issues) {
        console.log(`    - ${issue}`);
      }
    }
    console.log('');
    
    // Step 5: Get migration statistics
    console.log('Step 5: Migration statistics...');
    const stats = await getMigrationStats();
    if (stats) {
      console.log(`  Total Suppliers: ${stats.totalSuppliers}`);
      if (stats.adminSupplier) {
        console.log(`  Admin Supplier: ${stats.adminSupplier.business_name} (${stats.adminSupplier.store_name})`);
      }
      console.log('');
      console.log('  Products by Supplier:');
      for (const supplier of stats.productsBySupplier.slice(0, 5)) {
        console.log(`    - ${supplier.store_name}: ${supplier.product_count} products`);
      }
    }
    console.log('');
    
    // Final summary
    console.log('='.repeat(80));
    if (integrityCheck.success) {
      console.log('✓ MIGRATION COMPLETED SUCCESSFULLY');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Review the migration results above');
      console.log('  2. Test the application to ensure everything works correctly');
      console.log('  3. If issues are found, run the rollback script:');
      console.log('     npm run rollback-migration');
    } else {
      console.log('⚠ MIGRATION COMPLETED WITH WARNINGS');
      console.log('');
      console.log('Please review the data integrity issues above.');
      console.log('You may need to manually fix some data or run the rollback script.');
    }
    console.log('='.repeat(80));
    
  } catch (error: any) {
    console.error('\n❌ Migration failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration().catch(console.error);
}

export { runMigration, verifyMigration, checkDataIntegrity };
