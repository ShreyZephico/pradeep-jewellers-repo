import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { formatRateTimestamp } from "@/lib/goldRates";

import type {
  GoldRateApiResponse,
  MetalRateItem,
  MetalRateTimestamp,
} from "@/types/goldRate";

export type MetalDbQueryConfig = {
  metal: string;
  purityLabel: string;
  location: string;
  unit: string;
  weight: number;
  priceMultiplier?: number;
};

export type FetchMetalRatesConfig = {
  gold22k: MetalDbQueryConfig;
  silver1kg: MetalDbQueryConfig;
  compareDays: number;
};

type DbRow = {
  price: number | string;
  fetched_at: string;
};

type DayPrice = { price: number; fetchedAt: string };

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

function toTimestamp(date: string, fetchedAt: string): MetalRateTimestamp {
  return { date, fetchedAt, label: formatRateTimestamp(fetchedAt) };
}

/** Latest fetch per IST calendar day (rows must be newest-first). */
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

function buildMetalRate(
  rows: DbRow[],
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
    currentAt: toTimestamp(currentDay, current.fetchedAt),
    oldAt: toTimestamp(oldDay, old.fetchedAt),
    fetchedAt: current.fetchedAt,
  };
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

export async function fetchMetalRatesFromDb(
  config: FetchMetalRatesConfig
): Promise<GoldRateApiResponse> {
  const compareDays = Math.max(1, config.compareDays);
  const historyDays = compareDays + 2;

  const [goldRows, silverRows] = await Promise.all([
    fetchRows(config.gold22k, historyDays),
    fetchRows(config.silver1kg, historyDays),
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
