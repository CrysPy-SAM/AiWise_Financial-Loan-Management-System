// ============================================================================
// CENTRALIZED ERROR HANDLING MIDDLEWARE
// ============================================================================
// Purpose: Catches any unhandled exceptions thrown across controllers/services
//          and standardizes the JSON response payload.
// ============================================================================

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  // PostgreSQL Specific Error Codes
  // 23505: Unique constraint violation (e.g., duplicate PAN, duplicate email)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Record Violation',
      message: err.detail || 'A record with this unique identifier already exists.'
    });
  }

  // 23503: Foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Foreign Key Violation',
      message: 'Referenced entity does not exist.'
    });
  }

  // 23514: Check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Check Constraint Violation',
      message: 'The submitted data violated business validation rules (e.g. invalid PAN format or negative monetary value).'
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected server error occurred.'
  });
};

module.exports = errorHandler;

