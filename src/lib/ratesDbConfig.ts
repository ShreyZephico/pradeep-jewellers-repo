import contactData from "@/data/contactDatas.json";

import type { FetchMetalRatesConfig } from "@/utils/metalRatesFromDb";
import type { RatesAnalyticsDbConfig } from "@/utils/metalRatesAnalytics";

const ratesConfig = contactData.heroSection.rates;

export const RATES_PAGE_DEFAULT_DAYS = 7;

export function buildRatesDbConfig(
  compareDays = ratesConfig.compareDays ?? 1
): FetchMetalRatesConfig {
  return {
    gold22k: {
      metal: ratesConfig.gold22k.db.metal,
      purityLabel: ratesConfig.gold22k.db.purityLabel,
      location: ratesConfig.gold22k.db.location,
      unit: ratesConfig.gold22k.db.unit,
      weight: ratesConfig.gold22k.db.weight,
      priceMultiplier: ratesConfig.gold22k.db.priceMultiplier,
    },
    silver1kg: {
      metal: ratesConfig.silver1kg.db.metal,
      purityLabel: ratesConfig.silver1kg.db.purityLabel,
      location: ratesConfig.silver1kg.db.location,
      unit: ratesConfig.silver1kg.db.unit,
      weight: ratesConfig.silver1kg.db.weight,
      priceMultiplier: ratesConfig.silver1kg.db.priceMultiplier,
    },
    compareDays,
  };
}

export function buildRatesAnalyticsConfig(): RatesAnalyticsDbConfig {
  const gold24k = ratesConfig.gold24k ?? ratesConfig.gold22k;

  return {
    city: ratesConfig.city,
    location: ratesConfig.location,
    labels: {
      gold24k: gold24k.label,
      gold22k: ratesConfig.gold22k.label,
      silver1kg: ratesConfig.silver1kg.label,
    },
    gold24k: {
      metal: gold24k.db.metal,
      purityLabel: gold24k.db.purityLabel,
      location: gold24k.db.location,
      unit: gold24k.db.unit,
      weight: gold24k.db.weight,
      priceMultiplier: gold24k.db.priceMultiplier,
    },
    gold22k: {
      metal: ratesConfig.gold22k.db.metal,
      purityLabel: ratesConfig.gold22k.db.purityLabel,
      location: ratesConfig.gold22k.db.location,
      unit: ratesConfig.gold22k.db.unit,
      weight: ratesConfig.gold22k.db.weight,
      priceMultiplier: ratesConfig.gold22k.db.priceMultiplier,
    },
    silver1kg: {
      metal: ratesConfig.silver1kg.db.metal,
      purityLabel: ratesConfig.silver1kg.db.purityLabel,
      location: ratesConfig.silver1kg.db.location,
      unit: ratesConfig.silver1kg.db.unit,
      weight: ratesConfig.silver1kg.db.weight,
      priceMultiplier: ratesConfig.silver1kg.db.priceMultiplier,
    },
  };
}

export function getRatesDisplayMeta() {
  const gold24k = ratesConfig.gold24k ?? ratesConfig.gold22k;
  return {
    gold24k: {
      label: gold24k.label,
      unitSuffix: gold24k.unitSuffix,
      fractionDigits: gold24k.fractionDigits ?? 2,
    },
    gold22k: {
      label: ratesConfig.gold22k.label,
      unitSuffix: ratesConfig.gold22k.unitSuffix,
      fractionDigits: ratesConfig.gold22k.fractionDigits ?? 2,
    },
    silver1kg: {
      label: ratesConfig.silver1kg.label,
      unitSuffix: ratesConfig.silver1kg.unitSuffix,
      fractionDigits: ratesConfig.silver1kg.fractionDigits ?? 2,
    },
    trendColors: ratesConfig.trendColors,
    location: ratesConfig.location,
    city: ratesConfig.city,
  };
}
