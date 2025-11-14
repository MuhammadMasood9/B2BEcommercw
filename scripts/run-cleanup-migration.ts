import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

// Database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function runCleanupMigration() {
  try {
    console.log("🧹 Starting database cleanup migration...");
    
    // Step 1: Remove orphaned conversations
    console.log("📝 Step 1: Removing orphaned conversations...");
    
    await pool.query(`
      DELETE FROM "conversations" 
      WHERE "buyer_id" NOT IN (SELECT "id" FROM "users");
    `);
    
    await pool.query(`
      DELETE FROM "conversations" 
      WHERE "supplier_id" IS NOT NULL 
        AND "supplier_id" NOT IN (SELECT "id" FROM "users");
    `);
    
    await pool.query(`
      DELETE FROM "conversations" 
      WHERE "admin_id" IS NOT NULL 
        AND "admin_id" NOT IN (SELECT "id" FROM "users");
    `);
    
    await pool.query(`
      DELETE FROM "conversations" 
      WHERE "product_id" IS NOT NULL 
        AND "product_id" NOT IN (SELECT "id" FROM "products");
    `);
    
    // Step 2: Remove orphaned messages
    console.log("📝 Step 2: Removing orphaned messages...");
    
    await pool.query(`
      DELETE FROM "messages" 
      WHERE "conversation_id" NOT IN (SELECT "id" FROM "conversations");
    `);
    
    await pool.query(`
      DELETE FROM "messages" 
      WHERE "sender_id" NOT IN (SELECT "id" FROM "users");
    `);
    
    await pool.query(`
      UPDATE "messages" 
      SET "receiver_id" = NULL 
      WHERE "receiver_id" IS NOT NULL 
        AND "receiver_id" NOT IN (SELECT "id" FROM "users");
    `);
    
    // Step 3: Update foreign key constraints
    console.log("📝 Step 3: Updating foreign key constraints...");
    
    // Drop existing constraints
    await pool.query(`
      ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_buyer_id_users_id_fk";
    `);
    
    await pool.query(`
      ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_supplier_id_users_id_fk";
    `);
    
    await pool.query(`
      ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_supplier_id_supplier_profiles_id_fk";
    `);
    
    await pool.query(`
      ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_admin_id_users_id_fk";
    `);
    
    await pool.query(`
      ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_product_id_products_id_fk";
    `);
    
    await pool.query(`
      ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_conversation_id_conversations_id_fk";
    `);
    
    await pool.query(`
      ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_sender_id_users_id_fk";
    `);
    
    await pool.query(`
      ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_receiver_id_users_id_fk";
    `);
    
    // Add new constraints with CASCADE
    await pool.query(`
      ALTER TABLE "conversations" 
      ADD CONSTRAINT "conversations_buyer_id_users_id_fk" 
      FOREIGN KEY ("buyer_id") REFERENCES "users"("id") 
      ON DELETE CASCADE;
    `);
    
    await pool.query(`
      ALTER TABLE "conversations" 
      ADD CONSTRAINT "conversations_supplier_id_users_id_fk" 
      FOREIGN KEY ("supplier_id") REFERENCES "users"("id") 
      ON DELETE CASCADE;
    `);
    
    await pool.query(`
      ALTER TABLE "conversations" 
      ADD CONSTRAINT "conversations_admin_id_users_id_fk" 
      FOREIGN KEY ("admin_id") REFERENCES "users"("id") 
      ON DELETE SET NULL;
    `);
    
    await pool.query(`
      ALTER TABLE "conversations" 
      ADD CONSTRAINT "conversations_product_id_products_id_fk" 
      FOREIGN KEY ("product_id") REFERENCES "products"("id") 
      ON DELETE SET NULL;
    `);
    
    await pool.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" 
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") 
      ON DELETE CASCADE;
    `);
    
    await pool.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "messages_sender_id_users_id_fk" 
      FOREIGN KEY ("sender_id") REFERENCES "users"("id") 
      ON DELETE CASCADE;
    `);
    
    await pool.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "messages_receiver_id_users_id_fk" 
      FOREIGN KEY ("receiver_id") REFERENCES "users"("id") 
      ON DELETE SET NULL;
    `);
    
    // Step 4: Create performance indexes
    console.log("📝 Step 4: Creating performance indexes...");
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "conversations_admin_id_idx" ON "conversations" ("admin_id");',
      'CREATE INDEX IF NOT EXISTS "conversations_buyer_id_idx" ON "conversations" ("buyer_id");',
      'CREATE INDEX IF NOT EXISTS "conversations_supplier_id_idx" ON "conversations" ("supplier_id");',
      'CREATE INDEX IF NOT EXISTS "conversations_product_id_idx" ON "conversations" ("product_id");',
      'CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" ("last_message_at" DESC);',
      'CREATE INDEX IF NOT EXISTS "conversations_type_idx" ON "conversations" ("type");',
      'CREATE INDEX IF NOT EXISTS "conversations_created_at_idx" ON "conversations" ("created_at" DESC);',
      'CREATE INDEX IF NOT EXISTS "conversations_buyer_last_message_idx" ON "conversations" ("buyer_id", "last_message_at" DESC);',
      'CREATE INDEX IF NOT EXISTS "conversations_supplier_last_message_idx" ON "conversations" ("supplier_id", "last_message_at" DESC);',
      'CREATE INDEX IF NOT EXISTS "conversations_admin_last_message_idx" ON "conversations" ("admin_id", "last_message_at" DESC);',
      'CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages" ("conversation_id", "created_at" DESC);',
      'CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" ("sender_id");',
      'CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages" ("receiver_id");',
      'CREATE INDEX IF NOT EXISTS "messages_unread_idx" ON "messages" ("receiver_id", "is_read") WHERE "is_read" = false;',
      'CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages" ("created_at" DESC);',
      'CREATE INDEX IF NOT EXISTS "messages_sender_created_at_idx" ON "messages" ("sender_id", "created_at" DESC);',
      'CREATE INDEX IF NOT EXISTS "messages_conversation_sender_idx" ON "messages" ("conversation_id", "sender_id", "created_at" DESC);'
    ];
    
    for (const indexSQL of indexes) {
      await pool.query(indexSQL);
    }
    
    // Step 5: Update statistics
    console.log("📝 Step 5: Updating database statistics...");
    await pool.query('ANALYZE "conversations";');
    await pool.query('ANALYZE "messages";');
    
    console.log("✅ Database cleanup migration completed successfully!");
    console.log("🔧 The following actions were performed:");
    console.log("   - Removed orphaned conversations with invalid references");
    console.log("   - Cleaned up orphaned messages");
    console.log("   - Updated foreign key constraints with proper CASCADE behavior");
    console.log("   - Created performance indexes for conversations and messages");
    console.log("   - Updated database statistics for query optimization");
    
  } catch (error) {
    console.error("❌ Error running cleanup migration:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
runCleanupMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});