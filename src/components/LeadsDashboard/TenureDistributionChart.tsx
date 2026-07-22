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

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

// Static data from HR sheet
const BUCKETS = [
  { label: '1–4 wks',  count: 37, color: 'rgba(99,102,241,0.85)'  },
  { label: '5–8 wks',  count: 16, color: 'rgba(99,102,241,0.65)'  },
  { label: '9–16 wks', count: 24, color: 'rgba(99,102,241,0.85)'  },
  { label: '17–24 wks',count: 17, color: 'rgba(99,102,241,0.65)'  },
];

const TOTAL = BUCKETS.reduce((s, b) => s + b.count, 0);

export default function TenureDistributionChart() {
  const dominant = BUCKETS.reduce((a, b) => b.count > a.count ? b : a);

  const chartData = {
    labels: BUCKETS.map(b => b.label),
    datasets: [
      {
        label: 'Drivers',
        data: BUCKETS.map(b => b.count),
        backgroundColor: BUCKETS.map(b => b.color),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.parsed.y ?? 0} drivers (${(((ctx.parsed.y ?? 0) / TOTAL) * 100).toFixed(0)}%)`,
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Tenure Distribution</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            how long drivers stay active · Static data
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600,
          background: '#eef2ff', color: '#4338ca',
          border: '1px solid #c7d2fe',
          borderRadius: 20, padding: '3px 10px',
        }}>
          {TOTAL} total tracked
        </div>
      </div>

      {/* Bucket summary pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {BUCKETS.map(b => (
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
              {((b.count / TOTAL) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Bar data={chartData} options={options} />
      </div>

      {/* Insight note */}
      <div style={{
        background: '#eef2ff', border: '1px solid #c7d2fe',
        borderRadius: 8, padding: '8px 12px',
        fontSize: 11, color: '#4338ca', lineHeight: 1.5,
      }}>
        💡 <strong>{dominant.label}</strong> is the largest group ({dominant.count} drivers, {((dominant.count / TOTAL) * 100).toFixed(0)}% of total) — most drivers churn or transition quickly after onboarding.
      </div>
    </div>
  );
}
