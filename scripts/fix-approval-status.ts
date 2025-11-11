import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixApprovalStatus() {
  try {
    console.log('Adding approval_status column to products table...');
    
    // Add the column
    await db.execute(sql`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "approval_status" varchar DEFAULT 'pending'
    `);
    console.log('✅ Column added');
    
    // Update existing products
    await db.execute(sql`
      UPDATE "products" SET "approval_status" = 'approved' WHERE "is_approved" = true
    `);
    console.log('✅ Existing products updated');
    
    // Create index
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "products_approval_status_idx" ON "products" ("approval_status")
    `);
    console.log('✅ Index created');
    
    // Verify
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'approval_status'
    `);
    
    if (result.rows && result.rows.length > 0) {
      console.log('✅ Verification successful: approval_status column exists');
    } else {
      console.log('❌ Verification failed: column still missing');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixApprovalStatus();
