'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadsDataRow } from '../../types/leads';
import PerformanceBandsChart from './PerformanceBandsChart';
import LeadsHireRateChart from './LeadsHireRateChart';
import AdSpendChart from './AdSpendChart';
import HireRateSummaryCard from './HireRateSummaryCard';
import HireRateBreakdownCard from './HireRateBreakdownCard';
import HiresBySourceChart from './HiresBySourceChart';
import HireRateCompositionChart from './HireRateCompositionChart';

const CARD_STYLE: React.CSSProperties = {
  background: '#f0faf5',
  border: '0.5px solid #c2e8d6',
  borderRadius: 10,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
};

function SkeletonPulse({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #d4ede4 25%, #e8f5ef 50%, #d4ede4 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-pulse 1.4s ease-in-out infinite',
      borderRadius: 6,
      ...style,
    }} />
  );
}

function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div style={{ ...CARD_STYLE, gap: 10, height }}>
      <SkeletonPulse style={{ height: 14, width: '55%' }} />
      <SkeletonPulse style={{ height: 10, width: '40%' }} />
      <SkeletonPulse style={{ flex: 1, minHeight: 60 }} />
    </div>
  );
}

function ErrorState({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 12,
      padding: 24,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Failed to load dashboard data</div>
      <div style={{
        fontSize: 12,
        color: '#6b7280',
        maxWidth: 380,
        lineHeight: 1.6,
        fontFamily: 'monospace',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        padding: '8px 12px',
      }}>
        {message}
      </div>
      <button
        onClick={onRetry}
        disabled={retrying}
        style={{
          padding: '8px 20px',
          background: retrying ? '#9ca3af' : '#1D9E75',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: retrying ? 'not-allowed' : 'pointer',
        }}
      >
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}

interface Props {
  data: LeadsDataRow[];
  error?: string;
}

export default function DashboardContent({ data, error }: Props) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setMounted(true); }, []);

  function handleRetry() {
    startTransition(() => { router.refresh(); });
  }

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .leads-dashboard {
          min-height: 100dvh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 12px;
          box-sizing: border-box;
        }
        .leads-kpi-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .leads-bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .leads-dashboard {
            padding: 12px;
          }
          .leads-kpi-row,
          .leads-bottom-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="leads-dashboard">
        {!mounted ? (
          <>
            <div className="leads-kpi-row">
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
            </div>
            <SkeletonCard height={380} />
            <div className="leads-bottom-row">
              <SkeletonCard height={360} />
              <SkeletonCard height={360} />
            </div>
            <div className="leads-bottom-row">
              <SkeletonCard height={380} />
              <SkeletonCard height={380} />
            </div>
          </>
        ) : error ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ErrorState message={error} onRetry={handleRetry} retrying={isPending} />
          </div>
        ) : (
          <>
            {/* Headline KPIs — lead volume conversion, then hiring-rate composition */}
            <div className="leads-kpi-row">
              <div style={CARD_STYLE}>
                <HireRateSummaryCard data={data} />
              </div>
              <div style={CARD_STYLE}>
                <HireRateBreakdownCard data={data} />
              </div>
            </div>
            {/* Performance Bands — full width */}
            <div style={{ ...CARD_STYLE, height: 380 }}>
              <PerformanceBandsChart data={data} />
            </div>
            {/* Leads & hire rate / Ad spend — side by side */}
            <div className="leads-bottom-row">
              <div style={{ ...CARD_STYLE, height: 360 }}>
                <LeadsHireRateChart data={data} />
              </div>
              <div style={{ ...CARD_STYLE, height: 360 }}>
                <AdSpendChart data={data} />
              </div>
            </div>
            {/* Hires by source — counts (left) vs rate composition (right) */}
            <div className="leads-bottom-row">
              <div style={{ ...CARD_STYLE, height: 380 }}>
                <HiresBySourceChart data={data} />
              </div>
              <div style={{ ...CARD_STYLE, height: 380 }}>
                <HireRateCompositionChart data={data} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
