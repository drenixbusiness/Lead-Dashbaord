export interface LeadsDataRow {
  month: string;
  leads: number;
  hired: number;
  hired_by_leads: number;
  hired_by_leadbase: number;
  hired_by_referral: number;
  hire_rate_pct: number;
  ad_spend_usd: number;
  high_band: number;
  normal_band: number;
  low_band: number;
}

export interface LeadsDataResult {
  data: LeadsDataRow[];
  error?: string;
}
