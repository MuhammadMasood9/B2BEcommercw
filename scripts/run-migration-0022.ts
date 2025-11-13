import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('Running migration 0023_fix_conversations_schema_direct...');
    
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '0023_fix_conversations_schema_direct.sql'),
      'utf-8'
    );

    // Execute the entire migration as one transaction
    try {
      await client.query(migrationSQL);
    } catch (error: any) {
      console.error(`Error executing migration:`);
      console.error(error.message);
      throw error;
    }
    
    console.log('✓ Migration completed successfully!');
    
    // Verify the changes
    console.log('\nVerifying schema changes...');
    
    const conversationsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'conversations'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nConversations table columns:');
    console.table(conversationsColumns.rows);
    
    const messagesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nMessages table columns:');
    console.table(messagesColumns.rows);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
