import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-tag">AIWIZE LABS &bull; 7-Day Technical Mastery</div>
        <h1 className="hero-title">Financial Loan Management System</h1>
        <p className="hero-subtitle">
          A full-stack banking platform built on Neon Cloud PostgreSQL, Node.js + Express, and modern React.js.
          Designed for production understanding, SQL fluency, UI/UX craft, and independent technical defense without AI.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to="/loan-application"
            className="btn btn-primary"
            style={{ background: '#ffffff', color: 'var(--primary-color)' }}
          >
            Open Loan Form &rarr;
          </Link>
          <Link
            to="/dashboard"
            className="btn btn-secondary"
            style={{ background: 'transparent', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            Launch Dashboard &rarr;
          </Link>
        </div>
      </div>

      {/* System Modules Portal Grid */}
      <div className="portal-grid">
        {/* Module 1: Loan Application Form */}
        <div className="card portal-card card-blue">
          <div>
            <div className="card-icon">📝</div>
            <h2 className="card-heading">Loan Application Form</h2>
            <p className="card-desc">
              Interactive application form featuring live PAN regex validation, loan product selection, bidirectional range sliders, dynamic conditional fields, and real-time reducing balance EMI calculations.
            </p>
          </div>
          <Link to="/loan-application" className="btn btn-primary">
            Launch Form &rarr;
          </Link>
        </div>

        {/* Module 2: Financial Operations Dashboard */}
        <div className="card portal-card card-green">
          <div>
            <div className="card-icon">📊</div>
            <h2 className="card-heading">Executive Dashboard</h2>
            <p className="card-desc">
              Visual analytics powered by Chart.js displaying monthly repayment collections, branch loan volumes, active portfolio statuses, real-time KPI cards, and live database feeds.
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-primary" style={{ background: 'var(--success-color)' }}>
            View Dashboard &rarr;
          </Link>
        </div>

        {/* Module 3: SQL Practice Matrix */}
        <div id="sql-practice" className="card portal-card card-purple">
          <div>
            <div className="card-icon">🗄️</div>
            <h2 className="card-heading">SQL Practice (40+ Queries)</h2>
            <p className="card-desc">
              Structured into 3 progressive tiers: Foundation (15), Advanced CTEs & Subqueries (15), and Deep Reasoning with Window Functions & EXPLAIN ANALYZE (10). Every query includes all 10 required analysis facets.
            </p>
          </div>
          <a href="/sql-practice/level-1-foundation.sql" target="_blank" rel="noreferrer" className="btn btn-secondary">
            Explore SQL Modules &rarr;
          </a>
        </div>

        {/* Module 4: SQL Debugging Exercises */}
        <div className="card portal-card card-amber">
          <div>
            <div className="card-icon">🐛</div>
            <h2 className="card-heading">SQL Debugging (15 Broken Queries)</h2>
            <p className="card-desc">
              15 intentionally broken queries modeling real production bugs: Cartesian products, NULL pitfall in NOT IN, integer division, TIMESTAMP truncation, and window framing bugs with progressive hints.
            </p>
          </div>
          <a href="/sql-practice/debugging/broken-queries.sql" target="_blank" rel="noreferrer" className="btn btn-secondary">
            Start Debugging &rarr;
          </a>
        </div>

        {/* Module 5: UI/UX Change Practice */}
        <div className="card portal-card card-teal">
          <div>
            <div className="card-icon">🎨</div>
            <h2 className="card-heading">UI Practice (20 Guided + 5 Solo)</h2>
            <p className="card-desc">
              20 step-by-step guided frontend modifications and 5 unseen solo challenges covering responsive CSS Grid, accessible modals, table sorting, live search, and debounce handlers.
            </p>
          </div>
          <a href="/ui-practice/guided/20-guided-modifications.md" target="_blank" rel="noreferrer" className="btn btn-secondary">
            Review UI Exercises &rarr;
          </a>
        </div>

        {/* Module 6: Assessment & Mock Interview */}
        <div id="assessment" className="card portal-card card-rose">
          <div>
            <div className="card-icon">⏱️</div>
            <h2 className="card-heading">Mock Assessment & Viva</h2>
            <p className="card-desc">
              Official 120-minute timed mock test (100 Marks: 40 SQL, 25 Adv SQL, 25 UI/UX, 10 Debugging) plus a 30-minute structured technical interview defense guide.
            </p>
          </div>
          <a href="/assessment/offline-test/test-paper.md" target="_blank" rel="noreferrer" className="btn btn-secondary">
            View Test Paper &rarr;
          </a>
        </div>
      </div>

      {/* Quick Architecture Overview */}
      <section className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
          System Architecture & Engineering Standards
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          This platform implements clean architectural separation of concerns: React.js component architecture, Express.js REST API micro-controllers, and PostgreSQL relational schema with foreign key integrity.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--primary-color)' }}>Data Layer:</strong>
            <br />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              9 PostgreSQL tables with explicit foreign keys, check constraints, domain indexes, and Neon Cloud SSL pooling.
            </span>
          </div>
          <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--primary-color)' }}>API Layer:</strong>
            <br />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Express.js REST controllers with parameterization to eliminate SQL injection and standardized error payloads.
            </span>
          </div>
          <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--primary-color)' }}>UI Tier:</strong>
            <br />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              React 18 Component Hierarchy, React Router DOM, reducing-balance math engine, and Chart.js 4 visualizations.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
