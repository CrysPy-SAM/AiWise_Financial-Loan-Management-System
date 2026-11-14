// ============================================================================
// FINANCIAL MATH & FORMATTING UTILITIES
// ============================================================================
// Purpose: Reducing-balance EMI math, currency & date formatters, and DTI logic.
// Strictly matches the formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
// ============================================================================

/**
 * Calculates reducing balance EMI:
 * @param {number|string} principal - Loan amount (P)
 * @param {number|string} annualRate - Annual interest rate in percent (e.g., 10.5)
 * @param {number|string} tenureMonths - Tenure in months (n)
 * @returns {{ monthly_emi: number, total_payable: number, total_interest: number }}
 */
export function computeClientEMI(principal, annualRate, tenureMonths) {
  const P = parseFloat(principal);
  const annual = parseFloat(annualRate);
  const n = parseInt(tenureMonths, 10);

  if (isNaN(P) || isNaN(annual) || isNaN(n) || P <= 0 || n <= 0) {
    return {
      monthly_emi: 0,
      total_payable: 0,
      total_interest: 0
    };
  }

  if (annual <= 0) {
    const emi = Number((P / n).toFixed(2));
    return {
      monthly_emi: emi,
      total_payable: P,
      total_interest: 0
    };
  }

  // Monthly fractional interest rate (r)
  const r = (annual / 12) / 100;

  // Factor = (1 + r)^n
  const factor = Math.pow(1 + r, n);

  // EMI = P * r * factor / (factor - 1)
  const emi = (P * r * factor) / (factor - 1);
  const totalPayable = emi * n;
  const totalInterest = totalPayable - P;

  return {
    monthly_emi: Number(emi.toFixed(2)),
    total_payable: Number(totalPayable.toFixed(2)),
    total_interest: Number(totalInterest.toFixed(2))
  };
}

/**
 * Formats numbers into Indian Currency format (e.g. ₹5,00,000)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrencyINR(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Formats numbers into Indian Locale (e.g. 5,00,000)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatNumberINR(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || amount === null || amount === undefined) return '0';
  return num.toLocaleString('en-IN');
}

/**
 * Formats ISO date to readable Indian format (e.g. 15 Jan 2024 or 15 Jan)
 * @param {string|Date} dateStr
 * @param {boolean} includeYear
 * @returns {string}
 */
export function formatDateINR(dateStr, includeYear = true) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {})
  });
}

/**
 * Indian PAN Validation Regex (5 uppercase letters, 4 digits, 1 uppercase letter)
 */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function validatePAN(pan) {
  if (!pan) return false;
  return PAN_REGEX.test(pan.trim().toUpperCase());
}

/**
 * Evaluates Debt-To-Income (DTI) ratio based on monthly income and projected EMI.
 * @param {number} monthlyIncome
 * @param {number} monthlyEMI
 * @returns {{ ratio: number, isSafe: boolean, statusText: string, message: string }}
 */
export function evaluateDTI(monthlyIncome, monthlyEMI) {
  const income = parseFloat(monthlyIncome) || 0;
  const emi = parseFloat(monthlyEMI) || 0;

  if (income <= 0 || emi <= 0) {
    return {
      ratio: 0,
      isSafe: true,
      statusText: 'Safe',
      message: 'Enter your monthly income to assess credit affordability.'
    };
  }

  const ratio = parseFloat(((emi / income) * 100).toFixed(1));
  const isSafe = ratio <= 50;

  return {
    ratio,
    isSafe,
    statusText: isSafe ? 'Safe' : 'High Risk',
    message: isSafe
      ? `Projected EMI is ${ratio}% of monthly income, well within the recommended 50% threshold.`
      : `Warning: Projected EMI exceeds 50% of your declared income (${ratio}%). Risk of underwriting rejection.`
  };
}
