import pageCopy from "@/data/ratesPageData.json";

import type {
  MetalHistorySeries,
  RatesAnalyticsApiResponse,
} from "@/types/goldRate";

export const RATES_PAGE_COPY = pageCopy;

export type MetalFilter = "all" | "gold" | "silver";
export type ViewFilter = "overview" | "table" | "charts";

export function hasRatesAnalytics(
  payload: RatesAnalyticsApiResponse
): payload is RatesAnalyticsApiResponse & {
  success: true;
  series: NonNullable<RatesAnalyticsApiResponse["series"]>;
  table: NonNullable<RatesAnalyticsApiResponse["table"]>;
} {
  return Boolean(payload.success && payload.series && payload.table);
}

export function buildInsights(
  gold24k: MetalHistorySeries,
  gold22k: MetalHistorySeries,
  silver1kg: MetalHistorySeries
): string[] {
  const copy = RATES_PAGE_COPY.insights;
  const lines: string[] = [];

  const pushStatus = (
    status: MetalHistorySeries["stats"]["status"],
    up: string,
    down: string,
    flat: string
  ) => {
    if (status === "increased") lines.push(up);
    else if (status === "decreased") lines.push(down);
    else lines.push(flat);
  };

  pushStatus(
    gold24k.stats.status,
    copy.gold24Up,
    copy.gold24Down,
    copy.gold24Flat
  );
  pushStatus(
    gold22k.stats.status,
    copy.gold22Up,
    copy.gold22Down,
    copy.gold22Flat
  );
  pushStatus(
    silver1kg.stats.status,
    copy.silverUp,
    copy.silverDown,
    copy.silverFlat
  );

  lines.push(copy.spread);

  const maxSwing = Math.max(
    pctRange(gold24k),
    pctRange(gold22k),
    pctRange(silver1kg)
  );

  if (maxSwing > 2.5) lines.push(copy.volatile);
  else lines.push(copy.stable);

  return lines;
}

function pctRange(series: MetalHistorySeries): number {
  if (series.stats.high <= 0) return 0;
  return ((series.stats.high - series.stats.low) / series.stats.high) * 100;
}
