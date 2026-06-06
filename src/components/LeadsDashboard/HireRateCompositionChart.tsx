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

const COLORS = {
  leads: '#1D9E75',
  leadbase: '#185FA5',
  referral: '#BA7517',
  rate: '#534AB7',
};

const LEGEND_ITEMS = [
  { color: COLORS.leads, label: 'Share from Leads', shape: 'bar' },
  { color: COLORS.leadbase, label: 'Share from Lead Base', shape: 'bar' },
  { color: COLORS.referral, label: 'Share from Referral', shape: 'bar' },
  { color: COLORS.rate, label: 'Overall hire rate %', shape: 'line' },
];

function sharePct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export default function HireRateCompositionChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Share from Leads',
        data: data.map((r) => sharePct(r.hired_by_leads, r.hired)),
        backgroundColor: COLORS.leads,
        borderRadius: 3,
        stack: 'share',
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Share from Lead Base',
        data: data.map((r) => sharePct(r.hired_by_leadbase, r.hired)),
        backgroundColor: COLORS.leadbase,
        borderRadius: 3,
        stack: 'share',
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Share from Referral',
        data: data.map((r) => sharePct(r.hired_by_referral, r.hired)),
        backgroundColor: COLORS.referral,
        borderRadius: 3,
        stack: 'share',
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Overall hire rate %',
        data: data.map((r) => r.hire_rate_pct),
        borderColor: COLORS.rate,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        pointBackgroundColor: COLORS.rate,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
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
            const label = ctx.dataset.label;
            const val = ctx.parsed.y ?? 0;
            if (label === 'Overall hire rate %') return ` Overall hire rate: ${val}% (of all leads)`;
            return ` ${label?.replace('Share ', '')}: ${val}% of that month's hires`;
          },
          footer: (items: TooltipItem<'bar' | 'line'>[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            const hired = data[idx]?.hired ?? 0;
            const leads = data[idx]?.leads ?? 0;
            return hired > 0 ? ` ${hired} hired from ${leads} leads that month` : '';
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
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `${Math.round(Number(v))}%`,
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
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Hiring rate composition per month
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Not lead volume — how each month&apos;s hires split by source (%), and the overall lead → hire rate
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            {item.shape === 'bar' ? (
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: item.color }} />
            ) : (
              <span style={{ display: 'inline-block', width: 16, height: 2, background: item.color, borderRadius: 1 }} />
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
