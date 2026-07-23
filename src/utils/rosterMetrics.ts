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
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
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
    .map(([key, hires]) => ({
      month: monthLabel(key),
      hires,
      total: Object.values(hires).reduce((s, n) => s + n, 0),
    }));
}

export interface MovementMonth {
  month: string;
  onboarded: number;
  departed: number;
  headcount: number;
}

/** Monthly onboarding / departures / end-of-month headcount from local roster. */
export function buildMovementFromRoster(drivers: DriverRecord[]): MovementMonth[] {
  const keys = new Set<string>();
  const onboarded = new Map<string, number>();
  const departed = new Map<string, number>();

  for (const driver of drivers) {
    const hired = parseISODate(driver.hiredDate);
    if (hired) {
      const k = monthKey(hired);
      keys.add(k);
      onboarded.set(k, (onboarded.get(k) ?? 0) + 1);
    }
    const term = parseISODate(driver.terminationDate);
    if (term) {
      const k = monthKey(term);
      keys.add(k);
      departed.set(k, (departed.get(k) ?? 0) + 1);
    }
  }

  const sorted = [...keys].sort();
  let headcount = 0;
  // Drivers hired before the first chart month still count toward starting headcount
  if (sorted.length > 0) {
    const first = sorted[0];
    for (const driver of drivers) {
      const hired = parseISODate(driver.hiredDate);
      if (!hired) continue;
      if (monthKey(hired) < first) {
        const term = parseISODate(driver.terminationDate);
        if (!term || monthKey(term) >= first) headcount++;
      }
    }
  }

  return sorted.map((key) => {
    const on = onboarded.get(key) ?? 0;
    const off = departed.get(key) ?? 0;
    headcount += on - off;
    return {
      month: monthLabel(key),
      onboarded: on,
      departed: off,
      headcount: Math.max(0, headcount),
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
