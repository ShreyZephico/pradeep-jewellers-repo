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
