import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--brand-blue)', marginBottom: '1rem' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1rem' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        The page you are looking for does not exist in the FinLoan Pro platform.
      </p>
      <Link to="/" className="btn btn-primary">
        &larr; Return to Home Portal
      </Link>
    </div>
  );
}
