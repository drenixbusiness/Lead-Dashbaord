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

const FIXED_MAX        = 10;  // Our internal max target
const FIXED_MARKET_MAX = 5;   // Market avg max (external benchmark)
const FIXED_NORMAL     = 4;   // Our standard
const FIXED_LOW        = 3;   // Minimum acceptable

const LEGEND_ITEMS = [
  { color: '#085041', label: 'Max (10%)',            dash: [8, 3] },
  { color: '#F59E0B', label: 'Market avg max (5%)',  dash: [8, 3] },
  { color: '#1D9E75', label: 'Normal (4%)',          dash: [6, 3] },
  { color: '#E24B4A', label: 'Low (3%)',             dash: [6, 3] },
  { color: '#185FA5', label: 'Leads-only rate',      dash: null, thick: true, dot: true },
];

function computeStats(data: LeadsDataRow[]) {
  if (data.length === 0) return { avgRate: '0', aboveMarket: 0, aboveNormal: 0, belowLow: 0 };
  const rates = data.map((r) => (r.leads > 0 ? (r.hired_by_leads / r.leads) * 100 : 0));
  const avg = rates.reduce((s, v) => s + v, 0) / rates.length;
  return {
    avgRate: avg.toFixed(1),
    aboveMarket: rates.filter((v) => v >= FIXED_MARKET_MAX).length,
    aboveNormal: rates.filter((v) => v >= FIXED_NORMAL && v < FIXED_MARKET_MAX).length,
    belowLow:    rates.filter((v) => v < FIXED_LOW).length,
  };
}

export default function HireRateLeadsOnlyBandsChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);
  const leadsRate = data.map((r) =>
    r.leads > 0 ? Math.round((r.hired_by_leads / r.leads) * 1000) / 10 : 0
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
        borderWidth: 2,
        borderDash: [8, 3],
        pointRadius: 0,
        tension: 0,
      },
      {
        label: 'Market avg max',
        data: data.map(() => FIXED_MARKET_MAX),
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [8, 3],
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
          above: 'rgba(230,75,74,0.06)',
          below: 'rgba(230,75,74,0.06)',
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
        label: 'Leads-only rate',
        data: leadsRate,
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
            if (ctx.dataset.label === 'Leads-only rate')  return ` Leads hire rate: ${Number(val).toFixed(1)}%`;
            if (ctx.dataset.label === 'Max')              return ` Our max target: ${FIXED_MAX}%`;
            if (ctx.dataset.label === 'Market avg max')   return ` Market avg max: ${FIXED_MARKET_MAX}%`;
            if (ctx.dataset.label === 'Normal')           return ` Our standard: ${FIXED_NORMAL}%`;
            if (ctx.dataset.label === 'Low')              return ` Low threshold: ${FIXED_LOW}%`;
            return ` ${ctx.dataset.label}: ${val}%`;
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            const row = data[items[0]?.dataIndex ?? 0];
            if (!row) return [];
            return ['', ` Hired via leads: ${row.hired_by_leads}`, ` Total leads: ${row.leads}`];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { maxRotation: 45, font: { size: 10, family: '"Google Sans", Arial, sans-serif' } },
        grid: { color: 'rgba(8,80,65,0.08)', lineWidth: 1 },
      },
      y: {
        min: 0,
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `${Number(v).toFixed(1)}%`,
        },
        grid: { color: 'rgba(8,80,65,0.13)', lineWidth: 1 },
      },
    },
  };

  const pills = [
    { label: 'Avg leads hire rate',    value: `${stats.avgRate}%` },
    { label: 'Months above market max', value: String(stats.aboveMarket) },
    { label: 'Months at normal',        value: String(stats.aboveNormal) },
    { label: 'Months below low',        value: String(stats.belowLow) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Performance bands — hire rate (leads only)
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Max 10% · Market avg max 5% · Standard 4% · Low 3%
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <svg width="20" height="10" style={{ flexShrink: 0 }}>
              <line x1="0" y1="5" x2="20" y2="5"
                stroke={item.color}
                strokeWidth={item.thick ? 2.5 : 1.5}
                strokeDasharray={item.dash ? item.dash.join(' ') : undefined}
              />
              {item.dot && <circle cx="10" cy="5" r="3" fill={item.color} stroke="#fff" strokeWidth="1" />}
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
            flex: '1 1 110px',
            background: 'rgba(24,95,165,0.08)',
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
