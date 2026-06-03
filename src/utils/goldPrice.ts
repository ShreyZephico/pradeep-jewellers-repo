import { getSupabaseServerClient } from "@/lib/supabaseServer";

let cachedByPurity: Map<string, number> | null = null;
let cachedMissing = false;
let cachedAt = 0;
let inFlight: Promise<Map<string, number> | null> | null = null;
const CACHE_TTL_MS = 30_000;

async function fetchManualGoldPricesByPurity(): Promise<Map<string, number> | null> {
  const { data, error } = await getSupabaseServerClient()
    .schema("dev")
    .from("store_metal_prices")
    .select("price, purity_label, created_at")
    .eq("source", "manual")
    .eq("metal", "gold")
    .eq("unit", "gram")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data?.length) {
    cachedByPurity = null;
    cachedMissing = true;
    cachedAt = Date.now();
    return null;
  }

  const map = new Map<string, number>();
  for (const row of data) {
    const label = String(row.purity_label ?? "").trim();
    if (!label || map.has(label)) continue;

    const price = Number(row.price);
    if (!Number.isFinite(price) || price <= 0) continue;

    map.set(label, price);
  }

  if (map.size === 0) {
    cachedByPurity = null;
    cachedMissing = true;
    cachedAt = Date.now();
    return null;
  }

  cachedByPurity = map;
  cachedMissing = false;
  cachedAt = Date.now();
  return map;
}

async function getManualGoldPricesByPurity(): Promise<Map<string, number> | null> {
  const now = Date.now();
  if (now - cachedAt < CACHE_TTL_MS) {
    if (cachedMissing) return null;
    if (cachedByPurity) return cachedByPurity;
  }

  if (!inFlight) {
    inFlight = fetchManualGoldPricesByPurity().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

/** Clear in-memory cache (call after saving new prices on /metal-prices). */
export function clearGoldPriceCache(): void {
  cachedByPurity = null;
  cachedMissing = false;
  cachedAt = 0;
  inFlight = null;
}

export function karatToPurityLabel(karat: number): string {
  return `${karat}K`;
}

function derive24KFromKaratPrice(price: number, karat: number): number {
  return (price * 24) / karat;
}

export type GoldKaratPricing = {
  purity: number;
  karat: number;
  base24KGoldPrice: number;
  adjustedGoldPrice: number;
  perGramRate: number;
};

/**
 * Uses the same manual store_metal_prices rows shown on the landing page
 * (22K ticker, /metal-prices admin). Prefers the saved rate for the selected
 * karat; falls back to 24K × purity when only 24K exists.
 */
export async function getGoldPricingForKarat(
  karat: number
): Promise<GoldKaratPricing | null> {
  const prices = await getManualGoldPricesByPurity();
  if (!prices?.size) return null;

  const purityPercentage = Math.round((karat / 24) * 100);
  const purityLabel = karatToPurityLabel(karat);
  const stored24K = prices.get("24K");
  const storedKarat = prices.get(purityLabel);

  let base24KGoldPrice: number;
  let adjustedGoldPrice: number;

  if (storedKarat != null) {
    adjustedGoldPrice = storedKarat;
    if (stored24K != null) {
      base24KGoldPrice = stored24K;
    } else if (karat === 24) {
      base24KGoldPrice = storedKarat;
    } else {
      base24KGoldPrice = derive24KFromKaratPrice(storedKarat, karat);
    }
  } else if (stored24K != null) {
    base24KGoldPrice = stored24K;
    adjustedGoldPrice = (stored24K * purityPercentage) / 100;
  } else {
    const fallback22K = prices.get("22K");
    if (fallback22K == null) return null;

    base24KGoldPrice = derive24KFromKaratPrice(fallback22K, 22);
    adjustedGoldPrice = (base24KGoldPrice * purityPercentage) / 100;
  }

  return {
    purity: purityPercentage,
    karat,
    base24KGoldPrice: Math.round(base24KGoldPrice),
    adjustedGoldPrice: Math.round(adjustedGoldPrice),
    perGramRate: Math.ceil(adjustedGoldPrice),
  };
}

/** Latest manual 24K gold rate per gram, or null if none saved yet. */
async function getGoldPrice(): Promise<number | null> {
  const prices = await getManualGoldPricesByPurity();
  if (!prices?.size) return null;

  if (prices.has("24K")) {
    return prices.get("24K")!;
  }

  const fallback22K = prices.get("22K");
  if (fallback22K != null) {
    return Math.round(derive24KFromKaratPrice(fallback22K, 22));
  }

  const fallback18K = prices.get("18K");
  if (fallback18K != null) {
    return Math.round(derive24KFromKaratPrice(fallback18K, 18));
  }

  return null;
}

export default getGoldPrice;
