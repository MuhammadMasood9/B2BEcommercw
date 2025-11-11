import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkBuyersTable() {
  try {
    console.log('🔄 Checking buyers table structure...\n');
    
    // Check buyers table structure
    const buyersColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'buyers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Buyers table structure:');
    console.table(buyersColumns.rows);
    
    // Get sample data
    const sampleData = await db.execute(sql`
      SELECT * FROM buyers LIMIT 5
    `);
    
    console.log('\n📊 Sample data from buyers table:');
    if (sampleData.rows.length > 0) {
      console.table(sampleData.rows);
    } else {
      console.log('  (empty table)');
    }
    
    // Count records
    const count = await db.execute(sql`SELECT COUNT(*) as count FROM buyers`);
    console.log(`\n📈 Total buyers: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBuyersTable().then(() => {
  console.log('\n🎉 Check completed');
  process.exit(0);
});
