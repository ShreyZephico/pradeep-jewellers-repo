import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getRecommendedProducts } from "@/lib/getRecommendedProducts";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get("slug") ?? searchParams.get("handle") ?? "")
      .trim();
    const limitRaw =
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) ||
      DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, limitRaw));

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Missing product slug" },
        { status: 400 }
      );
    }

    const result = await getRecommendedProducts(slug, limit);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        products: result.products,
        sourceProductId: result.sourceProductId,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/products/recommended:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
