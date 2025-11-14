const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read the migration file
const migrationPath = path.join(__dirname, 'migrations', '0023_fix_conversations_schema_direct.sql');

console.log('Running migration: 0023_fix_conversations_schema_direct.sql');

// Execute the migration using psql with file input
try {
  execSync(`psql "${process.env.DATABASE_URL}" -f "${migrationPath}"`, { 
    stdio: 'inherit',
    env: process.env 
  });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}