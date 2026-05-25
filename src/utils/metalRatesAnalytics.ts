import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { formatRateTimestamp } from "@/lib/goldRates";

import type {
  MetalHistorySeries,
  MetalHistoryStats,
  MetalRateHistoryPoint,
  RatesAnalyticsApiResponse,
  RatesTableRow,
} from "@/types/goldRate";
import type { MetalDbQueryConfig } from "@/utils/metalRatesFromDb";

/** Mirrors `metalRatesFromDb` query logic — do not change that module. */
type DbRow = { price: number | string; fetched_at: string };
type DayPrice = { price: number; fetchedAt: string };

export type RatesAnalyticsDbConfig = {
  gold24k: MetalDbQueryConfig;
  gold22k: MetalDbQueryConfig;
  silver1kg: MetalDbQueryConfig;
  city: string;
  location: string;
  labels: {
    gold24k: string;
    gold22k: string;
    silver1kg: string;
  };
};

export const RATES_ANALYTICS_MAX_DAYS = 30;

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_KEY?.trim();
    if (!url || !key) {
      throw new Error("Supabase credentials are not configured");
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

function rowPrice(row: DbRow, multiplier = 1): number {
  const value = Number(row.price);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid price in database");
  }
  return value * multiplier;
}

function istDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

function formatTableDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",   
    month: "short",
  }).format(d);
}

function pricesByDay(rows: DbRow[], multiplier: number): Map<string, DayPrice> {
  const map = new Map<string, DayPrice>();
  for (const row of rows) {
    const day = istDate(row.fetched_at);
    if (!map.has(day)) {
      map.set(day, {
        price: rowPrice(row, multiplier),
        fetchedAt: row.fetched_at,
      });
    }
  }
  return map;
}

async function fetchRows(
  config: MetalDbQueryConfig,
  historyDays: number
): Promise<DbRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - historyDays);

  const { data, error } = await getSupabase()
    .schema("dev")
    .from("metal_prices")
    .select("price, fetched_at")
    .eq("metal", config.metal)
    .eq("purity_label", config.purityLabel)
    .ilike("location", config.location)
    .eq("unit", config.unit)
    .eq("weight", config.weight)
    .gte("fetched_at", since.toISOString())
    .order("fetched_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbRow[];
}

function buildHistoryPoints(
  rows: DbRow[],
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
      fetchedAt: entry.fetchedAt,
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
  rows: DbRow[],
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
  silver: MetalRateHistoryPoint[]
): RatesTableRow[] {
  const dateSet = new Set<string>();
  for (const p of [...gold24, ...gold22, ...silver]) dateSet.add(p.date);

  const map24 = new Map(gold24.map((p) => [p.date, p]));
  const map22 = new Map(gold22.map((p) => [p.date, p]));
  const mapAg = new Map(silver.map((p) => [p.date, p]));

  return [...dateSet]
    .sort()
    .map((date) => ({
      date,
      dateLabel: formatTableDate(date),
      gold24k: map24.get(date)?.price ?? null,
      gold22k: map22.get(date)?.price ?? null,
      silver1kg: mapAg.get(date)?.price ?? null,
      gold24kChange: map24.get(date)?.percentChange,
      gold22kChange: map22.get(date)?.percentChange,
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

  const [gold24Rows, gold22Rows, silverRows] = await Promise.all([
    fetchRows(config.gold24k, historyDays),
    fetchRows(config.gold22k, historyDays),
    fetchRows(config.silver1kg, historyDays),
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
    series: { gold24k, gold22k, silver1kg },
    table: buildComparisonTable(
      gold24k.points,
      gold22k.points,
      silver1kg.points
    ),
  };
}
