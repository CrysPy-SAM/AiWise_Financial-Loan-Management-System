import React from 'react';
import { Pie } from 'react-chartjs-2';
import '../../utils/chartSetup';

export default function PortfolioMixChart({ data = [] }) {
  const labels = data.map((d) => d.loan_type);
  const values = data.map((d) => parseFloat(d.total_amount || d.total_volume || 0));

  const chartData = {
    labels: labels.length > 0 ? labels : ['Home', 'Personal', 'Business', 'Auto'],
    datasets: [
      {
        data: values.length > 0 ? values : [15000000, 4500000, 12000000, 3200000],
        backgroundColor: [
          '#8b5cf6', // Home (Purple)
          '#0284c7', // Personal (Sky)
          '#f59e0b', // Business (Amber)
          '#14b8a6'  // Auto (Teal)
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
        <h2 className="chart-title">Product Portfolio Mix</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capital by Loan Type</span>
      </div>
      <div className="chart-container">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}
