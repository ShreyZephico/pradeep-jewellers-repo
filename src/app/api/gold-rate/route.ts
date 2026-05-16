import * as cheerio from "cheerio";

import contactData from "@/data/contactDatas.json";
import {
  clearGoldRatesCache,
  getCachedGoldRates,
  getCacheTtlMs,
  getPreviousPrices,
  setCachedGoldRates,
  setPreviousPrices,
} from "@/lib/goldRateServerCache";
import type { GoldRateApiResponse, MetalRateItem } from "@/types/goldRate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCRAPE_TIMEOUT_MS = 12_000;
const REFRESH_MINUTES =
  contactData.heroSection.rates.refreshIntervalMinutes ?? 5;
const CACHE_TTL_MS = getCacheTtlMs(REFRESH_MINUTES);

function buildRate(current: number, previous?: number): MetalRateItem {
  const old =
    previous !== undefined && previous > 0
      ? previous
      : Number((current - current * 0.004).toFixed(2));

  const difference = Number((current - old).toFixed(2));
  const increased = current > old;
  const decreased = current < old;

  return {
    current,
    old,
    difference,
    status: increased ? "increased" : decreased ? "decreased" : "same",
    increased,
  };
}

async function fetchGoldRatesFromSource(): Promise<GoldRateApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
  const prev = getPreviousPrices();

  try {
    const response = await fetch(
      "https://goldmeter.in/gold-rate/ahmedabad",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: controller.signal,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch website" };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let gold22kCurrent: number | undefined;
    let gold24kCurrent: number | undefined;
    let silverCurrent: number | undefined;
    let updatedAt = "";

    $("table tbody tr").each((_, element) => {
      const columns = $(element).find("td");
      const title = columns.eq(0).text().trim();

      const currentPrice = columns
        .eq(2)
        .text()
        .replace(/[₹,]/g, "")
        .trim();
      const current = Number(currentPrice);
      if (!current) return;

      if (title.includes("22K") || title.includes("22 Carat")) {
        gold22kCurrent = current;
      }
      if (title.includes("24K") || title.includes("24 Carat")) {
        gold24kCurrent = current;
      }
      if (title.toLowerCase().includes("silver")) {
        silverCurrent = current;
      }
    });

    const bodyText = $("body").text();
    const match = bodyText.match(
      /\d{1,2}\s\w+\s\d{4},\s\d{1,2}:\d{2}\s?(am|pm)/i
    );
    if (match) {
      updatedAt = match[0];
    } else {
      updatedAt = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date());
    }

    if (!gold22kCurrent || !gold24kCurrent || !silverCurrent) {
      return { success: false, error: "Could not parse rates from source" };
    }

    const gold22k = buildRate(gold22kCurrent, prev?.gold22k);
    const gold24k = buildRate(gold24kCurrent, prev?.gold24k);
    const silver = buildRate(silverCurrent, prev?.silver);

    setPreviousPrices({
      gold22k: gold22kCurrent,
      gold24k: gold24kCurrent,
      silver: silverCurrent,
    });

    return {
      success: true,
      updatedAt,
      fetchedAt: new Date().toISOString(),
      data: { gold22k, gold24k, silver },
    };
  } finally {
    clearTimeout(timeoutId);
  }
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
    const payload = await fetchGoldRatesFromSource();

    if (payload.success) {
      setCachedGoldRates(payload, CACHE_TTL_MS);
    }

    const maxAge = payload.success ? REFRESH_MINUTES * 60 : 0;

    return Response.json(payload, {
      headers: {
        "Cache-Control": payload.success
          ? `public, s-maxage=${maxAge}, stale-while-revalidate=30`
          : "no-store",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return Response.json(
      {
        success: false,
        error: isAbort
          ? "Rate source timed out — try again shortly"
          : "Failed to fetch rates",
      },
      { status: isAbort ? 504 : 500 }
    );
  }
}
