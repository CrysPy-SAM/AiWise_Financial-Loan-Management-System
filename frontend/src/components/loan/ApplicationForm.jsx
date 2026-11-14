import React, { useState, useEffect } from 'react';
import { validatePAN, formatCurrencyINR } from '../../utils/financialMath';
import Modal from '../common/Modal';

const AMOUNT_PRESETS = [
  { label: '₹1 Lakh', value: 100000 },
  { label: '₹3 Lakh', value: 300000 },
  { label: '₹5 Lakh', value: 500000 },
  { label: '₹10 Lakh', value: 1000000 },
  { label: '₹25 Lakh', value: 2500000 },
  { label: '₹50 Lakh', value: 5000000 }
];

const TENURE_PRESETS = [
  { label: '12 Mo (1 Yr)', value: 12 },
  { label: '24 Mo (2 Yr)', value: 24 },
  { label: '36 Mo (3 Yr)', value: 36 },
  { label: '60 Mo (5 Yr)', value: 60 },
  { label: '120 Mo (10 Yr)', value: 120 },
  { label: '240 Mo (20 Yr)', value: 240 }
];

export default function ApplicationForm({
  branches = [],
  policies = [],
  onLiveChange,
  onFormSubmitted
}) {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    panNumber: '',
    dateOfBirth: '1992-06-15',
    gender: 'Male',
    address: '14 Fort Business Hub, MG Road',
    employmentType: 'Salaried',
    monthlyIncome: 95000,
    creditScore: 760,
    city: 'Mumbai',
    branchId: '',
    policyId: '',
    purpose: 'Home renovation and interior setup',
    amount: 500000,
    tenure: 36,
    // Conditional fields
    gstNumber: '',
    businessVintage: '',
    propertyValue: '',
    propertyCity: ''
  });

  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [amountRange, setAmountRange] = useState({ min: 10000, max: 10000000 });
  const [tenureRange, setTenureRange] = useState({ min: 6, max: 360 });
  const [panValid, setPanValid] = useState(null);
  const [cibilValid, setCibilValid] = useState(null);
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize branch and policy defaults when loaded
  useEffect(() => {
    if (branches.length > 0 && !formData.branchId) {
      setFormData((prev) => ({ ...prev, branchId: branches[0].branch_id }));
    }
  }, [branches]);

  useEffect(() => {
    if (policies.length > 0 && !formData.policyId) {
      const defaultPol = policies[0];
      setFormData((prev) => ({ ...prev, policyId: defaultPol.policy_id }));
      setSelectedPolicy(defaultPol);
      applyPolicyBounds(defaultPol);
    }
  }, [policies]);

  function applyPolicyBounds(policy) {
    if (!policy) return;
    const maxAmt = parseFloat(policy.maximum_loan_amount || policy.max_loan_amount) || 10000000;
    const maxTen = parseInt(policy.maximum_tenure_months || policy.max_tenure_months, 10) || 360;

    setAmountRange({ min: 10000, max: maxAmt });
    setTenureRange({ min: 6, max: maxTen });

    setFormData((prev) => ({
      ...prev,
      amount: Math.min(prev.amount, maxAmt),
      tenure: Math.min(prev.tenure, maxTen)
    }));
  }

  // Notify parent of live changes for right-column appraisal card
  useEffect(() => {
    const rate = selectedPolicy
      ? parseFloat(selectedPolicy.minimum_interest_rate || selectedPolicy.base_interest_rate || 10.5)
      : 10.5;

    if (onLiveChange) {
      onLiveChange({
        amount: formData.amount,
        tenure: formData.tenure,
        rate,
        income: formData.monthlyIncome
      });
    }
  }, [formData.amount, formData.tenure, formData.monthlyIncome, selectedPolicy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Real-time validations
    if (name === 'panNumber') {
      const upper = value.toUpperCase();
      setFormData((prev) => ({ ...prev, panNumber: upper }));
      setPanValid(validatePAN(upper));
    }
    if (name === 'creditScore') {
      const score = parseInt(value, 10);
      setCibilValid(!isNaN(score) && score >= 300 && score <= 900);
    }
  };

  const handlePolicySelect = (e) => {
    const polId = parseInt(e.target.value, 10);
    const pol = policies.find((p) => p.policy_id === polId) || null;
    setSelectedPolicy(pol);
    setFormData((prev) => ({ ...prev, policyId: polId }));
    applyPolicyBounds(pol);
  };

  const handleAmountChange = (val) => {
    const num = Math.max(10000, Math.min(amountRange.max, parseFloat(val) || 0));
    setFormData((prev) => ({ ...prev, amount: num }));
  };

  const handleTenureChange = (val) => {
    const num = Math.max(6, Math.min(tenureRange.max, parseInt(val, 10) || 6));
    setFormData((prev) => ({ ...prev, tenure: num }));
  };

  // Step Validation
  const validateStep = (stepNumber) => {
    const stepErrors = {};

    if (stepNumber === 1) {
      if (!formData.firstName.trim()) stepErrors.firstName = 'First name is required.';
      if (!formData.lastName.trim()) stepErrors.lastName = 'Last name is required.';
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = 'A valid corporate or personal email is required.';
      }
      if (!formData.phone.trim() || formData.phone.trim().length < 10) {
        stepErrors.phone = 'Valid 10-digit mobile number is required.';
      }
      if (!validatePAN(formData.panNumber)) {
        stepErrors.panNumber = 'Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).';
      }
    }

    if (stepNumber === 2) {
      const score = parseInt(formData.creditScore, 10);
      if (isNaN(score) || score < 300 || score > 900) {
        stepErrors.creditScore = 'Credit / CIBIL score must be between 300 and 900.';
      }
      if (parseFloat(formData.monthlyIncome) <= 0) {
        stepErrors.monthlyIncome = 'Net monthly income must be greater than zero.';
      }
      if (!formData.city.trim()) {
        stepErrors.city = 'Residential city is required.';
      }
    }

    if (stepNumber === 3) {
      if (!formData.branchId) stepErrors.branchId = 'Please select an originating bank branch.';
      if (!formData.policyId) stepErrors.policyId = 'Please select a loan credit product.';
      if (selectedPolicy?.loan_type === 'Business' && !formData.gstNumber.trim()) {
        stepErrors.gstNumber = 'GSTIN registration number is required for business credit.';
      }
      if (selectedPolicy?.loan_type === 'Home' && !formData.propertyValue) {
        stepErrors.propertyValue = 'Estimated property valuation is required for housing credit.';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(1) && validateStep(2) && validateStep(3)) {
      setIsModalOpen(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        pan_number: formData.panNumber.trim().toUpperCase(),
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address.trim(),
        monthly_income: parseFloat(formData.monthlyIncome),
        employment_type: formData.employmentType,
        credit_score: parseInt(formData.creditScore, 10),
        cibil_score: parseInt(formData.creditScore, 10),
        city: formData.city.trim(),
        branch_id: parseInt(formData.branchId, 10),
        policy_id: parseInt(formData.policyId, 10),
        requested_amount: parseFloat(formData.amount),
        loan_amount_requested: parseFloat(formData.amount),
        requested_tenure_months: parseInt(formData.tenure, 10),
        tenure_months: parseInt(formData.tenure, 10),
        purpose: formData.purpose.trim()
      };

      await onFormSubmitted(payload);
      setIsModalOpen(false);

      // Reset form to clean state
      setFormData((prev) => ({
        ...prev,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        panNumber: ''
      }));
      setPanValid(null);
      setCurrentStep(1);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Real-time policy eligibility check
  const minRequiredScore = selectedPolicy
    ? parseInt(selectedPolicy.minimum_credit_score || selectedPolicy.min_cibil_score || 650, 10)
    : 650;
  const isScoreEligible = parseInt(formData.creditScore, 10) >= minRequiredScore;

  return (
    <>
      <section className="form-card" aria-label="Digital Loan Application">
        {/* Step Indicator / Wizard Stepper */}
        <nav className="form-stepper" aria-label="Application Stepper">
          <button
            type="button"
            className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
            onClick={() => setCurrentStep(1)}
          >
            <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
            <div className="step-label">
              <span className="step-number">Step 1</span>
              <span className="step-name">Identity & KYC</span>
            </div>
          </button>

          <div className={`step-divider ${currentStep > 1 ? 'filled' : ''}`} />

          <button
            type="button"
            className={`step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
            onClick={() => validateStep(1) && setCurrentStep(2)}
          >
            <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
            <div className="step-label">
              <span className="step-number">Step 2</span>
              <span className="step-name">Income & Credit</span>
            </div>
          </button>

          <div className={`step-divider ${currentStep > 2 ? 'filled' : ''}`} />

          <button
            type="button"
            className={`step-item ${currentStep === 3 ? 'active' : ''}`}
            onClick={() => validateStep(1) && validateStep(2) && setCurrentStep(3)}
          >
            <div className="step-circle">3</div>
            <div className="step-label">
              <span className="step-number">Step 3</span>
              <span className="step-name">Loan Terms</span>
            </div>
          </button>
        </nav>

        <form onSubmit={handleSubmit} noValidate>
          {/* STEP 1: Applicant Identity & KYC */}
          {currentStep === 1 && (
            <fieldset className="fieldset-group">
              <legend className="legend-title">
                <span>1. Applicant Identity & KYC Details</span>
              </legend>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                    placeholder="e.g. Vikram"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                    placeholder="e.g. Sharma"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="vikram.sharma@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    placeholder="+91-9820011223"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="panNumber">
                    PAN (Permanent Account Number) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    className={`form-control ${
                      panValid === true ? 'is-valid' : panValid === false || errors.panNumber ? 'is-invalid' : ''
                    }`}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{ textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}
                    value={formData.panNumber}
                    onChange={handleChange}
                    required
                  />
                  <span className="field-hint">Indian Income Tax standard PAN format (5 letters, 4 digits, 1 letter)</span>
                  {errors.panNumber && <span className="error-message">{errors.panNumber}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="dateOfBirth">
                    Date of Birth <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    className="form-control"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="gender">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="form-control"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="address">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className="form-control"
                    placeholder="Flat, Tower, Landmark, Street"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* STEP 2: Employment & Credit Profile */}
          {currentStep === 2 && (
            <fieldset className="fieldset-group">
              <legend className="legend-title">
                <span>2. Employment & Credit Risk Profile</span>
              </legend>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="employmentType">
                    Employment Category <span className="required">*</span>
                  </label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    className="form-control"
                    value={formData.employmentType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Salaried">Salaried (MNC / Corporate / Govt)</option>
                    <option value="Self-Employed">Self-Employed Professional (Doctor, CA, Architect)</option>
                    <option value="Business Owner">Business Owner / MSME Entrepreneur</option>
                    <option value="Retired">Retired / Pensioner</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="monthlyIncome">
                    Net Take-Home Monthly Income (₹) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="monthlyIncome"
                    name="monthlyIncome"
                    className={`form-control ${errors.monthlyIncome ? 'is-invalid' : ''}`}
                    placeholder="e.g. 95000"
                    min="10000"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    required
                  />
                  <span className="field-hint">Determines permissible monthly debt servicing obligations (DTI)</span>
                  {errors.monthlyIncome && <span className="error-message">{errors.monthlyIncome}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="creditScore">
                    CIBIL / Credit Bureau Score (300 - 900) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="creditScore"
                    name="creditScore"
                    className={`form-control ${
                      cibilValid === true ? 'is-valid' : cibilValid === false || errors.creditScore ? 'is-invalid' : ''
                    }`}
                    placeholder="750"
                    min="300"
                    max="900"
                    value={formData.creditScore}
                    onChange={handleChange}
                    required
                  />
                  <span className="field-hint">Institutional bureau score dictates minimum interest tier</span>
                  {errors.creditScore && <span className="error-message">{errors.creditScore}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="city">
                    Operating City <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  {errors.city && <span className="error-message">{errors.city}</span>}
                </div>
              </div>

              {/* Real-time eligibility preview */}
              <div className={`policy-eligibility-banner ${isScoreEligible ? 'passed' : 'warning'}`}>
                <span className="policy-badge-icon">{isScoreEligible ? '🛡️' : '⚠️'}</span>
                <div>
                  <strong>{isScoreEligible ? 'Favorable Bureau Risk Rating' : 'Underwriting Threshold Advisory'}</strong>
                  <br />
                  {isScoreEligible
                    ? `Applicant score of ${formData.creditScore} satisfies prime retail lending criteria.`
                    : `Score of ${formData.creditScore} is below standard tier (${minRequiredScore}+). Supplementary collateral may be requested.`}
                </div>
              </div>
            </fieldset>
          )}

          {/* STEP 3: Loan Requirement & Configuration */}
          {currentStep === 3 && (
            <fieldset className="fieldset-group">
              <legend className="legend-title">
                <span>3. Loan Terms & Disbursement Configuration</span>
              </legend>

              <div className="form-row" style={{ marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="branchId">
                    Originating Bank Branch <span className="required">*</span>
                  </label>
                  <select
                    id="branchId"
                    name="branchId"
                    className={`form-control ${errors.branchId ? 'is-invalid' : ''}`}
                    value={formData.branchId}
                    onChange={handleChange}
                    required
                  >
                    {branches.length === 0 ? (
                      <option value="">Loading branches...</option>
                    ) : (
                      branches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {b.branch_name} ({b.city})
                        </option>
                      ))
                    )}
                  </select>
                  {errors.branchId && <span className="error-message">{errors.branchId}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="policyId">
                    Credit Policy Product <span className="required">*</span>
                  </label>
                  <select
                    id="policyId"
                    name="policyId"
                    className={`form-control ${errors.policyId ? 'is-invalid' : ''}`}
                    value={formData.policyId}
                    onChange={handlePolicySelect}
                    required
                  >
                    {policies.length === 0 ? (
                      <option value="">Loading credit policies...</option>
                    ) : (
                      policies.map((p) => (
                        <option key={p.policy_id} value={p.policy_id}>
                          {p.policy_name} ({p.loan_type} • {p.minimum_interest_rate || p.base_interest_rate}% p.a.)
                        </option>
                      ))
                    )}
                  </select>
                  {errors.policyId && <span className="error-message">{errors.policyId}</span>}
                </div>
              </div>

              {/* Policy Criteria Feedback */}
              {selectedPolicy && (
                <div className={`policy-eligibility-banner ${isScoreEligible ? 'passed' : 'warning'}`} style={{ marginBottom: '1.25rem' }}>
                  <span className="policy-badge-icon">{isScoreEligible ? '✓' : '⚠️'}</span>
                  <div>
                    <strong>{selectedPolicy.policy_name} Underwriting Rules:</strong>
                    <br />
                    Base Rate: {selectedPolicy.minimum_interest_rate || selectedPolicy.base_interest_rate}% p.a. | Min CIBIL: {minRequiredScore} | Max Facility: {formatCurrencyINR(amountRange.max)}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="purpose">
                  Loan Purpose & End-Use
                </label>
                <input
                  type="text"
                  id="purpose"
                  name="purpose"
                  className="form-control"
                  placeholder="e.g. Working capital expansion, home construction, debt consolidation"
                  value={formData.purpose}
                  onChange={handleChange}
                />
              </div>

              {/* Dynamic Conditional Fields based on Loan Type */}
              {selectedPolicy?.loan_type === 'Business' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      GSTIN (Goods & Services Tax) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      className={`form-control ${errors.gstNumber ? 'is-invalid' : ''}`}
                      placeholder="27AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      required
                    />
                    {errors.gstNumber && <span className="error-message">{errors.gstNumber}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Business Vintage (Years)
                    </label>
                    <input
                      type="number"
                      name="businessVintage"
                      className="form-control"
                      placeholder="e.g. 5"
                      min="1"
                      value={formData.businessVintage}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {selectedPolicy?.loan_type === 'Home' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Property Market Valuation (₹) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      name="propertyValue"
                      className={`form-control ${errors.propertyValue ? 'is-invalid' : ''}`}
                      placeholder="e.g. 7500000"
                      min="500000"
                      value={formData.propertyValue}
                      onChange={handleChange}
                      required
                    />
                    {errors.propertyValue && <span className="error-message">{errors.propertyValue}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Property Location City
                    </label>
                    <input
                      type="text"
                      name="propertyCity"
                      className="form-control"
                      placeholder="e.g. Mumbai"
                      value={formData.propertyCity}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Synced Amount Slider + Input + Preset Chips */}
              <div className="form-group slider-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="amountInput">
                    Loan Amount Sanction Facility (₹) <span className="required">*</span>
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Policy Limit: Up to {formatCurrencyINR(amountRange.max)}
                  </span>
                </div>

                <div className="slider-input-wrapper">
                  <input
                    type="range"
                    className="range-slider"
                    min="50000"
                    max={amountRange.max}
                    step="25000"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                  <input
                    type="number"
                    id="amountInput"
                    className="form-control"
                    style={{ width: '150px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}
                    min="10000"
                    max={amountRange.max}
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                </div>

                {/* Amount Quick Presets */}
                <div className="preset-chips-group">
                  {AMOUNT_PRESETS.filter((p) => p.value <= amountRange.max).map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`preset-chip ${formData.amount === preset.value ? 'active' : ''}`}
                      onClick={() => handleAmountChange(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Synced Tenure Slider + Input + Preset Chips */}
              <div className="form-group slider-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="tenureInput">
                    Loan Tenure (Months) <span className="required">*</span>
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Policy Limit: Up to {tenureRange.max} Months ({Math.round(tenureRange.max / 12)} Yrs)
                  </span>
                </div>

                <div className="slider-input-wrapper">
                  <input
                    type="range"
                    className="range-slider"
                    min="6"
                    max={tenureRange.max}
                    step="6"
                    value={formData.tenure}
                    onChange={(e) => handleTenureChange(e.target.value)}
                  />
                  <input
                    type="number"
                    id="tenureInput"
                    className="form-control"
                    style={{ width: '110px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}
                    min="6"
                    max={tenureRange.max}
                    value={formData.tenure}
                    onChange={(e) => handleTenureChange(e.target.value)}
                  />
                </div>

                {/* Tenure Quick Presets */}
                <div className="preset-chips-group">
                  {TENURE_PRESETS.filter((p) => p.value <= tenureRange.max).map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`preset-chip ${formData.tenure === preset.value ? 'active' : ''}`}
                      onClick={() => handleTenureChange(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>
          )}

          {/* Stepper Navigation Footer Buttons */}
          <div className="wizard-footer">
            {currentStep > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrevStep}
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNextStep}
              >
                Continue to Step {currentStep + 1} →
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.75rem', fontWeight: 700 }}
              >
                Review & Underwrite Sanction
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Confirmation & Institutional Underwriting Sanction Preview Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Institutional Loan Sanction Sheet"
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Adjust Terms
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Persisting to Neon Cloud...' : 'Confirm & Sanction Facility'}
            </button>
          </>
        }
      >
        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Please verify the credit appraisal parameters before authorizing database insertion and underwriting workflow:
        </p>

        <div className="sanction-sheet">
          <div className="sanction-header">
            <span className="sanction-title">Credit Facility Term Sheet</span>
            <span className="sanction-seal">NEON CLOUD ATTESTED</span>
          </div>

          <div className="calc-breakdown-list" style={{ padding: 0 }}>
            <div className="breakdown-row">
              <span className="breakdown-label">Applicant Name:</span>
              <span className="breakdown-value">
                {formData.firstName} {formData.lastName}
              </span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">PAN Verification:</span>
              <span className="breakdown-value" style={{ fontFamily: 'monospace' }}>
                {formData.panNumber}
              </span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Credit Bureau Score:</span>
              <span className="breakdown-value" style={{ color: isScoreEligible ? '#059669' : '#d97706' }}>
                {formData.creditScore} / 900
              </span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Sanction Product:</span>
              <span className="breakdown-value">
                {selectedPolicy ? selectedPolicy.policy_name : 'Selected Product'}
              </span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Facility Amount:</span>
              <span className="breakdown-value" style={{ fontSize: '1rem', color: 'var(--primary-accent)' }}>
                {formatCurrencyINR(formData.amount)}
              </span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Amortization Tenure:</span>
              <span className="breakdown-value">{formData.tenure} Months ({Math.round(formData.tenure / 12)} Years)</span>
            </div>
            <div className="breakdown-row" style={{ borderBottom: 'none' }}>
              <span className="breakdown-label">Originating Branch:</span>
              <span className="breakdown-value">
                {branches.find((b) => b.branch_id === parseInt(formData.branchId, 10))?.branch_name || 'Assigned Branch'}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
