'use client';

import { useState, useEffect, useRef } from 'react';
import type { LeadsDataRow } from '../../types/leads';
import type { ExplainResponse } from '../../app/api/forecast-explain/route';

// ── Forecast engine ──────────────────────────────────────────────────────────

interface ForecastRow {
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
  cphLB: string;
  _leads: number;
  _adSpend: number;
  _leadsRate: number;
  _lbRate: number;
  _overallRate: number;
  _cphLeads: number;
  _cphLB: number;
}

function nextMonthName(base: string, offset: number): string {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [mon, yr] = base.split(' ');
  let idx = MONTHS.indexOf(mon) + offset;
  let year = parseInt(yr);
  while (idx >= 12) { idx -= 12; year++; }
  return `${MONTHS[idx]} ${year}`;
}

function computeForecasts(data: LeadsDataRow[]): ForecastRow[] {
  if (data.length === 0) return [];
  const recent = data.slice(-4);
  const n = recent.length;
  const RAW_W = [0.10, 0.20, 0.30, 0.40].slice(4 - n);
  const sumW  = RAW_W.reduce((a, b) => a + b, 0);
  const W     = RAW_W.map(w => w / sumW);
  const wAvg  = (vals: number[]) => vals.reduce((s, v, i) => s + v * W[i], 0);
  const slope = (arr: number[]) => arr.length > 1 ? (arr[arr.length-1] - arr[0]) / (arr.length-1) : 0;

  const leadsRates   = recent.map(r => r.leads > 0 ? (r.hired_by_leads    / r.leads) * 100 : 0);
  const lbRates      = recent.map(r => r.leads > 0 ? (r.hired_by_leadbase / r.leads) * 100 : 0);
  const overallRates = recent.map(r => r.hire_rate_pct);

  const baseLeads     = wAvg(recent.map(r => r.leads));
  const baseSpend     = wAvg(recent.map(r => r.ad_spend_usd));
  const baseLeadsRate = wAvg(leadsRates);
  const baseLBRate    = wAvg(lbRates);
  const baseOverall   = wAvg(overallRates);

  const tLeads   = slope(recent.map(r => r.leads));
  const tSpend   = slope(recent.map(r => r.ad_spend_usd));
  const tLeadsR  = slope(leadsRates);
  const tLBR     = slope(lbRates);
  const tOverall = slope(overallRates);

  const last = data[data.length - 1];

  return [1, 2, 3].map(offset => {
    const leads     = Math.max(0, Math.round(baseLeads     + tLeads   * offset));
    const spend     = Math.max(0,            baseSpend     + tSpend   * offset);
    const leadsRate = Math.max(0,            baseLeadsRate + tLeadsR  * offset);
    const lbRate    = Math.max(0,            baseLBRate    + tLBR     * offset);
    const overall   = Math.max(0,            baseOverall   + tOverall * offset);
    const hiredL    = Math.round(leads * leadsRate / 100);
    const hiredLB   = Math.round(leads * lbRate    / 100);
    const totalH    = hiredL + hiredLB + (last.hired_by_referral ?? 0);
    const cphL      = hiredL  > 0 ? spend / hiredL  : 0;
    const cphLB     = hiredLB > 0 ? spend / hiredLB : 0;

    return {
      month:       nextMonthName(last.month, offset),
      leads,
      hiredLeads:  hiredL,
      hiredLB,
      hiredRef:    last.hired_by_referral ?? 0,
      totalHired:  totalH,
      leadsRate:   `${leadsRate.toFixed(1)}%`,
      lbRate:      `${lbRate.toFixed(1)}%`,
      overallRate: `${overall.toFixed(1)}%`,
      adSpend:     `$${spend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      cphLeads:    hiredL  > 0 ? `$${Math.round(cphL).toLocaleString()}`  : '—',
      cphLB:       hiredLB > 0 ? `$${Math.round(cphLB).toLocaleString()}` : '—',
      _leads:      leads,
      _adSpend:    spend,
      _leadsRate:  leadsRate,
      _lbRate:     lbRate,
      _overallRate: overall,
      _cphLeads:   cphL,
      _cphLB:      cphLB,
    };
  });
}

// ── Trend badge ──────────────────────────────────────────────────────────────

function TrendBadge({ delta, unit = '', invert = false, threshold = 0.5 }: {
  delta: number; unit?: string; invert?: boolean; threshold?: number;
}) {
  const neutral  = Math.abs(delta) < threshold;
  const positive = invert ? delta < 0 : delta > 0;
  const color    = neutral ? '#9ca3af' : positive ? '#1D9E75' : '#E24B4A';
  const arrow    = neutral ? '' : delta > 0 ? '↑' : '↓';
  const absVal   = Math.abs(delta);
  const valStr   = unit === '%' ? absVal.toFixed(1) : Math.round(absVal).toLocaleString();
  const text     = neutral ? 'stable' : `${arrow} ${valStr}${unit} vs last`;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap', display: 'inline-block' }}>
      {text}
    </span>
  );
}

// ── Metric definitions ───────────────────────────────────────────────────────

interface MetricDef {
  label: string;
  key: keyof ForecastRow;
  explainKey: keyof ExplainResponse;
  accent: string;
  trendKey?: keyof ForecastRow;
  trendUnit?: string;
  trendInvert?: boolean;
  trendThreshold?: number;
  divider?: boolean;
}

const METRICS: MetricDef[] = [
  { label: 'Total leads',                key: 'leads',       explainKey: 'leads',       accent: '#185FA5', trendKey: '_leads',       trendUnit: '' },
  { label: 'Hired — Leads',              key: 'hiredLeads',  explainKey: 'hiredLeads',  accent: '#1D9E75' },
  { label: 'Hired — Lead Base',          key: 'hiredLB',     explainKey: 'hiredLB',     accent: '#185FA5' },
  { label: 'Hired — Referral',           key: 'hiredRef',    explainKey: 'hiredRef',    accent: '#BA7517' },
  { label: 'Total hired',                key: 'totalHired',  explainKey: 'totalHired',  accent: '#085041', divider: true },
  { label: 'Hire rate (leads only)',      key: 'leadsRate',   explainKey: 'leadsRate',   accent: '#185FA5', trendKey: '_leadsRate',   trendUnit: '%' },
  { label: 'Hire rate (Lead Base only)', key: 'lbRate',      explainKey: 'lbRate',      accent: '#185FA5', trendKey: '_lbRate',      trendUnit: '%' },
  { label: 'Overall hire rate',          key: 'overallRate', explainKey: 'overallRate', accent: '#534AB7', trendKey: '_overallRate', trendUnit: '%' },
  { label: 'Ad spend',                   key: 'adSpend',     explainKey: 'adSpend',     accent: '#BA7517', trendKey: '_adSpend',     trendUnit: '', trendInvert: true, trendThreshold: 50, divider: true },
  { label: 'CPH (leads only)',           key: 'cphLeads',    explainKey: 'cphLeads',    accent: '#E24B4A', trendKey: '_cphLeads',    trendUnit: '', trendInvert: true, trendThreshold: 10 },
  { label: 'CPH (Lead Base only)',       key: 'cphLB',       explainKey: 'cphLB',       accent: '#185FA5', trendKey: '_cphLB',       trendUnit: '', trendInvert: true, trendThreshold: 10 },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function ForecastCard({ data }: { data: LeadsDataRow[] }) {
  const forecasts = computeForecasts(data);
  const [idx, setIdx]               = useState(0);
  // One cached explanation per forecast month (index 0/1/2)
  const [explanations, setExplanations] = useState<(ExplainResponse | null)[]>([null, null, null]);
  const [loading, setLoading]           = useState(false);
  const [aiError, setAiError]           = useState<string | null>(null);
  const fetched = useRef<boolean[]>([false, false, false]);

  const f    = forecasts[idx];
  const last = data[data.length - 1];

  // Fetch AI explanation for the selected month (once per month index)
  useEffect(() => {
    if (!f || fetched.current[idx]) return;
    fetched.current[idx] = true;
    setLoading(true);
    setAiError(null);

    fetch('/api/forecast-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: data.slice(-4).map(r => ({
          month: r.month,
          leads: r.leads,
          hired_by_leads: r.hired_by_leads,
          hired_by_leadbase: r.hired_by_leadbase,
          hired_by_referral: r.hired_by_referral,
          hired: r.hired,
          ad_spend_usd: r.ad_spend_usd,
          hire_rate_pct: r.hire_rate_pct,
        })),
        forecast: {
          month:       f.month,
          leads:       f.leads,
          hiredLeads:  f.hiredLeads,
          hiredLB:     f.hiredLB,
          hiredRef:    f.hiredRef,
          totalHired:  f.totalHired,
          leadsRate:   f.leadsRate,
          lbRate:      f.lbRate,
          overallRate: f.overallRate,
          adSpend:     f.adSpend,
          cphLeads:    f.cphLeads,
          cphLB:       f.cphLB,
        },
      }),
    })
      .then(r => r.json())
      .then((res: ExplainResponse | { error: string }) => {
        if ('error' in res) { setAiError(res.error); return; }
        setExplanations(prev => { const next = [...prev]; next[idx] = res; return next; });
      })
      .catch(e => setAiError(String(e)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (forecasts.length === 0) return null;

  const explain = explanations[idx];

  const lastVals: Partial<Record<keyof ForecastRow, number>> = {
    _leads:       last.leads,
    _adSpend:     last.ad_spend_usd,
    _leadsRate:   last.leads > 0 ? (last.hired_by_leads    / last.leads) * 100 : 0,
    _lbRate:      last.leads > 0 ? (last.hired_by_leadbase / last.leads) * 100 : 0,
    _overallRate: last.hire_rate_pct,
    _cphLeads:    last.hired_by_leads    > 0 ? last.ad_spend_usd / last.hired_by_leads    : 0,
    _cphLB:       last.hired_by_leadbase > 0 ? last.ad_spend_usd / last.hired_by_leadbase : 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>3-month forecast</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            Weighted trend · last {Math.min(data.length, 4)} months
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {loading && (
            <span style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>AI thinking…</span>
          )}
          {forecasts.map((fc, i) => (
            <button key={fc.month} onClick={() => setIdx(i)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              background: idx === i ? '#085041' : '#fff',
              borderColor: idx === i ? '#085041' : '#c2e8d6',
              color: idx === i ? '#fff' : '#085041',
              transition: 'all 0.15s',
            }}>
              {fc.month}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, color: '#6b7280', fontWeight: 600, background: '#f8fdf9', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                Metric
              </th>
              <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#085041', background: '#f8fdf9', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                {f.month} <span style={{ fontSize: 9, fontWeight: 500, color: '#9ca3af' }}>est.</span>
              </th>
              <th style={{ textAlign: 'center', padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f8fdf9', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                Trend
              </th>
              <th style={{ textAlign: 'left', padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f8fdf9', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  AI insight
                  <span style={{ fontSize: 9, background: '#085041', color: '#fff', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>GPT</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, i) => {
              const delta = m.trendKey && lastVals[m.trendKey] !== undefined
                ? (f[m.trendKey] as number) - (lastVals[m.trendKey] as number)
                : null;
              const insight = explain?.[m.explainKey] ?? null;

              return (
                <tr key={m.label} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(29,158,117,0.03)', borderTop: m.divider ? '1.5px solid #e5e7eb' : undefined }}>
                  <td style={{ padding: '7px 10px', color: '#374151', fontWeight: 500, borderBottom: '0.5px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                    {m.label}
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, color: m.accent, borderBottom: '0.5px solid #f0f0f0', whiteSpace: 'nowrap', fontSize: 13 }}>
                    {String(f[m.key])}
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'center', borderBottom: '0.5px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                    {delta !== null
                      ? <TrendBadge delta={delta} unit={m.trendUnit} invert={m.trendInvert} threshold={m.trendThreshold} />
                      : <span style={{ color: '#d1d5db', fontSize: 10 }}>—</span>}
                  </td>
                  <td style={{ padding: '7px 14px', borderBottom: '0.5px solid #f0f0f0', color: '#4b5563', fontSize: 11, lineHeight: 1.5, minWidth: 220 }}>
                    {loading && !insight
                      ? <span style={{ color: '#c4d9d1', fontSize: 10, fontStyle: 'italic' }}>generating…</span>
                      : insight
                      ? insight
                      : aiError
                      ? <span style={{ color: '#E24B4A', fontSize: 10 }}>—</span>
                      : <span style={{ color: '#d1d5db', fontSize: 10 }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 10, color: '#9ca3af', borderTop: '0.5px solid #e5e7eb', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Weighted moving average + linear trend. Referral hires assumed flat at last month.</span>
        {aiError && <span style={{ color: '#E24B4A' }}>AI error: {aiError}</span>}
      </div>
    </div>
  );
}
