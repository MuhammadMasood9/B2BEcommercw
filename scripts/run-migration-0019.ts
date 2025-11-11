import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running migration 0019: Align quotations schema...\n');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'migrations', '0019_align_quotations_schema.sql');
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
    
    // Verify the schema
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotations'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current quotations columns:');
    result.rows.forEach((row: any) => console.log(`  - ${row.column_name}`));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('\n🎉 Migration script completed');
  process.exit(0);
});
