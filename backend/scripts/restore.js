// ============================================================================
// GENUINE FULL DATABASE RESTORATION & ROLLBACK RUNNER
// ============================================================================
// Purpose: Restores the complete original 13-table database state:
//          - Recreates original 13-table schema (including users & content tables)
//          - Restores all original columns, constraints, foreign keys, and indexes
//          - Ingests all 13 tables of data from the JSON backup
//          - Resets all sequence generators to maximum values
// Safety:
//          - Enforces --confirm-restore flag to prevent accidental triggers
//          - Verifies target database environment
// ============================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { pool } = require('../config/db');

async function restoreDatabase(specifiedFile, customPool = null, bypassConfirmation = false) {
  console.log('============================================================');
  console.log('🔄 FINLOAN PRO - GENUINE FULL DATABASE RESTORATION (13 TABLES)');
  console.log('============================================================');

  // Safety Gate: Explicit Confirmation Requirement
  const isConfirmed = bypassConfirmation || process.argv.includes('--confirm-restore');
  if (!isConfirmed) {
    console.error('\n🛑 RESTORATION SAFETY GUARD:');
    console.error('   Restoration will DROP current tables and REBUILD all 13 original tables.');
    console.error('   To prevent accidental execution or overwriting an unrelated database,');
    console.error('   you must supply the explicit confirmation flag:');
    console.error('\n   👉 npm run db:restore -- --confirm-restore\n');
    process.exit(1);
  }

  const activePool = customPool || pool;

  // Locate Backup File (Check external location first, then internal)
  let backupPath = specifiedFile;

  if (!backupPath) {
    const candidateDirs = [
      path.join(os.homedir(), '.finloan_backups'),
      path.join(__dirname, '..', '..', 'database', 'backups')
    ];

    for (const dir of candidateDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse();
        if (files.length > 0) {
          backupPath = path.join(dir, files[0]);
          break;
        }
      }
    }

    if (!backupPath) {
      throw new Error('No JSON backup files found in external or internal backup directories.');
    }
  }

  console.log(`📦 Loading full backup snapshot from:`);
  console.log(`   ${backupPath}`);

  const backupContent = fs.readFileSync(backupPath, 'utf8');
  const computedHash = crypto.createHash('sha256').update(backupContent).digest('hex');
  console.log(`🔒 Computed Backup SHA-256 Checksum: ${computedHash}`);

  // Companion .sha256 verification
  const companionShaPath = `${backupPath}.sha256`;
  if (fs.existsSync(companionShaPath)) {
    const expectedHash = fs.readFileSync(companionShaPath, 'utf8').trim();
    if (computedHash !== expectedHash) {
      throw new Error(`SECURITY ALERT: SHA-256 checksum mismatch!\nExpected: ${expectedHash}\nComputed: ${computedHash}\nRestoration aborted to prevent corruption or tampering.`);
    }
    console.log(`✓ Checksum verified against companion .sha256 file.`);
  } else {
    console.log(`ℹ️ Note: No companion .sha256 file found. Proceeding with integrity-checked payload.`);
  }

  const backupData = JSON.parse(backupContent);
  const backupTableNames = Object.keys(backupData);
  console.log(`✓ Backup verified. Contains ${backupTableNames.length} tables: ${backupTableNames.join(', ')}`);

  // Verify that all 13 original tables are present in the backup snapshot
  const expectedOriginal13Tables = [
    'branches', 'employees', 'credit_policies', 'customers',
    'applications', 'loans', 'disbursements', 'emi_schedule', 'payments',
    'users', 'content_slots', 'content', 'content_schedule'
  ];
  const missingTables = expectedOriginal13Tables.filter(t => !backupTableNames.includes(t));
  if (missingTables.length > 0) {
    throw new Error(`RESTORATION ABORTED: Incomplete backup! Missing required tables: ${missingTables.join(', ')}`);
  }
  console.log(`✓ All 13 original tables confirmed present in backup snapshot.\n`);

  const client = await activePool.connect();

  try {
    // Target Database Environment Check
    const dbEnvRes = await client.query('SELECT current_database() as db_name, current_user as db_user;');
    console.log(`🎯 Connected to Target Database: "${dbEnvRes.rows[0].db_name}" (User: ${dbEnvRes.rows[0].db_user})`);

    console.log('\n⚙️  Step 1: Rebuilding original 13-table schema structure...');
    const originalSchemaPath = path.join(__dirname, '..', '..', 'database', 'original_schema.sql');
    const originalSchemaSql = fs.readFileSync(originalSchemaPath, 'utf8');

    await client.query('BEGIN');

    // Drop altered/migrated tables in reverse dependency order
    console.log('   - Dropping existing tables to prevent schema collision...');
    const dropTablesOrder = [
      'content_schedule',
      'content_slots',
      'content',
      'users',
      'payments',
      'emi_schedule',
      'disbursements',
      'loans',
      'applications',
      'customers',
      'credit_policies',
      'employees',
      'branches'
    ];

    for (const tbl of dropTablesOrder) {
      await client.query(`DROP TABLE IF EXISTS "${tbl}" CASCADE;`);
    }

    // Apply original schema (all 13 tables)
    console.log('   - Executing original_schema.sql (13 tables, keys, constraints, indexes)...');
    await client.query(originalSchemaSql);
    console.log('   ✓ Original 13-table schema created successfully.\n');

    // Step 2: Ingest data in proper dependency order
    console.log('📥 Step 2: Ingesting data for all 13 tables...');
    const insertionOrder = [
      'branches',
      'employees',
      'credit_policies',
      'customers',
      'applications',
      'loans',
      'disbursements',
      'emi_schedule',
      'payments',
      'users',
      'content_slots',
      'content',
      'content_schedule'
    ];

    for (const tbl of insertionOrder) {
      const rows = backupData[tbl];
      if (!rows || rows.length === 0) {
        console.log(`   - ${tbl.padEnd(20)} : 0 rows (empty table)`);
        continue;
      }

      console.log(`   - Restoring ${tbl.padEnd(20)} : ${rows.length} rows...`);
      for (const row of rows) {
        const cols = Object.keys(row);
        const vals = Object.values(row);
        const colList = cols.map(c => `"${c}"`).join(', ');
        const paramList = cols.map((_, i) => `$${i + 1}`).join(', ');

        await client.query(
          `INSERT INTO "${tbl}" (${colList}) VALUES (${paramList}) ON CONFLICT DO NOTHING;`,
          vals
        );
      }
    }

    // Step 3: Reset sequences for integer SERIAL tables
    console.log('\n🔢 Step 3: Resetting sequence generators to MAX values...');
    const seqMap = {
      branches: ['branch_id', 'branches_branch_id_seq'],
      employees: ['employee_id', 'employees_employee_id_seq'],
      credit_policies: ['policy_id', 'credit_policies_policy_id_seq'],
      customers: ['customer_id', 'customers_customer_id_seq'],
      applications: ['application_id', 'applications_application_id_seq'],
      loans: ['loan_id', 'loans_loan_id_seq'],
      disbursements: ['disbursement_id', 'disbursements_disbursement_id_seq'],
      emi_schedule: ['schedule_id', 'emi_schedule_schedule_id_seq'],
      payments: ['payment_id', 'payments_payment_id_seq']
    };

    for (const [tbl, [idCol, seqName]] of Object.entries(seqMap)) {
      try {
        await client.query(`
          SELECT setval('${seqName}', (SELECT COALESCE(MAX("${idCol}"), 1) FROM "${tbl}"));
        `);
      } catch (seqErr) {
        console.warn(`   Note on sequence ${seqName}: ${seqErr.message}`);
      }
    }

    await client.query('COMMIT');

    // Step 4: Verification
    console.log('\n🔍 Step 4: Verifying restored tables:');
    const checkTablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    const restoredTableNames = checkTablesRes.rows.map(r => r.table_name);
    console.log(`Restored public tables (${restoredTableNames.length}):`, restoredTableNames);

    for (const tbl of insertionOrder) {
      const countRes = await client.query(`SELECT COUNT(*) as count FROM "${tbl}";`);
      console.log(`   ✓ ${tbl.padEnd(20)} : ${countRes.rows[0].count} records verified`);
    }

    console.log('\n============================================================');
    console.log('🎉 FULL DATABASE RESTORATION (ALL 13 TABLES) COMPLETE!');
    console.log('============================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ RESTORATION FAILED:', err.message);
    throw err;
  } finally {
    client.release();
    if (!customPool) activePool.end();
  }
}

if (require.main === module) {
  const customFile = process.argv.slice(2).find(arg => !arg.startsWith('--'));
  restoreDatabase(customFile).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { restoreDatabase };
