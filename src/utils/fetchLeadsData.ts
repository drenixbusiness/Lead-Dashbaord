import type { LeadsDataRow, LeadsDataResult } from '../types/leads';

const SHEET_ID = process.env.LEADS_SHEET_ID;

const MOCK_DATA: LeadsDataRow[] = [
  { month: 'Jul 2024', leads: 98,  hired: 3, hire_rate_pct: 3.1, ad_spend_usd: 3200, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Aug 2024', leads: 112, hired: 4, hire_rate_pct: 3.6, ad_spend_usd: 3400, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Sep 2024', leads: 75,  hired: 2, hire_rate_pct: 2.7, ad_spend_usd: 3000, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Oct 2024', leads: 65,  hired: 2, hire_rate_pct: 3.1, ad_spend_usd: 3800, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Nov 2024', leads: 88,  hired: 3, hire_rate_pct: 3.4, ad_spend_usd: 4200, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Dec 2024', leads: 143, hired: 5, hire_rate_pct: 3.5, ad_spend_usd: 5100, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Jan 2025', leads: 162, hired: 6, hire_rate_pct: 3.7, ad_spend_usd: 5800, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Feb 2025', leads: 134, hired: 5, hire_rate_pct: 3.7, ad_spend_usd: 5200, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Mar 2025', leads: 175, hired: 7, hire_rate_pct: 4.0, ad_spend_usd: 6000, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Apr 2025', leads: 191, hired: 8, hire_rate_pct: 4.2, ad_spend_usd: 6500, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'May 2025', leads: 158, hired: 6, hire_rate_pct: 3.8, ad_spend_usd: 5900, high_band: 180, normal_band: 130, low_band: 80 },
  { month: 'Jun 2025', leads: 203, hired: 9, hire_rate_pct: 4.4, ad_spend_usd: 7200, high_band: 180, normal_band: 130, low_band: 80 },
];

type GvizCell = { v: string | number | null } | null;
type GvizRow = { c: GvizCell[] };

export async function fetchLeadsData(): Promise<LeadsDataResult> {
  if (!SHEET_ID) {
    return { data: MOCK_DATA };
  }

  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=monthly_data`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const text = await res.text();
    // Strip the JSONP wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const jsonStr = text
      .replace(/^[^(]+\(/, '')
      .replace(/\);\s*$/, '');
    const json = JSON.parse(jsonStr);

    const rows: GvizRow[] = json?.table?.rows ?? [];

    const data: LeadsDataRow[] = rows
      .filter((row) => row.c?.[0]?.v != null)
      .map((row) => ({
        month: String(row.c[0]?.v ?? ''),
        leads: Number(row.c[1]?.v ?? 0),
        hired: Number(row.c[2]?.v ?? 0),
        hire_rate_pct: Number(row.c[3]?.v ?? 0),
        ad_spend_usd: Number(row.c[4]?.v ?? 0),
        high_band: Number(row.c[5]?.v ?? 0),
        normal_band: Number(row.c[6]?.v ?? 0),
        low_band: Number(row.c[7]?.v ?? 0),
      }));

    if (data.length === 0) throw new Error('Sheet returned no data rows. Check the sheet ID and tab name.');

    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: MOCK_DATA, error: message };
  }
}
