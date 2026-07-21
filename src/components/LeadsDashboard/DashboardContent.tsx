'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadsDataRow } from '../../types/leads';
import PerformanceBandsChart from './PerformanceBandsChart';
import HireRateBandsChart from './HireRateBandsChart';
import HireRateLeadsOnlyBandsChart from './HireRateLeadsOnlyBandsChart';
import LeadBaseBandsChart from './LeadBaseBandsChart';
import SpendingBandsChart from './SpendingBandsChart';
import CostPerHireChart from './CostPerHireChart';
import OverallCostPerHireChart from './OverallCostPerHireChart';
import LeadsHireRateChart from './LeadsHireRateChart';
import AdSpendChart from './AdSpendChart';
import HireRateSummaryCard from './HireRateSummaryCard';
import HireRateBreakdownCard from './HireRateBreakdownCard';
import HiresBySourceChart from './HiresBySourceChart';
import HireRateBySourceChart from './HireRateBySourceChart';
import MonthOverMonthCard from './MonthOverMonthCard';
import ForecastCard from './ForecastCard';

// ── Card style ────────────────────────────────────────────────────────────────
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

// ── Sidebar sections ──────────────────────────────────────────────────────────
type SectionId = 'overview' | 'forecast' | 'performance' | 'hire-rates' | 'cost-spend' | 'sources';

const SECTIONS: { id: SectionId; label: string; icon: string; desc: string }[] = [
  { id: 'overview',     label: 'Overview',         icon: '▣', desc: 'KPIs & monthly summary'       },
  { id: 'forecast',     label: 'Forecast',          icon: '◎', desc: '3-month projection'           },
  { id: 'performance',  label: 'Lead Performance',  icon: '▲', desc: 'Leads & hire rate trends'     },
  { id: 'hire-rates',   label: 'Hire Rates',        icon: '◉', desc: 'Rate by stream & source'     },
  { id: 'cost-spend',   label: 'Cost & Spend',      icon: '◆', desc: 'Ad spend & cost per hire'    },
  { id: 'sources',      label: 'Source Analysis',   icon: '◐', desc: 'Hires & rate by channel'     },
];

// ── Animated number ───────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const startTime = performance.now();
    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      start = eased * end;
      setDisplay(start);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);
  const fmt = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();
  return <>{prefix}{fmt}{suffix}</>;
}

// ── Hero KPI card (colorful gradient) ────────────────────────────────────────
function HeroKPI({ label, value, sub, gradient, icon, delay = 0 }: {
  label: string; value: number; sub?: string;
  gradient: string; icon: string; delay?: number;
  prefix?: string; suffix?: string; decimals?: number;
} & { prefix?: string; suffix?: string; decimals?: number }) {
  return <div/>;
}

function KPICard({ label, value, sub, prefix = '', suffix = '', decimals = 0, gradient, icon, delay = 0 }: {
  label: string; value: number; sub?: string;
  gradient: string; icon: string;
  prefix?: string; suffix?: string; decimals?: number; delay?: number;
}) {
  return (
    <div style={{
      borderRadius: 14,
      background: gradient,
      padding: '18px 20px',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
      animation: `fadeSlideIn 0.5s ease both`,
      animationDelay: `${delay}ms`,
    }}>
      {/* background glow */}
      <div style={{
        position: 'absolute', right: -20, top: -20,
        width: 100, height: 100,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: '50%',
      }} />
      <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontSize: 32, fontWeight: 800, lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonPulse({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-pulse 1.4s ease-in-out infinite',
      borderRadius: 6,
      ...style,
    }} />
  );
}
function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div style={{ ...CARD, gap: 10, height }}>
      <SkeletonPulse style={{ height: 14, width: '55%' }} />
      <SkeletonPulse style={{ height: 10, width: '40%' }} />
      <SkeletonPulse style={{ flex: 1, minHeight: 60 }} />
    </div>
  );
}

