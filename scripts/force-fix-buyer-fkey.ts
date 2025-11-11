import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixBuyerFkey() {
  try {
    console.log('🔄 Fixing rfqs buyer_id foreign key constraint...\n');
    
    // Drop the old constraint
    console.log('1️⃣ Dropping old constraint...');
    try {
      await db.execute(sql`
        ALTER TABLE "rfqs" DROP CONSTRAINT "rfqs_buyer_id_fkey"
      `);
      console.log('  ✅ Old constraint dropped');
    } catch (error: any) {
      console.log(`  ⚠️  ${error.message}`);
    }
    
    // Add the new constraint pointing to users table
    console.log('\n2️⃣ Adding new constraint pointing to users table...');
    try {
      await db.execute(sql`
        ALTER TABLE "rfqs" 
        ADD CONSTRAINT "rfqs_buyer_id_fkey" 
        FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE
      `);
      console.log('  ✅ New constraint added');
    } catch (error: any) {
      console.log(`  ⚠️  ${error.message}`);
    }
    
    // Verify the constraints
    console.log('\n3️⃣ Verifying constraints...');
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
        AND kcu.column_name = 'buyer_id'
    `);
    
    console.log('\n📋 buyer_id foreign key constraint:');
    console.table(result.rows);
    
    if (result.rows.length > 0 && result.rows[0].foreign_table_name === 'users') {
      console.log('\n✅ SUCCESS: Foreign key now correctly points to users table!');
    } else {
      console.log('\n❌ FAILED: Foreign key still points to wrong table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixBuyerFkey().then(() => {
  console.log('\n🎉 Script completed');
  process.exit(0);
});
