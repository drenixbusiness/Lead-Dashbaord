import type { DriverRecord } from '../types/roster';

export type { DriverRecord };

export interface RosterResult {
  drivers: DriverRecord[];
  error?: string;
}

const BP_SHEET_ID = '1v3tMPvGFJ4NqIFqCF0INtNuJLYEzZkdQ0ZBqcxDno7M';

function parseDate(raw: string): string | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts;
    if (y && y.length === 4) return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return raw.trim() || null;
}

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let inQuote = false;
  let cell = '';
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { cells.push(cell.trim()); cell = ''; }
    else { cell += ch; }
  }
  cells.push(cell.trim());
  return cells;
}

export async function fetchBPRosterData(): Promise<RosterResult> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${BP_SHEET_ID}/export?format=csv&gid=0`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const lines = (await res.text()).split('\n').map(l => l.trim()).filter(Boolean);
    const drivers: DriverRecord[] = [];

    for (const line of lines) {
      const cells = parseCSVLine(line);
      const colB = cells[1] ?? '';
      const colC = cells[2] ?? '';
      const colD = cells[3] ?? '';

      // Skip section labels and headers
      if (!colB || !colC) continue;
      const bLow = colB.toLowerCase();
      if (bLow.includes('drivers name') || bLow === 'active' || bLow.includes('temporary')) continue;
      if (bLow.includes('starting date')) continue;

      const name = colB.trim();
      if (name.length < 2) continue;

      drivers.push({
        name,
        hiredDate:       parseDate(colC),
        terminationDate: parseDate(colD) || null,
        hr:              null, // BP sheet has no HR column
        firstLoad:       null,
      });
    }

    return { drivers };
  } catch (err) {
    return { drivers: [], error: err instanceof Error ? err.message : String(err) };
  }
}
