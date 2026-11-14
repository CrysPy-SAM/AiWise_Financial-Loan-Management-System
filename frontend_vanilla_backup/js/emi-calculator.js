// ============================================================================
// CLIENT-SIDE LIVE EMI CALCULATOR & FINANCIAL ENGINE
// ============================================================================
// Purpose: Enables instantaneous client-side calculations as the user types
//          or moves sliders, without incurring network latency.
// ============================================================================

/**
 * Calculates reducing balance EMI:
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 */
function computeClientEMI(principal, annualRate, tenureMonths) {
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
 */
function formatCurrencyINR(amount) {
  if (isNaN(amount) || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Make accessible to all page scripts
window.FinancialMath = {
  computeClientEMI,
  formatCurrencyINR
};

