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

const LEGEND_ITEMS = [
  { color: '#534AB7', label: 'Overall cost per hire', dash: false, thick: true, dot: true },
];

export default function OverallCostPerHireChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);
  // Overall CPH: ad_spend ÷ total hired (all sources)
  const cphData = data.map((r) =>
    r.hired > 0 ? Math.round(r.ad_spend_usd / r.hired) : 0
  );
  const validCph = cphData.filter((v) => v > 0);
  const avgCph = validCph.length > 0 ? Math.round(validCph.reduce((s, v) => s + v, 0) / validCph.length) : 0;
  const minCph = validCph.length > 0 ? Math.min(...validCph) : 0;
  const maxCph = validCph.length > 0 ? Math.max(...validCph) : 0;
  const bestMonth = validCph.length > 0 ? data[cphData.indexOf(minCph)]?.month ?? '-' : '-';

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Overall CPH',
        data: cphData,
        borderColor: '#534AB7',
        backgroundColor: 'rgba(83, 74, 183, 0.08)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#534AB7',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        tension: 0.25,
        fill: 'origin',
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
            return ` Overall cost per hire: $${val.toLocaleString()}`;
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            if (!items.length) return [];
            const row = data[items[0].dataIndex];
            if (!row) return [];
            return [
              '',
              ` Ad spend: $${row.ad_spend_usd.toLocaleString()}`,
              ` Total hired: ${row.hired} (Leads: ${row.hired_by_leads}, LB: ${row.hired_by_leadbase}, Ref: ${row.hired_by_referral})`,
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
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `$${Number(v).toLocaleString()}`,
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
      },
    },
  };

  const pills = [
    { label: 'Avg overall CPH', value: `$${avgCph.toLocaleString()}` },
    { label: 'Best month', value: bestMonth },
    { label: 'Best CPH', value: `$${minCph.toLocaleString()}` },
    { label: 'Worst CPH', value: `$${maxCph.toLocaleString()}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Monthly cost per hire — overall (all sources)
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Ad spend ÷ total drivers hired each month (Leads + Lead Base + Referral)
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
            background: 'rgba(83, 74, 183, 0.07)',
            border: '0.5px solid #c5c2f0',
            borderRadius: 8,
            padding: '6px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#534AB7', lineHeight: 1.2 }}>{pill.value}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, lineHeight: 1.3 }}>{pill.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
