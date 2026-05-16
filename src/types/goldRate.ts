export type MetalRateItem = {
  current: number;
  old: number;
  difference: number;
  status: "increased" | "decreased" | "same";
  increased: boolean;
};

export type GoldRateApiResponse = {
  success: boolean;
  updatedAt?: string;
  /** ISO time when our server last scraped the source */
  fetchedAt?: string;
  data?: {
    gold22k: MetalRateItem;
    gold24k: MetalRateItem;
    silver: MetalRateItem;
  };
  error?: string;
};
