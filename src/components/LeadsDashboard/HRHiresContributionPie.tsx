'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { DriverRecord } from '../../types/roster';

ChartJS.register(ArcElement, Tooltip, Legend);

const HR_COLORS: Record<string, string> = {
  Alex:    '#22c55e',
  Winston: '#3b82f6',
  Isaac:   '#f59e0b',
  Alfred:  '#ec4899',
  Ethan:   '#6366f1',
};

function normalizeHR(raw: string | null): string {
  if (!raw?.trim()) return 'Unknown';
  const t = raw.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function hrColor(hr: string) {
  return HR_COLORS[hr] ?? '#64748b';
}

export default function HRHiresContributionPie({
  drivers,
  title = 'Hire contribution by HR',
  subtitle = 'share of company hires',
}: {
  drivers: DriverRecord[];
  title?: string;
  subtitle?: string;
}) {
  const counts = new Map<string, number>();
  for (const d of drivers) {
    const hr = normalizeHR(d.hr);
    if (hr === 'Unknown') continue;
    counts.set(hr, (counts.get(hr) ?? 0) + 1);
  }

  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hr, count]) => ({ hr, count, color: hrColor(hr) }));

  const total = rows.reduce((s, r) => s + r.count, 0);

  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>
        No hire data yet
      </div>
    );
  }

  const chartData = {
    labels: rows.map((r) => r.hr),
    datasets: [{
      data: rows.map((r) => r.count),
      backgroundColor: rows.map((r) => r.color),
      borderColor: '#fff',
      borderWidth: 2,
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'pie'>) => {
            const n = ctx.parsed ?? 0;
            const pct = total > 0 ? ((n / total) * 100).toFixed(0) : '0';
            return ` ${ctx.label}: ${n} hires (${pct}%)`;
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
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600,
          background: '#eff6ff', color: '#1d4ed8',
          border: '1px solid #bfdbfe',
          borderRadius: 20, padding: '3px 10px',
          flexShrink: 0,
        }}>
          {total} hires
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 180, position: 'relative' }}>
        <Pie data={chartData} options={options} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r) => {
          const pct = ((r.count / total) * 100).toFixed(0);
          return (
            <div key={r.hr} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              fontSize: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.hr}</span>
              </div>
              <div style={{ color: '#64748b', fontWeight: 600, flexShrink: 0 }}>
                {r.count} <span style={{ color: '#94a3b8' }}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
