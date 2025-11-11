import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addExpectedDate() {
  try {
    console.log('🔄 Adding expected_date column to rfqs table...');
    
    await db.execute(sql`
      ALTER TABLE "rfqs" ADD COLUMN IF NOT EXISTS "expected_date" timestamp
    `);
    
    console.log('✅ Successfully added expected_date column');
    
    // Verify
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rfqs' AND column_name = 'expected_date'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification successful: expected_date column exists');
    } else {
      console.error('❌ Verification failed: expected_date column not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addExpectedDate().then(() => {
  console.log('🎉 Script completed');
  process.exit(0);
});
