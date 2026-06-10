'use client';

import type { LeadsDataRow } from '../../types/leads';

export default function HireRateSummaryCard({ data }: { data: LeadsDataRow[] }) {
  if (data.length === 0) return null;

  const totalLeads      = data.reduce((s, r) => s + r.leads, 0);
  const hiredFromLeads  = data.reduce((s, r) => s + r.hired_by_leads, 0);
  const totalSpend      = data.reduce((s, r) => s + r.ad_spend_usd, 0);
  const hireRatePct     = totalLeads > 0 ? (hiredFromLeads / totalLeads) * 100 : 0;
  const costPerHire     = hiredFromLeads > 0 ? Math.round(totalSpend / hiredFromLeads) : 0;
  const range           = `${data[0].month} – ${data[data.length - 1].month}`;
  const avgLeadsPerMonth = Math.round(totalLeads / data.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Lead → hire conversion</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Leads only — not Lead Base or Referral · {range}
        </div>
      </div>

      {/* Hero metric */}
      <div style={{
        background: 'linear-gradient(135deg, #085041 0%, #1D9E75 100%)',
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {hireRatePct.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            Lead → hire rate
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {hiredFromLeads}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            total hired from leads
          </div>
        </div>
      </div>

      {/* Supporting stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Total leads', value: totalLeads.toLocaleString(), sub: `avg ${avgLeadsPerMonth}/mo`, color: '#185FA5' },
          { label: 'Avg cost per hire', value: `$${costPerHire.toLocaleString()}`, sub: 'leads only', color: '#E24B4A' },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#fff',
            border: '0.5px solid #d1e9dd',
            borderRadius: 8,
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginTop: 3 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
