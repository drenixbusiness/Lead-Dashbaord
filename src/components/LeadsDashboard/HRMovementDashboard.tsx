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

  const scopeLabel = selected === 'ALL' ? 'Company' : selected;
  const showAllHrs = selected === 'ALL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter kept for optional drill-down */}
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
            background: selected === 'ALL' ? '#0f172a' : '#fff',
            borderColor: selected === 'ALL' ? '#0f172a' : '#e2e8f0',
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

      {/* Company-wide overview always on top when All */}
      {showAllHrs && (
        <>
          <div style={{ ...CARD, height: 380 }}>
            <WorkforceMovementChart
              drivers={drivers}
              title="Workforce Movement — Company"
              subtitle="All HR reps combined · onboarding vs departures vs headcount"
            />
          </div>
          <div style={{ ...CARD, height: 380 }}>
            <TenureDistributionChart
              drivers={drivers}
              title="Tenure Distribution — Company"
              subtitle="Weeks since first load · all drivers"
            />
          </div>

          {/* ALL HR movement charts at once */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Workforce Movement — every HR
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              All reps on one page · no need to switch tabs
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: 16,
            }}>
              {hrList.map(({ hr, count }) => {
                const hrDrivers = drivers.filter((d) => normalizeHR(d.hr) === hr);
                const color = hrColor(hr);
                return (
                  <div key={hr} style={{ ...CARD, height: 360, borderTop: `3px solid ${color}` }}>
                    <WorkforceMovementChart
                      drivers={hrDrivers}
                      title={`${hr} (${count})`}
                      subtitle="Onboarded / departed / active headcount"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ALL HR tenure charts at once */}
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
                const buckets = buildTenureFromRoster(hrDrivers);
                const tracked = buckets.reduce((s, b) => s + b.count, 0);
                if (tracked === 0) return null;
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
      )}

      {/* Single-HR focus (optional drill-down) */}
      {!showAllHrs && (
        <>
          <div style={{ ...CARD, height: 420 }}>
            <WorkforceMovementChart
              drivers={filtered}
              title={`Workforce Movement — ${selected}`}
              subtitle={`Drivers hired by ${selected} · onboarded / departed / active headcount`}
            />
          </div>
          <div style={{ ...CARD, height: 420 }}>
            <TenureDistributionChart
              drivers={filtered}
              title={`Tenure Distribution — ${selected}`}
              subtitle={`Weeks since first load for drivers hired by ${selected}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
