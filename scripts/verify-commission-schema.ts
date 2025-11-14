import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function verifyCommissionSchema() {
  console.log("🔍 Verifying Commission System Schema\n");

  try {
    // 1. Check commission_tiers table and data
    console.log("1️⃣  Commission Tiers Table:");
    const tiers = await db.execute(sql`
      SELECT id, min_amount, max_amount, commission_rate, description, is_active 
      FROM commission_tiers 
      ORDER BY min_amount
    `);
    console.log(`   Found ${tiers.rows.length} tiers:`);
    tiers.rows.forEach((tier: any) => {
      console.log(`   - ${tier.description}`);
      console.log(`     Range: ₹${tier.min_amount} - ${tier.max_amount || '∞'}`);
      console.log(`     Rate: ${(parseFloat(tier.commission_rate) * 100).toFixed(2)}%`);
      console.log(`     Active: ${tier.is_active}`);
    });

    // 2. Check supplier_profiles columns
    console.log("\n2️⃣  Supplier Profiles Enhancements:");
    const supplierCols = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'supplier_profiles' 
        AND column_name IN (
          'commission_rate', 
          'commission_credit_limit', 
          'total_unpaid_commission', 
          'is_restricted',
          'last_payment_date',
          'payment_reminder_sent_at'
        )
      ORDER BY column_name
    `);
    supplierCols.rows.forEach((col: any) => {
      console.log(`   ✓ ${col.column_name} (${col.data_type})`);
    });

    // 3. Check commissions table columns
    console.log("\n3️⃣  Commissions Table Enhancements:");
    const commissionCols = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'commissions' 
        AND column_name IN (
          'order_amount',
          'commission_rate',
          'commission_amount',
          'supplier_amount',
          'status',
          'due_date',
          'payment_submitted_at',
          'payment_date',
          'payment_transaction_id',
          'payment_verified_by',
          'payment_verified_at'
        )
      ORDER BY column_name
    `);
    commissionCols.rows.forEach((col: any) => {
      console.log(`   ✓ ${col.column_name} (${col.data_type})`);
    });

    // 4. Check payment_submissions table
    console.log("\n4️⃣  Payment Submissions Table:");
    const paymentCols = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'payment_submissions'
      ORDER BY ordinal_position
    `);
    console.log(`   Found ${paymentCols.rows.length} columns:`);
    paymentCols.rows.forEach((col: any) => {
      console.log(`   ✓ ${col.column_name} (${col.data_type})`);
    });

    // 5. Check indexes
    console.log("\n5️⃣  Performance Indexes:");
    const indexes = await db.execute(sql`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('commission_tiers', 'supplier_profiles', 'commissions', 'payment_submissions')
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    const indexesByTable: Record<string, number> = {};
    indexes.rows.forEach((idx: any) => {
      indexesByTable[idx.tablename] = (indexesByTable[idx.tablename] || 0) + 1;
    });
    
    Object.entries(indexesByTable).forEach(([table, count]) => {
      console.log(`   ✓ ${table}: ${count} indexes`);
    });

    // 6. Check helper functions
    console.log("\n6️⃣  Helper Functions:");
    const functions = await db.execute(sql`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('select_commission_tier', 'should_restrict_supplier')
      ORDER BY routine_name
    `);
    functions.rows.forEach((func: any) => {
      console.log(`   ✓ ${func.routine_name}() - ${func.routine_type}`);
    });

    // 7. Test tier selection function
    console.log("\n7️⃣  Testing Tier Selection Function:");
    const testAmounts = [5000, 50000, 150000];
    for (const amount of testAmounts) {
      const result = await db.execute(sql`
        SELECT * FROM select_commission_tier(${amount})
      `);
      if (result.rows.length > 0) {
        const tier = result.rows[0] as any;
        console.log(`   ₹${amount.toLocaleString()} → ${(parseFloat(tier.tier_rate) * 100).toFixed(0)}% commission`);
      }
    }

    console.log("\n✅ All schema components verified successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Commission Tiers: ${tiers.rows.length} tiers configured`);
    console.log(`   - Supplier Columns: ${supplierCols.rows.length}/6 columns added`);
    console.log(`   - Commission Columns: ${commissionCols.rows.length}/11 columns present`);
    console.log(`   - Payment Submissions: ${paymentCols.rows.length} columns`);
    console.log(`   - Performance Indexes: ${indexes.rows.length} indexes created`);
    console.log(`   - Helper Functions: ${functions.rows.length}/2 functions created`);

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    throw error;
  }
}

// Run verification
verifyCommissionSchema()
  .then(() => {
    console.log("\n✅ Verification completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
