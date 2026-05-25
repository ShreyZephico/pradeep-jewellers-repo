import contactData from "@/data/contactDatas.json";
import { buildRatesAnalyticsConfig } from "@/lib/ratesDbConfig";
import {
  fetchRatesAnalyticsFromDb,
  RATES_ANALYTICS_MAX_DAYS,
} from "@/utils/metalRatesAnalytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFRESH_MINUTES =
  contactData.heroSection.rates.refreshIntervalMinutes ?? 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const daysParam = Number(searchParams.get("days") ?? 7);
  const days = Number.isFinite(daysParam)
    ? Math.min(RATES_ANALYTICS_MAX_DAYS, Math.max(2, Math.floor(daysParam)))
    : 7;

  try {
    const payload = await fetchRatesAnalyticsFromDb(
      buildRatesAnalyticsConfig(),
      days
    );

    return Response.json(payload, {
      status: payload.success ? 200 : 404,
      headers: {
        "Cache-Control": payload.success
          ? `public, s-maxage=${REFRESH_MINUTES * 60}, stale-while-revalidate=60`
          : "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch rate analytics";

    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
