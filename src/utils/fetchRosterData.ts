import type { DriverRecord } from '../types/roster';

export type { DriverRecord };

export interface RosterResult {
  drivers: DriverRecord[];
  error?: string;
}

const BP_ROSTER_ID = '1v3tMPvGFJ4NqIFqCF0INtNuJLYEzZkdQ0ZBqcxDno7M';
const BP_HR_ID     = '1TpoZFQdXA7wb-Ljuyw53MplTJeKCPRZTxgOyHPH0pZM';
const BP_HR_GIDS   = [1348361704, 1631028660, 1096656459, 693650426, 762556289, 844332491, 1446224036];

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

function isValidHRName(raw: string): boolean {
  const v = raw.trim();
  if (!v || v.length < 2) return false;
  const low = v.toLowerCase();
  if (/january|february|march|april|may|june|july|august|september|october|november|december/i.test(v)) return false;
  if (/leads?|referral|fleet|driver[si]?|new|eski|paid|starpoint|translab|company|comp\b/i.test(low)) return false;
  if (/\d/.test(v)) return false;
  if (v.trim().split(/\s+/).length > 2) return false;
  return true;
}

function normName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\bcomp\b|\bcompany\b|\bfleet\b|\bteam\b/gi, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple edit distance (Levenshtein) for fuzzy name matching
function editDist(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 4) return 99;
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// Look up HR by trying: exact → reversed tokens → fuzzy edit distance
function lookupHR(name: string, hrMap: Map<string, string>): string | null {
  const key = normName(name);
  if (hrMap.has(key)) return hrMap.get(key)!;

  const reversed = key.split(' ').reverse().join(' ');
  if (hrMap.has(reversed)) return hrMap.get(reversed)!;

  // Fuzzy: find HR map key with lowest edit distance
  const maxDist = key.length > 14 ? 3 : key.length > 9 ? 2 : key.length > 6 ? 1 : 0;
  if (maxDist === 0) return null;

  let bestDist = maxDist + 1;
  let bestHR: string | null = null;
  for (const [k, v] of hrMap) {
    const d = Math.min(editDist(key, k), editDist(reversed, k));
    if (d < bestDist) { bestDist = d; bestHR = v; }
  }
  return bestHR;
}

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
        const driverName = cells[1] ?? '';
        if (!driverName || driverName.length < 2) continue;
        const dLow = driverName.toLowerCase();
        if (dLow === 'name' || dLow.includes('mvr') || dLow.includes('process')) continue;

        // HR name is in col C (index 2) for most tabs; col D (index 3) for March-style tabs
        const colC = cells[2] ?? '';
        const colD = cells[3] ?? '';
        const hr = isValidHRName(colC) ? colC.trim() : (isValidHRName(colD) ? colD.trim() : null);
        if (!hr) continue;

        const key = normName(driverName);
        const rev = key.split(' ').reverse().join(' ');
        if (key && !map.has(key)) map.set(key, hr);
        if (rev && !map.has(rev)) map.set(rev, hr);
      }
    } catch { /* skip failed tab */ }
  }));
  return map;
}

export async function fetchBPRosterData(): Promise<RosterResult> {
  try {
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
      if (bLow.includes('drivers name') || bLow === 'active' || bLow.includes('temporary') || bLow.includes('starting date')) continue;

      const name = colB.trim();
      if (name.length < 2) continue;

      const hr = lookupHR(name, hrMap);

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
