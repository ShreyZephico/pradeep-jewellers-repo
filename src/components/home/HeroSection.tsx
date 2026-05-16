"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import data from "@/data/contactDatas.json";
import { useGoldRates } from "@/contexts/GoldRatesContext";
import { formatDifference, formatInr } from "@/lib/goldRates";
import type { MetalRateItem } from "@/types/goldRate";

function RateMetalCard({
  label,
  rate,
  loading,
  fractionDigits = 0,
}: {
  label: string;
  rate?: MetalRateItem;
  loading: boolean;
  fractionDigits?: number;
}) {
  const increased = rate?.increased ?? false;
  const same = rate?.status === "same";

  const badgeClass = same
    ? "bg-gray-100 text-gray-600"
    : increased
      ? "bg-green-100 text-green-600"
      : "bg-red-100 text-red-600";

  const arrow = same ? "→" : increased ? "↗" : "↘";

  return (
    <div className="border-r border-gray-200 p-6 md:p-8">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs tracking-[4px] text-gray-500 uppercase">{label}</p>
        {loading || !rate ? (
          <span className="h-7 w-16 animate-pulse rounded bg-gray-200" />
        ) : (
          <span
            className={`shrink-0 rounded px-2.5 py-1 text-xs font-semibold tabular-nums md:text-sm ${badgeClass}`}
          >
            {arrow} {formatDifference(rate.difference)}
          </span>
        )}
      </div>
      {loading || !rate ? (
        <div className="space-y-2">
          <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
        </div>
      ) : (
        <>
          <h3 className="font-serif text-3xl text-gray-900 md:text-4xl">
            {formatInr(rate.current, fractionDigits)}
            <span className="text-base text-gray-500 md:text-lg"> / gram</span>
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Was{" "}
            <span className="tabular-nums text-gray-600 line-through">
              {formatInr(rate.old, fractionDigits)}
            </span>
          </p>
        </>
      )}
    </div>
  );
}

export default function HeroSection() {
  const heroData = data.heroSection;
  const ratesConfig = heroData.rates;
  const images = heroData.heroImages;

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

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[85vh] w-full">
        {images.map((img, index) => (
          <div
            key={index}
            aria-hidden={index !== currentImage}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentImage === index
                ? "opacity-100 z-10"
                : "opacity-0 z-0"
            }`}
          >
            <Image
              src={img}
              alt={`Hero ${index + 1}`}
              fill
              priority={index === 0}
              fetchPriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
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
          className="absolute left-6 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/10 text-3xl text-white backdrop-blur-md transition hover:bg-white/20"
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
          className="absolute right-6 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/10 text-3xl text-white backdrop-blur-md transition hover:bg-white/20"
          aria-label="Next slide"
        >
          ›
        </button>
      </div>

      <div className="relative z-40 -mt-20 px-4">
        <div className="mx-auto grid max-w-7xl grid-cols-1 overflow-hidden rounded-xl bg-white shadow-2xl md:grid-cols-4">
          <RateMetalCard
            label={ratesConfig.gold22k.label}
            rate={live?.gold22k}
            loading={loading}
          />
          <RateMetalCard
            label={ratesConfig.gold24k.label}
            rate={live?.gold24k}
            loading={loading}
          />
          <RateMetalCard
            label={ratesConfig.silver.label}
            rate={live?.silver}
            loading={loading}
          />

          <div className="bg-[#1F1A17] p-6 text-white md:p-8">
            <p className="mb-4 text-xs tracking-[4px] text-gray-400 uppercase md:mb-6">
              {ratesConfig.location}
            </p>
            <h4 className="mb-4 text-xl font-medium leading-snug md:mb-6 md:text-2xl">
              {loading ? (
                <span className="inline-block h-8 w-48 animate-pulse rounded bg-white/10" />
              ) : (
                updatedLabel
              )}
            </h4>
            <p className="mb-4 text-xs text-gray-500">
              Rates for {ratesConfig.city}
            </p>
            <Link
              href={ratesConfig.chartLink}
              className="inline-flex items-center gap-2 text-amber-400 transition hover:text-amber-300"
            >
              Full rate chart →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
