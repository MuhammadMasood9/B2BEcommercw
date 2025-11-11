import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function createCommissionsTable() {
  try {
    console.log('🔄 Creating commissions table...\n');
    
    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "commissions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" varchar NOT NULL,
        "supplier_id" varchar NOT NULL,
        "order_amount" numeric NOT NULL,
        "commission_rate" numeric NOT NULL,
        "commission_amount" numeric NOT NULL,
        "supplier_amount" numeric NOT NULL,
        "status" varchar DEFAULT 'pending',
        "created_at" timestamp DEFAULT now()
      )
    `);
    
    console.log('✅ Commissions table created');
    
    // Add foreign key constraints
    console.log('\n🔗 Adding foreign key constraints...');
    
    try {
      await db.execute(sql`
        ALTER TABLE "commissions" ADD CONSTRAINT "commissions_order_id_fkey" 
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      `);
      console.log('✅ Order FK added');
    } catch (e: any) {
      console.log('⚠️  Order FK:', e.message);
    }
    
    try {
      await db.execute(sql`
        ALTER TABLE "commissions" ADD CONSTRAINT "commissions_supplier_id_fkey" 
        FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE
      `);
      console.log('✅ Supplier FK added');
    } catch (e: any) {
      console.log('⚠️  Supplier FK:', e.message);
    }
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_commissions_order_id" ON "commissions"("order_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_commissions_supplier_id" ON "commissions"("supplier_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_commissions_status" ON "commissions"("status")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_commissions_created_at" ON "commissions"("created_at")`);
    
    console.log('✅ Indexes created');
    
    // Verify
    const result = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'commissions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Commissions table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createCommissionsTable().then(() => {
  console.log('\n🎉 Commissions table ready!');
  process.exit(0);
});
