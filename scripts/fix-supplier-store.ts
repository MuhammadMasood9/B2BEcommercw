#!/usr/bin/env tsx

import { runMigration } from '../server/migrate';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixSupplierStore() {
  console.log('🔧 Fixing Supplier Store Database Issues...\n');

  try {
    // Step 1: Run the migration to add missing columns
    console.log('Step 1: Running database migration...');
    await runMigration();
    console.log('✅ Migration completed\n');

    // Step 2: Verify the fix by checking table structure
    console.log('Step 2: Verifying table structure...');
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Conversations table columns:');
    columns.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // Step 3: Test basic functionality
    console.log('Step 3: Testing basic functionality...');
    
    // Test if we can query conversations
    const conversationCount = await db.execute(sql`SELECT COUNT(*) as count FROM conversations`);
    console.log(`📊 Total conversations: ${conversationCount.rows[0]?.count || 0}`);

    // Test if we can query supplier profiles
    const supplierCount = await db.execute(sql`SELECT COUNT(*) as count FROM supplier_profiles`);
    console.log(`🏪 Total supplier profiles: ${supplierCount.rows[0]?.count || 0}`);

    // Test if we can query products
    const productCount = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
    console.log(`📦 Total products: ${productCount.rows[0]?.count || 0}`);

    console.log('\n✅ All checks passed! The supplier store should now work correctly.');
    console.log('\n🚀 You can now:');
    console.log('   1. Visit /supplier-store-demo to see the demo');
    console.log('   2. Visit /store/{slug} to view supplier stores');
    console.log('   3. Create test data using the demo page');
    console.log('   4. Test the chat/messaging functionality');

  } catch (error) {
    console.error('❌ Error fixing supplier store:', error);
    process.exit(1);
  }
}

// Run the fix
fixSupplierStore().then(() => {
  console.log('\n🎉 Supplier store fix completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Failed to fix supplier store:', error);
  process.exit(1);
});