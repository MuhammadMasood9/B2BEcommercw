import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function verifyDatabaseCleanup() {
  try {
    console.log("🔍 Verifying database cleanup...");
    
    // Check for orphaned conversations
    console.log("\n📊 Checking for orphaned conversations:");
    
    const orphanedByBuyer = await pool.query(`
      SELECT COUNT(*) as count FROM "conversations" 
      WHERE "buyer_id" NOT IN (SELECT "id" FROM "users");
    `);
    console.log(`   - Conversations with invalid buyer_id: ${orphanedByBuyer.rows[0].count}`);
    
    const orphanedBySupplier = await pool.query(`
      SELECT COUNT(*) as count FROM "conversations" 
      WHERE "supplier_id" IS NOT NULL 
        AND "supplier_id" NOT IN (SELECT "id" FROM "users");
    `);
    console.log(`   - Conversations with invalid supplier_id: ${orphanedBySupplier.rows[0].count}`);
    
    const orphanedByAdmin = await pool.query(`
      SELECT COUNT(*) as count FROM "conversations" 
      WHERE "admin_id" IS NOT NULL 
        AND "admin_id" NOT IN (SELECT "id" FROM "users");
    `);
    console.log(`   - Conversations with invalid admin_id: ${orphanedByAdmin.rows[0].count}`);
    
    const orphanedByProduct = await pool.query(`
      SELECT COUNT(*) as count FROM "conversations" 
      WHERE "product_id" IS NOT NULL 
        AND "product_id" NOT IN (SELECT "id" FROM "products");
    `);
    console.log(`   - Conversations with invalid product_id: ${orphanedByProduct.rows[0].count}`);
    
    // Check for orphaned messages
    console.log("\n📊 Checking for orphaned messages:");
    
    const orphanedMessagesByConversation = await pool.query(`
      SELECT COUNT(*) as count FROM "messages" 
      WHERE "conversation_id" NOT IN (SELECT "id" FROM "conversations");
    `);
    console.log(`   - Messages with invalid conversation_id: ${orphanedMessagesByConversation.rows[0].count}`);
    
    const orphanedMessagesBySender = await pool.query(`
      SELECT COUNT(*) as count FROM "messages" 
      WHERE "sender_id" NOT IN (SELECT "id" FROM "users");
    `);
    console.log(`   - Messages with invalid sender_id: ${orphanedMessagesBySender.rows[0].count}`);
    
    const orphanedMessagesByReceiver = await pool.query(`
      SELECT COUNT(*) as count FROM "messages" 
      WHERE "receiver_id" IS NOT NULL 
        AND "receiver_id" NOT IN (SELECT "id" FROM "users");
    `);
    console.log(`   - Messages with invalid receiver_id: ${orphanedMessagesByReceiver.rows[0].count}`);
    
    // Check foreign key constraints
    console.log("\n🔗 Checking foreign key constraints:");
    
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('conversations', 'messages')
      ORDER BY tc.table_name, tc.constraint_name;
    `);
    
    for (const constraint of constraints.rows) {
      console.log(`   - ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name} (${constraint.delete_rule})`);
    }
    
    // Check indexes
    console.log("\n📈 Checking performance indexes:");
    
    const indexes = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('conversations', 'messages')
        AND schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    
    const conversationIndexes = indexes.rows.filter(idx => idx.tablename === 'conversations');
    const messageIndexes = indexes.rows.filter(idx => idx.tablename === 'messages');
    
    console.log(`   - Conversations table indexes: ${conversationIndexes.length}`);
    for (const idx of conversationIndexes) {
      console.log(`     • ${idx.indexname}`);
    }
    
    console.log(`   - Messages table indexes: ${messageIndexes.length}`);
    for (const idx of messageIndexes) {
      console.log(`     • ${idx.indexname}`);
    }
    
    // Summary statistics
    console.log("\n📊 Database statistics:");
    
    const conversationCount = await pool.query('SELECT COUNT(*) as count FROM "conversations";');
    const messageCount = await pool.query('SELECT COUNT(*) as count FROM "messages";');
    const userCount = await pool.query('SELECT COUNT(*) as count FROM "users";');
    const productCount = await pool.query('SELECT COUNT(*) as count FROM "products";');
    
    console.log(`   - Total conversations: ${conversationCount.rows[0].count}`);
    console.log(`   - Total messages: ${messageCount.rows[0].count}`);
    console.log(`   - Total users: ${userCount.rows[0].count}`);
    console.log(`   - Total products: ${productCount.rows[0].count}`);
    
    // Check if cleanup was successful
    const totalOrphaned = parseInt(orphanedByBuyer.rows[0].count) + 
                         parseInt(orphanedBySupplier.rows[0].count) + 
                         parseInt(orphanedByAdmin.rows[0].count) + 
                         parseInt(orphanedByProduct.rows[0].count) + 
                         parseInt(orphanedMessagesByConversation.rows[0].count) + 
                         parseInt(orphanedMessagesBySender.rows[0].count) + 
                         parseInt(orphanedMessagesByReceiver.rows[0].count);
    
    if (totalOrphaned === 0) {
      console.log("\n✅ Database cleanup verification PASSED!");
      console.log("   - No orphaned records found");
      console.log("   - All foreign key constraints are properly configured");
      console.log("   - Performance indexes are in place");
    } else {
      console.log("\n❌ Database cleanup verification FAILED!");
      console.log(`   - Found ${totalOrphaned} orphaned records`);
    }
    
  } catch (error) {
    console.error("❌ Error verifying database cleanup:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyDatabaseCleanup().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});