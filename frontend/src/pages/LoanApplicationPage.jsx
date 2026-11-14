import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { computeClientEMI } from '../utils/financialMath';
import Alert from '../components/common/Alert';
import ApplicationForm from '../components/loan/ApplicationForm';
import EmiAppraisalCard from '../components/loan/EmiAppraisalCard';
import ApplicationHistoryTable from '../components/loan/ApplicationHistoryTable';

export default function LoanApplicationPage() {
  const [branches, setBranches] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [alert, setAlert] = useState(null); // { type, message }

  const [liveParams, setLiveParams] = useState({
    amount: 500000,
    tenure: 36,
    rate: 10.5,
    income: 95000
  });

  useEffect(() => {
    loadBranches();
    loadPolicies();
    loadApplicationHistory();
  }, []);

  const loadBranches = async () => {
    try {
      const res = await api.get('/applications/branches');
      if (res.success && res.data) {
        setBranches(res.data);
      }
    } catch (err) {
      console.warn('Could not load branches:', err.message);
    }
  };

  const loadPolicies = async () => {
    try {
      const res = await api.get('/applications/policies');
      if (res.success && res.data) {
        setPolicies(res.data);
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: 'Unable to load credit policies. Ensure backend server is running.'
      });
    }
  };

  const loadApplicationHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/applications?limit=10');
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.warn('Could not load application history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLiveChange = (params) => {
    setLiveParams(params);
  };

  const handleFormSubmitted = async (payload) => {
    try {
      const result = await api.post('/applications', payload);
      if (result.success) {
        const app = result.application;
        const msg = `Application #APP-${app.application_id} processed with status: ${app.status || app.application_status}.`;
        setAlert({
          type: (app.status || app.application_status) === 'Approved' ? 'success' : 'warning',
          message: msg
        });
        // Refresh application table with latest data from PostgreSQL
        await loadApplicationHistory();
      } else {
        setAlert({
          type: 'danger',
          message: result.error || 'Failed to submit loan application.'
        });
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.message || 'Submission error. Please check your connection.'
      });
    }
  };

  // Compute live client EMI math based on active sliders and policy
  const calc = computeClientEMI(liveParams.amount, liveParams.rate, liveParams.tenure);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Digital Loan Application</h1>
        <p className="page-subtitle">
          Submit retail and commercial credit requests with instant CIBIL scoring & live reducing-balance EMI appraisal.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Two-Column Form + Appraisal Grid */}
      <div className="form-layout-grid">
        <ApplicationForm
          branches={branches}
          policies={policies}
          onLiveChange={handleLiveChange}
          onFormSubmitted={handleFormSubmitted}
        />
        <EmiAppraisalCard
          principal={liveParams.amount}
          monthlyEmi={calc.monthly_emi}
          totalInterest={calc.total_interest}
          totalPayable={calc.total_payable}
          monthlyIncome={liveParams.income}
        />
      </div>

      {/* Application History View */}
      <ApplicationHistoryTable
        applications={applications}
        loading={loadingHistory}
      />
    </>
  );
}
