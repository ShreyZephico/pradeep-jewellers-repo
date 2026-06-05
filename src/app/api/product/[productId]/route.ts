import { NextResponse } from "next/server";

import { fetchSingleCatalogProduct } from "@/lib/fetchSingleCatalogProduct";
import {
  readProductDetailApiCache,
  writeProductDetailApiCache,
} from "@/lib/productDetailApiCache";

export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId: raw } = await context.params;
    const productId = decodeURIComponent(raw ?? "").trim();

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Invalid product id" },
        { status: 400 }
      );
    }

    const cachedBody = readProductDetailApiCache(productId);
    if (cachedBody) {
      return new NextResponse(cachedBody, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "public, s-maxage=120, stale-while-revalidate=300",
          "X-Cache": "HIT",
        },
      });
    }

    const product = await fetchSingleCatalogProduct(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const body = JSON.stringify({ success: true, product });
    writeProductDetailApiCache(productId, body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "public, s-maxage=120, stale-while-revalidate=300",
        "X-Cache": "MISS",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/product/[productId]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
