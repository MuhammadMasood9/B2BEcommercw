import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    const migrationSQL = readFileSync('migrations/0014_admin_access_control_system.sql', 'utf8');
    await pool.query(migrationSQL);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();