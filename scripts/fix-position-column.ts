import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixPositionColumn() {
  try {
    console.log('Fixing position column in supplier_profiles table...');
    
    // Make position column nullable
    await db.execute(sql`
      ALTER TABLE "supplier_profiles" ALTER COLUMN "position" DROP NOT NULL
    `);
    console.log('✅ position column is now nullable');
    
    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPositionColumn();
