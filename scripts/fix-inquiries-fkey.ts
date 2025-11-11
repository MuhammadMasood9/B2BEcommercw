import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixInquiriesForeignKey() {
  console.log("🔧 Fixing inquiries foreign key constraints...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, "../migrations/0015_remove_buyers_fkey.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log("\n✅ Inquiries foreign key constraints fixed successfully!");
    console.log("\nThe buyer_id now correctly references the users table.");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error fixing inquiries foreign key:", error);
    process.exit(1);
  }
}

fixInquiriesForeignKey();
