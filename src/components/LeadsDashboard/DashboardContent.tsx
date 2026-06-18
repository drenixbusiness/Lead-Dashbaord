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

// ── Sidebar sections ────────────────────────────────────────────────────────
type SectionId = 'overview' | 'forecast' | 'performance' | 'hire-rates' | 'cost-spend' | 'sources';

const SECTIONS: { id: SectionId; label: string; icon: string; desc: string }[] = [
  { id: 'overview',     label: 'Overview',         icon: '◈', desc: 'KPIs & monthly data'       },
  { id: 'forecast',     label: 'Forecast',          icon: '◎', desc: '3-month projection'         },
  { id: 'performance',  label: 'Lead Performance',  icon: '▲', desc: 'Leads & hire rate trends'   },
  { id: 'hire-rates',   label: 'Hire Rates',        icon: '◉', desc: 'Rate by stream & source'   },
  { id: 'cost-spend',   label: 'Cost & Spend',      icon: '◆', desc: 'Ad spend & cost per hire'  },
  { id: 'sources',      label: 'Source Analysis',   icon: '◐', desc: 'Hires & rate by channel'   },
];

// ── Skeleton & error helpers ─────────────────────────────────────────────────
function SkeletonPulse({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg,#d4ede4 25%,#e8f5ef 50%,#d4ede4 75%)',
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
function ErrorState({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, padding:24, textAlign:'center' }}>
      <div style={{ fontSize:32 }}>⚠️</div>
      <div style={{ fontSize:14, fontWeight:600, color:'#1a1a1a' }}>Failed to load dashboard data</div>
      <div style={{ fontSize:12, color:'#6b7280', maxWidth:380, lineHeight:1.6, fontFamily:'monospace', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 12px' }}>
        {message}
      </div>
      <button onClick={onRetry} disabled={retrying} style={{ padding:'8px 20px', background:retrying?'#9ca3af':'#1D9E75', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:retrying?'not-allowed':'pointer' }}>
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}

// ── Section content ──────────────────────────────────────────────────────────
function SectionContent({ id, data }: { id: SectionId; data: LeadsDataRow[] }) {
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 };

  switch (id) {
    case 'overview':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div style={CARD}><HireRateSummaryCard data={data} /></div>
            <div style={CARD}><HireRateBreakdownCard data={data} /></div>
            <div style={{ ...CARD, minHeight:220 }}><MonthOverMonthCard data={data} /></div>
          </div>
        </div>
      );

    case 'forecast':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ ...CARD, minHeight:200 }}><ForecastCard data={data} /></div>
        </div>
      );

    case 'performance':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ ...CARD, height:380 }}><PerformanceBandsChart data={data} /></div>
          <div style={{ ...CARD, height:420 }}><HireRateBandsChart data={data} /></div>
          <div style={{ ...CARD, height:400 }}><LeadsHireRateChart data={data} /></div>
        </div>
      );

    case 'hire-rates':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={grid2}>
            <div style={{ ...CARD, height:400 }}><HireRateLeadsOnlyBandsChart data={data} /></div>
            <div style={{ ...CARD, height:400 }}><LeadBaseBandsChart data={data} /></div>
          </div>
          <div style={{ ...CARD, height:400 }}><HireRateBySourceChart /></div>
        </div>
      );

    case 'cost-spend':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={grid2}>
            <div style={{ ...CARD, height:400 }}><SpendingBandsChart data={data} /></div>
            <div style={{ ...CARD, height:400 }}><AdSpendChart data={data} /></div>
          </div>
          <div style={grid2}>
            <div style={{ ...CARD, height:400 }}><CostPerHireChart data={data} /></div>
            <div style={{ ...CARD, height:400 }}><OverallCostPerHireChart data={data} /></div>
          </div>
        </div>
      );

    case 'sources':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ ...CARD, height:420 }}><HiresBySourceChart data={data} /></div>
          <div style={{ ...CARD, height:400 }}><HireRateBySourceChart /></div>
        </div>
      );
  }
}

// ── Main component ───────────────────────────────────────────────────────────
interface Props { data: LeadsDataRow[]; error?: string; }

