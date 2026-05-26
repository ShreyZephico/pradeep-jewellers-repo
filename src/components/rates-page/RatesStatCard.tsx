"use client";

import type { CSSProperties } from "react";

import {
  formatDifference,
  formatInr,
  formatPercentChange,
} from "@/lib/goldRates";

import { RATES_PAGE_COPY } from "@/components/rates-page/content";

import type { MetalHistorySeries } from "@/types/goldRate";

type Props = {
  series: MetalHistorySeries;
  trendColor: string;
  accentClass: string;
  index: number;
};

export default function RatesStatCard({
  series,
  trendColor,
  accentClass,
  index,
}: Props) {
  const copy = RATES_PAGE_COPY.stats;
  const { stats } = series;

  return (
    <article
      className={`rates-stat-card ${accentClass}`}
      style={{ "--card-index": index } as CSSProperties}
    >
      <p className="rates-stat-card__label">{series.label}</p>
      <p className="rates-stat-card__price">
        {formatInr(stats.current, series.fractionDigits)}
        {series.unitSuffix ? (
          <span className="rates-stat-card__unit">{series.unitSuffix}</span>
        ) : null}
      </p>
      <p className="rates-stat-card__change" style={{ color: trendColor }}>
        {formatDifference(stats.changePeriod)}{" "}
        <span>({formatPercentChange(stats.changePeriodPercent)})</span>
      </p>
      <dl className="rates-stat-card__grid">
        <div>
          <dt>{copy.high}</dt>
          <dd>{formatInr(stats.high, series.fractionDigits)}</dd>
        </div>
        <div>
          <dt>{copy.low}</dt>
          <dd>{formatInr(stats.low, series.fractionDigits)}</dd>
        </div>
        <div>
          <dt>{copy.average}</dt>
          <dd>{formatInr(stats.average, series.fractionDigits)}</dd>
        </div>
      </dl>
    </article>
  );
}
