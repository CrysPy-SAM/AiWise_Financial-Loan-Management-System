import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrencyINR, formatNumberINR } from '../utils/financialMath';
import MetricCard from '../components/dashboard/MetricCard';
import MonthlyCollectionsChart from '../components/dashboard/MonthlyCollectionsChart';
import BranchDistributionChart from '../components/dashboard/BranchDistributionChart';
import LoanStatusChart from '../components/dashboard/LoanStatusChart';
import PortfolioMixChart from '../components/dashboard/PortfolioMixChart';
import RecentTransactionsTable from '../components/dashboard/RecentTransactionsTable';
import RecentApplicationsTable from '../components/dashboard/RecentApplicationsTable';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recent, setRecent] = useState({ transactions: [], applications: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Status filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, chartsRes, recentRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => null),
        api.get('/dashboard/charts').catch(() => null),
        api.get('/dashboard/recent').catch(() => null)
      ]);

      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (chartsRes?.success && chartsRes.data) {
        setCharts(chartsRes.data);
      }
      if (recentRes?.success && recentRes.data) {
        setRecent({
          transactions: recentRes.data.recent_transactions || [],
          applications: recentRes.data.recent_applications || []
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const totalApps = stats?.total_applications || 1;
  const approvalRate = stats
    ? ((stats.approved_applications / totalApps) * 100).toFixed(1)
    : '0.0';

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return recent.applications.filter((app) => {
      const matchesSearch =
        searchQuery === '' ||
        (app.customer_name && app.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.loan_type && app.loan_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(app.application_id).includes(searchQuery);

      const status = (app.status || app.application_status || '').toUpperCase();
      const matchesStatus =
        selectedStatus === 'ALL' ||
        status === selectedStatus ||
        (selectedStatus === 'UNDER_REVIEW' && status.includes('REVIEW'));

      return matchesSearch && matchesStatus;
    });
  }, [recent.applications, searchQuery, selectedStatus]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return recent.transactions.filter((tx) => {
      const matchesSearch =
        searchQuery === '' ||
        (tx.customer_name && tx.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.payment_method && tx.payment_method.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(tx.payment_id).includes(searchQuery);

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'APPROVED' && tx.payment_status === 'Success') ||
        (selectedStatus === 'REJECTED' && tx.payment_status === 'Failed');

      return matchesSearch && matchesStatus;
    });
  }, [recent.transactions, searchQuery, selectedStatus]);

  return (
    <>
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Executive Portfolio Dashboard</h1>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              ● LIVE SYNCED
            </span>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Real-time portfolio intelligence, credit disbursements, risk exposure, and collection performance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadDashboardData}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s ease' }}>
              🔄
            </span>
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          <Link to="/loan-application" className="btn btn-primary">
            + New Loan Facility
          </Link>
        </div>
      </div>

      {/* 1. Top-Line KPI Metric Cards */}
      <section className="metrics-grid">
        {/* Card 1: Total Borrowers */}
        <MetricCard
          colorClass="metric-blue"
          title="Total Borrowers"
          icon="👥"
          value={stats ? formatNumberINR(stats.total_customers) : '--'}
          footer={
            <span className="badge badge-submitted">
              <span className="status-dot-pulse" />
              {stats ? `${stats.active_loans} Active Facilities` : '-- Active Facilities'}
            </span>
          }
        />

        {/* Card 2: Total Disbursed */}
        <MetricCard
          colorClass="metric-green"
          title="Total Disbursed Volume"
          icon="💰"
          value={stats ? formatCurrencyINR(stats.total_disbursed_amount) : '₹--'}
          footer={
            <span className="badge badge-approved">
              <span className="status-dot-pulse" />
              {`${approvalRate}% Approval Ratio`}
            </span>
          }
        />

        {/* Card 3: Outstanding Principal */}
        <MetricCard
          colorClass="metric-purple"
          title="Outstanding Principal Book"
          icon="📉"
          value={stats ? formatCurrencyINR(stats.total_outstanding_principal) : '₹--'}
          footer={
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Net amortized principal balance
            </span>
          }
        />

        {/* Card 4: Overdue EMI Capital At Risk */}
        <MetricCard
          colorClass="metric-amber"
          title="Overdue Capital At Risk"
          icon="⚠️"
          value={stats ? formatCurrencyINR(stats.overdue_emi_amount) : '₹--'}
          valueColor="#dc2626"
          footer={
            <span className="badge badge-rejected">
              <span className="status-dot-pulse" />
              {stats ? `${stats.overdue_installments} Delinquent Installments` : '-- Delinquencies'}
            </span>
          }
        />
      </section>

      {/* 2. Interactive Charts Grid (2x2 Layout) */}
      <section className="charts-grid">
        <MonthlyCollectionsChart data={charts?.monthly_collections || []} />
        <BranchDistributionChart data={charts?.branch_distribution || []} />
        <LoanStatusChart data={charts?.loan_statuses || []} />
        <PortfolioMixChart data={charts?.loan_types || []} />
      </section>

      {/* 3. Live Search & Filter Toolbar */}
      <section className="dashboard-toolbar" style={{ marginTop: '2.5rem' }}>
        <div className="search-box-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search applicants, loan type, payment mode, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-pills-group">
          {['ALL', 'APPROVED', 'UNDER_REVIEW', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`filter-pill ${selectedStatus === st ? 'active' : ''}`}
              onClick={() => setSelectedStatus(st)}
            >
              {st === 'ALL'
                ? 'All Statuses'
                : st === 'UNDER_REVIEW'
                ? 'Under Review'
                : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Dual Activity Tables */}
      <section className="activity-grid">
        <RecentTransactionsTable
          transactions={filteredTransactions}
          loading={loading}
        />
        <RecentApplicationsTable
          applications={filteredApplications}
          loading={loading}
        />
      </section>
    </>
  );
}
