import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkConstraints() {
  try {
    console.log('🔄 Checking foreign key constraints on rfqs table...');
    
    const constraints = await db.execute(sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'rfqs'
    `);
    
    console.log('\n📋 Foreign key constraints on rfqs table:');
    console.table(constraints.rows);
    
    // Check if buyers table exists
    const buyersTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'buyers'
    `);
    
    console.log('\n🔍 Buyers table exists:', buyersTable.rows.length > 0);
    
    // Check if users table exists
    const usersTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);
    
    console.log('🔍 Users table exists:', usersTable.rows.length > 0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkConstraints().then(() => {
  console.log('\n🎉 Check completed');
  process.exit(0);
});
