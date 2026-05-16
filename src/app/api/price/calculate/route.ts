import { NextResponse } from "next/server";

import calculateVariantPrice from "@/utils/calculateVariantPrice";
import { resolveVariantWeight } from "@/utils/resolveVariantWeight";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const weight = resolveVariantWeight(
      typeof body.weight === "number" ? body.weight : Number(body.weight)
    );
    const carat =
      typeof body.carat === "string" && body.carat.trim()
        ? body.carat.trim()
        : null;

    const pricing = await calculateVariantPrice({ weight, carat });

    return NextResponse.json({
      success: true,
      ...pricing,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Price calculation failed",
      },
      { status: 500 }
    );
  }
}
