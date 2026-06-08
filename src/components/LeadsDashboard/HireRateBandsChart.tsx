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

// Fixed hire rate targets (%) — standard hire rate from leads only is 3%
const FIXED_NORMAL = 3;
const FIXED_HIGH = 5;
const FIXED_LOW = 1.5;

const LEGEND_ITEMS = [
  { color: '#085041', label: 'High', dash: true },
  { color: '#1D9E75', label: 'Normal', dash: true },
  { color: '#E24B4A', label: 'Low', dash: true },
  { color: '#534AB7', label: 'Current', dash: false, thick: true, dot: true },
];

function computeStats(data: LeadsDataRow[]) {
  if (data.length === 0) return { avgRate: 0, aboveNormal: 0, belowLow: 0 };
  const avgRate = Math.round((data.reduce((s, r) => s + r.hire_rate_pct, 0) / data.length) * 10) / 10;
  const aboveNormal = data.filter((r) => r.hire_rate_pct > FIXED_NORMAL).length;
  const belowLow = data.filter((r) => r.hire_rate_pct < FIXED_LOW).length;
  return { avgRate, aboveNormal, belowLow };
}

export default function HireRateBandsChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);
  const stats = computeStats(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'High',
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
        label: 'Low',
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
        data: data.map((r) => r.hire_rate_pct),
        borderColor: '#534AB7',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#534AB7',
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
            const val = ctx.parsed.y ?? 0;
            if (ctx.dataset.label === 'Current') return ` Current hire rate: ${val.toFixed(1)}%`;
            if (ctx.dataset.label === 'High') return ` High target: ${FIXED_HIGH}% (max)`;
            if (ctx.dataset.label === 'Normal') return ` Normal target: ${FIXED_NORMAL}% (standard)`;
            if (ctx.dataset.label === 'Low') return ` Low target: ${FIXED_LOW}% (min)`;
            return ` ${ctx.dataset.label}: ${val}%`;
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            if (!items.length) return [];
            const row = data[items[0].dataIndex];
            if (!row) return [];
            return ['', ` Hired: ${row.hired} drivers`, ` Total leads: ${row.leads}`];
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
          callback: (v: number | string) => `${Number(v).toFixed(1)}%`,
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
      },
    },
  };

  const pills = [
    { label: 'Avg hire rate', value: `${stats.avgRate}%` },
    { label: 'Months above normal', value: String(stats.aboveNormal) },
    { label: 'Months below low', value: String(stats.belowLow) },
    { label: 'Standard rate (leads)', value: `${FIXED_NORMAL}%` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Performance bands — monthly hire rate vs targets
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          High / Normal / Low thresholds + actual hire rate performance
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
            background: 'rgba(83, 74, 183, 0.08)',
            border: '0.5px solid #c5c2f0',
            borderRadius: 8,
            padding: '6px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#534AB7', lineHeight: 1.2 }}>
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
