export type MetalRateHistoryPoint = {
  date: string;
  price: number;
  /** DB row timestamp used for this day's price (ISO). */
  fetchedAt: string;
  /** Day-over-day % change (not set on first point). */
  percentChange?: number;
};

/** When the price was recorded (IST calendar day + DB fetch time). */
export type MetalRateTimestamp = {
  date: string;
  fetchedAt: string;
  label: string;
};

/** Public API / UI — no history array (built server-side only). */
export type MetalRateItem = {
  current: number;
  old: number;
  difference: number;
  /** % change vs price from `compareDays` calendar days earlier in history. */
  percentChange: number;
  status: "increased" | "decreased" | "same";
  currentAt: MetalRateTimestamp;
  oldAt: MetalRateTimestamp;
};

export type GoldRateApiResponse = {
  success: boolean;
  updatedAt?: string;
  fetchedAt?: string;
  compareDays?: number;
  data?: {
    gold22k: MetalRateItem;
    silver1kg: MetalRateItem;
  };
  error?: string;
};

export type MetalHistoryStats = {
  current: number;
  high: number;
  low: number;
  average: number;
  changePeriod: number;
  changePeriodPercent: number;
  status: "increased" | "decreased" | "same";
};

export type MetalHistorySeries = {
  key: string;
  label: string;
  unitSuffix: string;
  fractionDigits: number;
  points: MetalRateHistoryPoint[];
  stats: MetalHistoryStats;
};

export type RatesTableRow = {
  date: string;
  dateLabel: string;
  gold24k: number | null;
  gold22k: number | null;
  silver1kg: number | null;
  gold24kChange?: number;
  gold22kChange?: number;
  silver1kgChange?: number;
};

export type RatesAnalyticsApiResponse = {
  success: boolean;
  days?: number;
  maxDays?: number;
  updatedAt?: string;
  fetchedAt?: string;
  city?: string;
  location?: string;
  series?: {
    gold24k: MetalHistorySeries;
    gold22k: MetalHistorySeries;
    silver1kg: MetalHistorySeries;
  };
  table?: RatesTableRow[];
  error?: string;
};
