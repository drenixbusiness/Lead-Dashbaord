import type { DriverRecord } from '../types/roster';
import type { HRMonthData } from '../types/hr';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseISODate(raw: string | null): Date | null {
  if (!raw) return null;
  // Prefer YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    if (y < 2024 || y > 2027) return null;
    return d;
  }
  // MM/DD/YYYY
  const mdy = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const y = Number(mdy[3]);
    if (y < 2024 || y > 2027) return null;
    const d = new Date(`${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const m = Number(key.split('-')[1]);
  return MONTH_NAMES[m - 1];
}

function yearFromKey(key: string): number {
  return Number(key.split('-')[0]);
}

/** Inclusive list of YYYY-MM keys from start through end. */
function monthKeysInRange(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let [y, m] = startKey.split('-').map(Number);
  const [ey, em] = endKey.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return keys;
}

/** Tight per-chart Y scale so bars fill the plot (not crushed by company max). */
export function movementNiceScale(rows: MovementMonth[]): { max: number; step: number } {
  let dataMax = 0;
  for (const r of rows) {
    dataMax = Math.max(
      dataMax,
      r.onboarded ?? 0,
      r.departed ?? 0,
      r.headcount ?? 0,
    );
  }
  // Small headroom only — keep bars visually large (like Chart.js auto-scale)
  if (dataMax <= 1)  return { max: 2,  step: 1 };
  if (dataMax <= 2)  return { max: 3,  step: 1 };
  if (dataMax <= 4)  return { max: 5,  step: 1 };
  if (dataMax <= 6)  return { max: 8,  step: 1 };
  if (dataMax <= 8)  return { max: 10, step: 2 };
  if (dataMax <= 12) return { max: 14, step: 2 };
  if (dataMax <= 18) return { max: 20, step: 2 };
  if (dataMax <= 28) return { max: 30, step: 5 };
  if (dataMax <= 38) return { max: 40, step: 5 };
  return { max: Math.ceil((dataMax * 1.1) / 5) * 5, step: 5 };
}

/** @deprecated Prefer movementNiceScale — kept for callers that only need a max. */
export function movementScaleMax(rows: MovementMonth[]): number {
  return movementNiceScale(rows).max;
}

/** Human-readable year note for a set of YYYY-MM keys, e.g. "2026" or "2025–2026". */
export function movementYearNote(monthKeys: string[]): string {
  if (monthKeys.length === 0) return '';
  const years = [...new Set(monthKeys.map(yearFromKey))].sort();
  if (years.length === 1) return String(years[0]);
  return `${years[0]}–${years[years.length - 1]}`;
}

function normalizeHR(raw: string | null): string {
  if (!raw?.trim()) return 'Unknown';
  const t = raw.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Build monthly HR hire counts from the local roster (no Google Sheet). */
export function buildHRDataFromRoster(drivers: DriverRecord[]): HRMonthData[] {
  const byMonth = new Map<string, Record<string, number>>();

  for (const driver of drivers) {
    const hired = parseISODate(driver.hiredDate);
    if (!hired) continue;
    const key = monthKey(hired);
    const hr = normalizeHR(driver.hr);
    const bucket = byMonth.get(key) ?? {};
    bucket[hr] = (bucket[hr] ?? 0) + 1;
    byMonth.set(key, bucket);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, hires]) => {
      const [y, m] = key.split('-').map(Number);
      return {
        month: `${MONTH_NAMES[m - 1]} ${y}`,
        hires,
        total: Object.values(hires).reduce((s, n) => s + n, 0),
      };
    });
}

export interface MovementMonth {
  /** YYYY-MM */
  monthKey: string;
  /** Display month only, e.g. "May" */
  month: string;
  year: number;
  /** null = no data for this month (future / before first activity) */
  onboarded: number | null;
  departed: number | null;
  headcount: number | null;
}

/** Movement charts only count drivers hired from Jan 2026 onward. */
export const MOVEMENT_HIRE_CUTOFF = '2026-01';

/** Full calendar year axis for movement charts. */
export const MOVEMENT_YEAR_KEYS = monthKeysInRange('2026-01', '2026-12');

/** Keep drivers hired on/after Jan 2026 (drop earlier hires). */
export function filterDriversHiredFrom2026(drivers: DriverRecord[]): DriverRecord[] {
  return drivers.filter((d) => {
    const hired = parseISODate(d.hiredDate);
    if (!hired) return false;
    return monthKey(hired) >= MOVEMENT_HIRE_CUTOFF;
  });
}

/** Monthly onboarding / departures / end-of-month headcount from local roster. */
export function buildMovementFromRoster(
  drivers: DriverRecord[],
  asOf = new Date(),
  opts?: { alignToMonthKeys?: string[] },
): MovementMonth[] {
  const asOfKey = monthKey(asOf);
  // Ignore anyone hired before Jan 2026
  const cohort = filterDriversHiredFrom2026(drivers);

  const onboarded = new Map<string, number>();
  const departed = new Map<string, number>();

  for (const driver of cohort) {
    const hired = parseISODate(driver.hiredDate);
    if (hired) {
      const k = monthKey(hired);
      if (k <= asOfKey) {
        onboarded.set(k, (onboarded.get(k) ?? 0) + 1);
      }
    }
    const term = parseISODate(driver.terminationDate);
    if (term) {
      const k = monthKey(term);
      if (k <= asOfKey) {
        departed.set(k, (departed.get(k) ?? 0) + 1);
      }
    }
  }

  // Always show full Jan–Dec 2026 unless a caller overrides
  const sorted =
    opts?.alignToMonthKeys && opts.alignToMonthKeys.length > 0
      ? opts.alignToMonthKeys
      : MOVEMENT_YEAR_KEYS;

  if (sorted.length === 0) return [];

  const activityKeys = [...onboarded.keys(), ...departed.keys()].sort();
  const firstActivity = activityKeys[0] ?? null;

  let headcount = 0;
  let started = false;

  return sorted.map((key) => {
    const future = key > asOfKey;
    const beforeStart = firstActivity != null && key < firstActivity;
    const on = onboarded.get(key) ?? 0;
    const off = departed.get(key) ?? 0;

    if (future || !firstActivity || beforeStart) {
      return {
        monthKey: key,
        month: monthLabel(key),
        year: yearFromKey(key),
        onboarded: null,
        departed: null,
        headcount: null,
      };
    }

    headcount = Math.max(0, headcount + on - off);
    started = true;
    return {
      monthKey: key,
      month: monthLabel(key),
      year: yearFromKey(key),
      onboarded: on,
      departed: off,
      // Keep 0 headcount after start if everyone left — that's real data
      headcount: started ? headcount : null,
    };
  });
}

export interface TenureBucket {
  label: string;
  count: number;
  color: string;
}

const TENURE_BUCKET_DEFS: { label: string; min: number; max: number; color: string }[] = [
  { label: '1–4 wks',   min: 0,  max: 4,  color: 'rgba(99,102,241,0.85)' },
  { label: '5–8 wks',   min: 5,  max: 8,  color: 'rgba(99,102,241,0.65)' },
  { label: '9–16 wks',  min: 9,  max: 16, color: 'rgba(99,102,241,0.85)' },
  { label: '17–24 wks', min: 17, max: 24, color: 'rgba(99,102,241,0.65)' },
  { label: '25+ wks',   min: 25, max: Infinity, color: 'rgba(99,102,241,0.5)' },
];

function weeksBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
}

/** Tenure buckets from first load day → termination (or today if still active). */
export function buildTenureFromRoster(drivers: DriverRecord[], asOf = new Date()): TenureBucket[] {
  const counts = TENURE_BUCKET_DEFS.map(() => 0);

  for (const driver of drivers) {
    // Tenure starts on first load day (when they actually began working)
    const start = parseISODate(driver.firstLoad);
    if (!start) continue;

    // Still with us → count weeks until today; terminated → until termination date
    const end = parseISODate(driver.terminationDate) ?? asOf;
    if (end < start) continue;

    const weeks = weeksBetween(start, end);
    const idx = TENURE_BUCKET_DEFS.findIndex((b) => weeks >= b.min && weeks <= b.max);
    if (idx >= 0) counts[idx]++;
  }

  return TENURE_BUCKET_DEFS.map((b, i) => ({
    label: b.label,
    count: counts[i],
    color: b.color,
  })).filter((b, i) => i < 4 || b.count > 0);
}
