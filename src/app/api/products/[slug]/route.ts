import { NextResponse } from "next/server";

import { fetchSingleCatalogProduct } from "@/lib/fetchSingleCatalogProduct";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: raw } = await context.params;
    const slug = decodeURIComponent(raw ?? "").trim();

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Invalid product" },
        { status: 400 }
      );
    }

    const product = await fetchSingleCatalogProduct(slug);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        product,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Product detail API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
