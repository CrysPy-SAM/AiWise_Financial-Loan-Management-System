import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" className="nav-brand">
          <div className="brand-icon">₹</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ lineHeight: 1.1 }}>FinLoan Pro</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
              ENTERPRISE LMS
            </span>
          </div>
        </Link>
      </div>

      <nav>
        <ul className="nav-links">
          <li>
            <NavLink
              to="/loan-application"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Loan Application
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Financial Dashboard
            </NavLink>
          </li>
          <li>
            <Link to="/#sql-practice" className="nav-link">
              SQL Engine
            </Link>
          </li>
          <li>
            <Link to="/#assessment" className="nav-link">
              Underwriting Test
            </Link>
          </li>
        </ul>
      </nav>

      {/* Cloud DB Connection Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#065f46'
          }}
          title="Direct connection to Neon Cloud Serverless PostgreSQL cluster"
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.35)',
              display: 'inline-block'
            }}
          />
          <span>Neon Cloud Online</span>
        </div>
      </div>
    </header>
  );
}
