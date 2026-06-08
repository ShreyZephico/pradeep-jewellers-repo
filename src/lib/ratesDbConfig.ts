import contactData from "@/data/contactDatas.json";

import type { FetchMetalRatesConfig } from "@/utils/metalRatesFromDb";
import type { RatesAnalyticsDbConfig } from "@/utils/metalRatesAnalytics";

const ratesConfig = contactData.heroSection.rates;

export const RATES_PAGE_DEFAULT_DAYS = 7;

function metalQuery(
  db: { metal: string; purityLabel: string; unit: string; priceMultiplier?: number }
) {
  return {
    metal: db.metal,
    purityLabel: db.purityLabel,
    unit: db.unit,
    priceMultiplier: db.priceMultiplier,
  };
}

export function buildRatesDbConfig(
  compareDays = ratesConfig.compareDays ?? 1
): FetchMetalRatesConfig {
  return {
    gold22k: metalQuery(ratesConfig.gold22k.db),
    gold14k: metalQuery(ratesConfig.gold14k.db),
    gold18k: metalQuery(ratesConfig.gold18k.db),
    gold9k: metalQuery(ratesConfig.gold9k.db),
    silver1kg: metalQuery(ratesConfig.silver1kg.db),
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
      gold14k: ratesConfig.gold14k.label,
      gold18k: ratesConfig.gold18k.label,
      gold9k: ratesConfig.gold9k.label,
      silver1kg: ratesConfig.silver1kg.label,
    },
    gold24k: metalQuery(gold24k.db),
    gold22k: metalQuery(ratesConfig.gold22k.db),
    gold14k: metalQuery(ratesConfig.gold14k.db),
    gold18k: metalQuery(ratesConfig.gold18k.db),
    gold9k: metalQuery(ratesConfig.gold9k.db),
    silver1kg: metalQuery(ratesConfig.silver1kg.db),
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
    gold14k: {
      label: ratesConfig.gold14k.label,
      unitSuffix: ratesConfig.gold14k.unitSuffix,
      fractionDigits: ratesConfig.gold14k.fractionDigits ?? 2,
    },
    gold18k: {
      label: ratesConfig.gold18k.label,
      unitSuffix: ratesConfig.gold18k.unitSuffix,
      fractionDigits: ratesConfig.gold18k.fractionDigits ?? 2,
    },
    gold9k: {
      label: ratesConfig.gold9k.label,
      unitSuffix: ratesConfig.gold9k.unitSuffix,
      fractionDigits: ratesConfig.gold9k.fractionDigits ?? 2,
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
