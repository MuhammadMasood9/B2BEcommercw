import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('=== Running Migration 0027: Add paid_at column ===');
    
    const migrationPath = path.join(process.cwd(), 'migrations', '0027_add_paid_at_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration...');
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migration completed successfully');
    console.log('✅ paid_at column added to commissions table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
