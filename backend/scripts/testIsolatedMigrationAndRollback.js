// ============================================================================
// COMPREHENSIVE ISOLATED MIGRATION & FULL ROLLBACK VERIFICATION TEST
// ============================================================================
// Purpose: Tests the complete lifecycle on an isolated, in-memory PostgreSQL
//          engine (PGlite) with ZERO operations against the live Neon database:
//          1. Create 13 original tables
//          2. Seed realistic data into all 13 tables
//          3. Execute automated JSON backup
//          4. Execute migrate_to_pdf_schema.sql (9 tables, PDF schema)
//          5. Verify data preservation, mappings, and constraints
//          6. Execute full 13-table restoration from backup
//          7. Verify 100% recovery of schema, foreign keys, and 13 tables
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { PGlite } = require('@electric-sql/pglite');

async function runIsolatedTest() {
  console.log('================================================================');
  console.log('🧪 STARTING ISOLATED POSTGRESQL MIGRATION & ROLLBACK TEST');
  console.log('   (Using PGlite embedded PostgreSQL engine - LIVE DB UNTOUCHED)');
  console.log('================================================================\n');

  const db = new PGlite();

  // Create an adapter mimicking pg.Pool with support for multi-statement SQL
  const mockPool = {
    connect: async () => ({
      query: (text, params) => {
        if (!params || params.length === 0) {
          return db.exec(text).then(res => (Array.isArray(res) ? res[res.length - 1] : res));
        }
        return db.query(text, params);
      },
      release: () => {}
    }),
    query: (text, params) => {
      if (!params || params.length === 0) {
        return db.exec(text).then(res => (Array.isArray(res) ? res[res.length - 1] : res));
      }
      return db.query(text, params);
    },
    end: () => {}
  };

  // --------------------------------------------------------------------------
  // STEP 1: INITIALIZE ORIGINAL 13-TABLE SCHEMA
  // --------------------------------------------------------------------------
  console.log('📌 STEP 1: Applying original 13-table schema...');
  const originalSchemaSql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'original_schema.sql'), 'utf8');
  await db.exec(originalSchemaSql);

  const initialTablesRes = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  console.log(`✓ Original public tables (${initialTablesRes.rows.length}):`, initialTablesRes.rows.map(r => r.table_name));
  assert.strictEqual(initialTablesRes.rows.length, 13, 'Must have exactly 13 original tables');

  // --------------------------------------------------------------------------
  // STEP 2: SEED REPRESENTATIVE DATA INTO ALL 13 TABLES
  // --------------------------------------------------------------------------
  console.log('\n📌 STEP 2: Inserting test dataset across all 13 tables...');
  
  // 1. branches
  await db.query(`
    INSERT INTO branches (branch_id, branch_code, branch_name, city, state, pincode, is_active) VALUES
    (1, 'BR-MUM-01', 'Mumbai Fort Branch', 'Mumbai', 'Maharashtra', '400001', TRUE),
    (2, 'BR-DEL-01', 'Delhi CP Branch', 'New Delhi', 'Delhi', '110001', TRUE);
  `);

  // 2. employees
  await db.query(`
    INSERT INTO employees (employee_id, branch_id, first_name, last_name, email, phone, role, hire_date, is_active) VALUES
    (1, 1, 'Rajesh', 'Sharma', 'rajesh@finloan.com', '+91-9820011001', 'Branch Manager', '2020-03-15', TRUE),
    (2, 1, 'Priya', 'Nair', 'priya@finloan.com', '+91-9820011002', 'Loan Officer', '2021-06-10', TRUE);
  `);

  // 3. credit_policies
  await db.query(`
    INSERT INTO credit_policies (policy_id, policy_name, loan_type, min_cibil_score, max_loan_amount, base_interest_rate, max_tenure_months, is_active) VALUES
    (1, 'Home Loan Prime', 'Home', 750, 10000000.00, 8.50, 360, TRUE),
    (2, 'Personal Loan Flexi', 'Personal', 700, 1500000.00, 10.50, 60, TRUE);
  `);

  // 4. customers
  await db.query(`
    INSERT INTO customers (customer_id, pan_number, first_name, last_name, email, phone, date_of_birth, monthly_income, employment_type, cibil_score, city) VALUES
    (1, 'ABCDE1234F', 'Satyam', 'Mishra', 'satyam@example.com', '+91-9820111111', '1992-06-15', 95000.00, 'Salaried', 780, 'Mumbai'),
    (2, 'BCDEF2345G', 'Diya', 'Patel', 'diya@example.com', '+91-9820222222', '1994-09-25', 72000.00, 'Salaried', 740, 'Ahmedabad');
  `);

  // 5. applications
  await db.query(`
    INSERT INTO applications (application_id, customer_id, assigned_officer_id, policy_id, loan_amount_requested, tenure_months, application_status, application_date) VALUES
    (1, 1, 2, 1, 4500000.00, 240, 'Approved', '2023-01-15'),
    (2, 2, 2, 2, 500000.00, 36, 'Approved', '2023-01-20'),
    (3, 1, NULL, 1, 1000000.00, 120, 'Submitted', '2023-02-01');
  `);

  // 6. loans
  await db.query(`
    INSERT INTO loans (loan_id, application_id, customer_id, principal_amount, annual_interest_rate, tenure_months, monthly_emi, loan_status, disbursement_date, maturity_date) VALUES
    (1, 1, 1, 4500000.00, 8.50, 240, 39058.42, 'Active', '2023-01-15', '2043-01-15'),
    (2, 2, 2, 500000.00, 10.50, 36, 16251.22, 'Active', '2023-01-20', '2026-01-20'),
    (3, 3, 1, 100000.00, 12.00, 12, 8884.88, 'Closed', '2022-01-10', '2023-01-10');
  `);

  // 7. disbursements
  await db.query(`
    INSERT INTO disbursements (disbursement_id, loan_id, disbursement_amount, disbursement_date, bank_account_number, ifsc_code, payment_mode, disbursement_status) VALUES
    (1, 1, 4500000.00, '2023-01-15 11:30:00+05:30', '91002003001', 'HDFC0000001', 'RTGS', 'Success'),
    (2, 2, 500000.00, '2023-01-20 14:15:00+05:30', '91002003002', 'HDFC0000001', 'NEFT', 'Success'),
    (3, 3, 100000.00, '2022-01-10 10:00:00+05:30', '91002003003', 'HDFC0000001', 'NEFT', 'Success');
  `);

  // 8. emi_schedule
  // Note:
  // - Installment 4 is marked 'Paid' but has NO corresponding payment transaction (unmatched paid test)
  // - Installment 5 belongs to Closed Loan 3
  await db.query(`
    INSERT INTO emi_schedule (schedule_id, loan_id, installment_number, due_date, principal_component, interest_component, total_installment_amount, payment_status, paid_date) VALUES
    (1, 2, 1, '2023-02-20', 11876.22, 4375.00, 16251.22, 'Paid', '2023-02-19'),
    (2, 2, 2, '2023-03-20', 11980.14, 4271.08, 16251.22, 'Paid', '2023-03-18'),
    (3, 2, 3, '2023-04-20', 12084.97, 4166.25, 16251.22, 'Pending', NULL),
    (4, 1, 1, '2023-02-15', 7183.42, 31875.00, 39058.42, 'Paid', '2023-02-15'),
    (5, 3, 1, '2022-02-10', 8000.00, 884.88, 8884.88, 'Paid', '2022-02-09');
  `);

  // 9. payments
  // Note:
  // - Payment 3 is an unscheduled prepayment (schedule_id IS NULL) of 50,000
  // - Payment 4 is a Failed payment for installment 3 (should NOT be added to paid_amount!)
  // - Payment 5 is a partial payment for installment 5 (4000.00)
  // - Payment 6 is second partial payment for installment 5 (4884.88) -> total 8884.88
  await db.query(`
    INSERT INTO payments (payment_id, loan_id, schedule_id, amount_paid, payment_date, payment_method, payment_status, transaction_reference) VALUES
    (1, 2, 1, 16251.22, '2023-02-19 14:22:00+05:30', 'UPI', 'Success', 'TXN-001'),
    (2, 2, 2, 16251.22, '2023-03-18 10:15:00+05:30', 'NetBanking', 'Success', 'TXN-002'),
    (3, 2, NULL, 50000.00, '2023-03-25 16:00:00+05:30', 'NetBanking', 'Success', 'TXN-PREPAY-001'),
    (4, 2, 3, 16251.22, '2023-04-19 11:00:00+05:30', 'UPI', 'Failed', 'TXN-FAIL-001'),
    (5, 3, 5, 4000.00, '2022-02-08 10:00:00+05:30', 'UPI', 'Success', 'TXN-SPLIT-001'),
    (6, 3, 5, 4884.88, '2022-02-09 12:00:00+05:30', 'UPI', 'Success', 'TXN-SPLIT-002');
  `);

  // 10. users (extra table)
  const userRes = await db.query(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin Teacher', 'teacher@school.com', 'hash_admin123', 'teacher'),
    ('Content Lead', 'editor@school.com', 'hash_editor123', 'editor')
    RETURNING id;
  `);
  const teacherId = userRes.rows[0].id;

  // 11. content_slots (extra table)
  const slotRes = await db.query(`
    INSERT INTO content_slots (subject, teacher_id) VALUES
    ('Mathematics Grade 10', $1)
    RETURNING id;
  `, [teacherId]);
  const slotId = slotRes.rows[0].id;

  // 12. content (extra table)
  const contentRes = await db.query(`
    INSERT INTO content (title, subject, file_url, file_path, file_type, file_size, uploaded_by, status) VALUES
    ('Algebra Lesson 1', 'Mathematics Grade 10', 'https://cdn.example.com/math1.mp4', '/uploads/math1.mp4', 'video/mp4', 10485760, $1, 'approved')
    RETURNING id;
  `, [teacherId]);
  const contentId = contentRes.rows[0].id;

  // 13. content_schedule (extra table)
  await db.query(`
    INSERT INTO content_schedule (content_id, slot_id, rotation_order, duration) VALUES
    ($1, $2, 1, 10);
  `, [contentId, slotId]);

  console.log('✓ Successfully inserted representative records in all 13 tables.');

  // Verify counts
  for (const t of ['branches', 'employees', 'credit_policies', 'customers', 'applications', 'loans', 'disbursements', 'emi_schedule', 'payments', 'users', 'content_slots', 'content', 'content_schedule']) {
    const c = await db.query(`SELECT COUNT(*) as count FROM "${t}";`);
    console.log(`   - Initial count for ${t.padEnd(18)} : ${c.rows[0].count}`);
  }

  // --------------------------------------------------------------------------
  // STEP 3: EXECUTE FULL 13-TABLE BACKUP DUMP
  // --------------------------------------------------------------------------
  console.log('\n📌 STEP 3: Executing pre-migration backup dump (All 13 tables)...');
  const backupTablesRes = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  const backupData = {};
  for (const tbl of backupTablesRes.rows.map(r => r.table_name)) {
    const r = await db.query(`SELECT * FROM "${tbl}";`);
    backupData[tbl] = r.rows;
  }
  const crypto = require('crypto');
  const tempBackupPath = path.join(__dirname, '..', '..', 'database', 'backups', 'test_isolated_backup.json');
  fs.mkdirSync(path.dirname(tempBackupPath), { recursive: true });
  const backupJsonString = JSON.stringify(backupData, null, 2);
  fs.writeFileSync(tempBackupPath, backupJsonString, 'utf8');

  // Compute and write companion .sha256 hash
  const backupHash = crypto.createHash('sha256').update(backupJsonString).digest('hex');
  fs.writeFileSync(`${tempBackupPath}.sha256`, backupHash, 'utf8');

  console.log(`✓ Saved backup file with ${Object.keys(backupData).length} tables into: ${tempBackupPath}`);
  console.log(`✓ Saved companion checksum: ${backupHash}`);

  // --------------------------------------------------------------------------
  // STEP 4: EXECUTE MIGRATION TO PDF SCHEMA (migrate_to_pdf_schema.sql)
  // --------------------------------------------------------------------------
  console.log('\n📌 STEP 4: Executing migrate_to_pdf_schema.sql...');
  const migrationSql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'migrate_to_pdf_schema.sql'), 'utf8');
  await db.exec(migrationSql);
  console.log('✓ Migration executed successfully.');

  // --------------------------------------------------------------------------
  // STEP 5: VERIFY MIGRATION STATE (9 TABLES & CONSTRAINTS)
  // --------------------------------------------------------------------------
  console.log('\n📌 STEP 5: Verifying migrated database state (Exact 9 tables)...');
  const migratedTablesRes = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  const migratedTables = migratedTablesRes.rows.map(r => r.table_name);
  console.log(`Migrated public tables (${migratedTables.length}):`, migratedTables);
  assert.strictEqual(migratedTables.length, 9, 'Must have exactly 9 tables after migration');

  // Verify non-PDF tables dropped
  for (const dropped of ['users', 'content', 'content_slots', 'content_schedule']) {
    assert.strictEqual(migratedTables.includes(dropped), false, `${dropped} must NOT exist`);
  }

  // Verify column renames and mappings
  const custCheck = await db.query('SELECT customer_id, credit_score, pan_number FROM customers WHERE customer_id = 1;');
  assert.strictEqual(custCheck.rows[0].credit_score, 780, 'credit_score must preserve 780');

  const empCheck = await db.query('SELECT employee_id, employee_name, designation FROM employees WHERE employee_id = 1;');
  assert.strictEqual(empCheck.rows[0].employee_name, 'Rajesh Sharma', 'employee_name must be Rajesh Sharma');
  assert.strictEqual(empCheck.rows[0].designation, 'Branch Manager', 'designation must be Branch Manager');

  // Verify Branch Mapping:
  // App 1: Mapped via assigned officer's branch (Stage 1)
  const app1Check = await db.query('SELECT application_id, branch_id, employee_id, requested_amount, status FROM applications WHERE application_id = 1;');
  assert.strictEqual(app1Check.rows[0].branch_id, 1, 'App 1: branch_id must be populated from employee');
  assert.strictEqual(Number(app1Check.rows[0].requested_amount), 4500000.00, 'requested_amount preserved');

  // App 3: Had NULL employee_id, mapped via customer city (Mumbai -> Mumbai branch 1) (Stage 2)
  const app3Check = await db.query('SELECT application_id, branch_id, employee_id FROM applications WHERE application_id = 3;');
  assert.strictEqual(app3Check.rows[0].branch_id, 1, 'App 3: branch_id mapped via customer city without arbitrary fallback');
  assert.strictEqual(app3Check.rows[0].employee_id, null, 'App 3: employee_id remains NULL (per PDF)');

  // Verify Outstanding Principal:
  // Initial 500,000 - (11876.22 + 11980.14) = 476143.64
  // CRUCIAL: Unscheduled prepayment of 50,000 is NOT deducted without verified principal allocation!
  const loanCheck = await db.query('SELECT loan_id, approved_amount, interest_rate, status, outstanding_principal FROM loans WHERE loan_id = 2;');
  assert.strictEqual(Number(loanCheck.rows[0].approved_amount), 500000.00, 'approved_amount preserved');
  assert.strictEqual(Number(loanCheck.rows[0].interest_rate), 10.50, 'interest_rate preserved');
  assert.strictEqual(Number(loanCheck.rows[0].outstanding_principal), 476143.64, 'outstanding_principal derived strictly from confirmed principal, unscheduled prepayment NOT guessed');

  // Verify Paid Amount in emi_schedule:
  // Installment 1: Matched to payment 1 (16251.22)
  const emi1Check = await db.query('SELECT emi_id, principal_amount, total_emi, paid_amount, status FROM emi_schedule WHERE emi_id = 1;');
  assert.strictEqual(Number(emi1Check.rows[0].principal_amount), 11876.22, 'principal_amount preserved');
  assert.strictEqual(Number(emi1Check.rows[0].paid_amount), 16251.22, 'paid_amount derived from actual payment record');

  // Installment 4: Marked 'Paid' but NO payment record exists.
  // CRUCIAL: paid_amount must be 0.00, NOT total_emi (no invented values!)
  const emi4Check = await db.query('SELECT emi_id, principal_amount, total_emi, paid_amount, status FROM emi_schedule WHERE emi_id = 4;');
  assert.strictEqual(Number(emi4Check.rows[0].paid_amount), 0.00, 'CRUCIAL: Unmatched Paid EMI must NOT fall back to total_emi (ledger preserved at 0.00)');

  // Installment 3: Had a Failed payment (Payment 4 of 16251.22)
  const emi3Check = await db.query('SELECT emi_id, paid_amount, status FROM emi_schedule WHERE emi_id = 3;');
  assert.strictEqual(Number(emi3Check.rows[0].paid_amount), 0.00, 'Failed payment must NOT be credited to paid_amount');

  // Installment 5: Had two split successful payments (4000.00 + 4884.88)
  const emi5Check = await db.query('SELECT emi_id, paid_amount FROM emi_schedule WHERE emi_id = 5;');
  assert.strictEqual(Number(emi5Check.rows[0].paid_amount), 8884.88, 'Split successful payments must sum correctly into paid_amount');

  // Closed Loan check: Loan 3
  const loan3Check = await db.query('SELECT loan_id, status, outstanding_principal FROM loans WHERE loan_id = 3;');
  assert.strictEqual(Number(loan3Check.rows[0].outstanding_principal), 0.00, 'Closed loan outstanding_principal must strictly be 0.00');

  // Verify Audit Queries:
  // Audit 1: Unmatched Paid EMIs detected
  const unmatchedEmis = await db.query('SELECT emi_id, loan_id, installment_number, total_emi, paid_amount FROM emi_schedule WHERE status = \'Paid\' AND paid_amount = 0;');
  assert.strictEqual(unmatchedEmis.rows.length, 1, 'Must detect exactly 1 unmatched Paid EMI (Installment 4)');
  console.log('✓ Successfully flagged unmatched Paid EMI for separate reporting:', unmatchedEmis.rows[0]);

  // Audit 2: Unallocated Prepayments detected
  const prepayments = await db.query('SELECT payment_id, loan_id, payment_amount, emi_id FROM payments WHERE emi_id IS NULL AND payment_status = \'Success\';');
  assert.strictEqual(prepayments.rows.length, 1, 'Must detect exactly 1 unallocated prepayment (Payment 3)');
  console.log('✓ Successfully flagged unallocated prepayment for underwriter review:', prepayments.rows[0]);

  const payCheck = await db.query('SELECT payment_id, emi_id, payment_amount, transaction_reference FROM payments WHERE payment_id = 1;');
  assert.strictEqual(payCheck.rows[0].emi_id, 1, 'emi_id mapped from schedule_id');
  assert.strictEqual(Number(payCheck.rows[0].payment_amount), 16251.22, 'payment_amount mapped from amount_paid');

  const disbCheck = await db.query('SELECT disbursement_id, transaction_reference FROM disbursements WHERE disbursement_id = 1;');
  assert.strictEqual(disbCheck.rows[0].transaction_reference, 'DSB-REF-000001', 'transaction_reference generated and unique');

  console.log('✓ All 9 tables, renamed columns, financial values, edge cases, and audit checks verified successfully.');

  // --------------------------------------------------------------------------
  // STEP 5b: TEST CHECKSUM TAMPERING DETECTION & RESTORE SAFETY GUARD
  // --------------------------------------------------------------------------
  console.log('\n📌 STEP 5b: Testing Checksum Tampering Guard...');
  const fakeShaPath = `${tempBackupPath}.sha256`;
  const originalSha = fs.readFileSync(fakeShaPath, 'utf8');
  fs.writeFileSync(fakeShaPath, '0000000000000000000000000000000000000000000000000000000000000000', 'utf8');
  
  let checksumErrorCaught = false;
  const { restoreDatabase } = require('./restore');
  try {
    await restoreDatabase(tempBackupPath, mockPool, true);
  } catch (err) {
    if (err.message.includes('SHA-256 checksum mismatch')) {
      checksumErrorCaught = true;
    }
  }
  assert.strictEqual(checksumErrorCaught, true, 'Restore MUST abort on SHA-256 checksum mismatch');
  console.log('✓ Checksum tampering correctly detected and restoration aborted.');
  // Restore genuine checksum
  fs.writeFileSync(fakeShaPath, originalSha, 'utf8');

  // --------------------------------------------------------------------------
  // STEP 6: EXECUTE FULL 13-TABLE DATABASE RESTORATION
  // --------------------------------------------------------------------------
  console.log('\n📌 STEP 6: Executing full 13-table restoration from JSON backup...');
  await restoreDatabase(tempBackupPath, mockPool, true);

  // --------------------------------------------------------------------------
  // STEP 7: VERIFY FULL RESTORATION STATE (ALL 13 TABLES RECOVERED)
  // --------------------------------------------------------------------------
  console.log('\n📌 STEP 7: Verifying restored state (All 13 tables & extra tables)...');
  const restoredTablesRes = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  const restoredTables = restoredTablesRes.rows.map(r => r.table_name);
  console.log(`Restored public tables (${restoredTables.length}):`, restoredTables);
  assert.strictEqual(restoredTables.length, 13, 'Must have exactly 13 tables after restoration');

  // Verify 4 extra tables recovered
  const userRestoreCheck = await db.query('SELECT COUNT(*) as count FROM users;');
  assert.strictEqual(parseInt(userRestoreCheck.rows[0].count, 10), 2, '2 users restored');

  const slotRestoreCheck = await db.query('SELECT COUNT(*) as count FROM content_slots;');
  assert.strictEqual(parseInt(slotRestoreCheck.rows[0].count, 10), 1, '1 slot restored');

  const contentRestoreCheck = await db.query('SELECT COUNT(*) as count FROM content;');
  assert.strictEqual(parseInt(contentRestoreCheck.rows[0].count, 10), 1, '1 content restored');

  const schedRestoreCheck = await db.query('SELECT COUNT(*) as count FROM content_schedule;');
  assert.strictEqual(parseInt(schedRestoreCheck.rows[0].count, 10), 1, '1 schedule restored');

  // Verify foreign key integrity between extra tables
  const userContentJoin = await db.query(`
    SELECT c.title, u.email, s.subject
    FROM content c
    JOIN users u ON c.uploaded_by = u.id
    JOIN content_schedule cs ON cs.content_id = c.id
    JOIN content_slots s ON cs.slot_id = s.id;
  `);
  assert.strictEqual(userContentJoin.rows.length, 1, 'Extra table relations intact');
  console.log('✓ Extra tables (users, content, content_slots, content_schedule) relational integrity intact:');
  console.table(userContentJoin.rows);

  // Verify loan tables restored to original column names
  const custRollback = await db.query('SELECT customer_id, cibil_score FROM customers WHERE customer_id = 1;');
  assert.strictEqual(custRollback.rows[0].cibil_score, 780, 'cibil_score restored');

  const loanRollback = await db.query('SELECT loan_id, principal_amount, monthly_emi FROM loans WHERE loan_id = 2;');
  assert.strictEqual(Number(loanRollback.rows[0].principal_amount), 500000.00, 'principal_amount restored');
  assert.strictEqual(Number(loanRollback.rows[0].monthly_emi), 16251.22, 'monthly_emi restored');

  // Clean up temporary test backup
  if (fs.existsSync(tempBackupPath)) fs.unlinkSync(tempBackupPath);
  if (fs.existsSync(`${tempBackupPath}.sha256`)) fs.unlinkSync(`${tempBackupPath}.sha256`);

  console.log('\n================================================================');
  console.log('🎉 ISOLATED TEST COMPLETE: 100% SUCCESSFUL MIGRATION & ROLLBACK!');
  console.log('================================================================\n');
}

runIsolatedTest().catch(err => {
  console.error('❌ ISOLATED TEST FAILED:', err);
  process.exit(1);
});
