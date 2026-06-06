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
  { color: '#085041', label: 'High', dash: true },
  { color: '#1D9E75', label: 'Normal', dash: true },
  { color: '#E24B4A', label: 'Low', dash: true },
  { color: '#185FA5', label: 'Current', dash: false, thick: true, dot: true },
];

function computeStats(data: LeadsDataRow[]) {
  if (data.length === 0) return { avgLeads: 0, aboveNormal: 0, belowLow: 0, budgetCorrections: 0 };
  const avgLeads = Math.round(data.reduce((s, r) => s + r.leads, 0) / data.length);
  const aboveNormal = data.filter((r) => r.leads > r.normal_band).length;
  const belowLow = data.filter((r) => r.leads < r.low_band).length;
  const avgSpend = data.reduce((s, r) => s + r.ad_spend_usd, 0) / data.length;
  const budgetCorrections = data.filter((r) => r.ad_spend_usd > avgSpend * 1.1).length;
  return { avgLeads, aboveNormal, belowLow, budgetCorrections };
}

export default function PerformanceBandsChart({ data }: { data: LeadsDataRow[] }) {
  const labels = data.map((r) => r.month);
  const stats = computeStats(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'High',
        data: data.map((r) => r.high_band),
        borderColor: '#085041',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
      },
      {
        // normal_band — also fills down to low_band (index 2)
        label: 'Normal',
        data: data.map((r) => r.normal_band),
        borderColor: '#1D9E75',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
        fill: {
          target: 2, // fill toward low_band (dataset index 2)
          above: 'rgba(230, 75, 74, 0.07)',
          below: 'rgba(230, 75, 74, 0.07)',
        },
      },
      {
        label: 'Low',
        data: data.map((r) => r.low_band),
        borderColor: '#E24B4A',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0,
      },
      {
        label: 'Current',
        data: data.map((r) => r.leads),
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
            const val = Math.round(ctx.parsed.y ?? 0);
            if (ctx.dataset.label === 'Current') return ` Current leads: ${val}`;
            return ` ${ctx.dataset.label} target: ${val}`;
          },
          afterBody: (items: TooltipItem<'line'>[]) => {
            if (!items.length) return [];
            const row = data[items[0].dataIndex];
            if (!row) return [];
            return [
              '',
              ` Hired: ${row.hired} drivers (${row.hire_rate_pct}%)`,
              ` Ad spend: $${row.ad_spend_usd.toLocaleString()}`,
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
          callback: (v: number | string) => Math.round(Number(v)),
        },
        grid: { color: 'rgba(8, 80, 65, 0.13)', lineWidth: 1 },
      },
    },
  };

  const pills = [
    { label: 'Avg monthly leads', value: stats.avgLeads.toLocaleString() },
    { label: 'Months above normal', value: String(stats.aboveNormal) },
    { label: 'Months below low', value: String(stats.belowLow) },
    { label: 'Budget corrections', value: String(stats.budgetCorrections) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Performance bands — monthly leads vs targets
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          High / Normal / Low thresholds + actual performance
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <svg width="18" height="10" style={{ flexShrink: 0 }}>
              <line
                x1="0" y1="5" x2="18" y2="5"
                stroke={item.color}
                strokeWidth={item.thick ? 2.5 : 1.5}
                strokeDasharray={item.dash ? '5 2' : undefined}
              />
              {item.dot && <circle cx="9" cy="5" r="3" fill={item.color} stroke="#fff" strokeWidth="1" />}
            </svg>
            {item.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 10,
        flexWrap: 'wrap',
      }}>
        {pills.map((pill) => (
          <div key={pill.label} style={{
            flex: '1 1 120px',
            background: 'rgba(29, 158, 117, 0.08)',
            border: '0.5px solid #c2e8d6',
            borderRadius: 8,
            padding: '6px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#085041', lineHeight: 1.2 }}>
              {pill.value}
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, lineHeight: 1.3 }}>
              {pill.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
