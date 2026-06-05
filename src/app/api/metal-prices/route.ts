import { NextResponse } from "next/server";

import { getMetalPricesAccessFromRequest } from "@/lib/accessUsers";
import {
  insertStoreMetalPrices,
  permissionHint,
} from "@/lib/storeMetalPricesDb";
import { clearGoldRatesCache } from "@/lib/goldRateServerCache";
import { clearGoldPriceCache } from "@/utils/goldPrice";

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

type SaveBody = {
  gold24?: number;
  gold22?: number;
  gold14?: number;
  gold9?: number;
  gold18?: number;
  silver1kg?: number;
};

export async function POST(request: Request) {
  try {
    const access = await getMetalPricesAccessFromRequest(request);
    if (!access.authorized) {
      return accessDeniedResponse(access);
    }

    const body = (await request.json()) as SaveBody;
    const gold24 = Number(body.gold24);
    const gold22 = Number(body.gold22);
    const gold14 = Number(body.gold14);
    const gold9 = Number(body.gold9);
    const gold18 = Number(body.gold18);
    const silver1kg = Number(body.silver1kg);

    if (
      ![gold24, gold22, gold14, gold9, gold18, silver1kg].every(
        (n) => Number.isFinite(n) && n > 0
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "Please enter valid prices for all fields" },
        { status: 400 }
      );
    }

    await insertStoreMetalPrices(
      [
        { metal: "gold", purity_label: "24K", unit: "gram", price: gold24 },
        { metal: "gold", purity_label: "22K", unit: "gram", price: gold22 },
        { metal: "gold", purity_label: "14K", unit: "gram", price: gold14 },
        { metal: "gold", purity_label: "9K", unit: "gram", price: gold9 },
        { metal: "gold", purity_label: "18K", unit: "gram", price: gold18 },
        {
          metal: "silver",
          purity_label: "99.99%",
          unit: "kg",
          price: silver1kg,
        },
      ],
      { email: access.email }
    );

    clearGoldPriceCache();
    clearGoldRatesCache();

    return NextResponse.json({ ok: true, message: "Prices saved" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save";
    return NextResponse.json(
      { ok: false, error: permissionHint(message) },
      { status: 500 }
    );
  }
}
