import { formatRateTimestamp } from "@/lib/goldRates";
import {
  fetchStoreMetalPriceRows,
  pricesByDay,
  type StoreMetalDbQueryConfig,
  type StoreMetalPriceRow,
} from "@/lib/storeMetalPricesQuery";

import type {
  MetalHistorySeries,
  MetalHistoryStats,
  MetalRateHistoryPoint,
  RatesAnalyticsApiResponse,
  RatesTableRow,
} from "@/types/goldRate";

export type MetalDbQueryConfig = StoreMetalDbQueryConfig;

export type RatesAnalyticsDbConfig = {
  gold24k: MetalDbQueryConfig;
  gold22k: MetalDbQueryConfig;
  gold14k: MetalDbQueryConfig;
  gold9k: MetalDbQueryConfig;
  silver1kg: MetalDbQueryConfig;
  city: string;
  location: string;
  labels: {
    gold24k: string;
    gold22k: string;
    gold14k: string;
    gold9k: string;
    silver1kg: string;
  };
};

export const RATES_ANALYTICS_MAX_DAYS = 30;

function formatTableDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function buildHistoryPoints(
  rows: StoreMetalPriceRow[],
  multiplier: number,
  days: number
): MetalRateHistoryPoint[] {
  const byDay = pricesByDay(rows, multiplier);
  const sortedDays = [...byDay.keys()].sort().slice(-Math.max(1, days));
  const points: MetalRateHistoryPoint[] = [];
  let prevPrice: number | null = null;

  for (const date of sortedDays) {
    const entry = byDay.get(date)!;
    const point: MetalRateHistoryPoint = {
      date,
      price: entry.price,
      fetchedAt: entry.createdAt,
    };
    if (prevPrice != null && prevPrice > 0) {
      point.percentChange = Number(
        (((entry.price - prevPrice) / prevPrice) * 100).toFixed(2)
      );
    }
    points.push(point);
    prevPrice = entry.price;
  }

  return points;
}

