'use client';

import type { LeadsDataRow } from '../../types/leads';

function computeSummary(data: LeadsDataRow[]) {
  if (data.length === 0) {
    return { totalLeads: 0, hiredFromLeads: 0, hireRatePct: 0, costPerHire: 0 };
  }
  const totalLeads = data.reduce((s, r) => s + r.leads, 0);
  const hiredFromLeads = data.reduce((s, r) => s + r.hired_by_leads, 0);
  const totalSpend = data.reduce((s, r) => s + r.ad_spend_usd, 0);
  const hireRatePct = totalLeads > 0 ? (hiredFromLeads / totalLeads) * 100 : 0;
  const costPerHire = hiredFromLeads > 0 ? totalSpend / hiredFromLeads : 0;
  return { totalLeads, hiredFromLeads, hireRatePct, costPerHire };
}

export default function HireRateSummaryCard({ data }: { data: LeadsDataRow[] }) {
  const s = computeSummary(data);
  const range = data.length > 0 ? `${data[0].month} – ${data[data.length - 1].month}` : 'no data yet';

  const stats = [
    { value: `${s.hireRatePct.toFixed(1)}%`, label: 'Lead → hire rate (from Leads)' },
    { value: s.hiredFromLeads.toLocaleString(), label: `Hired from Leads (${range})` },
    { value: s.totalLeads.toLocaleString(), label: `Total leads (${range})` },
    { value: `$${Math.round(s.costPerHire).toLocaleString()}`, label: 'Avg cost per hire' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Lead → hire conversion
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          How many of our Leads (not Lead Base, not Referral) turn into hired drivers — in percentage and headcount
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            flex: '1 1 150px',
            background: 'rgba(29, 158, 117, 0.08)',
            border: '0.5px solid #c2e8d6',
            borderRadius: 8,
            padding: '10px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#085041', lineHeight: 1.2 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, lineHeight: 1.3 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
