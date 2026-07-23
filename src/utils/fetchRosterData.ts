import type { DriverRecord } from '../types/roster';

export type { DriverRecord };

export interface RosterResult {
  drivers: DriverRecord[];
  error?: string;
}

// BP sheet with active/terminated roster (start & left dates)
const BP_ROSTER_ID = '1v3tMPvGFJ4NqIFqCF0INtNuJLYEzZkdQ0ZBqcxDno7M';

// BP HR monthly tabs — driver name + HR name per month
const BP_HR_ID = '1TpoZFQdXA7wb-Ljuyw53MplTJeKCPRZTxgOyHPH0pZM';
const BP_HR_GIDS = [1348361704, 1631028660, 1096656459, 693650426, 762556289, 844332491, 1446224036];

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

// Normalize a name for fuzzy matching — lowercase, strip punctuation & common suffixes
function normName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\bcomp\b|\bcompany\b|\bfleet\b|\bteam\b/gi, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build HR lookup map from all monthly tabs: normName -> HR rep name
async function buildHRMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(BP_HR_GIDS.map(async (gid) => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${BP_HR_ID}/export?format=csv&gid=${gid}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const lines = (await res.text()).split('\n');
      for (const line of lines) {
        const cells = parseCSVLine(line);
        // Driver name is col B (index 1), HR name is col C (index 2) for Jan/Feb/Apr/May/Jun/Jul
        // For Mar there's an extra col, but col C is "New Leads" and col D is HR — find by header scan
        const colB = cells[1] ?? '';
        const colC = cells[2] ?? '';
        if (!colB || !colC) continue;
        const bLow = colB.toLowerCase();
        if (bLow === 'name' || bLow === 'hr name' || bLow.includes('mvr') || bLow.includes('type')) continue;
        if (colC.toLowerCase() === 'hr name' || colC.toLowerCase() === 'new leads') {
          // March has extra col — skip, will pick up from col D
          continue;
        }
        const hr = colC.trim();
        if (!hr || hr.length < 2 || hr.toLowerCase() === 'hr') continue;
        const key = normName(colB);
        if (key && !map.has(key)) map.set(key, hr);
      }
      // Also handle March-style where HR is col D
      const lines2 = (await fetch(url, { cache: 'no-store' }).then(r => r.text())).split('\n');
      for (const line of lines2) {
        const cells = parseCSVLine(line);
        const colB = cells[1] ?? '';
        const colD = cells[3] ?? '';
        if (!colB || !colD) continue;
        if (colD.toLowerCase() === 'hr name') continue;
        const hr = colD.trim();
        // Only use colD if it looks like a person name (not a date, number, or keyword)
        if (!hr || hr.length < 2 || /^\d|starpoint|translab|paid/i.test(hr)) continue;
        const key = normName(colB);
        if (key && !map.has(key)) map.set(key, hr);
      }
    } catch { /* skip failed tab */ }
  }));
  return map;
}

export async function fetchBPRosterData(): Promise<RosterResult> {
  try {
    // Fetch both in parallel
    const [rosterRes, hrMap] = await Promise.all([
      fetch(`https://docs.google.com/spreadsheets/d/${BP_ROSTER_ID}/export?format=csv&gid=0`, { cache: 'no-store' }),
      buildHRMap(),
    ]);
    if (!rosterRes.ok) throw new Error(`HTTP ${rosterRes.status}`);

    const lines = (await rosterRes.text()).split('\n').map(l => l.trim()).filter(Boolean);
    const drivers: DriverRecord[] = [];

    for (const line of lines) {
      const cells = parseCSVLine(line);
      const colB = cells[1] ?? '';
      const colC = cells[2] ?? '';
      const colD = cells[3] ?? '';

      if (!colB || !colC) continue;
      const bLow = colB.toLowerCase();
      if (bLow.includes('drivers name') || bLow === 'active' || bLow.includes('temporary')) continue;
      if (bLow.includes('starting date')) continue;

      const name = colB.trim();
      if (name.length < 2) continue;

      // Look up HR by normalized name
      const key = normName(name);
      const hr = hrMap.get(key) ?? null;

      drivers.push({
        name,
        hiredDate:       parseDate(colC),
        terminationDate: parseDate(colD) || null,
        hr,
        firstLoad: null,
      });
    }

    return { drivers };
  } catch (err) {
    return { drivers: [], error: err instanceof Error ? err.message : String(err) };
  }
}
