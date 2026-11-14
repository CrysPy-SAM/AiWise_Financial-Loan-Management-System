import React from 'react';
import { formatCurrencyINR } from '../../utils/financialMath';

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

export default function RecentApplicationsTable({ applications = [], loading = false }) {
  return (
    <div className="card">
      <div className="activity-header">
        <div>
          <h2 className="activity-title">Recent Loan Applications</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Underwriting Pipeline Live Queue</span>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-subtle)',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            color: 'var(--text-muted)'
          }}
        >
          {applications.length} Records
        </span>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Requested</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</div> Loading pipeline...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No matching applications found.
                </td>
              </tr>
            ) : (
              applications.map((app, idx) => (
                <tr key={app.application_id || idx}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    #APP-{app.application_id}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-main)' }}>{app.customer_name}</strong>
                    <br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.loan_type}</span>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {formatCurrencyINR(app.requested_amount || app.loan_amount_requested)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(app.status || app.application_status)}`}>
                      <span className="status-dot-pulse" />
                      {app.status || app.application_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
