import type { HRMonthData, HRDataResult } from '../types/hr';

const SHEET_ID = '1XQWZikQ4NYrTOplUEGEESaC2uf6o0bo002_1xDfVbds';
const MONTHS   = ['Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026','Jun 2026'];

function normalizeHR(raw: string): string {
  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1).toLowerCase();
}

export async function fetchHRData(): Promise<HRDataResult> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    const res  = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const text  = await res.text();
    const lines = text.split('\n').map(l => l.trim());

    // Split into per-month tables by "Driver Name" header lines
    const tables: string[][] = [];
    let current: string[]    = [];

    for (const line of lines) {
      if (line.startsWith('Driver Name')) {
        if (current.length) tables.push(current);
        current = [];
      } else if (line && line !== ',') {
        current.push(line);
      }
    }
    if (current.length) tables.push(current);

    const data: HRMonthData[] = tables.slice(0, 6).map((rows, i) => {
      const hires: Record<string, number> = {};
      for (const row of rows) {
        // Last comma-separated value is the HR name
        const parts = row.split(',');
        const hr    = normalizeHR(parts[parts.length - 1]);
        if (hr && hr.length > 1) {
          hires[hr] = (hires[hr] ?? 0) + 1;
        }
      }
      return {
        month: MONTHS[i] ?? `Month ${i + 1}`,
        hires,
        total: Object.values(hires).reduce((s, v) => s + v, 0),
      };
    });

    if (data.length === 0) throw new Error('HR sheet returned no data.');
    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: [], error: message };
  }
}
