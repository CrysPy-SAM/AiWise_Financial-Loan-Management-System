// ============================================================================
// APPLICATION ROUTES
// ============================================================================

const express = require('express');
const router = express.Router();
const {
  getApplications,
  createApplication,
  getCreditPolicies,
  getBranches
} = require('../controllers/applicationController');
const { validateApplication } = require('../middleware/validation');

// Policy & Branch endpoints
router.get('/policies', getCreditPolicies);
router.get('/branches', getBranches);

// Application list & submission
router.get('/', getApplications);
router.post('/', validateApplication, createApplication);

module.exports = router;
