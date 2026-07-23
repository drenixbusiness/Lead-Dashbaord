'use client';

import { useState } from 'react';
import type { DriverRecord } from '../../types/roster';

const HR_COLORS: Record<string, string> = {
  ALEX:    '#22c55e',
  WINSTON: '#3b82f6',
  ISAAC:   '#f59e0b',
  JESSICA: '#a855f7',
  ALFRED:  '#ec4899',
  ETHAN:   '#6366f1',
  FRED:    '#14b8a6',
  NICK:    '#f97316',
  MICHAEL: '#84cc16',
};
function hrColor(hr: string | null) {
  return HR_COLORS[(hr ?? '').toUpperCase()] ?? '#94a3b8';
}

function fmt(d: string | null) {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: color + '18', color: color,
      border: `1px solid ${color}40`,
      borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function DriverTable({ rows, type }: { rows: DriverRecord[]; type: 'hired' | 'terminated' }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        No {type === 'hired' ? 'active' : 'terminated'} drivers
      </div>
    );
  }

  const isTerminated = type === 'terminated';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>#</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Driver Name</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Hire Date</th>
            {isTerminated && (
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Terminated</th>
            )}
            {rows.some(r => r.hr) && (
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>HR Rep</th>
            )}
            {rows.some(r => r.firstLoad) && (
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>First Load</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '8px 12px', color: '#cbd5e1', fontSize: 11 }}>{i + 1}</td>
              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>
                {r.name}
              </td>
              <td style={{ padding: '8px 12px', color: '#475569', whiteSpace: 'nowrap' }}>{fmt(r.hiredDate)}</td>
              {isTerminated && (
                <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>{fmt(r.terminationDate)}</span>
                </td>
              )}
              {rows.some(d => d.hr) && (
                <td style={{ padding: '8px 12px' }}>
                  {r.hr ? <Badge color={hrColor(r.hr)} label={r.hr} /> : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
              )}
              {rows.some(d => d.firstLoad) && (
                <td style={{ padding: '8px 12px', color: '#475569', whiteSpace: 'nowrap' }}>{fmt(r.firstLoad)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  drivers: DriverRecord[];
  showHRTabs?: boolean; // JM has HR column, BP doesn't
}

export default function DriverRosterSection({ drivers, showHRTabs = true }: Props) {
  const [activeTab, setActiveTab] = useState<string>('company');

  // Build tab list
  const hrReps = showHRTabs
    ? [...new Set(drivers.map(d => d.hr).filter(Boolean) as string[])].sort()
    : [];

  const tabs = [
    { id: 'company', label: 'Company', color: '#6366f1' },
    ...hrReps.map(hr => ({ id: hr, label: hr, color: hrColor(hr) })),
  ];

  // Filter drivers for active tab
  const tabDrivers = activeTab === 'company'
    ? drivers
    : drivers.filter(d => (d.hr ?? '').toUpperCase() === activeTab.toUpperCase());

  const hired      = tabDrivers.filter(d => !d.terminationDate);
  const terminated = tabDrivers.filter(d => !!d.terminationDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${active ? t.color : '#e2e8f0'}`,
              background: active ? t.color : '#fff',
              color: active ? '#fff' : '#64748b',
              transition: 'all 0.15s ease',
              boxShadow: active ? `0 2px 8px ${t.color}40` : 'none',
            }}>
              {t.label}
              <span style={{
                marginLeft: 6, fontSize: 10,
                background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: active ? '#fff' : '#94a3b8',
                borderRadius: 10, padding: '1px 6px',
              }}>
                {activeTab === t.id ? tabDrivers.length : (t.id === 'company' ? drivers.length : drivers.filter(d => (d.hr ?? '').toUpperCase() === t.id.toUpperCase()).length)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Two-panel layout: Hired | Terminated */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Hired / Active */}
        <div style={{
          background: '#fff', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #f1f5f9',
        }}>
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
            borderBottom: '1px solid #86efac',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>✅ Hired Drivers</div>
              <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>Active — still with the company</div>
            </div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: '#15803d',
              background: '#fff', borderRadius: 8, padding: '4px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>{hired.length}</div>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <DriverTable rows={hired} type="hired" />
          </div>
        </div>

        {/* Terminated */}
        <div style={{
          background: '#fff', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #f1f5f9',
        }}>
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            borderBottom: '1px solid #fca5a5',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>🚫 Terminated Drivers</div>
              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Left the company</div>
            </div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: '#dc2626',
              background: '#fff', borderRadius: 8, padding: '4px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>{terminated.length}</div>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <DriverTable rows={terminated} type="terminated" />
          </div>
        </div>

      </div>
    </div>
  );
}
