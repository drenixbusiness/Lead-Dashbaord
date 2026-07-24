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
import type { DriverRecord } from '../../types/roster';
import {
  buildMovementFromRoster,
  MOVEMENT_YEAR_KEYS,
  movementNiceScale,
  movementYearNote,
} from '../../utils/rosterMetrics';
import { valueLabelsPlugin } from '../../utils/chartValueLabels';

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, PointElement, LineElement, Tooltip, Legend);

const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'New Drivers', shape: 'bar' as const },
  { color: '#ef4444', label: 'Departed',    shape: 'bar' as const },
  { color: '#3b82f6', label: 'Active Headcount', shape: 'line' as const },
];

function ceilToStep(n: number, step = 5): number {
  if (n <= 0) return step;
  return Math.ceil(n / step) * step;
}

export default function WorkforceMovementChart({
  drivers,
  title = 'Workforce Movement',
  subtitle = 'onboarding vs departures vs net headcount · from local roster',
  alignToMonthKeys = MOVEMENT_YEAR_KEYS,
  yMax,
  yMin,
}: {
  drivers: DriverRecord[];
  title?: string;
  subtitle?: string;
  alignToMonthKeys?: string[];
  /** Shared Y max (steps of 5) — used on BP-style HR grid */
  yMax?: number;
  yMin?: number;
}) {
  const data = buildMovementFromRoster(drivers, new Date(), {
    alignToMonthKeys,
  });

  const hasAny = data.some((d) => d.onboarded != null || d.departed != null || d.headcount != null);
  if (!hasAny) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>
        No roster data available
      </div>
    );
  }

  const labels = data.map((d) => d.month);
  const yearNote = movementYearNote(data.map((d) => d.monthKey));

  const local = movementNiceScale(data);
  const axisMax = yMax ?? ceilToStep(local.max, 5);
  const axisMin = yMin ?? -ceilToStep(local.max, 5);
  const step = yMax != null ? 5 : (local.step >= 5 ? 5 : local.step);

  const totalJoined = data.reduce((s, d) => s + (d.onboarded ?? 0), 0);
  const totalLeft = data.reduce((s, d) => s + (d.departed ?? 0), 0);
  const net = totalJoined - totalLeft;

  const withData = data.filter((d) => d.headcount != null || d.onboarded != null);
  const rangeLabel = withData.length > 1
    ? `${withData[0].month}→${withData[withData.length - 1].month}`
    : withData[0]?.month ?? '';

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'New Drivers',
        data: data.map((d) => d.onboarded),
        backgroundColor: 'rgba(34,197,94,0.85)',
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Departed',
        data: data.map((d) => (d.departed == null ? null : -d.departed)),
        backgroundColor: 'rgba(239,68,68,0.8)',
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Active Headcount',
        data: data.map((d) => d.headcount),
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: data.map((d) => (d.headcount == null ? 0 : 5)),
        pointHoverRadius: data.map((d) => (d.headcount == null ? 0 : 6)),
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
        spanGaps: false,
        yAxisID: 'y',
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 18, bottom: 8 } },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: (item: TooltipItem<'bar' | 'line'>) => item.parsed.y != null,
        callbacks: {
          title: (items: TooltipItem<'bar' | 'line'>[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            const row = data[idx];
            return row ? `${row.month} ${row.year}` : '';
          },
          label: (ctx: TooltipItem<'bar' | 'line'>) => {
            const v = ctx.parsed.y;
            if (v == null) return '';
            if (ctx.dataset.label === 'Departed') return `Departed: ${Math.abs(v)}`;
            return `${ctx.dataset.label}: ${v}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        stacked: false,
        min: axisMin,
        max: axisMax,
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          stepSize: step,
          callback: (v: string | number) => {
            const n = Number(v);
            if (!Number.isFinite(n) || n < 0) return '';
            return String(n);
          },
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {yearNote && (
            <div style={{
              fontSize: 11, fontWeight: 700,
              background: '#eff6ff', color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: 20, padding: '3px 10px',
            }}>
              {yearNote}
            </div>
          )}
          <div style={{
            fontSize: 11, fontWeight: 600,
            background: net >= 0 ? '#f0fdf4' : '#fef2f2',
            color: net >= 0 ? '#15803d' : '#dc2626',
            border: `1px solid ${net >= 0 ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 20, padding: '3px 10px',
          }}>
            {net >= 0 ? '▲' : '▼'} Net {Math.abs(net)} drivers {rangeLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.shape === 'bar' ? (
              <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color }} />
            ) : (
              <div style={{ width: 18, height: 2, background: item.color, borderRadius: 1 }} />
            )}
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Chart type="bar" data={chartData} options={options} plugins={[valueLabelsPlugin as never]} />
      </div>
    </div>
  );
}
