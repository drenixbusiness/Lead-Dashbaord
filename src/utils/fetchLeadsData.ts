import type { LeadsDataRow, LeadsDataResult } from '../types/leads';

const SHEET_ID = process.env.LEADS_SHEET_ID;

// The "Leads Performance Report" sheet keeps its monthly numbers on the "JM" tab.
const SHEET_TAB = 'Main';

// Mock numbers reflect the team's real-world baseline: ~300 leads/month at ~$5 cost per lead.
const MOCK_DATA: LeadsDataRow[] = [
  { month: 'Jan 2026', leads: 280, hired: 11, hired_by_leads: 9,  hired_by_leadbase: 1, hired_by_referral: 1, hire_rate_pct: 3.9, ad_spend_usd: 1400, high_band: 350, normal_band: 300, low_band: 240 },
  { month: 'Feb 2026', leads: 305, hired: 13, hired_by_leads: 10, hired_by_leadbase: 1, hired_by_referral: 2, hire_rate_pct: 4.3, ad_spend_usd: 1525, high_band: 350, normal_band: 300, low_band: 240 },
  { month: 'Mar 2026', leads: 320, hired: 14, hired_by_leads: 11, hired_by_leadbase: 1, hired_by_referral: 2, hire_rate_pct: 4.4, ad_spend_usd: 1600, high_band: 350, normal_band: 300, low_band: 240 },
  { month: 'Apr 2026', leads: 295, hired: 12, hired_by_leads: 9,  hired_by_leadbase: 2, hired_by_referral: 1, hire_rate_pct: 4.1, ad_spend_usd: 1475, high_band: 350, normal_band: 300, low_band: 240 },
  { month: 'May 2026', leads: 312, hired: 14, hired_by_leads: 11, hired_by_leadbase: 1, hired_by_referral: 2, hire_rate_pct: 4.5, ad_spend_usd: 1560, high_band: 350, normal_band: 300, low_band: 240 },
  { month: 'Jun 2026', leads: 330, hired: 16, hired_by_leads: 13, hired_by_leadbase: 1, hired_by_referral: 2, hire_rate_pct: 4.8, ad_spend_usd: 1650, high_band: 350, normal_band: 300, low_band: 240 },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The sheet only stores a month number (1-12); pair it with the most plausible year —
// the current year, unless that month hasn't happened yet (then it must be last year's row).
function monthLabel(monthNum: number): string {
  const idx = Math.round(monthNum) - 1;
  if (idx < 0 || idx > 11) return String(monthNum);
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const year = idx > currentMonthIdx ? now.getFullYear() - 1 : now.getFullYear();
  return `${MONTH_NAMES[idx]} ${year}`;
}

type GvizCell = { v: string | number | null } | null;
type GvizRow = { c: GvizCell[] };
type GvizCol = { label?: string };

// Look columns up by their header label rather than fixed position — the report has
// a leading spacer column and extra fields (CPL, targets, notes) we don't all use.
function columnIndex(cols: GvizCol[]): Record<string, number> {
  const index: Record<string, number> = {};
  cols.forEach((col, i) => {
    const label = col?.label?.trim();
    if (label) index[label] = i;
  });
  return index;
}

function cellNumber(row: GvizRow, index: Record<string, number>, label: string): number {
  const i = index[label];
  if (i == null) return 0;
  const v = row.c?.[i]?.v;
  return typeof v === 'number' ? v : Number(v ?? 0);
}

export async function fetchLeadsData(): Promise<LeadsDataResult> {
  if (!SHEET_ID) {
    return { data: MOCK_DATA };
  }

  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_TAB}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const text = await res.text();
    // Strip the JSONP wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const jsonStr = text
      .replace(/^[^(]+\(/, '')
      .replace(/\);\s*$/, '');
    const json = JSON.parse(jsonStr);

    const cols: GvizCol[] = json?.table?.cols ?? [];
    const rows: GvizRow[] = json?.table?.rows ?? [];
    const index = columnIndex(cols);

    const months = rows
      .map((row) => {
        const leads = cellNumber(row, index, 'Total Leads');
        const hired = cellNumber(row, index, 'Hired Total');
        return {
          month: monthLabel(cellNumber(row, index, 'Month')),
          leads,
          hired,
          hired_by_leads: cellNumber(row, index, 'Hired by Leads'),
          hired_by_leadbase: cellNumber(row, index, 'Hired by Lead Base'),
          hired_by_referral: cellNumber(row, index, 'Hired by Referral'),
          hire_rate_pct: leads > 0 ? Math.round((hired / leads) * 1000) / 10 : 0,
          ad_spend_usd: cellNumber(row, index, 'Amount Spent'),
        };
      })
      // Drop months the report hasn't reached yet (no leads logged).
      .filter((row) => row.leads > 0);

    if (months.length === 0) throw new Error('Sheet returned no data rows. Check the sheet ID and tab name.');

    // The report doesn't carry High/Normal/Low band targets — derive them from the
    // months on hand so Performance Bands still gives a meaningful read.
    const avgLeads = months.reduce((s, r) => s + r.leads, 0) / months.length;
    const normal_band = Math.round(avgLeads);
    const high_band = Math.round(avgLeads * 1.25);
    const low_band = Math.round(avgLeads * 0.7);

    const data: LeadsDataRow[] = months.map((row) => ({ ...row, high_band, normal_band, low_band }));

    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: MOCK_DATA, error: message };
  }
}
