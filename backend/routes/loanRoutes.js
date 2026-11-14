// ============================================================================
// LOAN ROUTES
// ============================================================================

const express = require('express');
const router = express.Router();
const { getLoans, getLoanSchedule, calculateEmiPreview } = require('../controllers/loanController');

// Live EMI Preview calculation (Stateless)
router.post('/calculate-emi', calculateEmiPreview);

// Sanctioned loans list & individual amortization schedule
router.get('/', getLoans);
router.get('/:id/schedule', getLoanSchedule);

module.exports = router;

