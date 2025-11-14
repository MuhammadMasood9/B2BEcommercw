import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('=== Running Migration 0026: Remove paid_at column ===');
    
    const migrationPath = path.join(process.cwd(), 'migrations', '0026_remove_paid_at_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration...');
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
