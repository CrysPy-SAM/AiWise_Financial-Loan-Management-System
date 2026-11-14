import React from 'react';
import { Bar } from 'react-chartjs-2';
import '../../utils/chartSetup';

export default function BranchDistributionChart({ data = [] }) {
  const labels = data.map((d) => d.city || d.branch_name);
  const values = data.map((d) => parseFloat(d.total_disbursed));

  const chartData = {
    labels: labels.length > 0 ? labels : ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Kolkata'],
    datasets: [
      {
        axis: 'y',
        label: 'Disbursed Capital (₹)',
        data: values.length > 0 ? values : [5200000, 4800000, 4100000, 3100000, 2500000, 1800000],
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: '#059669',
        borderWidth: 1.5,
        borderRadius: 4
      }
    ]
  };

  const options = {
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
  };

  return (
    <div className="card chart-card">
      <div className="chart-title-box">
        <h2 className="chart-title">Branch-wise Loan Disbursement</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Geographical Volume</span>
      </div>
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
