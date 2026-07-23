/**
 * @deprecated Google Hire List sheet is disconnected.
 * JM HR hires now come from local `JM_DRIVERS` via `buildHRDataFromRoster`.
 * Kept only so old imports do not break; do not call this for JM.
 */
import type { HRMonthData, HRDataResult } from '../types/hr';

export async function fetchHRData(): Promise<HRDataResult> {
  return { data: [] as HRMonthData[], error: 'Google Hire List sheet disconnected — use local JM_DRIVERS' };
}
