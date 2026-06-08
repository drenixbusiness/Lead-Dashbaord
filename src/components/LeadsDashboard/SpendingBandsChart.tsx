'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { LeadsDataRow } from '../../types/leads';

ChartJS.register(CategoryScale, LinearScale, LineController, PointElement, LineElement, Filler, Tooltip, Legend);

// Fixed spend targets: $5/lead rate → 300 leads=$1,500 | 400 leads=$2,000 | 200 leads=$1,000
const FIXED_NORMAL = 1500;
const FIXED_HIGH = 2000;
const FIXED_LOW = 1000;

const LEGEND_ITEMS = [
  { color: '#085041', label: 'Max', dash: true },
  { color: '#1D9E75', label: 'Normal', dash: true },
  { color: '#E24B4A', label: 'Min', dash: true },
  { color: '#BA7517', label: 'Current', dash: false, thick: true, dot: true },
];

function computeStats(data: LeadsDataRow[]) {
  if (data.length === 0) return { avgSpend: 0, aboveNormal: 0, belowLow: 0, overBudget: 0 };
  const avgSpend = Math.round(data.reduce((s, r) => s + r.ad_spend_usd, 0) / data.length);
  const aboveNormal = data.filter((r) => r.ad_spend_usd > FIXED_NORMAL).length;
  const belowLow = data.filter((r) => r.ad_spend_usd < FIXED_LOW).length;
  const overBudget = data.filter((r) => r.ad_spend_usd > FIXED_HIGH).length;
  return { avgSpend, aboveNormal, belowLow, overBudget };
}

export default function SpendingBandsChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);
  const stats = computeStats(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Max',
        data: data.map(() => FIXED_HIGH),
        borderColor: '#085041',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
      },
      {
        label: 'Normal',
        data: data.map(() => FIXED_NORMAL),
        borderColor: '#1D9E75',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
        fill: {
          target: 2,
          above: 'rgba(230, 75, 74, 0.07)',
          below: 'rgba(230, 75, 74, 0.07)',
        },
      },
      {
        label: 'Min',
        data: data.map(() => FIXED_LOW),
        borderColor: '#E24B4A',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
      },
      {
        label: 'Current',
        data: data.map((r) => r.ad_spend_usd),
        borderColor: '#BA7517',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#BA7517',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        tension: 0.25,
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
          label: (ctx: TooltipItem<'line'>) => {
            const val = Math.round(ctx.parsed.y ?? 0);
            if (ctx.dataset.label === 'Current') return ` Current spend: $${val.toLocaleString()}`;
            if (ctx.dataset.label === 'Max') return ` Max budget: $${FIXED_HIGH.toLocaleString()} (400 leads)`;
            if (ctx.dataset.label === 'Normal') return ` Normal budget: $${FIXED_NORMAL.toLocaleString()} (300 leads)`;
            if (ctx.dataset.label === 'Min') return ` Min budget: $${FIXED_LOW.toLocaleString()} (200 leads)`;
            return ` ${ctx.dataset.label}: $${val.toLocaleString()}`;
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            if (!items.length) return [];
            const row = data[items[0].dataIndex];
            if (!row) return [];
            return ['', ` Leads: ${row.leads}`, ` Hired: ${row.hired} drivers`];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { maxRotation: 45, font: { size: 10, family: '"Google Sans", Arial, sans-serif' } },
        grid: { color: 'rgba(8, 80, 65, 0.08)', lineWidth: 1 },
      },
      y: {
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `$${Number(v).toLocaleString()}`,
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
      },
    },
  };

  const pills = [
    { label: 'Avg monthly spend', value: `$${stats.avgSpend.toLocaleString()}` },
    { label: 'Months above normal', value: String(stats.aboveNormal) },
    { label: 'Months below min', value: String(stats.belowLow) },
    { label: 'Months over max', value: String(stats.overBudget) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Performance bands — monthly spending vs targets
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Max $2,000 / Normal $1,500 / Min $1,000 + actual ad spend
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <svg width="18" height="10" style={{ flexShrink: 0 }}>
              <line
                x1="0" y1="5" x2="18" y2="5"
                stroke={item.color}
                strokeWidth={item.thick ? 2.5 : 1.5}
                strokeDasharray={item.dash ? '5 2' : undefined}
              />
              {item.dot && <circle cx="9" cy="5" r="3" fill={item.color} stroke="#fff" strokeWidth="1" />}
            </svg>
            {item.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {pills.map((pill) => (
          <div key={pill.label} style={{
            flex: '1 1 120px',
            background: 'rgba(186, 117, 23, 0.08)',
            border: '0.5px solid #e8d4a2',
            borderRadius: 8,
            padding: '6px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#BA7517', lineHeight: 1.2 }}>
              {pill.value}
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, lineHeight: 1.3 }}>
              {pill.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
