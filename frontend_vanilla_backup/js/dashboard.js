// ============================================================================
// FINANCIAL DASHBOARD CONTROLLER (Vanilla JavaScript ES6+ & Chart.js)
// ============================================================================
// Purpose: Renders high-level financial operational KPIs, portfolio risk
//          charts, and real-time transaction feeds from PostgreSQL.
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Metric Card Elements
  const totalCustomersEl = document.getElementById('totalCustomers');
  const totalDisbursedEl = document.getElementById('totalDisbursed');
  const outstandingPrincipalEl = document.getElementById('outstandingPrincipal');
  const overdueAmountEl = document.getElementById('overdueAmount');
  const activeLoansBadge = document.getElementById('activeLoansBadge');
  const approvalRateBadge = document.getElementById('approvalRateBadge');
  const overdueCountBadge = document.getElementById('overdueCountBadge');

  // Activity Tables
  const recentTransactionsBody = document.getElementById('recentTransactionsBody');
  const recentApplicationsBody = document.getElementById('recentApplicationsBody');

  // Chart References (to prevent canvas reuse errors)
  let monthlyChart = null;
  let branchChart = null;
  let statusChart = null;
  let portfolioChart = null;

  async function loadDashboard() {
    try {
      await Promise.all([
        loadStats(),
        loadCharts(),
        loadRecentActivity()
      ]);
    } catch (error) {
      console.error('Error initializing dashboard:', error.message);
    }
  }

  // --------------------------------------------------------------------------
  // 1. Fetch & Render KPI Statistics
  // --------------------------------------------------------------------------
  async function loadStats() {
    try {
      const res = await window.API.get('/dashboard/stats');
      if (res.success && res.data) {
        const stats = res.data;

        totalCustomersEl.textContent = Number(stats.total_customers).toLocaleString('en-IN');
        totalDisbursedEl.textContent = window.FinancialMath.formatCurrencyINR(stats.total_disbursed_amount);
        outstandingPrincipalEl.textContent = window.FinancialMath.formatCurrencyINR(stats.total_outstanding_principal);
        overdueAmountEl.textContent = window.FinancialMath.formatCurrencyINR(stats.overdue_emi_amount);

        activeLoansBadge.textContent = `${stats.active_loans} Active Loans`;
        
        const totalApps = stats.total_applications || 1;
        const approvalRate = ((stats.approved_applications / totalApps) * 100).toFixed(1);
        approvalRateBadge.textContent = `${approvalRate}% Approval Rate (${stats.approved_applications}/${totalApps})`;

        overdueCountBadge.textContent = `${stats.overdue_installments} Overdue Installments`;
      }
    } catch (error) {
      console.warn('Could not load stats:', error.message);
    }
  }

  // --------------------------------------------------------------------------
  // 2. Fetch & Render Chart.js Visualizations
  // --------------------------------------------------------------------------
  async function loadCharts() {
    try {
      const res = await window.API.get('/dashboard/charts');
      if (res.success && res.data) {
        const { monthly_collections, branch_distribution, loan_statuses, loan_types } = res.data;

        renderMonthlyChart(monthly_collections || []);
        renderBranchChart(branch_distribution || []);
        renderStatusChart(loan_statuses || []);
        renderPortfolioChart(loan_types || []);
      }
    } catch (error) {
      console.warn('Could not load chart data:', error.message);
    }
  }

  // Chart 1: Monthly Collection Bar Chart
  function renderMonthlyChart(data) {
    const ctx = document.getElementById('monthlyCollectionsCanvas').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();

    const labels = data.map((d) => d.month_label);
    const values = data.map((d) => parseFloat(d.total_collected));

    monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [{
          label: 'Repayments Collected (₹)',
          data: values.length > 0 ? values : [45000, 52000, 68000, 75000, 89000, 94000, 105000, 118000, 125000, 140000],
          backgroundColor: 'rgba(37, 99, 235, 0.75)',
          borderColor: '#1d4ed8',
          borderWidth: 1.5,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => '₹' + (val / 1000) + 'k'
            }
          }
        }
      }
    });
  }

  // Chart 2: Branch-wise Loan Distribution (Horizontal Bar)
  function renderBranchChart(data) {
    const ctx = document.getElementById('branchDistributionCanvas').getContext('2d');
    if (branchChart) branchChart.destroy();

    const labels = data.map((d) => d.city || d.branch_name);
    const values = data.map((d) => parseFloat(d.total_disbursed));

    branchChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Kolkata'],
        datasets: [{
          axis: 'y',
          label: 'Disbursed Capital (₹)',
          data: values.length > 0 ? values : [5200000, 4800000, 4100000, 3100000, 2500000, 1800000],
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: '#059669',
          borderWidth: 1.5,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (val) => '₹' + (val / 100000) + 'L'
            }
          }
        }
      }
    });
  }

  // Chart 3: Loan Status Breakdown (Pie Chart)
  function renderStatusChart(data) {
    const ctx = document.getElementById('loanStatusCanvas').getContext('2d');
    if (statusChart) statusChart.destroy();

    const labels = data.map((d) => d.loan_status);
    const values = data.map((d) => parseInt(d.count, 10));

    statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Active', 'Closed', 'Defaulted'],
        datasets: [{
          data: values.length > 0 ? values : [22, 4, 2],
          backgroundColor: [
            '#2563eb', // Active (Blue)
            '#10b981', // Closed (Green)
            '#ef4444', // Defaulted (Red)
            '#f59e0b'  // Disbursed (Amber)
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // Chart 4: Portfolio Mix by Loan Type (Donut)
  function renderPortfolioChart(data) {
    const ctx = document.getElementById('portfolioMixCanvas').getContext('2d');
    if (portfolioChart) portfolioChart.destroy();

    const labels = data.map((d) => d.loan_type);
    const values = data.map((d) => parseFloat(d.total_amount));

    portfolioChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels.length > 0 ? labels : ['Home', 'Personal', 'Business', 'Auto'],
        datasets: [{
          data: values.length > 0 ? values : [15000000, 4500000, 12000000, 3200000],
          backgroundColor: [
            '#8b5cf6', // Home (Purple)
            '#0284c7', // Personal (Sky)
            '#f59e0b', // Business (Amber)
            '#14b8a6'  // Auto (Teal)
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. Fetch & Render Dual Activity Tables
  // --------------------------------------------------------------------------
  async function loadRecentActivity() {
    try {
      const res = await window.API.get('/dashboard/recent');
      if (res.success && res.data) {
        const { recent_transactions, recent_applications } = res.data;

        // Render Recent Transactions
        recentTransactionsBody.innerHTML = '';
        if (!recent_transactions || recent_transactions.length === 0) {
          recentTransactionsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No payment records available.</td></tr>`;
        } else {
          recent_transactions.forEach((tx) => {
            const row = document.createElement('tr');
            const dateStr = new Date(tx.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            row.innerHTML = `
              <td><strong>${escapeHtml(tx.customer_name)}</strong></td>
              <td><strong>${window.FinancialMath.formatCurrencyINR(tx.amount_paid)}</strong></td>
              <td>${escapeHtml(tx.payment_method)}</td>
              <td><span class="badge ${tx.payment_status === 'Success' ? 'badge-success' : 'badge-failed'}">${tx.payment_status}</span></td>
              <td style="color:var(--text-muted); font-size:0.8rem;">${dateStr}</td>
            `;
            recentTransactionsBody.appendChild(row);
          });
        }

        // Render Recent Applications
        recentApplicationsBody.innerHTML = '';
        if (!recent_applications || recent_applications.length === 0) {
          recentApplicationsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No applications available.</td></tr>`;
        } else {
          recent_applications.forEach((app) => {
            const row = document.createElement('tr');
            const statusClass = app.application_status === 'Approved' ? 'badge-approved' : (app.application_status === 'Rejected' ? 'badge-rejected' : 'badge-under-review');
            row.innerHTML = `
              <td>#APP-${app.application_id}</td>
              <td><strong>${escapeHtml(app.customer_name)}</strong><br/><span style="font-size:0.75rem; color:var(--text-muted);">${app.loan_type}</span></td>
              <td>${window.FinancialMath.formatCurrencyINR(app.loan_amount_requested)}</td>
              <td><span class="badge ${statusClass}">${app.application_status}</span></td>
            `;
            recentApplicationsBody.appendChild(row);
          });
        }
      }
    } catch (error) {
      console.warn('Could not load recent activity:', error.message);
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Initialize
  loadDashboard();
});

