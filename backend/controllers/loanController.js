// ============================================================================
// LOAN CONTROLLER
// ============================================================================
// Purpose: Handles operations on sanctioned loans, EMI calculations, and schedules.
// Strictly conforms to PDF Database Reference Schema:
//   - loans (loan_id, application_id, customer_id, approved_amount, interest_rate,
//            tenure_months, loan_start_date, loan_end_date, status, outstanding_principal)
//   - emi_schedule (emi_id, loan_id, installment_number, due_date, principal_amount,
//                   interest_amount, total_emi, paid_amount, status, paid_at)
//   - payments (payment_id, loan_id, emi_id, transaction_reference, payment_amount,
//               payment_date, payment_method, payment_status)
// ============================================================================

const { query } = require('../config/db');
const { calculateEMI, generateAmortizationSchedule, evaluateDTI } = require('../services/emiService');

/**
 * GET /api/loans
 * Returns all sanctioned loans with live statuses and customer names.
 */
async function getLoans(req, res, next) {
  try {
    const { status, limit = 50 } = req.query;

    let sql = `
      SELECT 
        l.loan_id,
        l.application_id,
        l.customer_id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.pan_number,
        c.city,
        l.approved_amount,
        l.approved_amount AS principal_amount, -- UI compatibility
        l.interest_rate,
        l.interest_rate AS annual_interest_rate, -- UI compatibility
        l.tenure_months,
        l.status,
        l.status AS loan_status, -- UI compatibility
        l.outstanding_principal,
        l.loan_start_date,
        l.loan_start_date AS disbursement_date, -- UI compatibility
        l.loan_end_date,
        l.loan_end_date AS maturity_date, -- UI compatibility
        a.loan_type,
        b.branch_name,
        b.branch_code
      FROM loans l
      INNER JOIN customers c ON l.customer_id = c.customer_id
      INNER JOIN applications a ON l.application_id = a.application_id
      INNER JOIN branches b ON a.branch_id = b.branch_id
    `;

    const params = [];
    if (status) {
      params.push(status);
      sql += ` WHERE l.status = $1`;
    }

    sql += ` ORDER BY l.loan_id DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const result = await query(sql, params);

    // Compute live monthly EMI for display convenience
    const formattedLoans = result.rows.map(loan => ({
      ...loan,
      monthly_emi: calculateEMI(loan.approved_amount, loan.interest_rate, loan.tenure_months)
    }));

    res.json({
      success: true,
      count: formattedLoans.length,
      data: formattedLoans
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/loans/:id/schedule
 * Retrieves the full amortization payment schedule for a loan.
 */
async function getLoanSchedule(req, res, next) {
  try {
    const { id } = req.params;

    const scheduleRes = await query(
      `SELECT 
         emi_id,
         emi_id AS schedule_id, -- UI compatibility
         loan_id,
         installment_number,
         due_date,
         principal_amount,
         principal_amount AS principal_component, -- UI compatibility
         interest_amount,
         interest_amount AS interest_component, -- UI compatibility
         total_emi,
         total_emi AS total_installment_amount, -- UI compatibility
         paid_amount,
         status,
         status AS payment_status, -- UI compatibility
         paid_at,
         paid_at AS paid_date -- UI compatibility
       FROM emi_schedule
       WHERE loan_id = $1
       ORDER BY installment_number ASC;`,
      [id]
    );

    res.json({
      success: true,
      loan_id: id,
      count: scheduleRes.rows.length,
      data: scheduleRes.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/loans/calculate-emi
 * Stateless endpoint that computes reducing balance EMI and amortization breakdown.
 */
function calculateEmiPreview(req, res) {
  const { principal, annual_interest_rate, tenure_months, monthly_income } = req.body;

  const P = parseFloat(principal);
  const rate = parseFloat(annual_interest_rate);
  const n = parseInt(tenure_months, 10);

  if (isNaN(P) || P <= 0 || isNaN(rate) || rate <= 0 || isNaN(n) || n <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input parameters. Principal, rate, and tenure must be positive numbers.'
    });
  }

  const emi = calculateEMI(P, rate, n);
  const schedule = generateAmortizationSchedule(P, rate, n);

  const totalPayable = Number((emi * n).toFixed(2));
  const totalInterest = Number((totalPayable - P).toFixed(2));

  let dtiEvaluation = null;
  if (monthly_income && parseFloat(monthly_income) > 0) {
    dtiEvaluation = evaluateDTI(monthly_income, emi);
  }

  res.json({
    success: true,
    data: {
      principal: P,
      annual_interest_rate: rate,
      tenure_months: n,
      monthly_emi: emi,
      total_interest: totalInterest,
      total_payable: totalPayable,
      dti: dtiEvaluation,
      schedule
    }
  });
}

module.exports = {
  getLoans,
  getLoanSchedule,
  calculateEmiPreview
};
