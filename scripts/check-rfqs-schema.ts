import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkRfqsSchema() {
  try {
    console.log('🔄 Checking rfqs table schema...');
    
    // Get all columns in rfqs table
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'rfqs'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Columns in rfqs table:');
    console.table(columns.rows);
    
    // Try to insert a test RFQ with product_id
    console.log('\n🧪 Testing insert with product_id...');
    try {
      const testResult = await db.execute(sql`
        INSERT INTO rfqs (
          id, buyer_id, product_id, title, description, quantity, status
        ) VALUES (
          gen_random_uuid(), 
          'test-buyer-id', 
          'test-product-id', 
          'Test RFQ', 
          'Test Description', 
          100, 
          'open'
        ) RETURNING id
      `);
      
      console.log('✅ Test insert successful:', testResult.rows[0]);
      
      // Clean up test data
      await db.execute(sql`DELETE FROM rfqs WHERE buyer_id = 'test-buyer-id'`);
      console.log('🧹 Test data cleaned up');
      
    } catch (insertError: any) {
      console.error('❌ Test insert failed:', insertError.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking rfqs schema:', error);
    process.exit(1);
  }
}

checkRfqsSchema().then(() => {
  console.log('\n🎉 Schema check completed');
  process.exit(0);
});
