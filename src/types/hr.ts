export interface HRMonthData {
  month: string;
  hires: Record<string, number>;
  total: number;
}

export interface HRDataResult {
  data: HRMonthData[];
  error?: string;
}
