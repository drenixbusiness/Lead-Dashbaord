'use client';

import { useState, useRef, useEffect } from 'react';
import type { LeadsDataRow } from '../../types/leads';

interface MonthData {
  month: string;
  leads: number;
  hiredLeads: number;
  hiredLB: number;
  hiredRef: number;
  totalHired: number;
  leadsRate: string;
  lbRate: string;
  overallRate: string;
  adSpend: string;
  cphLeads: string;
}

function buildRow(r: LeadsDataRow): MonthData {
  const leadsRate   = r.leads > 0 ? ((r.hired_by_leads / r.leads) * 100).toFixed(1) : '0.0';
  const lbRate      = r.leads > 0 ? ((r.hired_by_leadbase / r.leads) * 100).toFixed(1) : '0.0';
  const cphLeads    = r.hired_by_leads > 0 ? `$${Math.round(r.ad_spend_usd / r.hired_by_leads).toLocaleString()}` : '—';
  return {
    month:        r.month,
    leads:        r.leads,
    hiredLeads:   r.hired_by_leads,
    hiredLB:      r.hired_by_leadbase,
    hiredRef:     r.hired_by_referral,
    totalHired:   r.hired,
    leadsRate:    `${leadsRate}%`,
    lbRate:       `${lbRate}%`,
    overallRate:  `${r.hire_rate_pct.toFixed(1)}%`,
    adSpend:      `$${r.ad_spend_usd.toLocaleString()}`,
    cphLeads,
  };
}

const METRICS: { key: keyof MonthData; label: string; accent?: string }[] = [
  { key: 'leads',       label: 'Total leads',            accent: '#185FA5' },
  { key: 'hiredLeads',  label: 'Hired — Leads',          accent: '#1D9E75' },
  { key: 'hiredLB',     label: 'Hired — Lead Base',      accent: '#185FA5' },
  { key: 'hiredRef',    label: 'Hired — Referral',       accent: '#BA7517' },
  { key: 'totalHired',  label: 'Total hired',            accent: '#085041' },
  { key: 'leadsRate',   label: 'Hire rate (leads only)',      accent: '#185FA5' },
  { key: 'lbRate',      label: 'Hire rate (Lead Base only)', accent: '#185FA5' },
  { key: 'overallRate', label: 'Overall hire rate',           accent: '#534AB7' },
  { key: 'adSpend',     label: 'Ad spend',               accent: '#BA7517' },
  { key: 'cphLeads',    label: 'CPH (leads only)',        accent: '#E24B4A' },
];

export default function MonthDataCard({ data }: { data: LeadsDataRow[] }) {
  const allMonths   = data.map((r) => r.month);
  const lastMonth   = allMonths[allMonths.length - 1] ?? '';
  const [selected, setSelected] = useState<string[]>([lastMonth]);
  const [open, setOpen]         = useState(false);
  const dropRef                 = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function toggle(month: string) {
    setSelected((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  }

  function selectAll() { setSelected([...allMonths]); }
  function clearAll()  { setSelected([]); }

  // Keep original data order for columns
  const cols = data.filter((r) => selected.includes(r.month)).map(buildRow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Header + selector */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Monthly data viewer</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            Select months to review and plan ahead
          </div>
        </div>

        {/* Dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              background: open ? '#085041' : '#fff',
              border: '1px solid #c2e8d6',
              fontSize: 12, fontWeight: 600,
              color: open ? '#fff' : '#085041',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {selected.length === 0
              ? 'Select months'
              : selected.length === allMonths.length
              ? 'All months'
              : selected.length === 1
              ? selected[0]
              : `${selected.length} months selected`}
            <span style={{ fontSize: 9, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
          </button>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: '#fff', border: '1px solid #c2e8d6', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
              minWidth: 180, padding: '8px 0',
            }}>
              {/* Select all / clear */}
              <div style={{ display: 'flex', gap: 6, padding: '4px 12px 8px', borderBottom: '0.5px solid #e5e7eb' }}>
                <button onClick={selectAll} style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  All
                </button>
                <span style={{ color: '#d1d5db' }}>|</span>
                <button onClick={clearAll} style={{ fontSize: 11, color: '#E24B4A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Clear
                </button>
              </div>
              {allMonths.map((m) => {
                const checked = selected.includes(m);
                return (
                  <label key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', cursor: 'pointer',
                    background: checked ? 'rgba(29,158,117,0.07)' : 'transparent',
                    transition: 'background 0.1s',
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(m)}
                      style={{ accentColor: '#1D9E75', width: 14, height: 14 }}
                    />
                    <span style={{ fontSize: 12, color: '#1a1a1a', fontWeight: checked ? 600 : 400 }}>{m}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Data table */}
      {cols.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
          Select at least one month above
        </div>
      ) : (
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left', padding: '6px 10px', fontSize: 11,
                  color: '#6b7280', fontWeight: 600, background: '#f8fdf9',
                  borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, left: 0, zIndex: 2,
                  whiteSpace: 'nowrap',
                }}>
                  Metric
                </th>
                {cols.map((c) => (
                  <th key={c.month} style={{
                    textAlign: 'center', padding: '6px 12px',
                    fontSize: 11, fontWeight: 700, color: '#085041',
                    background: '#f8fdf9', borderBottom: '1px solid #e5e7eb',
                    position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap',
                  }}>
                    {c.month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m, i) => (
                <tr key={m.key} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(29,158,117,0.03)' }}>
                  <td style={{
                    padding: '7px 10px', color: '#374151', fontWeight: 500,
                    borderBottom: '0.5px solid #f0f0f0', whiteSpace: 'nowrap',
                    position: 'sticky', left: 0,
                    background: i % 2 === 0 ? '#fff' : 'rgba(240,250,245,0.8)',
                  }}>
                    {m.label}
                  </td>
                  {cols.map((c) => (
                    <td key={c.month} style={{
                      padding: '7px 12px', textAlign: 'center',
                      fontWeight: 700, color: m.accent ?? '#1a1a1a',
                      borderBottom: '0.5px solid #f0f0f0', whiteSpace: 'nowrap',
                      fontSize: 13,
                    }}>
                      {String(c[m.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
