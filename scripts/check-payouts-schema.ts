import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  try {
    console.log('=== Checking Payouts Table Schema ===');
    
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'payouts'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nPayouts table columns:');
    console.table(result.rows);
    
    // Check if commission_deducted exists
    const hasCommissionDeducted = result.rows.some((row: any) => row.column_name === 'commission_deducted');
    
    if (!hasCommissionDeducted) {
      console.log('\n❌ ERROR: commission_deducted column is missing!');
      console.log('Need to add this column via migration');
    } else {
      console.log('\n✅ Good: commission_deducted column exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
