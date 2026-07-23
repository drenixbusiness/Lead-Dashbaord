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

/** Home company for each HR. Ethan is BP HR who also hired for JM. */
const HR_COMPANY: Record<string, string> = {
  Winston: 'JM',
  Alex:    'JM',
  Isaac:   'JM',
  Ethan:   'BP',
  Alfred:  'JM',
};

function getColor(hr: string) {
  return HR_COLORS[hr] ?? DEFAULT_COLOR;
}

function CompanyBadge({ hr }: { hr: string }) {
  const company = HR_COMPANY[hr] ?? 'JM';
  const isExternal = company !== 'JM';
  return (
    <span
      title={isExternal ? `${company} HR — also hired for JM` : `${company} HR`}
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.04em',
        padding: '1px 5px',
        borderRadius: 4,
        background: isExternal ? 'rgba(168,85,247,0.12)' : 'rgba(59,130,246,0.1)',
        color: isExternal ? '#7c3aed' : '#2563eb',
        border: `1px solid ${isExternal ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.25)'}`,
        whiteSpace: 'nowrap',
      }}
    >
      {isExternal ? `${company} → JM` : company}
    </span>
  );
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
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Hires by HR Rep — Monthly</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
            Who hired how many drivers each month · Jan–Jun 2026 · Ethan is BP HR (also hired for JM)
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
            <CompanyBadge hr={hr} />
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
      <div style={{ height:260, flexShrink:0 }}>
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
            <div style={{ marginTop:4, display:'flex', justifyContent:'center' }}>
              <CompanyBadge hr={hr} />
            </div>
            <div style={{ fontSize:9, color:'#94a3b8', marginTop:3 }}>
              {grandTotal > 0 ? ((hrTotals[hr] / grandTotal) * 100).toFixed(0) : 0}% of total
            </div>
          </div>
        ))}
      </div>

      {/* HR × month table */}
      <div style={{ overflowX:'auto', border:'1px solid #e2e8f0', borderRadius:10 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr>
              <th style={{
                textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:600,
                color:'#64748b', background:'#f8fafc', borderBottom:'1px solid #e2e8f0',
                whiteSpace:'nowrap', position:'sticky', left:0, zIndex:1,
              }}>
                HR Rep
              </th>
              {data.map(d => (
                <th key={d.month} style={{
                  textAlign:'center', padding:'8px 12px', fontSize:11, fontWeight:700,
                  color:'#0f172a', background:'#f8fafc', borderBottom:'1px solid #e2e8f0',
                  whiteSpace:'nowrap',
                }}>
                  {d.month.replace(' 2026', '')}
                </th>
              ))}
              <th style={{
                textAlign:'center', padding:'8px 12px', fontSize:11, fontWeight:700,
                color:'#15803d', background:'#f0fdf4', borderBottom:'1px solid #e2e8f0',
                whiteSpace:'nowrap',
              }}>
                Total
              </th>
              <th style={{
                textAlign:'center', padding:'8px 12px', fontSize:11, fontWeight:600,
                color:'#64748b', background:'#f8fafc', borderBottom:'1px solid #e2e8f0',
                whiteSpace:'nowrap',
              }}>
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {hrs.map((hr, i) => (
              <tr key={hr} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{
                  padding:'8px 12px', whiteSpace:'nowrap',
                  position:'sticky', left:0, zIndex:1,
                  background: i % 2 === 0 ? '#fff' : '#f8fafc',
                  borderBottom:'0.5px solid #f1f5f9',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{
                      width:8, height:8, borderRadius:2,
                      background:getColor(hr).bar, flexShrink:0,
                    }} />
                    <span style={{ fontWeight:600, color:'#0f172a' }}>{hr}</span>
                    <CompanyBadge hr={hr} />
                    <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>#{i + 1}</span>
                  </div>
                </td>
                {data.map(d => {
                  const n = d.hires[hr] ?? 0;
                  return (
                    <td key={d.month} style={{
                      padding:'8px 12px', textAlign:'center',
                      fontWeight: n > 0 ? 700 : 400,
                      color: n > 0 ? getColor(hr).bar : '#cbd5e1',
                      borderBottom:'0.5px solid #f1f5f9',
                    }}>
                      {n}
                    </td>
                  );
                })}
                <td style={{
                  padding:'8px 12px', textAlign:'center', fontWeight:800,
                  color:getColor(hr).bar, background:'#f0fdf4',
                  borderBottom:'0.5px solid #f1f5f9',
                }}>
                  {hrTotals[hr]}
                </td>
                <td style={{
                  padding:'8px 12px', textAlign:'center', fontWeight:600,
                  color:'#64748b', borderBottom:'0.5px solid #f1f5f9',
                }}>
                  {grandTotal > 0 ? ((hrTotals[hr]! / grandTotal) * 100).toFixed(0) : 0}%
                </td>
              </tr>
            ))}
            {/* Monthly totals row */}
            <tr style={{ background:'#f1f5f9' }}>
              <td style={{
                padding:'8px 12px', fontWeight:700, color:'#0f172a',
                position:'sticky', left:0, zIndex:1, background:'#f1f5f9',
                borderTop:'1px solid #e2e8f0',
              }}>
                Monthly Total
              </td>
              {data.map(d => (
                <td key={d.month} style={{
                  padding:'8px 12px', textAlign:'center', fontWeight:800,
                  color:'#0f172a', borderTop:'1px solid #e2e8f0',
                }}>
                  {d.total}
                </td>
              ))}
              <td style={{
                padding:'8px 12px', textAlign:'center', fontWeight:800,
                color:'#15803d', background:'#dcfce7', borderTop:'1px solid #e2e8f0',
              }}>
                {grandTotal}
              </td>
              <td style={{
                padding:'8px 12px', textAlign:'center', fontWeight:600,
                color:'#64748b', borderTop:'1px solid #e2e8f0',
              }}>
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
