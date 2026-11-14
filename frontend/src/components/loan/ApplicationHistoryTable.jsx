import React from 'react';
import { formatCurrencyINR, formatDateINR } from '../../utils/financialMath';

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Approved':
      return 'badge-approved';
    case 'Rejected':
      return 'badge-rejected';
    case 'Under_Review':
      return 'badge-under-review';
    case 'Submitted':
      return 'badge-submitted';
    default:
      return 'badge-active';
  }
}

export default function ApplicationHistoryTable({ applications = [], loading = false }) {
  return (
    <section className="history-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
            Recent Loan Applications
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Live database view of submitted credit applications
          </p>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>App ID</th>
              <th>Applicant & PAN</th>
              <th>Loan Product</th>
              <th>Requested Amount</th>
              <th>Tenure</th>
              <th>Status</th>
              <th>Application Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading application records from PostgreSQL...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No loan applications submitted yet.
                </td>
              </tr>
            ) : (
              applications.map((app, idx) => (
                <tr key={app.application_id || idx}>
                  <td>
                    <strong>#APP-{app.application_id}</strong>
                  </td>
                  <td>
                    {app.customer_name}
                    <br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {app.pan_number}
                    </span>
                  </td>
                  <td>{app.loan_type}</td>
                  <td>
                    <strong>{formatCurrencyINR(app.requested_amount || app.loan_amount_requested)}</strong>
                  </td>
                  <td>{app.requested_tenure_months || app.tenure_months} mos</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(app.status || app.application_status)}`}>
                      {app.status || app.application_status}
                    </span>
                  </td>
                  <td>{formatDateINR(app.application_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
