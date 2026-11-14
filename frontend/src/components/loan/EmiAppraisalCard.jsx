import React from 'react';
import { formatCurrencyINR, evaluateDTI } from '../../utils/financialMath';

/**
 * Senior-Grade Real-Time EMI Appraisal & Credit Decisioning Engine
 * @param {object} props
 * @param {number} props.principal
 * @param {number} props.monthlyEmi
 * @param {number} props.totalInterest
 * @param {number} props.totalPayable
 * @param {number} props.monthlyIncome
 */
export default function EmiAppraisalCard({
  principal = 0,
  monthlyEmi = 0,
  totalInterest = 0,
  totalPayable = 0,
  monthlyIncome = 0
}) {
  const dti = evaluateDTI(monthlyIncome, monthlyEmi);

  // Calculate percentage split between principal and interest
  const safeTotal = totalPayable > 0 ? totalPayable : 1;
  const principalShare = Math.round((principal / safeTotal) * 100);
  const interestShare = Math.max(0, 100 - principalShare);

  // Determine DTI severity class and meter width
  let dtiClass = 'dti-safe';
  let dtiMeterColor = '#10b981';
  const numericDti = parseFloat(dti.ratio) || 0;
  if (numericDti > 50) {
    dtiClass = 'dti-danger';
    dtiMeterColor = '#ef4444';
  } else if (numericDti > 35) {
    dtiClass = 'dti-warning';
    dtiMeterColor = '#f59e0b';
  }
  const meterWidth = Math.min(100, Math.max(0, numericDti));

  return (
    <aside className="calculator-card" aria-label="Live Loan Repayment Appraisal">
      <div className="calc-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Real-Time EMI Appraisal
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Live reducing-balance appraisal engine
            </p>
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              color: 'var(--primary-accent)'
            }}
          >
            LIVE RE-CALC
          </span>
        </div>
      </div>

      {/* Main EMI Display Header */}
      <div className="emi-display-box">
        <div className="emi-label">Monthly EMI Payable</div>
        <div id="emiDisplay" className="emi-value">
          {formatCurrencyINR(monthlyEmi)}
        </div>
        <div className="emi-formula-hint">P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)</div>
      </div>

      {/* Amortization Split Bar */}
      <div className="amort-split-container">
        <div className="amort-split-labels">
          <span style={{ color: '#0284c7' }}>
            ● Principal: {principalShare}%
          </span>
          <span style={{ color: '#d97706' }}>
            ● Interest: {interestShare}%
          </span>
        </div>
        <div className="amort-split-bar" title={`Principal: ${principalShare}%, Interest: ${interestShare}%`}>
          <div className="split-principal" style={{ width: `${principalShare}%` }} />
          <div className="split-interest" style={{ width: `${interestShare}%` }} />
        </div>
        <div className="amort-split-legend">
          <span>₹{Math.round(principal / 1000)}k Net Borrowed</span>
          <span>₹{Math.round(totalInterest / 1000)}k Total Cost</span>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="calc-breakdown-list">
        <div className="breakdown-row">
          <span className="breakdown-label">Principal Sanctioned:</span>
          <span id="principalDisplay" className="breakdown-value">
            {formatCurrencyINR(principal)}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Total Cumulative Interest:</span>
          <span id="interestDisplay" className="breakdown-value" style={{ color: '#d97706' }}>
            {formatCurrencyINR(totalInterest)}
          </span>
        </div>
        <div className="breakdown-row" style={{ borderBottom: 'none', paddingTop: '0.25rem' }}>
          <span className="breakdown-label" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            Total Repayable:
          </span>
          <span id="totalPayableDisplay" className="breakdown-value" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
            {formatCurrencyINR(totalPayable)}
          </span>
        </div>
      </div>

      {/* Debt-to-Income (DTI) Live Underwriting Assessment */}
      {monthlyIncome > 0 && monthlyEmi > 0 ? (
        <div className={`dti-gauge-box ${dtiClass}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>
              DTI Ratio: {dti.ratio}%
            </span>
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {dti.statusText}
            </span>
          </div>

          <div className="dti-meter-track">
            <div
              className="dti-meter-fill"
              style={{
                width: `${meterWidth}%`,
                backgroundColor: dtiMeterColor
              }}
            />
          </div>

          <div style={{ fontSize: '0.775rem', marginTop: '0.35rem', lineHeight: 1.35 }}>
            {dti.message}
          </div>
        </div>
      ) : (
        <div
          style={{
            margin: '0 1.5rem 1.25rem 1.5rem',
            padding: '0.85rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}
        >
          Enter Monthly Income to compute live Debt-to-Income (DTI) debt serviceability ratio.
        </div>
      )}

      {/* Underwriting Note */}
      <div
        style={{
          margin: '0 1.5rem 1.5rem 1.5rem',
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(15, 23, 42, 0.03)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.45
        }}
      >
        <strong style={{ color: 'var(--text-main)' }}>Underwriting Protocol:</strong> Real-time reducing-balance
        amortization according to FinLoan Pro standard credit rules. Prepayments directly retire principal without penalty.
      </div>
    </aside>
  );
}