function buildHistoryStats(points: MetalRateHistoryPoint[]): MetalHistoryStats | null {
  if (!points.length) return null;

  const prices = points.map((p) => p.price);
  const current = prices[prices.length - 1];
  const first = prices[0];
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const average = Number(
    (prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(2)
  );
  const changePeriod = Number((current - first).toFixed(2));
  const changePeriodPercent =
    first > 0
      ? Number((((current - first) / first) * 100).toFixed(2))
      : 0;

  return {
    current,
    high,
    low,
    average,
    changePeriod,
    changePeriodPercent,
    status:
      current > first ? "increased" : current < first ? "decreased" : "same",
  };
}

function buildSeries(
  key: string,
  label: string,
  unitSuffix: string,
  fractionDigits: number,
  rows: StoreMetalPriceRow[],
  multiplier: number,
  days: number
): MetalHistorySeries | null {
  const points = buildHistoryPoints(rows, multiplier, days);
  const stats = buildHistoryStats(points);
  if (!stats) return null;
  return { key, label, unitSuffix, fractionDigits, points, stats };
}

function buildComparisonTable(
  gold24: MetalRateHistoryPoint[],
  gold22: MetalRateHistoryPoint[],
  gold14: MetalRateHistoryPoint[] | null,
  gold9: MetalRateHistoryPoint[] | null,
  silver: MetalRateHistoryPoint[]
): RatesTableRow[] {
  const dateSet = new Set<string>();
  for (const p of [...gold24, ...gold22, ...(gold14 ?? []), ...(gold9 ?? []), ...silver]) {
    dateSet.add(p.date);
  }

  const map24 = new Map(gold24.map((p) => [p.date, p]));
  const map22 = new Map(gold22.map((p) => [p.date, p]));
  const map14 = new Map((gold14 ?? []).map((p) => [p.date, p]));
  const map9 = new Map((gold9 ?? []).map((p) => [p.date, p]));
  const mapAg = new Map(silver.map((p) => [p.date, p]));

  return [...dateSet]
    .sort()
    .map((date) => ({
      date,
      dateLabel: formatTableDate(date),
      gold24k: map24.get(date)?.price ?? null,
      gold22k: map22.get(date)?.price ?? null,
      gold14k: map14.get(date)?.price ?? null,
      gold9k: map9.get(date)?.price ?? null,
      silver1kg: mapAg.get(date)?.price ?? null,
      gold24kChange: map24.get(date)?.percentChange,
      gold22kChange: map22.get(date)?.percentChange,
      gold14kChange: map14.get(date)?.percentChange,
      gold9kChange: map9.get(date)?.percentChange,
      silver1kgChange: mapAg.get(date)?.percentChange,
    }));
}

export async function fetchRatesAnalyticsFromDb(
  config: RatesAnalyticsDbConfig,
  days: number
): Promise<RatesAnalyticsApiResponse> {
  const windowDays = Math.min(
    RATES_ANALYTICS_MAX_DAYS,
    Math.max(2, Math.floor(days))
  );
  const historyDays = windowDays + 2;

  const [gold24Rows, gold22Rows, gold14Rows, gold9Rows, silverRows] = await Promise.all([
    fetchStoreMetalPriceRows(config.gold24k, historyDays),
    fetchStoreMetalPriceRows(config.gold22k, historyDays),
    fetchStoreMetalPriceRows(config.gold14k, historyDays),
    fetchStoreMetalPriceRows(config.gold9k, historyDays),
    fetchStoreMetalPriceRows(config.silver1kg, historyDays),
  ]);

  const gold24k = buildSeries(
    "gold24k",
    config.labels.gold24k,
    "/ gram",
    2,
    gold24Rows,
    config.gold24k.priceMultiplier ?? 1,
    windowDays
  );
  const gold22k = buildSeries(
    "gold22k",
    config.labels.gold22k,
    "/ gram",
    2,
    gold22Rows,
    config.gold22k.priceMultiplier ?? 1,
    windowDays
  );
  const gold14k = buildSeries(
    "gold14k",
    config.labels.gold14k,
    "/ gram",
    2,
    gold14Rows,
    config.gold14k.priceMultiplier ?? 1,
    windowDays
  );
  const gold9k = buildSeries(
    "gold9k",
    config.labels.gold9k,
    "/ gram",
    2,
    gold9Rows,
    config.gold9k.priceMultiplier ?? 1,
    windowDays
  );
  const silver1kg = buildSeries(
    "silver1kg",
    config.labels.silver1kg,
    "",
    2,
    silverRows,
    config.silver1kg.priceMultiplier ?? 1,
    windowDays
  );

  if (!gold24k || !gold22k || !silver1kg) {
    const missing: string[] = [];
    if (!gold24k) missing.push("24K gold");
    if (!gold22k) missing.push("22K gold");
    if (!silver1kg) missing.push("silver (1 kg)");
    return {
      success: false,
      error: `No rate history found for: ${missing.join(", ")}`,
    };
  }

  const latestFetchedAt = [
    gold24k.points.at(-1)?.fetchedAt,
    gold22k.points.at(-1)?.fetchedAt,
    gold14k?.points.at(-1)?.fetchedAt,
    gold9k?.points.at(-1)?.fetchedAt,
    silver1kg.points.at(-1)?.fetchedAt,
  ]
    .filter(Boolean)
    .sort()
    .pop()!;

  const updatedAt = formatRateTimestamp(latestFetchedAt);

  return {
    success: true,
    days: windowDays,
    maxDays: RATES_ANALYTICS_MAX_DAYS,
    updatedAt,
    fetchedAt: latestFetchedAt,
    city: config.city,
    location: config.location,
    series: {
      gold24k,
      gold22k,
      ...(gold14k ? { gold14k } : {}),
      ...(gold9k ? { gold9k } : {}),
      silver1kg,
    },
    table: buildComparisonTable(
      gold24k.points,
      gold22k.points,
      gold14k?.points ?? null,
      gold9k?.points ?? null,
      silver1kg.points
    ),
  };
}
