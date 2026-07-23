'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { DriverRecord } from '../../types/roster';
import { buildTenureFromRoster } from '../../utils/rosterMetrics';
import { valueLabelsPlugin } from '../../utils/chartValueLabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

export default function TenureDistributionChart({
  drivers,
  title = 'Tenure Distribution',
  subtitle = 'weeks since first load · active = until today · terminated = until exit',
}: {
  drivers: DriverRecord[];
  title?: string;
  subtitle?: string;
}) {
  const buckets = buildTenureFromRoster(drivers);
  const total = buckets.reduce((s, b) => s + b.count, 0);

  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>
        No roster data available
      </div>
    );
  }

  const dominant = buckets.reduce((a, b) => (b.count > a.count ? b : a));

  const chartData = {
    labels: buckets.map((b) => b.label),
    datasets: [
      {
        label: 'Drivers',
        data: buckets.map((b) => b.count),
        backgroundColor: buckets.map((b) => b.color),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 18 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.parsed.y ?? 0} drivers (${(((ctx.parsed.y ?? 0) / total) * 100).toFixed(0)}%)`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 10 },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600,
          background: '#eef2ff', color: '#4338ca',
          border: '1px solid #c7d2fe',
          borderRadius: 20, padding: '3px 10px',
        }}>
          {total} total tracked
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${buckets.length},1fr)`, gap: 8 }}>
        {buckets.map((b) => (
          <div key={b.label} style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4338ca', lineHeight: 1 }}>{b.count}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{b.label}</div>
            <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>
              {((b.count / total) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Bar data={chartData} options={options} plugins={[valueLabelsPlugin as never]} />
      </div>

      <div style={{
        background: '#eef2ff', border: '1px solid #c7d2fe',
        borderRadius: 8, padding: '8px 12px',
        fontSize: 11, color: '#4338ca', lineHeight: 1.5,
      }}>
        💡 <strong>{dominant.label}</strong> is the largest group ({dominant.count} drivers, {((dominant.count / total) * 100).toFixed(0)}% of total).
      </div>
    </div>
  );
}
