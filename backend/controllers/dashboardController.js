// ============================================================================
// FINANCIAL DASHBOARD CONTROLLER
// ============================================================================
// Purpose: Computes high-level financial KPIs, portfolio risk metrics,
//          and chart aggregation datasets directly from PostgreSQL.
// Strictly conforms to PDF Database Reference Schema.
// ============================================================================

const { query } = require('../config/db');

/**
 * GET /api/dashboard/stats
 * Retrieves top-line KPI cards calculated from real database records.
 */
async function getDashboardStats(req, res, next) {
  try {
    // 1. Total Customers
    const custRes = await query('SELECT COUNT(*) AS total_customers FROM customers;');

    // 2. Application Status Metrics (applications.status)
    const appRes = await query(`
      SELECT 
        COUNT(*) AS total_applications,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) AS approved_applications,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) AS rejected_applications,
        COUNT(CASE WHEN status = 'Under_Review' THEN 1 END) AS under_review_applications,
        COUNT(CASE WHEN status = 'Submitted' THEN 1 END) AS submitted_applications
      FROM applications;
    `);

    // 3. Loan Portfolio Metrics (loans.status, loans.approved_amount, loans.outstanding_principal)
    const loanRes = await query(`
      SELECT 
        COUNT(*) AS total_loans,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_loans,
        COUNT(CASE WHEN status = 'Closed' THEN 1 END) AS closed_loans,
        COUNT(CASE WHEN status = 'Defaulted' THEN 1 END) AS defaulted_loans,
        COALESCE(SUM(approved_amount), 0) AS total_disbursed_amount,
        COALESCE(SUM(outstanding_principal), 0) AS total_outstanding_principal
      FROM loans;
    `);

    // 4. Overdue EMI and Outstanding Principal (emi_schedule.status, emi_schedule.total_emi)
    const overdueRes = await query(`
      SELECT 
        COUNT(*) AS overdue_installments,
        COALESCE(SUM(total_emi), 0) AS overdue_emi_amount
      FROM emi_schedule
      WHERE status = 'Overdue';
    `);

    // 5. Total Repaid Principal
    const paidPrincipalRes = await query(`
      SELECT COALESCE(SUM(principal_amount), 0) AS total_repaid_principal
      FROM emi_schedule
      WHERE status = 'Paid';
    `);

    const totalDisbursed = Number(loanRes.rows[0].total_disbursed_amount);
    const totalRepaidPrincipal = Number(paidPrincipalRes.rows[0].total_repaid_principal);
    
    // If outstanding_principal stored on loans is non-zero, use it; otherwise compute from repaid principal
    let outstandingPrincipal = Number(loanRes.rows[0].total_outstanding_principal);
    if (outstandingPrincipal === 0 && totalDisbursed > 0) {
      outstandingPrincipal = Math.max(0, totalDisbursed - totalRepaidPrincipal);
    }

    res.json({
      success: true,
      data: {
        total_customers: parseInt(custRes.rows[0].total_customers, 10),
        total_applications: parseInt(appRes.rows[0].total_applications, 10),
        approved_applications: parseInt(appRes.rows[0].approved_applications, 10),
        rejected_applications: parseInt(appRes.rows[0].rejected_applications, 10),
        under_review_applications: parseInt(appRes.rows[0].under_review_applications, 10),
        submitted_applications: parseInt(appRes.rows[0].submitted_applications, 10),
        total_loans: parseInt(loanRes.rows[0].total_loans, 10),
        active_loans: parseInt(loanRes.rows[0].active_loans, 10),
        closed_loans: parseInt(loanRes.rows[0].closed_loans, 10),
        defaulted_loans: parseInt(loanRes.rows[0].defaulted_loans, 10),
        total_disbursed_amount: totalDisbursed,
        total_outstanding_principal: outstandingPrincipal,
        overdue_emi_amount: Number(overdueRes.rows[0].overdue_emi_amount),
        overdue_installments: parseInt(overdueRes.rows[0].overdue_installments, 10)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/charts
 * Returns datasets structured specifically for Chart.js rendering.
 */
async function getDashboardCharts(req, res, next) {
  try {
    // 1. Monthly Repayment Collection Summary
    const monthlyCollectionRes = await query(`
      SELECT 
        TO_CHAR(payment_date, 'YYYY-Mon') AS month_label,
        DATE_TRUNC('month', payment_date) AS month_order,
        SUM(payment_amount) AS total_collected
      FROM payments
      WHERE payment_status = 'Success'
      GROUP BY month_label, month_order
      ORDER BY month_order ASC
      LIMIT 12;
    `);

    // 2. Loan Distribution by Product Category
    const categoryDistributionRes = await query(`
      SELECT 
        cp.loan_type,
        COUNT(l.loan_id) AS loan_count,
        COALESCE(SUM(l.approved_amount), 0) AS total_volume
      FROM credit_policies cp
      LEFT JOIN applications a ON cp.policy_id = a.policy_id
      LEFT JOIN loans l ON a.application_id = l.application_id
      GROUP BY cp.loan_type
      ORDER BY total_volume DESC;
    `);

    // 3. Delinquency and Loan Statuses
    const loanStatusRes = await query(`
      SELECT 
        status AS loan_status,
        status,
        COUNT(*) AS count
      FROM loans
      GROUP BY status;
    `);

    const portfolioHealthRes = await query(`
      SELECT 
        status,
        COUNT(*) AS installment_count,
        COALESCE(SUM(total_emi), 0) AS total_amount
      FROM emi_schedule
      GROUP BY status;
    `);

    // 4. Branch-Wise Sanction Volume
    const branchSanctionsRes = await query(`
      SELECT 
        b.branch_name,
        b.city,
        COUNT(l.loan_id) AS total_loans_issued,
        COALESCE(SUM(l.approved_amount), 0) AS total_amount_sanctioned,
        COALESCE(SUM(l.approved_amount), 0) AS total_disbursed
      FROM branches b
      LEFT JOIN applications a ON b.branch_id = a.branch_id
      LEFT JOIN loans l ON a.application_id = l.application_id
      GROUP BY b.branch_id, b.branch_name, b.city
      ORDER BY total_amount_sanctioned DESC;
    `);

    res.json({
      success: true,
      data: {
        monthly_collections: monthlyCollectionRes.rows,
        category_distribution: categoryDistributionRes.rows,
        loan_types: categoryDistributionRes.rows,
        portfolio_health: portfolioHealthRes.rows,
        loan_statuses: loanStatusRes.rows,
        branch_sanctions: branchSanctionsRes.rows,
        branch_distribution: branchSanctionsRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/recent
 * Returns the most recent activities for the live feed widget.
 */
async function getRecentActivity(req, res, next) {
  try {
    const recentAppsRes = await query(`
      SELECT 
        a.application_id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        a.loan_type,
        a.requested_amount,
        a.status,
        a.application_date
      FROM applications a
      JOIN customers c ON a.customer_id = c.customer_id
      ORDER BY a.application_date DESC, a.application_id DESC
      LIMIT 5;
    `);

    const recentPaymentsRes = await query(`
      SELECT 
        p.payment_id,
        p.loan_id,
        p.payment_amount,
        p.payment_method,
        p.payment_status,
        p.payment_date,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.loan_id
      JOIN customers c ON l.customer_id = c.customer_id
      ORDER BY p.payment_date DESC
      LIMIT 5;
    `);

    res.json({
      success: true,
      data: {
        recent_applications: recentAppsRes.rows,
        recent_payments: recentPaymentsRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getDashboardCharts,
  getRecentActivity
};
