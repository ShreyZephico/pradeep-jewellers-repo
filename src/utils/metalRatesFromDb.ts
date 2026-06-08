import { formatRateTimestamp } from "@/lib/goldRates";
import {
  fetchStoreMetalPriceRows,
  pricesByDay,
  type StoreMetalDbQueryConfig,
  type StoreMetalPriceRow,
} from "@/lib/storeMetalPricesQuery";
import {
  computeMetalPercentChange,
  pickComparableBaselineDay,
} from "@/utils/metalRatePercent";

import type {
  GoldRateApiResponse,
  MetalRateItem,
  MetalRateTimestamp,
} from "@/types/goldRate";

export type MetalDbQueryConfig = StoreMetalDbQueryConfig;

export type FetchMetalRatesConfig = {
  gold22k: MetalDbQueryConfig;
  gold14k: MetalDbQueryConfig;
  gold18k: MetalDbQueryConfig;
  gold9k: MetalDbQueryConfig;
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
  const oldDay = pickComparableBaselineDay(
    days,
    (day) => byDay.get(day)!.price,
    compareDays
  );

  const current = byDay.get(currentDay)!;
  const old = byDay.get(oldDay)!;

  const difference = Number((current.price - old.price).toFixed(2));
  const percentChange = computeMetalPercentChange(current.price, old.price);

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

  const [gold22Rows, gold14Rows, gold18Rows, gold9Rows, silverRows] =
    await Promise.all([
      fetchStoreMetalPriceRows(config.gold22k, historyDays),
      fetchStoreMetalPriceRows(config.gold14k, historyDays),
      fetchStoreMetalPriceRows(config.gold18k, historyDays),
      fetchStoreMetalPriceRows(config.gold9k, historyDays),
      fetchStoreMetalPriceRows(config.silver1kg, historyDays),
    ]);

  const gold22k = buildMetalRate(
    gold22Rows,
    compareDays,
    config.gold22k.priceMultiplier ?? 1
  );
  const gold14k = buildMetalRate(
    gold14Rows,
    compareDays,
    config.gold14k.priceMultiplier ?? 1
  );
  const gold18k = buildMetalRate(
    gold18Rows,
    compareDays,
    config.gold18k.priceMultiplier ?? 1
  );
  const gold9k = buildMetalRate(
    gold9Rows,
    compareDays,
    config.gold9k.priceMultiplier ?? 1
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

  const latestFetchedAt = [
    gold22k.fetchedAt,
    gold14k?.fetchedAt,
    gold18k?.fetchedAt,
    gold9k?.fetchedAt,
    silver1kg.fetchedAt,
  ]
    .filter(Boolean)
    .sort()
    .pop()!;

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
      ...(gold14k
        ? {
            gold14k: {
              current: gold14k.current,
              old: gold14k.old,
              difference: gold14k.difference,
              percentChange: gold14k.percentChange,
              status: gold14k.status,
              currentAt: gold14k.currentAt,
              oldAt: gold14k.oldAt,
            },
          }
        : {}),
      ...(gold18k
        ? {
            gold18k: {
              current: gold18k.current,
              old: gold18k.old,
              difference: gold18k.difference,
              percentChange: gold18k.percentChange,
              status: gold18k.status,
              currentAt: gold18k.currentAt,
              oldAt: gold18k.oldAt,
            },
          }
        : {}),
      ...(gold9k
        ? {
            gold9k: {
              current: gold9k.current,
              old: gold9k.old,
              difference: gold9k.difference,
              percentChange: gold9k.percentChange,
              status: gold9k.status,
              currentAt: gold9k.currentAt,
              oldAt: gold9k.oldAt,
            },
          }
        : {}),
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
