// ============================================================================
// APPLICATION CONTROLLER
// ============================================================================
// Purpose: Handles HTTP requests for loan applications and credit policies.
// Strictly conforms to PDF Database Reference Schema:
//   - applications (customer_id, branch_id, employee_id, policy_id, loan_type,
//                   requested_amount, requested_tenure_months, purpose,
//                   application_date, status, rejection_reason)
//   - credit_policies (minimum_income, minimum_credit_score, minimum_interest_rate,
//                      maximum_loan_amount, maximum_tenure_months)
//   - customers (credit_score, pan_number, monthly_income, ...)
//   - loans (approved_amount, interest_rate, tenure_months, loan_start_date, loan_end_date, status, outstanding_principal)
// ============================================================================

const { query, pool } = require('../config/db');
const { calculateEMI } = require('../services/emiService');

/**
 * GET /api/applications
 * Returns applications with customer, branch, employee, and policy details.
 */
async function getApplications(req, res, next) {
  try {
    const { status, limit = 50 } = req.query;

    let sql = `
      SELECT 
        a.application_id,
        a.customer_id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.pan_number,
        c.credit_score,
        c.credit_score AS cibil_score, -- UI backwards compatibility
        c.monthly_income,
        cp.policy_id,
        cp.policy_name,
        a.loan_type,
        cp.minimum_interest_rate AS base_interest_rate,
        a.requested_amount,
        a.requested_amount AS loan_amount_requested, -- UI backwards compatibility
        a.requested_tenure_months,
        a.requested_tenure_months AS tenure_months, -- UI backwards compatibility
        a.purpose,
        a.status,
        a.status AS application_status, -- UI backwards compatibility
        a.rejection_reason,
        a.application_date,
        b.branch_id,
        b.branch_name,
        b.city AS branch_city,
        e.employee_id,
        COALESCE(e.employee_name, 'Unassigned') AS assigned_officer
      FROM applications a
      INNER JOIN customers c ON a.customer_id = c.customer_id
      INNER JOIN branches b ON a.branch_id = b.branch_id
      LEFT JOIN employees e ON a.employee_id = e.employee_id
      INNER JOIN credit_policies cp ON a.policy_id = cp.policy_id
    `;

    const params = [];
    if (status) {
      params.push(status);
      sql += ` WHERE a.status = $1`;
    }

    sql += ` ORDER BY a.application_date DESC, a.application_id DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const result = await query(sql, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/applications
 * Submits a new loan application. Atomic database transaction with customer lookup,
 * policy underwriting appraisal, application creation, and loan provisioning.
 */
async function createApplication(req, res, next) {
  const client = await pool.connect();

  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      pan_number,
      date_of_birth,
      gender,
      address,
      state,
      pincode,
      monthly_income,
      employment_type,
      credit_score,
      cibil_score,
      city,
      branch_id,
      policy_id,
      requested_amount,
      loan_amount_requested,
      requested_tenure_months,
      tenure_months,
      purpose
    } = req.body;

    const formattedPan = pan_number.trim().toUpperCase();
    const finalCreditScore = parseInt(credit_score !== undefined ? credit_score : cibil_score, 10);
    const finalAmount = parseFloat(requested_amount !== undefined ? requested_amount : loan_amount_requested);
    const finalTenure = parseInt(requested_tenure_months !== undefined ? requested_tenure_months : tenure_months, 10);

    // Step 1: Fetch and evaluate Credit Policy
    const policyRes = await client.query(
      `SELECT * FROM credit_policies WHERE policy_id = $1 AND is_active = TRUE`,
      [policy_id]
    );

    if (policyRes.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        error: 'Credit policy not found or inactive.'
      });
    }

    const policy = policyRes.rows[0];

    // Underwriting Rules
    let status = 'Approved';
    let rejectionReason = null;

    if (finalCreditScore < policy.minimum_credit_score) {
      status = 'Rejected';
      rejectionReason = `Credit score ${finalCreditScore} is below minimum requirement of ${policy.minimum_credit_score}.`;
    } else if (finalAmount > Number(policy.maximum_loan_amount)) {
      status = 'Rejected';
      rejectionReason = `Requested amount ₹${finalAmount.toLocaleString('en-IN')} exceeds policy limit of ₹${Number(policy.maximum_loan_amount).toLocaleString('en-IN')}.`;
    } else if (finalTenure > policy.maximum_tenure_months) {
      status = 'Rejected';
      rejectionReason = `Requested tenure ${finalTenure} months exceeds policy cap of ${policy.maximum_tenure_months} months.`;
    } else if (Number(monthly_income) < Number(policy.minimum_income)) {
      status = 'Rejected';
      rejectionReason = `Monthly income ₹${monthly_income} is below minimum policy threshold of ₹${policy.minimum_income}.`;
    } else {
      // DTI check
      const projectedEMI = calculateEMI(finalAmount, policy.minimum_interest_rate, finalTenure);
      const dtiRatio = (projectedEMI / Number(monthly_income)) * 100;
      if (dtiRatio > 55) {
        status = 'Under_Review'; // Flagged for manual underwriting
      }
    }

    // Begin Atomic Transaction
    await client.query('BEGIN');

    // Step 2: Customer Upsert / Lookup
    let customerId;
    const existingCust = await client.query(
      `SELECT customer_id FROM customers WHERE pan_number = $1`,
      [formattedPan]
    );

    if (existingCust.rows.length > 0) {
      customerId = existingCust.rows[0].customer_id;
      await client.query(
        `UPDATE customers 
         SET monthly_income = $1, credit_score = $2, phone = $3, city = $4, updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $5`,
        [monthly_income, finalCreditScore, phone, city || 'Mumbai', customerId]
      );
    } else {
      const newCust = await client.query(
        `INSERT INTO customers 
         (first_name, last_name, email, phone, date_of_birth, gender, pan_number, address, city, state, pincode, monthly_income, employment_type, credit_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING customer_id`,
        [
          first_name.trim(),
          last_name.trim(),
          email.trim(),
          phone.trim(),
          date_of_birth || '1992-06-15',
          gender || 'Other',
          formattedPan,
          address || 'Main City Road',
          city || 'Mumbai',
          state || 'Maharashtra',
          pincode || '400001',
          monthly_income,
          employment_type || 'Salaried',
          finalCreditScore
        ]
      );
      customerId = newCust.rows[0].customer_id;
    }

    // Step 3: Determine Branch & Assign Loan Officer (nullable per PDF)
    const effectiveBranchId = parseInt(branch_id, 10) || 1;
    const officerRes = await client.query(
      `SELECT employee_id FROM employees WHERE branch_id = $1 AND designation IN ('Loan Officer', 'Branch Manager') LIMIT 1`,
      [effectiveBranchId]
    );
    const assignedEmployeeId = officerRes.rows.length > 0 ? officerRes.rows[0].employee_id : null;

    // Step 4: Insert Application
    const appRes = await client.query(
      `INSERT INTO applications 
       (customer_id, branch_id, employee_id, policy_id, loan_type, requested_amount, requested_tenure_months, purpose, status, rejection_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        customerId,
        effectiveBranchId,
        assignedEmployeeId,
        policy_id,
        policy.loan_type,
        finalAmount,
        finalTenure,
        purpose || `${policy.loan_type} loan application`,
        status,
        rejectionReason
      ]
    );

    const createdApplication = appRes.rows[0];

    // Step 5: If Approved, Provision Loan & Disbursement
    let createdLoan = null;
    if (status === 'Approved') {
      const emi = calculateEMI(finalAmount, policy.minimum_interest_rate, finalTenure);
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + finalTenure);
      const formattedEndDate = endDate.toISOString().split('T')[0];

      const loanRes = await client.query(
        `INSERT INTO loans 
         (application_id, customer_id, approved_amount, interest_rate, tenure_months, loan_start_date, loan_end_date, status, outstanding_principal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active', $8)
         RETURNING *`,
        [
          createdApplication.application_id,
          customerId,
          finalAmount,
          policy.minimum_interest_rate,
          finalTenure,
          startDate,
          formattedEndDate,
          finalAmount // Initially full amount is outstanding
        ]
      );
      createdLoan = loanRes.rows[0];

      // Step 6: Create Disbursement Record
      const disbTxnRef = `DSB-${Date.now()}-${createdLoan.loan_id}`;
      await client.query(
        `INSERT INTO disbursements 
         (loan_id, disbursement_amount, disbursement_date, transaction_reference, disbursement_status)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 'Success')`,
        [createdLoan.loan_id, finalAmount, disbTxnRef]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Loan application ${status.toLowerCase()} successfully.`,
      application: {
        ...createdApplication,
        application_status: createdApplication.status // UI backwards compatibility
      },
      loan: createdLoan
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

/**
 * GET /api/applications/policies
 * Returns active credit policies for dropdown selectors.
 */
async function getCreditPolicies(req, res, next) {
  try {
    const result = await query(
      `SELECT 
         policy_id, 
         policy_name, 
         loan_type, 
         minimum_income, 
         minimum_credit_score, 
         minimum_credit_score AS min_cibil_score, -- UI backwards compatibility
         minimum_interest_rate AS base_interest_rate, -- UI backwards compatibility
         minimum_interest_rate, 
         maximum_interest_rate, 
         maximum_loan_amount, 
         maximum_loan_amount AS max_loan_amount, -- UI backwards compatibility
         maximum_tenure_months, 
         maximum_tenure_months AS max_tenure_months, -- UI backwards compatibility
         is_active 
       FROM credit_policies 
       WHERE is_active = TRUE 
       ORDER BY policy_id ASC`
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/applications/branches
 * Returns active branches for branch selector dropdowns.
 */
async function getBranches(req, res, next) {
  try {
    const result = await query(
      `SELECT branch_id, branch_name, branch_code, city, state, pincode 
       FROM branches 
       ORDER BY branch_id ASC`
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getApplications,
  createApplication,
  getCreditPolicies,
  getBranches
};