export default function DashboardContent({ data, error }: Props) {
  const [mounted, setMounted]       = useState(false);
  const [active, setActive]         = useState<SectionId>('overview');
  const [sidebarOpen, setSidebar]   = useState(true);
  const router                      = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setMounted(true); }, []);
  function handleRetry() { startTransition(() => { router.refresh(); }); }

  const activeSection = SECTIONS.find((s) => s.id === active)!;

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; }

        .db-shell {
          display: flex;
          height: 100dvh;
          overflow: hidden;
          background: #f4f7f5;
          font-family: "Google Sans", Arial, sans-serif;
        }

        /* ── Sidebar ── */
        .db-sidebar {
          width: 220px;
          min-width: 220px;
          background: #2e1145;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: width 0.22s ease, min-width 0.22s ease;
          z-index: 10;
        }
        .db-sidebar.collapsed {
          width: 56px;
          min-width: 56px;
        }
        .db-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .db-sidebar-logo-mark {
          width: 30px;
          height: 30px;
          min-width: 30px;
          background: linear-gradient(135deg,#7c3aed,#a855f7);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
        }
        .db-sidebar-logo-text {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          opacity: 1;
          transition: opacity 0.15s;
        }
        .db-sidebar.collapsed .db-sidebar-logo-text { opacity: 0; pointer-events: none; }

        .db-nav { flex: 1; padding: 10px 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }

        .db-nav-section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          padding: 10px 8px 4px;
          white-space: nowrap;
          overflow: hidden;
          opacity: 1;
          transition: opacity 0.15s;
        }
        .db-sidebar.collapsed .db-nav-section-label { opacity: 0; }

        .db-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          color: rgba(255,255,255,0.6);
        }
        .db-nav-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .db-nav-item.active { background: rgba(168,85,247,0.25); color: #fff; }
        .db-nav-icon {
          font-size: 15px;
          min-width: 20px;
          text-align: center;
          line-height: 1;
        }
        .db-nav-label {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          opacity: 1;
          transition: opacity 0.15s;
        }
        .db-sidebar.collapsed .db-nav-label { opacity: 0; pointer-events: none; }

        .db-sidebar-footer {
          padding: 12px 8px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        /* ── Right side ── */
        .db-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        /* ── Topbar ── */
        .db-topbar {
          height: 54px;
          min-height: 54px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
        }
        .db-toggle-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 7px; border: 1px solid #e5e7eb;
          background: #fff; cursor: pointer; color: #6b7280;
          font-size: 14px; flex-shrink: 0;
        }
        .db-toggle-btn:hover { background: #f3f4f6; }
        .db-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #9ca3af;
        }
        .db-breadcrumb-sep { color: #d1d5db; }
        .db-breadcrumb-active { color: #1a1a1a; font-weight: 600; }
        .db-topbar-title {
          font-size: 15px; font-weight: 700; color: #1a1a1a;
          margin-left: auto;
        }

        /* ── Main content ── */
        .db-main {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .db-section-header {
          margin-bottom: 16px;
        }
        .db-section-header h2 {
          margin: 0 0 2px;
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .db-section-header p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        @media (max-width: 900px) {
          .db-sidebar { width: 56px; min-width: 56px; }
          .db-sidebar .db-sidebar-logo-text,
          .db-sidebar .db-nav-label,
          .db-sidebar .db-nav-section-label { opacity: 0; pointer-events: none; }
          .three-col { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .two-col, .three-col { grid-template-columns: 1fr !important; }
          .db-main { padding: 12px; }
        }
      `}</style>

      <div className="db-shell">
        {/* ── Sidebar ── */}
        <nav className={`db-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
          <div className="db-sidebar-logo">
            <div className="db-sidebar-logo-mark">JM</div>
            <div className="db-sidebar-logo-text">Lead Analytics</div>
          </div>

          <div className="db-nav">
            <div className="db-nav-section-label">Analytics</div>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`db-nav-item${active === s.id ? ' active' : ''}`}
                onClick={() => setActive(s.id)}
                title={s.label}
              >
                <span className="db-nav-icon">{s.icon}</span>
                <span className="db-nav-label">{s.label}</span>
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
              <span className="db-nav-label">Collapse</span>
            </button>
          </div>
        </nav>

        {/* ── Right panel ── */}
        <div className="db-right">
          {/* Topbar */}
          <div className="db-topbar">
            <button className="db-toggle-btn" onClick={() => setSidebar((v) => !v)}>☰</button>
            <div className="db-breadcrumb">
              <span>JM Lead Analytics</span>
              <span className="db-breadcrumb-sep">/</span>
              <span className="db-breadcrumb-active">{activeSection.label}</span>
            </div>
            <div className="db-topbar-title">JM — Lead Analytics</div>
          </div>

          {/* Main */}
          <main className="db-main">
            {!mounted ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <SkeletonCard height={220} />
                <SkeletonCard height={380} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <SkeletonCard height={400} />
                  <SkeletonCard height={400} />
                </div>
              </div>
            ) : error ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
                <ErrorState message={error} onRetry={handleRetry} retrying={isPending} />
              </div>
            ) : (
              <>
                <div className="db-section-header">
                  <h2>{activeSection.label}</h2>
                  <p>{activeSection.desc}</p>
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
