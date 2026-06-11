import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { parsePriceParam, parseProductSort } from "@/lib/productFilters";
import { parseCollectionFacetFilters } from "@/lib/shopCollectionFilters";
import { parseRingSizesQueryParam } from "@/utils/ringSizeChart";
import {
  readProductsApiCache,
  writeProductsApiCache,
} from "@/lib/productsApiCache";
import { getProductsPage } from "@/lib/shopify";

/** Paginated catalog must run per request — Netlify Edge must not cache by path only. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const PRODUCTS_JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-store, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Netlify-CDN-Cache-Control": "no-store",
};

/** Commas break Shopify search parsing; normalize for search. */
function sanitizeSearchInput(value: string): string {
  return value.replace(/,/g, " ").trim();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cacheKey = searchParams.toString();
    const cachedBody = readProductsApiCache(cacheKey);
    if (cachedBody) {
      return new NextResponse(cachedBody, {
        status: 200,
        headers: {
          ...PRODUCTS_JSON_HEADERS,
          "X-Cache": "HIT",
        },
      });
    }
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limitRaw =
      parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) ||
      DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, limitRaw));
    const q = sanitizeSearchInput(searchParams.get("q") ?? "");
    const category = searchParams.get("category") ?? "all";
    const minPrice = parsePriceParam(searchParams.get("minPrice"));
    const maxPrice = parsePriceParam(searchParams.get("maxPrice"));
    const sort = parseProductSort(searchParams.get("sort"));
    const ringSizes = parseRingSizesQueryParam(searchParams.get("sizes"));
    const facets = parseCollectionFacetFilters({
      discount: searchParams.get("discount"),
      weight: searchParams.get("weight"),
      material: searchParams.get("material"),
      metal: searchParams.get("metal"),
      shop: searchParams.get("shop"),
      occasion: searchParams.get("occasion"),
      searchTag: searchParams.get("searchTag"),
    });

    const {
      products,
      total,
      totalPages,
      priceBounds,
      searchTagOptions,
      searchTagSuggestions,
    } = await getProductsPage({
      page,
      limit,
      q,
      category,
      minPrice,
      maxPrice,
      sort,
      ringSizes,
      facets,
    });

    const payload = {
      success: true,
      total,
      page,
      limit,
      totalPages,
      products,
      priceBounds,
      searchTagOptions,
      searchTagSuggestions,
    };
    const body = JSON.stringify(payload);
    writeProductsApiCache(cacheKey, body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        ...PRODUCTS_JSON_HEADERS,
        "X-Cache": "MISS",
        "X-Shopify-Products-Total": String(total),
        "X-Products-Page": String(page),
        "X-Products-Limit": String(limit),
      },
    });
  } catch (error: unknown) {
    console.error("Products API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
