import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('Running security monitoring alerts migration...');
    const migrationSQL = readFileSync('migrations/0022_security_monitoring_alerts.sql', 'utf8');
    await pool.query(migrationSQL);
    console.log('Security monitoring alerts migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();