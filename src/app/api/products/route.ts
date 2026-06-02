import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { parsePriceParam, parseProductSort } from "@/lib/productFilters";
import { getProductsPage } from "@/lib/shopify";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/** Commas break Shopify search parsing; normalize for search. */
function sanitizeSearchInput(value: string): string {
  return value.replace(/,/g, " ").trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    const { products, total, totalPages, priceBounds } = await getProductsPage({
      page,
      limit,
      q,
      category,
      minPrice,
      maxPrice,
      sort,
    });

    return NextResponse.json(
      {
        success: true,
        total,
        page,
        limit,
        totalPages,
        products,
        priceBounds,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
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
