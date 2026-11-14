// ============================================================================
// LOAN APPLICATION CONTROLLER (Vanilla JavaScript ES6+)
// ============================================================================
// Purpose: Bridges form controls, live calculations, validations, modal,
//          and RESTful persistence with PostgreSQL backend.
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // DOM Elements
  // --------------------------------------------------------------------------
  const form = document.getElementById('loanAppForm');
  const branchSelect = document.getElementById('branchSelect');
  const policySelect = document.getElementById('policySelect');
  const amountSlider = document.getElementById('amountSlider');
  const amountInput = document.getElementById('amountInput');
  const tenureSlider = document.getElementById('tenureSlider');
  const tenureInput = document.getElementById('tenureInput');
  const panInput = document.getElementById('panInput');
  const incomeInput = document.getElementById('incomeInput');
  const cibilInput = document.getElementById('cibilInput');
  
  // EMI Display Box Elements
  const emiDisplay = document.getElementById('emiDisplay');
  const principalDisplay = document.getElementById('principalDisplay');
  const interestDisplay = document.getElementById('interestDisplay');
  const totalPayableDisplay = document.getElementById('totalPayableDisplay');
  const rateHint = document.getElementById('rateHint');
  const dtiBox = document.getElementById('dtiBox');
  const dtiText = document.getElementById('dtiText');

  // Conditional Fields Container
  const conditionalFields = document.getElementById('conditionalFields');

  // Modal Elements
  const confirmModal = document.getElementById('confirmModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  const modalSummaryList = document.getElementById('modalSummaryList');

  // Table & Alerts
  const applicationsTableBody = document.getElementById('applicationsTableBody');
  const alertContainer = document.getElementById('alertContainer');
  const submitBtn = document.getElementById('submitBtn');

  let creditPolicies = [];
  let branches = [];
  let selectedPolicy = null;

  // --------------------------------------------------------------------------
  // 1. Initialize: Fetch Credit Policies, Branches & Application History
  // --------------------------------------------------------------------------
  async function init() {
    await fetchBranches();
    await fetchCreditPolicies();
    await fetchApplicationHistory();
    setupEventListeners();
    updateLiveCalculations();
  }

  async function fetchBranches() {
    if (!branchSelect) return;
    try {
      const response = await window.API.get('/applications/branches');
      if (response.success && response.data.length > 0) {
        branches = response.data;
        branchSelect.innerHTML = '';
        branches.forEach((b) => {
          const opt = document.createElement('option');
          opt.value = b.branch_id;
          opt.textContent = `${b.branch_name} (${b.city})`;
          branchSelect.appendChild(opt);
        });
      }
    } catch (error) {
      console.warn('Could not load branches:', error.message);
    }
  }

  async function fetchCreditPolicies() {
    try {
      const response = await window.API.get('/applications/policies');
      if (response.success && response.data.length > 0) {
        creditPolicies = response.data;
        populatePolicyDropdown(creditPolicies);
      }
    } catch (error) {
      showAlert('danger', 'Unable to load credit policies. Ensure backend server is running.');
    }
  }

  function populatePolicyDropdown(policies) {
    policySelect.innerHTML = '<option value="">-- Choose Loan Product --</option>';
    policies.forEach((policy) => {
      const opt = document.createElement('option');
      opt.value = policy.policy_id;
      opt.textContent = `${policy.policy_name} (${policy.loan_type} - ${policy.base_interest_rate}% p.a.)`;
      policySelect.appendChild(opt);
    });

    // Default select first policy
    if (policies.length > 0) {
      policySelect.value = policies[0].policy_id;
      handlePolicyChange();
    }
  }

  async function fetchApplicationHistory() {
    try {
      const response = await window.API.get('/applications?limit=10');
      if (response.success && response.data) {
        renderTableRows(response.data);
      }
    } catch (error) {
      console.warn('Could not load application history:', error.message);
    }
  }

  function renderTableRows(applications) {
    applicationsTableBody.innerHTML = '';
    if (applications.length === 0) {
      applicationsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 2rem;">No loan applications submitted yet.</td></tr>`;
      return;
    }

    applications.forEach((app) => {
      const row = document.createElement('tr');
      const formattedDate = new Date(app.application_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const statusBadgeClass = getStatusBadgeClass(app.application_status);

      row.innerHTML = `
        <td><strong>#APP-${app.application_id}</strong></td>
        <td>${escapeHtml(app.customer_name)}<br/><span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${app.pan_number}</span></td>
        <td>${escapeHtml(app.loan_type)}</td>
        <td><strong>${window.FinancialMath.formatCurrencyINR(app.loan_amount_requested)}</strong></td>
        <td>${app.tenure_months} mos</td>
        <td><span class="badge ${statusBadgeClass}">${app.application_status}</span></td>
        <td>${formattedDate}</td>
      `;
      applicationsTableBody.appendChild(row);
    });
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Approved': return 'badge-approved';
      case 'Rejected': return 'badge-rejected';
      case 'Under_Review': return 'badge-under-review';
      case 'Submitted': return 'badge-submitted';
      default: return 'badge-active';
    }
  }

  // --------------------------------------------------------------------------
  // 2. Synchronized Controls & Dynamic Fields
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Policy change listener
    policySelect.addEventListener('change', handlePolicyChange);

    // Amount slider & number input synchronization
    amountSlider.addEventListener('input', () => {
      amountInput.value = amountSlider.value;
      updateLiveCalculations();
    });

    amountInput.addEventListener('input', () => {
      amountSlider.value = amountInput.value;
      updateLiveCalculations();
    });

    // Tenure slider & number input synchronization
    tenureSlider.addEventListener('input', () => {
      tenureInput.value = tenureSlider.value;
      updateLiveCalculations();
    });

    tenureInput.addEventListener('input', () => {
      tenureSlider.value = tenureInput.value;
      updateLiveCalculations();
    });

    // Income and CIBIL inputs trigger recalculation & live validation
    incomeInput.addEventListener('input', updateLiveCalculations);
    cibilInput.addEventListener('input', validateCibilField);

    // Live PAN pattern validation
    panInput.addEventListener('input', validatePanField);

    // Form submission triggers review modal
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm()) {
        openConfirmationModal();
      }
    });

    // Modal close controls
    modalCloseBtn.addEventListener('click', closeConfirmationModal);
    modalCancelBtn.addEventListener('click', closeConfirmationModal);
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeConfirmationModal();
    });

    // Final modal confirmation -> API POST
    modalConfirmBtn.addEventListener('click', handleFinalSubmission);
  }

  function handlePolicyChange() {
    const policyId = parseInt(policySelect.value, 10);
    selectedPolicy = creditPolicies.find((p) => p.policy_id === policyId);

    if (selectedPolicy) {
      rateHint.textContent = `Base Rate: ${selectedPolicy.base_interest_rate}% p.a. | Min CIBIL: ${selectedPolicy.min_cibil_score}`;
      
      // Update amount bounds
      amountSlider.max = selectedPolicy.max_loan_amount;
      if (parseFloat(amountInput.value) > selectedPolicy.max_loan_amount) {
        amountInput.value = selectedPolicy.max_loan_amount;
        amountSlider.value = selectedPolicy.max_loan_amount;
      }

      // Update tenure bounds
      tenureSlider.max = selectedPolicy.max_tenure_months;
      if (parseInt(tenureInput.value, 10) > selectedPolicy.max_tenure_months) {
        tenureInput.value = selectedPolicy.max_tenure_months;
        tenureSlider.value = selectedPolicy.max_tenure_months;
      }

      renderConditionalFields(selectedPolicy.loan_type);
      updateLiveCalculations();
    }
  }

  function renderConditionalFields(loanType) {
    conditionalFields.innerHTML = '';
    if (loanType === 'Business') {
      conditionalFields.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">GST Number <span class="required">*</span></label>
            <input type="text" class="form-control" name="gst_number" placeholder="27AAAAA0000A1Z5" required>
          </div>
          <div class="form-group">
            <label class="form-label">Business Vintage (Years) <span class="required">*</span></label>
            <input type="number" class="form-control" name="business_vintage" placeholder="e.g. 5" min="1" required>
          </div>
        </div>
      `;
    } else if (loanType === 'Home') {
      conditionalFields.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Property Value (₹) <span class="required">*</span></label>
            <input type="number" class="form-control" name="property_value" placeholder="e.g. 7500000" min="500000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Property City <span class="required">*</span></label>
            <input type="text" class="form-control" name="property_city" placeholder="e.g. Mumbai" required>
          </div>
        </div>
      `;
    }
  }

  // --------------------------------------------------------------------------
  // 3. Live Calculations & DTI Ratio Check
  // --------------------------------------------------------------------------
  function updateLiveCalculations() {
    const P = parseFloat(amountInput.value) || 0;
    const n = parseInt(tenureInput.value, 10) || 0;
    const rate = selectedPolicy ? selectedPolicy.base_interest_rate : 10.5;

    const calc = window.FinancialMath.computeClientEMI(P, rate, n);

    emiDisplay.textContent = window.FinancialMath.formatCurrencyINR(calc.monthly_emi);
    principalDisplay.textContent = window.FinancialMath.formatCurrencyINR(P);
    interestDisplay.textContent = window.FinancialMath.formatCurrencyINR(calc.total_interest);
    totalPayableDisplay.textContent = window.FinancialMath.formatCurrencyINR(calc.total_payable);

    // Debt to Income Evaluation
    const income = parseFloat(incomeInput.value) || 0;
    if (income > 0 && calc.monthly_emi > 0) {
      const dti = ((calc.monthly_emi / income) * 100).toFixed(1);
      dtiBox.style.display = 'block';
      if (dti <= 50) {
        dtiBox.className = 'dti-gauge-box dti-safe';
        dtiText.innerHTML = `<strong>DTI Ratio: ${dti}% (Safe)</strong><br/>Projected EMI is within recommended 50% income threshold.`;
      } else {
        dtiBox.className = 'dti-gauge-box dti-risk';
        dtiText.innerHTML = `<strong>DTI Ratio: ${dti}% (High Risk)</strong><br/>Projected EMI exceeds 50% of monthly income. Requires manual underwriter review.`;
      }
    } else {
      dtiBox.style.display = 'none';
    }
  }

  // --------------------------------------------------------------------------
  // 4. Form Validations (Client-Side)
  // --------------------------------------------------------------------------
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  function validatePanField() {
    const val = panInput.value.trim().toUpperCase();
    panInput.value = val;
    if (PAN_REGEX.test(val)) {
      panInput.classList.remove('is-invalid');
      panInput.classList.add('is-valid');
      return true;
    } else {
      panInput.classList.remove('is-valid');
      panInput.classList.add('is-invalid');
      return false;
    }
  }

  function validateCibilField() {
    const cibil = parseInt(cibilInput.value, 10);
    if (!isNaN(cibil) && cibil >= 300 && cibil <= 900) {
      cibilInput.classList.remove('is-invalid');
      cibilInput.classList.add('is-valid');
      return true;
    } else {
      cibilInput.classList.remove('is-valid');
      cibilInput.classList.add('is-invalid');
      return false;
    }
  }

  function validateForm() {
    let isValid = true;
    const errors = [];

    if (!validatePanField()) {
      isValid = false;
      errors.push(`PAN Number "${panInput.value.trim()}" is invalid. Format must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).`);
    }

    if (!validateCibilField()) {
      isValid = false;
      errors.push(`CIBIL Score must be between 300 and 900.`);
    }

    const reqInputs = form.querySelectorAll('input[required], select[required]');
    reqInputs.forEach((input) => {
      if (!input.value.trim()) {
        input.classList.add('is-invalid');
        isValid = false;
        const label = input.closest('.form-group')?.querySelector('.form-label')?.textContent?.replace('*', '').trim() || 'Required field';
        errors.push(`${label} is required.`);
      } else {
        input.classList.remove('is-invalid');
      }
    });

    if (!isValid) {
      showAlert('danger', errors.join(' • '));
    }

    return isValid;
  }

  // --------------------------------------------------------------------------
  // 5. Modal Flow & Submission
  // --------------------------------------------------------------------------
  function openConfirmationModal() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const pan = panInput.value.trim();
    const amount = window.FinancialMath.formatCurrencyINR(amountInput.value);
    const tenure = `${tenureInput.value} Months`;
    const emi = emiDisplay.textContent;
    const policyName = selectedPolicy ? selectedPolicy.policy_name : 'Selected Product';

    modalSummaryList.innerHTML = `
      <div class="breakdown-row"><span class="breakdown-label">Applicant:</span><span class="breakdown-value">${firstName} ${lastName}</span></div>
      <div class="breakdown-row"><span class="breakdown-label">PAN Card:</span><span class="breakdown-value" style="font-family:monospace;">${pan}</span></div>
      <div class="breakdown-row"><span class="breakdown-label">Product:</span><span class="breakdown-value">${policyName}</span></div>
      <div class="breakdown-row"><span class="breakdown-label">Requested Amount:</span><span class="breakdown-value">${amount}</span></div>
      <div class="breakdown-row"><span class="breakdown-label">Tenure:</span><span class="breakdown-value">${tenure}</span></div>
      <div class="breakdown-row"><span class="breakdown-label">Estimated Monthly EMI:</span><span class="breakdown-value" style="color:var(--brand-blue); font-size:1.05rem;">${emi}</span></div>
    `;

    confirmModal.classList.add('active');
  }

  function closeConfirmationModal() {
    confirmModal.classList.remove('active');
  }

  async function handleFinalSubmission() {
    modalConfirmBtn.disabled = true;
    modalConfirmBtn.textContent = 'Submitting...';

    const payload = {
      first_name: document.getElementById('firstName').value.trim(),
      last_name: document.getElementById('lastName').value.trim(),
      email: document.getElementById('emailInput').value.trim(),
      phone: document.getElementById('phoneInput').value.trim(),
      pan_number: panInput.value.trim().toUpperCase(),
      date_of_birth: document.getElementById('dobInput').value || '1992-06-15',
      gender: document.getElementById('genderSelect') ? document.getElementById('genderSelect').value : 'Male',
      address: document.getElementById('addressInput') ? document.getElementById('addressInput').value.trim() : 'Main City Road',
      monthly_income: parseFloat(incomeInput.value),
      employment_type: document.getElementById('employmentSelect').value,
      credit_score: parseInt(cibilInput.value, 10),
      cibil_score: parseInt(cibilInput.value, 10),
      city: document.getElementById('cityInput').value.trim(),
      branch_id: branchSelect ? parseInt(branchSelect.value, 10) : 1,
      policy_id: parseInt(policySelect.value, 10),
      requested_amount: parseFloat(amountInput.value),
      loan_amount_requested: parseFloat(amountInput.value),
      requested_tenure_months: parseInt(tenureInput.value, 10),
      tenure_months: parseInt(tenureInput.value, 10),
      purpose: document.getElementById('purposeInput') ? document.getElementById('purposeInput').value.trim() : 'General Purpose'
    };

    try {
      const result = await window.API.post('/applications', payload);
      closeConfirmationModal();

      if (result.success) {
        const app = result.application;
        const msg = `Application #APP-${app.application_id} processed with status: ${app.application_status}.`;
        showAlert(app.application_status === 'Approved' ? 'success' : 'warning', msg);
        
        // Reset form to defaults
        form.reset();
        handlePolicyChange();
        
        // Refresh table with the newly created application
        await fetchApplicationHistory();
      }
    } catch (error) {
      closeConfirmationModal();
      showAlert('danger', `Submission Failed: ${error.message}`);
    } finally {
      modalConfirmBtn.disabled = false;
      modalConfirmBtn.textContent = 'Confirm & Submit';
    }
  }

  // --------------------------------------------------------------------------
  // Utility Helpers
  // --------------------------------------------------------------------------
  function showAlert(type, message) {
    alertContainer.innerHTML = `
      <div class="card" style="margin-bottom:1.5rem; background-color: var(--${type}-bg); border: 1px solid var(--${type}-border); color: var(--${type}-color); display:flex; justify-content:space-between; align-items:center;">
        <span><strong>${type === 'success' ? '✓ Success:' : '⚠ Notice:'}</strong> ${escapeHtml(message)}</span>
        <button style="background:none; border:none; cursor:pointer; color:inherit; font-size:1.1rem;" onclick="this.parentElement.remove()">✕</button>
      </div>
    `;
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Fire initialization
  init();
});

