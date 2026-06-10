'use client';

import type { LeadsDataRow } from '../../types/leads';

const SOURCE_COLORS = {
  leads:    { bg: '#1D9E75', light: 'rgba(29,158,117,0.1)',  border: '#a7dfc9' },
  leadbase: { bg: '#185FA5', light: 'rgba(24,95,165,0.1)',   border: '#b8d4f0' },
  referral: { bg: '#BA7517', light: 'rgba(186,117,23,0.1)',  border: '#e8d4a2' },
};

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.07)', overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
    </div>
  );
}

export default function HireRateBreakdownCard({ data }: { data: LeadsDataRow[] }) {
  if (data.length === 0) return null;

  const totalLeads    = data.reduce((s, r) => s + r.leads, 0);
  const totalHired    = data.reduce((s, r) => s + r.hired, 0);
  const fromLeads     = data.reduce((s, r) => s + r.hired_by_leads, 0);
  const fromLeadBase  = data.reduce((s, r) => s + r.hired_by_leadbase, 0);
  const fromReferral  = data.reduce((s, r) => s + r.hired_by_referral, 0);
  const overallRate   = totalLeads > 0 ? (totalHired / totalLeads) * 100 : 0;
  const range         = `${data[0].month} – ${data[data.length - 1].month}`;

  const sources = [
    { label: 'Leads',     count: fromLeads,    share: totalHired > 0 ? (fromLeads / totalHired) * 100 : 0,    ...SOURCE_COLORS.leads },
    { label: 'Lead Base', count: fromLeadBase, share: totalHired > 0 ? (fromLeadBase / totalHired) * 100 : 0, ...SOURCE_COLORS.leadbase },
    { label: 'Referral',  count: fromReferral, share: totalHired > 0 ? (fromReferral / totalHired) * 100 : 0, ...SOURCE_COLORS.referral },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Hiring rate by source</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          How well we convert &amp; which source drives hires · {range}
        </div>
      </div>

      {/* Hero — overall rate + total hired */}
      <div style={{
        background: 'linear-gradient(135deg, #185FA5 0%, #534AB7 100%)',
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {overallRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            overall hire rate
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {totalHired}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            total hired
          </div>
        </div>
      </div>

      {/* Source breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {sources.map((src) => (
          <div key={src.label} style={{
            background: src.light,
            border: `0.5px solid ${src.border}`,
            borderRadius: 8,
            padding: '8px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{src.label}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: src.bg }}>{src.count} hired</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: src.bg }}>{src.share.toFixed(1)}%</span>
              </div>
            </div>
            <Bar pct={src.share} color={src.bg} />
          </div>
        ))}
      </div>
    </div>
  );
}
