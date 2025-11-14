import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  try {
    console.log('=== Checking Commissions Table Schema ===');
    
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'commissions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCommissions table columns:');
    console.table(result.rows);
    
    // Check if paid_at exists
    const hasPaidAt = result.rows.some((row: any) => row.column_name === 'paid_at');
    
    if (hasPaidAt) {
      console.log('\n❌ ERROR: paid_at column still exists in database!');
      console.log('Run the migration: npx tsx scripts/run-migration-0026.ts');
    } else {
      console.log('\n✅ Good: paid_at column does not exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
