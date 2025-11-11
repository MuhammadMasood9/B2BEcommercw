import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixSupplierColumns() {
  try {
    console.log('Adding missing columns to supplier_profiles table...');
    
    // Add employees_count column
    await db.execute(sql`
      ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "employees_count" varchar
    `);
    console.log('✅ employees_count column added');
    
    // Add verification_documents column
    await db.execute(sql`
      ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "verification_documents" text[]
    `);
    console.log('✅ verification_documents column added');
    
    // Add commission_rate column
    await db.execute(sql`
      ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "commission_rate" decimal(5,2) DEFAULT 10.00
    `);
    console.log('✅ commission_rate column added');
    
    // Add store_policies column
    await db.execute(sql`
      ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "store_policies" json
    `);
    console.log('✅ store_policies column added');
    
    // Add operating_hours column
    await db.execute(sql`
      ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "operating_hours" json
    `);
    console.log('✅ operating_hours column added');
    
    console.log('\n✅ All columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSupplierColumns();
