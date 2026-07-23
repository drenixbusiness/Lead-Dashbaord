'use client';

import { useMemo, useState } from 'react';
import type { DriverRecord } from '../../types/roster';
import { buildMovementFromRoster, buildTenureFromRoster } from '../../utils/rosterMetrics';
import WorkforceMovementChart from './WorkforceMovementChart';
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
  background: '#f0faf5',
  border: '0.5px solid #c2e8d6',
  borderRadius: 10,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
};

export default function HRMovementDashboard({ drivers }: { drivers: DriverRecord[] }) {
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

  const movement = useMemo(() => buildMovementFromRoster(filtered), [filtered]);
  const active = filtered.filter((d) => !d.terminationDate).length;
  const terminated = filtered.filter((d) => d.terminationDate).length;
  const net = movement.length > 0
    ? movement[movement.length - 1].headcount - movement[0].headcount
    : 0;
  const totalOnboarded = movement.reduce((s, m) => s + m.onboarded, 0);
  const totalDeparted = movement.reduce((s, m) => s + m.departed, 0);

  const scopeLabel = selected === 'ALL' ? 'All HR reps' : selected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* HR filter pills */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Filter
        </span>
        <button
          type="button"
          onClick={() => setSelected('ALL')}
          style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', border: '1px solid',
            background: selected === 'ALL' ? '#0f172a' : '#fff',
            borderColor: selected === 'ALL' ? '#0f172a' : '#e2e8f0',
            color: selected === 'ALL' ? '#fff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          Company ({drivers.length})
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

      {/* KPIs for selected scope */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Drivers (scope)', value: filtered.length, sub: scopeLabel, color: '#1e40af', bg: '#eff6ff' },
          { label: 'Still Active', value: active, sub: `${terminated} terminated`, color: '#15803d', bg: '#f0fdf4' },
          { label: 'Onboarded', value: totalOnboarded, sub: 'in period', color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Departed', value: totalDeparted, sub: net >= 0 ? `net +${net}` : `net ${net}`, color: '#dc2626', bg: '#fef2f2' },
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

      {/* Same movement chart, filtered */}
      <div style={{ ...CARD, height: 420 }}>
        <WorkforceMovementChart
          drivers={filtered}
          title={`Workforce Movement — ${scopeLabel}`}
          subtitle={
            selected === 'ALL'
              ? 'Company-wide onboarding vs departures vs headcount'
              : `Drivers hired by ${selected} · onboarded / departed / active headcount`
          }
        />
      </div>

      {/* Tenure chart — same HR filter */}
      <div style={{ ...CARD, height: 420 }}>
        <TenureDistributionChart
          drivers={filtered}
          title={`Tenure Distribution — ${scopeLabel}`}
          subtitle={
            selected === 'ALL'
              ? 'Weeks since first load · all HR reps'
              : `Weeks since first load for drivers hired by ${selected}`
          }
        />
      </div>

      {/* Per-HR comparison strip when viewing All */}
      {selected === 'ALL' && hrList.length > 0 && (
        <div style={{ ...CARD, height: 'auto' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Net movement &amp; tenure by HR
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
            Click a card to open that HR&apos;s movement + tenure charts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(hrList.length, 5)}, 1fr)`, gap: 10 }}>
            {hrList.map(({ hr, count }) => {
              const hrDrivers = drivers.filter((d) => normalizeHR(d.hr) === hr);
              const mov = buildMovementFromRoster(hrDrivers);
              const hrNet = mov.length > 0 ? mov[mov.length - 1].headcount - mov[0].headcount : 0;
              const hrActive = hrDrivers.filter((d) => !d.terminationDate).length;
              const buckets = buildTenureFromRoster(hrDrivers);
              const tracked = buckets.reduce((s, b) => s + b.count, 0);
              const dominant = buckets.reduce((a, b) => (b.count > a.count ? b : a), buckets[0]);
              const color = hrColor(hr);
              return (
                <button
                  key={hr}
                  type="button"
                  onClick={() => setSelected(hr)}
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    background: '#fff', border: `1px solid ${color}40`,
                    borderRadius: 10, padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{hr}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
                    {hrNet >= 0 ? '+' : ''}{hrNet}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                    net · {hrActive} active / {count} total
                  </div>
                  {tracked > 0 && dominant && (
                    <div style={{
                      marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9',
                      fontSize: 10, color: '#6366f1', fontWeight: 600,
                    }}>
                      Tenure peak: {dominant.label} ({dominant.count})
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
