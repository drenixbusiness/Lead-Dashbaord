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

// Spend bands (left axis)
const SPEND_MAX    = 2000;
const SPEND_NORMAL = 1500;
const SPEND_MIN    = 1000;

// Hire rate bands (right axis)
const RATE_MAX    = 15;
const RATE_NORMAL = 7;
const RATE_MIN    = 4;

const REF_LABELS = ['Spend Max','Spend Normal','Spend Min','Rate Max','Rate Normal','Rate Min'];

export default function AdSpendChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);

  const chartData = {
    labels,
    datasets: [
      // ── Actual lines ───────────────────────────────────────────────
      {
        label: 'Ad spend ($)',
        data: data.map((r) => r.ad_spend_usd),
        borderColor: '#BA7517',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#BA7517',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        tension: 0.3,
        yAxisID: 'y',
        order: 1,
      },
      {
        label: 'Hire rate %',
        data: data.map((r) => r.hire_rate_pct),
        borderColor: '#534AB7',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        borderDash: [5, 4],
        pointRadius: 4,
        pointBackgroundColor: '#534AB7',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      },
      // ── Spend reference lines (y) ──────────────────────────────────
      {
        label: 'Spend Max',
        data: data.map(() => SPEND_MAX),
        borderColor: '#085041',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [8, 4],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y',
        order: 3,
      },
      {
        label: 'Spend Normal',
        data: data.map(() => SPEND_NORMAL),
        borderColor: '#1D9E75',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [8, 4],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y',
        order: 3,
      },
      {
        label: 'Spend Min',
        data: data.map(() => SPEND_MIN),
        borderColor: '#E24B4A',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [8, 4],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y',
        order: 3,
      },
      // ── Hire rate reference lines (y1) ─────────────────────────────
      {
        label: 'Rate Max',
        data: data.map(() => RATE_MAX),
        borderColor: '#085041',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [8, 4],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y1',
        order: 3,
      },
      {
        label: 'Rate Normal',
        data: data.map(() => RATE_NORMAL),
        borderColor: '#1D9E75',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [8, 4],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y1',
        order: 3,
      },
      {
        label: 'Rate Min',
        data: data.map(() => RATE_MIN),
        borderColor: '#E24B4A',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [8, 4],
        pointRadius: 0,
        tension: 0,
        yAxisID: 'y1',
        order: 3,
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
        filter: (item: TooltipItem<'line'>) => !REF_LABELS.includes(item.dataset.label ?? ''),
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const val = ctx.parsed.y ?? 0;
            if (ctx.dataset.label === 'Ad spend ($)')
              return ` Ad spend: $${Math.round(val).toLocaleString()}`;
            if (ctx.dataset.label === 'Hire rate %') {
              const hired = data[ctx.dataIndex]?.hired ?? 0;
              return ` Hire rate: ${val}% — ${hired} hired`;
            }
            return ` ${ctx.dataset.label}: ${val}`;
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            const row = data[idx];
            if (!row) return [];
            return [
              '',
              ` Spend bands: min $${SPEND_MIN.toLocaleString()} · norm $${SPEND_NORMAL.toLocaleString()} · max $${SPEND_MAX.toLocaleString()}`,
              ` Rate bands:  min ${RATE_MIN}% · norm ${RATE_NORMAL}% · max ${RATE_MAX}%`,
            ];
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
        min: 0,
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `$${Math.round(Number(v)).toLocaleString()}`,
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        min: 0,
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `${Math.round(Number(v))}%`,
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const LEGEND_ITEMS = [
    { color: '#BA7517', label: 'Ad spend ($)', dash: false, dot: true },
    { color: '#534AB7', label: 'Hire rate %', dash: true, dot: true },
    { color: '#085041', label: 'Max', dash: true, dot: false },
    { color: '#1D9E75', label: 'Normal', dash: true, dot: false },
    { color: '#E24B4A', label: 'Min', dash: true, dot: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Ad spend · hire rate
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Monthly spend &amp; hire rate vs max · normal · min bands
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <svg width="20" height="10" style={{ flexShrink: 0 }}>
              <line x1="0" y1="5" x2="20" y2="5" stroke={item.color} strokeWidth={item.dot ? 2 : 1.5} strokeDasharray={item.dash ? '6 3' : undefined} />
              {item.dot && <circle cx="10" cy="5" r="2.5" fill={item.color} stroke="#fff" strokeWidth="1" />}
            </svg>
            {item.label}
          </div>
        ))}
      </div>
      {/* Band reference summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        {[
          { metric: 'Spend', min: `$${SPEND_MIN.toLocaleString()}`, norm: `$${SPEND_NORMAL.toLocaleString()}`, max: `$${SPEND_MAX.toLocaleString()}` },
          { metric: 'Rate',  min: `${RATE_MIN}%`, norm: `${RATE_NORMAL}%`, max: `${RATE_MAX}%` },
        ].map((b) => (
          <div key={b.metric} style={{ fontSize: 10, background: 'rgba(0,0,0,0.03)', border: '0.5px solid #e5e7eb', borderRadius: 6, padding: '3px 10px' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>{b.metric}: </span>
            <span style={{ color: '#E24B4A', fontWeight: 600 }}>min {b.min}</span>
            <span style={{ color: '#6b7280' }}> · </span>
            <span style={{ color: '#1D9E75', fontWeight: 600 }}>norm {b.norm}</span>
            <span style={{ color: '#6b7280' }}> · </span>
            <span style={{ color: '#085041', fontWeight: 600 }}>max {b.max}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
