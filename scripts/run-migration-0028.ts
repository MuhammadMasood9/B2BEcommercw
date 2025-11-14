import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('=== Running Migration 0028: Fix payouts columns ===');
    
    const migrationPath = path.join(process.cwd(), 'migrations', '0028_fix_payouts_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration...');
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migration completed successfully');
    console.log('✅ Renamed commission_amount → commission_deducted');
    console.log('✅ Renamed method → payout_method');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
