'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { LeadsDataRow } from '../../types/leads';

ChartJS.register(CategoryScale, LinearScale, LineController, PointElement, LineElement, Tooltip, Legend);

// Reference levels — spend axis only
const SPEND_MAX = 2000;
const SPEND_NORMAL = 1500;
const SPEND_MIN = 1000;

const LEGEND_ITEMS = [
  { color: '#BA7517', label: 'Ad spend ($)', dash: false, dot: true },
  { color: '#1D9E75', label: 'Leads', dash: false, dot: true },
  { color: '#534AB7', label: 'Hire rate %', dash: true, dot: true },
  { color: 'rgba(186,117,23,0.55)', label: 'Spend bands', dash: true, dot: false },
];

export default function AdSpendChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);

  const chartData = {
    labels,
    datasets: [
      // ── Actual data lines ──────────────────────────────────────────
      {
        label: 'Ad spend ($)',
        data: data.map((r) => r.ad_spend_usd),
        borderColor: '#BA7517',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#BA7517',
        tension: 0.3,
        yAxisID: 'y',
        order: 1,
      },
      {
        label: 'Leads',
        data: data.map((r) => r.leads),
        borderColor: '#1D9E75',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#1D9E75',
        tension: 0.3,
        yAxisID: 'y2',
        order: 1,
      },
      {
        label: 'Hire rate %',
        data: data.map((r) => r.hire_rate_pct),
        borderColor: '#534AB7',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        pointBackgroundColor: '#534AB7',
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      },
      // ── Spend reference lines (y) ──────────────────────────────────
      {
        label: 'Spend Max',
        data: data.map(() => SPEND_MAX),
        borderColor: 'rgba(186,117,23,0.45)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y',
        order: 2,
      },
      {
        label: 'Spend Normal',
        data: data.map(() => SPEND_NORMAL),
        borderColor: 'rgba(186,117,23,0.65)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y',
        order: 2,
      },
      {
        label: 'Spend Min',
        data: data.map(() => SPEND_MIN),
        borderColor: 'rgba(186,117,23,0.45)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y',
        order: 2,
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
        filter: (item: TooltipItem<'line'>) => {
          const refLabels = ['Spend Max', 'Spend Normal', 'Spend Min'];
          return !refLabels.includes(item.dataset.label ?? '');
        },
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const val = Math.round(ctx.parsed.y ?? 0);
            if (ctx.dataset.label === 'Ad spend ($)') return ` Ad spend: $${val.toLocaleString()} (normal $${SPEND_NORMAL.toLocaleString()})`;
            if (ctx.dataset.label === 'Hire rate %') {
              const hired = data[ctx.dataIndex]?.hired ?? 0;
              return ` Hire rate: ${val}% — ${hired} hired`;
            }
            return ` Leads: ${val}`;
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
        type: 'linear' as const,
        position: 'left' as const,
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `$${Math.round(Number(v)).toLocaleString()}`,
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `${Math.round(Number(v))}%`,
        },
        grid: { drawOnChartArea: false },
      },
      y2: {
        type: 'linear' as const,
        display: false,
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Ad spend · leads · hire rate
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Monthly spend / leads / hire rate with normal · max · min reference bands per metric
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <svg width="18" height="10" style={{ flexShrink: 0 }}>
              <line x1="0" y1="5" x2="18" y2="5" stroke={item.color} strokeWidth="2" strokeDasharray={item.dash ? '5 3' : undefined} />
              {item.dot && <circle cx="9" cy="5" r="2.5" fill={item.color} />}
            </svg>
            {item.label}
          </div>
        ))}
      </div>
      {/* Spend band reference */}
      <div style={{ marginBottom: 8, fontSize: 10, color: '#6b7280' }}>
        <span style={{ color: '#E24B4A', fontWeight: 600 }}>Min ${SPEND_MIN.toLocaleString()}</span>
        {' · '}
        <span style={{ color: '#1D9E75', fontWeight: 600 }}>Normal ${SPEND_NORMAL.toLocaleString()}</span>
        {' · '}
        <span style={{ color: '#085041', fontWeight: 600 }}>Max ${SPEND_MAX.toLocaleString()}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
