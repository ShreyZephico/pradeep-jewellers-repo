import type { GoldRateApiResponse } from "@/types/goldRate";

let cache: {
  payload: GoldRateApiResponse;
  expiresAt: number;
} | null = null;

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
