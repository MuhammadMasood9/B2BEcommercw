import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixRfqsProductId() {
  try {
    console.log('🔄 Checking rfqs table for product_id column...');
    
    // Check if column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rfqs' 
      AND column_name = 'product_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ product_id column already exists in rfqs table');
      return;
    }
    
    console.log('📝 Adding product_id column to rfqs table...');
    
    // Add the column
    await db.execute(sql`
      ALTER TABLE "rfqs" ADD COLUMN "product_id" varchar
    `);
    
    console.log('✅ Successfully added product_id column to rfqs table');
    
    // Verify the column was added
    const verifyCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rfqs' 
      AND column_name = 'product_id'
    `);
    
    if (verifyCheck.rows.length > 0) {
      console.log('✅ Verification successful: product_id column exists');
    } else {
      console.error('❌ Verification failed: product_id column not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing rfqs table:', error);
    process.exit(1);
  }
}

fixRfqsProductId().then(() => {
  console.log('🎉 Script completed');
  process.exit(0);
});
