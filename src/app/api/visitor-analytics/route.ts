import { NextResponse } from "next/server";

import { getMetalPricesAccessFromRequest } from "@/lib/accessUsers";
import { fetchVisitorLocationAnalytics } from "@/lib/visitorLocationAnalytics";

function accessDenied(
  access: Awaited<ReturnType<typeof getMetalPricesAccessFromRequest>>
) {
  if (!access.authenticated) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to view analytics." },
      { status: 401 }
    );
  }
  return NextResponse.json({ ok: false }, { status: 404 });
}

/** Admin-only: visits grouped by country / state / city. */
export async function GET(request: Request) {
  try {
    const access = await getMetalPricesAccessFromRequest(request);
    if (!access.authorized) {
      return accessDenied(access);
    }

    const { searchParams } = new URL(request.url);
    const daysParam = Number(searchParams.get("days") ?? 30);
    const days = Number.isFinite(daysParam)
      ? Math.min(90, Math.max(1, Math.floor(daysParam)))
      : 30;

    const analytics = await fetchVisitorLocationAnalytics(days);

    return NextResponse.json(
      { ok: true, ...analytics },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load visitor analytics";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
