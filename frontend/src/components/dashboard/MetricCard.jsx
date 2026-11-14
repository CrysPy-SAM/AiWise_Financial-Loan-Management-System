import React from 'react';

/**
 * KPI Metric Card
 * @param {'metric-blue'|'metric-green'|'metric-purple'|'metric-amber'} colorClass
 * @param {string} title
 * @param {string} icon
 * @param {string|number} value
 * @param {React.ReactNode} footer
 * @param {string} valueColor
 */
export default function MetricCard({
  colorClass = 'metric-blue',
  title,
  icon,
  value,
  footer,
  valueColor
}) {
  return (
    <div className={`card metric-card ${colorClass}`}>
      <div className="metric-header">
        <span>{title}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <div
        className="metric-number"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      {footer && <div className="metric-footer">{footer}</div>}
    </div>
  );
}
