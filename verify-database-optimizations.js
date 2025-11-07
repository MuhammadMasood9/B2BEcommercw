import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyOptimizations() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying Database Optimizations...\n');
    
    // Check if key indexes exist
    console.log('📊 Checking Indexes:');
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE 'idx_auth_audit%' OR
          indexname LIKE 'idx_users_%' OR
          indexname LIKE 'idx_password_history%' OR
          indexname LIKE 'idx_token_blacklist%' OR
          indexname LIKE 'idx_user_sessions%' OR
          indexname LIKE 'idx_staff_members%' OR
          indexname LIKE 'idx_supplier_profiles%' OR
          indexname LIKE 'idx_products_%' OR
          indexname LIKE 'idx_orders_%' OR
          indexname LIKE 'idx_conversations%' OR
          indexname LIKE 'idx_notifications%'
        )
      ORDER BY tablename, indexname
    `;
    
    const indexResult = await client.query(indexQuery);
    console.log(`  ✓ Found ${indexResult.rows.length} performance indexes`);
    
    // Group by table
    const indexesByTable = {};
    indexResult.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    
    console.log('\n  Indexes by table:');
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`    ${table}: ${indexes.length} indexes`);
    });
    
    // Check table statistics
    console.log('\n📈 Checking Table Statistics:');
    const statsQuery = `
      SELECT 
        schemaname,
        relname as tablename,
        n_live_tup as row_count,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND relname IN (
          'users', 'authentication_audit_logs', 'password_history',
          'token_blacklist', 'user_sessions', 'supplier_profiles',
          'staff_members', 'products', 'orders'
        )
      ORDER BY relname
    `;
    
    const statsResult = await client.query(statsQuery);
    console.log(`  ✓ Statistics available for ${statsResult.rows.length} key tables`);
    
    statsResult.rows.forEach(row => {
      const analyzed = row.last_analyze || row.last_autoanalyze;
      const status = analyzed ? '✓' : '⚠';
      console.log(`    ${status} ${row.tablename}: ${row.row_count} rows`);
    });
    
    // Check for full-text search indexes
    console.log('\n🔍 Checking Full-Text Search Indexes:');
    const ftsQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE '%_search'
      ORDER BY tablename
    `;
    
    const ftsResult = await client.query(ftsQuery);
    if (ftsResult.rows.length > 0) {
      console.log(`  ✓ Found ${ftsResult.rows.length} full-text search indexes`);
      ftsResult.rows.forEach(row => {
        console.log(`    - ${row.tablename}.${row.indexname}`);
      });
    } else {
      console.log('  ⚠ No full-text search indexes found');
    }
    
    // Check database size
    console.log('\n💾 Database Size:');
    const sizeQuery = `
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as connections
    `;
    
    const sizeResult = await client.query(sizeQuery);
    console.log(`  Database Size: ${sizeResult.rows[0].db_size}`);
    console.log(`  Active Connections: ${sizeResult.rows[0].connections}`);
    
    // Check connection pool settings
    console.log('\n🔌 Connection Pool Configuration:');
    const poolQuery = `
      SELECT 
        name,
        setting,
        unit
      FROM pg_settings
      WHERE name IN (
        'max_connections',
        'shared_buffers',
        'effective_cache_size',
        'work_mem',
        'maintenance_work_mem'
      )
      ORDER BY name
    `;
    
    const poolResult = await client.query(poolQuery);
    poolResult.rows.forEach(row => {
      const value = row.unit ? `${row.setting}${row.unit}` : row.setting;
      console.log(`  ${row.name}: ${value}`);
    });
    
    console.log('\n✅ Database optimization verification complete!');
    console.log('\n📝 Summary:');
    console.log(`  - ${indexResult.rows.length} performance indexes created`);
    console.log(`  - ${statsResult.rows.length} key tables analyzed`);
    console.log(`  - ${ftsResult.rows.length} full-text search indexes`);
    console.log(`  - Database size: ${sizeResult.rows[0].db_size}`);
    console.log(`  - Active connections: ${sizeResult.rows[0].connections}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

verifyOptimizations();
