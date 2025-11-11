import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running migration 0018: Fix rfqs foreign key constraints...\n');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'migrations', '0018_fix_rfqs_buyer_fkey.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      try {
        await db.execute(sql.raw(statement));
        console.log('  ✅ Success');
      } catch (error: any) {
        console.log(`  ⚠️  ${error.message}`);
      }
    }
    
    console.log('\n✅ Migration completed!');
    
    // Verify the constraints
    const result = await db.execute(sql`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'rfqs'
      ORDER BY tc.constraint_name
    `);
    
    console.log('\n📋 Current foreign key constraints on rfqs:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('\n🎉 Migration script completed');
  process.exit(0);
});
