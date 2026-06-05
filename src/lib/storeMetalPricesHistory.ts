import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  METAL_PRICES_HISTORY_DAYS,
  STORE_METAL_PRICE_SLOTS,
} from "@/lib/metalPricesAdminConfig";
import { istDate } from "@/lib/storeMetalPricesQuery";

export type StoreMetalHistoryDayRow = {
  date: string;
  dateLabel: string;
  timeLabel: string;
  gold24: number | null;
  gold22: number | null;
  gold14: number | null;
  gold9: number | null;
  gold18: number | null;
  silver1kg: number | null;
};

type DbHistoryRow = {
  metal: string;
  purity_label: string;
  unit: string;
  price: number | string;
  created_at: string;
};

type SlotKey = (typeof STORE_METAL_PRICE_SLOTS)[number]["key"];

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

function formatDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function normalizePurity(label: string): string {
  return label.trim().toUpperCase().replace(/\s+/g, "");
}

function rowMatchesSlot(
  row: DbHistoryRow,
  metal: string,
  purityLabel: string,
  unit: string
): boolean {
  if (row.metal.toLowerCase() !== metal.toLowerCase()) return false;
  if (row.unit.toLowerCase() !== unit.toLowerCase()) return false;

  if (metal.toLowerCase() === "silver" && unit.toLowerCase() === "kg") {
    return normalizePurity(row.purity_label).includes("99");
  }

  return normalizePurity(row.purity_label) === normalizePurity(purityLabel);
}

type DayAccumulator = {
  date: string;
  timeIso: string;
  prices: Partial<Record<SlotKey, number>>;
};

/** Latest manual price per metal slot per IST day (last `days` days). */
export async function fetchStoreMetalPricesHistory(
  days = METAL_PRICES_HISTORY_DAYS
): Promise<{ days: number; rows: StoreMetalHistoryDayRow[] }> {
  const windowDays = Math.max(1, Math.floor(days));
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const { data, error } = await getSupabase()
    .schema("dev")
    .from("store_metal_prices")
    .select("metal, purity_label, unit, price, created_at")
    .eq("source", "manual")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  const dbRows = (data ?? []) as DbHistoryRow[];
  const byDay = new Map<string, DayAccumulator>();

  for (const row of dbRows) {
    const day = istDate(row.created_at);
    const price = Number(row.price);
    if (!Number.isFinite(price) || price <= 0) continue;

    let acc = byDay.get(day);
    if (!acc) {
      acc = { date: day, timeIso: row.created_at, prices: {} };
      byDay.set(day, acc);
    }

    if (row.created_at > acc.timeIso) {
      acc.timeIso = row.created_at;
    }

    for (const slot of STORE_METAL_PRICE_SLOTS) {
      if (acc.prices[slot.key] != null) continue;
      if (!rowMatchesSlot(row, slot.metal, slot.purityLabel, slot.unit)) continue;
      acc.prices[slot.key] = price;
    }
  }

  const historyRows: StoreMetalHistoryDayRow[] = [...byDay.values()]
    .map((acc) => ({
      date: acc.date,
      dateLabel: formatDayLabel(acc.date),
      timeLabel: formatTimeLabel(acc.timeIso),
      gold24: acc.prices.gold24 ?? null,
      gold22: acc.prices.gold22 ?? null,
      gold14: acc.prices.gold14 ?? null,
      gold9: acc.prices.gold9 ?? null,
      gold18: acc.prices.gold18 ?? null,
      silver1kg: acc.prices.silver1kg ?? null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return { days: windowDays, rows: historyRows };
}
