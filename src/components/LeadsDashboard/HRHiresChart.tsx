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
import type { HRMonthData } from '../../types/hr';

ChartJS.register(
  CategoryScale, LinearScale,
  BarController, BarElement,
  LineController, PointElement, LineElement,
  Tooltip, Legend,
);

const HR_COLORS: Record<string, { bar: string; light: string }> = {
  Winston: { bar: '#3b82f6', light: 'rgba(59,130,246,0.12)' },
  Alex:    { bar: '#22c55e', light: 'rgba(34,197,94,0.12)'  },
  Isaac:   { bar: '#f59e0b', light: 'rgba(245,158,11,0.12)' },
  Ethan:   { bar: '#a855f7', light: 'rgba(168,85,247,0.12)' },
  Alfred:  { bar: '#ec4899', light: 'rgba(236,72,153,0.12)' },
};
const DEFAULT_COLOR = { bar: '#94a3b8', light: 'rgba(148,163,184,0.12)' };

function getColor(hr: string) {
  return HR_COLORS[hr] ?? DEFAULT_COLOR;
}

export default function HRHiresChart({ data }: { data: HRMonthData[] }) {
  if (data.length === 0) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:13 }}>
      No HR data available
    </div>
  );

  // All unique HRs sorted by total desc
  const hrTotals: Record<string, number> = {};
  for (const m of data) {
    for (const [hr, n] of Object.entries(m.hires)) {
      hrTotals[hr] = (hrTotals[hr] ?? 0) + n;
    }
  }
  const hrs = Object.entries(hrTotals).sort((a, b) => b[1] - a[1]).map(([hr]) => hr);

  const labels    = data.map(d => d.month.replace(' 2026', ''));
  const totals    = data.map(d => d.total);
  const grandTotal = totals.reduce((s, v) => s + v, 0);

  const datasets = [
    // Stacked bars per HR
    ...hrs.map(hr => ({
      type:            'bar' as const,
      label:           hr,
      data:            data.map(d => d.hires[hr] ?? 0),
      backgroundColor: getColor(hr).bar,
      borderRadius:    4,
      stack:           'hires',
      order:           2,
    })),
    // Total line on top
    {
      type:                'line' as const,
      label:               'Total',
      data:                totals,
      borderColor:         '#0f172a',
      backgroundColor:     'rgba(15,23,42,0.06)',
      borderWidth:         2.5,
      pointRadius:         5,
      pointBackgroundColor:'#fff',
      pointBorderColor:    '#0f172a',
      pointBorderWidth:    2,
      tension:             0.3,
      fill:                false,
      stack:               undefined,
      order:               1,
    },
  ];

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    interaction:         { mode: 'index' as const, intersect: false },
    plugins: {
      legend:  { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar' | 'line'>) =>
            `${ctx.dataset.label}: ${ctx.parsed.y ?? 0}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid:   { display: false },
        ticks:  { color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        stacked: true,
        grid:   { color: 'rgba(0,0,0,0.04)' },
        ticks:  { color: '#94a3b8', font: { size: 11 }, stepSize: 5 },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:12 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Hires by HR Rep — Monthly</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
            Who hired how many drivers each month · Jan–Jun 2026
          </div>
        </div>
        <div style={{
          fontSize:11, fontWeight:600,
          background:'#f0fdf4', color:'#15803d',
          border:'1px solid #bbf7d0',
          borderRadius:20, padding:'3px 10px',
        }}>
          {grandTotal} total hires
        </div>
      </div>

      {/* HR legend + totals */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {hrs.map(hr => (
          <div key={hr} style={{
            display:'flex', alignItems:'center', gap:6,
            background:'#f8fafc', border:'1px solid #e2e8f0',
            borderRadius:20, padding:'4px 10px',
          }}>
            <div style={{ width:10, height:10, borderRadius:2, background:getColor(hr).bar, flexShrink:0 }} />
            <span style={{ fontSize:11, fontWeight:600, color:'#374151' }}>{hr}</span>
            <span style={{ fontSize:11, color:'#94a3b8' }}>{hrTotals[hr]}</span>
          </div>
        ))}
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          background:'#f8fafc', border:'1px solid #e2e8f0',
          borderRadius:20, padding:'4px 10px',
        }}>
          <div style={{ width:18, height:2, background:'#0f172a', borderRadius:1, flexShrink:0 }} />
          <span style={{ fontSize:11, fontWeight:600, color:'#374151' }}>Monthly Total</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex:1, minHeight:0 }}>
        <Chart type="bar" data={{ labels, datasets }} options={options} />
      </div>

      {/* HR ranking row */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${hrs.length},1fr)`, gap:8 }}>
        {hrs.map((hr, rank) => (
          <div key={hr} style={{
            background: getColor(hr).light,
            border:`1px solid ${getColor(hr).bar}30`,
            borderRadius:8, padding:'8px 10px', textAlign:'center',
          }}>
            <div style={{ fontSize:9, fontWeight:700, color:getColor(hr).bar, letterSpacing:'0.06em', marginBottom:2 }}>
              #{rank + 1}
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:getColor(hr).bar, lineHeight:1 }}>
              {hrTotals[hr]}
            </div>
            <div style={{ fontSize:10, fontWeight:600, color:'#374151', marginTop:2 }}>{hr}</div>
            <div style={{ fontSize:9, color:'#94a3b8', marginTop:1 }}>
              {grandTotal > 0 ? ((hrTotals[hr] / grandTotal) * 100).toFixed(0) : 0}% of total
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
