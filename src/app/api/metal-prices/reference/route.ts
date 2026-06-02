import { NextResponse } from "next/server";

import { getMetalPricesAccessFromRequest } from "@/lib/accessUsers";
import {
  GOLDMETER_AHMEDABAD_URL,
  parseGoldmeterHtml,
} from "@/lib/goldmeterParse";

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

    const res = await fetch(GOLDMETER_AHMEDABAD_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "GoldMeter page could not be loaded" },
        { status: 502 }
      );
    }

    const { table, silver1kg } = parseGoldmeterHtml(await res.text());

    return NextResponse.json(
      { ok: true, table, silver1kg },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load GoldMeter reference";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
