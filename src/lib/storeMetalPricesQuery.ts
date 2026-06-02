import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StoreMetalDbQueryConfig = {
  metal: string;
  purityLabel: string;
  unit: string;
  priceMultiplier?: number;
};

export type StoreMetalPriceRow = {
  price: number | string;
  created_at: string;
};

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

export function rowPrice(row: StoreMetalPriceRow, multiplier = 1): number {
  const value = Number(row.price);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid price in database");
  }
  return value * multiplier;
}

export function istDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export type DayPrice = { price: number; createdAt: string };

/** Latest row per IST calendar day (rows must be newest-first). */
export function pricesByDay(
  rows: StoreMetalPriceRow[],
  multiplier: number
): Map<string, DayPrice> {
  const map = new Map<string, DayPrice>();

  for (const row of rows) {
    const day = istDate(row.created_at);
    if (!map.has(day)) {
      map.set(day, {
        price: rowPrice(row, multiplier),
        createdAt: row.created_at,
      });
    }
  }

  return map;
}

export async function fetchStoreMetalPriceRows(
  config: StoreMetalDbQueryConfig,
  historyDays: number
): Promise<StoreMetalPriceRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - historyDays);

  const { data, error } = await getSupabase()
    .schema("dev")
    .from("store_metal_prices")
    .select("price, created_at")
    .eq("source", "manual")
    .eq("metal", config.metal)
    .eq("purity_label", config.purityLabel)
    .eq("unit", config.unit)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StoreMetalPriceRow[];
}
