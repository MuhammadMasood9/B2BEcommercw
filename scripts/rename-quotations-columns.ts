import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function renameColumns() {
  try {
    console.log('🔄 Renaming quotations columns...\n');
    
    // Rename unit_price to price_per_unit
    console.log('1️⃣ Renaming unit_price to price_per_unit...');
    try {
      await db.execute(sql`
        ALTER TABLE "quotations" RENAME COLUMN "unit_price" TO "price_per_unit"
      `);
      console.log('  ✅ Success');
    } catch (error: any) {
      console.log(`  ⚠️  ${error.message}`);
    }
    
    // Drop validity_period
    console.log('\n2️⃣ Dropping validity_period column...');
    try {
      await db.execute(sql`
        ALTER TABLE "quotations" DROP COLUMN IF EXISTS "validity_period"
      `);
      console.log('  ✅ Success');
    } catch (error: any) {
      console.log(`  ⚠️  ${error.message}`);
    }
    
    // Add admin_id
    console.log('\n3️⃣ Adding admin_id column...');
    try {
      await db.execute(sql`
        ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "admin_id" varchar
      `);
      console.log('  ✅ Success');
    } catch (error: any) {
      console.log(`  ⚠️  ${error.message}`);
    }
    
    // Verify the schema
    console.log('\n4️⃣ Verifying schema...');
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotations'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current quotations columns:');
    result.rows.forEach((row: any) => console.log(`  - ${row.column_name}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

renameColumns().then(() => {
  console.log('\n🎉 Script completed');
  process.exit(0);
});
