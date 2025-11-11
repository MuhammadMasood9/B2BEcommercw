import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixConversationsAdminColumn() {
  try {
    console.log('Fixing conversations table admin column...\n');
    
    // The schema has unreadCountAdmin which should map to admin_id column
    // But the code is trying to access unread_count_admin
    // Let's add unread_count_admin as an alias or separate column
    
    console.log('1. Adding unread_count_admin column...');
    await db.execute(sql`
      ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_admin" integer DEFAULT 0
    `);
    console.log('✅ unread_count_admin column added');
    
    // Verify
    console.log('\n2. Verifying column exists...');
    const check = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name = 'unread_count_admin'
    `);
    
    if (check.rows && check.rows.length > 0) {
      console.log('✅ Verification successful: unread_count_admin column exists');
    } else {
      console.log('❌ Verification failed: column still missing');
    }
    
    console.log('\n✅ Fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixConversationsAdminColumn();
