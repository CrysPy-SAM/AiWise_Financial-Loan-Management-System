// ============================================================================
// DATABASE CONNECTIVITY TEST SCRIPT
// ============================================================================
// Purpose: Probes connection to PostgreSQL / Neon Cloud, prints server version,
//          SSL status, and active database name.
// Usage: node backend/scripts/testConnection.js
// ============================================================================

const { pool } = require('../config/db');

async function testConnection() {
  console.log('Testing connection to PostgreSQL / Neon database...');
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to database pool!');

    const res = await client.query('SELECT version(), current_database(), current_user, NOW() as server_time;');
    const row = res.rows[0];

    console.log('\n--- CONNECTION METADATA ---');
    console.log('Database Name :', row.current_database);
    console.log('Connected User:', row.current_user);
    console.log('Server Time   :', row.server_time);
    console.log('PostgreSQL Ver:', row.version.split(',')[0]);
    console.log('---------------------------\n');

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    await pool.end();
    process.exit(1);
  }
}

testConnection();

