import type { GoldRateApiResponse } from "@/types/goldRate";

export type MetalPriceSnapshot = {
  gold22k: number;
  gold24k: number;
  silver: number;
};

let cache: {
  payload: GoldRateApiResponse;
  expiresAt: number;
} | null = null;

let previousPrices: MetalPriceSnapshot | null = null;

export function getCacheTtlMs(refreshIntervalMinutes: number): number {
  const minutes = Math.max(1, refreshIntervalMinutes);
  return minutes * 60 * 1000;
}

export function getCachedGoldRates(): GoldRateApiResponse | null {
  if (!cache) return null;
  if (Date.now() > cache.expiresAt) {
    cache = null;
    return null;
  }
  return cache.payload;
}

export function clearGoldRatesCache() {
  cache = null;
}

export function setCachedGoldRates(
  payload: GoldRateApiResponse,
  ttlMs: number
) {
  cache = {
    payload,
    expiresAt: Date.now() + ttlMs,
  };
}

export function getPreviousPrices(): MetalPriceSnapshot | null {
  return previousPrices;
}

export function setPreviousPrices(prices: MetalPriceSnapshot) {
  previousPrices = prices;
}
