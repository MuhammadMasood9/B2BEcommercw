import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function runFixMigration() {
  try {
    console.log('Running conversations schema fix migration...');
    
    // Add columns one by one
    console.log('Adding admin_id column...');
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "admin_id" varchar`);
    
    console.log('Adding supplier_id column...');
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "supplier_id" varchar`);
    
    console.log('Adding type column...');
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'buyer_supplier'`);
    
    console.log('Adding unread count columns...');
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_buyer" integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_supplier" integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unread_count_admin" integer DEFAULT 0`);
    
    console.log('Adding message columns...');
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message" text`);
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message_at" timestamp`);
    
    console.log('Adding product_id column...');
    await db.execute(sql`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "product_id" varchar`);
    
    console.log('Updating existing conversations...');
    await db.execute(sql`UPDATE "conversations" SET "type" = 'buyer_supplier' WHERE "type" IS NULL OR "type" = ''`);
    
    console.log('Adding messages table columns...');
    await db.execute(sql`ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "receiver_id" varchar`);
    await db.execute(sql`ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender_type" text DEFAULT 'buyer'`);
    
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "conversations_admin_id_idx" ON "conversations" ("admin_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "conversations_supplier_id_idx" ON "conversations" ("supplier_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "conversations_product_id_idx" ON "conversations" ("product_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "conversations_type_idx" ON "conversations" ("type")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" ("last_message_at" DESC)`);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runFixMigration();