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

const LEGEND_ITEMS = [
  { color: '#9FE1CB', label: 'Leads', shape: 'bar' },
  { color: '#534AB7', label: 'Hire rate %', shape: 'line' },
];

export default function LeadsHireRateChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Leads',
        data: data.map((r) => r.leads),
        backgroundColor: '#9FE1CB',
        borderRadius: 3,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Hire rate %',
        data: data.map((r) => r.hire_rate_pct),
        borderColor: '#534AB7',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#534AB7',
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
            if (ctx.dataset.label === 'Hire rate %') {
              const val = Number(ctx.parsed.y ?? 0).toFixed(1);
              const hired = data[ctx.dataIndex]?.hired ?? 0;
              return ` Hire rate: ${val}% (${hired} hired)`;
            }
            return ` Leads: ${Math.round(ctx.parsed.y ?? 0)}`;
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
          callback: (v: number | string) => Math.round(Number(v)),
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        ticks: {
          font: { size: 10, family: '"Google Sans", Arial, sans-serif' },
          callback: (v: number | string) => `${Number(v).toFixed(1)}%`,
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Leads &amp; hire rate per month
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Leads received · % of drivers hired
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
