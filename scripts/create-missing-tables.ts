import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createMissingTables() {
  console.log("🔧 Creating missing database tables...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, "../migrations/0016_create_missing_tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log("\n✅ Missing tables created successfully!");
    console.log("\nThe following have been fixed:");
    console.log("  - inquiry_quotations table created");
    console.log("  - quotations_count column added to supplier_profiles");
    console.log("  - Foreign key constraints added");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating missing tables:", error);
    process.exit(1);
  }
}

createMissingTables();
