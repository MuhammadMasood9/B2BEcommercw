import { readFileSync } from 'fs';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function runFixMigration() {
  try {
    console.log('Running conversations schema fix migration...');
    
    const migrationSQL = readFileSync('./fix-conversations-schema.sql', 'utf8');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await db.execute(sql.raw(statement));
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runFixMigration();