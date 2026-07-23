'use client';

import { useMemo, useState } from 'react';
import type { DriverRecord } from '../../types/roster';
import { buildTenureFromRoster } from '../../utils/rosterMetrics';
import TenureDistributionChart from './TenureDistributionChart';

const HR_COLORS: Record<string, string> = {
  Alex:    '#22c55e',
  Winston: '#3b82f6',
  Isaac:   '#f59e0b',
  Jessica: '#a855f7',
  Alfred:  '#ec4899',
  Ethan:   '#6366f1',
  Unknown: '#94a3b8',
};

function normalizeHR(raw: string | null): string {
  if (!raw?.trim()) return 'Unknown';
  const t = raw.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function hrColor(hr: string) {
  return HR_COLORS[hr] ?? '#64748b';
}

const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.05)',
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
};

export default function HRTenureDashboard({ drivers }: { drivers: DriverRecord[] }) {
  const hrList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of drivers) {
      const hr = normalizeHR(d.hr);
      counts[hr] = (counts[hr] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([hr, count]) => ({ hr, count }));
  }, [drivers]);

  const [selected, setSelected] = useState<string>('ALL');

  const filtered = useMemo(() => {
    if (selected === 'ALL') return drivers;
    return drivers.filter((d) => normalizeHR(d.hr) === selected);
  }, [drivers, selected]);

  const buckets = useMemo(() => buildTenureFromRoster(filtered), [filtered]);
  const tracked = buckets.reduce((s, b) => s + b.count, 0);
  const dominant = buckets.reduce((a, b) => (b.count > a.count ? b : a), buckets[0]);
  const active = filtered.filter((d) => !d.terminationDate).length;
  const terminated = filtered.filter((d) => d.terminationDate).length;
  const scopeLabel = selected === 'ALL' ? 'Company' : selected;
  const showAllHrs = selected === 'ALL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Focus filter */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Focus
        </span>
        <button
          type="button"
          onClick={() => setSelected('ALL')}
          style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', border: '1px solid',
            background: selected === 'ALL' ? '#4338ca' : '#fff',
            borderColor: selected === 'ALL' ? '#4338ca' : '#e2e8f0',
            color: selected === 'ALL' ? '#fff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          All HR at once ({drivers.length})
        </button>
        {hrList.map(({ hr, count }) => {
          const activePill = selected === hr;
          const color = hrColor(hr);
          return (
            <button
              key={hr}
              type="button"
              onClick={() => setSelected(hr)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', border: '1px solid',
                background: activePill ? color : '#fff',
                borderColor: activePill ? color : `${color}55`,
                color: activePill ? '#fff' : color,
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: activePill ? '#fff' : color,
              }} />
              {hr} ({count})
            </button>
          );
        })}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Tracked', value: tracked, sub: scopeLabel, color: '#4338ca', bg: '#eef2ff' },
          { label: 'Still Active', value: active, sub: 'no termination', color: '#15803d', bg: '#f0fdf4' },
          { label: 'Terminated', value: terminated, sub: 'left company', color: '#dc2626', bg: '#fef2f2' },
          {
            label: 'Largest bucket',
            value: dominant?.count ?? 0,
            sub: dominant?.label ?? '—',
            color: '#6366f1',
            bg: '#eef2ff',
          },
        ].map((k) => (
          <div key={k.label} style={{
            background: k.bg, border: `1px solid ${k.color}22`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginTop: 6 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {showAllHrs ? (
        <>
          <div style={{ ...CARD, height: 380 }}>
            <TenureDistributionChart
              drivers={drivers}
              title="Tenure Distribution — Company"
              subtitle="Weeks since first load · all drivers"
            />
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Tenure Distribution — every HR
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              Weeks since first load per rep · all on one page
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: 16,
            }}>
              {hrList.map(({ hr, count }) => {
                const hrDrivers = drivers.filter((d) => normalizeHR(d.hr) === hr);
                const color = hrColor(hr);
                const hrBuckets = buildTenureFromRoster(hrDrivers);
                const hrTracked = hrBuckets.reduce((s, b) => s + b.count, 0);
                if (hrTracked === 0) return null;
                return (
                  <div key={hr} style={{ ...CARD, height: 360, borderTop: `3px solid ${color}` }}>
                    <TenureDistributionChart
                      drivers={hrDrivers}
                      title={`${hr} (${count})`}
                      subtitle="Weeks since first load"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div style={{ ...CARD, height: 420 }}>
          <TenureDistributionChart
            drivers={filtered}
            title={`Tenure Distribution — ${selected}`}
            subtitle={`Weeks since first load for drivers hired by ${selected}`}
          />
        </div>
      )}
    </div>
  );
}
