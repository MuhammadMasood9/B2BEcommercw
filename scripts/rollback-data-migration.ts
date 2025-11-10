/**
 * Rollback Script for Multivendor Marketplace Data Migration
 * 
 * This script rolls back the data migration from supplier-managed to admin-managed model
 */

import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface RollbackResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Run a SQL file
 */
async function runSQLFile(filePath: string): Promise<RollbackResult> {
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
 * Check if migration has been run
 */
async function checkMigrationStatus(): Promise<RollbackResult> {
  try {
    // Check if migration_audit table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'migration_audit'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      return {
        success: false,
        message: 'Migration audit table not found. Migration may not have been run.',
        details: { migrationRun: false }
      };
    }
    
    // Check if migration was completed
    const migrationStatus = await pool.query(`
      SELECT * FROM migration_audit 
      WHERE migration_name = '0013_data_migration_to_multivendor'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (migrationStatus.rows.length === 0) {
      return {
        success: false,
        message: 'No migration record found.',
        details: { migrationRun: false }
      };
    }
    
    const status = migrationStatus.rows[0].status;
    
    if (status === 'rolled_back') {
      return {
        success: false,
        message: 'Migration has already been rolled back.',
        details: { 
          migrationRun: true,
          alreadyRolledBack: true,
          lastStatus: status
        }
      };
    }
    
    return {
      success: true,
      message: 'Migration found and can be rolled back',
      details: { 
        migrationRun: true,
        alreadyRolledBack: false,
        lastStatus: status
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to check migration status',
      details: error.message
    };
  }
}

/**
 * Get current data statistics before rollback
 */
async function getPreRollbackStats(): Promise<any> {
  try {
    const stats: any = {};
    
    // Products with supplier
    const productsResult = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    stats.productsWithSupplier = parseInt(productsResult.rows[0].count);
    
    // Inquiries with supplier
    const inquiriesResult = await pool.query(
      "SELECT COUNT(*) as count FROM inquiries WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    stats.inquiriesWithSupplier = parseInt(inquiriesResult.rows[0].count);
    
    // RFQs with supplier
    const rfqsResult = await pool.query(
      "SELECT COUNT(*) as count FROM rfqs WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    stats.rfqsWithSupplier = parseInt(rfqsResult.rows[0].count);
    
    // Quotations with supplier
    const quotationsResult = await pool.query(
      "SELECT COUNT(*) as count FROM quotations WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    stats.quotationsWithSupplier = parseInt(quotationsResult.rows[0].count);
    
    // Orders with supplier
    const ordersResult = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    stats.ordersWithSupplier = parseInt(ordersResult.rows[0].count);
    
    // Supplier count
    const suppliersResult = await pool.query(
      "SELECT COUNT(*) as count FROM supplier_profiles"
    );
    stats.totalSuppliers = parseInt(suppliersResult.rows[0].count);
    
    return stats;
  } catch (error: any) {
    console.error('Error getting pre-rollback stats:', error.message);
    return null;
  }
}

/**
 * Verify rollback results
 */
async function verifyRollback(): Promise<RollbackResult> {
  try {
    const issues: string[] = [];
    
    // Check products
    const productsWithSupplier = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    const productsCount = parseInt(productsWithSupplier.rows[0].count);
    if (productsCount > 0) {
      issues.push(`${productsCount} products still have supplier assignments`);
    }
    
    // Check inquiries
    const inquiriesWithSupplier = await pool.query(
      "SELECT COUNT(*) as count FROM inquiries WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    const inquiriesCount = parseInt(inquiriesWithSupplier.rows[0].count);
    if (inquiriesCount > 0) {
      issues.push(`${inquiriesCount} inquiries still have supplier assignments`);
    }
    
    // Check RFQs
    const rfqsWithSupplier = await pool.query(
      "SELECT COUNT(*) as count FROM rfqs WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    const rfqsCount = parseInt(rfqsWithSupplier.rows[0].count);
    if (rfqsCount > 0) {
      issues.push(`${rfqsCount} RFQs still have supplier assignments`);
    }
    
    // Check quotations
    const quotationsWithSupplier = await pool.query(
      "SELECT COUNT(*) as count FROM quotations WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    const quotationsCount = parseInt(quotationsWithSupplier.rows[0].count);
    if (quotationsCount > 0) {
      issues.push(`${quotationsCount} quotations still have supplier assignments`);
    }
    
    // Check orders
    const ordersWithSupplier = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE supplier_id IS NOT NULL AND supplier_id != ''"
    );
    const ordersCount = parseInt(ordersWithSupplier.rows[0].count);
    if (ordersCount > 0) {
      issues.push(`${ordersCount} orders still have supplier assignments`);
    }
    
    if (issues.length > 0) {
      return {
        success: false,
        message: 'Rollback verification failed',
        details: { issues }
      };
    }
    
    return {
      success: true,
      message: 'Rollback verification passed - all supplier assignments removed',
      details: { issues: [] }
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to verify rollback',
      details: error.message
    };
  }
}

/**
 * Main rollback function
 */
async function runRollback() {
  console.log('='.repeat(80));
  console.log('ROLLBACK DATA MIGRATION TO MULTIVENDOR SYSTEM');
  console.log('='.repeat(80));
  console.log('');
  console.log('⚠️  WARNING: This will remove all supplier assignments from your data!');
  console.log('');
  
  try {
    // Step 1: Check migration status
    console.log('Step 1: Checking migration status...');
    const statusCheck = await checkMigrationStatus();
    console.log(`  ${statusCheck.success ? '✓' : '✗'} ${statusCheck.message}`);
    
    if (!statusCheck.success) {
      if (statusCheck.details?.alreadyRolledBack) {
        console.log('\n⚠️  Migration has already been rolled back.');
      } else {
        console.log('\n❌ Cannot proceed with rollback.');
      }
      process.exit(1);
    }
    console.log('');
    
    // Step 2: Get current statistics
    console.log('Step 2: Getting current data statistics...');
    const preStats = await getPreRollbackStats();
    if (preStats) {
      console.log(`  Products with supplier: ${preStats.productsWithSupplier}`);
      console.log(`  Inquiries with supplier: ${preStats.inquiriesWithSupplier}`);
      console.log(`  RFQs with supplier: ${preStats.rfqsWithSupplier}`);
      console.log(`  Quotations with supplier: ${preStats.quotationsWithSupplier}`);
      console.log(`  Orders with supplier: ${preStats.ordersWithSupplier}`);
      console.log(`  Total suppliers: ${preStats.totalSuppliers}`);
    }
    console.log('');
    
    // Step 3: Confirm rollback
    console.log('⚠️  This action will:');
    console.log('  - Remove all supplier assignments from products, inquiries, RFQs, quotations, and orders');
    console.log('  - Create backup tables before rollback');
    console.log('  - Revert the system to admin-managed model');
    console.log('');
    
    const confirmed = await promptConfirmation('Are you sure you want to proceed with rollback? (yes/no): ');
    
    if (!confirmed) {
      console.log('\n❌ Rollback cancelled by user.');
      process.exit(0);
    }
    console.log('');
    
    // Step 4: Run rollback
    console.log('Step 4: Running rollback script...');
    const rollbackPath = path.join(__dirname, '../migrations/0013_rollback_data_migration.sql');
    const rollbackResult = await runSQLFile(rollbackPath);
    console.log(`  ${rollbackResult.success ? '✓' : '✗'} ${rollbackResult.message}`);
    
    if (!rollbackResult.success) {
      console.log(`    Error: ${rollbackResult.details}`);
      console.log('\n❌ Rollback failed');
      process.exit(1);
    }
    console.log('');
    
    // Step 5: Verify rollback
    console.log('Step 5: Verifying rollback...');
    const verificationResult = await verifyRollback();
    console.log(`  ${verificationResult.success ? '✓' : '⚠'} ${verificationResult.message}`);
    
    if (!verificationResult.success && verificationResult.details?.issues) {
      console.log('  Issues found:');
      for (const issue of verificationResult.details.issues) {
        console.log(`    - ${issue}`);
      }
    }
    console.log('');
    
    // Final summary
    console.log('='.repeat(80));
    if (verificationResult.success) {
      console.log('✓ ROLLBACK COMPLETED SUCCESSFULLY');
      console.log('');
      console.log('All supplier assignments have been removed from the data.');
      console.log('Backup tables have been created with the prefix "_backup_pre_rollback".');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Test the application to ensure it works in admin-managed mode');
      console.log('  2. If you need to restore data, query the backup tables');
      console.log('  3. Clean up backup tables when no longer needed');
    } else {
      console.log('⚠ ROLLBACK COMPLETED WITH WARNINGS');
      console.log('');
      console.log('Please review the verification issues above.');
      console.log('Some data may still have supplier assignments.');
    }
    console.log('='.repeat(80));
    
  } catch (error: any) {
    console.error('\n❌ Rollback failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run rollback if this script is executed directly
if (require.main === module) {
  runRollback().catch(console.error);
}

export { runRollback, verifyRollback };
