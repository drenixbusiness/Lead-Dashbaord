'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend);

// Static data until real source tracking is connected.
// hire_rate_pct = hired / leads_from_that_source * 100
const STATIC_DATA = [
  {
    month: 'Jan 2026',
    instagram: { leads: 120, hired: 6 },
    facebook: { leads: 90, hired: 3 },
    linkedin: { leads: 40, hired: 4 },
    indeed: { leads: 20, hired: 1 },
    referral: { leads: 10, hired: 1 },
  },
  {
    month: 'Feb 2026',
    instagram: { leads: 130, hired: 7 },
    facebook: { leads: 95, hired: 4 },
    linkedin: { leads: 45, hired: 5 },
    indeed: { leads: 22, hired: 1 },
    referral: { leads: 13, hired: 2 },
  },
  {
    month: 'Mar 2026',
    instagram: { leads: 145, hired: 8 },
    facebook: { leads: 100, hired: 4 },
    linkedin: { leads: 48, hired: 6 },
    indeed: { leads: 18, hired: 1 },
    referral: { leads: 9, hired: 2 },
  },
  {
    month: 'Apr 2026',
    instagram: { leads: 110, hired: 5 },
    facebook: { leads: 88, hired: 3 },
    linkedin: { leads: 50, hired: 5 },
    indeed: { leads: 25, hired: 2 },
    referral: { leads: 12, hired: 2 },
  },
  {
    month: 'May 2026',
    instagram: { leads: 135, hired: 7 },
    facebook: { leads: 92, hired: 4 },
    linkedin: { leads: 52, hired: 6 },
    indeed: { leads: 20, hired: 1 },
    referral: { leads: 11, hired: 2 },
  },
  {
    month: 'Jun 2026',
    instagram: { leads: 150, hired: 9 },
    facebook: { leads: 105, hired: 5 },
    linkedin: { leads: 55, hired: 7 },
    indeed: { leads: 22, hired: 2 },
    referral: { leads: 14, hired: 2 },
  },
];

const SOURCES = [
  { key: 'instagram' as const, label: 'Instagram', color: '#E1306C' },
  { key: 'facebook'  as const, label: 'Facebook',  color: '#1877F2' },
  { key: 'linkedin'  as const, label: 'LinkedIn',  color: '#0A66C2' },
  { key: 'indeed'    as const, label: 'Indeed',    color: '#2164f3' },
  { key: 'referral'  as const, label: 'Referral',  color: '#BA7517' },
];

function rate(leads: number, hired: number) {
  return leads > 0 ? Math.round((hired / leads) * 1000) / 10 : 0;
}

export default function HireRateBySourceChart() {
  const labels = STATIC_DATA.map((r) => r.month);

  const datasets = SOURCES.map((s) => ({
    type: 'bar' as const,
    label: s.label,
    data: STATIC_DATA.map((r) => rate(r[s.key].leads, r[s.key].hired)),
    backgroundColor: s.color,
    borderRadius: 3,
    barPercentage: 0.8,
    categoryPercentage: 0.85,
  }));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const src = SOURCES[ctx.datasetIndex];
            const row = STATIC_DATA[ctx.dataIndex];
            if (!src || !row) return '';
            const { leads, hired } = row[src.key];
            return ` ${src.label}: ${(ctx.parsed.y ?? 0).toFixed(1)}%  (${hired} hired / ${leads} leads)`;
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
          callback: (v: number | string) => `${Number(v).toFixed(0)}%`,
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
        title: {
          display: true,
          text: 'Hire rate %',
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          color: '#6b7280',
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
            Hire rate by source
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#BA7517',
            background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.25)',
            borderRadius: 4, padding: '1px 6px',
          }}>
            Static data
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          % of leads from each source that resulted in a hire — hover for counts
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {SOURCES.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Chart type="bar" data={{ labels, datasets }} options={options} />
      </div>
    </div>
  );
}
