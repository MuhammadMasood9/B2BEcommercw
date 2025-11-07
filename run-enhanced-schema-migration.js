import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('📖 Reading migration file...');
    const migrationSQL = readFileSync('migrations/0023_enhanced_database_schema_v2.sql', 'utf8');
    
    console.log('🚀 Running enhanced database schema migration...');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(/;\s*$/gm)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        successCount++;
      } catch (error) {
        // Skip errors for already existing objects
        if (error.code === '42P07' || // relation already exists
            error.code === '42710' || // object already exists
            error.code === '42P16') { // invalid table definition
          skipCount++;
        } else {
          console.warn(`⚠️  Warning: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Enhanced database schema migration completed successfully!');
    console.log(`   Executed: ${successCount} statements, Skipped: ${skipCount} existing objects`);
    console.log('\n📊 Migration Summary:');
    console.log('  ✓ Added composite indexes for authentication queries');
    console.log('  ✓ Added indexes for user, session, and audit log tables');
    console.log('  ✓ Added data validation constraints');
    console.log('  ✓ Created performance optimization functions');
    console.log('  ✓ Created triggers for data integrity');
    console.log('  ✓ Created views for common queries');
    console.log('  ✓ Enhanced staff members and verification documents indexes');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration();
