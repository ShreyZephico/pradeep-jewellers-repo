import contactData from "@/data/contactDatas.json";
import {
  clearGoldRatesCache,
  getCachedGoldRates,
  getCacheTtlMs,
  setCachedGoldRates,
} from "@/lib/goldRateServerCache";
import type { FetchMetalRatesConfig } from "@/utils/metalRatesFromDb";
import { fetchMetalRatesFromDb } from "@/utils/metalRatesFromDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFRESH_MINUTES =
  contactData.heroSection.rates.refreshIntervalMinutes ?? 5;
const CACHE_TTL_MS = getCacheTtlMs(REFRESH_MINUTES);

const ratesConfig = contactData.heroSection.rates;

function buildDbConfig(): FetchMetalRatesConfig {
  return {
    gold22k: {
      metal: ratesConfig.gold22k.db.metal,
      purityLabel: ratesConfig.gold22k.db.purityLabel,
      location: ratesConfig.gold22k.db.location,
      unit: ratesConfig.gold22k.db.unit,
      weight: ratesConfig.gold22k.db.weight,
      priceMultiplier: ratesConfig.gold22k.db.priceMultiplier,
    },
    silver1kg: {
      metal: ratesConfig.silver1kg.db.metal,
      purityLabel: ratesConfig.silver1kg.db.purityLabel,
      location: ratesConfig.silver1kg.db.location,
      unit: ratesConfig.silver1kg.db.unit,
      weight: ratesConfig.silver1kg.db.weight,
      priceMultiplier: ratesConfig.silver1kg.db.priceMultiplier,
    },
    compareDays: ratesConfig.compareDays ?? 1,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceFresh = searchParams.get("fresh") === "1";

  if (forceFresh) {
    clearGoldRatesCache();
  }

  const cached = forceFresh ? null : getCachedGoldRates();
  if (cached) {
    return Response.json(cached, {
      headers: {
        "Cache-Control": `public, s-maxage=${REFRESH_MINUTES * 60}, stale-while-revalidate=30`,
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const payload = await fetchMetalRatesFromDb(buildDbConfig());

    if (payload.success) {
      setCachedGoldRates(payload, CACHE_TTL_MS);
    }

    const maxAge = payload.success ? REFRESH_MINUTES * 60 : 0;

    return Response.json(payload, {
      status: payload.success ? 200 : 404,
      headers: {
        "Cache-Control": payload.success
          ? `public, s-maxage=${maxAge}, stale-while-revalidate=30`
          : "no-store",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch rates from database";

    return Response.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
