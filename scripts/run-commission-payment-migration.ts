import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  try {
    console.log("Running commission payment system migration...");
    
    const migrationPath = path.join(process.cwd(), "migrations", "0017_commission_payment_system_simple.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    // Remove comments and split properly
    const cleanSQL = migrationSQL
      .split("\n")
      .filter(line => !line.trim().startsWith("--") && !line.trim().startsWith("COMMENT"))
      .join("\n");
    
    // Execute the entire migration as one transaction
    console.log("Executing migration...");
    await db.execute(sql.raw(cleanSQL));
    
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
