import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import '../../utils/chartSetup';

export default function LoanStatusChart({ data = [] }) {
  const labels = data.map((d) => d.loan_status || d.status);
  const values = data.map((d) => parseInt(d.count, 10));

  const chartData = {
    labels: labels.length > 0 ? labels : ['Active', 'Closed', 'Defaulted'],
    datasets: [
      {
        data: values.length > 0 ? values : [22, 4, 2],
        backgroundColor: [
          '#2563eb', // Active (Blue)
          '#10b981', // Closed (Green)
          '#ef4444', // Defaulted (Red)
          '#f59e0b'  // Disbursed (Amber)
        ],
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  return (
    <div className="card chart-card">
      <div className="chart-title-box">
        <h2 className="chart-title">Loan Portfolio Status</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Active vs Closed vs Defaulted
        </span>
      </div>
      <div className="chart-container">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
