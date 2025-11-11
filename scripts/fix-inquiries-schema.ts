import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixInquiriesSchema() {
  console.log("🔧 Fixing inquiries table schema...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, "../migrations/0014_verify_inquiries_schema.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log("\n✅ Inquiries table schema verified and fixed successfully!");
    console.log("\nYou can now create inquiries without errors.");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error fixing inquiries schema:", error);
    process.exit(1);
  }
}

fixInquiriesSchema();
