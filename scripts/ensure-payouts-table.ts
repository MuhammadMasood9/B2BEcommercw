import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function ensurePayoutsTable() {
  try {
    console.log("Checking if payouts table exists...");
    
    // Check if table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payouts'
      );
    `);
    
    console.log("Table check result:", tableCheck);
    
    // Create table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payouts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id VARCHAR NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        commission_deducted DECIMAL(10,2) NOT NULL,
        net_amount DECIMAL(10,2) NOT NULL,
        payout_method TEXT,
        status TEXT DEFAULT 'pending',
        scheduled_date TIMESTAMP,
        processed_date TIMESTAMP,
        transaction_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("✅ Payouts table ensured");
    
    // Check if any payouts exist
    const count = await db.execute(sql`SELECT COUNT(*) FROM payouts;`);
    console.log("Payouts count:", count);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

ensurePayoutsTable();
