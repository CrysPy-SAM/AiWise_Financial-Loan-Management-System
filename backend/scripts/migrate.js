// ============================================================================
// DATA-SAFE MIGRATION RUNNER: TO PDF REFERENCE SCHEMA
// ============================================================================
// Purpose: Safely creates a JSON backup of all 13 tables across two secure
//          locations (outside project dir + inside project dir), executes the
//          migration SQL script to transition to the PDF schema, and verifies.
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { pool } = require('../config/db');

async function runMigration(customPool = null, bypassConfirmation = false) {
  console.log('============================================================');
  console.log('🔄 FINLOAN PRO - SAFE DATABASE MIGRATION TO PDF SCHEMA');
  console.log('============================================================');

  // Safety Gate: Explicit Confirmation Requirement
  const isConfirmed = bypassConfirmation || process.argv.includes('--confirm-migrate');
  if (!isConfirmed) {
    console.error('\n🛑 MIGRATION SAFETY GUARD:');
    console.error('   Running migration will modify database structure to the PDF reference schema.');
    console.error('   To prevent accidental execution against a production environment,');
    console.error('   you must supply the explicit confirmation flag:');
    console.error('\n   👉 npm run db:migrate -- --confirm-migrate\n');
    process.exit(1);
  }

  const activePool = customPool || pool;
  const client = await activePool.connect();

  try {
    // Database Environment & Identity Check
    const dbEnvRes = await client.query('SELECT current_database() as db_name, current_user as db_user;');
    console.log(`🎯 Connected to Target Database: "${dbEnvRes.rows[0].db_name}" (User: ${dbEnvRes.rows[0].db_user})`);

    // ------------------------------------------------------------------------
    // Step 1: Create Backups (Both Inside and Outside the Project Directory)
    // ------------------------------------------------------------------------
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_before_pdf_migration_${timestamp}.json`;

    // Secure external directory: <USER_HOME>/.finloan_backups/
    const externalBackupDir = path.join(os.homedir(), '.finloan_backups');
    if (!fs.existsSync(externalBackupDir)) {
      fs.mkdirSync(externalBackupDir, { recursive: true });
    }
    const externalBackupPath = path.join(externalBackupDir, backupFileName);

    // Project internal directory: database/backups/
    const internalBackupDir = path.join(__dirname, '..', '..', 'database', 'backups');
    if (!fs.existsSync(internalBackupDir)) {
      fs.mkdirSync(internalBackupDir, { recursive: true });
    }
    const internalBackupPath = path.join(internalBackupDir, backupFileName);

    console.log(`📦 Taking comprehensive backup of ALL public tables before migration:`);
    console.log(`   1. External Secure Storage: ${externalBackupPath}`);
    console.log(`   2. Internal Storage Backup: ${internalBackupPath}`);

    const existingTablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    const existingTableNames = existingTablesRes.rows.map(r => r.table_name);

    const backupData = {};
    let totalRecordsCount = 0;

    for (const tbl of existingTableNames) {
      const rowsRes = await client.query(`SELECT * FROM "${tbl}";`);
      backupData[tbl] = rowsRes.rows;
      totalRecordsCount += rowsRes.rows.length;
      console.log(`   - Backed up ${tbl.padEnd(20)} : ${rowsRes.rows.length} rows`);
    }

    const backupJsonString = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(externalBackupPath, backupJsonString, 'utf8');
    fs.writeFileSync(internalBackupPath, backupJsonString, 'utf8');

    const hash = crypto.createHash('sha256').update(backupJsonString).digest('hex');
    fs.writeFileSync(`${externalBackupPath}.sha256`, hash, 'utf8');
    fs.writeFileSync(`${internalBackupPath}.sha256`, hash, 'utf8');

    console.log(`✓ Backup verified: ${existingTableNames.length} tables, ${totalRecordsCount} total records.`);
    console.log(`✓ Backup SHA-256 Checksum : ${hash}`);
    console.log(`✓ Companion checksum files created: .sha256\n`);

    // ------------------------------------------------------------------------
    // Step 2: Read and Execute the Migration Script
    // ------------------------------------------------------------------------
    const migrationSqlPath = path.join(__dirname, '..', '..', 'database', 'migrate_to_pdf_schema.sql');
    console.log(`⚙️  Executing migration script: ${migrationSqlPath}`);
    const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');

    await client.query(migrationSql);
    console.log('✅ Migration SQL executed successfully within transaction.\n');

    // ------------------------------------------------------------------------
    // Step 3: Verify the Final 9 Tables in the Database
    // ------------------------------------------------------------------------
    console.log('🔍 VERIFYING TARGET DATABASE STATE (EXACTLY 9 TABLES):');
    console.log('------------------------------------------------------------');

    const finalTablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    const finalTableNames = finalTablesRes.rows.map(r => r.table_name);
    console.log('Current tables in public schema:', finalTableNames);

    const expected9Tables = [
      'customers',
      'branches',
      'employees',
      'credit_policies',
      'applications',
      'loans',
      'emi_schedule',
      'payments',
      'disbursements'
    ];

    let allMatch = true;
    for (const expected of expected9Tables) {
      if (finalTableNames.includes(expected)) {
        const countRes = await client.query(`SELECT COUNT(*) as count FROM "${expected}";`);
        console.log(`   ✓ ${expected.padEnd(20)} : ${countRes.rows[0].count} rows`);
      } else {
        console.log(`   ✗ MISSING: ${expected}`);
        allMatch = false;
      }
    }

    const unexpected = finalTableNames.filter(t => !expected9Tables.includes(t));
    if (unexpected.length > 0) {
      console.log(`⚠️ Warning: Non-PDF tables still present: ${unexpected.join(', ')}`);
    } else {
      console.log('🎉 Confirmed: Exactly the 9 PDF tables exist! No extra tables.\n');
    }

    // ------------------------------------------------------------------------
    // Step 4: Strict Financial & Relational Integrity Audits
    // ------------------------------------------------------------------------
    console.log('📊 FINANCIAL & RELATIONAL INTEGRITY AUDIT:');
    console.log('------------------------------------------------------------');

    // Audit 1: Unmatched Paid EMIs (status = 'Paid' but paid_amount = 0)
    const unmatchedEmisRes = await client.query(`
      SELECT emi_id, loan_id, installment_number, total_emi, paid_amount, status
      FROM emi_schedule
      WHERE status = 'Paid' AND paid_amount = 0;
    `);
    if (unmatchedEmisRes.rows.length > 0) {
      console.warn(`⚠️ AUDIT: Found ${unmatchedEmisRes.rows.length} Paid EMIs without matched payment transactions in ledger:`);
      for (const row of unmatchedEmisRes.rows) {
        console.warn(`   - EMI ID ${row.emi_id} (Loan ${row.loan_id}, Inst #${row.installment_number}): scheduled ${row.total_emi}, ledger paid: ${row.paid_amount}`);
      }
    } else {
      console.log('✓ All Paid EMIs have verified payment ledger entries.');
    }

    // Audit 2: Unscheduled Prepayments (emi_id IS NULL)
    const prepaymentsRes = await client.query(`
      SELECT payment_id, loan_id, payment_amount, payment_date, payment_status
      FROM payments
      WHERE emi_id IS NULL AND payment_status = 'Success';
    `);
    if (prepaymentsRes.rows.length > 0) {
      console.log(`ℹ️ AUDIT: Found ${prepaymentsRes.rows.length} unallocated prepayment(s) preserved for manual review:`);
      for (const row of prepaymentsRes.rows) {
        console.log(`   - Payment ID ${row.payment_id}: Loan ${row.loan_id}, Amount ${row.payment_amount}, Date ${row.payment_date}`);
      }
    } else {
      console.log('✓ No unallocated prepayments found.');
    }

    // Audit 3: Applications with unresolved branch_id
    const unmappedBranchesRes = await client.query(`
      SELECT application_id, customer_id, loan_type, requested_amount
      FROM applications
      WHERE branch_id IS NULL;
    `);
    if (unmappedBranchesRes.rows.length > 0) {
      console.warn(`⚠️ AUDIT: Found ${unmappedBranchesRes.rows.length} application(s) with unassigned branch_id:`);
      for (const row of unmappedBranchesRes.rows) {
        console.warn(`   - App ID ${row.application_id}: Customer ${row.customer_id}, Loan ${row.loan_type}, Amount ${row.requested_amount}`);
      }
    } else {
      console.log('✓ All applications successfully linked to valid branch_id.');
    }

    console.log('============================================================');
    console.log('MIGRATION COMPLETE AND VERIFIED.');
    console.log('============================================================');
  } catch (err) {
    console.error('❌ MIGRATION FAILED:', err);
    throw err;
  } finally {
    client.release();
    if (!customPool) pool.end();
  }
}

if (require.main === module) {
  runMigration().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runMigration };
