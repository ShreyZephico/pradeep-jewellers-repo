"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import RatesAnalyticsChart from "@/components/rates-page/RatesAnalyticsChart";
import RatesComparisonTable from "@/components/rates-page/RatesComparisonTable";
import RatesStatCard from "@/components/rates-page/RatesStatCard";
import {
  RATES_PAGE_COPY,
  buildInsights,
  hasRatesAnalytics,
  type MetalFilter,
  type ViewFilter,
} from "@/components/rates-page/content";

import type { RatesAnalyticsApiResponse } from "@/types/goldRate";

import "./css/rates-page.css";

type Props = {
  initialPayload: RatesAnalyticsApiResponse;
  trendColors: { up: string; down: string; neutral: string };
  defaultDays: number;
};

function trendColor(
  status: "increased" | "decreased" | "same",
  colors: Props["trendColors"]
): string {
  if (status === "increased") return colors.up;
  if (status === "decreased") return colors.down;
  return colors.neutral;
}

export default function RatesAnalyticsPage({
  initialPayload,
  trendColors,
  defaultDays,
}: Props) {
  const copy = RATES_PAGE_COPY;
  const router = useRouter();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLElement>(null);

  const [payload, setPayload] = useState(initialPayload);
  const [loading, setLoading] = useState(false);
  const [visible] = useState(true);
  const loadedDaysRef = useRef(initialPayload.days ?? defaultDays);

  const days = Number(searchParams.get("days") ?? defaultDays) || defaultDays;
  const metal = (searchParams.get("metal") as MetalFilter) || "all";
  const view = (searchParams.get("view") as ViewFilter) || "overview";

  const showGold = metal === "all" || metal === "gold";
  const showSilver = metal === "all" || metal === "silver";
  const showTable = view === "overview" || view === "table";
  const showCharts = view === "overview" || view === "charts";

  const updateParams = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        params.set(key, value);
      }
      router.replace(`/rates?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (days === loadedDaysRef.current) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/gold-rate/analytics?days=${days}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: RatesAnalyticsApiResponse) => {
        if (!cancelled) {
          setPayload(data);
          loadedDaysRef.current = days;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayload({ success: false, error: copy.errorHint });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days, copy.errorHint]);

  const pageClass = `rates-page${visible ? " rates-page--visible" : ""}${
    loading ? " rates-page--loading" : ""
  }`;

  if (!hasRatesAnalytics(payload)) {
    return (
      <section ref={rootRef} className={pageClass}>
        <div className="rates-page__inner">
          <div className="rates-page__error">
            <h1>{copy.errorTitle}</h1>
            <p>{payload.error ?? copy.errorHint}</p>
            <Link href={copy.backHref} className="rates-page__cta">
              {copy.backLabel}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { series, table, updatedAt, location } = payload;
  const insights = buildInsights(
    series.gold24k,
    series.gold22k,
    series.silver1kg
  );

  const goldChartLines = [
    {
      key: "24K",
      color: "#d4af37",
      fill: "rgba(212, 175, 55, 0.22)",
      points: series.gold24k.points,
    },
    {
      key: "22K",
      color: "#c5a059",
      fill: "rgba(197, 160, 89, 0.22)",
      points: series.gold22k.points,
    },
    ...(series.gold14k
      ? [
          {
            key: "14K",
            color: "#e4b84a",
            fill: "rgba(228, 184, 74, 0.2)",
            points: series.gold14k.points,
          },
        ]
      : []),
    ...(series.gold9k
      ? [
          {
            key: "9K",
            color: "#f2d58f",
            fill: "rgba(242, 213, 143, 0.2)",
            points: series.gold9k.points,
          },
        ]
      : []),
  ];

  const silverChartLines = [
    {
      key: "Silver 1 kg",
      color: "#94a3b8",
      fill: "rgba(148, 163, 184, 0.28)",
      points: series.silver1kg.points,
    },
  ];

  const goldCardCount =
    2 + (series.gold14k ? 1 : 0) + (series.gold9k ? 1 : 0);

  return (
    <section ref={rootRef} className={pageClass}>
      <header className="rates-page__hero">
        <div className="rates-page__hero-inner">
          <nav className="rates-page__breadcrumb">
            <Link href={copy.backHref}>{copy.backLabel}</Link>
          </nav>
          <p className="rates-page__badge">{copy.badge}</p>
          <h1 className="rates-page__title">{copy.title}</h1>
          <p className="rates-page__description">{copy.description}</p>
          {location ? (
            <p className="rates-page__meta">
              <span className="rates-page__meta-pill">{location}</span>
              {updatedAt ? (
                <span>
                  {copy.updatedPrefix} {updatedAt}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </header>

      <div className="rates-page__inner">
        <div className="rates-page__filters" role="group" aria-label="Chart filters">
          <div className="rates-page__filter-group">
            <span className="rates-page__filter-label">
              {copy.filters.periodLabel}
            </span>
            <div className="rates-page__filter-pills">
              {copy.filters.daysOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`rates-page__pill${
                    days === opt.value ? " rates-page__pill--active" : ""
                  }`}
                  onClick={() => updateParams({ days: String(opt.value) })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rates-page__filter-group">
            <span className="rates-page__filter-label">
              {copy.filters.metalLabel}
            </span>
            <div className="rates-page__filter-pills">
              {copy.filters.metalOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`rates-page__pill${
                    metal === opt.value ? " rates-page__pill--active" : ""
                  }`}
                  onClick={() => updateParams({ metal: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rates-page__filter-group">
            <span className="rates-page__filter-label">
              {copy.filters.viewLabel}
            </span>
            <div className="rates-page__filter-pills">
              {copy.filters.viewOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`rates-page__pill${
                    view === opt.value ? " rates-page__pill--active" : ""
                  }`}
                  onClick={() => updateParams({ view: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="rates-page__loading" aria-live="polite">
            Updating rates…
          </p>
        ) : null}

        <section className="rates-page__summary" aria-labelledby="rates-summary-heading">
          <h2 id="rates-summary-heading" className="rates-page__section-heading">
            {copy.summaryTitle}
          </h2>
          <div className="rates-page__summary-grid">
            {showGold ? (
              <>
                <RatesStatCard
                  series={series.gold24k}
                  trendColor={trendColor(series.gold24k.stats.status, trendColors)}
                  accentClass="rates-stat-card--gold24"
                  index={0}
                />
                <RatesStatCard
                  series={series.gold22k}
                  trendColor={trendColor(series.gold22k.stats.status, trendColors)}
                  accentClass="rates-stat-card--gold22"
                  index={1}
                />
                {series.gold14k ? (
                  <RatesStatCard
                    series={series.gold14k}
                    trendColor={trendColor(series.gold14k.stats.status, trendColors)}
                    accentClass="rates-stat-card--gold14"
                    index={2}
                  />
                ) : null}
                {series.gold9k ? (
                  <RatesStatCard
                    series={series.gold9k}
                    trendColor={trendColor(series.gold9k.stats.status, trendColors)}
                    accentClass="rates-stat-card--gold9"
                    index={3}
                  />
                ) : null}
              </>
            ) : null}
            {showSilver ? (
              <RatesStatCard
                series={series.silver1kg}
                trendColor={trendColor(series.silver1kg.stats.status, trendColors)}
                accentClass="rates-stat-card--silver"
                index={showGold ? goldCardCount : 0}
              />
            ) : null}
          </div>
        </section>

        <div className="rates-page__main">
          <div className="rates-page__content">
            {showCharts && showGold ? (
              <section className="rates-page__panel">
                <h2 className="rates-page__section-heading">{copy.chartTitle}</h2>
                <p className="rates-page__section-lead">{copy.chartSubtitle}</p>
                <p className="rates-page__panel-tag">
                  Gold (24K, 22K{series.gold14k ? ", 14K" : ""}
                  {series.gold9k ? ", 9K" : ""})
                </p>
                <RatesAnalyticsChart
                  lines={goldChartLines}
                  animate={visible}
                />
              </section>
            ) : null}

            {showCharts && showSilver ? (
              <section className="rates-page__panel">
                <p className="rates-page__panel-tag">Silver</p>
                <RatesAnalyticsChart
                  lines={silverChartLines}
                  animate={visible}
                />
              </section>
            ) : null}

            {showTable ? (
              <section className="rates-page__panel">
                <h2 className="rates-page__section-heading">{copy.tableTitle}</h2>
                <p className="rates-page__section-lead">{copy.tableSubtitle}</p>
                <RatesComparisonTable
                  rows={table}
                  showGold={showGold}
                  showGold14={showGold && Boolean(series.gold14k)}
                  showGold9={showGold && Boolean(series.gold9k)}
                  showSilver={showSilver}
                />
              </section>
            ) : null}
          </div>

          <aside className="rates-page__analysis">
            <h2 className="rates-page__analysis-title">{copy.analysisTitle}</h2>
            <ul className="rates-page__insights">
              {insights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Link href={copy.cta.href} className="rates-page__cta">
              {copy.cta.text}
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
