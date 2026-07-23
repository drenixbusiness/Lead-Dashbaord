'use client';

import { useMemo, useState } from 'react';
import type { DriverRecord } from '../../types/roster';
import { buildMovementFromRoster } from '../../utils/rosterMetrics';
import WorkforceMovementChart from './WorkforceMovementChart';

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

function ceilToStep(n: number, step = 5): number {
  if (n <= 0) return step;
  return Math.ceil(n / step) * step;
}

function statsFor(drivers: DriverRecord[]) {
  const hired = drivers.length;
  const active = drivers.filter((d) => !d.terminationDate).length;
  const left = hired - active;
  return { hired, active, left };
}

const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: '16px 18px',
  border: '1px solid rgba(0,0,0,0.05)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  display: 'flex',
  flexDirection: 'column',
};

export default function HRMovementDashboard({ drivers }: { drivers: DriverRecord[] }) {
  const hrNames = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const d of drivers) {
      const hr = normalizeHR(d.hr);
      totals[hr] = (totals[hr] ?? 0) + 1;
    }
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([hr]) => hr);
  }, [drivers]);

  const [selected, setSelected] = useState<string>('all');
  const activeHR = selected === 'all' || hrNames.includes(selected) ? selected : 'all';
  const showAll = activeHR === 'all';

  const filtered = useMemo(() => {
    if (showAll) return drivers;
    return drivers.filter((d) => normalizeHR(d.hr) === activeHR);
  }, [drivers, activeHR, showAll]);

  // Same months + Y scale (steps of 5) for every HR chart — matches BP
  const sharedScale = useMemo(() => {
    const groups = hrNames.map((hr) =>
      drivers.filter((d) => normalizeHR(d.hr) === hr),
    );
    if (groups.length === 0) {
      return { monthSortKeys: [] as string[], yMax: 10, yMin: -5 };
    }

    const company = buildMovementFromRoster(drivers);
    const monthSortKeys = company.map((m) => m.monthKey);

    let maxPos = 0;
    let maxNeg = 0;
    for (const group of groups) {
      for (const row of buildMovementFromRoster(group, new Date(), { alignToMonthKeys: monthSortKeys })) {
        maxPos = Math.max(maxPos, row.onboarded, row.headcount);
        maxNeg = Math.max(maxNeg, row.departed);
      }
    }

    return {
      monthSortKeys,
      yMax: ceilToStep(maxPos, 5),
      yMin: -ceilToStep(maxNeg, 5),
    };
  }, [drivers, hrNames]);

  const stats = statsFor(filtered);
  const accent = showAll ? '#3b82f6' : hrColor(activeHR);

  if (drivers.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        No driver data yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        background: '#fff', borderRadius: 12, padding: 8,
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <button
          type="button"
          onClick={() => setSelected('all')}
          style={{
            border: showAll ? '1px solid #3b82f6' : '1px solid #e2e8f0',
            background: showAll ? '#eff6ff' : '#f8fafc',
            color: showAll ? '#1d4ed8' : '#64748b',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
          }}
        >
          All HRs
          <span style={{
            marginLeft: 8, fontSize: 11, fontWeight: 700,
            background: showAll ? '#dbeafe' : '#e2e8f0',
            color: showAll ? '#1d4ed8' : '#64748b',
            borderRadius: 10, padding: '1px 7px',
          }}>
            {drivers.length}
          </span>
        </button>
        {hrNames.map((hr) => {
          const count = drivers.filter((d) => normalizeHR(d.hr) === hr).length;
          const on = activeHR === hr;
          const color = hrColor(hr);
          return (
            <button
              key={hr}
              type="button"
              onClick={() => setSelected(hr)}
              style={{
                border: on ? `1px solid ${color}` : '1px solid #e2e8f0',
                background: on ? `${color}18` : '#f8fafc',
                color: on ? color : '#64748b',
                borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              {hr}
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: on ? `${color}22` : '#e2e8f0',
                color: on ? color : '#64748b',
                borderRadius: 10, padding: '1px 7px',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Hired', value: stats.hired, sub: showAll ? 'all reps' : activeHR, color: accent },
          { label: 'Still working', value: stats.active, sub: 'not terminated', color: '#15803d' },
          { label: 'Departed', value: stats.left, sub: 'left company', color: '#dc2626' },
          { label: 'Retention', value: stats.hired > 0 ? Math.round((stats.active / stats.hired) * 100) : 0, sub: '% still with us', color: '#7c3aed', suffix: '%' },
        ].map((k) => (
          <div key={k.label} style={{
            background: '#fff', borderRadius: 12, padding: '14px 16px',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1.2, marginTop: 4 }}>
              {k.value}{'suffix' in k ? k.suffix : ''}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {showAll ? (
        <>
          <div style={{ ...CARD, height: 400 }}>
            <WorkforceMovementChart
              drivers={drivers}
              title="Workforce Movement — Company (all HRs)"
              subtitle="onboarding vs departures vs net headcount · all reps combined"
            />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            Movement by HR — all reps
            <span style={{ fontWeight: 500, color: '#94a3b8', marginLeft: 8 }}>
              same Y scale (steps of 5)
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {hrNames.map((hr) => {
              const subset = drivers.filter((d) => normalizeHR(d.hr) === hr);
              const s = statsFor(subset);
              const color = hrColor(hr);
              return (
                <div
                  key={hr}
                  style={{
                    ...CARD,
                    height: 360,
                    borderTop: `3px solid ${color}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelected(hr)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(hr); }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 4, gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{hr}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                      {s.active} still working · {s.hired} hired · {s.left} left
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <WorkforceMovementChart
                      drivers={subset}
                      title={`Movement — ${hr}`}
                      subtitle={`drivers hired by ${hr}`}
                      alignToMonthKeys={sharedScale.monthSortKeys}
                      yMax={sharedScale.yMax}
                      yMin={sharedScale.yMin}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ ...CARD, height: 420 }}>
          <WorkforceMovementChart
            drivers={filtered}
            title={`Workforce Movement — ${activeHR}`}
            subtitle={`drivers hired by ${activeHR} · joined vs left vs remaining headcount`}
            alignToMonthKeys={sharedScale.monthSortKeys}
            yMax={sharedScale.yMax}
            yMin={sharedScale.yMin}
          />
        </div>
      )}
    </div>
  );
}
