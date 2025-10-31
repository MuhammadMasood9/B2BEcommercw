import { readFileSync } from 'fs';
import { Pool } from 'pg';
import 'dotenv/config';

async function runCommunicationMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running communication system migration...');
    
    const migrationSQL = readFileSync('migrations/0015_communication_notification_system.sql', 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('Communication system migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runCommunicationMigration();