// ── Error ─────────────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, padding:24, textAlign:'center' }}>
      <div style={{ fontSize:32 }}>⚠️</div>
      <div style={{ fontSize:14, fontWeight:600, color:'#1a1a1a' }}>Failed to load dashboard data</div>
      <div style={{ fontSize:12, color:'#6b7280', maxWidth:380, lineHeight:1.6, fontFamily:'monospace', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 12px' }}>
        {message}
      </div>
      <button onClick={onRetry} disabled={retrying} style={{ padding:'8px 20px', background:retrying?'#9ca3af':'#7c3aed', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:retrying?'not-allowed':'pointer' }}>
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}

// ── KPI row helper ────────────────────────────────────────────────────────────
type KPICardProps = React.ComponentProps<typeof KPICard>;
function KPIRow({ cards }: { cards: KPICardProps[] }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cards.length},1fr)`, gap:14, marginBottom:16 }}>
      {cards.map((c, i) => <KPICard key={i} {...c} delay={i * 80} />)}
    </div>
  );
}

// ── Section content ───────────────────────────────────────────────────────────
function SectionContent({ id, data }: { id: SectionId; data: LeadsDataRow[] }) {
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 };

  // Shared aggregates used across sections
  const totalLeads    = data.reduce((s, r) => s + r.leads, 0);
  const totalHired    = data.reduce((s, r) => s + r.hired, 0);
  const fromLeads     = data.reduce((s, r) => s + r.hired_by_leads, 0);
  const fromLeadBase  = data.reduce((s, r) => s + r.hired_by_leadbase, 0);
  const fromReferral  = data.reduce((s, r) => s + r.hired_by_referral, 0);
  const totalSpend    = data.reduce((s, r) => s + r.ad_spend_usd, 0);
  const overallRate   = totalLeads > 0 ? (totalHired / totalLeads) * 100 : 0;
  const leadsOnlyRate = totalLeads > 0 ? (fromLeads / totalLeads) * 100 : 0;
  const leadBaseRate  = totalLeads > 0 ? (fromLeadBase / totalLeads) * 100 : 0;
  const costPerHire   = fromLeads > 0 ? totalSpend / fromLeads : 0;
  const avgLeads      = data.length > 0 ? totalLeads / data.length : 0;
  const range         = data.length > 0 ? `${data[0].month} – ${data[data.length - 1].month}` : '';

  // Peak month
  const peakRow = data.reduce((best, r) => r.leads > best.leads ? r : best, data[0] ?? { leads: 0, month: '—' } as LeadsDataRow);

  // Month-over-month lead change
  const last2   = data.slice(-2);
  const momLeads = last2.length === 2 && last2[0].leads > 0
    ? ((last2[1].leads - last2[0].leads) / last2[0].leads) * 100 : 0;

  // Simple next-month weighted forecast from last 3 months
  const recent3  = data.slice(-3);
  const W3       = [0.2, 0.35, 0.45];
  const wAvg3    = (vals: number[]) => vals.reduce((s, v, i) => s + v * (W3[i] ?? 0), 0);
  const foreLeads  = Math.round(wAvg3(recent3.map(r => r.leads)));
  const foreRate   = wAvg3(recent3.map(r => r.hire_rate_pct));
  const foreHired  = Math.round((foreLeads * foreRate) / 100);
  const foreSpend  = Math.round(wAvg3(recent3.map(r => r.ad_spend_usd)));

  switch (id) {
    case 'overview':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <KPIRow cards={[
            { label:'Total Leads',     value:totalLeads,  sub:range,              gradient:'linear-gradient(135deg,#6d28d9,#8b5cf6)', icon:'👤' },
            { label:'Total Hires',     value:totalHired,  sub:'all sources',      gradient:'linear-gradient(135deg,#065f46,#059669)', icon:'✅' },
            { label:'Hire Rate',       value:overallRate, suffix:'%', decimals:1, sub:'leads → hire',     gradient:'linear-gradient(135deg,#1e40af,#3b82f6)', icon:'📈' },
            { label:'Avg Cost / Hire', value:costPerHire, prefix:'$', decimals:0, sub:'ad spend / hires', gradient:'linear-gradient(135deg,#92400e,#f59e0b)', icon:'💰' },
          ]} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <div style={{ ...CARD, animation:'fadeSlideIn 0.5s ease 0.3s both' }}><HireRateSummaryCard data={data} /></div>
            <div style={{ ...CARD, animation:'fadeSlideIn 0.5s ease 0.38s both' }}><HireRateBreakdownCard data={data} /></div>
            <div style={{ ...CARD, minHeight:220, animation:'fadeSlideIn 0.5s ease 0.46s both' }}><MonthOverMonthCard data={data} /></div>
          </div>
        </div>
      );

    case 'forecast':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <KPIRow cards={[
            { label:'Projected Leads',    value:foreLeads,  sub:'next month est.',    gradient:'linear-gradient(135deg,#5b21b6,#7c3aed)', icon:'🔮' },
            { label:'Projected Hires',    value:foreHired,  sub:'based on avg rate',  gradient:'linear-gradient(135deg,#065f46,#059669)', icon:'🎯' },
            { label:'Projected Rate',     value:foreRate,   suffix:'%', decimals:1, sub:'hire rate forecast', gradient:'linear-gradient(135deg,#1e40af,#2563eb)', icon:'📊' },
            { label:'Projected Ad Spend', value:foreSpend,  prefix:'$', decimals:0, sub:'based on trend',    gradient:'linear-gradient(135deg,#7f1d1d,#dc2626)', icon:'📣' },
          ]} />
          <div style={{ ...CARD, minHeight:200, animation:'fadeSlideIn 0.4s ease both' }}><ForecastCard data={data} /></div>
        </div>
      );

    case 'performance':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <KPIRow cards={[
            { label:'Total Leads',  value:totalLeads,          sub:range,                          gradient:'linear-gradient(135deg,#6d28d9,#8b5cf6)', icon:'👤' },
            { label:'Avg / Month',  value:avgLeads, decimals:0, sub:'monthly average',              gradient:'linear-gradient(135deg,#1e40af,#3b82f6)', icon:'📅' },
            { label:'Peak Month',   value:peakRow.leads,        sub:peakRow.month,                  gradient:'linear-gradient(135deg,#065f46,#059669)', icon:'🏆' },
            { label:`MoM ${momLeads >= 0 ? '▲' : '▼'} Change`, value:Math.abs(momLeads), suffix:'%', decimals:1, sub:'vs previous month', gradient:momLeads >= 0 ? 'linear-gradient(135deg,#065f46,#059669)' : 'linear-gradient(135deg,#7f1d1d,#dc2626)', icon:momLeads >= 0 ? '📈' : '📉' },
          ]} />
          <div style={{ ...CARD, height:380, animation:'fadeSlideIn 0.4s ease both' }}><PerformanceBandsChart data={data} /></div>
          <div style={{ ...CARD, height:420, animation:'fadeSlideIn 0.4s ease 0.1s both' }}><HireRateBandsChart data={data} /></div>
          <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease 0.2s both' }}><LeadsHireRateChart data={data} /></div>
        </div>
      );

    case 'hire-rates':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <KPIRow cards={[
            { label:'Overall Hire Rate',  value:overallRate,   suffix:'%', decimals:1, sub:'all hires / all leads',   gradient:'linear-gradient(135deg,#1e40af,#3b82f6)', icon:'📊' },
            { label:'Leads-Only Rate',    value:leadsOnlyRate, suffix:'%', decimals:1, sub:'lead channel only',       gradient:'linear-gradient(135deg,#065f46,#059669)', icon:'🎯' },
            { label:'Lead Base Rate',     value:leadBaseRate,  suffix:'%', decimals:1, sub:'lead base channel',       gradient:'linear-gradient(135deg,#5b21b6,#7c3aed)', icon:'📋' },
            { label:'Referral Hires',     value:fromReferral,              sub:`${totalHired > 0 ? ((fromReferral/totalHired)*100).toFixed(0) : 0}% of total hires`, gradient:'linear-gradient(135deg,#92400e,#f59e0b)', icon:'🤝' },
          ]} />
          <div style={grid2}>
            <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease both' }}><HireRateLeadsOnlyBandsChart data={data} /></div>
            <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease 0.1s both' }}><LeadBaseBandsChart data={data} /></div>
          </div>
          <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease 0.2s both' }}><HireRateBySourceChart /></div>
        </div>
      );

    case 'cost-spend':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <KPIRow cards={[
            { label:'Total Ad Spend',    value:totalSpend,                                      prefix:'$', decimals:0, sub:range,                gradient:'linear-gradient(135deg,#7f1d1d,#dc2626)', icon:'💸' },
            { label:'Cost per Hire',     value:costPerHire,                                     prefix:'$', decimals:0, sub:'leads channel only', gradient:'linear-gradient(135deg,#92400e,#f59e0b)', icon:'💰' },
            { label:'Avg Monthly Spend', value:data.length > 0 ? totalSpend/data.length : 0,   prefix:'$', decimals:0, sub:'per month',          gradient:'linear-gradient(135deg,#1e3a8a,#1d4ed8)', icon:'📣' },
            { label:'Hires from Leads',  value:fromLeads,                                                               sub:`of ${totalHired} total hires`, gradient:'linear-gradient(135deg,#065f46,#059669)', icon:'✅' },
          ]} />
          <div style={grid2}>
            <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease both' }}><SpendingBandsChart data={data} /></div>
            <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease 0.1s both' }}><AdSpendChart data={data} /></div>
          </div>
          <div style={grid2}>
            <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease 0.2s both' }}><CostPerHireChart data={data} /></div>
            <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease 0.3s both' }}><OverallCostPerHireChart data={data} /></div>
          </div>
        </div>
      );

    case 'sources':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <KPIRow cards={[
            { label:'Total Hires',     value:totalHired,   sub:'all sources combined',                                                               gradient:'linear-gradient(135deg,#1e40af,#3b82f6)', icon:'✅' },
            { label:'From Leads',      value:fromLeads,    sub:`${totalHired > 0 ? ((fromLeads/totalHired)*100).toFixed(0) : 0}% of total`,          gradient:'linear-gradient(135deg,#065f46,#059669)', icon:'👤' },
            { label:'From Lead Base',  value:fromLeadBase, sub:`${totalHired > 0 ? ((fromLeadBase/totalHired)*100).toFixed(0) : 0}% of total`,       gradient:'linear-gradient(135deg,#5b21b6,#7c3aed)', icon:'📋' },
            { label:'From Referral',   value:fromReferral, sub:`${totalHired > 0 ? ((fromReferral/totalHired)*100).toFixed(0) : 0}% of total`,       gradient:'linear-gradient(135deg,#92400e,#f59e0b)', icon:'🤝' },
          ]} />
          <div style={{ ...CARD, height:420, animation:'fadeSlideIn 0.4s ease both' }}><HiresBySourceChart data={data} /></div>
          <div style={{ ...CARD, height:400, animation:'fadeSlideIn 0.4s ease 0.1s both' }}><HireRateBySourceChart /></div>
        </div>
      );
  }
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { data: LeadsDataRow[]; error?: string; company?: string; }

export default function DashboardContent({ data, error, company = 'JM' }: Props) {
  const [mounted, setMounted]        = useState(false);
  const [active, setActive]          = useState<SectionId>('overview');
  const [sidebarOpen, setSidebar]    = useState(true);
  const router                       = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setMounted(true); }, []);
  function handleRetry() { startTransition(() => { router.refresh(); }); }

  const activeSection = SECTIONS.find((s) => s.id === active)!;
  const range = data.length > 0 ? `${data[0].month} – ${data[data.length - 1].month}` : '';

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; }

        .db-shell {
          display: flex;
          height: 100dvh;
          overflow: hidden;
          background: #f1f5f9;
          font-family: "Google Sans", system-ui, Arial, sans-serif;
        }

        /* ── Sidebar ─────────────────────────────────────────────────────── */
        .db-sidebar {
          width: 224px;
          min-width: 224px;
          background: #2e1145;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: width 0.22s ease, min-width 0.22s ease;
          z-index: 10;
          box-shadow: 2px 0 12px rgba(0,0,0,0.15);
        }
        .db-sidebar.collapsed {
          width: 58px;
          min-width: 58px;
        }

        /* logo */
        .db-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 14px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .db-sidebar-logo-mark {
          width: 32px;
          height: 32px;
          min-width: 32px;
          background: linear-gradient(135deg,#7c3aed,#a855f7);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          box-shadow: 0 2px 8px rgba(124,58,237,0.4);
        }
        .db-sidebar-logo-wrap {
          overflow: hidden;
          opacity: 1;
          transition: opacity 0.15s;
        }
        .db-sidebar.collapsed .db-sidebar-logo-wrap { opacity: 0; pointer-events: none; }
        .db-sidebar-logo-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          line-height: 1.2;
        }
        .db-sidebar-logo-sub {
          font-size: 9px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        /* nav */
        .db-nav { flex: 1; padding: 10px 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; }
        .db-nav::-webkit-scrollbar { width: 0; }

        .db-nav-group-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.28);
          text-transform: uppercase;
          padding: 12px 8px 4px;
          white-space: nowrap;
          opacity: 1;
          transition: opacity 0.15s;
        }
        .db-sidebar.collapsed .db-nav-group-label { opacity: 0; }

        .db-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          color: rgba(255,255,255,0.55);
          position: relative;
        }
        .db-nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
        .db-nav-item.active {
          background: rgba(139,92,246,0.2);
          color: #c4b5fd;
        }
        .db-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: #a78bfa;
          border-radius: 0 2px 2px 0;
        }
        .db-nav-icon {
          font-size: 14px;
          min-width: 22px;
          text-align: center;
          line-height: 1;
          flex-shrink: 0;
        }
        .db-nav-text { overflow: hidden; opacity: 1; transition: opacity 0.15s; }
        .db-sidebar.collapsed .db-nav-text { opacity: 0; pointer-events: none; }
        .db-nav-label { font-size: 12px; font-weight: 500; white-space: nowrap; line-height: 1.2; }
        .db-nav-desc { font-size: 10px; color: rgba(255,255,255,0.3); white-space: nowrap; margin-top: 1px; }
        .db-nav-item.active .db-nav-desc { color: rgba(196,181,253,0.55); }

        /* footer */
        .db-sidebar-footer {
          padding: 10px 8px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        /* ── Right panel ─────────────────────────────────────────────────── */
        .db-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        /* ── Topbar ──────────────────────────────────────────────────────── */
        .db-topbar {
          height: 56px;
          min-height: 56px;
          background: #fff;
          border-bottom: 1px solid #e8edf2;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 0 22px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .db-toggle-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 7px; border: 1px solid #e5e7eb;
          background: #fff; cursor: pointer; color: #6b7280;
          font-size: 14px; flex-shrink: 0;
          transition: background 0.15s;
        }
        .db-toggle-btn:hover { background: #f3f4f6; }

        .db-topbar-left { display: flex; flex-direction: column; gap: 1px; }
        .db-topbar-title { font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.2; }
        .db-topbar-sub { font-size: 11px; color: #94a3b8; }

        .db-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
        .db-live-badge {
          display: flex; align-items: center; gap: 5px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 20px; padding: 4px 10px;
          font-size: 11px; font-weight: 600; color: #15803d;
        }
        .db-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e;
          animation: pulseGlow 1.8s ease-in-out infinite;
        }
        .db-range-badge {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 8px; padding: 5px 12px;
          font-size: 11px; font-weight: 500; color: #475569;
        }

        /* ── Main content ─────────────────────────────────────────────────── */
        .db-main {
          flex: 1;
          overflow-y: auto;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .db-main::-webkit-scrollbar { width: 6px; }
        .db-main::-webkit-scrollbar-track { background: transparent; }
        .db-main::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

        .db-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .db-section-header-left h2 {
          margin: 0 0 2px;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .db-section-header-left p {
          margin: 0;
          font-size: 12px;
          color: #94a3b8;
        }

        @media (max-width: 900px) {
          .db-sidebar { width: 58px; min-width: 58px; }
          .db-sidebar .db-sidebar-logo-wrap,
          .db-sidebar .db-nav-text,
          .db-sidebar .db-nav-group-label { opacity: 0; pointer-events: none; }
        }
        @media (max-width: 640px) {
          .db-main { padding: 12px; }
        }
      `}</style>

      <div className="db-shell">
        {/* ── Sidebar ── */}
        <nav className={`db-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
          <div className="db-sidebar-logo">
            <div className="db-sidebar-logo-mark">{company}</div>
            <div className="db-sidebar-logo-wrap">
              <div className="db-sidebar-logo-name">{company} Lead Analytics</div>
              <div className="db-sidebar-logo-sub">Lead Performance</div>
            </div>
          </div>

          <div className="db-nav">
            <div className="db-nav-group-label">Dashboards</div>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`db-nav-item${active === s.id ? ' active' : ''}`}
                onClick={() => setActive(s.id)}
                title={s.label}
              >
                <span className="db-nav-icon">{s.icon}</span>
                <span className="db-nav-text">
                  <div className="db-nav-label">{s.label}</div>
                  <div className="db-nav-desc">{s.desc}</div>
                </span>
              </button>
            ))}
          </div>

          <div className="db-sidebar-footer">
            <button
              className="db-nav-item"
              onClick={() => setSidebar((v) => !v)}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <span className="db-nav-icon">{sidebarOpen ? '←' : '→'}</span>
              <span className="db-nav-text">
                <div className="db-nav-label">Collapse</div>
              </span>
            </button>
          </div>
        </nav>

        {/* ── Right panel ── */}
        <div className="db-right">
          {/* Topbar */}
          <div className="db-topbar">
            <button className="db-toggle-btn" onClick={() => setSidebar((v) => !v)}>☰</button>
            <div className="db-topbar-left">
              <div className="db-topbar-title">{activeSection.icon} {activeSection.label}</div>
              <div className="db-topbar-sub">{company} Lead Analytics · {activeSection.desc}</div>
            </div>
            <div className="db-topbar-right">
              {range && <div className="db-range-badge">📅 {range}</div>}
              <div className="db-live-badge">
                <div className="db-live-dot" />
                Live data
              </div>
            </div>
          </div>

          {/* Main */}
          <main className="db-main">
            {!mounted ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ height:120, borderRadius:14, background:'linear-gradient(135deg,#e2e8f0,#f1f5f9)', animation:'skeleton-pulse 1.4s ease-in-out infinite' }} />
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                  <SkeletonCard height={220} />
                  <SkeletonCard height={220} />
                  <SkeletonCard height={220} />
                </div>
                <SkeletonCard height={380} />
              </div>
            ) : error ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
                <ErrorState message={error} onRetry={handleRetry} retrying={isPending} />
              </div>
            ) : (
              <>
                <div className="db-section-header">
                  <div className="db-section-header-left">
                    <h2>{activeSection.label}</h2>
                    <p>{activeSection.desc}{range ? ` · ${range}` : ''}</p>
                  </div>
                </div>
                <SectionContent id={active} data={data} />
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
