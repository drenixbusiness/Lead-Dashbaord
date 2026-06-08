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
import type { LeadsDataRow } from '../../types/leads';

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, PointElement, LineElement, Tooltip, Legend);

const SOURCE_COLORS = {
  leads: '#1D9E75',
  leadbase: '#185FA5',
  referral: '#BA7517',
  leadsRate: '#085041',
  overallRate: '#534AB7',
};

const LEGEND_ITEMS = [
  { color: SOURCE_COLORS.leads, label: 'Leads', shape: 'bar' },
  { color: SOURCE_COLORS.leadbase, label: 'Lead Base', shape: 'bar' },
  { color: SOURCE_COLORS.referral, label: 'Referral', shape: 'bar' },
  { color: SOURCE_COLORS.leadsRate, label: 'Leads hire rate %', shape: 'line', dash: true },
  { color: SOURCE_COLORS.overallRate, label: 'Overall hire rate %', shape: 'line', dash: false },
];

function sharePct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export default function HiresBySourceChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Leads',
        data: data.map((r) => r.hired_by_leads),
        backgroundColor: SOURCE_COLORS.leads,
        borderRadius: 3,
        stack: 'hires',
        yAxisID: 'y',
        order: 3,
      },
      {
        type: 'bar' as const,
        label: 'Lead Base',
        data: data.map((r) => r.hired_by_leadbase),
        backgroundColor: SOURCE_COLORS.leadbase,
        borderRadius: 3,
        stack: 'hires',
        yAxisID: 'y',
        order: 3,
      },
      {
        type: 'bar' as const,
        label: 'Referral',
        data: data.map((r) => r.hired_by_referral),
        backgroundColor: SOURCE_COLORS.referral,
        borderRadius: 3,
        stack: 'hires',
        yAxisID: 'y',
        order: 3,
      },
      {
        type: 'line' as const,
        label: 'Leads hire rate %',
        data: data.map((r) => (r.leads > 0 ? Math.round((r.hired_by_leads / r.leads) * 1000) / 10 : 0)),
        borderColor: SOURCE_COLORS.leadsRate,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        pointBackgroundColor: SOURCE_COLORS.leadsRate,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      },
      {
        type: 'line' as const,
        label: 'Overall hire rate %',
        data: data.map((r) => r.hire_rate_pct),
        borderColor: SOURCE_COLORS.overallRate,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: SOURCE_COLORS.overallRate,
        tension: 0.3,
        yAxisID: 'y1',
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
        callbacks: {
          label: (ctx: TooltipItem<'bar' | 'line'>) => {
            const label = ctx.dataset.label ?? '';
            const val = ctx.parsed.y ?? 0;
            if (label === 'Leads hire rate %') return ` Leads hire rate: ${Number(val).toFixed(1)}%`;
            if (label === 'Overall hire rate %') return ` Overall hire rate: ${Number(val).toFixed(1)}%`;
            // bars: show count + share %
            const idx = ctx.dataIndex;
            const row = data[idx];
            const total = row ? row.hired : 0;
            const pct = sharePct(Number(val), total);
            return ` ${label}: ${val} hired (${pct}% of month's hires)`;
          },
          footer: (items: TooltipItem<'bar' | 'line'>[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            const row = data[idx];
            if (!row) return '';
            const total = row.hired_by_leads + row.hired_by_leadbase + row.hired_by_referral;
            return ` Total hired: ${total}  |  Total leads: ${row.leads}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { maxRotation: 45, font: { size: 10, family: '"Google Sans", Arial, sans-serif' } },
        grid: { color: 'rgba(8, 80, 65, 0.08)', lineWidth: 1 },
      },
      y: {
        stacked: true,
        type: 'linear' as const,
        position: 'left' as const,
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => Math.round(Number(v)),
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
        title: {
          display: true,
          text: 'Hires (count)',
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          color: '#6b7280',
        },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `${Number(v).toFixed(1)}%`,
        },
        grid: { drawOnChartArea: false },
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
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Hires by source — count &amp; hire rate per month
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Monthly hires per source (bars = count, hover for %) + leads-only &amp; overall hire rate lines
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            {item.shape === 'bar' ? (
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: item.color }} />
            ) : (
              <svg width="18" height="10" style={{ flexShrink: 0 }}>
                <line
                  x1="0" y1="5" x2="18" y2="5"
                  stroke={item.color}
                  strokeWidth="2"
                  strokeDasharray={item.dash ? '5 3' : undefined}
                />
                <circle cx="9" cy="5" r="2.5" fill={item.color} />
              </svg>
            )}
            {item.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
}
