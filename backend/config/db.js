// ============================================================================
// DATABASE CONNECTION POOL MODULE (PostgreSQL / Neon Cloud)
// ============================================================================
// Purpose: Manages a pool of reusable connections to PostgreSQL.
// Benefits of Connection Pooling:
//   1. Instead of creating a heavy TCP handshake on every incoming API request,
//      a pool maintains active connections ready to execute queries instantly.
//   2. Automatically throttles maximum concurrent connections to prevent
//      overwhelming the cloud database server.
// ============================================================================

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

// Determine if connection string requires SSL (Standard requirement for Neon Cloud)
const isNeonCloud = connectionString && (connectionString.includes('neon.tech') || connectionString.includes('sslmode=require'));

// Initialize pg.Pool with enterprise production configurations
const pool = new Pool({
  connectionString: connectionString,
  ssl: isNeonCloud ? { rejectUnauthorized: false } : false,
  max: 10,                      // Maximum 10 concurrent clients in the pool
  idleTimeoutMillis: 30000,     // Close idle clients after 30 seconds
  connectionTimeoutMillis: 30000 // Allow up to 30s for serverless Neon compute cold-starts
});

// Event listener: Triggered when a new database client is spawned
pool.on('connect', () => {
  // Connection successfully established
});

// Event listener: Catch unexpected idle client errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Standardized query helper with execution timing and error logging.
 * @param {string} text - SQL query string with parameterized placeholders ($1, $2)
 * @param {Array} params - Array of parameter values for SQL injection prevention
 * @returns {Promise<object>} pg query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      // Helpful debug output during learning
      // console.log(`Executed query: ${text.substring(0, 60)}... [${duration}ms, ${res.rowCount} rows]`);
    }
    return res;
  } catch (error) {
    console.error('Database Query Error:', {
      query: text,
      message: error.message,
      detail: error.detail || 'None'
    });
    throw error;
  }
};

module.exports = {
  pool,
  query
};

