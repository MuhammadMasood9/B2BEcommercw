import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function applyFix() {
  try {
    console.log("Applying orders product_id nullable fix...");
    
    const migrationPath = path.join(process.cwd(), "migrations", "0019_fix_orders_product_id_nullable.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    await db.execute(sql.raw(migrationSQL));
    
    console.log("✅ Migration applied successfully!");
    console.log("product_id column in orders table is now nullable");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error applying migration:", error);
    process.exit(1);
  }
}

applyFix();
