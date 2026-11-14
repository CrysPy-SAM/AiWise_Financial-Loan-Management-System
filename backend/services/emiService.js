// ============================================================================
// FINANCIAL EMI MATH ENGINE & AMORTIZATION SERVICE
// ============================================================================
// Purpose: Implements industry-standard reducing-balance financial formulas.
//
// EQUAL MONTHLY INSTALLMENT (EMI) FORMULA:
//
//                 P * r * (1 + r)^n
//        EMI = -----------------------
//                  (1 + r)^n - 1
//
// PARAMETER DEFINITIONS:
//   P (Principal)       : Total loan sanctioned amount (e.g. ₹5,00,000)
//   r (Monthly Rate)    : Annual interest rate converted to a monthly fraction:
//                         r = (Annual Rate % / 12) / 100
//                         Example: 10.5% p.a. -> (10.5 / 12) / 100 = 0.00875
//   n (Tenure)          : Total repayment duration in months (e.g. 36 months)
// ============================================================================

/**
 * Calculates monthly EMI using the standard reducing-balance formula.
 * @param {number} principal - Loan amount (P)
 * @param {number} annualRate - Annual interest rate in percent (e.g., 10.5)
 * @param {number} tenureMonths - Tenure in months (n)
 * @returns {number} Monthly installment rounded to 2 decimal places
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  const P = Number(principal);
  const annual = Number(annualRate);
  const n = Number(tenureMonths);

  if (P <= 0 || n <= 0) return 0;
  if (annual <= 0) return Number((P / n).toFixed(2));

  // Convert annual percentage to monthly fractional interest rate (r)
  const r = (annual / 12) / 100;

  // Compute factor (1 + r)^n
  const factor = Math.pow(1 + r, n);

  // EMI = P * r * factor / (factor - 1)
  const emi = (P * r * factor) / (factor - 1);

  return Number(emi.toFixed(2));
}

/**
 * Generates month-by-month reducing balance amortization schedule.
 * Matches column names in PDF schema: principal_amount, interest_amount, total_emi.
 * @param {number} principal - Sanctioned loan amount
 * @param {number} annualRate - Annual interest rate %
 * @param {number} tenureMonths - Total months
 * @param {string|Date} startDate - First installment due date
 * @returns {Array<object>} List of installments with principal & interest breakdown
 */
function generateAmortizationSchedule(principal, annualRate, tenureMonths, startDate = new Date()) {
  const schedule = [];
  const monthlyRate = (annualRate / 12) / 100;
  const emi = calculateEMI(principal, annualRate, tenureMonths);

  let balance = principal;
  let currentDate = new Date(startDate);

  for (let installment = 1; installment <= tenureMonths; installment++) {
    // Interest for the month = Outstanding Balance * monthlyRate
    const interestComponent = Number((balance * monthlyRate).toFixed(2));
    
    // Principal for the month = EMI - InterestComponent
    let principalComponent = Number((emi - interestComponent).toFixed(2));

    // For final installment: adjust principal to wipe out remaining rounding fractions
    if (installment === tenureMonths || balance < principalComponent) {
      principalComponent = balance;
    }

    balance = Number((balance - principalComponent).toFixed(2));
    if (balance < 0) balance = 0;

    // Advance due date by 1 month
    const dueDate = new Date(currentDate);
    dueDate.setMonth(dueDate.getMonth() + installment);

    schedule.push({
      installment_number: installment,
      due_date: dueDate.toISOString().split('T')[0],
      total_emi: Number((principalComponent + interestComponent).toFixed(2)),
      principal_amount: principalComponent,
      interest_amount: interestComponent,
      remaining_balance: balance,
      // Backward compatibility aliases
      total_installment_amount: Number((principalComponent + interestComponent).toFixed(2)),
      principal_component: principalComponent,
      interest_component: interestComponent
    });
  }

  return schedule;
}

/**
 * Evaluates Debt-To-Income (DTI) ratio based on monthly income and projected EMI.
 * @param {number} monthlyIncome - Net monthly income of the applicant
 * @param {number} monthlyEMI - Proposed monthly installment
 * @returns {object} DTI ratio and risk classification
 */
function evaluateDTI(monthlyIncome, monthlyEMI) {
  const income = Number(monthlyIncome);
  const emi = Number(monthlyEMI);

  if (income <= 0) {
    return { dti_ratio: 0, status: 'High Risk', is_eligible: false };
  }

  const dti = Number(((emi / income) * 100).toFixed(2));

  let status = 'Safe';
  let isEligible = true;

  if (dti > 50) {
    status = 'High Risk';
    isEligible = false;
  } else if (dti > 40) {
    status = 'Moderate Risk';
    isEligible = true;
  }

  return {
    dti_ratio: dti,
    status,
    is_eligible: isEligible
  };
}

module.exports = {
  calculateEMI,
  generateAmortizationSchedule,
  evaluateDTI
};
