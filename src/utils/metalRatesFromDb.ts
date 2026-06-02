import { formatRateTimestamp } from "@/lib/goldRates";
import {
  fetchStoreMetalPriceRows,
  pricesByDay,
  type StoreMetalDbQueryConfig,
  type StoreMetalPriceRow,
} from "@/lib/storeMetalPricesQuery";

import type {
  GoldRateApiResponse,
  MetalRateItem,
  MetalRateTimestamp,
} from "@/types/goldRate";

export type MetalDbQueryConfig = StoreMetalDbQueryConfig;

export type FetchMetalRatesConfig = {
  gold22k: MetalDbQueryConfig;
  silver1kg: MetalDbQueryConfig;
  compareDays: number;
};

function toTimestamp(date: string, createdAt: string): MetalRateTimestamp {
  return { date, fetchedAt: createdAt, label: formatRateTimestamp(createdAt) };
}

function buildMetalRate(
  rows: StoreMetalPriceRow[],
  compareDays: number,
  multiplier: number
): (MetalRateItem & { fetchedAt: string }) | null {
  if (!rows.length) return null;

  const byDay = pricesByDay(rows, multiplier);
  const days = [...byDay.keys()].sort();

  if (!days.length) return null;

  const currentDay = days[days.length - 1];
  const oldDay = days[Math.max(0, days.length - 1 - compareDays)];

  const current = byDay.get(currentDay)!;
  const old = byDay.get(oldDay)!;

  const difference = Number((current.price - old.price).toFixed(2));
  const percentChange =
    old.price > 0
      ? Number((((current.price - old.price) / old.price) * 100).toFixed(2))
      : 0;

  return {
    current: current.price,
    old: old.price,
    difference,
    percentChange,
    status:
      current.price > old.price
        ? "increased"
        : current.price < old.price
          ? "decreased"
          : "same",
    currentAt: toTimestamp(currentDay, current.createdAt),
    oldAt: toTimestamp(oldDay, old.createdAt),
    fetchedAt: current.createdAt,
  };
}

export async function fetchMetalRatesFromDb(
  config: FetchMetalRatesConfig
): Promise<GoldRateApiResponse> {
  const compareDays = Math.max(1, config.compareDays);
  const historyDays = compareDays + 2;

  const [goldRows, silverRows] = await Promise.all([
    fetchStoreMetalPriceRows(config.gold22k, historyDays),
    fetchStoreMetalPriceRows(config.silver1kg, historyDays),
  ]);

  const gold22k = buildMetalRate(
    goldRows,
    compareDays,
    config.gold22k.priceMultiplier ?? 1
  );
  const silver1kg = buildMetalRate(
    silverRows,
    compareDays,
    config.silver1kg.priceMultiplier ?? 1
  );

  if (!gold22k || !silver1kg) {
    const missing: string[] = [];
    if (!gold22k) missing.push("22K gold");
    if (!silver1kg) missing.push("silver (1 kg)");
    return {
      success: false,
      error: `No rates found for: ${missing.join(", ")}`,
    };
  }

  const latestFetchedAt = [gold22k.fetchedAt, silver1kg.fetchedAt].sort().pop()!;

  const updatedAt = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(latestFetchedAt));

  return {
    success: true,
    updatedAt,
    fetchedAt: latestFetchedAt,
    compareDays,
    data: {
      gold22k: {
        current: gold22k.current,
        old: gold22k.old,
        difference: gold22k.difference,
        percentChange: gold22k.percentChange,
        status: gold22k.status,
        currentAt: gold22k.currentAt,
        oldAt: gold22k.oldAt,
      },
      silver1kg: {
        current: silver1kg.current,
        old: silver1kg.old,
        difference: silver1kg.difference,
        percentChange: silver1kg.percentChange,
        status: silver1kg.status,
        currentAt: silver1kg.currentAt,
        oldAt: silver1kg.oldAt,
      },
    },
  };
}

export async function getCachedMetalRatesFromDb(
  config: FetchMetalRatesConfig
): Promise<GoldRateApiResponse> {
  return fetchMetalRatesFromDb(config);
}

export function clearMetalRatesDbCache() {
  /* API route cache handles TTL */
}
