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

const LEGEND_ITEMS = [
  { color: '#BA7517', label: 'Ad spend ($)', dash: false },
  { color: '#1D9E75', label: 'Leads', dash: false },
  { color: '#534AB7', label: 'Hire rate %', dash: true },
];

export default function AdSpendChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ad spend ($)',
        data: data.map((r) => r.ad_spend_usd),
        borderColor: '#BA7517',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#BA7517',
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Leads',
        data: data.map((r) => r.leads),
        borderColor: '#1D9E75',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#1D9E75',
        tension: 0.3,
        yAxisID: 'y2',
      },
      {
        label: 'Hire rate %',
        data: data.map((r) => r.hire_rate_pct),
        borderColor: '#534AB7',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        pointBackgroundColor: '#534AB7',
        tension: 0.3,
        yAxisID: 'y1',
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
            if (ctx.dataset.label === 'Ad spend ($)') return ` Ad spend: $${val.toLocaleString()}`;
            if (ctx.dataset.label === 'Hire rate %') {
              const hired = data[ctx.dataIndex]?.hired ?? 0;
              return ` Hire rate: ${val}% (${hired} hired)`;
            }
            return ` Leads: ${val}`;
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
          Ad spend · leads · hire rate
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Monthly spend ($) vs leads vs % hired
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <svg width="18" height="10" style={{ flexShrink: 0 }}>
              <line
                x1="0" y1="5" x2="18" y2="5"
                stroke={item.color}
                strokeWidth="2"
                strokeDasharray={item.dash ? '5 3' : undefined}
              />
              <circle cx="9" cy="5" r="2.5" fill={item.color} />
            </svg>
            {item.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
