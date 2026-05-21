"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import data from "@/data/contactDatas.json";
import { useGoldRates } from "@/contexts/GoldRatesContext";
import { formatInr, formatPercentChange } from "@/lib/goldRates";
import type { MetalRateItem } from "@/types/goldRate";

import "./css/hero.css";

type TrendColors = {
  up: string;
  down: string;
  neutral: string;
};

function trendModifier(
  status: MetalRateItem["status"] | undefined
): "up" | "down" | "same" {
  if (status === "increased") return "up";
  if (status === "decreased") return "down";
  return "same";
}

function comparePeriodLabel(compareDays: number): string {
  if (compareDays === 1) return "yesterday";
  return `${compareDays}d ago`;
}

function PercentBadge({
  percentChange,
  status,
  loading,
}: {
  percentChange: number;
  status: MetalRateItem["status"];
  loading: boolean;
}) {
  if (loading) {
    return <span className="hero-section__skeleton hero-section__skeleton--badge" />;
  }

  const mod = trendModifier(status);
  const icon = mod === "up" ? "↑" : mod === "down" ? "↓" : "→";

  return (
    <span
      className={`hero-section__rate-badge hero-section__rate-badge--${mod}`}
      aria-label={`Price change ${formatPercentChange(percentChange)}`}
    >
      <span className="hero-section__rate-badge-icon" aria-hidden>
        {icon}
      </span>
      {formatPercentChange(percentChange)}
    </span>
  );
}

function RateMetalCard({
  label,
  rate,
  loading,
  unitSuffix,
  fractionDigits = 2,
  compareDays,
}: {
  label: string;
  rate?: MetalRateItem;
  loading: boolean;
  unitSuffix: string;
  fractionDigits?: number;
  compareDays: number;
}) {
  const mod = trendModifier(rate?.status);

  return (
    <div className="hero-section__rate-card">
      <div className="hero-section__rate-head">
        <p className="hero-section__rate-label">{label}</p>
        <PercentBadge
          percentChange={rate?.percentChange ?? 0}
          status={rate?.status ?? "same"}
          loading={loading}
        />
      </div>
      {loading || !rate ? (
        <div>
          <span className="hero-section__skeleton hero-section__skeleton--price" />
          <span className="hero-section__skeleton hero-section__skeleton--line" />
        </div>
      ) : (
        <div className="hero-section__rate-body">
          <h3 className="hero-section__rate-price">
            {formatInr(rate.current, fractionDigits)}
            {unitSuffix ? (
              <span className="hero-section__rate-unit"> {unitSuffix}</span>
            ) : null}
          </h3>
          <p className="hero-section__rate-was">
            Was{" "}
            <span className="hero-section__rate-was-value">
              {formatInr(rate.old, fractionDigits)}
            </span>
            <span
              className={`hero-section__rate-change hero-section__rate-change--${mod}`}
              title={`Current ${rate.currentAt.label} · Previous ${rate.oldAt.label}`}
            >
              ({formatPercentChange(rate.percentChange)} vs{" "}
              {comparePeriodLabel(compareDays)})
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function LiveRatesPanel({
  ratesConfig,
  loading,
  updatedLabel,
}: {
  ratesConfig: (typeof data.heroSection)["rates"];
  loading: boolean;
  updatedLabel: string;
}) {
  return (
    <div className="hero-section__panel">
      <p className="hero-section__panel-label">{ratesConfig.location}</p>
      <h4 className="hero-section__panel-title">
        {loading ? (
          <span className="hero-section__skeleton hero-section__skeleton--title" />
        ) : (
          updatedLabel
        )}
      </h4>
      <p className="hero-section__panel-hint">
        Rates for {ratesConfig.city} · live from database
      </p>
      <Link href={ratesConfig.chartLink} className="hero-section__panel-link">
        Full rate chart →
      </Link>
    </div>
  );
}

export default function HeroSection() {
  const heroData = data.heroSection;
  const ratesConfig = heroData.rates;
  const images = heroData.heroImages;
  const trendConfig = ratesConfig.trendColors;

  const { payload, loading } = useGoldRates();
  const live = payload?.data;

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const updatedLabel = (() => {
    if (payload?.updatedAt?.trim()) return payload.updatedAt.trim();
    if (payload?.fetchedAt) {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(payload.fetchedAt));
    }
    return `Today, ${ratesConfig.city}`;
  })();

  const compareDays = payload?.compareDays ?? ratesConfig.compareDays ?? 1;

  const trendStyle = useMemo(() => {
    const style: Record<string, string> = {};
    if (trendConfig?.up) style["--hero-trend-up"] = trendConfig.up;
    if (trendConfig?.down) style["--hero-trend-down"] = trendConfig.down;
    if (trendConfig?.neutral) style["--hero-trend-neutral"] = trendConfig.neutral;
    return style as CSSProperties;
  }, [trendConfig]);

  return (
    <section className="hero-section" style={trendStyle}>
      <div className="hero-section__slider">
        {images.map((img, index) => (
          <div
            key={index}
            aria-hidden={index !== currentImage}
            className={[
              "hero-section__slide",
              currentImage === index ? "hero-section__slide--active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Image
              src={img}
              alt={`Hero ${index + 1}`}
              fill
              priority={index === 0}
              fetchPriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="100vw"
              className="hero-section__slide-image"
            />
            <div className="hero-section__overlay" aria-hidden />
          </div>
        ))}

        <button
          type="button"
          suppressHydrationWarning
          onClick={() =>
            setCurrentImage((prev) =>
              prev === 0 ? images.length - 1 : prev - 1
            )
          }
          className="hero-section__nav hero-section__nav--prev"
          aria-label="Previous slide"
        >
          ‹
        </button>

        <button
          type="button"
          suppressHydrationWarning
          onClick={() =>
            setCurrentImage((prev) => (prev + 1) % images.length)
          }
          className="hero-section__nav hero-section__nav--next"
          aria-label="Next slide"
        >
          ›
        </button>
      </div>

      <div className="hero-section__rates-wrap">
        <div className="hero-section__rates-grid">
          <RateMetalCard
            label={ratesConfig.gold22k.label}
            rate={live?.gold22k}
            loading={loading}
            unitSuffix={ratesConfig.gold22k.unitSuffix}
            fractionDigits={ratesConfig.gold22k.fractionDigits}
            compareDays={compareDays}
          />
          <RateMetalCard
            label={ratesConfig.silver1kg.label}
            rate={live?.silver1kg}
            loading={loading}
            unitSuffix={ratesConfig.silver1kg.unitSuffix}
            fractionDigits={ratesConfig.silver1kg.fractionDigits}
            compareDays={compareDays}
          />

          <LiveRatesPanel
            ratesConfig={ratesConfig}
            loading={loading}
            updatedLabel={updatedLabel}
          />
        </div>
      </div>
    </section>
  );
}
