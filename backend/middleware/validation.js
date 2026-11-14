// ============================================================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================================================
// Purpose: Validates incoming request payloads BEFORE hitting the database.
//          Saves database connection overhead and prevents malformed data.
//          Conforms to PDF Schema field names with backward-compatible aliases.
// ============================================================================

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates loan application submission data
 */
const validateApplication = (req, res, next) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    pan_number,
    date_of_birth,
    monthly_income,
    employment_type,
    credit_score,
    cibil_score, // backward compatibility
    city,
    branch_id,
    policy_id,
    requested_amount,
    loan_amount_requested, // backward compatibility
    requested_tenure_months,
    tenure_months // backward compatibility
  } = req.body;

  const errors = [];

  // Required Field Checks
  if (!first_name || first_name.trim().length < 2) errors.push('First name is required (min 2 characters).');
  if (!last_name || last_name.trim().length < 1) errors.push('Last name is required.');
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.push('A valid email address is required.');
  if (!phone || phone.trim().length < 10) errors.push('A valid phone number is required.');

  // PAN Check (Indian 10-character alphanumeric)
  if (!pan_number || !PAN_REGEX.test(pan_number.trim().toUpperCase())) {
    errors.push('Invalid PAN format. Must be 5 uppercase letters, 4 numbers, and 1 uppercase letter (e.g. ABCDE1234F).');
  }

  // Financial Metrics Checks
  const income = parseFloat(monthly_income);
  if (isNaN(income) || income <= 0) {
    errors.push('Monthly income must be a positive numerical value.');
  }

  const scoreVal = credit_score !== undefined ? credit_score : cibil_score;
  const score = parseInt(scoreVal, 10);
  if (isNaN(score) || score < 300 || score > 900) {
    errors.push('Credit score must be an integer between 300 and 900.');
  }

  const amountVal = requested_amount !== undefined ? requested_amount : loan_amount_requested;
  const amount = parseFloat(amountVal);
  if (isNaN(amount) || amount < 10000) {
    errors.push('Requested loan amount must be at least ₹10,000.');
  }

  const tenureVal = requested_tenure_months !== undefined ? requested_tenure_months : tenure_months;
  const tenure = parseInt(tenureVal, 10);
  if (isNaN(tenure) || tenure < 6 || tenure > 360) {
    errors.push('Tenure must be between 6 and 360 months.');
  }

  if (!policy_id) {
    errors.push('A valid credit policy must be selected.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      messages: errors
    });
  }

  next();
};

module.exports = {
  validateApplication
};
