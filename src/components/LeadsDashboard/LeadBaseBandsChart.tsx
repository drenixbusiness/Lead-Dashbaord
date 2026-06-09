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

// Lead Base hire rate targets (hired_by_leadbase ÷ leads)
const FIXED_MAX = 5;       // max
const FIXED_NORMAL = 2;    // standard
const FIXED_LOW = 1;       // min

const LEGEND_ITEMS = [
  { color: '#085041', label: 'Max (5%)', dash: true },
  { color: '#1D9E75', label: 'Normal (2%)', dash: true },
  { color: '#E24B4A', label: 'Low (1%)', dash: true },
  { color: '#185FA5', label: 'Lead Base rate', dash: false, thick: true, dot: true },
];

function computeStats(data: LeadsDataRow[]) {
  if (data.length === 0) return { avgRate: '0', aboveNormal: 0, belowLow: 0, atMax: 0 };
  const rates = data.map((r) => (r.leads > 0 ? (r.hired_by_leadbase / r.leads) * 100 : 0));
  const avgRate = (rates.reduce((s, v) => s + v, 0) / rates.length).toFixed(1);
  const aboveNormal = rates.filter((v) => v > FIXED_NORMAL).length;
  const belowLow = rates.filter((v) => v < FIXED_LOW).length;
  const atMax = rates.filter((v) => v >= FIXED_MAX).length;
  return { avgRate, aboveNormal, belowLow, atMax };
}

export default function LeadBaseBandsChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);
  const lbRate = data.map((r) =>
    r.leads > 0 ? Math.round((r.hired_by_leadbase / r.leads) * 1000) / 10 : 0
  );
  const stats = computeStats(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Max',
        data: data.map(() => FIXED_MAX),
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
        label: 'Lead Base rate',
        data: lbRate,
        borderColor: '#185FA5',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#185FA5',
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
            if (ctx.dataset.label === 'Lead Base rate') return ` Lead Base hire rate: ${Number(val).toFixed(1)}%`;
            if (ctx.dataset.label === 'Max') return ` Max: ${FIXED_MAX}%`;
            if (ctx.dataset.label === 'Normal') return ` Normal: ${FIXED_NORMAL}% (standard)`;
            if (ctx.dataset.label === 'Low') return ` Low: ${FIXED_LOW}% (min)`;
            return ` ${ctx.dataset.label}: ${val}%`;
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            if (!items.length) return [];
            const row = data[items[0].dataIndex];
            if (!row) return [];
            return ['', ` Hired via Lead Base: ${row.hired_by_leadbase}`, ` Total leads: ${row.leads}`];
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
    { label: 'Avg Lead Base rate', value: `${stats.avgRate}%` },
    { label: 'Months above normal', value: String(stats.aboveNormal) },
    { label: 'Months below low', value: String(stats.belowLow) },
    { label: 'Months at max', value: String(stats.atMax) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Performance bands — hire rate (Lead Base) vs targets
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Max 5% / Normal 2% / Low 1% + actual hire rate from Lead Base
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <svg width="18" height="10" style={{ flexShrink: 0 }}>
              <line x1="0" y1="5" x2="18" y2="5" stroke={item.color} strokeWidth={item.thick ? 2.5 : 1.5} strokeDasharray={item.dash ? '5 2' : undefined} />
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
            background: 'rgba(24, 95, 165, 0.08)',
            border: '0.5px solid #b8d4f0',
            borderRadius: 8,
            padding: '6px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#185FA5', lineHeight: 1.2 }}>{pill.value}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, lineHeight: 1.3 }}>{pill.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
