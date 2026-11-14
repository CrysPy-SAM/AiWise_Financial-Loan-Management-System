import React from 'react';
import { formatCurrencyINR, formatDateINR } from '../../utils/financialMath';

export default function RecentTransactionsTable({ transactions = [], loading = false }) {
  return (
    <div className="card">
      <div className="activity-header">
        <div>
          <h2 className="activity-title">Recent Repayment Transactions</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live Ingestion & Settlement Ledger</span>
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
          {transactions.length} Records
        </span>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Amount Paid</th>
              <th>Method</th>
              <th>Status</th>
              <th>Settlement Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</div> Loading ledger...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No matching transaction records found.
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <tr key={tx.payment_id || idx}>
                  <td>
                    <strong style={{ color: 'var(--text-main)' }}>{tx.customer_name}</strong>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--text-main)' }}>
                    {formatCurrencyINR(tx.payment_amount || tx.amount_paid)}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.775rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-muted)',
                        fontWeight: 600
                      }}
                    >
                      {tx.payment_method}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${tx.payment_status === 'Success' ? 'badge-approved' : 'badge-rejected'}`}>
                      <span className="status-dot-pulse" />
                      {tx.payment_status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDateINR(tx.payment_date, false)}
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
