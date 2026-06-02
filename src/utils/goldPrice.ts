import { getSupabaseServerClient } from "@/lib/supabaseServer";

let cachedPrice: number | null = null;
let cachedMissing = false;
let cachedAt = 0;
let inFlight: Promise<number | null> | null = null;
const CACHE_TTL_MS = 60_000;

async function fetchGoldPriceFromDb(): Promise<number | null> {
  const { data, error } = await getSupabaseServerClient()
    .schema("dev")
    .from("store_metal_prices")
    .select("price")
    .eq("source", "manual")
    .eq("metal", "gold")
    .eq("purity_label", "24K")
    .eq("unit", "gram")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    cachedPrice = null;
    cachedMissing = true;
    cachedAt = Date.now();
    return null;
  }

  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0) {
    cachedPrice = null;
    cachedMissing = true;
    cachedAt = Date.now();
    return null;
  }

  cachedPrice = price;
  cachedMissing = false;
  cachedAt = Date.now();
  return price;
}

/** Clear in-memory cache (call after saving new prices on /metal-prices). */
export function clearGoldPriceCache(): void {
  cachedPrice = null;
  cachedMissing = false;
  cachedAt = 0;
  inFlight = null;
}

/** Latest manual 24K gold rate per gram, or null if none saved yet. */
async function getGoldPrice(): Promise<number | null> {
  const now = Date.now();
  if (now - cachedAt < CACHE_TTL_MS) {
    if (cachedMissing) return null;
    if (cachedPrice !== null) return cachedPrice;
  }

  if (!inFlight) {
    inFlight = fetchGoldPriceFromDb().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

export default getGoldPrice;
