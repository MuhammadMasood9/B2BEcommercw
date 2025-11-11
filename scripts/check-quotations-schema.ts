import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkQuotationsSchema() {
  try {
    console.log('🔄 Checking quotations table schema...\n');
    
    // Get all columns in quotations table
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'quotations'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Columns in quotations table:');
    console.table(columns.rows);
    
    // Check foreign key constraints
    const constraints = await db.execute(sql`
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
        AND tc.table_name = 'quotations'
    `);
    
    console.log('\n📋 Foreign key constraints on quotations:');
    console.table(constraints.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkQuotationsSchema().then(() => {
  console.log('\n🎉 Check completed');
  process.exit(0);
});
