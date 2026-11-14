import React from 'react';

/**
 * Dynamic Alert Banner
 * @param {'success'|'danger'|'warning'|'info'} type
 * @param {string} message
 * @param {function} onClose
 */
export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.5rem',
        backgroundColor: `var(--${type}-bg, #eff6ff)`,
        border: `1px solid var(--${type}-border, #bfdbfe)`,
        color: `var(--${type}-color, #1e40af)`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)'
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>
          {type === 'success' && '✓'}
          {type === 'danger' && '⚠'}
          {type === 'warning' && 'Notice:'}
          {type === 'info' && 'ℹ'}
        </span>
        <span style={{ fontWeight: 500, fontSize: '0.925rem' }}>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0 0.5rem',
            lineHeight: 1
          }}
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      )}
    </div>
  );
}
