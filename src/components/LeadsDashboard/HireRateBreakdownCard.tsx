'use client';

import type { LeadsDataRow } from '../../types/leads';

function computeRates(data: LeadsDataRow[]) {
  if (data.length === 0) {
    return { overallRatePct: 0, leadsSharePct: 0, leadBaseSharePct: 0, referralSharePct: 0 };
  }
  const totalLeads = data.reduce((s, r) => s + r.leads, 0);
  const totalHired = data.reduce((s, r) => s + r.hired, 0);
  const fromLeads = data.reduce((s, r) => s + r.hired_by_leads, 0);
  const fromLeadBase = data.reduce((s, r) => s + r.hired_by_leadbase, 0);
  const fromReferral = data.reduce((s, r) => s + r.hired_by_referral, 0);

  const overallRatePct = totalLeads > 0 ? (totalHired / totalLeads) * 100 : 0;
  const leadsSharePct = totalHired > 0 ? (fromLeads / totalHired) * 100 : 0;
  const leadBaseSharePct = totalHired > 0 ? (fromLeadBase / totalHired) * 100 : 0;
  const referralSharePct = totalHired > 0 ? (fromReferral / totalHired) * 100 : 0;

  return { overallRatePct, leadsSharePct, leadBaseSharePct, referralSharePct };
}

export default function HireRateBreakdownCard({ data }: { data: LeadsDataRow[] }) {
  const r = computeRates(data);
  const range = data.length > 0 ? `${data[0].month} – ${data[data.length - 1].month}` : 'no data yet';

  const stats = [
    { value: `${r.overallRatePct.toFixed(1)}%`, label: `Overall hire rate — all hires ÷ leads (${range})` },
    { value: `${r.leadsSharePct.toFixed(1)}%`, label: 'Share of hires from Leads' },
    { value: `${r.leadBaseSharePct.toFixed(1)}%`, label: 'Share of hires from Lead Base' },
    { value: `${r.referralSharePct.toFixed(1)}%`, label: 'Share of hires from Referral' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          Hiring rate by source
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
          Not how many leads we get — how well we convert overall, and which source carries the hiring
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
