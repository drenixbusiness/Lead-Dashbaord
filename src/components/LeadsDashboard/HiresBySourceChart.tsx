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
  rate: '#534AB7',
  totalLeads: '#9FE1CB',
};

const LEGEND_ITEMS = [
  { color: SOURCE_COLORS.leads, label: 'Leads', shape: 'bar' },
  { color: SOURCE_COLORS.leadbase, label: 'Lead Base', shape: 'bar' },
  { color: SOURCE_COLORS.referral, label: 'Referral', shape: 'bar' },
  { color: SOURCE_COLORS.totalLeads, label: 'Total leads', shape: 'line' },
  { color: SOURCE_COLORS.rate, label: 'Hire rate %', shape: 'line' },
];

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
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Lead Base',
        data: data.map((r) => r.hired_by_leadbase),
        backgroundColor: SOURCE_COLORS.leadbase,
        borderRadius: 3,
        stack: 'hires',
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Referral',
        data: data.map((r) => r.hired_by_referral),
        backgroundColor: SOURCE_COLORS.referral,
        borderRadius: 3,
        stack: 'hires',
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Total leads',
        data: data.map((r) => r.leads),
        borderColor: SOURCE_COLORS.totalLeads,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: SOURCE_COLORS.totalLeads,
        tension: 0.3,
        yAxisID: 'y2',
        order: 3,
      },
      {
        type: 'line' as const,
        label: 'Hire rate %',
        data: data.map((r) => r.hire_rate_pct),
        borderColor: SOURCE_COLORS.rate,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        pointBackgroundColor: SOURCE_COLORS.rate,
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
            const val = Math.round(ctx.parsed.y ?? 0);
            if (label === 'Hire rate %') return ` Hire rate: ${val}%`;
            if (label === 'Total leads') return ` Total leads: ${val}`;
            return ` Hired via ${label}: ${val}`;
          },
          footer: (items: TooltipItem<'bar' | 'line'>[]) => {
            const total = items
              .filter((item) => item.dataset.type === 'bar')
              .reduce((s, item) => s + (Number(item.parsed.y) || 0), 0);
            return total > 0 ? ` Total hired: ${total}` : '';
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
          Hires by source per month
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Where hired drivers come from (Leads · Lead Base · Referral) against monthly lead volume and hire rate
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
