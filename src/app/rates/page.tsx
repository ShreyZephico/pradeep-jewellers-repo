import type { Metadata } from "next";
import { Suspense } from "react";

import RatesAnalyticsPage from "@/components/rates-page/RatesAnalyticsPage";
import pageCopy from "@/data/ratesPageData.json";
import {
  buildRatesAnalyticsConfig,
  getRatesDisplayMeta,
  RATES_PAGE_DEFAULT_DAYS,
} from "@/lib/ratesDbConfig";
import { fetchRatesAnalyticsFromDb } from "@/utils/metalRatesAnalytics";

import "@/components/rates-page/css/rates-page.css";

export const metadata: Metadata = {
  title: `Gold & Silver Rate Chart | Pradeep Jewellers`,
  description: pageCopy.description,
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ days?: string }>;
};

export default async function RatesRoutePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const daysParam = Number(params.days ?? RATES_PAGE_DEFAULT_DAYS);
  const days = Number.isFinite(daysParam)
    ? Math.min(30, Math.max(2, Math.floor(daysParam)))
    : RATES_PAGE_DEFAULT_DAYS;

  const payload = await fetchRatesAnalyticsFromDb(
    buildRatesAnalyticsConfig(),
    days
  );

  const display = getRatesDisplayMeta();

  return (
    <Suspense fallback={<div className="rates-page rates-page--skeleton" />}>
      <RatesAnalyticsPage
        initialPayload={payload}
        trendColors={display.trendColors}
        defaultDays={days}
      />
    </Suspense>
  );
}
