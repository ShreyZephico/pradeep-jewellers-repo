import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

/** Reuse one client; gold price is fetched on the server only. */
function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_KEY?.trim();
    if (!url || !key) {
      throw new Error("Supabase credentials are not configured");
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

let cachedPrice: number | null = null;
let cachedAt = 0;
let inFlight: Promise<number> | null = null;
const CACHE_TTL_MS = 60_000;

async function fetchGoldPriceFromDb(): Promise<number> {
  const { data, error } = await getSupabase()
    .schema("dev")
    .from("metal_prices")
    .select("price, rounded_price")
    .ilike("metal", "gold")
    .ilike("purity_label", "24%")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No gold price found");
  }

  const price = Number(data.rounded_price ?? data.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid gold price in database");
  }

  console.log("[goldPrice] 24K per gram (from DB):", price, {
    raw: data.price,
    rounded: data.rounded_price,
  });

  cachedPrice = price;
  cachedAt = Date.now();
  return price;
}

/** Latest 24K gold rate per gram from `dev.metal_prices`. */
async function getGoldPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedPrice;
  }

  if (!inFlight) {
    inFlight = fetchGoldPriceFromDb().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

export default getGoldPrice;
