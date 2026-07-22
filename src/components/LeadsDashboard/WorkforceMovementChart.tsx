'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, PointElement, LineElement, Tooltip, Legend);

// Static data from HR sheet — update when new months are available
const DATA = [
  { month: 'Jan 2026', onboarded: 14, departed: 3,  headcount: 26 },
  { month: 'Feb 2026', onboarded: 13, departed: 5,  headcount: 33 },
  { month: 'Mar 2026', onboarded: 14, departed: 10, headcount: 32 },
  { month: 'Apr 2026', onboarded: 14, departed: 7,  headcount: 43 },
  { month: 'May 2026', onboarded: 15, departed: 24, headcount: 42 },
  { month: 'Jun 2026', onboarded: 13, departed: 9,  headcount: 45 },
];

const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'New Drivers', shape: 'bar' as const },
  { color: '#ef4444', label: 'Departed',    shape: 'bar' as const },
  { color: '#3b82f6', label: 'Active Headcount', shape: 'line' as const },
];

export default function WorkforceMovementChart() {
  const labels    = DATA.map(d => d.month.replace(' 2026', ''));
  const netChange = DATA[DATA.length - 1].headcount - DATA[0].headcount;

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'New Drivers',
        data: DATA.map(d => d.onboarded),
        backgroundColor: 'rgba(34,197,94,0.85)',
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Departed',
        data: DATA.map(d => -d.departed),
        backgroundColor: 'rgba(239,68,68,0.8)',
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Active Headcount',
        data: DATA.map(d => d.headcount),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
        yAxisID: 'y',
        order: 1,
        datalabels: { display: false },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar' | 'line'>) => {
            const v = ctx.parsed.y ?? 0;
            if (ctx.dataset.label === 'Departed') return `Departed: ${Math.abs(v)}`;
            return `${ctx.dataset.label}: ${v}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        stacked: false,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (v: string | number) => (typeof v === 'number' && v < 0 ? '' : String(v)),
        },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Workforce Movement</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            onboarding vs departures vs net headcount · Static data
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600,
          background: netChange >= 0 ? '#f0fdf4' : '#fef2f2',
          color: netChange >= 0 ? '#15803d' : '#dc2626',
          border: `1px solid ${netChange >= 0 ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 20, padding: '3px 10px',
        }}>
          {netChange >= 0 ? '▲' : '▼'} Net {Math.abs(netChange)} drivers Jan→Jun
        </div>
      </div>

      {/* Custom legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.shape === 'bar' ? (
              <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color }} />
            ) : (
              <div style={{ width: 18, height: 2, background: item.color, borderRadius: 1 }} />
            )}
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
}
