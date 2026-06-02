import { NextResponse } from "next/server";

import { getMetalPricesAccessFromRequest } from "@/lib/accessUsers";
import { METAL_PRICES_HISTORY_DAYS } from "@/lib/metalPricesAdminConfig";
import { fetchStoreMetalPricesHistory } from "@/lib/storeMetalPricesHistory";
import { permissionHint } from "@/lib/storeMetalPricesDb";

function accessDeniedResponse(
  access: Awaited<ReturnType<typeof getMetalPricesAccessFromRequest>>
) {
  if (!access.authenticated) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to access metal prices." },
      { status: 401 }
    );
  }
  return NextResponse.json({ ok: false }, { status: 404 });
}

export async function GET(request: Request) {
  try {
    const access = await getMetalPricesAccessFromRequest(request);
    if (!access.authorized) {
      return accessDeniedResponse(access);
    }

    const { searchParams } = new URL(request.url);
    const daysParam = Number(searchParams.get("days"));
    const days = Number.isFinite(daysParam)
      ? Math.min(90, Math.max(1, Math.floor(daysParam)))
      : METAL_PRICES_HISTORY_DAYS;

    const payload = await fetchStoreMetalPricesHistory(days);

    return NextResponse.json(
      { ok: true, ...payload },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load price history";
    return NextResponse.json(
      { ok: false, error: permissionHint(message) },
      { status: 500 }
    );
  }
}
