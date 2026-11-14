// ============================================================================
// DATABASE INITIALIZATION & MIGRATION RUNNER
// ============================================================================
// Purpose: Automatically executes schema.sql and seed.sql against the target
//          PostgreSQL / Neon database and runs comprehensive verification.
// Usage: node backend/scripts/initDb.js
// ============================================================================

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  console.log('------------------------------------------------------------');
  console.log('🚀 STARTING NEON POSTGRESQL INITIALIZATION & SEEDING (PDF SCHEMA)');
  console.log('------------------------------------------------------------');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    console.error('❌ ERROR: DATABASE_URL is not set in backend/.env');
    console.error('👉 Please update backend/.env with your Neon connection string:');
    console.error('   DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require\n');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // Step 1: Read SQL files
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const seedPath = path.join(__dirname, '..', '..', 'database', 'seed.sql');

    console.log(`📖 Reading schema file: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`📖 Reading seed file: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    // Step 2: Execute Schema
    console.log('\n⚙️  Applying Database Schema (Tables, Constraints, Indexes)...');
    await client.query(schemaSql);
    console.log('✅ Schema applied successfully! All 9 tables ready.');

    // Step 3: Execute Seed
    console.log('\n🌱 Ingesting Realistic Financial Seed Data...');
    await client.query(seedSql);
    console.log('✅ Seed data inserted successfully!');

    // Step 4: Verification & Table Auditing
    console.log('\n🔍 VERIFYING ALL 9 TABLES & RECORD COUNTS:');
    console.log('============================================================');

    const tables = [
      'branches',
      'employees',
      'credit_policies',
      'customers',
      'applications',
      'loans',
      'disbursements',
      'emi_schedule',
      'payments'
    ];

    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) AS count FROM "${table}";`);
      console.log(`  📊 ${table.padEnd(18)} : ${res.rows[0].count} records`);
    }

    // Step 5: Test Key Joins & Integrity
    console.log('\n🔗 RUNNING RELATIONAL INTEGRITY VERIFICATION (PDF RELATIONSHIPS):');
    console.log('------------------------------------------------------------');

    // 1. Applications with Customer, Branch, Employee, and Policy
    const joinTest1 = await client.query(`
      SELECT 
        a.application_id, 
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        b.branch_name,
        COALESCE(e.employee_name, 'Unassigned') AS officer_name,
        cp.policy_name,
        a.requested_amount,
        a.status
      FROM applications a
      JOIN customers c ON a.customer_id = c.customer_id
      JOIN branches b ON a.branch_id = b.branch_id
      LEFT JOIN employees e ON a.employee_id = e.employee_id
      JOIN credit_policies cp ON a.policy_id = cp.policy_id
      LIMIT 3;
    `);
    console.log('  ✓ Applications -> Customers -> Branches -> Employees -> Policies Join verified:');
    console.table(joinTest1.rows);

    // 2. Loans with EMI schedule and Payments
    const joinTest2 = await client.query(`
      SELECT 
        l.loan_id, 
        l.approved_amount, 
        l.status,
        COUNT(DISTINCT e.emi_id) AS scheduled_installments,
        COUNT(DISTINCT p.payment_id) AS repayments_count
      FROM loans l
      LEFT JOIN emi_schedule e ON l.loan_id = e.loan_id
      LEFT JOIN payments p ON l.loan_id = p.loan_id
      GROUP BY l.loan_id, l.approved_amount, l.status
      LIMIT 3;
    `);
    console.log('  ✓ Loans -> EMI Schedule -> Payments Join verified:');
    console.table(joinTest2.rows);

    console.log('\n============================================================');
    console.log('🎉 NEON DATABASE VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('❌ DATABASE INITIALIZATION ERROR:', err.message);
    if (err.detail) console.error('🔍 Detail:', err.detail);
    if (err.hint) console.error('💡 Hint:', err.hint);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
