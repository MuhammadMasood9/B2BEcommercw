import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkColumn() {
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'approval_status'
    `);
    
    console.log('Query result:', result);
    
    if (result.rows && result.rows.length > 0) {
      console.log('✅ Column approval_status EXISTS in products table');
    } else {
      console.log('❌ Column approval_status DOES NOT EXIST in products table');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking column:', error);
    process.exit(1);
  }
}

checkColumn();
