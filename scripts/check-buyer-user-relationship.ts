import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkRelationship() {
  try {
    const buyerId = '3f9ae933-500b-45e4-8f84-872c909e7799';
    
    console.log(`🔄 Checking buyer/user relationship for ID: ${buyerId}\n`);
    
    // Check in users table
    const userCheck = await db.execute(sql`
      SELECT id, email, role, first_name, last_name
      FROM users 
      WHERE id = ${buyerId}
    `);
    
    console.log('👤 User in users table:');
    if (userCheck.rows.length > 0) {
      console.table(userCheck.rows);
    } else {
      console.log('  ❌ Not found');
    }
    
    // Check in buyers table
    const buyerCheck = await db.execute(sql`
      SELECT id, email, name
      FROM buyers 
      WHERE id = ${buyerId}
    `);
    
    console.log('\n🛒 Buyer in buyers table:');
    if (buyerCheck.rows.length > 0) {
      console.table(buyerCheck.rows);
    } else {
      console.log('  ❌ Not found');
    }
    
    // Check buyers table structure
    const buyersColumns = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'buyers'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Buyers table structure:');
    console.table(buyersColumns.rows);
    
    // Count records in each table
    const usersCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const buyersCount = await db.execute(sql`SELECT COUNT(*) as count FROM buyers`);
    
    console.log('\n📊 Record counts:');
    console.log(`  Users: ${usersCount.rows[0].count}`);
    console.log(`  Buyers: ${buyersCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRelationship().then(() => {
  console.log('\n🎉 Check completed');
  process.exit(0);
});
