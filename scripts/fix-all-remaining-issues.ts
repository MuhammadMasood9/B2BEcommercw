import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixAllIssues() {
  try {
    console.log('Fixing all remaining database issues...\n');
    
    // 1. Fix conversations table - add unread_count_buyer if missing
    console.log('1. Checking conversations table...');
    await db.execute(sql`
      ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_buyer" integer DEFAULT 0
    `);
    await db.execute(sql`
      ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_supplier" integer DEFAULT 0
    `);
    await db.execute(sql`
      ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "supplier_id" varchar
    `);
    await db.execute(sql`
      ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "product_id" varchar
    `);
    await db.execute(sql`
      ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message" text
    `);
    console.log('✅ Conversations table fixed');
    
    // 2. Verify all columns exist
    console.log('\n2. Verifying columns...');
    const conversationsCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name IN ('unread_count_buyer', 'unread_count_supplier', 'supplier_id', 'product_id', 'last_message')
    `);
    console.log(`✅ Found ${conversationsCheck.rows.length}/5 columns in conversations table`);
    
    const productsCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'approval_status'
    `);
    console.log(`✅ Found ${productsCheck.rows.length}/1 approval_status column in products table`);
    
    const supplierCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'supplier_profiles' 
      AND column_name IN ('employees_count', 'verification_documents', 'commission_rate', 'store_policies', 'operating_hours')
    `);
    console.log(`✅ Found ${supplierCheck.rows.length}/5 columns in supplier_profiles table`);
    
    console.log('\n✅ All database fixes completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllIssues();
